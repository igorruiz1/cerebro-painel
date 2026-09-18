# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada. A regra que resolve é sempre a mesma linha numa lista `permissions.allow`
— o que muda é **em qual arquivo** ela precisa estar, e isso depende de onde a
sessão abre. Errar o arquivo é o que faz a permissão "não pegar".

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

## Sintaxe, para quando você editar à mão

- `"mcp__Supabase__execute_sql"` — nome puro da ferramenta, sem parênteses:
  cobre qualquer chamada dela, com qualquer query.
- `"Bash(git status:*)"` — prefixo: casa `git status` e o que vier depois.
- Uma regra literal longa demais casa com uma invocação só e não serve para
  nada. Foi o caso da regra de commit que saiu na limpeza de setembro/2026.
