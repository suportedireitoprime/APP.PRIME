# Melhorar o Professor Prime (Me Explique)

## 1. Corrigir o vão preto no cabelo
O desenho da peruca tem um "buraco" no meio (entre os rolos laterais), e a peruca é ampliada e empurrada para cima, então aparece o fundo preto entre o cabelo e a cabeça. Vou redesenhar a peruca como uma peça única e sólida que abraça o topo da cabeça, com os rolos encostados nas laterais do rosto, sem nenhum espaço.

## 2. Aparência mais caprichada
- Rosto com sombreado suave e brilho, bochechas rosadas leves.
- Olhos mais expressivos (brilho duplo, pálpebras), sobrancelhas que reagem ao que ele fala.
- Peruca com textura de cachos e sombra embaixo, para parecer apoiada na cabeça.
- Toga com dobras e o colarinho (jabot) mais definido; mãos e martelo alinhados ao corpo.
- Contorno fino em todo o personagem para ficar com cara de ilustração profissional.

## 3. Movimentos mais naturais
- Respiração leve quando parado; balanço suave da cabeça ao falar.
- Boca sincronizada com o volume real da voz, com transições suaves (sem "pular" de formato a cada quadro).
- Piscadas em tempos variados (não robóticas) e olhar que acompanha o estado: olha para você quando está ouvindo, pensa (olhos para cima) quando está conectando.
- Batida do martelo apenas em picos de ênfase, e não tremendo o tempo todo.
- Estados visuais claros: Conectando, Ouvindo, Falando.

## 4. Correção dos travamentos ("bugs")
- Hoje a boca troca de formato aleatoriamente a cada quadro e o volume atualiza a tela 60 vezes por segundo, o que pesa no celular e causa engasgos. Vou suavizar e limitar essas atualizações.
- Evitar que a animação continue rodando depois de sair da tela.
- Garantir que a boca fecha e o personagem volta ao repouso quando ele para de falar ou a conexão cai.
- Os IDs internos do desenho serão únicos, para não conflitar se o professor aparecer em mais de um lugar.

## Detalhes técnicos
- Reescrever `src/components/laboratorio/avatars/FaceYellow.tsx` (peruca sem recorte interno, gradientes/sombras, `useId` para ids SVG, prop `status`).
- Em `MeExpliqueLiveChatView.tsx`: suavização exponencial do volume, troca de visema por limiar de volume com intervalo mínimo (~90 ms) em vez de aleatório por frame, cancelamento do rAF no unmount, reset em `status !== 'falando'`; passar `status` ao avatar.
- Animações de repouso via CSS keyframes (respiração, piscar com atraso variável), respeitando `prefers-reduced-motion`.
- Verificação com Playwright renderizando o avatar isolado e capturas para conferir o encaixe da peruca.
