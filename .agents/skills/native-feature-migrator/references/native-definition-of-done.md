# Native Definition of Done (DoD)

This document is the acceptance contract for converting features to 100% native Android and iOS.

## 1. Zero WebView for Core Feature Flow
- Feature presentation, user interactions, navigation, and feedback must execute in 100% native platform code:
  - **Android**: Kotlin with Jetpack Compose.
  - **iOS**: Swift with SwiftUI.
- No WebView or web wrappers may be used to render the feature's screens, cards, lists, dialogs, or primary interactions.

## 2. Platform Ergonomics & Guidelines
- **Touch Targets**: Minimum 48x48dp (Android Material 3) / 44x44pt (iOS Human Interface Guidelines).
- **Safe Areas**: Proper respect for notch, dynamic island, status bar, and home indicator using system insets.
- **Haptic Feedback**: Meaningful tactile feedback on primary user actions (selection, success, impact).
- **Smooth 120fps Performance**: GPU-accelerated composables and SwiftUI views with zero layout thrashing or stutter.

## 3. Dual-Stack Integrity
- The existing Web and Desktop React/TypeScript codebase must remain protected, intact, and functional for browser and desktop users.
- Capacitor bridge plugins (`registerPlugin`, `@PluginMethod`, `@objc func`) act as the entry point connecting the TypeScript layer to native activities and hosting controllers.

## 4. State, Lifecycle & Offline Persistence
- Handle lifecycle transitions gracefully (pause, backgrounding, process death, configuration change/rotation).
- Implement local persistence and caching so the feature functions offline or with intermittent connectivity.
- Sincronize progress and answers asynchronously with backend contracts (e.g., Supabase) without blocking the UI thread.

## 5. Verification & Parity Matrix
- Complete parity matrix covering: Android implementation, iOS implementation, backend contracts, offline persistence, and test verification.
- Compilação validada sem erros no TypeScript (`tsc --noEmit`) e builds nativas dos módulos.
