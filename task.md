# Colorização Vermelha do Símbolo Ordinal (º) nos Parágrafos

- [x] 1. Ajustar expressões regulares e normalização em `artigoTextUtils.tsx`:
  - [x] Atualizar pattern de `§` em `highlightTermosOnly` para capturar `º`/`°` com ou sem espaço após o número.
  - [x] Atualizar pattern de `§§` e `Art.` para suportar indicadores ordinais espaçados e travessões variados.
  - [x] Atualizar `classifyLine` para classificar corretamente parágrafos com indicador espaçado.
  - [x] Normalizar espaçamento de indicadores ordinais em `normalizeLegalLineBreaks`.
- [x] 2. Validação e Entrega:
  - [x] Executar checagem de tipos TypeScript (`.\node_modules\.bin\tsc.CMD --noEmit`).
  - [x] Executar build de produção Vite (`.\node_modules\.bin\vite.CMD build`).
  - [x] Auto-commit e push para o repositório remoto.
