# Permissões do Claude Code: onde a regra mora

O problema concreto: `mcp__Supabase__execute_sql` pedindo autorização a cada
chamada. Levou cinco PRs e várias sessões porque a causa foi diagnosticada
errada quatro vezes. Esta página guarda o que foi **medido**, e diz de cada rota
o que é certeza e o que é aposta.

Em 18/09/2026 a investigação saiu do escuro: apareceu um **controle observável**
(ver *Como medir isto sem se enganar*), e com ele a rota 3 deixou de ser aposta,
o alvo que estava dado como morto ressuscitou, e a anomalia que não tinha
explicação ganhou uma.

## A hierarquia, do que mais resolve para o que menos

| # | Rota | Cobre | Custo | Certeza |
| --- | --- | --- | --- | --- |
| 1 | **`scripts/setup-nuvem.sh` no Setup script** | as 14 regras, antes do boot | 1 config | **medida em 18/09/2026: entrega, e é lida nos dois alvos** |
| 2 | Modo de permissão da sessão | todo prompt, MCP inclusive | 1 clique | documentada, **não isolada** ainda |
| 3 | Allowlist em `.claude/settings.json` | as mesmas 14 regras | já feito | refém do snapshot, e morre em multi-repo |
| 4 | Server-managed settings | tudo, na organização | só Team/Enterprise | documentada, **confirmada indisponível** |

**A antiga rota 3 virou a rota 1 em 18/09/2026**, por medição com controle e com
repetição, não por aposta. Ela subiu porque é a única que não depende de acertar
o relógio do snapshot — escreve antes do Claude Code lançar — e a única que
sobrevive a sessão multi-repo, por ser configuração de usuário e não de projeto.
O modo de permissão desceu para 2 só por isso; continua sendo o único controle
que muda a sessão **em andamento**.

## Antes das rotas: o que o launcher da nuvem já pré-aprova sozinho

Isto não é rota, é o terreno — e explica por que quase toda medição anterior deu
resultado confuso. O processo do Claude Code na sessão de nuvem **não** é lançado
limpo. Lendo a linha de comando real do processo (`CLAUDE_PID=183`) em
18/09/2026:

```bash
tr '\0' '\n' < /proc/$CLAUDE_PID/cmdline      # o método; rode na sua sessão
```

O launcher passa `--settings /root/.claude/launcher-settings.json` e um
`--allowed-tools` enorme. Dentro dele, **crus, sem padrão nenhum**:

```
Bash   Write   Edit   MultiEdit   Read   Glob   Grep   WebFetch   Task   ...
```

`Bash` cru significa: **qualquer** comando de shell roda sem pedir nada, em
qualquer modo. `ls`, `cat`, `git reflog`, `rm` — todos. Era isto que a página
antes chamava de anomalia inexplicada.

E 23 ferramentas Supabase nomeadas, entre elas `list_organizations`,
`list_edge_functions`, `get_publishable_keys`, `deploy_edge_function` e o ciclo
de branches. Mas **quatro ficam de fora**:

| Fora do `--allowed-tools` do launcher |
| --- |
| `mcp__Supabase__execute_sql` |
| `mcp__Supabase__apply_migration` |
| `mcp__Supabase__create_branch` |
| `mcp__Supabase__create_project` |

Ou seja: a dor original desta investigação inteira são **exatamente as duas
ferramentas que o host decidiu não pré-aprovar** — `execute_sql` e
`apply_migration`. Todo o resto do Supabase nunca dependeu de rota nenhuma.

Consequência prática: o valor de qualquer rota desta página é medido em duas
ferramentas, não em vinte e cinco.

**Segundo ponto de dados, outra sessão (18/09/2026, `CLAUDE_PID=103`).** A mesma
leitura repetida numa sessão diferente, em container diferente, devolveu a lista
**idêntica** — as mesmas 23 ferramentas Supabase e exatamente as mesmas quatro
de fora. Não é prova de que a lista nunca varia, mas duas sessões independentes
com a mesma lista tornam a hipótese *"varia por sessão"* bem mais cara de
sustentar. Leia a sua mesmo assim antes de desenhar teste; o custo é um comando.

### O outro arquivo que o launcher injeta

O `--allowed-tools` não vem sozinho. O launcher também passa
`--settings /root/.claude/launcher-settings.json`, e vale saber o que tem dentro:

```json
{
  "hooks": { "Stop": [ { "matcher": "", "hooks": [
      { "type": "command", "command": "~/.claude/stop-hook-git-check.sh" } ] } ] },
  "permissions": { "allow": ["Skill"] }
}
```

Pouca coisa hoje — uma regra e um hook de verificação de git no fim do turno. **O
que importa é a posição dele na precedência.** `--settings` é o nível 2 da escala
oficial, logo abaixo das configurações gerenciadas:

```
managed-settings.json  >  --settings (launcher)  >  .claude/settings.json  >  ~/.claude/settings.json
        alvo 1                  do host                  rota 3                     alvo 2
```

Ou seja: o **alvo 1 ganha do launcher; o alvo 2 perde**. Enquanto o launcher só
traz um `allow`, isso é irrelevante — `allow` não conflita com `allow`. No dia em
que ele trouxer um `deny`, o alvo 2 não resolve e o alvo 1 sim. É a segunda razão
para o script continuar escrevendo nos dois, além da doc ambígua.

## Rota 1: o setup script

`scripts/setup-nuvem.sh`, colado no campo **Setup script** do ambiente. É o único
gancho que roda **antes do Claude Code lançar**, e o que ele escreve em disco
entra no snapshot do ambiente. Ele escreve em dois alvos:

| Alvo | Arquivo | Status em 18/09/2026 |
| --- | --- | --- |
| 1 | `/etc/claude-code/managed-settings.json` | **lido** — surpresa, ver abaixo |
| 2 | `/root/.claude/settings.json` | **lido** |

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

**Medido, e mais duro do que a frase sugere.** Uma sessão aberta *antes* de o
script existir foi retomada depois, e o container dela foi **reprovisionado do
zero**: `uptime` de 70 s, processo do Claude Code iniciado 17:19:55 UTC, VM nova
para todos os efeitos. Mesmo assim `/etc/claude-code/` **não existia** — nem o
diretório. Isto é: *resume* não re-roda o setup script nem quando a máquina é
construída de novo. Uma sessão antiga **nunca** ganha a cura, por mais que você
a reabra; ela morre sem allowlist. Só sessão nova.

**Duas regras de escrita do script**, ou a sessão nem sobe: precisa **sair com
zero** (*"if the script exits non-zero, the session fails to start"*) e terminar
em ~5 minutos. O `setup-nuvem.sh` cumpre: `set -uo pipefail` sem `-e`, `|| true`
em cada escrita, `exit 0` no fim.

### Medido em 18/09/2026: o script entrega

Primeira sessão depois de colar o script no campo. Saída crua do marcador:

```
$ cat /etc/claude-code/.origem-cerebro
escrito_em=2026-09-18 12:50 -04
fonte=/home/user/cerebro-painel/.claude/settings.json
regras=14
managed=/etc/claude-code/managed-settings.json
usuario=/root/.claude/settings.json
```

Os dois arquivos existem, com as 14 regras, carimbados 16:50 UTC junto com o
resto do snapshot. **A entrega está provada:** o setup script roda, e o que ele
escreve sobrevive ao snapshot do ambiente.

### Medido em 18/09/2026: os dois alvos são lidos

Entrega não é leitura. A leitura foi medida com o controle descrito adiante —
regra-sonda `Bash(touch:*)` posta em **um alvo de cada vez**, com o outro
restaurado ao original, e o resultado lido **no disco**, não na resposta do
modelo:

| Run | Regra em | Efeito |
| --- | --- | --- |
| C1, C2, C3 | nenhum arquivo | **negado**, arquivo ausente (3/3) |
| U1, U2 | só `/root/.claude/settings.json` | **executou**, arquivo criado (2/2) |
| M1, M2, npm1-3, nat1-2 | só `/etc/claude-code/managed-settings.json` | **executou**, arquivo criado (5/5) |

Sequência controle → teste → controle, para não confundir com deriva de
ambiente: `NEGADO → FEZ → FEZ → NEGADO`.

A negação dos controles não é silêncio nem chute do modelo. O stream bruto traz
o motivo, palavra por palavra:

```
"tool_result","content":"Permission for this tool use was denied. It requires
approval, and this session has no approval surface — nobody can answer a
permission prompt here — so it was denied automatically. The action was NOT
performed"
```

**Veredito: a rota 1 (ex-rota 3) funciona.** Não é mais aposta.

Fechamento de ponta a ponta, na sessão real e não em subprocesso:
`mcp__Supabase__execute_sql` com `select 1` rodou **sem prompt**, e o launcher
desta sessão **não** pré-aprova `execute_sql`. Logo, uma allowlist de arquivo foi
lida. Esse teste sozinho não separa a rota 1 da rota 3, porque a regra está nas
duas; quem separou foi o experimento isolado acima.

### A surpresa: o alvo 1 está vivo, contra a leitura da documentação

A página dizia, até hoje, que o alvo 1 estava *"mais para morto do que para
aposta"*, com base neste trecho:

> Managed settings: only **server-managed settings** reach a cloud session; a
> `managed-settings.json` file or MDM profile on your device doesn't. **A
> self-hosted environment also reads the managed settings file in its runner
> image.**

A leitura natural do *"also"* é que só o self-hosted lê o arquivo da imagem, e o
ambiente hospedado pela Anthropic — o nosso — não leria. **Medido, não é isso.**
`/etc/claude-code/managed-settings.json` foi lido em 5 de 5 execuções, em
ambiente `cloud_default` (`CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE=cloud_default`),
não self-hosted.

A frase da doc não é falsa: ela fala do arquivo **na sua máquina**, que de fato
não viaja para a nuvem. O que ela não diz — e a leitura natural sugeria o
contrário — é que um arquivo escrito **dentro do container**, pelo setup script,
é lido normalmente. Onde o arquivo nasce é o que importa, não o nome dele.

Isso não muda a recomendação prática: o script continua escrevendo nos **dois**
alvos, porque redundância barata contra doc ambígua é bom negócio. Mas o alvo 1
sai do quase-morto e entra como o mais forte dos dois — settings gerenciadas têm
precedência sobre as de usuário.

### Como medir isto sem se enganar

Este é o ativo mais reaproveitável da investigação, porque foi a falta dele que
produziu quatro diagnósticos furados.

**Nunca meça pela ausência de prompt.** O launcher pré-aprova `Bash`, `Write`,
`Edit` e 23 ferramentas Supabase (seção acima). Numa sessão assim, "não pediu
autorização" é o estado normal e não prova nada sobre nenhuma rota.

**O controle que funciona** roda um Claude Code filho, num diretório **sem**
`.claude`, com prompt desativado:

```bash
cd /tmp/algum-dir-vazio
claude -p --permission-mode manual --permission-prompts none \
       --tools Bash --strict-mcp-config < /dev/null \
       "Rode exatamente este comando no Bash, uma unica vez: touch /tmp/algum-dir-vazio/alvo.txt"
test -f /tmp/algum-dir-vazio/alvo.txt && echo LIDO || echo NAO-LIDO
```

`--permission-prompts none` converte "perguntaria" em "negado": o que antes era
invisível vira resultado binário em disco.

Três armadilhas, todas pisadas hoje:

- **Comando inofensivo não serve de sonda.** A primeira sonda foi `echo`, e
  passou **com e sem** regra: comando sem efeito colateral é aprovado sozinho.
  Use algo que escreve — `touch` serve.
- **Não meça pela resposta do modelo, meça pelo disco.** Perguntar "responda só
  FEZ ou NEGADO" produziu um **falso negativo**: numa execução o modelo
  respondeu `NEGADO` sem sequer chamar a ferramenta. Foi esse falso negativo que
  quase enterrou o alvo 1 de novo. O arquivo em disco não mente.
- **Medição única não vale.** Repita, e intercale controles antes e depois.
  `NEGADO → FEZ → FEZ → NEGADO` é evidência; um `NEGADO` solto não é.
- **Escolher a sonda sem ler o terreno.** Esta é a quarta, e produziu um dos
  diagnósticos furados. Para provar que *"não foi a allowlist do repo"*, uma
  sessão escolheu `list_edge_functions` por ela não estar em
  `.claude/settings.json` — e concluiu, do fato de ela rodar sem prompt, que
  outra rota estava cobrindo. Só que ela está nomeada no `--allowed-tools` do
  launcher. **O controle não controlava nada**, e a conclusão tinha que estar
  errada mesmo que por acaso acertasse. Antes de eleger qualquer ferramenta como
  sonda, confira se o launcher já a pré-aprova.

**O que não existe, para não procurar:** `/status` é comando do cliente
interativo e **não está disponível para o agente numa sessão de nuvem** — não há
como invocá-lo de dentro, nem existe "Setting sources" em lugar nenhum da saída
do `claude doctor`, que lista versão, plataforma, managed settings remotas e
avisos de instalação, e só. `claude --debug` também não imprime as fontes de
settings carregadas. Quem quiser saber quais arquivos pesaram tem que medir pelo
efeito, como acima.

Uma pista falsa, para ninguém perder tempo: `/opt/node22/bin/claude` e
`/opt/claude-code/bin/claude` parecem instalações diferentes — o `claude doctor`
inclusive reclama de *"leftover npm global installation"*. São o **mesmo
binário**: o primeiro é symlink do segundo, mesma versão 2.1.276. Diferença de
resultado entre os dois é ruído de medição, não achado.

## Rota 2: o modo de permissão

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
(Manual) não está no menu, embora exista como estado.

Os cinco modos do CLI local, para referência:

| Modo | Roda sem perguntar |
| --- | --- |
| `default` (Manual) | só leitura |
| `acceptEdits` | leitura, edição de arquivo, comandos comuns de fs |
| `auto` | tudo, com verificação de segurança em segundo plano |
| `dontAsk` | leitura e ferramentas pré-aprovadas; o resto é **negado**, não perguntado |
| `bypassPermissions` | tudo |

Em `auto` as ferramentas MCP vão para um classificador em vez de virem para
você — *"Everything else goes to the classifier"*.

### A divergência de nomes, agora com uma peça a mais

A página já registrava que a API reportou `permission_mode: "default"` para uma
sessão cujo dropdown mostrava "Aceitar edições". Medido hoje, parte disso é só
apelido: passando `--permission-mode manual` na linha de comando, o próprio
Claude Code reporta no evento de init `"permissionMode":"default"`. **Manual e
`default` são o mesmo modo com dois nomes.** Não explica o caso "Aceitar
edições" da sessão anterior, que segue em aberto.

### Medido em 18/09/2026: os zero prompts, finalmente explicados

Esta seção já esteve escrita como *"o modo `auto` resolve"*, foi corrigida para
*"nenhuma das quatro rotas explica"*, e agora fecha.

**O fato.** Sessão de nuvem, um repositório, nenhum pedido de autorização em
nenhuma chamada: `list_organizations`, `execute_sql` (`select 1`),
`list_edge_functions`, e `Bash` fora da allowlist (`ls`, `cat`, `git branch`,
`git reflog`).

**A explicação, que faltava: o `--allowed-tools` do launcher.** `Bash` entra cru,
então `ls`, `cat` e `git` nunca iam pedir nada, em modo nenhum. `list_organizations`
e `list_edge_functions` estão nomeadas na lista. Não era mistério, era terreno
não inspecionado — ninguém tinha olhado a linha de comando do processo.

**O que continua em aberto:** `execute_sql` naquela sessão. Ele **não** está no
`--allowed-tools`, a allowlist do repo ainda não estava em disco (snapshot velho)
e o setup script não existia.

A hipótese barata era *"o `--allowed-tools` varia por sessão"*. Ela **perdeu
força**: a leitura numa segunda sessão deu lista idêntica (seção do launcher).
Duas hipóteses sobraram, nenhuma medida:

- o `launcher-settings.json` daquela sessão trazia mais coisa do que o desta,
  que só traz `allow: ["Skill"]`;
- houve uma releitura de permissões depois do boot, com o clone já atualizado.
  Esta ganhou peso hoje: o container desta sessão foi **reprovisionado** às
  17:19:55 UTC — `uptime` de 70 s com a conversa inteira preservada — e nesse
  reprovisionamento o Claude Code subiu de novo, agora com a allowlist do repo
  já em disco. Um "boot" não é um por sessão; é um por VM.

Quem for medir: leia `/proc/$CLAUDE_PID/cmdline` **e** o `--settings` que ele
aponta, **antes** de formular teoria.

**A consequência prática permanece:** a ausência de prompt não serve de controle
para medir rota nenhuma. O que mudou é que agora existe um controle que serve.

## Rota 3: a allowlist versionada, e por que ela falhou uma vez

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
importava.

**A segunda condição, esta permanente:** a rota 3 vale para sessão de **um**
repositório. Com mais de um, a sessão começa *acima* dos clones e de cada
`.claude/settings.json` carrega só os plugins e marketplaces declarados —
*"not permission rules, hooks, `env`, or other keys"*. Nenhum acerto de timing
resolve isso; ali só as rotas 1 e 2 funcionam.

**Uma terceira ressalva, nova e não fechada.** O Claude Code filho recusou a
allowlist do projeto com esta mensagem:

```
Ignoring 24 permissions.allow entries from .claude/settings.json: this workspace
has not been trusted. Run Claude Code interactively here once and accept the
trust dialog, or set projects["/home/user/cerebro-painel"].hasTrustDialogAccepted
```

E o `/root/.claude.json` do container tem `projects = {}` — nenhum workspace
confiado. Se isso valesse também para a sessão principal, a rota 3 estaria morta
na nuvem por falta de trust. **Não vale necessariamente:** a doc diz que o
diálogo de confiança é pulado quando a saída não é TTY, que é o caso da sessão
principal (`--output-format=stream-json`). Não foi medido qual dos dois manda.
É mais uma razão para a rota 3 ficar abaixo da 1.

## Rota 4: server-managed settings

O caminho oficial para política em sessão de nuvem:

> only **server-managed settings** reach a cloud session; a
> `managed-settings.json` file or MDM profile on your device doesn't.

Configura-se em Admin Settings → Claude Code → Managed settings, em
claude.ai/admin-settings/claude-code, e aceita `permissions.allow`. Três
barreiras, medidas em 18/09/2026:

- exige plano **Claude for Teams ou Enterprise** e papel **Owner / Primary Owner**;
- `~/.claude/remote-settings.json` não existia no container;
- o `claude doctor` confirma, com todas as letras:
  `Managed settings (remote): none configured for this organization`.

Se a conta migrar para Team, esta vira a rota 1 e todo o resto desta página vira
história.

## O que NÃO funciona, para ninguém tentar de novo

| Tentativa | Por quê |
| --- | --- |
| `~/.claude/settings.json` **da sua máquina** | sessão de nuvem: *"not read"*. O PR #7 nasceu morto para a nuvem. Não confunda com `/root/.claude/settings.json` **do container**, que é lido (rota 1) |
| botão *sempre permitir* do prompt | grava em `.claude/settings.local.json`, que a nuvem não lê e o `.gitignore` descarta |
| gravar qualquer settings durante a sessão | a permissão é lida uma vez, no boot. Medido: não tirou um único prompt |
| hook `SessionStart` que instala a regra | roda *"After Claude Code launches"*, depois da leitura que tentaria alterar |
| medir rota pela ausência de prompt | o launcher já pré-aprova `Bash`, `Write`, `Edit` e 23 ferramentas Supabase. Use o controle da rota 1 |
| sonda de permissão com `echo` | comando sem efeito colateral é aprovado sozinho, com ou sem regra |

## A barreira do caro e do irreversível: era decorativa, agora é real

Esta página dizia que `get_publishable_keys`, `create_project`, `pause_project`,
`restore_project`, `deploy_edge_function` e o ciclo de branches ficavam **de fora
da allowlist de propósito**, e que com isso "caro ou irreversível continua pedindo
confirmação — é a última barreira antes de um estrago silencioso".

**Era falso na nuvem.** O launcher pré-aprova sozinho, no `--allowed-tools`,
`get_publishable_keys`, `deploy_edge_function`, `pause_project`,
`restore_project` e `merge` / `reset` / `rebase` / `delete_branch`. Ausência na
nossa allowlist não barra nada. A barreira estava documentada e não existia —
o pior tipo de proteção, porque quem lê a página confia nela.

### Medido em 18/09/2026: o que barra é `permissions.deny`

Dois experimentos, cada um com controle antes e depois, no cenário do launcher
(`--allowed-tools` pré-aprovando a ferramenta) e com o `deny` no arquivo da
rota 1:

**Com `Bash`,** sonda `touch`, resultado lido em disco:

| Run | `deny` | Arquivo criado |
| --- | --- | --- |
| A1, A2 | não | **sim** (2/2) |
| B1, B2 | `Bash(touch:*)` | **não** (2/2) |
| C1 | não | **sim** |

**Com ferramenta MCP,** `list_projects`, lido no stream bruto:

| Run | `deny` | No catálogo do `init` | Efeito |
| --- | --- | --- | --- |
| A1 | não | **presente** | chamou, dados vieram |
| B1, B2 | `mcp__Supabase__list_projects` | **ausente** | modelo nem a enxerga |
| C1 | não | **presente** | chamou, dados vieram |

**O `deny` vence o `--allowed-tools` do launcher.** E o mecanismo difere por
tipo, o que vale saber antes de desenhar teste:

- **MCP:** o `deny` **remove a ferramenta do catálogo**. Ela não aparece no evento
  `init`, e o modelo responde *"não tenho essa ferramenta disponível"*. Não é
  negação na chamada, é ausência.
- **`Bash` com padrão:** a ferramenta continua no catálogo, porque só o padrão foi
  negado; a chamada é que é recusada.

### O que o `setup-nuvem.sh` passou a negar

Nove nomes, escritos junto com a allowlist no mesmo arquivo:

```
create_project   pause_project   restore_project   deploy_edge_function
create_branch    delete_branch   merge_branch      reset_branch    rebase_branch
```

Três decisões deliberadas, para ninguém refazer a discussão:

- **`execute_sql` e `apply_migration` ficam no `allow`.** São a dor original desta
  investigação inteira. Negá-las seria resolver o problema matando o paciente.
- **`get_publishable_keys` fica de fora do `deny`.** Chave *publicável* é desenhada
  para ir no cliente, e já está no `index.html` do painel. Negá-la seria teatro
  de segurança — exatamente o vício que esta seção veio corrigir.
- **`create_project` e `create_branch` entram mesmo já estando fora do
  `--allowed-tools`.** Redundância barata: se o launcher mudar de ideia numa
  atualização, a barreira continua de pé.

**Para desfazer:** tire o nome da lista, salve o ambiente, abra **sessão nova**.
Configuração gerenciada não se sobrepõe de dentro da sessão — é o preço de a
barreira ser real, e é o ponto.

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
