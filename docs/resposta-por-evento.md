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

**Transição até o aceite:** a rotina antiga segue com as 6 passagens fixas (`rotina.trigger_id` continua
nela) e a nativa é o canal dos eventos (`webhook_disparo.routine_id`). O gate barra execução duplicada em
menos de 20 min. Depois do aceite, o Igor põe 07h58 e 19h58 na nativa, a antiga é desligada e
`rotina.trigger_id` e `rotina.cron_utc` passam para a nativa juntos.

## O que falta, e de quem é

1. ~~**Igor: colar o token da rotina.**~~ Feito em 03/10 às 13h06, na rotina nativa. Em claude.ai/code → Routines → "Atendente + Executor" → adicionar
   gatilho por API → gerar o token (aparece uma vez). No Supabase: Vault → editar
   `ccr_token_atendente_1` → colar. O token nunca passa por chat nem por arquivo (LC-01).
   Conferência: a linha do topo do painel troca "sem despertador" por "dormindo, acorda no seu toque".
2. **Medir a partida da sessão.** A doc oficial não publica a latência de partida da rotina. Os 5 primeiros
   despertares saem de `rotina_execucao` (`obs like 'despertar por evento:%'`) contra o `respondido_em`
   ou o `processado_em`.
3. **Depois do aceite:** cron da rotina para `58 11,23 * * *` (UTC, 07h58 e 19h58 em Cuiabá) **e**
   `rotina.cron_utc` com o mesmo valor, juntos. Se só um mudar, a "próxima passagem" da tela mente.

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
