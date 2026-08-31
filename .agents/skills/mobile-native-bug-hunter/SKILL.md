---
name: mobile-native-bug-hunter
description: Auditoria profunda de bugs nativos, Capacitor, diretrizes Google Material 3 e Apple HIG para mobile. Valida Safe Area insets (topo/rodapé), dimensões de toque (min 48dp/44pt), legibilidade, performance e prevenção de trava de tela.
---

# Skill: Mobile Native Bug Hunter & UX Guidelines (Android 15 / iOS 18)

Esta skill executa uma auditoria completa de código nativo mobile, plugins Capacitor e diretrizes oficiais de interface do **Google Material Design 3** e **Apple Human Interface Guidelines (HIG)**.

## 📱 Diretrizes e Checkpoints Obrigatórios

### 1. Safe Area Insets (Android Gesture Bar & iOS Notch / Dynamic Island)
- **Regra de Ouro:** Nenhum elemento clicável ou texto pode ficar escondido atrás da barra de notificações superior ou da barra de gestos/navegação inferior.
- **Top Inset:** Usar `var(--sai-top, env(safe-area-inset-top, 0px))` ou `pt-[env(safe-area-inset-top)]`.
- **Bottom Inset:** Usar `var(--sai-bottom, env(safe-area-inset-bottom, 0px))` ou `pb-[calc(1rem+env(safe-area-inset-bottom))]`.

### 2. Dimensões Mínimas de Toque (Google & Apple HIG)
- **Tamanho Mínimo Clicável:**
  - Android (Material 3): Mínimo **48x48dp** (48px).
  - iOS (HIG): Mínimo **44x44pt** (44px).
- **Espaçamento Tátil:** Espaço mínimo de 8px entre botões adjacentes para evitar toques acidentais.
- **Padrão Botão de Voltar:** Todo botão de "Voltar" em cabeçalhos (PageHeader) ou modais DEVE usar o padrão premium e maior: `className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center ..."` com ícone `ArrowLeft` `w-6 h-6 sm:w-7 sm:h-7` e `strokeWidth={2.4}`. Nunca faça menor que isso.

### 3. Tipografia & Legibilidade Ergonomica
- **Tamanho Mínimo de Fonte:** Texto principal nunca menor que `14px` (`text-sm`) e rótulos/badges nunca menores que `11px`.
- **Contraste:** Garantir contraste mínimo 4.5:1 para texto em fundos escuros/claros, prevenindo fadiga visual.

### 4. Auditoria de Plugins e Bridge Nativa Capacitor
- **Estado dos Plugins:** Garantir que imports de `@capacitor/core`, `@capacitor/filesystem`, `@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/status-bar` estejam com fallbacks `Capacitor.isNativePlatform()`.
- **Feedback Tátil (Haptics):** Toda ação interativa (abrir lei, favoritar, pesquisar, alternar artigo) deve disparar `haptic.selection()` ou `haptic.impact()`.

### 5. Resiliência de Interface e Memória
- **Zero Scroll Horizontal Acidental:** Contêineres envelopados com `w-full max-w-full overflow-x-hidden`.
- **Cleanup no Unmount:** Cancelar timers e listeners no `useEffect` cleanup.
