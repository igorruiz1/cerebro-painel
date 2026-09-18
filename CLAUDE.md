# cerebro-painel

O artefato é o `index.html`. O resto do repo existe para testá-lo e documentá-lo.

## Antes de escrever qualquer linha

Duas sessões trabalharam em paralelo aqui e 194 linhas foram jogadas fora. Então,
no começo de toda sessão, nesta ordem:

```bash
git fetch --all --prune
git log origin/main -5 --oneline
curl -s https://api.github.com/repos/igorruiz1/cerebro-painel/pulls?state=open
```

O `gh` **não existe** na máquina do Igor — use a API, como acima. Branch
`claude/*` sem PR aberto é resto de squash merge, não trabalho em curso. Se houver PR tocando um arquivo que você vai mexer,
**entre nele** — commit na branch dele. Abrir PR concorrente sobre o mesmo
arquivo é perda garantida.

## Nuvem e local não são o mesmo ambiente

O mesmo servidor MCP tem nomes diferentes nas duas superfícies, e a regra de
permissão é casada por nome. Confundir as duas escreve um arquivo válido que não
faz nada — sem erro, sem aviso.

| | Sessão de nuvem | Máquina do Igor |
| --- | --- | --- |
| Arquivo que vale | `.claude/settings.json` do repo | `~/.claude/settings.json` |
| Prefixo do Supabase | `mcp__Supabase__` | `mcp__<uuid>__` e `mcp__plugin_<plugin>_<servidor>__` |

A allowlist versionada é a **política** — quais ferramentas. O prefixo é
**endereço** e se descobre na máquina, nunca se escreve aqui.

**Nenhum identificador de conta em arquivo versionado.** Este repo é público:
UUID de conector, id de organização e afins ficam fora. Se uma regra precisa de
um, o script descobre em tempo de execução.

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
