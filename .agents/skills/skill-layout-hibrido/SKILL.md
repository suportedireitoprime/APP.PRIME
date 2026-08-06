---
name: skill-layout-hibrido
description: Skill especialista em reformulação de layout 360°, adaptação híbrida responsiva para Mobile, Tablet e Desktop Widescreen, ergonomia visual (Apple HIG / Google Material 3) e criação livre de funções auxiliares de apoio e engajamento.
---

# 🚀 Skill Suprema de Layout Híbrido 360° (Mobile, Tablet & Desktop)

Esta skill estabelece o padrão obrigatório para refazer, reestruturar e aperfeiçoar o layout de qualquer funcionalidade, página ou módulo do aplicativo (ex: Questões, Vade Mecum, Videoaulas, Ferramentas, etc.), garantindo adaptação responsiva tríplice impecável, ergonomia visual para estudo prolongado e inserção livre de novas funções de apoio.

---

## 🎯 Princípios Fundamentais do Layout Híbrido

### 1. 📱 Responsividade Híbrida Tríplice (Mobile, Tablet & Desktop Widescreen)

Sempre que a `skill-layout-hibrido` for ativada em qualquer página ou componente, o layout deve se transformar dinamicamente de acordo com o dispositivo do usuário:

#### A) Mobile (Telas pequenas até 767px)
- **Thumb Zone Ergonomicamente Otimizada**: Botões de ação primária e navegação devem se situar na metade inferior da tela.
- **Safe Area Insets (Android 15 / iOS 18)**:
  - Topo: `pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]`
  - Rodapé: `pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]` ou `pb-[calc(7rem+var(--sai-bottom,0px))]` quando houver barra de navegação flutuante.
- **Dimensões Mínimas de Toque**: Todos os botões e áreas clicáveis devem ter pelo menos **48dp (Android) / 44pt (iOS)** (`min-h-[48px]`).

#### B) Tablet (Telas médias de 768px até 1023px)
- **Transição para Grids de 2 Colunas**: Aproveitamento inteligente do espaço horizontal.
- **Painéis Laterais Retráteis**: Menus e gavetas de opções convertidos em painéis sobrepostos com backdrop desfocado (`backdrop-blur-md`).
- **Margens Equilibradas**: Espaçamento médio confortável sem compressão de texto.

#### C) Desktop Widescreen (Telas grandes de 1024px até 1920px+)
- **Estrutura Tripla ou Dupla de Colunas (`w-full max-w-[1600px] mx-auto`)**:
  - **Sidebar Esquerda (Navegação/Sumário/Aulas/Filtros)**: `lg:col-span-3 xl:col-span-3` colada à margem esquerda com rolagem independente.
  - **Área Central (Player/Conteúdo Principal/Questão/Leitor de Leis)**: `lg:col-span-6 xl:col-span-6` expandida e centralizada para leitura e interação de alta resolução.
  - **Sidebar Direita (Ferramentas de Apoio/Estatísticas/Panorama/Anotações)**: `lg:col-span-3 xl:col-span-3` alinhada à borda direita.

---

## 👁️ Ergonomia & Tipografia Confortável (Apple HIG & Google Material 3)

1. **Prevenção de Fadiga Visual**:
   - Fontes com tamanhos generosos para leitura contínua de leis, questões e resumos (mínimo de 15px/16px para corpo de texto com `leading-relaxed`).
   - Evitar fontes minúsculas ou ilegíveis em telas de alta densidade de pixels.

2. **Hierarquia e Paleta Anticlichê**:
   - Evitar fundos pretos absolutos (`#000000`) em favor de tonalidades profundas e elegantes (`bg-background`, `bg-card/40` com bordas sutis `border-border/60`).
   - Efeitos de luz suave, glassmorphism e sombras elegantes (`shadow-2xl shadow-black/20`).

---

## ⚡ Otimização de Lógica & Liberdade para Criar Novas Funções

1. **Preservação de Regras de Negócio**:
   - A reformulação do layout NUNCA deve quebrar as funções existentes. Todas as integrações com Supabase, estado de progresso e contexto do usuário devem ser mantidas intactas.

2. **Criação Livre de Funções de Apoio**:
   - A IA tem total liberdade para criar e adicionar novos recursos auxiliares que enriqueçam a experiência de estudo (ex: gravador de áudio com IA, transcrição automática, marcadores de leitura, estatísticas de desempenho, anotações rápidas e filtros otimizados).

---

## 📋 Checklist de Validação do Layout Híbrido

- [ ] A página/componente responde fluidamente em Mobile, Tablet e Desktop Widescreen?
- [ ] Safe Area Top e Bottom Insets foram aplicados com as fórmulas aditivas CSS?
- [ ] O visual no Desktop aproveita toda a largura da tela sem parecer esticado ou vazio?
- [ ] As funções anteriores continuam 100% operacionais?
- [ ] Foram adicionadas novas funções ou refinamentos de apoio ao estudante?
- [ ] A compilação `tsc --noEmit` retorna `0 erros`?
