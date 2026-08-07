---
name: skill-gamified-learning-ui
description: Skill Especialista em UI/UX Gamificado para Aprendizagem (Padrão Duolingo, Brilliant e MasterClass). Diretrizes de Micro-interações, Aprendizado Ativo em 3 Atos, Alto Contraste (WCAG AAA), Animações de Recompensa (Framer Motion + Confetes), Barra de Progresso Viva (XP/Streak) e Ergonomia Visual Mobile/Desktop.
---

# 🎓 Skill Especialista em UI/UX Gamificado de Aprendizagem

Esta skill estabelece o padrão de excelência de interface e experiência do usuário para aulas e trilhas de aprendizagem no aplicativo, inspirando-se nas melhores práticas de **Duolingo** (hábito e motivação), **Brilliant** (aprendizado ativo e visual) e **MasterClass** (sofisticação e tipografia premium).

---

## 📐 Diretrizes Universais de UI/UX de Aprendizagem

### 1. 🔄 O Loop de Aprendizado Ativo (Active Learning Loop)
- **Fluxo Contínuo:** Desafio → Ação do Aluno → Feedback Visual/Tátil Imediato → Recompensa (XP/Streak).
- **Blocos em 3 Atos:** Toda aula deve ser dividida em **Fundamentos** (conceito e vocabulário), **Aprofundamento** (exceções, tabelas e artigos) e **Fixação** (dinâmicas, ordenação e recapitulação).
- **Sem Parágrafos Massantes:** O conteúdo de leitura deve utilizar o padrão em camadas (explicação didática base sempre visível + pílulas expansíveis sob demanda para *"Em português claro"*, *"Ver exemplo"* e *"Onde erram"*).

---

### 2. 🎨 Alto Contraste & Paleta Sofisticada (WCAG 2.1 AAA)
- **Zero Ícones Escuros em Fundo Escuro:** Ícones de botões e nós de timeline em fundos escuros/vermelhos DEVEM ser **branco puro (`text-white`)** ou **dourado/primário vibrante**.
- **Fundo Sofisticado Aconchegante:** Substituir o preto absoluto (`#000000`) por um fundo cinza-grafite/zinc profundo (`bg-[#0d0f12]` ou `bg-zinc-950`), prevenindo fadiga visual durante leituras longas.
- **Cards Elevados (Dark Card Glassmorphism):** Usar cards com profundidade sutil (`bg-card/90`, `border border-border/80`, `shadow-xl`, `backdrop-blur-md`), sem contornos agressivos ou borrados.

---

### 3. 📖 Tipografia Didática para Leitura Prolongada
- **Fonte Sans-Serif Limpa:** Usar fontes Sans-Serif modernas (Inter, Plus Jakarta Sans, Outfit) com pesos médios/semi-bold.
- **Altura de Linha Relaxada:** Manter espaçamento de linha entre `leading-[1.7]` e `leading-[1.75]`, com tamanho de fonte base confortável (`17px` no mobile / `18px` a `20px` no desktop).
- **Hierarquia Visual Nítida:** Títulos destacados em cor de primeiro plano (`text-foreground font-bold`), subtextos em tom neutro suave (`text-muted-foreground`) e termos-chave em negrito com realce sutil.

---

### 4. 🏆 Gamificação Vibrante & Motivação
- **Header Gamificado:** Exibir em tempo real o **XP acumulado** (`⚡ +15 XP` por bloco, `+25 XP` por acerto) e o **Combo Streak** (`🔥 2x`, `🔥 3x`).
- **Timeline de Progresso Fluida:** Indicador de halo animado (`layoutId="timeline-halo"`) com preenchimento gradual e conectores em cor primária.
- **Micro-interações de Recompensa:** Efeito sonoro suave ao virar cards e avançar etapas, acompanhado por badges coloridas e animações de vitória ao finalizar o ato.

---

### 5. 📱 Ergonomia Responsiva (Mobile & Desktop)
- **Safe Area Insets:** Respeitar margens de barra de status no topo (`pt-[calc(1rem+var(--sai-top,0px))]`) e barra de navegação no rodapé (`pb-[calc(1.25rem+var(--sai-bottom,0px))]`).
- **Barra Flutuante de Navegação Unificada:** No mobile, manter os botões de ação ("Anterior", "Próximo") e ferramentas adicionais (Mentor, Ajustes) em uma barra flutuante unificada sem sobreposições.
- **Controles Laterais no Desktop:** No computador, exibir painéis laterais (sumário e navegação) fixados à direita e à esquerda da área de leitura.
