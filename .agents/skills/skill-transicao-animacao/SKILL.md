---
name: skill-transicao-animacao
description: Especialista em criar transições fluidas e animações premium (Framer Motion / GSAP) para todos os componentes e rotas de uma funcionalidade.
---

# 🎨 Skill: Transição e Animação Fluida

Esta skill transforma interfaces estáticas em experiências dinâmicas, fluidas e de alto nível (padrão premium/Apple-like), utilizando **Framer Motion** (ou GSAP) para React.

## 🎯 Objetivo da Skill
Quando o usuário solicitar a aplicação desta skill em uma área específica (ex: "Biblioteca", "Flashcards", "Home"), você deve localizar **TODOS** os componentes, páginas, modais e listas relacionados a essa área e aplicar animações sistematicamente.

## 📜 Diretrizes de Animação

### 1. Transições de Página (Page Transitions)
Toda troca de rota deve ser suave.
- Utilize o componente `<PageTransition>` existente no projeto ou envolva a página principal em um `<motion.div>` com `initial`, `animate` e `exit`.
- **Animação Padrão:** Fade In sutil com um leve deslocamento (slide up ou scale up).
```tsx
<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -15 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {children}
</motion.div>
```

### 2. Animação de Listas e Grids (Staggering)
Elementos repetidos (cards, itens de lista, botões) NUNCA devem aparecer de uma vez só. Eles devem entrar em cascata (stagger).
- Use `variants` no container e nos filhos (`staggerChildren`).
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}
```

### 3. Micro-interações (Hover e Tap)
Botões e cards interativos devem responder ao toque.
- Em mobile, o feedback de `whileTap` é essencial.
- Em desktop, o feedback de `whileHover` deve ser sutil.
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.96 }}
>
```

### 4. Modais, Drawers e Sheets
Devem usar animações de física tipo `spring` (mola) para parecerem naturais, nunca "mecânicas" ou lineares.
- **Spring natural:** `stiffness: 400, damping: 30`

### 5. Fallbacks e Performance
- Evite animar propriedades de layout pesadas (`width`, `height`, `top`, `left`). Priorize `transform` (`x`, `y`, `scale`) e `opacity`.
- Em dispositivos de baixa performance ou preferências de acessibilidade (`prefers-reduced-motion`), as animações devem degradar graciosamente.

## 🚀 Como Executar a Tarefa
1. **Mapeamento:** Busque os arquivos principais da seção (ex: `src/pages/Biblioteca.tsx`, `src/components/biblioteca/*`).
2. **Importação:** Adicione `import { motion, AnimatePresence } from 'framer-motion';`.
3. **Refatoração:** Transforme divs estáticas (`<div>`) em (`<motion.div>`).
4. **Aplicação:** Configure os atributos `initial`, `animate`, `exit`, `variants` e `transition` conforme o contexto (página, card, botão, lista).
5. **Revisão:** Verifique se as animações não quebram o layout (overflow, z-index).
