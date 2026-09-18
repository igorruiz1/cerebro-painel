#!/bin/bash
# Setup script do ambiente de nuvem (claude.ai/code -> Environments -> Setup script).
#
# POR QUE ELE EXISTE
# Numa sessao de nuvem o Claude Code le as permissoes UMA vez, quando o processo
# sobe, e ignora dois dos tres arquivos que a gente tentou usar antes:
#
#   ~/.claude/settings.json        NAO e lido   (fica na sua maquina)
#   .claude/settings.local.json    NAO e lido   (fica na sua maquina, e no gitignore)
#   .claude/settings.json do repo  e lido, MAS o container restaura um snapshot
#                                  antigo do repositorio e so faz o fetch depois
#                                  que o Claude ja subiu. A allowlist chega tarde.
#
# O setup script e o unico gancho que roda ANTES do Claude Code lancar, e o que
# ele escreve em disco entra no snapshot do ambiente. Por isso a regra vai aqui.
#
# ISTO E UMA APOSTA, NAO UMA CERTEZA. A documentacao diz que "endpoint-managed
# settings don't reach cloud sessions in Anthropic-hosted environments", e
# managed-settings.json e endpoint-managed. A frase descreve o arquivo na maquina
# do usuario, nao no container, mas a documentacao tambem nunca afirma que o do
# container e lido. Por isso este script escreve nos DOIS alvos plausiveis e
# deixa um marcador: quem abrir a proxima sessao mede em vez de acreditar.
# A rota que NAO depende de aposta e o modo de permissao da sessao. Ver
# docs/permissoes.md.
#
# COMO INSTALAR (uma vez)
#   claude.ai/code -> icone do ambiente -> campo "Setup script" -> cole este arquivo.
#   Trocar o setup script invalida o cache, entao a proxima sessao ja sobe curada.
#
# Roda como root no Ubuntu 24.04. Exit zero e obrigatorio: se sair diferente de
# zero a sessao nao abre. Por isso todo caminho de erro aqui termina em `true`.

set -uo pipefail

MANAGED_DIR=/etc/claude-code
MANAGED=$MANAGED_DIR/managed-settings.json
USUARIO=$HOME/.claude/settings.json

# A fonte da verdade e a allowlist versionada no repo. O clone acontece antes do
# setup script, entao na maioria das vezes ela esta aqui e nao precisamos manter
# duas listas. A lista embutida abaixo e so a rede de seguranca para quando o
# clone ainda nao existir (ambiente novo, outro layout de workspace).
FONTE=""
for candidato in /home/user/*/.claude/settings.json; do
  [ -f "$candidato" ] || continue
  FONTE="$candidato"
  break
done

REGRAS=""
if [ -n "$FONTE" ] && command -v node >/dev/null 2>&1; then
  REGRAS=$(node -e '
    try {
      const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
      const r = (j.permissions?.allow ?? []).filter((x) => x.startsWith("mcp__Supabase__"));
      if (r.length) process.stdout.write(JSON.stringify(r));
    } catch (e) {}
  ' "$FONTE" 2>/dev/null) || REGRAS=""
fi

if [ -z "$REGRAS" ]; then
  FONTE="(lista embutida no setup script)"
  REGRAS='[
    "mcp__Supabase__execute_sql",
    "mcp__Supabase__apply_migration",
    "mcp__Supabase__list_organizations",
    "mcp__Supabase__list_projects",
    "mcp__Supabase__list_tables",
    "mcp__Supabase__list_migrations",
    "mcp__Supabase__list_extensions",
    "mcp__Supabase__get_advisors",
    "mcp__Supabase__get_organization",
    "mcp__Supabase__get_project",
    "mcp__Supabase__get_project_url",
    "mcp__Supabase__query_logs",
    "mcp__Supabase__search_docs",
    "mcp__Supabase__generate_typescript_types"
  ]'
fi

BLOCO="{\"permissions\":{\"allow\":$REGRAS}}"

# Dois alvos de proposito. As configuracoes gerenciadas tem a precedencia mais
# alta que existe; as de usuario sao o plano B para o caso de a superfície
# hospedada aceitar so as segundas. Custa dois arquivos e cobre as duas hipoteses.
mkdir -p "$MANAGED_DIR" "$(dirname "$USUARIO")" 2>/dev/null || true
printf '%s\n' "$BLOCO" > "$MANAGED" 2>/dev/null || true
printf '%s\n' "$BLOCO" > "$USUARIO" 2>/dev/null || true

# Marcador de diagnostico: na proxima sessao da para ler este arquivo e saber se
# o setup script rodou, de onde veio a lista e quantas regras entraram — sem
# depender da minha memoria nem da sua.
{
  echo "escrito_em=$(TZ=America/Cuiaba date '+%Y-%m-%d %H:%M %Z')"
  echo "fonte=$FONTE"
  echo "regras=$(printf '%s' "$REGRAS" | grep -o 'mcp__Supabase__' | wc -l)"
  echo "managed=$MANAGED"
  echo "usuario=$USUARIO"
} > "$MANAGED_DIR/.origem-cerebro" 2>/dev/null || true

echo "allowlist Supabase instalada antes do boot (fonte: $FONTE)"
exit 0
