import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';

import { INK } from './chunks/shared';
import { SceneAbertura, SceneApresentacao, FeatureScene, SceneChecklist, SceneLimites, ScenePerguntaNome, SceneSaudacao } from './chunks/scenes';
/* ------------------------------------------------------------------ */
/*  ComposiÃ§Ã£o principal                                              */
/* ------------------------------------------------------------------ */

export type HorusIntroProps = {
  owlSrc: string;
  nome: string;
};

/**
 * SequÃªncias (30fps):
 *   1. Abertura              90     (0â€“90)
 *   2. ApresentaÃ§Ã£o          70
 *   3. Feature 1 â€” WhatsApp  150
 *   4. Feature 2 â€” Docs      150
 *   5. Feature 3 â€” OCR       150
 *   6. Feature 4 â€” Ãudios    150
 *   7. Feature 5 â€” Radar     150
 *   8. Checklist recap       170
 *   9. Limites               160
 *  10. Pergunta nome         80    â† PAUSE aqui (input)
 *  11. SaudaÃ§Ã£o final        120
 *
 * TransiÃ§Ãµes (subtraÃ­das do total): 10 transiÃ§Ãµes * ~15 frames.
 */
export const HORUS_INTRO_FPS = 30;
export const HORUS_INTRO_WIDTH = 1080;
export const HORUS_INTRO_HEIGHT = 1920;

const SEQ = {
  abertura: 90,
  apresentacao: 70,
  featWhats: 150,
  featDocs: 150,
  featOCR: 150,
  featAudio: 150,
  featRadar: 150,
  checklist: 170,
  limites: 160,
  perguntaNome: 80,
  saudacao: 120,
};

const TRANS = {
  t1: 15, // abertura â†’ apresentaÃ§Ã£o (fade)
  t2: 20, // apresentaÃ§Ã£o â†’ whats (wipe)
  t3: 15, // whats â†’ docs (fade)
  t4: 15, // docs â†’ ocr (fade)
  t5: 15, // ocr â†’ audio (fade)
  t6: 15, // audio â†’ radar (fade)
  t7: 20, // radar â†’ checklist (wipe)
  t8: 15, // checklist â†’ limites (fade)
  t9: 20, // limites â†’ pergunta (fade)
  t10: 20, // pergunta â†’ saudaÃ§Ã£o (fade)
};

const TOTAL_SEQ = Object.values(SEQ).reduce((a, b) => a + b, 0);
const TOTAL_TRANS = Object.values(TRANS).reduce((a, b) => a + b, 0);
export const HORUS_INTRO_DURATION = TOTAL_SEQ - TOTAL_TRANS;

// PAUSE = 40 frames dentro da cena "Pergunta nome" (para o input aparecer suave).
const START_PERGUNTA =
  SEQ.abertura +
  SEQ.apresentacao +
  SEQ.featWhats +
  SEQ.featDocs +
  SEQ.featOCR +
  SEQ.featAudio +
  SEQ.featRadar +
  SEQ.checklist +
  SEQ.limites -
  (TRANS.t1 +
    TRANS.t2 +
    TRANS.t3 +
    TRANS.t4 +
    TRANS.t5 +
    TRANS.t6 +
    TRANS.t7 +
    TRANS.t8 +
    TRANS.t9);
export const HORUS_INTRO_PAUSE_FRAME = START_PERGUNTA + 40;

export const HorusIntroVideo: React.FC<HorusIntroProps> = ({
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

        <TransitionSeries.Sequence durationInFrames={SEQ.featWhats}>
          <FeatureScene
            step="01 / 05"
            title="Converse comigo"
            titleAccent="no WhatsApp"
            description="Sem baixar nada extra. Manda uma mensagem, foto ou Ã¡udio no WhatsApp e eu respondo em segundos."
            bullets={[
              'Respostas em texto, Ã¡udio ou imagem',
              'Funciona 24h, todos os dias',
              'HistÃ³rico salvo pra vocÃª consultar depois',
            ]}
            mock={<WhatsMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t3 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featDocs}>
          <FeatureScene
            step="02 / 05"
            title="Resumo PDFs"
            titleAccent="e documentos"
            description="Me envie um contrato, sentenÃ§a, edital ou apostila. Eu leio tudo e devolvo o essencial: pontos-chave, prazos e riscos."
            bullets={[
              'Contratos, editais, sentenÃ§as, provas',
              'AtÃ© 200 pÃ¡ginas por documento',
              'Aponto clÃ¡usulas crÃ­ticas em destaque',
            ]}
            mock={<DocMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t4 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featOCR}>
          <FeatureScene
            step="03 / 05"
            title="Leio imagens"
            titleAccent="do seu caderno"
            description="Tirou foto da prova, do resumo ou de um artigo impresso? Mando a foto e eu transcrevo, explico e atÃ© resolvo com vocÃª."
            bullets={[
              'Reconhece letra impressa e manuscrita',
              'Identifica artigos, sÃºmulas e jurisprudÃªncia',
              'Explica cada trecho em linguagem simples',
            ]}
            mock={<OCRMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t5 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featAudio}>
          <FeatureScene
            step="04 / 05"
            title="Entendo Ã¡udios"
            titleAccent="e respondo falando"
            description="Sem tempo pra digitar? Grava um Ã¡udio explicando sua dÃºvida. Eu escuto, entendo e volto a resposta em Ã¡udio pra vocÃª."
            bullets={[
              'Perfeito pra usar dirigindo ou andando',
              'Transcrevo e resumo Ã¡udios de aula',
              'Respondo em portuguÃªs natural',
            ]}
            mock={<AudioMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t6 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featRadar}>
          <FeatureScene
            step="05 / 05"
            title="Aviso quando"
            titleAccent="mudar uma lei"
            description="Monitoro o DiÃ¡rio Oficial, o STF e o STJ e te aviso sobre novas leis, sÃºmulas e portarias que interessam ao que vocÃª estuda."
            bullets={[
              'Novas leis federais e estaduais',
              'SÃºmulas vinculantes do STF e STJ',
              'Resumo curto direto no WhatsApp',
            ]}
            mock={<RadarMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-top' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: TRANS.t7,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.checklist}>
          <SceneChecklist />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t8 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.limites}>
          <SceneLimites />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t9 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.perguntaNome}>
          <ScenePerguntaNome owlSrc={owlSrc} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t10 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.saudacao}>
          <SceneSaudacao owlSrc={owlSrc} nome={nome} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

