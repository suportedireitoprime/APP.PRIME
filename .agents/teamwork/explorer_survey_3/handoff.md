# Relatório de Diagnóstico Técnico e Auditoria UI/UX, Responsividade & Acessibilidade
## Módulo de Aulas Interativas (Aprender em Trilhas)

**Data da Auditoria:** 10 de Novembro de 2026  
**Auditor Responsável:** Explorer 3 (UI/UX, Responsiveness & Accessibility Auditor)  
**Modo de Operação:** 100% Somente Leitura (Read-Only)  
**Status do Módulo:** Funcional com alto apelo visual, porém com débitos severos de Acessibilidade (WCAG 2.1 AA), inconsistências de touch targets nativos e subutilização do espaço Desktop Widescreen.

---

## 1. Observation (Observações Diretas & Fatos Comprovados)

Durante a varredura exaustiva do código-fonte dos componentes, páginas e estilos do módulo de Aulas Interativas, foram constatados diretamente os seguintes fatos:

### 1.1. Arquitetura de Apresentação e Rotas
- O módulo é montado principalmente a partir de `src/pages/AdminAulasInterativas.tsx` (2.365 linhas) nas rotas `/aulas` e `/admin-aulas-interativas` (declaradas em `src/AppRoutes.tsx:901, 956`).
- O ecossistema de componentes visuais é composto por:
  - `src/components/aulas-interativas/PlayerAulaNativo.tsx` (1.927 linhas)
  - `src/components/aulas-interativas/EtapasInterativas.tsx` (1.035 linhas)
  - `src/components/aulas-interativas/AulasMenuAlternancia.tsx` (87 linhas)
  - `src/components/aulas-interativas/AulasHeroPanel.tsx` (208 linhas)
  - `src/components/aulas-interativas/AulasTabProgresso.tsx` (192 linhas)
  - `src/components/aulas-interativas/AulasTabFavoritos.tsx` (130 linhas)
  - `src/components/aulas-interativas/AulasTabEstatisticas.tsx` (333 linhas)
  - `src/components/aulas-interativas/ModalPraticarQuestoes.tsx` (351 linhas)
  - `src/components/aulas-interativas/ModalRevisarFlashcards.tsx` (318 linhas)
  - `src/components/vademecum/home/HomeAulasInterativasBanner.tsx` (180 linhas)

---

### 1.2. Apontamentos Críticos Observados por Arquivo e Linha

#### A. Acessibilidade por Teclado e Semântica Interativa (WCAG 2.1)
1. **`AdminAulasInterativas.tsx:1056-1062` e `1164-1172`**:
   Os cards de Disciplina na trilha serpenteante são elementos `<div>` com manipulador `onClick`, sem `role="button"`, sem `tabIndex={0}`, sem manipulador `onKeyDown` (`Enter` / `Space`) e sem `aria-label`.
   ```tsx
   // Linhas 1056-1062
   <div
     onClick={() => {
       setDisciplinaSelecionadaId(disc.id);
       setMateriaSelecionadaId(null);
       resetScrollToTop();
     }}
     className="relative shrink-0 w-[152px] xs:w-[168px] sm:w-[200px] md:w-[225px] h-[200px] xs:h-[218px] sm:h-[245px] md:h-[270px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.95] hover:-translate-y-1.5 transition-transform duration-300 ease-out"
   >
   ```
2. **`AdminAulasInterativas.tsx:1898-1905`**:
   Cada item de aula na gaveta de listagem (Nível 3) é também uma `<div>` com `onClick` sem semântica interativa:
   ```tsx
   // Linha 1898-1905
   <div
     key={aula.id}
     onClick={() => setAulaSheetDetalhe(aula)}
     className={cn(
       "w-full rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer select-none group",
       "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/25 active:scale-[0.99]",
       "flex items-center gap-3 sm:gap-4 shadow-md"
     )}
   >
   ```
3. **`PlayerAulaNativo.tsx:1387-1442`**:
   O bloco de Flashcard interativo dentro do reprodutor não possui acessibilidade por teclado:
   ```tsx
   // Linha 1387-1394
   <div 
     onClick={() => {
       haptic.medium();
       setFlashcardVirado(!flashcardVirado);
     }}
     className={`flip-card-inner min-h-[300px] sm:min-h-[340px] cursor-pointer ${
       flashcardVirado ? 'is-flipped' : ''
     }`}
   >
   ```
   (Em contraste, o modal separado `ModalRevisarFlashcards.tsx:186-188` implementou `role="button"` e `onKeyDown`, evidenciando disparidade interna).
4. **`EtapasInterativas.tsx:91-102` (EtapaCompletar)**:
   As lacunas das frases (`<span>{slotPreenchido ? respostas[pi] : '· · · · · ·'}</span>`) são renderizadas como caracteres pontilhados crus sem `aria-label` descritivo do slot.
5. **`EtapasInterativas.tsx:525-578` (EtapaLigarTermos)**:
   Os botões das duas colunas não expõem atributos de estado de seleção (`aria-pressed={isSel}` ou `aria-selected`). Não há região `aria-live` para anunciar acertos ou erros a pessoas com deficiência visual.
6. **`EtapasInterativas.tsx:654-675` e `748-765`**:
   Os botões expansíveis da Linha do Tempo e do Mapa Mental não possuem atributos `aria-expanded` nem `aria-controls`.
7. **`AulasMenuAlternancia.tsx:31-84`**:
   O menu de abas utiliza `<nav>` com `<button>` genéricos, sem o padrão `role="tablist"`, `role="tab"`, `aria-selected={isActive}` nem `aria-controls`.

---

#### B. Dimensões Mínimas de Toque (Google Material 3 & Apple HIG)
1. **Botões de Voltar com Dimensões Inferiores ao Padrão (`w-12 h-12` / 48x48dp)**:
   - `AdminAulasInterativas.tsx:891`: `className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ..."` (40x40px no mobile, abaixo do mínimo de 48px). Ícone `w-5 h-5` com stroke 2.4.
   - `AdminAulasInterativas.tsx:1338`: `className="w-11 h-11 sm:w-12 sm:h-12 ..."` (44x44px no mobile).
   - `AdminAulasInterativas.tsx:1858`: `className="w-11 h-11 sm:w-12 sm:h-12 ..."` (44x44px no mobile).
   - `AdminAulasInterativas.tsx:2059`: `className="w-11 h-11 sm:w-12 sm:h-12 ..."` (44x44px no mobile).
   - `PlayerAulaNativo.tsx:1079`: `className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ..."` (44x44px no mobile).
   - `PlayerAulaNativo.tsx:1750`: `className="w-11 h-11 sm:w-12 sm:h-12 ..."` (44x44px no mobile).
2. **Touch Targets Severamente Reduzidos em Elementos Interativos Críticos**:
   - `PlayerAulaNativo.tsx:1100`: Botão de abrir sumário de etapas possui classes `text-[10px] px-2 py-0.5 rounded-full`, resultando em altura aproximada de **22px**, gerando alto risco de erro de toque próximo ao título.
   - `PlayerAulaNativo.tsx:1114-1141`: Botão de alternar grifo de narração (`px-2.5 py-1`) tem altura de **~28px**.
   - `PlayerAulaNativo.tsx:1585-1600`: Hotspots circulares da imagem (`w-8 h-8`) medem **32x32px**, violando o alvo mínimo de 48dp do Material 3.
   - `EtapasInterativas.tsx:127`: Chips do banco de palavras (`px-4 py-2.5 rounded-full text-sm`) atingem ~36px de altura.
   - `AulasMenuAlternancia.tsx:45`: `min-h-[46px] sm:min-h-[48px]` no mobile fica 2px abaixo dos 48dp mínimos exigidos para Android.

---

#### C. Responsividade Desktop Widescreen, Tablet e Safe Areas
1. **`AdminAulasInterativas.tsx:813`**:
   O contêiner raiz fixa `pb-[calc(7.5rem+env(safe-area-inset-bottom,24px))]` incondicionalmente:
   ```tsx
   <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(7.5rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden">
   ```
   Em telas desktop (`lg:`, `xl:`), não há barra de navegação inferior flutuante móvel (`BottomNav` é oculto no PC). Esse padding fixo cria um vácuo vazio de ~150px no rodapé no computador.
2. **Subutilização de Telas Widescreen (`max-w-4xl`)**:
   Em `AdminAulasInterativas.tsx` (linhas 886, 943, 1050, 1334, 1374, 1796, 2039), todas as estruturas são rigidamente limitadas a `max-w-4xl` (896px). Em monitores de 1920x1080 (1080p) ou 2560x1440 (1440p), mais de 50% da largura visual é desperdiçada em laterais pretas vazias, contrariando a diretriz de layout híbrido de 2 a 3 colunas para desktop (`max-w-[1600px] mx-auto`).
3. **Ausência de Atalho de Teclado `Escape` no Desktop**:
   Em `AdminAulasInterativas.tsx`, não existe nenhum listener de teclado (linhas 552 apenas escuta evento `message`). Pressionar `Esc` não fecha as gavetas (`aulaSheetDetalhe`, `materiaSelecionadaId`), nem os modais de bloqueio ou flashcards.
4. **Player com Linha de Leitura Encurtada no Desktop (`PlayerAulaNativo.tsx:1168`)**:
   `max-w-3xl mx-auto` (768px). No PC, a tela inteira fica presa a uma faixa estreita centralizada, forçando o rodapé a permanecer fixo na parte inferior (`fixed bottom-0`), o que viola a regra de ouro: *"zero rodapé fixo no PC"*.
5. **Scroll Bleed / Ausência de `useBodyScrollLock`**:
   Nenhuma das gavetas deslizantes (`sheet-materia-aulas` linha 1790 e `sheet-aula-detalhe` linha 2039) nem os modais aplicam travamento de scroll limpo no `#root` ou `document.body`. Ao rolar dentro da gaveta no mobile, o fundo continua a se mover por baixo (scroll leakage).

---

#### D. Performance Visual, Animações e GPU
1. **Layout Thrashing Massivo em `AdminAulasInterativas.tsx:487-507`**:
   A função `resetScrollToTop` executa uma varredura DOM síncrona com `document.querySelectorAll('main, [class*="overflow"]')` e escreve em `scrollTop`, sendo repetida **5 vezes consecutivas**:
   ```tsx
   const doScroll = () => {
     try {
       window.scrollTo(0, 0);
       if (document.documentElement) document.documentElement.scrollTop = 0;
       if (document.body) document.body.scrollTop = 0;
       const root = document.getElementById('root');
       if (root) root.scrollTop = 0;
       const main = document.querySelector('main');
       if (main) main.scrollTop = 0;
       document.querySelectorAll('main, [class*="overflow"]').forEach(el => {
         if (el.scrollTop > 0) el.scrollTop = 0;
       });
     } catch {}
   };
   doScroll();
   requestAnimationFrame(doScroll);
   setTimeout(doScroll, 10);
   setTimeout(doScroll, 50);
   setTimeout(doScroll, 150);
   ```
   Essa leitura e escrita síncrona forçada de geometria de layout 5 vezes em menos de 150ms invalida a árvore de renderização do navegador e induz travamentos visuais perceptíveis (*micro-janks*).
2. **Re-render por Movimento de Pixel no Arraste de Verdadeiro/Falso (`EtapasInterativas.tsx:260`)**:
   No evento `onDrag={(_, info) => setDragX(info.offset.x)}`, o estado React `setDragX` é chamado a cada movimento de pixel (60-120 vezes por segundo), re-renderizando todo o componente `EtapaVerdadeiroFalso` em vez de utilizar `useMotionValue` do Framer Motion.
3. **Carga Contínua de GPU por Filtros Pesados e Canvas Concorrentes (`AdminAulasInterativas.tsx:816-853`)**:
   O fundo roda simultaneamente um `<ShapeGrid>` em canvas ativo contínuo (`speed={0.6}`) e, sobreposto a ele, uma imagem com `filter drop-shadow-[0_0_55px_rgba(234,179,8,0.25)]` combinado com `maskImage: 'linear-gradient(...)'`, gerando repaints contínuos pesados em dispositivos móveis.
4. **Ausência de Respeito a `prefers-reduced-motion`**:
   Em `PlayerAulaNativo.tsx:669-698`, as animações `@keyframes imgZoomInSlow` (zoom contínuo de 2.4s) e `@keyframes pageTurnSmooth` não possuem media queries `@media (prefers-reduced-motion: reduce)`. Os disparos de `confetti()` em `EtapasInterativas.tsx` (linhas 50, 209, 463, 835) ocorrem indiscriminadamente sem verificar sensibilidade a movimento do usuário.

---

#### E. Usabilidade, Estados de Erro e Gamificação
1. **Armadilha de Loading Permanente no Player (`PlayerAulaNativo.tsx:644-657`)**:
   Se a chamada de rede para carregar a aula falhar ou entrar em timeout (ex: conexão instável), o componente exibe apenas um spinner com `"Carregando aula..."` sem timeout, sem mensagem de erro, sem botão de tentar novamente e sem botão de cancelar/voltar, obrigando o usuário a recarregar o aplicativo.
2. **Falsificação de Dados Estatísticos por Simulação Hardcoded (`AulasTabEstatisticas.tsx:51-54`)**:
   Se uma matéria possuir questões marcadas como feitas, mas o mapa de acertos detalhado não estiver populado, o sistema injeta arbitrariamente `totalAcertos += 8` e `totalPerguntas += 10`, exibindo uma taxa de acerto fictícia que não reflete a realidade do estudante.
3. **Contraste de Cor Insuficiente em Textos Secundários (WCAG 1.4.3)**:
   Múltiplos textos com classe `text-zinc-500` (#71717A) sobre fundo escuro (#120409 ou #0D0D0D) produzem uma razão de contraste de aproximadamente **3.5:1**, reprovando o critério WCAG AA que exige no mínimo **4.5:1** para textos normais e pequenos.

---

## 2. Logic Chain (Cadeia Lógica de Inferência)

1. **Premissa 1 (Acessibilidade WCAG 2.1 Critérios 2.1.1, 4.1.2 e 1.4.3):**
   - Usuários de tecnologias assistivas dependem de papéis semânticos (`role="button"`, `role="tab"`), estados dinâmicos anunciáveis (`aria-expanded`, `aria-selected`, `aria-pressed`) e foco de teclado (`tabIndex={0}`, listeners de `Enter`/`Space`).
   - A observação de elementos `<div onClick>` sem atributos de acessibilidade em `AdminAulasInterativas.tsx:1056, 1898` e `PlayerAulaNativo.tsx:1387` impede fisicamente a navegação por teclado e oculta a interatividade dos leitores de tela.
   - Portanto, o módulo atualmente é inacessível para usuários com deficiência motora ou visual severa nestes pontos críticos.

2. **Premissa 2 (Diretrizes Nativas Mobile HIG & Material 3):**
   - A ergonomia de uso com uma só mão em telas sensíveis ao toque exige áreas mínimas clicáveis de 48x48dp (Android) e 44x44pt (iOS) com separação de 8px para prevenir toques errôneos.
   - A observação de botões com 40px/44px e chips/indicadores com 22px a 32px (em `PlayerAulaNativo.tsx:1100, 1585` e `AdminAulasInterativas.tsx:891`) coincide com áreas densas de toque.
   - Logo, ocorre alta taxa de toques perdidos ou acionamento acidental de elementos adjacentes em smartphones compactos.

3. **Premissa 3 (Responsividade Widescreen e Regras de Projeto):**
   - Diretrizes de Desktop determinam aproveitamento horizontal em grades de 2 a 3 colunas (`max-w-[1600px]`), liberação de rodapés fixos (`lg:hidden` nos rodapés mobile) e suporte a atalhos ergonômicos (`Esc` para fechar modais).
   - A observação de limites estáticos `max-w-4xl` em telas 1080p, `pb-[calc(7.5rem+...)]` fixo no desktop e ausência de manipulador de `Escape` demonstra que o módulo foi concebido exclusivamente para mobile e apenas centralizado em telas grandes com espaço morto lateral.
   - Logo, a experiência no Desktop está em desacordo com as regras de projeto e diretrizes de layout híbrido.

4. **Premissa 4 (Performance React e Renderização Web):**
   - A manipulação forçada de propriedades de geometria do DOM (`scrollTop`) em múltiplos nós combinada com loops síncronos e timeouts gera reflow forçado (Layout Thrashing).
   - O uso de `setDragX` dentro de `onDrag` do Framer Motion a cada movimento de pixel provoca re-renderizações React síncronas contínuas em um componente com 300 linhas de JSX.
   - Logo, a fluidez a 120fps prometida pelas diretrizes do projeto sofre degradação em aparelhos Android intermediários.

---

## 3. Caveats (Ressalvas & Limitações da Análise)

1. **Modo Estritamente Somente Leitura:** A análise foi executada sem alterar nenhum arquivo do código-fonte e sem alterar o banco de dados Supabase, preservando integralmente o ambiente de produção/desenvolvimento.
2. **Ambiente Operacional de Avaliação:** A análise de layout foi conduzida por inspeção estática profunda do JSX, Tailwind CSS, regras globais e hooks, sem acesso a um emulador de hardware com leitor de tela VoiceOver/TalkBack ativo em tempo real.
3. **Variações Dinâmicas de Dados:** As telas interativas dependem de cargas dinâmicas provenientes do Cloudflare R2 (`aula.json`, `aula.html`). Em aulas com estruturas de slides não catalogadas, o comportamento do parse pode introduzir sutilezas adicionais não cobertas nas amostras estáticas.

---

## 4. Conclusion (Diagnóstico Executivo & Matriz de Severidade)

O módulo de Aulas Interativas possui um design visual expressivo, rico em recursos de gamificação, áudio e conteúdo didático estruturado. No entanto, sua camada de apresentação padece de **débitos estruturais de acessibilidade por teclado, touch targets subdimensionados para mobile, ineficiências de re-renderização e ausência de adaptação real para Desktop Widescreen**.

### Tabela Consolidada de Apontamentos por Severidade

| ID | Severidade | Categoria | Arquivo e Linhas | Causa-Raiz Técnica | Impacto no Usuário |
|---|---|---|---|---|---|
| **ISSUE-UX-01** | **ALTA** | Acessibilidade / Teclado | `AdminAulasInterativas.tsx:1056, 1164, 1898` | Uso de `<div onClick>` sem `role="button"`, `tabIndex={0}`, `onKeyDown` nem `aria-label` | Usuários de teclado não conseguem selecionar disciplinas nem aulas no catálogo |
| **ISSUE-UX-02** | **ALTA** | Acessibilidade / Teclado | `PlayerAulaNativo.tsx:1387-1442` | Flashcard interno em `<div>` sem suporte a foco de teclado ou evento de tecla | Impossível virar o flashcard via teclado (Enter/Space) durante a aula |
| **ISSUE-UX-03** | **ALTA** | Mobile / Touch Target | `AdminAulasInterativas.tsx:891, 1338, 1858, 2059` e `PlayerAulaNativo.tsx:1079, 1100, 1585` | Botões de voltar (40-44px), indicador de etapas (22px) e hotspots (32px) abaixo de 48x48dp | Dificuldade ergonômica de toque e toques acidentais em celulares |
| **ISSUE-UX-04** | **ALTA** | Responsividade Desktop | `AdminAulasInterativas.tsx:813, 886, 1796` | Layout travado em `max-w-4xl`, padding inferior de mobile fixo no PC e ausência de `Escape` | Telas widescreen com 60% de espaço morto lateral; modais não fecham com Esc |
| **ISSUE-UX-05** | **ALTA** | Performance / Layout | `AdminAulasInterativas.tsx:487-507` | `resetScrollToTop` executa `querySelectorAll` e força reflow 5 vezes em timeouts consecutivos | Travamentos e micro-janks perceptíveis na troca de telas |
| **ISSUE-UX-06** | **MÉDIA** | Usabilidade / Scroll | `AdminAulasInterativas.tsx:1790, 2039` | Ausência de `useBodyScrollLock` nas gavetas e modais | Rolagem vaza para o fundo da página (scroll bleed) ao manipular o sheet |
| **ISSUE-UX-07** | **MÉDIA** | Acessibilidade / Motion | `PlayerAulaNativo.tsx:669-698`, `EtapasInterativas.tsx:50, 209` | Animações CSS de zoom contínuo e confetes sem `@media (prefers-reduced-motion)` | Desconforto visual para usuários com sensibilidade vestibular |
| **ISSUE-UX-08** | **MÉDIA** | Performance React | `EtapasInterativas.tsx:260` | `setDragX` atualizado em cada frame dentro de `onDrag` | Queda de taxa de quadros e lentidão no arraste em aparelhos mais modestos |
| **ISSUE-UX-09** | **MÉDIA** | Resiliência / UX | `PlayerAulaNativo.tsx:644-657` | Tela de carregamento infinita sem timeout, mensagem de erro ou botão de voltar | Usuário fica preso na tela preta com spinner se a conexão oscilar |
| **ISSUE-UX-10** | **MÉDIA** | Acessibilidade / Contraste | `PlayerAulaNativo.tsx:1089, 1561` e `AdminAulasInterativas.tsx` | Uso de `text-zinc-500` (#71717A) sobre fundo preto/vinho gerando razão ~3.5:1 | Reprova no critério WCAG AA (mínimo 4.5:1 para texto normal) |
| **ISSUE-UX-11** | **MÉDIA** | Performance GPU | `AdminAulasInterativas.tsx:816-853` | `ShapeGrid` em canvas 60fps concorrendo com `drop-shadow` de 55px e `maskImage` | Consumo acelerado de bateria e repaints contínuos no mobile |
| **ISSUE-UX-12** | **MÉDIA** | Acessibilidade / ARIA | `EtapasInterativas.tsx:91, 525, 654, 748, 1020` | Lacunas mudas, pares sem `aria-pressed`, acordeões sem `aria-expanded`, slider sem label | Leitores de tela não informam o estado de seleção ou expansão dos desafios |
| **ISSUE-UX-13** | **BAIXA** | Semântica HTML | `AulasMenuAlternancia.tsx:31-84` | `<nav>` contendo botões simples sem papéis `tablist` e `tab` | Elemento não é compreendido como barra de abas por tecnologias assistivas |
| **ISSUE-UX-14** | **BAIXA** | Acessibilidade / ARIA | `AulasHeroPanel.tsx:140-164` | SVG circular de progresso sem `role="progressbar"` e `aria-valuenow` | Usuários cegos não ouvem a porcentagem de progresso indicada no gráfico |
| **ISSUE-UX-15** | **BAIXA** | Integridade de Dados | `AulasTabEstatisticas.tsx:51-54` | Injeção arbitrária de `+8` acertos e `+10` perguntas quando dados estão ausentes | Exibe métricas de retenção infladas artificialmente |
| **ISSUE-UX-16** | **BAIXA** | Resiliência Visual | `EtapasInterativas.tsx:980-997` | Comparador visual sem tratamento de `onError` ou skeleton de imagem | Imagens quebradas deixam caixas pretas vazias no slider antes/depois |

---

## 5. Verification Method (Métodos de Verificação Independente)

Para reproduzir, auditar e validar independentemente todos os apontamentos deste relatório sem alterar o código da aplicação, siga os passos abaixo:

### 5.1. Verificação de Acessibilidade por Teclado
1. Abra o navegador em `http://localhost:8080/aulas`.
2. Pressione repetidamente a tecla `Tab`.
   - **Resultado esperado vs observado:** O foco salta diretamente da barra de navegação para a barra de pesquisa, ignorando completamente os cards de disciplina (`div.spring-card`). Não é possível focar nem abrir disciplinas via teclado.
3. No Player (`PlayerAulaNativo`), navegue até uma etapa do tipo `Flashcard`:
   - Pressione `Tab`, `Enter` ou `Space`. O card não vira. Apenas o clique com ponteiro físico (mouse/toque) funciona.

### 5.2. Verificação de Responsividade Desktop Widescreen
1. Abra a tela em resolução de 1920x1080 (Desktop):
   - Inspecione com Chrome DevTools o contêiner raiz `AdminAulasInterativas`. Observe `padding-bottom: calc(7.5rem + 24px) = 144px` gerando espaço vazio massivo no rodapé.
   - Observe a largura máxima contida em `max-w-4xl` (896px), deixando mais de 1000px de espaço morto lateral sem aproveitamento em grid.
   - Abra a gaveta de aulas (`materiaSelecionadaId`) e pressione a tecla `Escape`. A gaveta não fecha.

### 5.3. Verificação de Touch Targets no Mobile (Chrome DevTools / Lighthouse)
1. Ative a emulação móvel (ex: Moto G Power ou Pixel 7, 393x851).
2. Execute a auditoria do **Lighthouse** na categoria **Accessibility**:
   - O Lighthouse sinalizará `[tap-targets]`: botões com alvos menores que 48x48px (botão de voltar no cabeçalho em 40px, botão de sumário em 22px, chips de palavras em 36px).
   - O Lighthouse acusará falha de contraste de cor em elementos com classe `text-zinc-500` sobre fundos pretos (`background-color: #0D0D0D` / `#120409`), razão ~3.5:1.

### 5.4. Verificação de Layout Thrashing no Performance Profiler
1. Abra a aba **Performance** do Chrome DevTools e inicie a gravação (Record).
2. Alterne de aba em `AdminAulasInterativas` (ex: de Trilhas para Progresso) ou clique em uma disciplina.
3. Observe no gráfico de chamas (*Flame Chart*):
   - Múltiplos alertas vermelhos de **"Forced Reflow"** disparados por `doScroll` em `resetScrollToTop`, originados em chamadas sequenciais a `document.querySelectorAll` e `scrollTop`.

---

## 6. Proposta de Recomendações Técnicas Estruturadas (Próximos Passos)

1. **Recomendação para ISSUE-UX-01 e ISSUE-UX-02 (Acessibilidade de Foco):**
   Substituir as `<div>` interativas por componentes semânticos `<button>` ou adicionar obrigatoriamente:
   `role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); acao(); } }}` acompanhado de `focus-visible:ring-2 focus-visible:ring-amber-400`.
2. **Recomendação para ISSUE-UX-03 (Touch Targets Padronizados):**
   Adotar rigorosamente o padrão de botão de voltar em cabeçalhos: `w-12 h-12 sm:w-[52px] sm:h-[52px]` com ícone `w-6 h-6 sm:w-7 sm:h-7 strokeWidth={2.4}`. Expandir a área de toque do botão de sumário de etapas para `min-h-[44px] min-w-[44px] flex items-center justify-center`.
3. **Recomendação para ISSUE-UX-04 (Desktop Widescreen Híbrido):**
   Substituir a classe fixa por condicional de breakpoint: `pb-8 lg:pb-12 pb-[calc(7.5rem+...)] lg:pb-8`. No desktop (`lg:` e `xl:`), renderizar as matérias e aulas em grade de 2 a 3 colunas (`max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`), adicionando `window.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModais(); })`.
4. **Recomendação para ISSUE-UX-05 (Eliminação de Layout Thrashing):**
   Substituir a varredura cega por `querySelectorAll` repetida 5 vezes por um reset cirúrgico puramente no elemento contêiner ativo (`root?.scrollTo({ top: 0, behavior: 'instant' })`) em uma única chamada `requestAnimationFrame`, eliminando timeouts encadeados.
5. **Recomendação para ISSUE-UX-06 (Scroll Lock Limpo):**
   Integrar o hook existente `useBodyScrollLock(open)` em todas as bottom sheets e modais com purga completa de estilos inline no fechamento.
6. **Recomendação para ISSUE-UX-08 (Otimização do Arraste):**
   Migrar o estado reativo `dragX` para `useMotionValue(0)` do Framer Motion e utilizar `useTransform` para controlar a opacidade dos carimbos "VERDADEIRO" e "FALSO", eliminando 100% dos re-renders por pixel no arraste.
7. **Recomendação para ISSUE-UX-09 (Resiliência do Player):**
   Implementar timeout de 8 segundos no loader de aula com captura de erro e interface de fallback gracioso contendo botão "Tentar Novamente" e botão "Voltar ao Catálogo".
8. **Recomendação para ISSUE-UX-10 e ISSUE-UX-12 (WCAG AA & ARIA):**
   Elevar o tom dos textos secundários para `text-zinc-300` / `text-zinc-200` garantindo contraste mínimo de 4.5:1. Injetar `aria-label` nas lacunas do exercício completar e `aria-pressed` nos pares de termos.
