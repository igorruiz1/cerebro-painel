# Aba Mesa (presidente p4.4, p4.5, p4.12)

A Mesa mostra o que espera o dono do painel: peças prontas paradas, o que saiu hoje, os relatórios em PDF
e a baixa de envio. Nasceu em 05/10/2026 porque o banco já guardava 33 peças paradas esperando o Igor e
nenhuma tela mostrava isso.

A p4.5 (05/10/2026) fecha o ciclo na própria folha: abrir a cópia da peça e decidir (aprovar, pedir ajuste,
largar). Antes, decidir uma peça da Mesa exigia sair do painel.

A p4.12 (06/10/2026, s03) faz da Mesa o ritual de fim de dia, no molde do "daily shutdown" do Sunsama. Motivo
medido: desde a p4.5 o banco tinha **0 deliberações e 0 baixas pelo painel** com 40 peças paradas (13 delas há 7
dias ou mais), e o fechamento do dia abria direto no PDF, sem lugar para ciência, com v01, v02 e v03 do mesmo dia
misturadas.

- **Encerrar o dia**: passa peça por peça (novas primeiro, depois maior valor e mais parada). Decisão ou baixa
  gravada vai para a próxima; Pular passa sem gravar; Parar volta à mesa. No fim, `mesa_ciencia()` grava o dia
  com quantas ficaram pendentes, adiadas e decididas. É essa conta que diz se a mesa fechou limpa.
- **Adiar**: `mesa_deliberar(doc, 'adiar', 'AAAA-MM-DD')` (vazio = amanhã, até 30 dias). Não muda a gaveta; tira a
  peça da conta do dia até a data. Qualquer outra decisão limpa o adiamento.
- **Relatórios**: só a versão vigente de cada tipo+alvo. O toque abre a folha (ciência do dia, versões
  anteriores); o PDF sai do botão "Abrir o PDF".

A p4.14 (06/10/2026, s03) põe Hoje e Mesa numa fila só, no molde da lista Hoje do Things e da caixa do Linear.
Medido antes: nenhuma ligação entre peça e card no banco, e 5 a 6 de 48 peças eram o trabalho de um card aberto.

- `mesa_item.tarefa_id` liga a peça ao card que é o mesmo trabalho; `fecha_tarefa` diz se a prova da peça conclui
  o card. Liga por `mesa_ligar_card(doc, tarefa, fecha)`, na triagem das 21h (passo 1b da rotina mesa-do-igor).
- Hoje mostra os cards do dia mais as peças novas e as 3 paradas de maior valor; adiada nunca entra. Peça ligada a
  card de Hoje não repete: aparece dentro da folha do card. O tempo da peça entra na conta do dia (10 min ler,
  aprovar ou decidir; 15 min enviar, assinar, entregar ou protocolar).
- A baixa (`mesa_baixa_painel`) ou a aprovação que tira a peça da mesa chama `mesa_fechar_card_ligado`, que conclui o
  card pelo `agir_nucleo` com a linha de prova, só se `fecha_tarefa`. Adiar, ajustar e largar não fecham card.

## Contrato com o banco

Quatro RPC e dois buckets. Nada além disso.

| Peça | O que faz |
| --- | --- |
| `rpc("mesa_painel")` | Leitura. Sem argumento. Devolve o jsonb abaixo. Teto: `LIMITE_RECARGA`. |
| `rpc("mesa_baixa_painel", {p_doc, p_canal, p_dest, p_prova_path})` | Baixa de envio. Devolve texto: começa com `OK` (gravou) ou `RECUSADO` (não gravou, com o motivo). Teto: `LIMITE_ACAO`. |
| `rpc("mesa_deliberar", {p_doc, p_decisao, p_nota})` | Decisão sobre a peça (p4.5; `adiar` na p4.12). `p_decisao`: `aprovado`, `ajustar`, `largar` ou `adiar`. `p_nota`: `null` em `aprovado`; texto obrigatório em `ajustar` e `largar` (a tela não chama o banco sem ele); data `AAAA-MM-DD` em `adiar`. Devolve texto `OK...` ou `RECUSADO...`, como a baixa. Teto: `LIMITE_ACAO`. |
| `rpc("mesa_ciencia", {p_dia, p_nota})` | Ciência do fechamento do dia (p4.12). `p_dia` null = hoje; aceita até 31 dias para trás. Grava em `mesa_fechamento` as contagens do momento. Devolve `OK...` ou `RECUSADO...`. Teto: `LIMITE_ACAO`. |
| bucket `mesa` | PDFs dos relatórios e cópias das peças. Relatório: `createSignedUrl(path, 300)`. Peça: `createSignedUrl(peca, 600)`. |
| bucket `mesa-provas` | Print ou comprovante da baixa, em `AAAA-MM/<id>_<epoch ms>.<ext>`. |

Retorno de `mesa_painel`:

```
{ hoje: "AAAA-MM-DD",
  estoque: [{id, frente, titulo, ato, dest, canal, rs, dias, motivo, copia, novo, peca, adiado_ate, tarefa, fecha_tarefa}],
  pendentes_hoje: number, adiadas_hoje: number, decididas_hoje: number,
  fechamentos: [{dia, ciente_em, pendentes, adiadas, decididas}],
  em_jogo: number,
  producao_hoje: {A_AGIR, B_FEITO, C_SISTEMA, D_DEMAIS, FORA} | null,
  saiu_hoje: [{id, titulo, dest, prova}],
  horas_mes: number | null,
  valor_hora: {recebido, horas, por_hora, piso, teto} | null,
  relatorios: [{tipo: "dia"|"mes"|"estoque", alvo, versao, titulo, path, anteriores: [{versao, path}]}] }
```

`peca` (p4.5): caminho da cópia no bucket privado `mesa`, por exemplo `pecas/2095/cliente-exemplo_proposta_v02.pdf`,
ou `null` enquanto a cópia não subiu. A cópia sai do PC na rotina de hora em hora; com `null` a folha diz
isso em vez de mostrar um botão que não abre nada.

`p_canal` aceito pela tela: `whatsapp`, `gmail`, `email_corporativo`, `em_maos`, `protocolo`, `outro`.
Sem `p_prova_path` (null), o banco registra a baixa como declaração datada; com ele, como prova documental.

## Regras que a tela cumpre

- Código do banco nunca aparece cru. Ato vira substantivo (aprovar: aprovação), canal vira nome
  (gmail: E-mail), prova vira frase (documental: com comprovante). Código desconhecido vira rótulo genérico.
- Baixa sem canal não chama o banco (LC-14: concluir sem prova não grava). Sem destinatário também não.
- O print sobe antes da RPC. Se não subir, nada é gravado.
- Decisão (p4.5): Aprovar chama `mesa_deliberar` direto. Pedir ajuste e Largar abrem um campo ("O que
  ajustar", "Por que largar"); vazio não chama o banco e diz o que falta. `OK` fecha a folha, avisa e
  recarrega a aba; `RECUSADO` fica na folha com o texto do banco. Aprovar tira da mesa o que é leitura ou
  decisão; o que é envio continua lá até a baixa.
- Uma escrita por vez: enquanto a decisão ou a baixa grava, a outra não sai.
- Erro de leitura fica na própria aba; erro de relatório e de baixa vira aviso. Nunca tela em branco.
- O relatório e a peça abrem numa aba criada no toque, que recebe o link depois. Medido no iPhone:
  `window.open` feito depois de esperar o banco é bloqueado como pop-up.

## Como replicar em outro projeto

1. Copie do `presidente.html` o bloco JS entre `/* modulo:mesa` e `/* fim modulo:mesa */` e o CSS entre
   `/* estilo:mesa` e `/* fim estilo:mesa */`. Nenhum dos dois tem nome de pessoa ou id de projeto.
2. A casca precisa oferecer: `sb` (cliente supabase-js), `comTetoR`, `LIMITE_RECARGA`, `LIMITE_ACAO`, `esc`,
   `toast(texto, classe, comBotao, ms)`, `mostrarFolha(html)`, `fecharFolha()`, `nomeFrente(slug)` e `rs(valor)`,
   além das classes `pri`, `sec`, `chip`, `chips`, `bloco`, `rot`, `campo`, `pilha`, `vazio`, `aviso`, `mut`, `l2`.
3. Ponha na página `<div id="ms-raiz" class="ms-raiz"></div>` e, se houver navegação com selo,
   elementos `#n-mesa` e `#r-mesa`.
4. Chame `msCarregar()` ao abrir a aba e no recarregar, e `msRender()` quando a casca redesenhar.
5. Crie no banco as três RPC e os dois buckets com a mesma RLS de dono. Os testes do módulo estão em
   `testes/presidente.spec.js`, nos testes que começam com "Mesa:".
