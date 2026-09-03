---
name: nativas-compose-e-swiftui
description: Diretrizes de engenharia e padrões para implementar telas e componentes 100% nativos em Jetpack Compose (Kotlin/Android) e SwiftUI (Swift/iOS) com pontes Capacitor, ciclo de vida, navegação nativa e renderização a 120fps.
---

# 🚀 Skill: Telas 100% Nativas em Jetpack Compose (Android) e SwiftUI (iOS)

Esta skill define o padrão de excelência arquitetural para migrar telas críticas do aplicativo (como o leitor do Vade Mecum, reprodutor de áudio, pílulas e visualizadores) para **código 100% nativo**, garantindo fluidez absoluta (60-120fps), latência zero de toque, integração com subsistemas de áudio e haptics nativos, e sincronização bidirecional com a base TypeScript/Supabase.

---

## 🏗️ 1. Princípios Fundamentais de Arquitetura

1. **Dual-Stack Nativo com Ponte Capacitor:**
   - **Android:** Interface construída em **Jetpack Compose** (`ComponentActivity` + `setContent`), áudio via `android.media.MediaPlayer` e `android.speech.tts.TextToSpeech`.
   - **iOS:** Interface construída em **SwiftUI** (`View` hospedada em `UIHostingController`), áudio via `AVFoundation.AVPlayer` e `AVSpeechSynthesizer`.
   - **TypeScript:** Plugin Capacitor (`@capacitor/core` + `registerPlugin`) que expõe métodos assíncronos e escuta eventos de retorno (`notifyListeners`).

2. **Sincronização Bidirecional:**
   - O React envia para a tela nativa o snapshot do artigo (`id`, `numero`, `caput`, `paragrafos`, `incisos`, `highlights`, `audioUrl`).
   - A tela nativa permite grifar, escutar áudio e interagir.
   - Ao alterar grifos ou fechar a tela, emite um evento nativo (`onHighlightsUpdated`, `onClose`) para que o estado React e o Supabase fiquem 100% atualizados.

3. **Fallback Gracioso para Web/Desktop:**
   - Todo fluxo nativo deve manter fallback transparente para navegadores e PWA via `Capacitor.isNativePlatform()`.

---

## 🤖 2. Padrão Android (Jetpack Compose + Kotlin)

### Estrutura dos Arquivos:
- `android/app/src/main/java/.../Native[Modulo]Plugin.kt`: Registra métodos `@PluginMethod` e inicia a Activity via `Intent`.
- `android/app/src/main/java/.../[Modulo]NativeActivity.kt`: `ComponentActivity` com tema escuro imersivo, barra de status integrada (`EdgeToEdge`) e componentes Compose.

### Boas Práticas no Compose:
- **LazyColumn:** Utilizar para listas longas com chave estável (`itemsIndexed(items, key = { i, _ -> i })`).
- **Feedback Tátil:** Chamar `view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)` em seleções e cliques.
- **Áudio Nativo:** Inicializar `MediaPlayer` com `AudioAttributes.USAGE_MEDIA` para reprodução suave em background.
- **TTS Nativo:** Implementar `TextToSpeech.OnInitListener` configurado para `Locale("pt", "BR")`.

---

## 🍏 3. Padrão iOS (SwiftUI + Swift)

### Estrutura dos Arquivos:
- `ios/App/App/Native[Modulo]Plugin.swift`: Subclasse de `CAPPlugin` com métodos `@objc func`.
- `ios/App/App/Native[Modulo]Plugin.m`: Declaração dos métodos exportados via macros `CAP_PLUGIN` e `CAP_PLUGIN_METHOD`.
- `ios/App/App/[Modulo]View.swift`: Estrutura SwiftUI (`View`) com tema escuro (`Color(hex: 0x0D0D0D)`), `ScrollView`, controles táteis e reprodutor de áudio.

### Boas Práticas no SwiftUI:
- **UIHostingController:** Apresentar a view nativa sobre o `rootViewController` usando `.modalPresentationStyle = .fullScreen` ou `.pageSheet`.
- **Haptic Feedback:** `UIImpactFeedbackGenerator(style: .medium).impactOccurred()`.
- **Áudio com AVAudioSession:** Configurar categoria `.playback` com `.duckOthers` para reprodução com tela bloqueada.
- **TTS Nativo:** `AVSpeechSynthesizer` com voz `AVSpeechSynthesisVoice(language: "pt-BR")`.

---

## 🔄 4. Checklist Obrigatório de Validação
- [ ] O plugin está devidamente registrado na `MainActivity.kt` (Android) e possui o arquivo `.m` correspondente (iOS).
- [ ] A tela nativa respeita as Safe Areas (notch e barra de gestos).
- [ ] Cores, contrastes e tipografia respeitam o tema escuro oficial (`#0D0D0D` / `#18181B`).
- [ ] As alterações do usuário (grifos/anotações) são transmitidas de volta para o Supabase e localStorage.
- [ ] TypeScript compila perfeitamente sem erros (`tsc --noEmit`).
