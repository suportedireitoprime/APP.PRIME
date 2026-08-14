---
name: remotion-cinematic-video
description: Diretrizes Cinematográficas para a criação e refatoração de Apresentações de Biografias em Remotion no app Vade Mecum.
---

# 🎬 Remotion Cinematic Video Guidelines

Esta skill deve ser ativada **sempre** que o agente for instruído a criar ou refatorar vídeos de biografias e apresentações no `APP.PRIME` utilizando o `@remotion/player`. 

O objetivo destas regras é garantir que os vídeos saiam do estágio "básico" (imagens paradas e texto estático) para um padrão **Premium/Cinematográfico**, justificando o valor do aplicativo para os estudantes de Direito.

## 📏 1. Duração e Ritmo
- **Tempo Total**: As biografias não devem ter apenas 1 minuto. Expanda a apresentação para algo entre **1 minuto e meio e 2 minutos** (`2700` a `3600` frames em 30FPS).
- **Tempo por Cena**: Cenas complexas (introdução, julgamentos) devem receber em torno de **12 a 20 segundos** (`360` a `600` frames), permitindo que a imagem seja observada em detalhe e a voz TTS possa ler o texto sem atropelar a transição.
- **Transições**: Nunca faça cortes secos entre cenas de biografia. Use `<TransitionSeries.Transition>` com `fade()` ou `wipe()` cruzado (duração de 30 frames).

## 🎥 2. Parallax e Movimento Constante
A regra de ouro do *Remotion Cinematic* é que **nada na tela pode ficar 100% parado**. 
- Todas as imagens de fundo (`<Img>`) DEVEM possuir um `interpolate` de escala ou `translateY/X` atrelado ao `frame`.
- Exemplo de Ken Burns (Zoom in lento): `transform: scale(${interpolate(frame, [0, 400], [1.0, 1.15])})`.
- Máscaras escuras (`linear-gradient` ou `radial-gradient`) devem sobrepor as imagens para garantir o contraste perfeito para leitura de texto (`#FFF`).

## ✨ 3. Micro-interações e Entrada de Elementos
Não jogue todo o texto na tela no frame `0` da cena.
- Títulos (`h1`, `h2`) devem surgir de baixo com efeito de mola suave utilizando a função `spring()` do Remotion.
- Parágrafos e Citações (`p`) devem usar `interpolate` com `opacity` e um leve `translateY` começando a partir do frame `30` ou `45` (1 a 1.5 segundos após a cena iniciar), criando um efeito de cascata visual.

## 🗣️ 4. Sincronia do Roteiro (TTS) e o Legado do Direito
O componente Overlay que orquestra o Player (ex: `FilosofoPresentationOverlay`) utiliza o `window.speechSynthesis`.
- **Roteiro Estruturado (`ROTEIRO`)**: Ao criar o roteiro em texto, certifique-se de que cada `frame` de disparo combine perfeitamente com a transição da cena no Remotion.
- **Profundidade (Obrigatória)**: O roteiro **NÃO** deve ser apenas a história biográfica do personagem. Ele **DEVE** conter uma reflexão final focada em como o personagem influenciou o **Direito** (ex: respeito às leis, criação da norma fundamental, teoria tridimensional, oratória penal, etc).

## 🛠️ 5. Ferramental Remotion
Sempre estruture o vídeo principal dentro de uma `<TransitionSeries>`:
```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={500}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 30 })} />
  ...
</TransitionSeries>
```
Seja extravagante nos estilos, sombras (`textShadow: 0 10px 40px rgba(...)`) e use partículas sutis ou flocos de neve se fizer sentido no cenário.
