---
name: skill-experiencia-do-usuario
description: Skill Suprema de Experiência do Usuário (UX 360°), Animações Fluidas (Framer Motion), Reorganização Inteligente de Layout, Hierarquia Visual, Validação de Funções Supabase e Interatividade Nível Elite.
---

# 🎨 Skill Suprema Final (Master Overhaul 360° & UI/UX Engineering)

> 📌 **Atenção:** Esta skill foi unificada com a Skill Suprema na nova **[skill-suprema-final](../skill-suprema-final/SKILL.md)**. Todas as diretrizes de UX, animações e layout agora estão consolidadas na **Skill Suprema Final**.

---

## 📋 Checkpoints da Skill de Experiência do Usuário

### 1. 🎭 Animações Fluidas & Transições Elegantes (Framer Motion & CSS)
- **Abertura/Fechamento de Modais & Sheets:** Todos os elementos sobrepostos DEVEM abrir e fechar com animações de mola calibradas (`type: 'spring', stiffness: 260, damping: 30` ou `duration: 0.22, ease: 'easeOut'`).
- **Animação de Saída Sem Bloqueios:** Usar `AnimatePresence` com `exit={{ opacity: 0, pointerEvents: 'none' }}` ou `exit={{ y: '100%', pointerEvents: 'none' }}` para que o overlay nunca bloqueie toques durante a transição de saída.
- **Zero Jitter ou Saltos de Layout:** Utilizar `layoutId` do Framer Motion ou transições baseadas puramente em GPU (`transform`, `opacity`) para expansão e retração de elementos sem causar sobressaltos na página.

### 2. 📐 Reorganização Inteligente de Layout & Hierarquia Visual
- **Harmonia & Prioridade de Informação:** Auditar a tela e reorganizar elementos visuais para garantir uma hierarquia clara (título principal -> sub-informações -> ações primárias -> ações secundárias).
- **Redistribuição de Botões & Ações:** Agrupar botões soltos em barras de ação flutuantes (`sticky`) ou cards dedicados com bordas sutis e `backdrop-blur`.
- **Aproveitamento Responsivo (Mobile vs. Desktop):**
  - **Mobile:** Garantir recuos de Safe Area Insets (`pt-[calc(1.25rem+var(--sai-top,0px))]` no topo e `pb-[calc(1.25rem+var(--sai-bottom,0px))]` na base) e espaço de rolagem para listas/questões (`pb-28 sm:pb-32`).
  - **Desktop:** Mover rodapés fixos para sidebars e painéis laterais à direita ou à esquerda, liberando o pé da página no PC.

### 3. 🔗 Conectividade Supabase & Validação de Funções Backend
- **Integração 100% Funcional:** Verificar se todos os botões de ação (curtir, favoritar, salvar, responder, comentar, baixar, navegar) estão devidamente vinculados às tabelas, Edge Functions e RPCs do Supabase sem erros 401/404/500 no console.
- **Updates Otimistas (Optimistic UI):** Em ações de alta frequência (ex: favoritar um item, marcar como concluído), atualizar o estado da interface **imediatamente** antes de aguardar a resposta da rede, revertendo graciosamente apenas em caso de erro.
- **Resiliência Offline:** Garantir que se a rede falhar, os dados locais pré-carregados (IndexedDB / cache) continuem exibindo o conteúdo de forma transparente para o usuário.

### 4. ⚡ Interatividade & Feedback Táctil Imediato
- **Dimensões Tácteis & Haptics:** Garantir alvos de toque confortáveis (mínimo de `48x48dp` em botões) com feedback tátil nativo via `haptic.selection()` ou `haptic.impact()`.
- **Micro-interações de Clique:** Aplicar efeito tátil no clique (`active:scale-[0.97]` ou `hover:bg-white/10 transition-all`).
- **Skeletons Elegantes:** Substituir spinners de carregamento genéricos por Skeletons animados que espelham a estrutura exata do conteúdo final.

### 5. 🛡️ Scroll Lock Seguro & Prevenção de Congelamentos
- **Uso Unificado de `useBodyScrollLock`:** Todos os modais e folhas DEVEM utilizar `useBodyScrollLock(open)` com purga completa de estilos em `release()` / `resetBodyScrollLock()` (`overflow`, `position`, `top`, `width`, `touchAction`, `pointerEvents`), garantindo que a tela principal **nunca fique congelada** após fechar qualquer janela.

---

## 📊 Relatório de Auditoria UX
Ao finalizar a aplicação desta skill em qualquer módulo, fornecer o relatório com:
1. **Rotas e Páginas Auditadas**
2. **Animações e Transições Adicionadas/Otimizadas**
3. **Reorganização de Layout e Hierarquia Aplicadas**
4. **Validação de Funções Supabase & Status de Compilação (`tsc`)**
