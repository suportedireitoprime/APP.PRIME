# Ajuste do Breadcrumb Hierárquico no Cabeçalho do Artigo

- [x] 1. Ajustar construção de `timelineItems` em `ArtigoSheetHeader.tsx`:
  - [x] Separar `titulo` e `tituloDesc` em itens distintos sem parênteses.
  - [x] Separar `capitulo` e `capituloDesc` em itens distintos sem parênteses.
  - [x] Remover adição do artigo (`Art. X`) no final da linha do tempo.
- [x] 2. Ajustar renderização do JSX em `ArtigoSheetHeader.tsx`:
  - [x] Renderizar hierarquia com `ChevronRight` entre cada nó com estilo padronizado `text-zinc-300`.
- [x] 3. Validação e Entrega:
  - [x] Executar checagem de tipos TypeScript (`.\node_modules\.bin\tsc.CMD --noEmit`).
  - [x] Executar build de produção Vite (`.\node_modules\.bin\vite.CMD build`).
  - [x] Auto-commit e push para o repositório remoto.
