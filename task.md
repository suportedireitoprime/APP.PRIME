# Ajustes do Horus: Tipografia, Nome, Balão de Voz e Sotaque

- [x] Corrigir mojibake e caracteres especiais em `HorusMainTab.tsx`, `HorusPremiumFeatureSheet.tsx` e `HorusOnboardingOverlay.tsx`.
- [x] Atualizar `AssistenteHorus.tsx` para passar `displayName` para `HorusCallView`.
- [x] Atualizar `HorusCallView.tsx`:
  - [x] Receber `userName` e enviar ao backend e ao prompt inicial (substituindo "DIREITO PRIME" por "Wesley").
  - [x] Corrigir distorção da transcrição (remover re-mount contínuo por `key={transcricao}`).
  - [x] Implementar balão de fala do usuário ("Minha fala") e balão do Horus em tempo real.
  - [x] Corrigir caracteres corrompidos no arquivo.
- [x] Atualizar Edge Function `supabase/functions/horus-live-token/index.ts`:
  - [x] Tratar `userName` do body e consultar `display_name` da tabela `profiles`.
  - [x] Configurar diretiva estrita de sotaque brasileiro paulistano / neutro sem sotaque de Portugal.
- [x] Fazer deploy da Edge Function `horus-live-token`.
- [x] Validar com `tsc --noEmit`.
- [x] Fazer commit e push automático para o GitHub.
