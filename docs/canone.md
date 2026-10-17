# O presidente contra o cânone

Régua de mercado do `presidente.html` e plano para fechar o que falta. v02, 17/10/2026, s6120 (v01: 08/10, s1274).

Este arquivo é público, igual ao resto do repo. Número de caixa, nome de frente e valor de KPI
ficam no banco: aqui entra só o que se mede na tela.

## Por que existe

Em 29/08 o `index.html` v28 foi auditado contra 18 réguas tiradas de modelos que já são referência
(doc 409 do cérebro). Deu 39%, subiu para 56% na v29 e nunca mais foi remedido. O `presidente.html`
virou a casa (o `manifest.json` abre nele) e passou pela régua pela primeira vez em 08/10 (v01).

**Por que a v02.** Em 17/10 a v01 já mentia em três pontos: o placar era o da p4.30 (a tela está na
p4.64), a tabela do plano mostrava como pendentes 9 itens que o banco já tinha descartado, e a tela
tinha crescido sem remedida. Medido com `npm run canone` a 1280 px, entre 08/10 e 17/10:

| Medida | 08/10 (p4.31) | 17/10 (p4.64) | Variação |
|---|---|---|---|
| Palavras nas abas | 1.442 (5 abas) | 1.814 (6 abas) | +26% |
| Números nas abas | 243 | 296 | +22% |
| Telas de Hoje (1280 / 390) | 1,4 / 2,8 | 1,4 / 2,9 | igual |

Uma régua que não acompanha o crescimento vira enfeite. A regra passa a ser: **o plano vive só no
banco** (`plano_item`); esta página guarda a régua, o placar e a ordem das ondas, nunca o estado dos
itens.

## De onde vêm as réguas

Nenhuma régua é inventada aqui. As 18 primeiras vêm do doc 409:
- Stephen Few (uma tela, todo número com comparação, bullet graph);
- Tufte (data-ink, small multiples, sparkline com banda);
- Shneiderman (panorama, depois detalhe);
- Google SRE (alerta acionável, orçamento de erro, duas janelas);
- Amazon WBR (6-12, anomalia, entrada antes de saída);
- Kanban (WIP e idade do aberto);
- EOS Scorecard (5 a 15 números, dono, meta);
- NN/g (divulgação progressiva, informação que sobrevive sem cor).

As réguas 19 a 24 (v01) vêm do que um painel **de dono de empresa** cobra e um painel de operação não:
tesouraria de 13 semanas (IBCS), Profit First, frescor do dado, Balanced Scorecard, ritual semanal e
painel governado por dado.

As réguas 25 a 30 (v02) são os **6 componentes do EOS** (Traction, Gino Wickman). Em 17/10 o Igor
escolheu o EOS como espinha da gestão: ele foi feito para empresa tocada pelo dono, e a tela já tinha
metade dele (scorecard semanal com dono e meta). OKR + BSC e 4DX foram comparados e perderam: o
primeiro pesa demais para um dono só, o segundo cobre mal várias unidades ao mesmo tempo.

## Placar da p4.64

SIM = 1, PARCIAL = 0,5, NÃO = 0. Réguas de tela medidas por script; as de julgamento, à mão, com
leitura do fonte em 17/10.

| # | Régua | p4.30 | p4.64 | Evidência na p4.64 |
|---|---|---|---|---|
| 1 | Essencial numa tela, sem rolagem | PARCIAL | PARCIAL | Hoje ocupa 1,4 tela a 1280 e 2,9 a 390. |
| 2 | Série temporal | PARCIAL | PARCIAL | Sparkline só nas frentes; caixa e Semana sem série. |
| 3 | Número com meta, período anterior ou faixa | PARCIAL | PARCIAL | A Semana traz meta e semana anterior; Hoje e Caixa só o fôlego. |
| 4 | Normal x anomalia só olhando | NÃO | NÃO | Sem banda de normalidade. |
| 5 | Mesmo período do ano anterior | NÃO | NÃO | Menos de 12 meses de série. |
| 6 | Entrada controlável antes de saída | SIM | SIM | Próximo passo divide a dobra com o fôlego. |
| 7 | Dono e meta em cada número | PARCIAL | PARCIAL | Semana tem dono e meta; o resto não. |
| 8 | 5 a 15 números principais | SIM | SIM | Teto de 14 na Semana. |
| 9 | Teste dos 5 s e leitura em 20 min | SIM | SIM | 1.814 palavras nas 6 abas, contra 8.936 do index v28. |
| 10 | Panorama, depois detalhe | SIM | SIM | Bloco, lista e folha. |
| 11 | Todo vermelho com ação definida | SIM | SIM | Cada item vem com verbo. |
| 12 | Alerta por orçamento ou janela dupla | PARCIAL | PARCIAL | Só o selo de saúde usa orçamento de erro. |
| 13 | Métrica sem uso fora da tela | SIM | SIM | Fica no bastidor. |
| 14 | WIP, teto e idade do aberto | SIM | SIM | WIP na Fila, idade e "manter ou largar?". |
| 15 | Zero chartjunk | SIM | SIM | SVG puro, sem biblioteca. |
| 16 | Frentes lado a lado | PARCIAL | **SIM** | Small multiples de 8 semanas na mesma escala (plano 108). |
| 17 | Celular empilha e prioriza | SIM | SIM | Testes a 360 e 390 px. |
| 18 | Sobrevive sem cor | PARCIAL | PARCIAL | Gráfico do caixa usa cor como sinal único. |
| 19 | 13 semanas com previsto x realizado | PARCIAL | PARCIAL | Só o caso base; um saldo único, sem quebra por entidade. |
| 20 | Margem do dono, nunca o bruto | SIM | SIM | Frentes, alavancas e funil por margem. |
| 21 | Frescor do dado visível | SIM | SIM | Carimbo e saúde por fonte (plano 114). |
| 22 | Cobertura BSC | PARCIAL | PARCIAL | Funil entrou (plano 109); a perspectiva pessoa, não. |
| 23 | Ritual semanal (scorecard EOS/WBR) | NÃO | **SIM** | Aba Semana: norte, números com dono e meta, revisão fechada. |
| 24 | Cresce sem tocar no HTML | PARCIAL | PARCIAL | Meta de caixa, WIP, tetos e a frente com 4 blocos estão no código. |
| 25 | EOS Visão: norte e prioridades do trimestre | | PARCIAL | Norte existe; prioridade do trimestre, não. |
| 26 | EOS Pessoas: cada setor com dono no organograma | | NÃO | Frentes são lista plana; não há unidade, apoio nem entidade. |
| 27 | EOS Dados: scorecard semanal | | SIM | Números da Semana com dono, meta e semana anterior. |
| 28 | EOS Questões: lista única entre setores (IDS) | | NÃO | Uma frente não tem como abrir questão para outra. |
| 29 | EOS Processo: rito padrão por setor | | PARCIAL | Só uma frente tem ficha própria (4 blocos e check-in), escrita no código. |
| 30 | EOS Tração: prioridades + reunião semanal | | PARCIAL | Revisão semanal existe; sem prioridades nem questões. |

- **18 réguas:** 13 de 18 = **72%** (p4.30: 69%).
- **24 réguas:** 17,5 de 24 = **73%** (p4.30: 67%).
- **30 réguas:** 20 de 30 = **67%**. É a linha de base do cânone com EOS.

## O que está acima do mercado e não se mexe

- **Ação antes de número.** A tela abre em "o que fazer agora". Painel pago abre em KPI.
- **Margem, não receita.** Quase nenhuma ferramenta de mercado ordena por margem do dono.
- **Prova para concluir (LC-14)** e desfazer em todo ato.
- **181+ testes** que cobram a tela, não o código.

## Achados da revisão de 17/10

Achado é o que a régua não pega e a leitura do fonte pega. Cada um vira item de onda.

1. **A empresa não aparece como empresa.** As frentes são uma lista plana. Não há unidade de
   negócio, área de apoio, frente de vida nem entidade (cada CNPJ e a PF). Uma frente não tem como
   abrir assunto para outra; a única ligação entre setores é card↔peça e fluxo↔frente.
2. **Caixa consolidado sem quebra.** Um saldo único soma PF e empresas; o custo de vida PF entra nos
   dias de caixa. Não dá para ver quando uma entidade financia a outra.
3. **Marca e muro.** O painel de tudo veste a marca Dabli Tech. O Igor escolheu manter a marca; por
   isso a salvaguarda do muro (LC-01) vira obrigatória: modo tela compartilhada que esconde o
   privativo.
4. **Rituais incompletos.** Há semanal; o diário saiu na p4.53 (Hoje é o diário). Não há mensal
   (resultado por unidade, valor da hora) nem trimestral (prioridades).
5. **Prateleira.** O banco já entrega valor da hora, horas do mês, produção do dia e fechamentos, e a
   tela ignora; o pior caso das 13 semanas vem e não é lido. As frentes de vida não dão sinal.
6. **Regra no código.** Meta de caixa, limiar de alerta, WIP, teto de cards por dia, corte de
   "parado" e a frente com ficha especial estão fixos no HTML (régua 24).
7. **Comunicação.** O mesmo ato tem três nomes (Largar, Descartar, Arquivar; Concluí, Ok, Feito).
   Quatro blocos somem calados quando vazios e cinco falhas não acendem a saúde. Os docs dizem 6 s
   para desfazer; o código usa 8 s. Há funções e classes sem uso.

## O plano em ondas

Os itens vivem em `plano_item` (ids 169 a 188, criados em 17/10). Esta tabela diz a ordem e o porquê,
não o estado.

| Onda | Itens | O que fecha | Réguas |
|---|---|---|---|
| 0 · Verdade e higiene | W0.1 cânone v02 · W0.2 um verbo por ato · W0.3 vazio e falha falam · W0.4 muro na tela compartilhada | Achados 3 e 7 | 12, 24 |
| 1 · Estrutura no banco | W1.1 unidade e entidade · W1.2 Igor ratifica o mapa · W1.3 parâmetros de gestão · W1.4 caixa por entidade | Achados 1, 2 e 6 (dado) | 19, 24, 26 |
| 2 · Estrutura na tela | W2.1 caixa consolidado e por entidade · W2.2 frentes por unidade · W2.3 ficha padrão de setor · W2.4 tela lê parâmetros | Achados 1, 2 e 6 (tela) | 19, 24, 26, 29 |
| 3 · Setores conversam | W3.1 lista de questões (IDS) · W3.2 depende de / bloqueia · W3.3 index congelado, executor migra | Achado 1 | 28 |
| 4 · Rituais EOS | W4.1 Semana vira L10 · W4.2 prioridades do trimestre · W4.3 fechamento mensal e valor da hora · W4.4 sinal das frentes de vida | Achados 4 e 5 | 22, 25, 30 |
| 5 · Medir e podar | W5.1 cânone v03 e poda do que não foi usado em 30 dias | Fecho | todas |

**Referências por item, para não reinventar:**
- Unidade, apoio e vida com dono: EOS Accountability Chart.
- Quebra por entidade: CPC 22 / IFRS 8, informação por segmento na abordagem gerencial (o que o dono
  usa para decidir, não o formato fiscal).
- Ficha padrão de setor: generaliza a ficha de 4 blocos que já funciona numa frente.
- Lista de questões: EOS Issues List com IDS (identificar, discutir, solucionar).
- Depende de / bloqueia: item bloqueado do Kanban e quadro de dependências entre equipes.
- Semana L10: ordem da reunião Level 10 do EOS.
- Trimestre: Rocks e V/TO do EOS.
- Mensal: DRE gerencial por unidade e pagamento do dono do Profit First.
- Frentes de vida: perspectiva pessoa do Balanced Scorecard.

**A ordem é aritmética, não gosto.**
- **A onda 0 vem primeiro porque mexe em texto que todas as outras reescrevem.** Glossário e estado
  vazio feitos depois custariam o dobro.
- **Banco antes da tela (1 antes de 2).** Tela sem unidade e entidade no banco viraria constante no
  HTML, o mesmo defeito da régua 24.
- **O gate W1.2 trava as ondas 2 a 4.** Agrupar por unidade com mapa errado espalha o erro em quatro
  abas.
- **Estrutura antes de ritual (2 e 3 antes de 4).** A L10 sem unidades nem questões é a Semana de
  hoje com outro nome.

**Execução.** O `presidente.html` é um arquivo só, e duas sessões nele já custaram 194 linhas. Por
isso há uma sessão de tela por vez e, em paralelo, uma de banco (views, tabelas e RPC), dentro do teto
de 4 sessões. O Opus desenha cada onda; a parte mecânica vai a subagente em Sonnet.

| Janela | Sessão de tela | Sessão de banco |
|---|---|---|
| 18 a 22/10 | Onda 0 | Onda 1 (W1.1, W1.3) |
| 23 a 28/10 | testes da onda 0 no ar | W1.4 depois do gate W1.2 |
| 29/10 a 05/11 | Onda 2 | view da ficha de setor, tabelas das ondas 3 e 4 |
| 06 a 14/11 | Onda 3 | views do mensal e do trimestre |
| 15 a 26/11 | Onda 4 | apoio |
| 27/11 a 03/12 | Onda 5 | |

**Gate.** Um por onda, na Mesa: a onda chega como peça com a prova (versão no ar, fumaça verde,
placar remedido) e o Igor aprova ou ajusta em um toque. Pela LC-14 a onda só fecha com a versão no ar.

**Fusões a decidir no gate da onda 0.** O W4.1 absorve os planos 144 (revisão semanal) e 147 (15
números); o W4.3 absorve o plano 5 (Profit First no norte). A fusão fica para o gate do Igor e esta
página não a executa.

**O que deliberadamente fica fora:**
- **Biblioteca de gráfico.** SVG puro resolve, e a CSP por hash continua simples.
- **Ano anterior.** Entra quando houver 12 meses de série.
- **Encerrar o dia de volta.** Já caiu uma vez (p4.53); Hoje é o ritual diário.
- **Preço de transferência entre unidades.** Só entra se aparecer fluxo real de uma unidade servindo
  outra.
- **Fundir o index no presidente.** O presidente engordaria além do piso; o index congela e o que
  importa migra (W3.3).

## Como a evolução é acompanhada

Tudo vai para a `evolucao`, com escopo `00-memoria` e prefixo `painel.presidente_`:
- `canone18_pct`, `canone24_pct` e, desde 17/10, `canone30_pct`;
- `telas_hoje`;
- `palavras` e `numeros`.

`npm run canone` mede as réguas de tela (telas, palavras e números por aba, a 390 e 1280 px), e o teste
`testes/canone.spec.js` reprova na CI a versão que passar do piso. As réguas de julgamento seguem
pontuadas à mão nesta página, a cada onda.
