# Remoção de Tutoriais e Balões Flutuantes (Vade Mecum & Assistente WhatsApp)

- [x] 1. Remover tutorial de cards flutuantes em `src/pages/VadeMecum.tsx`:
  - [x] Remover import de `VadeMecumTutorialOverlay`.
  - [x] Remover estado `tutorialOpen`, verificação em `useEffect` e callback `fecharTutorial`.
  - [x] Remover blocos `<AnimatePresence>{tutorialOpen && ...}</AnimatePresence>` no desktop e mobile.
- [x] 2. Limpeza de arquivo órfão:
  - [x] Remover `src/components/vademecum/overlays/VadeMecumTutorialOverlay.tsx`.
- [x] 3. Remover balãozinho de conversa do Assistente no WhatsApp em `HomeTabEstudos.tsx`:
  - [x] Remover estados `showBubble` e `bubblePhrase`.
  - [x] Remover efeito de exibição de balão e persistência em `sessionStorage`.
  - [x] Remover JSX do balão de fala.
  - [x] Limpar import não utilizado `X`.
- [x] 4. Validação e Entrega:
  - [x] Executar checagem de tipos TypeScript (`.\node_modules\.bin\tsc.CMD --noEmit`).
  - [x] Executar build de produção Vite (`.\node_modules\.bin\vite.CMD build`).
  - [x] Auto-commit e push para o repositório remoto.
