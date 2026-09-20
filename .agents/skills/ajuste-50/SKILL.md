---
name: ajuste-50
description: "Executa uma auditoria implacável de 50 pontos reais (não inventados) focados em Supabase, Performance React, Tipagem, UI/UX e Native (Capacitor) em todas as rotas do projeto."
---

# Skill Suprema: Ajuste 50 (Auditoria Profunda Nível Antigravity)

Esta skill deve ser chamada quando o usuário exigir uma varredura extrema de 50 pontos (bugs, otimizações de performance, refatorações reais e precisas) em uma funcionalidade ou no aplicativo inteiro.

**MANDAMENTO:** NUNCA invente problemas genéricos. Use ferramentas de busca (`grep_search`, `run_command` com tsc, AST) para encontrar falhas REAIS nestes 50 vetores.

## Metodologia de Varredura (Os 50 Vetores)

### 🚀 1. Banco de Dados e Network (Supabase)
1. **Queries Desprotegidas:** Buscar `.select('*')` sem filtro ou limite de linhas.
2. **N+1 Queries:** Identificar chamadas `.from()` dentro de `map()` ou loops em vez de `in()`.
3. **Falta de `.single()`/`.maybeSingle()`:** Uso de limites `limit(1)` onde `.single()` era apropriado.
4. **Listener Sem Cleanup:** Inscrições `supabase.channel()` que não possuem `removeChannel()` no unmount do `useEffect`.
5. **Cold Starts Edge Functions:** Identificar funções que demoram e precisam de keep-alive ou pré-aquecimento.
6. **Submissões Repetidas:** Botões de form sem `disabled={isLoading}`, gerando duplo insert no banco.
7. **Cache Local vs Rede:** Chamadas constantes à mesma tabela (ex: perfis) que deveriam usar `idb-keyval` via Service Worker.
8. **Invalidação de Cache Ineficiente:** Falta de `queryClient.invalidateQueries` após Mutações (React Query).
9. **Excesso de Payload:** Download de blobs em JSON ao invés de buscar `publicUrl` de Buckets.
10. **RLS Bypassing:** Validação se há chamadas no frontend sem filtragem de `.eq('user_id', session.user.id)`.

### ⚡ 2. React Performance e DOM
11. **Ausência de `React.memo`:** Componentes de listas densas que renderizam a cada scroll.
12. **Objetos no Array de Dependências:** `useEffect` disparando repetidamente por causa de objetos literais `{}` no array.
13. **Imagens Rasterizadas Pesadas:** Ausência de `loading="lazy"` e `decoding="async"` nas imagens abaixo da dobra (above-the-fold).
14. **Pré-Carregamento Inexistente:** Rotas críticas não possuindo `.preload()` em botões que apontam para elas.
15. **Contextos Gigantes:** Re-renders massivos por colocar variáveis que mudam frequentemente no mesmo `Context` de variáveis estáticas.
16. **Memória no `setInterval`:** Temporizadores ou EventListeners globais que não possuem função de retorno (cleanup) em `useEffect`.
17. **Virtualização Ausente:** Listas com mais de 50 itens sem `@tanstack/react-virtual`.
18. **Layout Thrashing:** Animações baseadas em `height` ou `top` ao invés de `transform` e `opacity`.
19. **Erros Silenciosos de Hydration:** Inconsistências de UI entre SSR (Vite) e cliente por timestamps locais sem `useEffect`.
20. **Tamanho Excessivo do Bundle:** Falta de `React.lazy()` ou Imports diretos pesando rotas principais.

### 📱 3. Capacitor & Native (Mobile)
21. **Toques Zumbi (Ghost Clicks):** Botões iOS exigindo clique duplo por falta de tap debounce.
22. **Quebra de Safe Area:** Ausência do `env(safe-area-inset-bottom)` em rodapés, cortando controles no iOS.
23. **StatusBar Overlay:** Background do header da página em conflito visual com a StatusBar (texto preto no fundo escuro).
24. **Haptic Feedback Desnecessário/Faltante:** Ausência de `Haptics.impact()` em botões primários.
25. **Uso Indevido de APIs Nativas na Web:** Chamadas do Capacitor rodando sem a proteção `Capacitor.isNativePlatform()`.
26. **Lock de Scroll:** Modal aberto que não trava o body (`useBodyScrollLock`), gerando scroll duplo.
27. **Teclado Virtual Sobrepondo Inputs:** Formulários que não rolam automaticamente (`scrollIntoView`) ao abrir o teclado virtual (`@capacitor/keyboard`).
28. **Vazamento de Áudio Background:** Plugins de Mídia que não fecham a thread nativa ao destruir o componente de áudio.
29. **Back Button Trap:** Android hardware back button não interceptado nas modais (fecha o app em vez da modal).
30. **Demora na Splash Screen:** `SplashScreen.hide()` chamado muito tarde no ciclo de vida da UI inicial.

### 🎨 4. UI/UX e Tailwind (Design)
31. **Contraste Acessibilidade (WCAG):** Textos cinzas escuros em fundos pretos não atingindo índice AAA.
32. **Tap Targets Pequenos:** Botões/ícones de ação no mobile com altura/largura inferior a `44px` ou `48px`.
33. **Flicker em Tema Escuro:** Ausência de `backgroundColor` hardcoded no HTML impedindo a tela branca instantânea no boot.
34. **Animações "Pausadas" (Janky):** Transições do Framer Motion usando `layoutId` em componentes irmãos complexos não otimizados.
35. **Erros de Z-Index:** Notificações (Toasts) ou Modais escondidas debaixo de headers com `z-index` flutuante arbitrário.
36. **Ausência de Feedback de Interação:** Botões sem classes `active:scale-95` para resposta imediata de toque (Material Touch).
37. **Tipografia Hardcoded:** Uso de pixels diretos ao invés de classes `text-sm`, `text-lg` ou medidas relativas (rem).
38. **Scroll Horizontal Quebrado:** Contêineres de carousel sem `snap-x mandatory` para parar o scroll suavemente no card.
39. **Feedback de 'Empty State' Ausente:** Listas vazias exibindo uma tela em branco em vez de uma ilustração amigável ou call-to-action.
40. **Desvio do Padrão Visual:** Telas usando componentes desatualizados em vez do sistema atual (`AppHeader`, `AppPage`, etc).

### 🛡️ 5. Refatoração, Código e Tipagem Estrita
41. **Any Implícito/Explícito:** Detecção de `try catch (e: any)` e mapeamentos `map((x: any) => ...)` ao longo do código.
42. **Componentes Ciclópicos:** Arquivos `.tsx` ultrapassando 500 linhas sem separação em sub-chunks locais.
43. **Variáveis Mágicas (Magic Strings):** Rotas de API e chaves do Supabase hardcoded ao invés de centralizadas num arquivo de Constants.
44. **Envelopamento Falso (Promessas):** Uso de métodos assíncronos (`async/await`) que não são seguidos de tratamento `.catch()`.
45. **Redundância de Estilos:** Uso extensivo de classes CSS padrão misturadas, que deveriam virar um `@apply` ou componente base.
46. **Dependências Zumbi:** Bibliotecas importadas no `package.json` mas que nunca são usadas no código (`npx depcheck`).
47. **Loggers Abandonados:** `console.log()` ou `console.error()` sobrando no ambiente de produção.
48. **Condicionais Sujas:** Encadeamento severo de `? : ? :` na marcação JSX, quebrando a legibilidade (extrair para funções separadas).
49. **Tipos Supabase Desatualizados:** Falta de reflexo no banco (`Database` types) que gera erros de runtime escondidos no Type Checking.
50. **Missing Error Boundary:** Partes vitais da árvore de renderização (ex: leitores de PDF/ThreeJS) suscetíveis a crashes não possuindo `ErrorBoundary` com visual de recarregamento elegante.

## Como Executar
1. Leia o código correspondente via `grep_search` e `view_file`.
2. Cruze a funcionalidade com os **50 pontos acima**.
3. Elabore um Artifact com a lista daqueles que realmente afetam a base avaliada.
4. Peça para o usuário indicar qual/quais pontos ele deseja atacar primeiro.
