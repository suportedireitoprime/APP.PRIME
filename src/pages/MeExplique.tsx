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
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 pt-8 pb-5 space-y-6">
        {/* Seção Modalidades */}
        <div>
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
            <div className="flex items-center gap-2">
              <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                EXPLICAÇÃO AO VIVO
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mt-1 mb-4 truncate">
            Aprenda Direito de forma simples e interativa
          </p>

          {/* Grid em Carrossel Horizontal (Sem margem direita para ir até o fim da tela) */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
            {/* Card 1: Câmera ao Vivo */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={Camera}
                label="Apontando a Câmera"
                sublabel="Visão e voz ao vivo"
                color="#F87171"
                onClick={() => navegarModo('camera')}
              />
            </div>

            {/* Card 2: Modo Livre */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={MessageSquare}
                label={<>Modo<br/>Livre</>}
                sublabel="Voz e texto aberto"
                color="#34D399"
                onClick={() => navegarModo('livre')}
              />
            </div>

            {/* Card 3: Livros da Biblioteca */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={BookOpen}
                label="Livros da Biblioteca"
                sublabel="Capítulo por capítulo"
                color="#C084FC"
                onClick={() => navegarModo('livros')}
              />
            </div>

            {/* Card 4: Termos Jurídicos */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={BookA}
                label="Termos Jurídicos"
                sublabel="Dicionário 6 anos"
                color="#FACC15"
                onClick={() => navegarModo('termos')}
              />
            </div>

            {/* Card 5: Leis & Artigos */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={Scale}
                label="Leis & Artigos"
                sublabel="Destrinchar Vade Mecum"
                color="#60A5FA"
                onClick={() => navegarModo('leis')}
              />
            </div>

            {/* Card 6: Casos do Cotidiano */}
            <div className="w-[150px] sm:w-[180px] shrink-0 snap-start">
              <MeExpliqueModalidadeCard
                icon={Sparkles}
                label="Casos do Cotidiano"
                sublabel="Exemplos da vida real"
                color="#FB923C"
                onClick={() => navegarModo('livre')}
              />
            </div>
          </div>
        </div>

        {/* Seção Chat Jurídico */}
        <div className="pt-2 border-t border-border/20">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
            <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
              CHAT JURÍDICO
            </h2>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mt-1 mb-5 truncate">
            Converse com a IA em tempo real
          </p>

          <div className="flex flex-col gap-3">

            {/* Modalidade 2: Botão Chat Jurídico (estilo Horus) */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navegarModo('livre');
              }}
              className="relative overflow-hidden w-full h-[60px] rounded-2xl bg-[#E11D48] text-white font-black text-sm shadow-md hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <MessageSquare className="w-5 h-5" />
              CHAT JURÍDICO
            </button>
          </div>
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
