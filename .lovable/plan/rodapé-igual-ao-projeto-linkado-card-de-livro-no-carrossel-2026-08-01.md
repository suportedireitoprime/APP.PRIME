# Rodapé igual ao projeto linkado + card de livro no carrossel

## 1. Rodapé (bottom nav) 100% igual

Hoje o nosso rodapé (`src/components/vademecum/BottomNav.tsx`, usado na home mobile) tem: Notícias, Chat, **Ferramentas** no botão central flutuante, Assistente, Meu Espaço. O botão central usa um círculo de 72px com `-top-8`, o que causa a sobreposição que você viu.

Vou replicar exatamente a estrutura do rodapé do projeto "Remix of Remix of DIREITO PRIME ANTIGO":

- Mesma casca: `border-t border-white/10 bg-hero-panel backdrop-blur-md rounded-t-2xl`, mesma sombra, `max-w-2xl mx-auto px-2 py-2`, grid de 5 colunas `items-stretch` — ou seja, a mesma altura e o mesmo respiro do projeto linkado.
- Mesmo botão central: círculo de **64px (w-16 h-16)** em `-top-7`, ícone `Scale` 8x8, brilho passando periodicamente, spacer invisível para alinhar o rótulo na mesma linha de base dos outros. Isso elimina a sobreposição.
- Mesmos ícones/tamanhos nos demais slots (8x8, strokeWidth 1.2, rótulo 11px) e mesmo estado ativo (`bg-white/15 ring-1 ring-white/25`).

Ordem final dos 5 slots:

| Slot | Antes | Depois |
|---|---|---|
| 1 | Notícias | **Ferramentas** (abre o menu de ferramentas que já existe) |
| 2 | Chat | Chat |
| 3 (central) | Ferramentas | **Vade Mecum** → `/vade-mecum` |
| 4 | Assistente | Assistente |
| 5 | Meu Espaço | Meu Espaço |

Comportamentos que já temos (hápticos, prefetch de rotas, esconder ao abrir o menu lateral, safe-area no app nativo) são mantidos.

## 2. Card dedicado de livro no carrossel do início

No projeto linkado o carrossel mistura blog, vídeo, notícia e **livro**, e o livro tem um card próprio vermelho. Vou trazer isso para o nosso `HomeNoticiasCarousel`:

- Novo tipo de item `livro`, alimentado pela tabela `biblioteca_classicos` (campos `livro`, `autor`, `area`, `imagem`, `link`), só com registros que têm capa.
- Cabeçalho dinâmico do carrossel ganha a variação **"RECOMENDAÇÃO DE LIVRO — clássicos e obras do Direito"** com o ícone de biblioteca, igual ao print.
- Card com o design idêntico: fundo em degradê bordô/vermelho, balança e martelo desenhados em SVG a 10% de opacidade no fundo, capa do livro à esquerda (118px, sombra forte), à direita chip "CLÁSSICO", linha com relógio + autor/área, título em 2 linhas, botão circular com seta no canto superior direito e o brilho que atravessa o card quando ele está ativo.
- Toque no card leva à biblioteca de clássicos.
- O livro entra no ciclo de rotação junto com blog/notícia/obra, sem repetir antes de esgotar a fila.

## Detalhes técnicos

- `src/components/vademecum/BottomNav.tsx`: reescrever apenas o bloco `<nav>` (casca + 5 slots) copiando classes e medidas do `src/components/BottomNav.tsx` do projeto linkado; manter os sheets e handlers atuais.
- `src/components/vademecum/HomeNoticiasCarousel.tsx`: adicionar `{ kind: 'livro' }` ao `FeedItem`, fila `livroQueueRef`, fetch no Supabase, entrada no `CYCLE` e o ramo de render do card.
- `src/index.css`: adicionar os tokens `--brand-burgundy-mid` / `--brand-burgundy-deep` com os mesmos valores do projeto linkado, para o degradê do card sair na cor exata (sem hardcode de cor nos componentes).
- Verificação: build de produção + captura da home mobile no preview para conferir rodapé e card lado a lado com o print.
