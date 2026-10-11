# Plano de Investigação - Bug de Assinatura Pro / Expiração Prematura

## 1. Problema Relatado
- Usuários como `leandrofs2010@gmail.com` e `limadesouzawagner0@gmail.com` compraram plano Pro anual (cadastrados há 18 e 22 dias).
- No painel administrativo aparecem com coroa (Pro), porém no app do usuário o acesso foi cortado ou aparece o banner/card de assinatura expirada pedindo para assinar novamente.

## 2. Hipóteses a Investigar
- **Cálculo da Data de Expiração (`expires_at`, `period_end`)**: verificar se planos anuais foram gravados com 30 dias por engano ou se houve confusão entre plano mensal e anual.
- **Divergência entre Painel Admin vs `useSubscription`**: como o admin consulta (ex: tabela `profiles`, `subscriptions` ou `user_roles`) versus como o frontend do cliente (`useSubscription.ts`) valida (`status === 'active'`, `expires_at > now()`, etc.).
- **Cache local / Subscriptions Memory Cache**: se o cache `subMemoryCache` ou token JWT não é invalidado após renovação/criação.
- **Edge Function de Webhook (Stripe / Hotmart / Asaas / Kiwify / MercadoPago)**: como a data de expiração anual é calculada no webhook de compra.

## 3. Passos
1. Investigar `useSubscription.ts` e arquivos relacionados a assinatura no cliente.
2. Investigar o painel administrativo (onde mostra a coroa `👑 19x`) para entender de qual tabela/coluna vem o status Pro.
3. Investigar as Edge Functions de webhook de pagamento e renovação.
4. Identificar o bug exato e aplicar correção robusta.
