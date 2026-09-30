# Plano de Implementação: Banner de Promoção & Teste no Cabeçalho

## 🎯 Objetivo
Implementar uma faixa/banner promocional interativa no cabeçalho do aplicativo (Home Mobile e Desktop) com o mesmo padrão e dimensões da barra de pesquisa (`h-16`, 64px de altura, bordas arredondadas `rounded-2xl` e botão CTA à direita).

## 🧭 Especificação dos Três Estados

1. **Estado Dourado (Promoção 24h Ativa - Recém-cadastrado)**:
   - **Gatilho:** Usuário nas primeiras 24h após cadastro ou início da oferta especial (`promo_24h_expires_${userId}`).
   - **Identidade Visual:** Gradiente Dourado Luxo (`from-amber-950/90 via-yellow-950/80 to-amber-950/90`), borda iluminada dourada (`border-amber-400/50`), badge com ícone de coroa/faíscas douradas.
   - **Conteúdo:** 
     - "Sua promoção termina em [HH:MM:SS]"
     - "Plano Anual por R$ 149,90 no PIX"
     - Botão CTA dourado: "APROVEITAR"
   - **Ação:** Abre o checkout com a oferta anual PIX (R$ 149,90).

2. **Estado Vermelho (Promoção 24h Expirada & Teste Gratuito de 3 Dias Ativo)**:
   - **Gatilho:** Passaram as 24h da promoção, mas o usuário ainda está em período de teste gratuito (`isTrial === true` e tempo restante > 0).
   - **Identidade Visual:** Gradiente Vermelho Carmim Urgente (`from-rose-950/90 via-red-950/80 to-rose-950/90`), borda iluminada vermelha (`border-rose-500/50`), badge com ícone de relógio pulsante.
   - **Conteúdo:** 
     - "Seu teste grátis termina em [Xd Xh Xm Xs]"
     - "Garanta seu acesso completo sem interrupções"
     - Botão CTA vermelho: "ASSINAR"
   - **Ação:** Abre modal de assinatura / checkout.

3. **Estado Oculto (Usuário Assinante Premium)**:
   - **Gatilho:** Usuário possui assinatura paga ativa (`isPremium && !isTrial`).
   - **Comportamento:** O banner some completamente do topo (`return null`).

## 📐 Dimensões & Design (Alinhado à Barra de Pesquisa)
- **Altura:** `h-16` (64px) — idêntico a `HomeSearchButton`.
- **Forma:** `rounded-2xl`, borda sutil, sombreamento profundo.
- **Layout:** Ícone à esquerda (badge 40x40px), texto dinâmico central com cronômetro monoespaçado, botão de ação à direita (`h-12 rounded-xl`, com efeito tátil haptic).
- **Safe Area:** Respeita `var(--sai-top, env(safe-area-inset-top, 0px))` para compatibilidade nativa perfeita em iOS e Android.

## 🛠️ Arquivos Modificados/Criados
1. `src/components/assinatura/PromoHeaderBanner.tsx`: Componente principal do banner.
2. `src/pages/IndexMobile.tsx`: Inclusão no cabeçalho mobile.
3. `src/pages/IndexDesktop.tsx`: Inclusão no topo desktop.
