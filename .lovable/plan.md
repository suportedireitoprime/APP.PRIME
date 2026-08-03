## Objetivo

Deixar os visuais jurídicos (mapa mental, infográfico, fluxograma, diagrama) mais densos e bonitos, melhorar a navegação das listas (favoritos, recentes, busca por voz) e corrigir o download em PNG/PDF.

---

## 1. Conteúdo mais detalhado (IA)

Ampliar os limites do contrato de conteúdo em `src/lib/visuaisJuridicos/types.ts` e no espelho `supabase/functions/visual-juridico-gerar/prompt.ts` (os dois precisam ficar idênticos):

- Mapa mental: de 3–6 ramos para 4–7 ramos, 3–6 itens por ramo, item até ~70 caracteres, e um novo campo opcional `nota` por ramo (uma linha de destaque/pegadinha de prova).
- Infográfico: 4–8 cartões, texto do cartão até ~200 caracteres, rodapé até ~180.
- Fluxograma: 3–6 decisões, `seNao` até ~70, e campo opcional `base` por decisão (artigo que fundamenta a etapa).
- Diagrama: 2–5 grupos, 3–6 itens por grupo, item até ~64.
- Prompts reescritos para exigir profundidade: exemplo prático, base normativa por bloco, distinção de institutos parecidos e um alerta de prova — mantendo a proibição de inventar artigo/súmula.

O motor de layout já mede o texto antes de posicionar, então mais texto continua sem sobrepor: as caixas crescem.

## 2. Estética do visual (`src/lib/visuaisJuridicos/layout.ts`)

- Cabeçalho: trocar a tag "MAPA MENTAL" por um **cérebro vazado** desenhado em vetor (contorno branco translúcido, grande, no canto direito do cabeçalho, sangrando parcialmente para fora) — ícone próprio por formato (cérebro, camadas, fluxo, rede), todos no mesmo estilo vazado.
- Rodapé: **logo vetorial** centralizado — emblema desenhado + "DIREITO PRIME" e, abaixo, o traço "— Estudos Jurídicos". Rodapé fica mais alto para acomodar a marca, com a linha de fonte à esquerda.
- Ajustes finos: mais respiro entre cartões, sombra mais suave, régua dourada e melhor hierarquia de tamanhos de fonte com o conteúdo maior.

## 3. Altura do visualizador (`src/components/visuais/VisualViewer.tsx`)

- A área do visual passa a ocupar toda a altura disponível, com o desenho ajustado por altura (não só por largura), de forma que o mapa apareça grande de cara e o zoom continue expandindo.
- Zoom vai de 100% a 400%, com passo menor, e pan por arraste.

## 4. Download em PNG/PDF (correção)

O motivo mais provável da falha (a confirmar em teste) é o download por `data:`/`<a download>` não funcionar dentro do app nativo, e o SVG grande falhar ao virar imagem. Correções:

- Rasterizar via `Blob` + `createImageBitmap`/`Image` com fontes embutidas como famílias genéricas (sem dependência de fonte externa), o que também evita texto sumido no PNG.
- Em app nativo (Capacitor): salvar o arquivo com Filesystem e abrir a folha de compartilhamento; na web: manter o blob URL (não `data:`).
- Mensagem de erro real no toast em vez de erro genérico, para diagnosticar caso persista.

## 5. Listas: Todos / Favoritos / Recentes

- Barra de alternância (mesmo padrão do Vade Mecum: Todos, Favoritos, Recentes) tanto na lista de leis/matérias/jurisprudência quanto dentro de uma lei (lista de artigos).
- Novo `src/lib/visuaisJuridicos/prefs.ts` com favoritos e recentes sincronizados (mesma infraestrutura de `leisFavoritos`/`leisRecentes`), com favoritar por toque longo/ícone de coração no item e **tagzinha embaixo** do item favoritado.
- Recentes registrados ao abrir/gerar um visual.

## 6. Busca e voz

- Barra de pesquisa mais alta (mesma altura da busca da home) e com botão de **microfone ao lado** usando o hook de ditado já existente (`useDictation`), preenchendo o campo com o que a pessoa falar.

## 7. Limpeza da lista de artigos

- Remover o item "Lei inteira" e as linhas estruturais (PARTE GERAL, TÍTULO, CAPÍTULO, SEÇÃO, DISPOSIÇÕES...).
- Cada linha fica: "Art. 121" + caput curto em uma linha, altura uniforme.

---

## Detalhes técnicos

Arquivos afetados: `src/lib/visuaisJuridicos/{types,layout}.ts`, novo `prefs.ts`, `supabase/functions/visual-juridico-gerar/prompt.ts` (redeploy da função), `src/components/visuais/{VisuaisJuridicosSheet,VisualViewer,VisualScene}.tsx`.

Visuais já gerados no cache continuam válidos (campos novos são opcionais); os próximos vêm mais completos.
