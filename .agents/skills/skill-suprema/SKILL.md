---
name: skill-suprema
description: Skill Suprema 360° de Engenharia de UI/UX, Design Visual Anticlichê, Arquitetura de Componentes, Performance React, Acessibilidade WCAG 2.1 AA, Permissões Nativas Capacitor, PWA/Offline e Telemetria.
---

# 🚀 Skill Suprema (Master Overhaul 360° & UI/UX Engineering)

A **Skill Suprema** reúne todas as diretrizes de design visual de alta fidelidade, arquitetura de componentes, performance React, acessibilidade WCAG 2.1 AA e compatibilidade nativa em um fluxo unificado de auditoria 360°. Inspirada nas melhores práticas globais de UI/UX Engineering (Anthropic, Vercel, AccessLint, UI/UX Pro Max e Bencium).

> 📌 **Regra Obrigatória de Cobertura por Função:** Sempre que a Skill Suprema for acionada para uma **função / módulo do aplicativo** (ex: Flashcards, Biblioteca, Blog, Questões, etc.), a auditoria e as otimizações DEVEM ser aplicadas a **TODAS as rotas, sub-rotas, páginas de estudo, dashboards, editores e visões administrativas que compõem essa funcionalidade**, garantindo 100% de consistência.

---

## 📋 Checkpoints da Skill Suprema

### 1. 📱 Mobile Native, Touch & Capacitor (Android 15 / iOS 18)
- **Permissões & Manifestos:** Validar permissões nativas no `AndroidManifest.xml` / `Info.plist` e chamadas de hardware com `Capacitor.isNativePlatform()`.
- **Safe Area Insets & Margem de Navegação Nativa (Android & iOS):** Garantir ajuste estrito à barra de status (`--sai-top`) e à barra de gestos/navegação inferior do sistema (`--sai-bottom`).
  - **Headers & Navbars Superiores (Safe Area Top):** Todas as barras de navegação superiores (headers, navbars, botões de voltar e topo de modais) DEVEM utilizar a fórmula aditiva `pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))]` ou `top-[calc(1rem+var(--sai-top,0px))]`, NUNCA utilizando `max()` isolado que anula a margem de respiro quando a variável nativa não está presente.
  - **Modais, Sheets de Gabarito & Rodapés de Feedback:** Todos os modais, slides de comentário, overlays e footers de ação (ex: Lei Seca, Questões, Flashcards, Biblioteca, Videoaulas) DEVEM utilizar obrigatoriamente `pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]` no container do botão principal (ex: "Continuar", "Verificar", "Concluir"), impedindo que os botões fiquem cortados ou sobrepostos pela barra do sistema Android/iOS.
  - **Recuo de Alternativas & Conteúdos Roláveis:** Os contêineres de questões, opções de resposta e exercícios DEVEM possuir recuo inferior responsivo (`pb-28 sm:pb-32` ou `pb-[calc(7rem+var(--sai-bottom,0px))]`) para que a última alternativa de resposta (ex: Opção D) nunca fique oculta ou inacessível ao rolar.
  - **Lock de Scroll & Limpeza Nátiva Unificada:** Modais e folhas DEVEM utilizar o hook unificado `useBodyScrollLock(open)` com purga completa de estilos inline (`position`, `top`, `width`, `touchAction`, `pointerEvents`) em `release()` / `resetBodyScrollLock()`, e aplicar `pointerEvents: 'none'` no `exit` do backdrop do `AnimatePresence` para eliminar congelamentos de tela ao fechar.
- **Mini-Player Flutuante Instantâneo:** Ao minimizar uma videoaula ou áudio, a mídia DEVE continuar a execução em segundo plano no mini-player flutuante (PiP) **instantaneamente**, sem congelamentos, delays de buffering ou interrupções de som.
- **Dimensões Tácteis & Feedback:** Alvos de toque mínimos de **48x48dp (Android)** / **44x44pt (iOS)**, uso de `Pressable` com feedback de toque `<100ms` e animações aceleradas por GPU (`transform`, `opacity`).

### 2. 🖥️ Layout Responsivo & Widescreen Desktop
- **Contêineres Widescreen & Aproveitamento de Espaço:** Expandir layouts para `lg:max-w-7xl 2xl:max-w-[1600px] lg:px-8`.
- **Adaptação Responsiva Mobile -> Desktop (Zero Rodapé Fixo no PC):** As ações e ferramentas originalmente no rodapé mobile (ex: "Flashcards", "Pegadinhas", "Resumos", "Lei seca", "Termos", "Questões") NUNCA devem ficar no rodapé fixo no desktop (`lg:hidden`). Elas DEVEM ser convertidas em cards/botões integrados nos painéis laterais (à direita ou à esquerda), posicionados logo abaixo das ações principais do conteúdo (ex: "Favoritar / Concluir"), liberando o rodapé no computador.
- **Sidebar / Lista Lateral de Conteúdos no Desktop:** Em páginas de estudo e videoaulas no desktop, criar uma sidebar/lista lateral (esquerda ou direita) apresentando os cards dos demais itens/vídeos daquela mesma coleção/área para alternância instantânea sem sair da página.
- **Grids de Cards no Desktop:** Exibir catálogos e módulos como **grids de cards responsivos** (3 a 4 colunas no widescreen), e não em carrosséis rasteiros ou listas horizontais simples.
- **Atalhos de Teclado:** Implementar listeners de teclado (`Space`, `Enter`, `Esc`, setas) para navegação ágil no PC.

### 3. 🎨 Design Visual de Elite & Estética Anticlichê (Anthropic & UI/UX Pro Max)
- **Zero "AI Slop":** Banir estética genérica (sem gradientes roxos previsíveis em fundo branco, sem fontes puras repetitivas).
- **Tipografia & Cores:** Tipografia com personalidade, cores dominantes fortes com variáveis CSS HSL e contraste AA/AAA nítido.
- **Microinterações & Glassmorphism:** SVG em vez de emojis para ícones, transições suaves (150-300ms), cartões com opacidade refinada e `backdrop-blur`.

### 4. 🏗️ Arquitetura de Componentes & Padrões de Composição (Vercel Composition)
- **Eliminação de Boolean Props:** Evitar acúmulo de boolean props (`isCompact`, `hasBorder`). Adotar **Compound Components** (ex: `Select.Trigger`, `Select.Content`).
- **Variantes Explícitas & Children:** Usar variantes declarativas e composição via `children` para flexibilidade e reutilização limpa.

### 5. ⚡ Performance React & Eliminação de Waterfalls (Vercel React Best Practices)
- **Zero Waterfalls:** Evitar buscas sequenciais dependentes (`async/Suspense`).
- **Otimização de Bundle:** Eliminar barrel imports desnecessários; usar `lazy()` / `dynamic()` para modais, overlays e telas secundárias.
- **Prevenção de Re-renders:** Subscrição a booleanos derivados, `content-visibility` em listas longas e limpeza estrita de listeners/timers no `useEffect`.

### 6. 🖼️ Otimização de Imagens & Assets (WebP, Preload & FetchPriority)
- **WebP Otimizado:** Uso de imagens `.webp` compactadas com dimensões explícitas.
- **Carregamento Inteligente:** `loading="eager"` + `fetchPriority="high"` para imagens acima da dobra; `loading="lazy"` + `decoding="async"` para o restante.

### 7. ♿ Acessibilidade WCAG 2.1 A/AA & Contraste (AccessLint & Vercel Web Guidelines)
- **Compliance WCAG 2.1 AA:** Razão de contraste mínima de 4.5:1 para texto normal.
- **Proibição de Cor Isolada (WCAG 1.4.1):** Nunca indicar estado ou erro apenas com cor; utilizar ícones, textos e rótulos auxiliares.
- **Atributos ARIA & Foco:** Garantir `role`, `aria-expanded`, `aria-selected`, `aria-controls`, `aria-label` e aneis de foco visíveis (`focus-visible:ring-2`).

### 8. 🌐 PWA, Offline Nativo & Cache Resiliente
- **Auditoria de Disponibilidade Offline Estrita:** Toda funcionalidade sob auditoria DEVE verificar se os dados e mídias principais (módulos de leitura, capas, leis, PDFs, áudios) estão acessíveis sem internet através de cache local (`IndexedDB` / `localStorage` / prefetches de arquivos nativos em `offlineBundle.ts` ou `leituraNativaPrefetch`).
- **Navegação & Mídia Offline:** Garantir que o usuário consiga reproduzir mídias pré-baixadas e navegar em acervos/capas salvas offline.
- **Stale-While-Revalidate & Degradação Graciosa:** Utilizar estratégia stale-while-revalidate e exibir avisos claros de status offline com o `OfflineWatcher` sem bloquear o uso dos conteúdos já baixados.

### 9. ⚙️ Resiliência & Tratamento de Erros API / Supabase
- **Prevenção de Tela Branca:** Isolamento de falhas com `ErrorBoundary`, `LoadingState` (Skeletons) e `EmptyState`.
- **Feedback Transparente:** Tratamento de erros de API com `toast` (sonner) em mensagens compreensíveis.

### 10. 📊 Telemetria, Analytics & SEO Dinâmico
- **SEO Dinâmico:** Atualização do `document.title` por rota, artigo e aba ativa.
- **Rastreamento Unificado:** Registro de pageviews (`useScreenTracking`), tempo de permanência e eventos de engajamento GA4.

---

## 📊 Relatório Final da Auditoria
Ao concluir o overhaul em qualquer funcionalidade, apresentar um resumo discriminado com:
1. **Verificações Realizadas**
2. **Bugs e Ajustes Efetuados**
3. **Status de Compilação & GitHub**


