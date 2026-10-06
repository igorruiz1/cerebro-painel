# Modo demonstração (presidente p4.12)

Para vender o método mostrando o próprio painel, sem expor dado de cliente. Pedido do Igor em 06/10/2026, inspirado
no botão "Ver demonstração com dados fictícios" de um painel de mercado.

## Como funciona

- Entra pelo link **demonstração** no trilho ou **Modo demonstração** no rodapé, de dentro do painel já aberto.
  Fica marcado na `sessionStorage` (`cerebro.demo`) e a página recarrega.
- Com o modo ligado, o cliente do Supabase **não é criado**. A página usa `demoCliente()`, que responde às mesmas
  RPC e views com dados inventados (bloco `modulo:demo`) e muda só a memória da página. Nada sai para banco,
  Storage, Realtime ou API de voz; o PDF e a peça abrem uma página local dizendo que o documento é fictício.
- A marca vira "Cérebro · Demo"; bastidor, segurança e sair somem; um aviso fixo diz que nada é gravado.
- **Sair** pede o código do app autenticador antes de qualquer dado real, mesmo com sessão aal2: numa venda,
  quem segura o celular é o cliente. Conta sem segundo fator sai da sessão e entra de novo.

## Decisões

- Só pelo celular do dono, em venda presencial. Link aberto para terceiros fica para quando houver segurança
  própria para isso (decisão do Igor, 06/10/2026).
- Dados com a estrutura do cérebro real e texto inventado à mão. Nunca cópia anonimizada: uma troca que falhe
  vaza dado de cliente, e o repositório é público.

## Testes

`testes/presidente.spec.js`, os que começam com "Demonstracao:": nenhum `createClient`, nenhuma requisição de
rede além de fonte e CDN, marca neutra, 44 px e sem rolagem a 360 px, saída com código e o bloco `modulo:demo`
sem nenhum nome real (lista de proibidos no teste: pessoa, empresa, banco, cidade, id do projeto).
