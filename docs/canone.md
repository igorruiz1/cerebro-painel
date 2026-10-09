# O presidente contra o cânone

Régua de mercado do `presidente.html` e plano para fechar o que falta. v01, 08/10/2026, s1274.

Este arquivo é público, igual ao resto do repo. Número de caixa, nome de frente e valor de KPI
ficam no banco: aqui entra só o que se mede na tela.

## Por que existe

Em 29/08 o `index.html` v28 foi auditado contra 18 réguas tiradas de modelos que já são referência
(doc 409 do cérebro). Deu 39%, subiu para 56% na v29 e **nunca mais foi remedido**. O
`presidente.html` nasceu depois (p1, 02/10) e virou a casa: o `manifest.json` abre nele. Até esta
rodada, ele nunca tinha passado pela régua.

Uma régua que não acompanha o crescimento vira enfeite. Por isso este arquivo guarda a régua junto
do código. O plano 106 faz um script remedi-la a cada versão e gravar
`painel.presidente_canone24_pct` na `evolucao`.

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

As 6 novas (19 a 24) vêm do que um painel **de dono de empresa** cobra e um painel de operação não:
- tesouraria de 13 semanas com previsto x realizado (IBCS: AC x FC);
- Profit First (margem do dono, não receita);
- observabilidade de dado (frescor visível);
- Balanced Scorecard (financeiro, cliente/funil, processo, pessoa);
- EOS L10 e Amazon WBR como ritual semanal;
- painel governado por dado (cresce sem tocar no HTML).

## Placar da p4.30

Cada régua vale SIM = 1, PARCIAL = 0,5 ou NÃO = 0. A medida foi feita no modo demonstração a 390 e
1280 px, com leitura do fonte.

| # | Régua | p4.30 | Evidência |
|---|---|---|---|
| 1 | Essencial numa tela, sem rolagem | PARCIAL | Hoje ocupa 1,4 tela a 1280 e 2,3 a 390. A frase de situação, o próximo passo e 4 blocos cabem na dobra. |
| 2 | Série temporal | PARCIAL | Zero sparkline. Só a variação de 7 dias (`var7`) e a previsão de 13 semanas. |
| 3 | Número com meta, período anterior ou faixa | PARCIAL | Só o fôlego do caixa traz meta e "desde dd/mm". |
| 4 | Normal x anomalia só olhando | NÃO | Não há banda de normalidade. |
| 5 | Mesmo período do ano anterior | NÃO | A casa tem menos de 12 meses. Entra quando houver. |
| 6 | Entrada controlável antes de saída | SIM | O próximo passo (alavanca) divide a dobra com o fôlego (resultado). |
| 7 | Dono e meta em cada número | PARCIAL | O dono é implícito ("esperando você") e só o caixa tem meta. |
| 8 | 5 a 15 números principais | SIM | 7 números na frase e nos blocos de Hoje. |
| 9 | Teste dos 5 s e leitura em 20 min | SIM | 1.442 palavras nas 5 abas, contra 8.936 do index v28. |
| 10 | Panorama, depois detalhe | SIM | Bloco, lista e folha do card. |
| 11 | Todo vermelho com ação definida | SIM | Cada item vem com verbo: Concluí, Cobrar, nova data. |
| 12 | Alerta por orçamento ou janela dupla | PARCIAL | Só o selo de saúde usa orçamento de erro (`eb`). |
| 13 | Métrica sem uso fora da tela | SIM | Fica no bastidor (`index.html`). |
| 14 | WIP, teto e idade do aberto | SIM | "há N d", "parados: manter ou largar?" e capacidade em horas. |
| 15 | Zero chartjunk | SIM | Um gráfico de barras, sem pizza, gauge ou biblioteca. |
| 16 | Frentes lado a lado | PARCIAL | Lista ordenada por margem, mas com 1 número por frente e sem série. |
| 17 | Celular empilha e prioriza | SIM | Testes a 360 e 390 px, alvo ≥ 44 px, sem rolagem lateral. |
| 18 | Sobrevive sem cor | PARCIAL | O gráfico do caixa usa cor como sinal único (vermelho e laranja). |
| 19 | 13 semanas com previsto x realizado | PARCIAL | Só o caso base. O pior caso e o realizado não aparecem no gráfico. |
| 20 | Margem do dono, nunca o bruto | SIM | Frentes e "melhora o caixa" ordenadas por margem. |
| 21 | Frescor do dado visível | SIM | "dados de hh:mm" e selo de saúde no topo. |
| 22 | Cobertura BSC: financeiro, funil, processo, pessoa | PARCIAL | Tem financeiro e processo. Não tem o funil LC-14 (pronta, enviada, aceita, paga) nem sinal das frentes de vida. |
| 23 | Ritual semanal (scorecard EOS/WBR) | NÃO | O presidente é só diário. O placar semanal vive no bastidor. |
| 24 | Cresce sem tocar no HTML | PARCIAL | Frente nova entra sozinha. KPI ou chave nova pede código (`CHAVES` fixo). |

- **18 réguas:** 12,5 de 18 = **69%**. Comparável com o index: 39% em 29/08 e 56% em 30/08.
- **24 réguas:** 16 de 24 = **67%**. É a linha de base do cânone ampliado.

## O que está acima do mercado e não se mexe

- **Ação antes de número.** A tela abre em "o que fazer agora", não em gráfico. Painel pago abre em
  KPI.
- **Margem, não receita.** Quase nenhuma ferramenta de mercado ordena por margem do dono.
- **Edição.** A tela tem 6 vezes menos palavras e 5 vezes menos números que o index v28, com a mesma
  cobertura de ação.
- **181 testes**, que cobram a tela e não o código: contraste, alvo de toque, CSP por hash e prova
  antes de concluir (LC-14).

## O plano

O dono é `claude` (sessão), `automacao` (rotina) ou `igor`. Os itens vivem em `plano_item` no banco;
esta tabela é cópia de leitura de 08/10.

Em 08/10 este plano foi **fundido com o plano 101**: as 9 propostas que comparam o presidente com o
painel de um parceiro (doc 2482 do cérebro). O Igor aceitou 8 delas; a A6, e-mail não lido como cartão, ficou fora
porque exige um sensor no PC e a A2 já cobre a cobrança. A trava "código só depois de 20/10" caiu,
porque o plano 87 fechou em 07/10.

| Plano | O quê | Dono | Pronto quando | Prazo |
|---|---|---|---|---|
| 102 | `seguranca.html` com CSP por hash | claude | **Feito 08/10** (PR 92), conferido no ar | 10/10 |
| 103 | KPI vermelho em 100% de 30 dias ganha destino | claude | Lista com recalibrar, virar plano com dono ou ir para o bastidor, pronta para o gate | 13/10 |
| 104 | Gate único do presidente | igor | Destino dos vermelhos, números da Semana, sinal das frentes de vida, prazo ou descarte dos itens sem data | 14/10 |
| 106 | Régua do cânone por script a cada versão | claude | Script no repo, gravação por PR, teste de piso | 15/10 |
| 112 | A2 Grupo Cobrar na tela Hoje | claude | Retorno de terceiro vencido sobe para Hoje com rascunho pronto, nunca enviado pela máquina | 16/10 |
| 113 | B2 Teto de estrutura à vista | claude | Fração de sessões na 00-memoria visível; aviso acima de 25% | 16/10 |
| 105 | KPI grava 1 linha por dia | automacao | Linhas/dia ≤ KPIs vivos × 1,2 por 7 dias | 17/10 |
| 114 | A5 Saúde por fonte e ritmo de 7 dias | claude | Hora do último dado de cada fonte, mais cards fechados em 7 dias | 20/10 |
| 111 | Uso do index medido; congelar ou fundir | claude | Pings por página em 14 dias e proposta com recomendação | 22/10 |
| 115 | A3 Concluir em 1 toque | claude | 3 provas prováveis e a prova da LC-14 mantida; fechamentos pelo painel de 19% para 50% | 23/10 |
| 107 | Aba Semana: scorecard EOS + WBR | claude | 5 a 15 números com dono, meta, sparkline de 13 semanas e banda p10-p90 | 27/10 |
| 116 | A1 + Nova e tecla N | claude | Card de uma linha criado na hora, dentro do teto de 8 por dia | 27/10 |
| 109 | Funil LC-14 no Caixa | claude | 4 elos com margem e idade; pronta nunca soma em paga | 30/10 |
| 117 | B1 Sessão aberta pelo card | claude | Abertura ≤ 3.000 caracteres, contra 17.472 | 30/10 |
| 118 | B3 Card só nasce com ato | claude | Cards fechados sem ato de 22% para menos de 10% | 30/10 |
| 119 | A4 Origem legível no card | claude | Origem escrita embaixo do título | 03/11 |
| 108 | Frentes em small multiples | claude | Sparkline de margem de 8 semanas na mesma escala; comparar sem tocar | 06/11 |
| 110 | 13 semanas no padrão IBCS | claude | Realizado ao lado do previsto, erro semanal, pior caso como faixa | 10/11 |

**A ordem é aritmética, não gosto.**
- **O ato vem antes da leitura.** Cobrar, concluir e criar card mexem no caixa e no tempo do Igor já.
  Série, banda e Semana melhoram a leitura de um número que hoje já se lê.
- **O destino dos vermelhos (103/104) vem antes da Semana (107).** Uma Semana com 15 números
  vermelhos permanentes repete o defeito que o index tinha em agosto, só que em tamanho menor.

**O que deliberadamente fica fora:**
- **Biblioteca de gráfico.** Sparkline em SVG puro resolve, e a CSP por hash continua simples.
- **Ano anterior.** Entra quando houver 12 meses de série.
- **Redesenho visual.** A régua 15 já está em SIM.

## Como a evolução é acompanhada

Tudo vai para a `evolucao`, com escopo `00-memoria` e prefixo `painel.presidente_`:
- `canone18_pct` e `canone24_pct`;
- `telas_hoje`;
- `palavras` e `numeros`.

O plano 106 automatiza a gravação. Até ele entrar, toda versão nova do presidente remede à mão.
