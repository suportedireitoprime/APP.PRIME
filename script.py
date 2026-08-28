import re

with open('src/components/onboarding/AppIntroVideo.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace export names
content = content.replace('HorusIntroProps', 'AppIntroProps')
content = content.replace('HorusIntroVideo', 'AppIntroVideo')
content = content.replace('HORUS_INTRO_FPS', 'APP_INTRO_FPS')
content = content.replace('HORUS_INTRO_WIDTH', 'APP_INTRO_WIDTH')
content = content.replace('HORUS_INTRO_HEIGHT', 'APP_INTRO_HEIGHT')
content = content.replace('HORUS_INTRO_DURATION', 'APP_INTRO_DURATION')

# Remove PAUSE frame export
content = re.sub(r'// PAUSE = 40 frames.*?export const HORUS_INTRO_PAUSE_FRAME.*?;', '', content, flags=re.DOTALL)

# Update SEQ
seq_new = '''const SEQ = {
  abertura: 90,
  apresentacao: 70,
  featBiblioteca: 150,
  featFlashcards: 150,
  featRadar: 150,
  featHorus: 150,
  saudacao: 120,
};'''
content = re.sub(r'const SEQ = \{.*?\};', seq_new, content, flags=re.DOTALL)

# Update TRANS
trans_new = '''const TRANS = {
  t1: 15,
  t2: 20,
  t3: 15,
  t4: 15,
  t5: 15,
  t6: 20,
};'''
content = re.sub(r'const TRANS = \{.*?\};', trans_new, content, flags=re.DOTALL)

# Modify TransitionSeries rendering
transitions_new = '''<AbsoluteFill style={{ background: INK }}>
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
            description="Todos os Vade Mecums, leis e códigos atualizados diariamente. Leia de forma fluida e encontre o que precisa em segundos."
            bullets={[
              'Atualização diária garantida',
              'Busca semântica avançada',
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
            titleAccent="Questões"
            description="Memorize a lei seca com repetição espaçada. Crie cards com um clique a partir de qualquer artigo."
            bullets={[
              'Algoritmo de repetição espaçada',
              'Mais de 50.000 questões comentadas',
              'Criação de cards com 1 clique',
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
            description="Nunca mais estude material desatualizado. O Radar te avisa sempre que uma lei ou súmula importante mudar."
            bullets={[
              'Avisos em tempo real',
              'Resumos das alterações',
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
            title="Hórus"
            titleAccent="Assistente AI"
            description="Dúvidas complexas? O Hórus responde, explica e exemplifica, direto no app ou no seu WhatsApp."
            bullets={[
              'Disponível 24 horas por dia',
              'Entende áudios e imagens',
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
    </AbsoluteFill>'''

content = re.sub(r'<AbsoluteFill style={{ background: INK }}>.*?    </AbsoluteFill>', transitions_new, content, flags=re.DOTALL)

with open('src/components/onboarding/AppIntroVideo.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
