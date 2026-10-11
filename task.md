# Checklist - Bug de Assinatura Pro / Expiração Indevida

- [ ] 1. Localizar onde a tela do print é renderizada (ex: `AdminMonitorUsuarios` ou `AdminAssinantes`) e verificar de onde vem a coroa e a contagem
- [ ] 2. Analisar `useSubscription.ts` e verificar a regra de checagem de assinatura ativa no cliente
- [ ] 3. Checar Edge Functions de pagamento/assinatura e regras de expiração no Supabase
- [ ] 4. Identificar a divergência que faz o cliente ver "expirado/renove" enquanto no admin está ativo
- [ ] 5. Corrigir a causa raiz no código/Edge Functions
- [ ] 6. Validar com `tsc.CMD --noEmit` e auto-commit & push
