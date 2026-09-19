import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, BookOpen, BookA, MessageSquare, Scale, Sparkles, Clock, Crown, ArrowRight, AlertTriangle } from 'lucide-react';

import { useGoBack } from '@/hooks/useGoBack';
import { useTrackArea } from '@/hooks/useTrackArea';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';
import { haptic } from '@/lib/nativo';

import { MeExpliqueHubHeader } from '@/components/meExplique/MeExpliqueHubHeader';
import { MeExpliqueCameraView } from '@/components/meExplique/views/MeExpliqueCameraView';
import { MeExpliqueLivrosView } from '@/components/meExplique/views/MeExpliqueLivrosView';
import { MeExpliqueTermosView } from '@/components/meExplique/views/MeExpliqueTermosView';
import { MeExpliqueLivreView } from '@/components/meExplique/views/MeExpliqueLivreView';
import { MeExpliqueLeisView } from '@/components/meExplique/views/MeExpliqueLeisView';
import PremiumGate from '@/components/PremiumGate';

export type ModoMeExplique = 'hub' | 'camera' | 'livros' | 'termos' | 'livre' | 'leis';

interface CardModalidade {
  id: ModoMeExplique;
  titulo: string;
  subtitulo: string;
  descricao: string;
  badge: string;
  badgeCor: string;
  icone: React.ElementType;
  gradient: string;
  borderCor: string;
}

const MODALIDADES: CardModalidade[] = [
  {
    id: 'camera',
    titulo: 'Apontando a Câmera',
    subtitulo: 'Visão Computacional ao Vivo',
    descricao: 'Aponte para livros, cadernos, leis impressas ou peças para o professor IA analisar e explicar na hora.',
    badge: 'Câmera & Voz',
    badgeCor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icone: Camera,
    gradient: 'from-red-600/30 via-red-950/40 to-black',
    borderCor: 'hover:border-red-500/50',
  },
  {
    id: 'livros',
    titulo: 'Livros da Biblioteca',
    subtitulo: 'Capítulo por Capítulo',
    descricao: 'Escolha uma obra da nossa biblioteca, entenda o básico, explore capítulos e faça perguntas sobre o livro.',
    badge: 'Biblioteca Prime',
    badgeCor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icone: BookOpen,
    gradient: 'from-purple-600/30 via-purple-950/40 to-black',
    borderCor: 'hover:border-purple-500/50',
  },
  {
    id: 'termos',
    titulo: 'Termos Jurídicos',
    subtitulo: 'Dicionário Descomplicado',
    descricao: 'Consulte qualquer palavra difícil do Direito explicada sem juridiquês, como se você tivesse 6 anos de idade.',
    badge: 'Dicionário 6 Anos',
    badgeCor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    icone: BookA,
    gradient: 'from-yellow-600/30 via-amber-950/40 to-black',
    borderCor: 'hover:border-yellow-500/50',
  },
  {
    id: 'livre',
    titulo: 'Modo Livre (Voz e Chat)',
    subtitulo: 'Pergunte Qualquer Coisa',
    descricao: 'Tire qualquer dúvida jurídica ou caso prático do dia a dia por voz ou texto e receba analogias simples.',
    badge: 'Conversa Livre',
    badgeCor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icone: MessageSquare,
    gradient: 'from-emerald-600/30 via-emerald-950/40 to-black',
    borderCor: 'hover:border-emerald-500/50',
  },
  {
    id: 'leis',
    titulo: 'Leis & Artigos',
    subtitulo: 'Destrinchar Vade Mecum',
    descricao: 'Selecione uma lei e o artigo para a IA destrinchar cada detalhe, com exemplos do cotidiano e dicas para a OAB.',
    badge: 'Vade Mecum Didático',
    badgeCor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icone: Scale,
    gradient: 'from-blue-600/30 via-blue-950/40 to-black',
    borderCor: 'hover:border-blue-500/50',
  },
];

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
    void haptic.medium();
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

  // Renderiza a Nova Tela Central (Hub Multi-Modos)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-20 selection:bg-amber-500 selection:text-black">
      {/* Header do Hub com Cota Compartilhada */}
      <MeExpliqueHubHeader
        titulo="Me Explique"
        subtitulo="IA Pedagógica com didática para 6 anos"
        onVoltar={voltar}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner Hero Pedagógico */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-black p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                <Sparkles className="h-3 w-3" /> 5 Modalidades
              </span>
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {cota.minutosRestantes} min diários disponíveis
              </span>
            </div>

            <h2 className="font-sans text-2xl sm:text-3xl font-black text-white tracking-tight">
              O que você quer que o professor te explique agora?
            </h2>

            <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
              O <strong className="text-white">Me Explique</strong> traduz qualquer complexidade jurídica para o português do dia a dia, usando analogias de fácil compreensão, exemplos práticos e zero juridiquês pedante.
            </p>
          </div>

          {/* Efeito Glow Decorativo */}
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        {/* Grade com as 5 Modalidades de Explicação */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-400">
              Escolha uma modalidade de aprendizado:
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {MODALIDADES.map((mod) => {
              const Icone = mod.icone;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => navegarModo(mod.id)}
                  className={`group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br ${mod.gradient} p-5 text-left transition-all hover:bg-zinc-800/80 ${mod.borderCor} active:scale-[0.99] cursor-pointer shadow-xl`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner border border-white/10 group-hover:scale-105 transition-transform">
                        <Icone className="h-6 w-6" />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${mod.badgeCor}`}
                      >
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-sans text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                        {mod.titulo}
                      </h4>
                      <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                        {mod.subtitulo}
                      </p>
                    </div>

                    <p className="text-xs text-zinc-300/90 leading-relaxed">
                      {mod.descricao}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Iniciar explicação</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé Informativo sobre a Cota Diária */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-4 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-sans text-xs font-bold text-white">
              Cota Diária de {cota.isPremium ? '5 Minutos' : '1 Minuto (Teste)'}
            </h4>
            <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
              O tempo é compartilhado entre todas as modalidades e renovado diariamente à meia-noite.
            </p>
          </div>
          {!cota.isPremium && (
            <button
              type="button"
              onClick={() => setGateAberto(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-black shadow hover:bg-amber-400 active:scale-95 transition-all"
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
