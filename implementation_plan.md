# Plano de Implementação: Modal Persuasivo de Teste, Tela de Benefícios em Linha do Tempo e Ajustes de Margens de Navegação

## Contexto e Objetivos
O usuário solicitou 2 grandes melhorias:
1. **Modal de Expiração de Teste (`TrialExpiredModal.tsx`):**
   - Título e descrição significativamente mais persuasivos, focados no impacto da perda de acesso e no valor do aplicativo para a aprovação do estudante.
   - Adição de um botão **"VER BENEFÍCIOS"** logo abaixo do botão "VER PLANOS".
   - Ao clicar em "VER BENEFÍCIOS", abrir uma tela fullscreen imersiva com animações elegantes dos benefícios descritos na página de planos.
   - Estrutura dos benefícios em formato de **linha do tempo (timeline)**, contendo os quadradinhos com as funções e a descrição persuasiva ao lado (alternando esquerda e direita no layout timeline).
   - Botão de conversão ao final ou fixo para direcionar aos planos.

2. **Ajuste de Margens e Safe Areas (Navigation Bar / Top & Bottom):**
   - **Topo para não-assinantes (`HomeHeaderHero.tsx` / `PromoHeaderBanner.tsx`):** Aumentar o recuo do topo para que o botão de menu lateral (hambúrguer) e o botão de notificações não fiquem colados ou atrás da barra de navegação/status bar do dispositivo móvel.
   - **Página de Ver Planos (`Assinatura.tsx` e `PageHeader.tsx`):** Garantir que o cabeçalho superior e o rodapé inferior tenham as margens seguras aditivas (`calc(1.5rem + var(--sai-top, env(safe-area-inset-top, 0px)))` e `calc(8.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))`), evitando qualquer sobreposição com barras do sistema ou com a BottomNav.

---

## Proposta Técnica de Implementação

### 1. Novo Componente: `src/components/assinatura/BeneficiosTimelineModal.tsx`
- Tela fullscreen com backdrop escuro luxo (`bg-[#0A0B0D]`), gradientes de luz sutis e animações com `framer-motion`.
- Topo com botão de fechar premium (`ArrowLeft` ou `X`) e título de impacto: "SEU ARSENAL COMPLETO DE ESTUDOS".
- Eixo central vertical com linha do tempo luminosa.
- Itens da timeline alimentados pelos benefícios de `FeaturesList.tsx`:
  - 10 módulos fundamentais (IA Horus WhatsApp, Vade Mecum Áudio/Grifos, Simulados OAB/Concursos, Resumos Jurídicos, Videoaulas/Audioaulas, Flashcards Mnemônicos, Três Poderes Ao Vivo, Radar Legislativo, Modo Offline Premium, Laboratório Visual 3D).
  - Cada item com:
    - Quadrado de destaque da função com ícone temático, badge e funcionalidades.
    - Bloco de descrição persuasiva ao lado destacando o benefício direto para a aprovação.
    - Alternância esquerda/direita (grid responsivo com timeline centralizada em telas sm/md+ e timeline lateral fluida no mobile).
- Rodapé com botão de ação rápida: "QUERO ACESSO COMPLETO AGORA" -> redireciona para `/assinatura?preview=plans`.

### 2. Refatoração de `src/components/TrialExpiredModal.tsx`
- Atualizar cópias para versões persuasivas de alta conversão:
  - Título: **"NÃO DEIXE SEU RITMO DE ESTUDOS PARAR"** / **"SEU ACESSO DE TESTE EXPIROU"**
  - Mensagem: `{name}, você já sentiu a diferença de estudar com o ecossistema jurídico mais avançado do país. Não volte para apostilas desatualizadas e métodos lentos: desbloqueie a IA Horus, o Vade Mecum inteligente e mais de 200 ferramentas agora.`
- Adicionar o botão secundário abaixo de "VER PLANOS":
  - Botão **"VER TODOS OS BENEFÍCIOS"** com ícone de coroa/faísca e feedback tátil `haptic.light()`.
  - Ao clicar, abre o `BeneficiosTimelineModal`.

### 3. Ajuste de Margem Superior em `HomeHeaderHero.tsx` e `PromoHeaderBanner.tsx`
- Em `HomeHeaderHero.tsx`:
  - Aumentar o padding-top do `<header>` de botões para `pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] sm:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]` quando não houver top banner, e garantir espaçamento mínimo de 1rem mesmo com banner.
  - Aumentar a margem do botão de menu lateral (`mr-1` ou `gap-3`) garantindo toque confortável e distanciamento da borda superior.
  - Ajustar o container de `HomeBrandBanner` para manter alinhamento estético perfeito.
- Em `PromoHeaderBanner.tsx`:
  - Ajustar padding-top para `pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]`.

### 4. Blindagem de Margens em `PageHeader.tsx` e `src/pages/Assinatura.tsx`
- Em `PageHeader.tsx`:
  - Substituir `var(--sai-top)` puro por `var(--sai-top, env(safe-area-inset-top, 0px))` com valor base aditivo seguro `1.5rem` (`paddingTop: 'calc(1.5rem + var(--sai-top, env(safe-area-inset-top, 0px)))'`).
  - Idem para `paddingLeft`, `paddingRight` e `minHeight`.
- Em `Assinatura.tsx`:
  - Validar e garantir margem inferior suficiente (`pb-[calc(9rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]`) para que todo o conteúdo e botões fiquem confortavelmente acima da barra de navegação inferior.

---

## Validação e Finalização
1. Verificação TypeScript via `.\node_modules\.bin\tsc.CMD --noEmit`.
2. Teste de build via `.\node_modules\.bin\vite.CMD build`.
3. Auto-commit e push para o repositório remoto.
