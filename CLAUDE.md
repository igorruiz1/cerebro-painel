# cerebro-painel

O artefato é o `index.html`. O resto do repo existe para testá-lo e documentá-lo.

## Antes de escrever qualquer linha

Duas sessões trabalharam em paralelo aqui e 194 linhas foram jogadas fora. Então,
no começo de toda sessão, nesta ordem:

```bash
git fetch --all --prune
git log origin/main -5 --oneline
```

e liste os PRs abertos. Se houver PR tocando um arquivo que você vai mexer,
**entre nele** — commit na branch dele. Abrir PR concorrente sobre o mesmo
arquivo é perda garantida.

## Permissões

`docs/permissoes.md` é a fonte. Leia antes de propor qualquer coisa sobre
autorização, allowlist ou modo de sessão.

A página tem uma seção "O que NÃO funciona, para ninguém tentar de novo". O que
está lá foi medido e derrubado: não reabra, não reproponha, não "tente de novo
só para confirmar". Se medir algo que contradiz a página, o commit é **na
página**, trocando a linha antiga pelo fato novo com a data.

## Convenção de PR

- PR sempre **draft**.
- Merge por **squash**.
- CI `fumaça` verde antes do merge — sem exceção. Ela roda em todo push e toda
  proposta de mudança, leva ~3 segundos e existe porque quatro versões do painel
  caíram pela mesma classe de defeito.
- Rodar local antes de empurrar: `npm run teste`.

## Escrita

PT-BR, direto, sem enfeite. Documento explica **por que**, não só o quê — um
número medido vale mais que um parágrafo de intenção.
