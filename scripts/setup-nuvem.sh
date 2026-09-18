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
# DOIS ALVOS, E OS DOIS SAO LIDOS (medido em 18/09/2026)
# Este bloco ja disse que o alvo 1 estava "provavelmente morto", por causa desta
# frase da doc: "only server-managed settings reach a cloud session; a
# managed-settings.json file or MDM profile on your device doesn't. A
# self-hosted environment ALSO reads the managed settings file in its runner
# image." O "also" sugeria que so o self-hosted le o arquivo da imagem.
#
# Medido, nao e isso. Numa sessao cloud_default, com a regra-sonda posta em um
# alvo de cada vez e o resultado lido em disco:
#
#   /etc/claude-code/managed-settings.json   LIDO  (5 de 5 execucoes)
#   /root/.claude/settings.json              LIDO  (2 de 2 execucoes)
#   nenhum dos dois                          negado (3 de 3 execucoes)
#
# A frase da doc nao e falsa: ela fala do arquivo NA MAQUINA DO USUARIO, que
# nunca chega aqui. O que vale e onde o arquivo nasce, nao o nome dele — escrito
# dentro do container pelo setup script, e lido normalmente.
#
# A sessao de nuvem roda como root com HOME=/root, e o setup script tambem, entao
# os dois escrevem no mesmo /root/.claude/settings.json.
#
# Continua escrevendo nos dois: redundancia barata contra doc ambigua. O metodo
# de medicao, com as tres armadilhas que produziram diagnostico furado, esta em
# docs/permissoes.md.
#
# COMO INSTALAR (uma vez)
#   claude.ai/code -> icone de nuvem com o nome do ambiente, na linha ACIMA da
#   caixa de mensagem (nao ha pagina nem URL para isso) -> passe o mouse sobre o
#   ambiente -> engrenagem a direita -> dialogo "Update cloud environment" ->
#   campo "Setup script" -> cole este arquivo -> salve.
#   Salvar ja invalida o cache; a proxima SESSAO NOVA sobe curada. Retomar uma
#   sessao existente nunca re-roda o setup script.
#
# Roda como root no Ubuntu 24.04. Exit zero e obrigatorio: se sair diferente de
# zero A SESSAO NAO ABRE. Por isso todo caminho de erro aqui termina em `true`.
# Limite de ~5 minutos; este script leva menos de um segundo.

set -uo pipefail

MANAGED_DIR=/etc/claude-code
MANAGED=$MANAGED_DIR/managed-settings.json
# ${HOME:-/root} e nao $HOME: com set -u um HOME vazio mataria o script, e setup
# script que sai diferente de zero IMPEDE A SESSAO DE ABRIR. O fallback /root
# nao e chute: medido em 18/09/2026, a sessao de nuvem roda como root com
# HOME=/root, mesmo usuario e mesmo home do setup script.
USUARIO=${HOME:-/root}/.claude/settings.json

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

# O que NEGAR, e por que isto nao e paranoia (medido em 18/09/2026).
#
# A pagina dizia que o caro e o irreversivel "continuam pedindo confirmacao" por
# NAO estarem na allowlist. Na nuvem isso e falso: o launcher pre-aprova sozinho,
# no --allowed-tools, deploy_edge_function, pause_project, restore_project e o
# ciclo de branches. Ausencia na allowlist nao barra nada — a barreira estava
# documentada e nao existia.
#
# O que barra e permissions.deny, e isso foi medido: com deny no arquivo, a
# ferramenta MCP some do catalogo do init (o modelo nem a enxerga), com controles
# antes e depois — PRESENTE -> AUSENTE, AUSENTE -> PRESENTE.
#
# execute_sql e apply_migration NAO entram aqui: sao a dor original e precisam do
# allow. get_publishable_keys tambem nao: chave publicavel e desenhada para ir no
# cliente e ja esta no index.html do painel; nega-la seria teatro.
#
# PARA DESFAZER: tire o nome daqui, salve o ambiente, abra SESSAO NOVA. Managed
# settings nao se sobrepoem de dentro da sessao — e o preco de a barreira ser
# real.
NEGAR='[
    "mcp__Supabase__create_project",
    "mcp__Supabase__pause_project",
    "mcp__Supabase__restore_project",
    "mcp__Supabase__deploy_edge_function",
    "mcp__Supabase__create_branch",
    "mcp__Supabase__delete_branch",
    "mcp__Supabase__merge_branch",
    "mcp__Supabase__reset_branch",
    "mcp__Supabase__rebase_branch"
  ]'

BLOCO="{\"permissions\":{\"allow\":$REGRAS,\"deny\":$NEGAR}}"

# Dois alvos de proposito. As configuracoes gerenciadas tem a precedencia mais
# alta que existe; as de usuario sao o plano B para o caso de a superfície
# hospedada aceitar so as segundas. Custa dois arquivos e cobre as duas hipoteses.
#
# FUNDE, nao sobrescreve. No container de nuvem esses arquivos nascem vazios e
# daria na mesma, mas um ambiente self-hosted ou uma imagem customizada pode ja
# ter configuracao de usuario ali, e um > cego apagaria tema, deny e hooks de
# quem nunca pediu isso. Sem node, escreve apenas se o destino NAO existir: e
# melhor nao instalar a regra do que destruir configuracao alheia.
fundir() {
  local destino=$1
  mkdir -p "$(dirname "$destino")" 2>/dev/null || true
  if [ -s "$destino" ] && command -v node >/dev/null 2>&1; then
    node -e '
      const fs = require("fs")
      const [destino, bloco] = process.argv.slice(1)
      let atual = {}
      try { atual = JSON.parse(fs.readFileSync(destino, "utf8")) } catch (e) { process.exit(3) }
      const novo = JSON.parse(bloco).permissions
      const juntar = (chave) => {
        const tem = new Set(atual.permissions?.[chave] ?? [])
        return [...(atual.permissions?.[chave] ?? []), ...(novo[chave] ?? []).filter((r) => !tem.has(r))]
      }
      atual.permissions = {
        ...(atual.permissions ?? {}),
        allow: juntar("allow"),
        deny: juntar("deny"),
      }
      fs.writeFileSync(destino, JSON.stringify(atual, null, 2) + "\n")
    ' "$destino" "$BLOCO" 2>/dev/null || true
  elif [ ! -e "$destino" ]; then
    printf '%s\n' "$BLOCO" > "$destino" 2>/dev/null || true
  fi
}

mkdir -p "$MANAGED_DIR" 2>/dev/null || true
fundir "$MANAGED"
fundir "$USUARIO"

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
