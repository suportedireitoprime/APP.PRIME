import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';

import { YELLOW, YELLOW_SOFT, INK, CREAM, displayFont, bodyFont, BackdropRays, Sparkles } from './chunks/AppIntroShared';
import { SceneAbertura, SceneApresentacao, FeatureScene } from './chunks/AppIntroScenes';
import { WhatsMock, DocMock, OCRMock, AudioMock, ProgressMock, MapMock, LogoMock } from './chunks/AppIntroMocks';

/* ------------------------------------------------------------------ */
/*  Composi��o principal                                              */
/* ------------------------------------------------------------------ */

export type AppIntroProps = {
  owlSrc: string;
  nome: string;
};

/**
 * Sequ�ncias (30fps):
 *   1. Abertura              90     (090)
 *   2. Apresenta��o          70
 *   3. Feature 1  Biblioteca 150
 *   4. Feature 2  Flashcards 150
 *   5. Feature 3  Radar     150
 *   6. Feature 4  H�rus     150
 *   7. Sauda��o final        120
 */
export const APP_INTRO_FPS = 30;
export const APP_INTRO_WIDTH = 1080;
export const APP_INTRO_HEIGHT = 1920;

const SEQ = {
  abertura: 90,
  apresentacao: 70,
  featBiblioteca: 150,
  featFlashcards: 150,
  featRadar: 150,
  featHorus: 150,
  saudacao: 120,
};

const TRANS = {
  t1: 15,
  t2: 20,
  t3: 15,
  t4: 15,
  t5: 15,
  t6: 20,
};

const TOTAL_SEQ = Object.values(SEQ).reduce((a, b) => a + b, 0);
const TOTAL_TRANS = Object.values(TRANS).reduce((a, b) => a + b, 0);
export const APP_INTRO_DURATION = TOTAL_SEQ - TOTAL_TRANS;

export const AppIntroVideo: React.FC<AppIntroProps> = ({
  owlSrc,
  nome,
}) => {
  return (
    <AbsoluteFill style={{ background: INK }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SEQ.abertura}>
          <SceneAbertura owlSrc={owlSrc} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t1 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.apresentacao}>
          <SceneApresentacao owlSrc={owlSrc} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-bottom' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: TRANS.t2,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featBiblioteca}>
          <FeatureScene
            step="01 / 04"
            title="Biblioteca"
            titleAccent="Inteligente"
            description="Todos os Vade Mecums, leis e c�digos atualizados diariamente. Leia de forma fluida e encontre o que precisa em segundos."
            bullets={[
              'Atualiza��o di�ria garantida',
              'Busca sem�ntica avan�ada',
              'Leitura adaptativa para telas de qualquer tamanho',
            ]}
            mock={<DocMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t3 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featFlashcards}>
          <FeatureScene
            step="02 / 04"
            title="Flashcards e"
            titleAccent="Quest�es"
            description="Memorize a lei seca com repeti��o espa�ada. Crie cards com um clique a partir de qualquer artigo."
            bullets={[
              'Algoritmo de repeti��o espa�ada',
              'Mais de 50.000 quest�es comentadas',
              'Cria��o de cards com 1 clique',
            ]}
            mock={<OCRMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t4 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featRadar}>
          <FeatureScene
            step="03 / 04"
            title="Radar"
            titleAccent="de Leis"
            description="Nunca mais estude material desatualizado. O Radar te avisa sempre que uma lei ou s�mula importante mudar."
            bullets={[
              'Avisos em tempo real',
              'Resumos das altera��es',
              'Monitoramento do STF e STJ',
            ]}
            mock={<RadarMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t5 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featHorus}>
          <FeatureScene
            step="04 / 04"
            title="H�rus"
            titleAccent="Assistente AI"
            description="D�vidas complexas? O H�rus responde, explica e exemplifica, direto no app ou no seu WhatsApp."
            bullets={[
              'Dispon�vel 24 horas por dia',
              'Entende �udios e imagens',
              'Integrado ao seu WhatsApp',
            ]}
            mock={<WhatsMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t6 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.saudacao}>
          <SceneSaudacao owlSrc={owlSrc} nome={nome} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
