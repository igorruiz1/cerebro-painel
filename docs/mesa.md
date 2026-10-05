# Aba Mesa (presidente p4.4, p4.5)

A Mesa mostra o que espera o dono do painel: peças prontas paradas, o que saiu hoje, os relatórios em PDF
e a baixa de envio. Nasceu em 05/10/2026 porque o banco já guardava 33 peças paradas esperando o Igor e
nenhuma tela mostrava isso.

A p4.5 (05/10/2026) fecha o ciclo na própria folha: abrir a cópia da peça e decidir (aprovar, pedir ajuste,
largar). Antes, decidir uma peça da Mesa exigia sair do painel.

## Contrato com o banco

Três RPC e dois buckets. Nada além disso.

| Peça | O que faz |
| --- | --- |
| `rpc("mesa_painel")` | Leitura. Sem argumento. Devolve o jsonb abaixo. Teto: `LIMITE_RECARGA`. |
| `rpc("mesa_baixa_painel", {p_doc, p_canal, p_dest, p_prova_path})` | Baixa de envio. Devolve texto: começa com `OK` (gravou) ou `RECUSADO` (não gravou, com o motivo). Teto: `LIMITE_ACAO`. |
| `rpc("mesa_deliberar", {p_doc, p_decisao, p_nota})` | Decisão sobre a peça (p4.5). `p_decisao`: `aprovado`, `ajustar` ou `largar`. `p_nota`: `null` em `aprovado`; texto obrigatório nos outros dois (a tela não chama o banco sem ele). Devolve texto `OK...` ou `RECUSADO...`, como a baixa. Teto: `LIMITE_ACAO`. |
| bucket `mesa` | PDFs dos relatórios e cópias das peças. Relatório: `createSignedUrl(path, 300)`. Peça: `createSignedUrl(peca, 600)`. |
| bucket `mesa-provas` | Print ou comprovante da baixa, em `AAAA-MM/<id>_<epoch ms>.<ext>`. |

Retorno de `mesa_painel`:

```
{ hoje: "AAAA-MM-DD",
  estoque: [{id, frente, titulo, ato, dest, canal, rs, dias, motivo, copia, novo, peca}],
  em_jogo: number,
  producao_hoje: {A_AGIR, B_FEITO, C_SISTEMA, D_DEMAIS, FORA} | null,
  saiu_hoje: [{id, titulo, dest, prova}],
  horas_mes: number | null,
  valor_hora: {recebido, horas, por_hora, piso, teto} | null,
  relatorios: [{tipo: "dia"|"mes"|"estoque", alvo, versao, titulo, path}] }
```

`peca` (p4.5): caminho da cópia no bucket privado `mesa`, por exemplo `pecas/2095/Cliente-burger_proposta_v02.pdf`,
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
