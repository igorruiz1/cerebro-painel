# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada. A regra que resolve é sempre a mesma linha numa lista `permissions.allow`
— o que muda é **em qual arquivo** ela precisa estar, e isso depende de onde a
sessão abre. Errar o arquivo é o que faz a permissão "não pegar".

Na sessão de 18/09/2026 esta página estava errada sobre a nuvem e custou várias
sessões de autorização manual. O que segue foi medido no container, não deduzido.

## Duas regras que explicam todos os furos

**1. A permissão é lida uma vez, quando o processo sobe.** Escrever o arquivo
depois não tem efeito nenhum na sessão corrente — nem o certo, nem o errado. Foi
medido: `~/.claude/settings.json` gravado no meio da sessão não mudou nada.

**2. A sessão de nuvem não lê os arquivos da sua máquina.** A
[documentação](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions)
é literal: `~/.claude/settings.json` e `.claude/settings.local.json` são
**"not read"**. Isso inclui o que o botão *sempre permitir* do prompt grava — ele
escreve em `.claude/settings.local.json`, que nesta superfície não é lido e ainda
por cima está no `.gitignore`. Clicar nele na nuvem não guarda nada.

## O mapa

| Onde a sessão abre | Arquivo que vale | Como instalar |
| --- | --- | --- |
| Local, dentro deste clone | `.claude/settings.json` (versionado) | já resolvido |
| Local, em qualquer outra pasta | `~/.claude/settings.json` | `scripts/permissoes-usuario.mjs` |
| **Nuvem** (claude.ai/code, app, `--cloud`) | `/etc/claude-code/managed-settings.json`, escrito **antes do boot** | `scripts/setup-nuvem.sh` no campo *Setup script* do ambiente |
| Nuvem, socorro imediato | nenhum arquivo | dropdown de modo da sessão |
| Cowork, chat do claude.ai | nenhum — a superfície gerencia sozinha | fora de alcance |

## Nuvem: por que o `.claude/settings.json` do repo não bastou

O arquivo é lido em sessão de nuvem, e a regra dentro dele está certa. O que
falha é o **relógio**. O ambiente de nuvem guarda um snapshot do sistema de
arquivos e restaura esse snapshot a cada sessão; o `git fetch` que atualiza o
clone roda **depois** que o Claude Code já subiu e já leu as permissões.

Medido em 18/09/2026, pelo reflog do próprio container:

```
13:53:32  HEAD em a0f9f29   <- estado do snapshot, ANTES da allowlist existir
          (Claude Code sobe e lê as permissões daqui)
14:35:19  checkout 9728989  <- allowlist chega, tarde demais
```

A allowlist entrou no repositório em `39a6f55`, que é posterior a `a0f9f29`. Ou
seja: o arquivo existia no GitHub e não existia no disco na hora que importava.

## Nuvem: a solução

O setup script é o único gancho que roda **antes do Claude Code lançar**, e o que
ele escreve em disco entra no snapshot do ambiente. Instalação, uma vez:

1. claude.ai/code → ícone do ambiente → campo **Setup script**
2. Cole o conteúdo de [`scripts/setup-nuvem.sh`](../scripts/setup-nuvem.sh)
3. Salve. Trocar o setup script invalida o cache, então a sessão seguinte já sobe curada.

O script escreve a allowlist em dois lugares — `/etc/claude-code/managed-settings.json`
(precedência mais alta que existe) e `~/.claude/settings.json` do container — porque
a documentação não crava qual das duas a superfície hospedada aceita. Custa dois
arquivos e cobre as duas hipóteses.

Ele lê a lista do `.claude/settings.json` do clone quando encontra, e só cai para
a cópia embutida quando não encontra. Assim a fonte da verdade continua sendo a
allowlist versionada, e não há duas listas para manter em sincronia no caso normal.

**Como conferir se pegou**, na sessão seguinte:

```bash
cat /etc/claude-code/.origem-cerebro    # quando rodou, de onde veio, quantas regras
```

Sem esse arquivo, o setup script não rodou — confira se foi salvo no ambiente certo.

## Nuvem: socorro imediato, sem esperar o ambiente

O modo de permissão da sessão é ajustável **com a sessão rodando**, pelo dropdown
de modo. É o único botão que muda o comportamento sem reiniciar nada. Vale para
todas as ferramentas, não só Supabase — é mais amplo do que a allowlist, e por
isso é socorro, não solução.

## O que fica de fora, de propósito

`get_publishable_keys` (devolve chave), `create_project`, `pause_project`,
`restore_project`, `deploy_edge_function` e o ciclo de branches
(`create` / `merge` / `reset` / `delete`). Caro ou irreversível continua pedindo
confirmação — é a última barreira antes de um estrago silencioso.

## Sessões locais fora deste repo

As configurações de usuário valem em qualquer diretório da **sua máquina** — e
só dela. Rode uma vez, a partir de um clone deste repositório:

```bash
node scripts/permissoes-usuario.mjs --conferir   # mostra o que faria
node scripts/permissoes-usuario.mjs              # aplica
```

Ele funde as regras `mcp__Supabase__*` da allowlist deste repo no seu
`~/.claude/settings.json`, preservando tudo o que já estiver lá (tema, `deny`,
hooks). Faz backup carimbado antes de escrever, é idempotente, e aborta sem
tocar em nada se o JSON de destino estiver corrompido. `--todas` leva também as
regras `Bash(git ...)`.

**Vale a partir da próxima sessão**, pela regra 1 lá de cima.

## Sintaxe, para quando você editar à mão

- `"mcp__Supabase__execute_sql"` — nome puro da ferramenta, sem parênteses:
  cobre qualquer chamada dela, com qualquer query.
- `"Bash(git status:*)"` — prefixo: casa `git status` e o que vier depois.
- Uma regra literal longa demais casa com uma invocação só e não serve para
  nada. Foi o caso da regra de commit que saiu na limpeza de setembro/2026.
