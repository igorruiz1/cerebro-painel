# Instrução por voz no presidente

Botão de microfone no topo do `presidente.html` (p3, 02/10/2026). A instrução falada vira
texto, você revisa e toca em Enviar. O texto entra pela `inbox()`, a mesma porta das outras
instruções do painel, com o prefixo `[voz] `. Desde a p4, o envio acorda o atendente na hora e a
resposta aparece sozinha: ver `docs/resposta-por-evento.md`.

## Para onde a instrução vai (medido em 02/10/2026)

1. **Enviar.** Depois dos 6 s para desfazer, `inbox(p_texto)` confere que é o dono (`is_dono()`) e grava
   uma linha em `comando`: `origem = 'painel'`, `status = 'pendente'`, texto com o prefixo `[voz] `.
2. **Gatilho.** O `INSERT` dispara `trg_comando_acorda_atendente`, que chama `fn_acordar_atendente()` para
   acordar o atendente na hora pela API da rotina (cota do Max). Em 03/10/2026 o token no vault ainda era
   um placeholder, então o despertador nunca tinha disparado; a linha do topo do painel diz o estado medido
   (`atendente_estado()`). O que o gatilho perder, `despertar_reconciliar()` retoma em até 5 min.
3. **Passagem fixa.** Sem o despertador, quem lê a instrução é a passagem agendada do `atendente-1`, 6 vezes
   por dia: 01h58, 03h58, 07h58, 11h58, 15h58 e 19h58 (horário de Cuiabá; medido em `rotina_execucao` de
   29/09 a 02/10). Não há passagem entre 19h58 e 01h58: à noite a espera chegava a cerca de 6 h.
4. **Fechamento.** O atendente executa ou responde e fecha a linha com `comando_processar(id, resultado)`:
   `status = 'processado'` e o `resultado` escrito.

A instrução falada é uma anotação na mesma fila das outras do painel. O atendente trata como ordem do
dono e decide pela constituição, como qualquer outra.

## Por que a voz vira texto antes de chegar ao Claude

A API do Claude não recebe áudio, só texto, imagem e PDF. Então a transcrição acontece antes:

1. **API de transcrição deste aparelho**, se estiver configurada. O painel grava o áudio e manda
   para a URL; a resposta é o texto.
2. **Reconhecimento do navegador** (Web Speech API, grátis). É o motor padrão enquanto a sua API
   não existir.
3. **Nenhum dos dois.** O botão fica desligado e o campo continua aceitando o ditado do teclado do
   celular, que também é grátis.

Decisões do Igor (02/10/2026):

- **Lugar:** botão no topo, sem um quinto destino na barra.
- **Motor:** só a transcrição grátis enquanto não houver API.
- **Envio:** sempre revisar. Nada vai ao banco sem o toque em Enviar, e o envio tem 6 s para
  desfazer. Desfazer devolve o texto para a caixa.
- **API:** presa ao aparelho, porque a voz é só pelo celular.

## Onde a API fica guardada, e por que não no repositório

URL e chave ficam só no `localStorage` do aparelho, na chave `cerebro.voz.api`. O repositório é
público e não guarda endereço nem chave.

**Cuidado medido no desenho:** no GitHub Pages, todos os sites da mesma conta (`<conta>.github.io/*`)
são a mesma origem e enxergam o mesmo `localStorage`. Uma chave fixa guardada ali fica legível por
qualquer outro site publicado na conta. Por isso o painel faz duas coisas:

- **Sem chave**, o padrão: manda o token da sessão do Supabase (`Authorization: Bearer <access_token>`).
  A API confere que é o dono e nenhum segredo fica guardado no aparelho.
- **Com chave:** a chave só vale para o endereço onde foi guardada. Trocar a URL apaga a chave,
  então ela nunca viaja para outro servidor.

Recomendação: use o token da sessão. Se a API exigir uma chave própria, que ela só sirva para
transcrever e tenha teto de gasto.

## Contrato da API (o que o painel já manda e espera)

```
POST <url>
Content-Type: audio/webm | audio/mp4 | audio/ogg   (o que o gravador do aparelho der; iPhone costuma ser audio/mp4)
Authorization: Bearer <token da sessão ou chave guardada>
X-Idioma: pt-BR
corpo: o áudio cru, até 120 s de gravação

200 → {"texto": "instrução transcrita"}
4xx/5xx → {"erro": "motivo legível"}   (o painel mostra o motivo e não envia nada)
```

- **Tempo:** o painel desiste depois de 30 s e avisa.
- **CORS:** a API precisa aceitar a origem do painel e o cabeçalho `Authorization` (preflight `OPTIONS`).
- **Áudio:** a API não guarda o áudio. Ele existe para virar texto e pode ser descartado.
- **Destino do texto:** a API só devolve o texto, não escreve no banco. O texto volta para a caixa
  de revisão, e só o Enviar grava. Assim a regra "sempre revisar" continua de pé com qualquer API.

Caminho sugerido: uma Edge Function do próprio Supabase.

1. Valida o JWT recebido e confere o dono, com a mesma regra de `is_dono()`.
2. Repassa o áudio a um serviço de transcrição com pt-BR.
3. Devolve `{texto}`.

Custo por minuto: ⟨CONFIRMAR: preço do serviço escolhido⟩. Meça antes de ligar.

## O que ainda precisa de medida no aparelho

- **Safari no iPhone:** ⟨CONFIRMAR⟩ se o reconhecimento funciona no navegador e no atalho
  instalado na tela inicial. Em modo instalado ele já foi instável. Se falhar, o painel mostra o
  motivo, e o ditado do teclado continua valendo.
- **Privacidade do motor grátis:** o navegador manda o áudio ao serviço de voz do fabricante (Apple
  ou Google) para transcrever. A tela avisa. Para assunto que não pode sair (LC-01), digite em vez
  de falar.

## Testes

`testes/presidente.spec.js`, com reconhecimento de voz e gravador dublados:

- falar não grava; só Enviar chama `inbox()`; desfazer devolve o texto;
- fechar a tela desliga o microfone; texto curto não vai;
- sem motor, o botão desliga e o campo aceita texto;
- com API, o áudio vai para a URL guardada com a chave e o texto volta para revisar; `http://` sem
  TLS é recusado; a chave não acompanha uma URL nova;
- a 360, 390 e 1280 px, nenhum controle abaixo de 44 px e nenhuma rolagem horizontal com a tela aberta.
