# Implementation Plan - Fundo ShapeGrid no Código Penal e Bottom Sheet de Explicação com IA

## Diagnóstico
1. **Fundo do Código Penal (LeiDetailView):**
   - O usuário reportou que no Código Penal o fundo não estava apresentando os quadrados animados como no Vade Mecum (apareciam listras verticais por conta do container com `absolute inset-0` em uma página com scroll longo de milhares de pixels, esticando a proporção do canvas).
   - O fundo deve ser `fixed inset-0 z-0 pointer-events-none` com `ShapeGrid` idêntico ao do Vade Mecum e Bibliotecas.

2. **Explicação Didática no Modal Comparativo (ArtigoComparativoModal):**
   - A explicação com IA estava embutida na página e exibia asteriscos de markdown crus (`**O que mudou...**`).
   - O usuário solicitou:
     - Ter dois botões de ação na tela comparativa: um botão de **"Explicação Didática"** (botão de destaque) e o botão **"Ir para Artigo Completo"**, para que o usuário escolha qual deseja.
     - Remover o ícone de brilho (`Sparkles`).
     - Ao clicar em "Explicação Didática", abrir um **Bottom Sheet** de baixo para cima (`AnimatePresence` / sheet com transição suave).
     - Renderizar o markdown formatado sem asteriscos, com design idêntico ao dos artigos de lei do Vade Mecum (tipografia elegante, blocos modulares, alto contraste e legibilidade impecável).

---

## Estrutura da Implementação

### 1. Fundo ShapeGrid em `LeiDetailView.tsx`
- Alterar o contêiner do `ShapeGrid` para `fixed inset-0 z-0 pointer-events-none opacity-50`.
- Garantir que o canvas permaneça com a proporção exata da viewport (100vw x 100vh), exibindo os quadrados perfeitos animados em 40x40px, sem esticamentos verticais.

### 2. Ações e Bottom Sheet em `ArtigoComparativoModal.tsx`
- Na tela principal do modal comparativo:
  - Exibir bloco de ações com os dois botões:
    1. **Botão Explicação Didática:** cor de destaque (`bg-hero-panel` ou botão estilizado), com ícone neutro/editorial (`BookOpen` ou `GraduationCap`), SEM ícone de brilho.
    2. **Botão Ir para Artigo Completo:** navega direto para o artigo.
- Criar o Bottom Sheet de Explicação Didática:
  - Estado `showExplicacaoSheet`.
  - Animação de subida de baixo para cima com `framer-motion` (`initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}`).
  - Puxador no topo (`handle bar`) e cabeçalho com botão de fechar.
  - Parser/formatador de markdown para converter os tópicos (`1. O que mudou`, `2. Contexto e Finalidade`, `3. Impacto Prático`) em seções estilizadas com cards modulares idênticos aos dos artigos de lei.
  - Ação de regerar explicação caso necessário.

---

## Validação e Versionamento
- Executar `tsc --noEmit` para garantir zero erros de compilação.
- Executar `vite build` para validação do bundle de produção.
- Git auto-commit e push para o repositório no branch `main`.
