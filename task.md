# Tarefa: Corrigir exibição indevida do card/modal de tempo esgotado na Landing Page e para Admin

- [x] Corrigir `GlobalTrialGate` em `src/AppRoutes.tsx` (bloquear execução para `!user`, rotas públicas e admins) <!-- id: 0 -->
- [x] Corrigir `GlobalPromoFloatingCard.tsx` (remover fallback guest, bloquear na Landing Page e para admin) <!-- id: 1 -->
- [x] Otimizar bypass de admin em `useSubscription.ts` para resolução síncrona sem queries desnecessárias <!-- id: 2 -->
- [x] Ajustar `TrialExpiredModal.tsx` e `PremiumGate.tsx` para validação estrita de usuário e bypass de admin <!-- id: 3 -->
- [x] Validar com `tsc --noEmit` <!-- id: 4 -->
- [x] Auto-commit e push no GitHub <!-- id: 5 -->
