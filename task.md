# Tarefa: Banner de Promoção 24h & Teste Gratuito no Cabeçalho

- [x] 1. Criar componente `src/components/assinatura/PromoHeaderBanner.tsx` <!-- id: 1 -->
  - [x] 1.1 Lógica de detecção dos 3 estados (Promo 24h Dourado, Teste Gratuito Vermelho, Assinante Oculto)
  - [x] 1.2 Cronômetro regressivo com atualização a cada segundo (HH:MM:SS ou Dd HH:MM:SS)
  - [x] 1.3 Design idêntico à altura da barra de pesquisa (`h-16`, `rounded-2xl`, botão CTA na direita)
  - [x] 1.4 Abertura do CheckoutModal ao clicar no banner
- [x] 2. Integrar `PromoHeaderBanner` no Cabeçalho Mobile (`IndexMobile.tsx` e `HomeHeaderHero.tsx`) <!-- id: 2 -->
  - [x] 2.1 Posicionar no topo com respeito a Safe Area (`var(--sai-top)`)
  - [x] 2.2 Transição suave e layout responsivo com prop `hasTopBanner`
- [x] 3. Integrar `PromoHeaderBanner` no Cabeçalho Desktop (`IndexDesktop.tsx`) <!-- id: 3 -->
  - [x] 3.1 Garantir visual widescreen e layout responsivo
- [x] 4. Validação com TypeScript (`tsc --noEmit`) <!-- id: 4 -->
- [x] 5. Auto-Commit e Push para o GitHub <!-- id: 5 -->
