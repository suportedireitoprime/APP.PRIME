---
name: performance-optimization
description: Guia de otimização de desempenho para React, Vite e Supabase. Use ao analisar tempo de carregamento, consumo de memória, tamanho do bundle, re-renders e resposta de rotas.
---

# Skill: Performance Optimization (React + Vite + Supabase)

Esta skill orienta a auditoria e melhoria contínua de desempenho do aplicativo.

## 🚀 Diretrizes Principais

### 1. Code Splitting e Lazy Loading
- **Rotas com `lazy()`:** Todas as páginas não críticas devem ser carregadas dinamicamente usando `lazy(() => import(...))` combinados com `<Suspense fallback={...}>`.
- **Pre-fetching de Rotas:** Usar `prefetchRoute()` ou `requestIdleCallback` para pré-carregar recursos de páginas de alta prioridade.

### 2. Otimização de Re-renders no React
- **Memoização Seletiva:** Usar `React.memo`, `useMemo` e `useCallback` em componentes renderizados dentro de listas extensas (como artigos de leis, busca e cartões de cursos).
- **Evitar Inline Objects em Props:** Não passar objetos `{}` ou arrays `[]` instanciados inline em props de componentes pesados.

### 3. Caching e Queries Eficientes
- **TanStack Query / React Query:** Garantir `staleTime` adequado (mínimo 5-10 min para dados estáticos como leis e jurisprudência).
- **IndexedDB Persister:** Manter persister de cache ativado para inicializações instantâneas offline/cold boot.

### 4. Virtualização de Listas Longas
- Em listas com mais de 50 itens (ex: Vade Mecum, lista de artigos ou buscas), utilizar `@tanstack/react-virtual` para renderizar apenas os elementos visíveis na janela de visualização (*viewport*).
