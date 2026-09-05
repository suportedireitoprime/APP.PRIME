import React, { memo, Suspense } from 'react';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import type { VoicePassage } from '@/components/vademecum/sheets/GrifoVoiceSheet';
import type { VideoaulaItem } from '@/components/vademecum/sheets/VideoaulasListSheet';
import PremiumGate, { type PremiumFeatureKey } from '@/components/PremiumGate';

const LembretesArtigoSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/LembretesArtigoSheet')
);
const BaixarArtigoSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/BaixarArtigoSheet')
);
const GrifoFotoSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/GrifoFotoSheet')
);
const AnotacoesSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/AnotacoesSheet')
);
const PerguntarSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/PerguntarSheet')
);
const GrafoOverlay = lazyWithRetry(
  () => import('@/components/vademecum/overlays/GrafoOverlay')
);
const GrifoEraseSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/GrifoEraseSheet')
);
const GrifoVoiceSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/GrifoVoiceSheet')
);
const GeracaoAnimacaoOverlay = lazyWithRetry(() =>
  import('@/components/vademecum/overlays/GeracaoAnimacaoOverlay').then((m) => ({
    default: m.GeracaoAnimacaoOverlay,
  }))
);
const VideoaulaSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/VideoaulaSheet')
);
const VideoaulasListSheet = lazyWithRetry(
  () => import('@/components/vademecum/sheets/VideoaulasListSheet')
);

interface ArtigoOverlaysProps {
  showEraseSheet: boolean;
  setShowEraseSheet: (v: boolean) => void;
  eraseSheetHighlights: any[];
  handleRemoveGrifosByColor: (color: string) => void;
  handleClearAllGrifos: () => void;
  showVoiceSheet: boolean;
  setShowVoiceSheet: (v: boolean) => void;
  displayLines: any[];
  addHighlightAtOffsets: (
    lineIndex: number,
    startOffset: number,
    endOffset: number,
    text: string,
    color: string
  ) => void;
  narracaoLoading: boolean;
  narracaoStepIdx: number;
  aiGeneratingMode: string | null;
  aiGeneratingStep: number;
  showVideoaulaSheet: boolean;
  setShowVideoaulaSheet: (v: boolean) => void;
  videoaula: any;
  setVideoaula: (v: any) => void;
  showVideoaulasListSheet: boolean;
  setShowVideoaulasListSheet: (v: boolean) => void;
  tabelaNome?: string;
  artigo?: any;
  showAnotacoesSheet: boolean;
  setShowAnotacoesSheet: (v: boolean) => void;
  setAnotacoesCount: (c: number) => void;
  showPerguntarSheet: boolean;
  setShowPerguntarSheet: (v: boolean) => void;
  showGrafo: boolean;
  setShowGrafo: (v: boolean) => void;
  showPremiumGate: boolean;
  setShowPremiumGate: (v: boolean) => void;
  premiumGateFeature: PremiumFeatureKey;
  premiumGateDesc: string;
  showLembretesLocal: boolean;
  setShowLembretesLocal: (v: boolean) => void;
  showBaixarSheet: boolean;
  setShowBaixarSheet: (v: boolean) => void;
  showGrifoFoto: boolean;
  setShowGrifoFoto: (v: boolean) => void;
}

export const ArtigoOverlays = memo(function ArtigoOverlays({
  showEraseSheet,
  setShowEraseSheet,
  eraseSheetHighlights,
  handleRemoveGrifosByColor,
  handleClearAllGrifos,
  showVoiceSheet,
  setShowVoiceSheet,
  displayLines,
  addHighlightAtOffsets,
  narracaoLoading,
  narracaoStepIdx,
  aiGeneratingMode,
  aiGeneratingStep,
  showVideoaulaSheet,
  setShowVideoaulaSheet,
  videoaula,
  setVideoaula,
  showVideoaulasListSheet,
  setShowVideoaulasListSheet,
  tabelaNome,
  artigo,
  showAnotacoesSheet,
  setShowAnotacoesSheet,
  setAnotacoesCount,
  showPerguntarSheet,
  setShowPerguntarSheet,
  showGrafo,
  setShowGrafo,
  showPremiumGate,
  setShowPremiumGate,
  premiumGateFeature,
  premiumGateDesc,
  showLembretesLocal,
  setShowLembretesLocal,
  showBaixarSheet,
  setShowBaixarSheet,
  showGrifoFoto,
  setShowGrifoFoto,
}: ArtigoOverlaysProps) {
  return (
    <>
      <Suspense fallback={null}>
        {showEraseSheet && (
          <GrifoEraseSheet
            open={showEraseSheet}
            onClose={() => setShowEraseSheet(false)}
            highlights={eraseSheetHighlights}
            onRemoveByColor={handleRemoveGrifosByColor}
            onClearAll={handleClearAllGrifos}
            portalContainer={typeof document !== 'undefined' ? document.body : undefined}
          />
        )}

        {showVoiceSheet && (
          <GrifoVoiceSheet
            open={showVoiceSheet}
            onClose={() => setShowVoiceSheet(false)}
            linhas={displayLines}
            onApplyPassages={(passages: VoicePassage[]) => {
              for (const p of passages) {
                addHighlightAtOffsets(p.lineIndex, p.startOffset, p.endOffset, p.text, p.color);
              }
            }}
          />
        )}

        {/* Overlay do gatinho + checklist enquanto gera a narração */}
        {narracaoLoading && (
          <GeracaoAnimacaoOverlay
            open={narracaoLoading}
            titulo="Gerando sua narração"
            steps={[
              'Preparando o texto do artigo',
              'Gerando narração realista em HD',
              'Salvando narração',
              'Pronto para ouvir',
            ]}
            stepIdx={narracaoStepIdx}
            stepRanges={[
              [0, 15],
              [15, 92],
              [92, 98],
              [100, 100],
            ]}
            estTotalSec={22}
          />
        )}

        {/* Overlay animado ao gerar Explicação / Exemplo / Termos com IA */}
        {aiGeneratingMode !== null && (
          <GeracaoAnimacaoOverlay
            open={aiGeneratingMode !== null}
            titulo={
              aiGeneratingMode === 'explicacao'
                ? 'Gerando explicação com IA'
                : aiGeneratingMode === 'exemplo'
                ? 'Gerando exemplos práticos'
                : aiGeneratingMode === 'termos'
                ? 'Analisando termos jurídicos'
                : 'Gerando conteúdo'
            }
            steps={[
              'Preparando o texto do artigo',
              'Consultando a IA',
              'Formatando conteúdo',
              'Pronto para ler',
            ]}
            stepIdx={aiGeneratingStep}
            stepRanges={[
              [0, 20],
              [20, 85],
              [85, 98],
              [100, 100],
            ]}
            estTotalSec={12}
          />
        )}

        {/* Videoaula full-screen sheet */}
        {showVideoaulaSheet && (
          <VideoaulaSheet
            open={showVideoaulaSheet}
            onClose={() => setShowVideoaulaSheet(false)}
            video={videoaula}
            tabelaNome={tabelaNome || ''}
            artigoNumero={artigo?.numero || ''}
            artigoTexto={artigo?.caput || ''}
          />
        )}

        {showVideoaulasListSheet && (
          <VideoaulasListSheet
            open={showVideoaulasListSheet}
            onClose={() => setShowVideoaulasListSheet(false)}
            tabelaNome={tabelaNome || ''}
            artigoNumero={artigo?.numero || ''}
            leiNome={tabelaNome}
            onSelectVideo={(v: VideoaulaItem) => {
              setVideoaula({
                titulo: v.titulo,
                url: v.url,
                canal: v.canal,
                videoId: v.videoId,
              });
              setShowVideoaulasListSheet(false);
              setShowVideoaulaSheet(true);
            }}
          />
        )}

        {showAnotacoesSheet && artigo && (
          <AnotacoesSheet
            open={showAnotacoesSheet}
            onClose={() => setShowAnotacoesSheet(false)}
            tabelaNome={tabelaNome || 'unknown'}
            artigoNumero={artigo.numero}
            artigoTexto={artigo.caput}
            onCountChange={setAnotacoesCount}
          />
        )}

        {showPerguntarSheet && artigo && (
          <PerguntarSheet
            open={showPerguntarSheet}
            onClose={() => setShowPerguntarSheet(false)}
            tabelaNome={tabelaNome || 'unknown'}
            artigoNumero={artigo.numero}
            artigoTexto={artigo.caput}
          />
        )}

        {tabelaNome && artigo && showGrafo && (
          <GrafoOverlay
            open={showGrafo}
            onClose={() => setShowGrafo(false)}
            tabelaNome={tabelaNome}
            leiNome={tabelaNome}
            artigoNumero={artigo.numero}
            artigoTexto={[
              artigo.caput,
              ...(artigo.incisos?.map((x: any) =>
                typeof x === 'string' ? x : x?.texto
              ) || []),
              ...(artigo.paragrafos?.map((x: any) =>
                typeof x === 'string' ? x : x?.texto
              ) || []),
            ]
              .filter(Boolean)
              .join('\n\n')}
          />
        )}

        <PremiumGate
          open={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          feature={premiumGateFeature}
          description={premiumGateDesc}
        />

        {showLembretesLocal && (
          <LembretesArtigoSheet
            open={showLembretesLocal}
            onClose={() => setShowLembretesLocal(false)}
            artigoRef={`${tabelaNome || 'artigo'}::${artigo?.numero ?? 'x'}`}
            artigoTitulo={
              artigo
                ? `Art. ${artigo.numero}${tabelaNome ? ' — ' + tabelaNome : ''}`
                : 'Artigo'
            }
          />
        )}

        {showBaixarSheet && (
          <BaixarArtigoSheet
            open={showBaixarSheet}
            onClose={() => setShowBaixarSheet(false)}
            artigo={
              artigo
                ? {
                    numero: String(artigo.numero),
                    caput: artigo.caput || '',
                    incisos: (artigo as any).incisos,
                    paragrafos: (artigo as any).paragrafos,
                  }
                : null
            }
            tabelaNome={tabelaNome}
          />
        )}

        {showGrifoFoto && (
          <GrifoFotoSheet open={showGrifoFoto} onClose={() => setShowGrifoFoto(false)} />
        )}
      </Suspense>
    </>
  );
});
