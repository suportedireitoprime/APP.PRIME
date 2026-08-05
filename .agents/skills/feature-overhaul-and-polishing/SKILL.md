---
name: feature-overhaul-and-polishing
description: Auditoria 360°, correção de bugs, aprimoramento de funções e elevação de layout/UX de um módulo ou funcionalidade específica do app (ex: Questões, Vade Mecum, Flashcards). Use sempre que o usuário pedir para revisar, melhorar, auditar ou dar um upgrade completo em um módulo do app.
---

# Skill: Feature Overhaul & Polishing (Revisão 360° de Módulos)

Esta skill guia o agente através de um ciclo completo de **revisão, caça a bugs, aprimoramento de funcionalidades e redesign de interface** para um módulo específico do aplicativo (ex: *Questões, Vade Mecum, Flashcards, Aprender, Audioaulas, etc.*).

## 🚀 Ciclo de Execução em 5 Etapas

Quando o usuário solicitar o aperfeiçoamento de uma área ou módulo:

---

### 1. 🔍 Mapeamento Completo do Módulo (*Feature Mapping*)
- Identificar todas as rotas em `src/App.tsx` pertencentes à funcionalidade.
- Localizar componentes relacionados em `src/components/<modulo>/` e `src/pages/`.
- Mapear os hooks (`use...`), contexto React, tabelas do Supabase e rotinas de armazenamento local (IndexedDB / LocalStorage).

---

### 2. 🐛 Caça aos Bugs & Estabilidade (*Bug Hunting*)
- **Executar Type-Check:** Rodar `pnpm exec tsc --noEmit` para identificar erros de tipo.
- **Tratamento de Exceções:** Verificar se chamadas ao Supabase, APIs e hooks assíncronos possuem `.catch()` ou blocos `try/catch` informativos com `toast.error()`.
- **Memory Leaks:** Garantir que todo `useEffect` com event listeners, intervalos ou canais de subscrição retorne a função de limpeza (`unsubscribe`/`clearInterval`).
- **Validação de Dados:** Prevenir crashes por propriedades indefinidas com *optional chaining* (`?.`) e *nullish coalescing* (`??`).

---

### 3. ⚡ Aprimoramento de Funções & Recursos (*Feature Enrichment*)
- **Desempenho & Caching:** Garantir que buscas e listagens usem React Query / IndexedDB para exibição instantânea e suporte offline.
- **Micro-Interações:** Adicionar atalhos de teclado (ex: `Espaço`, `Esc`, setas), atalhos de voz (`useVoiceInput`/`useDictation`) e resposta tátil (*haptics* nativo).
- **Filtros e Busca:** Adicionar barra de pesquisa rápida com debounce e filtros de estado (todos, favoritos, em andamento, concluídos).

---

### 4. 🎨 Design & Layout Premium (Padrão Lovable & Grandes Empresas)
- **Mobile First + Desktop Expandido:**
  - **Mobile:** Interfaces limpas, áreas de toque generosas (`min-h-[44px]`), barra de ações fixas e *bottom sheets*.
  - **Desktop (Ultrawide / Widescreen):** Em telas grandes (`lg:`, `xl:`, `2xl:`), migrar de listas verticais estreitas para **Grids Multi-Colunas** (`grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) ou **Layout de 2 Colunas (Master-Detail)** aproveitando toda a largura da tela (`max-w-7xl` ou `max-w-[1600px]`).
- **Estética Visual:**
  - Uso de cores HSL tailoadas, fundos escuros com *glassmorphism* (`backdrop-blur-md bg-card/90 border border-white/10`).
  - Animações suaves com `framer-motion` em transições de abas, exibição de cards e modais.
  - Tipografia limpa e hierarquia clara com ícones representativos (`lucide-react`).

---

### 5. ✅ Verificação & Auto-Sync
1. Executar `pnpm exec tsc --noEmit` para garantir compilação sem erros.
2. Executar automaticamente a sincronização Git (`git add .`, `git commit`, `git push`).
3. Apresentar ao usuário um resumo executivo com os arquivos modificados e as melhorias aplicadas.
