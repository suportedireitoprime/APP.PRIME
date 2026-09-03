import { useRef } from 'react';
import { Loader2, MessageSquare, RefreshCw, AlertTriangle, Crown, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGoBack } from '@/hooks/useGoBack';
import { useTrackArea } from '@/hooks/useTrackArea';
import { useMeExpliqueEngine } from '@/hooks/useMeExpliqueEngine';
import { haptic } from '@/lib/nativo';

import PremiumGate from '@/components/PremiumGate';
import TranscricaoSheet from '@/components/meExplique/TranscricaoSheet';
import MeExpliqueConfigSheet from '@/components/meExplique/MeExpliqueConfigSheet';

import { MeExpliqueHeader } from '@/components/meExplique/MeExpliqueHeader';
import { MeExpliqueTutorial } from '@/components/meExplique/MeExpliqueTutorial';
import { MeExpliqueControls } from '@/components/meExplique/MeExpliqueControls';

const SUGESTOES = [
  'Explique isso de forma simples',
  'Isso cai na OAB? Como cobram?',
  'Me dê um exemplo prático',
  'Qual a diferença entre esses institutos?',
];

export default function MeExplique() {
  useTrackArea('me_explique_aberta');
  const voltar = useGoBack('/ferramentas');
  const videoRef = useRef<HTMLVideoElement>(null);

  const engine = useMeExpliqueEngine(videoRef);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Câmera */}
      <div
        className="absolute inset-0 touch-none"
        onPointerUp={engine.tocarParaFocar}
        onTouchStart={engine.aoTocar}
        onTouchMove={engine.aoMover}
        onTouchEnd={engine.aoSoltar}
      >
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          disablePictureInPicture
          className={`h-full w-full ${engine.aoVivo ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${!engine.previewPronto ? 'opacity-0' : 'opacity-100'}`}
        />
        {!engine.previewPronto && !engine.erro && !engine.erroCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        )}
        <AnimatePresence>
          {engine.foco && (
            <motion.span
              key={engine.foco.id}
              initial={{ opacity: 1, scale: 1.35 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onAnimationComplete={() => window.setTimeout(() => engine.setFoco(null), 700)}
              className="pointer-events-none absolute h-20 w-20 rounded-full border-2 border-white/90"
              style={{ left: engine.foco.x - 40, top: engine.foco.y - 40 }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/5 to-black/85" />

      {/* Topo */}
      <MeExpliqueHeader 
        status={engine.status}
        minRest={engine.minRest}
        segRest={engine.segRest}
        historico={engine.historico}
        recursosLanterna={engine.recursos.lanterna}
        lanternaAtiva={engine.lanterna}
        onClose={() => {
          engine.fecharCameraCompleta();
          voltar();
        }}
        onOpenConfig={() => {
          void haptic.light();
          engine.setConfigAberta(true);
        }}
        onOpenTranscricao={() => {
          void haptic.light();
          engine.setTranscricaoAberta(true);
        }}
        onToggleLanterna={engine.alternarLanterna}
      />

      {/* Guia de Enquadramento: Aponte a câmera para o material (some imediatamente ao tocar em "Me explique") */}
      <AnimatePresence>
        {!engine.ativo && !engine.iniciando && !engine.showTutorial && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.92 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-x-4 top-[calc(5.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] z-20 flex justify-center"
          >
            <div className="flex max-w-sm items-center gap-3.5 rounded-2xl border border-white/20 bg-black/70 px-4 py-3 shadow-2xl backdrop-blur-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-inner">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-white leading-tight">
                  Aponte a câmera para o material
                </p>
                <p className="text-[11px] text-white/80 leading-snug mt-0.5">
                  Livro, doutrina, lei, caderno ou peça. Em seguida, toque em <span className="font-bold text-amber-300">"Me explique"</span> abaixo.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Flutuante no 1º Acesso */}
      <MeExpliqueTutorial 
        open={engine.showTutorial}
        onClose={engine.fecharTutorial}
      />

      {/* Transcrição e Erros */}
      <div className="relative z-10 mt-auto space-y-3 px-4 mb-2">
        <AnimatePresence initial={false}>
          {(engine.falaParcial || engine.ultimaFala) && (() => {
            const fala = engine.falaParcial || engine.ultimaFala;
            return (
              <motion.div
                key={engine.falaParcial ? `parcial-${fala.quem}` : `${engine.falas.length}-${fala.texto.slice(0, 12)}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`max-h-40 overflow-y-auto rounded-2xl px-4 py-3 text-[15px] leading-relaxed backdrop-blur ${
                  fala.quem === 'professor' ? 'bg-white/15' : 'bg-primary/85'
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
                  {fala.quem === 'professor' ? 'Professor' : 'Você'}
                </p>
                {fala.texto}
                {engine.falaParcial && (
                  <span className="ml-1 inline-block w-1.5 h-3.5 bg-current animate-pulse opacity-60 rounded-full align-middle" />
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {!engine.showTutorial && (engine.erro || engine.erroCamera) && (
          <div className="rounded-2xl bg-destructive/90 p-4 text-[14px] leading-snug backdrop-blur shadow-xl border border-white/10">
            <p className="font-medium text-white">{engine.erro ?? engine.erroCamera}</p>
            {engine.erroCamera && !engine.erro && (
              <button
                onClick={() => void engine.abrirPreview()}
                className="mt-3 flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-[14px] font-bold text-white hover:bg-white/30 active:scale-95 transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Tentar de novo
              </button>
            )}
          </div>
        )}

        {engine.ativo && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => engine.perguntar(s)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2.5 min-h-[44px] text-[13px] font-medium backdrop-blur active:scale-95 transition-transform"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controles */}
      {!engine.showTutorial && (
        <MeExpliqueControls 
          ativo={engine.ativo}
          micAtivo={engine.micAtivo}
          iniciando={engine.iniciando}
          status={engine.status}
          carregandoPlano={engine.carregandoPlano}
          onAlternarMic={engine.alternarMic}
          onEncerrar={() => {
            void haptic.medium();
            engine.encerrar();
          }}
          onIniciar={() => void engine.iniciar()}
        />
      )}

      {/* Sheets Auxiliares */}
      <TranscricaoSheet
        open={engine.transcricaoAberta}
        onClose={() => engine.setTranscricaoAberta(false)}
        falas={engine.historico}
      />

      <MeExpliqueConfigSheet
        open={engine.configAberta}
        onClose={() => engine.setConfigAberta(false)}
        configAtual={engine.config}
        onSave={(novaConfig) => {
          engine.setConfig(novaConfig);
          localStorage.setItem('me_explique_config', JSON.stringify(novaConfig));
        }}
      />

      {/* Modal de Limite de Tempo */}
      <AnimatePresence>
        {engine.limiteModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-900 p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Tempo Limite Atingido</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {engine.isPremium
                    ? 'Você utilizou seus 5 minutos diários da funcionalidade Me Explique. Volte amanhã para mais explicações!'
                    : 'Você concluiu o teste gratuito de 1 minuto do Me Explique. Torne-se um Assinante PRIME para liberar 5 minutos por dia!'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!engine.isPremium && (
                  <button
                    onClick={() => {
                      engine.setLimiteModal(false);
                      engine.setGateAberto(true);
                    }}
                    className="w-full h-12 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" /> Assinar o PRIME
                  </button>
                )}
                <button
                  onClick={() => engine.setLimiteModal(false)}
                  className="w-full h-11 rounded-2xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PremiumGate
        open={engine.gateAberto}
        onClose={() => engine.setGateAberto(false)}
        feature="explicacao"
        title="Professor ao vivo pela câmera"
        description="Aponte a câmera para qualquer material e receba a explicação falada na hora."
      />
    </div>
  );
}
