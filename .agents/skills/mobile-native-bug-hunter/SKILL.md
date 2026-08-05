---
name: mobile-native-bug-hunter
description: Auditoria profunda e caça a bugs nativos mobile (Android/iOS Capacitor). Identifica congelamentos de tela, cliques travados, vazamento de memória, erros de rede mobile e otimiza responsividade tátil.
---

# Skill: Mobile Native Bug Hunter

Esta skill fornece uma auditoria especializada para caçar e eliminar bugs em dispositivos móveis (Android e iOS) rodando via Capacitor ou WebView Mobile.

## 🎯 Foco Principal de Auditoria Mobile

1. **Congelamento de Tela e Trava de Cliques (UI Freezes):**
   - Garantir que nenhuma função assíncrona ou loop bloqueie a thread principal (UI Main Loop).
   - Adicionar estado visual de feedback imediato ao tocar (`active:scale-[0.98]`, feedback haptic tátil).

2. **Prevenção de Memory Leaks em WebViews:**
   - Limpar todos os `setInterval`, `setTimeout`, `window.addEventListener` e subscrições do Supabase no `useEffect` cleanup.
   - Cancelar requisições ativas se o usuário fechar a tela antes do retorno (`abortController` ou flag `alive`).

3. **Resiliência de Rede Mobile (4G / 5G / Conexão Instável):**
   - Envelopar chamadas assíncronas em `try/catch` com timeouts e fallbacks locais em cache offline.
   - Evitar telas em branco por falta de internet; exibir mensagens de erro amigáveis com toast ou fallback local.

4. **Área de Toque & Safe Area (Android 15 Edge-to-Edge / iOS Notch):**
   - Garantir que todos os elementos clicáveis tenham altura/largura mínima tátil de 44x44px.
   - Aplicar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` nos contêineres fixos de topo e rodapé.
