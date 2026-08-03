# Padrão visual das capas do Blog

> Fonte de verdade: `src/data/blogCoverStyle.json` (v3)
> Espelho no servidor: `supabase/functions/_shared/blog-cover-style-v2.ts`
> Referência visual: o painel do "Blogger Jurídico" (`src/components/vademecum/BlogHeroHeader.tsx`) com as figuras vazadas de `src/assets/covers/`.

Toda capa nova **deve** seguir este padrão. Nada de cenário pintado, gravura sépia, foto, 3D ou fundo preto.

## Regras rígidas

- **Fundo**: painel chapado na **cor do tema**, gradiente diagonal (mais claro no topo-direito, mais escuro no rodapé-esquerdo). Preenche 100% do quadro, 16:9.
- **Motivos de fundo**: balança, `§`, livro aberto, coluna jônica e pena em *line art* bem apagado (12-20% de contraste, só contorno), 4-6 deles cortados pelas bordas, mais um grid fino de pontos.
- **Figura**: **uma só**, vazada (recorte, sem cenário), apoiada na base, num terço lateral ou centralizada, ocupando 55-70% da altura, nunca cortada na cabeça/mãos. Um único adereço vazado ao lado.
- **Estilo**: vetorial chapado, contornos escuros finos/médios, sombreamento em 2-3 tons.
- **Paleta da figura**: creme `#EFE1BD`, pele `#EFE0C4`, neutro quente `#C9A26A`, marrom `#6B3F1D`, bordô `#8C1220`, dourado.
- **Texto**: nenhum (no máximo uma palavra curta na lombada de um livro).

## Regras anti-repetição

- **NUNCA** repita figura, adereço ou lado do quadro de uma capa anterior — o gerador recebe as últimas capas em `evitar`.
- Se duas capas ficarem parecidas (mesma figura, mesma cor), regere uma delas.

## Como gerar uma nova capa

Use `imagegen--generate_image` com o `prompt_template` de `blogCoverStyle.json`, substituindo `{SUJEITO}`, `{ADORNO}`, `{LADO}`, `{ACCENT_HEX}` e `{ACCENT_NAME}` (este último vem de `theme_accents`).

- `model`: `standard`
- `width` / `height`: `1536 x 864` (16:9)
- `target_path`: `src/assets/blog/<slug>.webp`

No blog automático isso é feito pelo servidor: `buildCoverPrompt()` em
`supabase/functions/_shared/blog-cover-style-v2.ts`, chamado pelo
`blog-edicao-runner`.

## Como usar no código

1. Salve a imagem em `src/assets/blog/<slug>.webp`.
2. Importe em `src/data/blogPosts.ts` e use como `imagem_url` do post.
