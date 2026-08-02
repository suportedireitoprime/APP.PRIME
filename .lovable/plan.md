## Objetivo

Assinatura 100% pelas lojas (Google Play + App Store), com preços **R$ 29,90/mês** e **R$ 199,90/ano**. Remover completamente Asaas/PIX/cartão e recriar os IDs de produto.

---

## Parte 1 — Novos IDs de produto

Os atuais (`vade_mecum_mensal`, `vade_mecum_anual`, base plan `anual-parcelado`) são do projeto antigo. Proposta de nomenclatura nova, igual nas duas lojas:

| Item | ID |
|---|---|
| Assinatura mensal | `prime_premium_mensal` |
| Plano base mensal (Android) | `mensal` |
| Assinatura anual | `prime_premium_anual` |
| Plano base anual (Android) | `anual` |

O plano `anual_parcelado` sai do código (Google não tem parcelamento por base plan da forma que estava, e Apple não tem o conceito).

Se você preferir outros nomes, é só me dizer antes de eu implementar — o resto do plano não muda.

---

## Parte 2 — Remoção do Asaas / PIX / cartão

Confirmado por leitura do código, o Asaas aparece em:

**Backend (deletar as functions):**
- `supabase/functions/criar-assinatura` — cria customer + subscription no Asaas
- `supabase/functions/processar-pagamento` — gera PIX, cobra cartão, checa status

**Frontend:**
- `src/pages/Assinatura.tsx` — remover as abas de PIX e cartão, o formulário de CPF/CEP/telefone, o QR Code, o parcelamento e o rodapé "Processado por Asaas". A tela fica só com os dois planos + botão de compra nativa + "Restaurar compras".
- `src/hooks/useSubscription.ts` — remover o fallback que lê assinaturas Asaas e o valor `'asaas'` do tipo `source` (fica `'play' | 'apple' | null`)
- `src/components/planos/MinhaAssinaturaView.tsx` — remover "Cartão / PIX" do método de pagamento
- `src/components/planos/CancelarAssinaturaSheet.tsx` — remover a etapa que cancela assinatura Asaas
- `src/pages/Perfil.tsx` — remover o label "Asaas"
- `src/data/transferenciaApp.ts` — remover a linha do secret `ASAAS_API_KEY` e atualizar a referência aos IDs do Play

**Banco:** a tabela `assinaturas` (com `asaas_customer_id`, `asaas_subscription_id`) fica **intacta** — histórico de quem já pagou por lá. Só deixa de ser lida/escrita. Se você quiser, faço a limpeza depois, em separado.

**Secret:** `ASAAS_API_KEY` pode ser removido no final (você confirma).

---

## Parte 3 — Preços e código de billing

- `src/lib/billing.ts` — novos `PRODUCT_IDS` / `PLAN_IDS`, remoção do `anual_parcelado`
- `src/pages/Assinatura.tsx` — mensal **R$ 29,90**; anual **R$ 199,90** (≈ R$ 16,66/mês), badge de economia **44%** (199,90 vs 358,80)
- Preço real exibido vindo do `getProducts()` da loja quando rodando no app nativo, com esses valores como fallback no navegador

---

## Parte 4 — Passo a passo seu no Google Play

1. **Play Console → Monetizar → Produtos → Assinaturas → Criar**
   - `prime_premium_mensal`: plano base `mensal`, recorrente automático, 1 mês, **R$ 29,90** → Ativar
   - `prime_premium_anual`: plano base `anual`, recorrente automático, 1 ano, **R$ 199,90** → Ativar
   - Sem ativar, `getProducts()` volta vazio e o botão não abre o checkout.
2. **Conta de serviço (validação no servidor)**
   - Google Cloud → IAM → Contas de serviço → criar → gerar chave JSON
   - Play Console → Usuários e permissões → convidar essa conta → *Ver dados financeiros* + *Gerenciar pedidos e assinaturas*
   - Play Console → Configuração → Acesso à API → vincular o projeto do Cloud e ativar a **Google Play Android Developer API**
3. **Pub/Sub (renovação/cancelamento automáticos)**
   - Cloud → Pub/Sub → criar tópico `play-billing`
   - Subscrição tipo **Push** para `https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/play-billing-webhook`
   - Dar role *Pub/Sub Publisher* a `google-play-developer-notifications@system.gserviceaccount.com` no tópico
   - Play Console → Configuração de monetização → colar o nome completo do tópico
4. **Confirmar o package name.** O `capacitor.config.ts` está com `br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456`. Se o app novo no Play tiver outro, me passa que eu ajusto (e o secret `ANDROID_PACKAGE_NAME`).
5. **Secrets que eu vou pedir pelo formulário seguro:** `ANDROID_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
6. **Teste:** Play Console → Testes de licença → seu e-mail. Instalar por faixa interna. Compra nativa não funciona no navegador nem em APK sideloaded.

---

## Parte 5 — Apple (depois do Google validado)

1. App Store Connect → Assinaturas → grupo "Premium": `prime_premium_mensal` (R$ 29,90/mês) e `prime_premium_anual` (R$ 199,90/ano), com nome de exibição, descrição e imagem de análise
2. Gerar **In-App Purchase Key (.p8)**; anotar Key ID e Issuer ID
3. **App Store Server Notifications V2** (produção e sandbox) → `https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/apple-billing-webhook`
4. Eu completo o caminho iOS no `validate-purchase` (hoje só o Android está implementado com a Play Developer API) usando a App Store Server API; peço os secrets `APPLE_IAP_KEY_P8`, `APPLE_IAP_KEY_ID`, `APPLE_ISSUER_ID`, `APPLE_BUNDLE_ID`
5. Testar com usuário Sandbox via TestFlight

---

## Ordem de execução

1. Remover Asaas/PIX do frontend e deletar as duas functions
2. Novos IDs + preços em `billing.ts` e `Assinatura.tsx`
3. Deploy de `validate-purchase` e `play-billing-webhook` + secrets do Google
4. Você cria os produtos no Play e testa em faixa interna
5. Só então partimos para a Apple
