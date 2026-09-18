# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada.

São **duas travas em série**, e destravar uma só não abre a porta:

1. **A allowlist** — a regra existe e o arquivo certo foi lido? É o resto desta
   página.
2. **O modo de permissão** da sessão — ver
   [Ainda pergunta, mesmo com a regra no lugar](#ainda-pergunta-mesmo-com-a-regra-no-lugar).

A regra que resolve a trava 1 é sempre a mesma linha numa lista
`permissions.allow` — o que muda é **em qual arquivo** ela precisa estar, e isso
depende de onde a sessão abre. Errar o arquivo é o que faz a permissão "não
pegar".

| Onde você abre a sessão | Arquivo que vale | Estado |
| --- | --- | --- |
| Claude Code local, dentro deste clone | `.claude/settings.json` (versionado) | resolvido |
| Claude Code local, em qualquer outra pasta | `~/.claude/settings.json` (sua máquina) | `scripts/permissoes-usuario.mjs` |
| Sessão remota (claude.ai/code) em **outro** repositório | `.claude/settings.json` **daquele** repo | copiar o bloco abaixo |
| Cowork, app, chat do claude.ai | nenhum — a superfície gerencia sozinha | fora de alcance |

## Sessões locais fora deste repo

As configurações de usuário valem em qualquer diretório da sua máquina. Rode uma
vez, a partir de um clone deste repositório:

```bash
node scripts/permissoes-usuario.mjs --conferir   # mostra o que faria
node scripts/permissoes-usuario.mjs              # aplica
```

Ele funde as regras `mcp__Supabase__*` da allowlist deste repo no seu
`~/.claude/settings.json`, preservando tudo o que já estiver lá (tema, `deny`,
hooks). Faz backup carimbado antes de escrever, é idempotente, e aborta sem
tocar em nada se o JSON de destino estiver corrompido. `--todas` leva também as
regras `Bash(git ...)`, o que só faz sentido se você quiser o mesmo fluxo de
commit em outros projetos.

A allowlist do repo é a fonte; o script é só o transporte. Mexeu numa,
rode o outro.

**Vale a partir da próxima sessão.** As permissões são lidas quando a sessão
abre; a que já está rodando continua com a lista antiga.

## Sessões remotas em outro repositório

O container remoto é descartado ao fim da sessão, então `~/.claude/` não
sobrevive e o script acima não ajuda ali. A regra precisa estar versionada no
repositório que a sessão clona. Crie `.claude/settings.json` lá com:

```json
{
  "permissions": {
    "allow": [
      "mcp__Supabase__execute_sql",
      "mcp__Supabase__list_tables",
      "mcp__Supabase__list_projects",
      "mcp__Supabase__query_logs"
    ]
  }
}
```

## O que fica de fora, de propósito

`get_publishable_keys` (devolve chave), `create_project`, `pause_project`,
`restore_project`, `deploy_edge_function` e o ciclo de branches
(`create` / `merge` / `reset` / `delete`). Caro ou irreversível continua pedindo
confirmação — é a última barreira antes de um estrago silencioso.

## Ainda pergunta, mesmo com a regra no lugar

Sintoma: sessão na nuvem, allowlist commitada no `main`, e mesmo assim aparece
"Permitir que Claude usar Execute SQL (Supabase)?" a cada chamada.

Percorra na ordem — a primeira que casar é a sua.

**1. A sessão é anterior à allowlist.** As permissões são lidas **quando a
sessão abre**. Uma sessão aberta antes do commit da regra nunca a enxerga, por
mais `git pull` que você dê dentro dela. É a causa mais comum.
→ Abra uma sessão nova. A antiga só se resolve pelo modo (item 4).

**2. A sessão tem mais de um repositório.** Documentado: uma sessão com vários
repositórios começa *acima* dos clones e, de cada `.claude/settings.json`,
carrega só os plugins e marketplaces declarados — **não as regras de
permissão**. Sessão de repositório único lê tudo.
→ Use sessão de um repositório só, ou resolva pelo modo (item 4).

**3. O nome da ferramenta não bate.** A regra casa pelo identificador
(`mcp__Supabase__execute_sql`), não pelo rótulo da caixa de diálogo
("Execute SQL (Supabase)"). Servidor MCP registrado com outro nome → outra
regra.
→ Confira o `project_id`/nome do servidor no JSON que a caixa mostra.

**4. O modo de permissão não cobre MCP.** `acceptEdits` ("Aceitar edições", o
rótulo no rodapé) auto-aprova edição de arquivo e **não** ferramentas MCP.

| Modo | Roda sem perguntar |
| --- | --- |
| `default` (Manual) | só leitura |
| `acceptEdits` | leitura + edição de arquivo — **MCP continua perguntando** |
| `auto` | tudo, com verificação de segurança em segundo plano |
| `dontAsk` | leitura + ferramentas pré-aprovadas; o resto é **negado**, não perguntado |
| `bypassPermissions` | tudo, sem verificação |

→ Na nuvem o modo se escolhe no **dropdown da sessão**, ao criar a tarefa e com
ela em curso. É a única alavanca que muda uma sessão **já aberta**.

### Por que este repo não fixa um modo no settings.json

`permissions.defaultMode` aceita valor em `.claude/settings.json`, mas:

- `auto` e `bypassPermissions` **são ignorados** nesse arquivo por decisão do
  produto (a sessão cai para Manual) — não adianta tentar.
- `dontAsk` funcionaria e zeraria os prompts, mas **nega** tudo que não estiver
  na allowlist: `Edit`, `Write`, e qualquer `Bash` fora da lista parariam de
  funcionar sem sequer perguntar. Trocaria um incômodo por um travamento
  silencioso.

Por isso a divisão: **allowlist no repositório** (durável, versionada,
auditável) + **modo escolhido na sessão** (contextual, reversível). É o mesmo
desenho de `sudoers` + flag da invocação: política no arquivo, postura no
momento da chamada.

## Sintaxe, para quando você editar à mão

- `"mcp__Supabase__execute_sql"` — nome puro da ferramenta, sem parênteses:
  cobre qualquer chamada dela, com qualquer query.
- `"Bash(git status:*)"` — prefixo: casa `git status` e o que vier depois.
- Uma regra literal longa demais casa com uma invocação só e não serve para
  nada. Foi o caso da regra de commit que saiu na limpeza de setembro/2026.
