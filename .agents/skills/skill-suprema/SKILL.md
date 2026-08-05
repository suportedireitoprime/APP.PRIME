---
name: skill-suprema
description: Skill Suprema de Auditoria 360°, Performance, Responsividade Desktop/Mobile, Permissões Nativas Capacitor, Imagens WebP, Acessibilidade, Resiliência PWA/Offline, Telemetria e Otimização Geral do Aplicativo.
---

# 🚀 Skill Suprema (All-in-One Master Overhaul 360°)

A **Skill Suprema** reúne todas as diretrizes de qualidade, performance, design responsivo, acessibilidade e compatibilidade nativa em um fluxo unificado de auditoria 360°.

---

## 📋 Checkpoints da Skill Suprema

### 1. 📱 Mobile Native & Capacitor (Android 15 / iOS 18)
- **Permissões & Manifestos:** Verificar se as permissões nativas (áudio, microfone, armazenamento, notificações) estão declaradas no `AndroidManifest.xml` / `Info.plist` e se chamadas Capacitor usam `Capacitor.isNativePlatform()`.
- **Prevenção de Crash & Congelamento:** Proteger reprodução de áudios/vídeos com `try/catch` e fallbacks em caso de perda de conexão.
- **Safe Area Insets:** Garantir que nenhum elemento fique sob a barra de status superior (`--sai-top`) ou barra de gestos inferior (`--sai-bottom`).
- **Dimensões Tácteis:** Mínimo **48x48dp (Android)** / **44x44pt (iOS)** e espaçamento mínimo de 8px entre botões.

### 2. 🖥️ Layout Responsivo Desktop
- **Contêineres Widescreen:** Expandir telas para `lg:max-w-7xl 2xl:max-w-[1600px] lg:px-8`.
- **Grids Multi-Colunas:** Converter listas verticais simples em grids adaptativos (2, 3, 4 ou 6 colunas no desktop).
- **Atalhos de Teclado:** Incluir listeners (`Space`, `Enter`, `Esc`, setas, teclas numéricas `1-5`/`A-E`) para navegação agilizada no PC.

### 3. ⚡ Performance & Memória
- **Zero Memory Leaks:** Limpar subscrições do Supabase, `setInterval`, `setTimeout` e `window.addEventListener` no `useEffect` cleanup.
- **Cancelamento de Requisições:** Interromper buscas ativas ao desmontar componentes (`alive` / `cancelled` flag ou `AbortController`).

### 4. 🖼️ Otimização de Imagens (WebP & Preload)
- **Conversão WebP:** Garantir uso de imagens `.webp` otimizadas e compactadas.
- **Carregamento Inteligente:** Usar `loading="lazy"` para itens fora da tela inicial, `decoding="async"` e `fetchPriority="high"` para imagens acima da dobra.

### 5. ♿ Acessibilidade (A11y), Contraste e Screen Readers
- **Atributos ARIA:** Declarar `aria-label`, `aria-expanded`, `aria-selected`, `aria-controls` e `role` apropriados em elementos interativos.
- **Foco & Teclado:** Garantir navegação acessível por tabulação (`tabIndex`), aneis de foco visíveis (`focus-visible:ring-2`) e manipuladores de eventos de teclado.
- **Contraste de Cores:** Manter contraste adequado (nível AA/AAA) entre texto e plano de fundo (suporte a temas escuro e claro).

### 6. 🌐 PWA, Offline & Cache Resiliente
- **Cache Local & Stale-While-Revalidate:** Armazenamento em localStorage/IndexedDB com expiração TTL inteligente.
- **Degradação Graciosa:** Oferecer funcionalidade offline com `OfflineWatcher` e avisos visuais amigáveis.

### 7. ⚙️ Resiliência & Tratamento de Erros API / Supabase
- **Prevenção de Tela Branca:** Proteger componentes com `ErrorBoundary`, Skeletons e componentes de estado vazio (`EmptyState`).
- **Feedbacks ao Usuário:** Notificar erros e confirmações via `toast` (sonner) com mensagens claras e capturas de exceção não-fatais.

### 8. 📊 Telemetria, Analytics & Rastreamento GA4
- **Screen & Page Tracking:** Registrar visualização de telas via `recordActivity`, `trackPageview` e `useScreenTracking`.
- **Métricas de Engajamento:** Mapear ações relevantes (curtidas, favoritos, compartilhamentos, filtros e tempos de leitura).

### 9. 🔍 SEO Dinâmico & Meta-Tags Open Graph
- **Títulos Dinâmicos:** Atualizar o `document.title` de acordo com a rota, artigo ou filtro ativo.
- **Meta-Tags e Compartilhamento:** Estruturar links de compartilhamento social com URL canônica e preview rico.

---

## 📊 Relatório Final da Auditoria
Ao concluir o overhaul em qualquer funcionalidade, apresentar um resumo discriminado com:
1. **Verificações Realizadas**
2. **Bugs e Ajustes Efetuados**
3. **Status de Compilação & GitHub**

