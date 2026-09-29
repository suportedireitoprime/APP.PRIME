# Tarefa: Eliminar Modelo Free de Voz e Padronizar Narração Gemini TTS Instantânea

- [x] Criar plano de implementação detalhado (`implementation_plan.md`) <!-- id: 0 -->
- [x] Refatorar `useArtigoNarracao.ts` <!-- id: 1 -->
  - [x] Remover completamente o fallback para `speakNative` (SpeechSynthesis gratuito do navegador)
  - [x] Corrigir `force_regenerate: false` para reutilizar o áudio gerado pelo Gemini instantaneamente
  - [x] Otimizar `handleNarrarButtonPress` para disparar instantaneamente sem menus intermediários desnecessários
  - [x] Garantir inferência resiliente de `tabelaNome` para nunca falhar por falta de identificador de lei
  - [x] Tratar erros de áudio com feedback visual claro e retry, sem voz robótica
- [x] Integrar no leitor nativo mobile (`ArtigoBottomSheet.tsx`, `ArtigoNativeActivity.kt`, `ArtigoView.swift`) <!-- id: 2 -->
  - [x] Passar `audioUrl` na transição do `NativeVadeMecumPlugin.openArtigo`
  - [x] Eliminar fallback de voz sintética robótica gratuita no mobile
- [x] Testar e validar compilação TypeScript (`tsc --noEmit`) <!-- id: 3 -->
- [x] Validar build de produção (`vite build`) <!-- id: 4 -->
- [x] Git Auto-Commit & Push conforme regras do projeto <!-- id: 5 -->
