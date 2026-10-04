# Resposta por evento no presidente

p4, 03/10/2026. O toque no painel acorda o atendente na hora e a resposta aparece na tela sozinha.
Antes, tudo o que precisava do Claude esperava a passagem fixa da rotina.

## Por que (medido em 03/10/2026, últimos 30 dias)

| Interação | Caminho | Espera |
| --- | --- | --- |
| Verbo em card (Concluí, Mudar data, Largar) | `agir()` grava na hora | 0 s, já era instantâneo |
| "Quero uma recomendação" (deliberar, 121 em 30 dias) | `dialogo` → atendente | p50 11 min, p90 2,2 h |
| Texto e voz | `inbox()` → `comando` → atendente | p50 50 min, p90 6,7 h, máx. 9,4 h |

O caminho por evento já existia no banco (`trg_dialogo_acorda_atendente`, `trg_comando_acorda_atendente`
→ `fn_acordar_atendente` → `pg_net` → API da rotina) e **nunca disparou**: o token no vault é um
placeholder desde 24/08 (`webhook_disparo.ultimo_status = 'token ausente ou placeholder'`, 0 despertares
em 7 dias). Quem respondia era só a rotina `atendente-1`, 6 vezes por dia, sem nenhuma entre 19h58 e 01h58.

## Decisões do Igor (03/10/2026, por pergunta clicável)

- **Sem gasto além do plano Max.** Chave de API paga está fora. Isso derrubou o desenho de "pista
  rápida" (Edge Function chamando a API do Claude, resposta em segundos).
- **Rotina por evento + tela viva.** O padrão do agente assíncrono (Copilot coding agent, Linear
  Agents): o recibo sai na hora, o agente pega em minutos e o resultado chega por push.
- **Janela de 2 min** para juntar toques seguidos numa sessão só (já configurada em `webhook_disparo`).
- **Rodadas fixas de 6 para 2 por dia**, como varredura (07h58 e 19h58). **Só depois do aceite.**
- **Aceite (LC-14):** p90 de no máximo 10 min nos 5 primeiros despertares reais, com o print de um comando seu
  respondido dentro do limite.
- **Fio curto por card:** até 3 trocas em 7 dias; depois, sessão com o Claude.

## Como funciona

```
toque → agir()/inbox() grava (0 s) → gatilho do INSERT → fn_acordar_atendente
      → pg_net POST /v1/claude_code/routines/{id}/fire (cota do Max, 100 por hora)
      → sessão do atendente responde em dialogo/comando
      → Realtime (publicação supabase_realtime, RLS is_dono) → a tela avisa e redesenha
```

- **`atendente_estado()`** diz à tela o que o banco mediu: despertador ligado ou sem token, último
  despertar, código HTTP que a API devolveu, sessão viva, pendentes e próxima passagem (de
  `proxima_passagem_rotina`, que lê `rotina.cron_utc`). O recibo nunca promete um despertar que não houve.
- **`despertar_reconciliar()`** (pg_cron, a cada 5 min, só SQL, não gasta cota se não houver nada) pega o que o
  gatilho perdeu, 5 min depois do último despertar (eram 15; caiu depois da medida abaixo): despertar suprimido porque havia sessão viva, ou POST que falhou. É o par "watch +
  resync" dos controladores. **Só acorda por item que nenhuma sessão viu** (criado depois do último
  ponto do `atendente-1`). Item que o atendente viu e deixou pendente de propósito não re-acorda;
  sem essa guarda, cada pendência velha gastaria cota do Max a cada 15 min.
- **Sem Realtime** (rede ruim, iPhone suspendeu o socket), a tela confere o estado ao voltar para o
  primeiro plano e, só enquanto houver item esperando, uma vez por minuto.

## Medido em 03/10/2026, depois do token

| Evento | Horário (Cuiabá) | Resultado |
| --- | --- | --- |
| Disparo de teste, sem item novo | 13h07m35s | HTTP 200; gate às 13h07m48s (13 s) deu PARE, como devia |
| Deliberação real no t1545 | 16h05m51s | HTTP 200; gate às 16h06m03s (12 s); resposta às 16h07m03s: **73 s** do toque à resposta |

Antes: p50 de 11 min e p90 de 2,2 h no deliberar. A partida da sessão na nuvem, que a doc oficial não
publica, ficou em 12 a 13 s.

**Dois defeitos achados no caminho, já corrigidos no banco:**

1. **O gate matava o despertar.** `despachar()` responde PARE a qualquer EXECUCAO ok dos últimos 20 min
   ("RE-FIRE do mesmo slot"), e `fn_acordar_atendente` grava exatamente uma, com artefato
   `despertar-por-evento`, antes do POST. Toda sessão acordada pararia no gate. Agora essa linha não conta, e
   item pendente criado depois da última passagem é trabalho novo, não re-fire. Provado numa transação
   desfeita: passagem repetida sem nada novo dá PARE; instrução nova dá SIGA.
2. **A rotina antiga não tinha dono.** Criada por MCP em 15/08 (`created_via: meta_mcp`), ela não aparece em
   claude.ai/code/routines e não tem onde gerar token. Foi recriada pela interface como
   **"Atendente + Executor · nativa v1"**, só com Supabase e Google Drive, sem repositório (cada repositório é
   clonado a cada execução e atrasa a partida). O agente não edita agenda de rotina criada pela interface:
   só o Igor muda os horários dela.

**Transição até o aceite** (03/10 a 04/10): a rotina antiga seguiu com as 6 passagens e a nativa recebeu
os eventos. O gate barra execução duplicada em menos de 20 min.

## Aceite fechado em 04/10/2026 (fato 1230)

Critério do Igor: 5 despertares reais válidos com p90 até 10 min, mais prova.

| # | Instrução | Do toque à resposta |
| --- | --- | --- |
| 1 | deliberação do Igor, t1545 (03/10) | 73 s |
| 2 | deliberação do Igor (03/10) | 80 s |
| 3 | deliberação do Igor, 06h41 (04/10) | 254 s |
| 4 | recomendação pedida pelo Claude a pedido do Igor, dialogo 209 | 59 s |
| 5 | anotação pedida pelo Claude a pedido do Igor, comando 499 | 42 s |

Uma falha no caminho, corrigida: a anotação 495 foi respondida em 5 min, mas a sessão não conseguiu
gravar. `update comando` pelo MCP deu timeout 5 vezes, e a resposta levou 41 min para aparecer no painel.

## Agenda final (04/10/2026, fato 1231)

O agente não edita a agenda de rotina criada pela interface: `update_trigger` é recusado na nativa. Edita a
criada por agente. Ficou assim:

- **Rotina antiga = agenda.** `58 11,23 * * *`, ou seja, 07h58 e 19h58 em Cuiabá. Ela segura o conector
  Claude Code Remote, então a rede do check-in (passo 2.1) continua de pé. `rotina.trigger_id` aponta para
  ela, com `janela_horas` 13: com 2 passagens o vão é de 12 h, e a janela antiga de 8 h daria ATRASADA falsa.
- **Rotina nativa = canal de eventos.** `webhook_disparo.routine_id`. Ainda tem uma passagem às 09h20, que
  só o Igor tira pela interface; ela custa um gate e PARE quando não há nada.
- **Não dá alarme falso:** `v_ccr_divergente` não acusa ÓRFÃ para gatilho declarado em `webhook_disparo`,
  nem PEDE APROVAÇÃO para rotina sem `permission_mode` (a interface não tem esse seletor).
- **Teste diário:** `testar_despertador()` no `vigia_testes`, com 6 casos: gate PARE e SIGA, reconciliador
  com item visto e com item não visto, estado sem token, canal de evento não órfão.

## Regras que valem daqui em diante

- **Escrita por função, nunca UPDATE cru.** Desde 04/10, UPDATE direto pelo MCP do Supabase às vezes trava
  até o timeout e a escrita se perde em silêncio (t1592, trava 919). Chamada de função passa. O procedimento
  do atendente (versão 11) escreve só por `comando_processar`, `tarefa_tentativa`, `tarefa_preparo_feito`,
  `tarefa_concluir` e `tarefa_declarar_ambiente`.
- **Instrução feita pelo Claude vai por `inbox()`, nunca por `deliberar()`.** O `deliberar()` grava a
  recomendação do card como "SUA DELIBERAÇÃO" com `gerada_por = 'igor'`. Em 04/10 isso sobrescreveu a
  recomendação do fluxo 276 com atribuição falsa; ela foi restaurada da `recomendacao_sombra`.
- **Foto de rotinas só completa.** Uma foto parcial em `ccr_trigger_snapshot` (1 linha, 04/10 08h56) fez
  todas as outras rotinas aparecerem como FANTASMA.

## O que NÃO é o caminho, para ninguém reabrir

| Ideia | Por que não |
| --- | --- |
| Edge Function com a API do Claude | resposta em segundos, mas cobra por token; o Igor fechou "só o Max" |
| Reativar `atendente-deliberacao` (sensor de 10 min) | depende do mesmo token, é schedule e trava 30 min entre disparos |
| Deploy de Edge Function da nuvem | `deploy_edge_function` é negado de propósito (docs/permissoes.md); este desenho não precisa de nenhuma |
| Remote Control | é para pessoa controlar sessão, não para código mandar mensagem |

**Fase 2, só se o p90 medido incomodar:** sessão Claude Code aberta no PC com Channels (research
preview, login do Max) respondendo em segundos, com a rotina como reserva quando o PC estiver
desligado. Hoje o PC não serve de base: os scripts dele só batem ponto desde 02/10, das 06h às 17h.
