# Modo demonstração (presidente p4.12, endereço e dois perfis na p4.70)

Para vender o método mostrando o próprio painel, sem expor dado de cliente. Pedido do Igor em 06/10/2026, inspirado
no botão "Ver demonstração com dados fictícios" de um painel de mercado.

## Como funciona

- Entra de dois jeitos. De dentro do painel já aberto, pelo link **demonstração** no trilho ou **Modo
  demonstração** no rodapé. Ou, desde a p4.70 (t3627), pelo endereço `presidente.html?demo=1` ou `?demo=2`,
  **sem login**: é a conta de exemplo do Notion, do Monday e do Pipefy. Os dois caminhos marcam a aba na
  `sessionStorage` (`cerebro.demo` e `cerebro.demo.perfil`); apagar o `?demo` da barra não abre o painel real.
- Dois perfis, trocados pelo seletor do aviso: **1, Engenheiro** (consultoria de obras, contrato PJ, obra
  residencial, startup com sócio, cobrança e vida pessoal) e **2, Empresário** (empresa de manutenção e limpeza
  predial: contratos com condomínios, comercial, equipe de 38 pessoas, compras e frota, filial nova e vida
  pessoal). Cada perfil é uma função de dados (`demoEngenheiro`, `demoServicos`) com os mesmos ids de card, fluxo
  e peça; o motor (caixa por semana e por entidade, ficha da frente, cliente falso) é um só. O fôlego e o menor
  saldo da Semana saem da mesma conta do Caixa e do Hoje, para as abas não se contradizerem na frente de alguém.
- Com o modo ligado, o cliente do Supabase **não é criado**. A página usa `demoCliente()`, que responde às mesmas
  RPC e views com dados inventados (bloco `modulo:demo`) e muda só a memória da página. Nada sai para banco,
  Storage, Realtime ou API de voz; o PDF e a peça abrem uma página local dizendo que o documento é fictício.
- A marca vira "Cérebro · Demo", a aba do navegador diz "Demonstração"; bastidor, segurança e sair somem; o
  aviso do topo diz que os dados são fictícios e que nada é gravado.
- **Sair** pede o código do app autenticador antes de qualquer dado real, mesmo com sessão aal2: numa venda,
  quem segura o celular é o cliente. Conta sem segundo fator sai da sessão e entra de novo. Aberta pelo endereço,
  a saída tira o `?demo` da barra.

## Decisões

- ~~Só pelo celular do dono, em venda presencial (decisão do Igor, 06/10/2026).~~ Trocada em 17/10/2026 (fato
  2523, t3627): para o lançamento de 18/10, o cérebro vai ao celular de convidados só em modo demonstração,
  aberto pelo endereço, sem sessão. Não há o que proteger no link: o dado da demonstração já está no fonte, que é
  público, e o painel real continua atrás de senha e segundo fator.
- Dados com a estrutura do cérebro real e texto inventado à mão. Nunca cópia anonimizada: uma troca que falhe
  vaza dado de cliente, e o repositório é público.

## Testes

`testes/presidente.spec.js`, os que começam com "Demonstracao" (rodam nos dois perfis): nenhum `createClient`,
nenhuma requisição de rede além de fonte e CDN, marca neutra, 44 px e sem rolagem a 360 px, saída com código e o
bloco `modulo:demo` sem nenhum nome real (lista de proibidos em SHA-256: pessoa, empresa, banco, cidade, ids do
projeto e da organização).

Os que começam com "t3627" cobram a entrada pelo endereço, sem duble de sessão: `createClient` armado para
estourar, nenhum pedido a endereço do Supabase, nenhum websocket, e o texto de cada aba e do card aberto, nos dois
perfis, passando pela mesma lista de proibidos. Uma sonda prova que o filtro de rede enxerga o Supabase, e uma
mutação (nome real num título do perfil 2) foi medida reprovando em 17/10/2026.
