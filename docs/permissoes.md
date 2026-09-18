# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada. Levou quatro PRs e várias sessões porque a causa foi diagnosticada
errada três vezes. Esta página guarda o que foi **medido**, e diz de cada rota o
que é certeza e o que é aposta.

## A hierarquia, do que mais resolve para o que menos

| # | Rota | Cobre | Custo | Certeza |
| --- | --- | --- | --- | --- |
| 1 | **Modo de permissão da sessão** | todo prompt, MCP inclusive | 1 clique | documentada, **não isolada** ainda |
| 2 | Allowlist em `.claude/settings.json` | só as 14 regras Supabase | já feito | funciona **quando lida a tempo** |
| 3 | `scripts/setup-nuvem.sh` no Setup script | idem, antes do boot | 1 config | **aposta**, ver ressalva |
| 4 | Server-managed settings | tudo, na organização | só Team/Enterprise | documentada, indisponível aqui |

A rota 1 é a que a documentação indica, e é 1 clique — mas a medição de
18/09/2026 **não conseguiu isolá-la** (ver abaixo). As outras reduzem prompt;
nenhuma delas elimina.

## Rota 1: o modo de permissão

É o único controle que muda o comportamento **com a sessão rodando**, pelo
dropdown de modo.

### O que a nuvem oferece de verdade: três modos, não cinco

Conferido no dropdown em 18/09/2026. A lista de cinco modos abaixo é do **CLI
local**; a sessão de nuvem mostra só três, com estes nomes:

| No dropdown da nuvem | Descrição que aparece | Equivale a |
| --- | --- | --- |
| **Automático** | *Claude gerencia decisões de permissão* | `auto` |
| **Aceitar edições** | *Aceitar todas as edições automaticamente* | `acceptEdits` |
| **Plano** | *Criar um plano antes de fazer alterações* | `plan` |

`dontAsk` e `bypassPermissions` **não são oferecidos** na nuvem. E `default`
(Manual) não está no menu, embora exista como estado: a API de sessão reportou
`permission_mode: "default"` para uma sessão cujo dropdown mostrava "Aceitar
edições". Os dois não batem, e qual dos dois manda ainda não foi medido — não
conte com nenhum deles para desenhar teste.

Os cinco modos do CLI local, para referência:

| Modo | Roda sem perguntar |
| --- | --- |
| `default` (Manual) | só leitura |
| `acceptEdits` | leitura, edição de arquivo, comandos comuns de fs |
| `auto` | tudo, com verificação de segurança em segundo plano |
| `dontAsk` | leitura e ferramentas pré-aprovadas; o resto é **negado**, não perguntado |
| `bypassPermissions` | tudo |

Em `auto` as ferramentas MCP vão para um classificador em vez de virem para
você — *"Everything else goes to the classifier"*. É o modo desenhado para
exatamente esta dor, e a documentação o indica para *"long tasks, reducing
prompt fatigue"*.

### Medido em 18/09/2026: zero prompts — e nenhuma das rotas explica

Esta seção já esteve escrita como *"o modo `auto` resolve"*. Estava errada na
causa e foi corrigida no mesmo dia. Fica o registro do erro, porque ele é o
quarto diagnóstico furado desta mesma investigação.

**O fato, esse se sustenta.** Sessão de nuvem, um repositório. Nenhum pedido de
autorização em nenhuma chamada: `list_organizations`, `execute_sql` (`select 1`),
`list_edge_functions`, e `Bash` fora da allowlist (`ls`, `cat`, `git branch`,
`git reflog`).

**A causa não é a rota 2.** `list_edge_functions` não está na allowlist, e o
reflog mostra o snapshot subindo em `a0f9f29` às 13:53:32 — anterior à
allowlist — com o clone só chegando em `ff94946` às 15:38:51.

**E também não é a rota 1.** A sessão foi descrita como estando em `auto` e não
estava: `get_session` reportou `permission_mode: "default"`, e o dropdown
mostrava "Aceitar edições". Nenhum dos dois é `auto`. Em `default`, pela tabela
acima, `ls` e `execute_sql` **deveriam** ter pedido autorização. Não pediram.

Sobra a conclusão honesta: **nesta sessão o prompt não apareceu, e nenhuma das
quatro rotas explica por quê.** Hipóteses ainda não medidas — o cliente
(desktop app) aprovando por fora; o container subindo com permissão relaxada
independentemente do dropdown; o modo real divergindo do exibido, que é a mesma
divergência da seção anterior.

**A consequência prática, essa é imediata:** a ausência de prompt nesta sessão
**não serve de controle** para medir nenhuma outra rota. Qualquer teste que
conclua "não pediu autorização, logo funcionou" está furado enquanto isso não
for resolvido. O teste da rota 3 tem que se apoiar no marcador em disco, não na
ausência de prompt.

**Por que não deixar isso cravado no repo:** a documentação é explícita de que
`permissions.defaultMode` com valor `"auto"` **não tem efeito** em
`.claude/settings.json` — *"the value doesn't take effect"* — e o mesmo vale para
`"bypassPermissions"`. Sobraria `"dontAsk"`, que funciona, mas **nega** em vez de
perguntar tudo o que não estiver na allowlist: `Bash`, `Write`, `Edit` e
`WebFetch` parariam de funcionar sem aviso claro. Foi avaliado e recusado. O modo
fica no dropdown, que é decisão de quem está na sessão.

## Rota 2: a allowlist versionada, e por que ela falhou uma vez

O arquivo `.claude/settings.json` **é** lido em sessão de nuvem, e a regra dentro
dele está certa. O que falhou em 18/09/2026 foi o relógio. Reflog do container:

```
13:53:32  snapshot do ambiente com o repo em a0f9f29 (antes da allowlist existir)
          Claude Code sobe e lê as permissões desse estado
14:35:19  checkout 9728989; a allowlist chega, tarde demais
```

O ambiente restaura um snapshot do sistema de arquivos e o `git fetch` que
atualiza o clone roda **depois** do boot. A documentação explica de onde vem esse
snapshot velho: é o **cache do ambiente**, um snapshot de filesystem que a
Anthropic tira depois do primeiro setup e reusa nas sessões seguintes, com
validade de **cerca de sete dias**. Ele só é refeito quando o setup script ou os
hosts de rede do ambiente mudam, ou quando expira. A allowlist entrou em `39a6f55`,
posterior a `a0f9f29`: estava no GitHub e não estava no disco na hora que
importava. Tende a não repetir depois que o cache do ambiente reconstrói, mas
não há garantia — por isso ela é rota 2, não rota 1.

**A segunda condição, esta permanente:** a rota 2 vale para sessão de **um**
repositório. Com mais de um, a sessão começa *acima* dos clones e de cada
`.claude/settings.json` carrega só os plugins e marketplaces declarados —
*"not permission rules, hooks, `env`, or other keys"*. Nenhum acerto de timing
resolve isso; ali só a rota 1 funciona.

## Rota 3: o setup script, com a ressalva na cara

`scripts/setup-nuvem.sh`, colado no campo **Setup script** do ambiente. É o único
gancho que roda **antes do Claude Code lançar**, e o que ele escreve em disco
entra no snapshot do ambiente.

### Onde fica o campo, exatamente

Conferido na documentação em 18/09/2026, porque o caminho não é óbvio:

1. Em claude.ai/code, o seletor de ambiente é o **ícone de nuvem com o nome do
   ambiente, na linha logo acima da caixa de mensagem** — não no topo da página.
   A doc é explícita: *"There's no settings page or direct URL for the selector."*
2. Clique nele. No menu, **passe o mouse sobre o ambiente** e clique no **ícone de
   engrenagem que aparece à direita**.
3. Abre o diálogo **Update cloud environment**, com nome, nível de rede, variáveis
   de ambiente e **Setup script**. Cole e salve.

**Salvar já força o rebuild.** Não existe botão de recriar ambiente, e não é
preciso: *"The setup script runs again to rebuild the cache when you change the
environment's setup script or allowed network hosts, and when the cache reaches
its expiry after roughly seven days."* Mas *"Resuming an existing session never
re-runs the setup script"* — tem que ser **sessão nova**, não a que já estava
aberta.

**Duas regras de escrita do script**, ou a sessão nem sobe: precisa **sair com
zero** (*"if the script exits non-zero, the session fails to start"*) e terminar
em ~5 minutos. O `setup-nuvem.sh` cumpre: `set -uo pipefail` sem `-e`, `|| true`
em cada escrita, `exit 0` no fim.

### A ressalva, que a doc de 18/09/2026 piorou

Ele escreve `/etc/claude-code/managed-settings.json`. A frase que existia antes
era ambígua quanto ao container. A redação atual é mais dura:

> Managed settings: only **server-managed settings** reach a cloud session; a
> `managed-settings.json` file or MDM profile on your device doesn't. **A
> self-hosted environment also reads the managed settings file in its runner
> image.**

Esse *"also"* é o problema: ele separa o self-hosted, que **lê** o arquivo da
imagem, do ambiente hospedado pela Anthropic, que é o nosso. Não é uma negação
literal do arquivo do container, mas a leitura natural é contra. **O alvo 1 da
rota 3 está mais para morto do que para aposta.**

Sobra o alvo 2, as configurações de usuário **do container** — que a doc não
contradiz, porque quando ela diz que `~/.claude/settings.json` não é lido está
falando do arquivo na *sua máquina*, que obviamente não chega lá. Por isso o
script escreve nos dois e deixa um marcador em vez de pedir fé:

```bash
cat /etc/claude-code/.origem-cerebro    # quando rodou, de onde veio, quantas regras
```

Sem esse arquivo, o script não rodou — o que costuma ser o ambiente
reaproveitando um snapshot antigo, não a rota estando errada. Recrie o ambiente e
meça de novo.

**Como NÃO medir esta rota:** pela ausência de prompt. A sessão de 18/09/2026 não
pediu autorização para nada, em modo nenhum, sem que qualquer rota explicasse
(ver rota 1). Enquanto isso não for resolvido, "não pediu, logo funcionou" não
prova nada. O que a rota 3 pode provar sozinha é mais modesto e ainda útil: **o
setup script roda, e o que ele escreve sobrevive ao snapshot.** Isso o marcador
responde. Se o marcador aparecer com a contagem de regras nos dois alvos, a rota
3 deixa de ser aposta quanto à *entrega*; se ela de fato suprime prompt fica em
aberto até haver uma sessão que peça autorização para servir de controle.

## Rota 4: server-managed settings

O caminho oficial para política em sessão de nuvem:

> only **server-managed settings** reach a cloud session; a
> `managed-settings.json` file or MDM profile on your device doesn't.

(Redação de 18/09/2026. A anterior dizia *"Endpoint-managed settings don't reach
cloud sessions in Anthropic-hosted environments"* — mesma conclusão, palavras
diferentes. Se você encontrar a frase antiga em outro lugar, é a mesma regra.)

Configura-se em Admin Settings → Claude Code → Managed settings, em
claude.ai/admin-settings/claude-code, e aceita `permissions.allow`. Duas
barreiras, medidas em 18/09/2026:

- exige plano **Claude for Teams ou Enterprise** e papel **Owner / Primary Owner**;
- `~/.claude/remote-settings.json` não existia no container, ou seja, nenhuma
  política server-managed alcançou a sessão.

Se a conta migrar para Team, esta vira a rota 1 e todo o resto desta página vira
história.

## O que NÃO funciona, para ninguém tentar de novo

| Tentativa | Por quê |
| --- | --- |
| `~/.claude/settings.json` | sessão de nuvem: *"not read"*. O PR #7 nasceu morto para a nuvem |
| botão *sempre permitir* do prompt | grava em `.claude/settings.local.json`, que a nuvem não lê e o `.gitignore` descarta |
| gravar qualquer settings durante a sessão | a permissão é lida uma vez, no boot. Medido: não tirou um único prompt |
| hook `SessionStart` que instala a regra | roda *"After Claude Code launches"*, depois da leitura que tentaria alterar |

## O que fica de fora da allowlist, de propósito

`get_publishable_keys` (devolve chave), `create_project`, `pause_project`,
`restore_project`, `deploy_edge_function` e o ciclo de branches
(`create` / `merge` / `reset` / `delete`). Caro ou irreversível continua pedindo
confirmação — é a última barreira antes de um estrago silencioso. Em modo `auto`
essas ficam com o classificador; se isso incomodar, o lugar de barrar é
`permissions.deny`, não a ausência na allowlist.

## Sessões locais fora deste repo

As configurações de usuário valem em qualquer diretório da **sua máquina** — e só
dela. Rode uma vez, a partir de um clone deste repositório:

```bash
node scripts/permissoes-usuario.mjs --conferir   # mostra o que faria
node scripts/permissoes-usuario.mjs              # aplica
```

Funde as regras `mcp__Supabase__*` no seu `~/.claude/settings.json`, preservando
o que já estiver lá. Backup carimbado, idempotente, aborta sem tocar em nada se o
JSON de destino estiver corrompido. `--todas` leva também as regras `Bash(git ...)`.
Recusa rodar em sessão de nuvem, onde não teria efeito.

**Vale a partir da próxima sessão**, porque a permissão é lida no boot.

## Sintaxe, para quando você editar à mão

- `"mcp__Supabase__execute_sql"` — nome puro da ferramenta, sem parênteses:
  cobre qualquer chamada dela, com qualquer query.
- `"Bash(git status:*)"` — prefixo: casa `git status` e o que vier depois.
- Uma regra literal longa demais casa com uma invocação só e não serve para
  nada. Foi o caso da regra de commit que saiu na limpeza de setembro/2026.
