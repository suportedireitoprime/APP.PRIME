# Plano de Implementação: Atualização de Planos e Preços Asaas

## Contexto & Requisitos
O usuário solicitou a atualização dos planos e limites de parcelamento:
- **Mensal:** R$ 29,90 / mês.
- **Anual:** Preço cheio em destaque de **R$ 149,90**; parcelável em **até 6 vezes** (remover menção a 12x).
- **Vitalício:** Preço cheio em destaque de **R$ 249,90**; parcelável em **até 10 vezes** (remover menção a 12x).
- **Asaas Edge Function:** Atualizar valores base (mensal 29.90, anual 149.90, vitalício 249.90) e impor limites de parcelamento (anual max 6x, vitalício max 10x).

---

## Modificações Propostas

### 1. `src/components/assinatura/PricingCards.tsx`
- **Anual:**
  - Preço em destaque: `R$ 149,90`
  - Subtexto: `Parcele em até 6 vezes no cartão`
  - Remover `R$ 16,65 em 12x` e `ou R$ 199,90 à vista`.
- **Vitalício:**
  - Preço em destaque: `R$ 249,90`
  - Subtexto: `Parcele em até 10 vezes no cartão (Acesso para sempre)`
  - Remover `R$ 25,90 em 12x` e `ou R$ 280,00 à vista`.
- **Mensal:**
  - Manter `R$ 29,90 /mês`.

### 2. `src/components/assinatura/CheckoutModal.tsx`
- `getPlanInfo()`:
  - Anual: R$ 149,90 (em até 6x)
  - Vitalício: R$ 249,90 (em até 10x)
- Subtexto do Card de Resumo:
  - Anual: `ou até 6x no cartão`
  - Vitalício: `ou até 10x no cartão`
- Dropdown de parcelas:
  - Limite para Vitalício: `[1, 2, ..., 10]`
  - Limite para Anual: `[1, 2, 3, 4, 5, 6]`
  - Valor base do cálculo: Anual = 149.90, Vitalício = 249.90

### 3. `src/pages/Assinatura.tsx`
- Gaveta de escolha de método de pagamento:
  - Cartão:
    - Vitalício: `Até 10x de R$ 24,99`
    - Anual: `Até 6x de R$ 24,98`
  - PIX:
    - Vitalício: `R$ 249,90 à vista`
    - Anual: `R$ 149,90 à vista`

### 4. `supabase/functions/asaas-checkout/index.ts`
- `baseValue`:
  - `vitalicio` / `vitalicio_pix`: 249.90
  - `anual` / `anual_pix` / `anual_regular_pix` / `promocao`: 149.90
  - `mensal`: 29.90
- Limite de parcelas:
  - `maxInstallments`: 10 para vitalício, 6 para anual.
  - Sanitização: `const num = Math.min(Math.max(1, installmentCount || 1), maxInstallments);`
- Deploy da Edge Function:
  - Executar comando de deploy via CLI do Supabase.

---

## Validação e Finalização
1. Executar verificação estrita de TypeScript: `.\node_modules\.bin\tsc.CMD --noEmit`.
2. Commit e push automático para o repositório remoto.
