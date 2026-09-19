import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, BookOpen, BookA, MessageSquare, Scale, Sparkles, Clock, Crown, AlertTriangle } from 'lucide-react';

import { useGoBack } from '@/hooks/useGoBack';
import { useTrackArea } from '@/hooks/useTrackArea';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';
import { haptic } from '@/lib/nativeHaptics';

import ShapeGrid from '@/components/ui/ShapeGrid';
import MeExpliqueHeroPanel from '@/components/meExplique/MeExpliqueHeroPanel';
import MeExpliqueModalidadeCard from '@/components/meExplique/MeExpliqueModalidadeCard';
import { MeExpliqueCameraView } from '@/components/meExplique/views/MeExpliqueCameraView';
import { MeExpliqueLivrosView } from '@/components/meExplique/views/MeExpliqueLivrosView';
import { MeExpliqueTermosView } from '@/components/meExplique/views/MeExpliqueTermosView';
import { MeExpliqueLivreView } from '@/components/meExplique/views/MeExpliqueLivreView';
import { MeExpliqueLeisView } from '@/components/meExplique/views/MeExpliqueLeisView';
import PremiumGate from '@/components/PremiumGate';

export type ModoMeExplique = 'hub' | 'camera' | 'livros' | 'termos' | 'livre' | 'leis';

export default function MeExplique() {
  useTrackArea('me_explique_hub');
  const voltar = useGoBack('/ferramentas');
  const [searchParams, setSearchParams] = useSearchParams();

  const cota = useMeExpliqueCota();
  const [gateAberto, setGateAberto] = useState(false);

  const modoUrl = searchParams.get('modo') as ModoMeExplique | null;
  const [modoAtual, setModoAtual] = useState<ModoMeExplique>(() => modoUrl || 'hub');

  useEffect(() => {
    if (modoUrl && modoUrl !== modoAtual) {
      setModoAtual(modoUrl);
    }
  }, [modoUrl, modoAtual]);

  const navegarModo = (modo: ModoMeExplique) => {
    haptic.selection();
    if (cota.limiteAtingido && modo !== 'hub') {
      cota.setLimiteModalAberto(true);
      return;
    }
    setModoAtual(modo);
    if (modo === 'hub') {
      searchParams.delete('modo');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ modo }, { replace: true });
    }
  };

  // Se estiver em uma das 5 modalidades, renderiza a respectiva tela
  if (modoAtual === 'camera') {
    return <MeExpliqueCameraView onVoltar={() => navegarModo('hub')} />;
  }
  if (modoAtual === 'livros') {
    return <MeExpliqueLivrosView onVoltar={() => navegarModo('hub')} />;
  }
  if (modoAtual === 'termos') {
    return <MeExpliqueTermosView onVoltar={() => navegarModo('hub')} />;
  }
  if (modoAtual === 'livre') {
    return <MeExpliqueLivreView onVoltar={() => navegarModo('hub')} />;
  }
  if (modoAtual === 'leis') {
    return <MeExpliqueLeisView onVoltar={() => navegarModo('hub')} />;
  }

  // Renderiza a Nova Tela Central (Hub Multi-Modos com Painel Estilo Vade Mecum e Fundo ShapeGrid)
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col pb-20 selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Fundo Oficial Animado com Quadradinhos (ShapeGrid) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid
          borderColor="rgba(255, 255, 255, 0.04)"
          squareSize={40}
          speed={0.8}
          direction="diagonal"
          className="w-full h-full"
        />
      </div>

      {/* Painel Hero Vermelho Estilo Vade Mecum com Têmis e Mensagem Persuasiva */}
      <div className="relative z-10">
        <MeExpliqueHeroPanel
          onVoltar={voltar}
        />
      </div>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Título de Seção Estilo Home/Vade Mecum com Barra Lateral Vermelha */}
        <div className="flex items-center gap-2 px-1">
          <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
          <h2 className="font-display text-foreground text-[14px] xs:text-[15px] sm:text-[16px] font-bold uppercase tracking-widest">
            ESCOLHA UMA MODALIDADE DE APRENDIZADO
          </h2>
        </div>

        {/* Grid 2 por Linha no mesmo estilo exato dos cards do início do app */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Card 1: Câmera ao Vivo */}
          <MeExpliqueModalidadeCard
            icon={Camera}
            label="Apontando a Câmera"
            sublabel="Visão e voz ao vivo"
            color="#F87171"
            onClick={() => navegarModo('camera')}
          />

          {/* Card 2: Livros da Biblioteca */}
          <MeExpliqueModalidadeCard
            icon={BookOpen}
            label="Livros da Biblioteca"
            sublabel="Capítulo por capítulo"
            color="#C084FC"
            onClick={() => navegarModo('livros')}
          />

          {/* Card 3: Termos Jurídicos */}
          <MeExpliqueModalidadeCard
            icon={BookA}
            label="Termos Jurídicos"
            sublabel="Dicionário 6 anos"
            color="#FACC15"
            onClick={() => navegarModo('termos')}
          />

          {/* Card 4: Modo Livre */}
          <MeExpliqueModalidadeCard
            icon={MessageSquare}
            label="Modo Livre"
            sublabel="Voz e texto aberto"
            color="#34D399"
            onClick={() => navegarModo('livre')}
          />

          {/* Card 5: Leis & Artigos */}
          <MeExpliqueModalidadeCard
            icon={Scale}
            label="Leis & Artigos"
            sublabel="Destrinchar Vade Mecum"
            color="#60A5FA"
            onClick={() => navegarModo('leis')}
          />

          {/* Card 6: Casos do Cotidiano */}
          <MeExpliqueModalidadeCard
            icon={Sparkles}
            label="Casos do Cotidiano"
            sublabel="Exemplos da vida real"
            color="#FB923C"
            onClick={() => navegarModo('livre')}
          />
        </div>

        {/* Card Persuasivo de Rodapé com Cota Compartilhada */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans text-xs font-bold text-white">
                Cota Diária de {cota.isPremium ? '5 Minutos' : '1 Minuto (Degustação)'}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Tempo compartilhado entre todas as modalidades e renovado à meia-noite.
              </p>
            </div>
          </div>

          {!cota.isPremium && (
            <button
              type="button"
              onClick={() => setGateAberto(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-black shadow hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" /> Liberar 5 min
            </button>
          )}
        </div>
      </main>

      {/* Modal de Limite de Tempo Compartilhado */}
      <AnimatePresence>
        {cota.limiteModalAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
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
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {cota.isPremium
                    ? 'Você utilizou seus 5 minutos diários da funcionalidade Me Explique. Volte amanhã para mais explicações!'
                    : 'Você concluiu o teste gratuito de 1 minuto do Me Explique. Torne-se um Assinante PRIME para liberar 5 minutos por dia!'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!cota.isPremium && (
                  <button
                    type="button"
                    onClick={() => {
                      cota.setLimiteModalAberto(false);
                      setGateAberto(true);
                    }}
                    className="w-full h-12 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" /> Assinar o PRIME
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => cota.setLimiteModalAberto(false)}
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
        open={gateAberto}
        onClose={() => setGateAberto(false)}
        feature="explicacao"
        title="Me Explique Ilimitado Diário"
        description="Libere 5 minutos diários com IA em todas as modalidades do Me Explique."
      />
    </div>
  );
}
