---
name: capacitor-native-audit
description: Auditoria de plugins e recursos nativos do Capacitor (Android/iOS). Use para validar permissões, StatusBar, SafeArea, Push Notifications, Armazenamento Nativo e integração de hardware.
---

# Skill: Capacitor & Native Mobile Audit

Esta skill é responsável por auditá a integração entre o aplicativo web (React) e a camada nativa Capacitor (Android e iOS).

## 📱 Verificações de Integração Nativa

### 1. Suporte Seguro a Fallbacks na Web
- **`Capacitor.isNativePlatform()`:** Toda chamada a plugins nativos (ex: `@capacitor/haptics`, `@capacitor-community/safe-area`, `@capacitor/filesystem`, `@capacitor/push-notifications`) DEVE ser encapsulada por verificações `Capacitor.isNativePlatform()`.
- **Prevenção de Crash em Navegadores:** Se o usuário acessar pela Web/Vite preview, os plugins nativos não devem disparar erros não tratados.

### 2. Status Bar, Safe Areas e Splash Screen
- **Android 15 / Edge-to-Edge:** Garantir uso do `@capacitor-community/safe-area` para injetar variáveis CSS `--safe-area-inset-*` evitando que conteúdos fiquem sob a status bar ou gesture bar.
- **Gerenciamento de Splash Screen:** Garantir que `SplashScreen.hide()` seja chamado com segurança no ciclo de boot (`main.tsx`) sem congelar a WebView.

### 3. Permissões Nativas em Tempo de Execução
- **Push e Armazenamento:** Solicitar permissões nativas (*Runtime Permissions*) apenas mediante ação contextual do usuário (ex: ao ativar notificações ou realizar download de PDFs offline).
