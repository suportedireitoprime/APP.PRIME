import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  History,
  BarChart3,
  Sparkles,
  Play,
  Clock,
  BookOpen,
  ChevronRight,
  Flame,
  Award,
  Volume2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  audiobooksTracking,
  AudiobookFavItem,
  AudiobookRecenteItem,
} from '@/lib/audiobooksTracking';
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro,
} from '@/data/audiobooksCatalogo';
import { AudiobooksTrilhaResumos } from './AudiobooksTrilhaResumos';

export type AudiobookQuickActionType = 'favoritos' | 'recentes' | 'estatisticas' | 'resumos';

interface AudiobooksQuickActionSheetProps {
  activeSheet: AudiobookQuickActionType | null;
  onClose: () => void;
  onSelectLivro: (livro: AudiobookLivro) => void;
  onPlayLivro: (livro: AudiobookLivro, capituloIndex?: number) => void;
  onPlayResumo?: (livro: AudiobookLivro, capituloIndex?: number) => void;
}

export const AudiobooksQuickActionSheet: React.FC<AudiobooksQuickActionSheetProps> = ({
  activeSheet,
  onClose,
  onSelectLivro,
  onPlayLivro,
  onPlayResumo,
}) => {
  const [tabAtiva, setTabAtiva] = useState<AudiobookQuickActionType>(activeSheet || 'favoritos');
  const [favoritos, setFavoritos] = useState<AudiobookFavItem[]>(() =>
    audiobooksTracking.getFavoritos()
  );
  const [recentes] = useState<AudiobookRecenteItem[]>(() =>
    audiobooksTracking.getRecentes()
  );
  const stats = audiobooksTracking.getEstatisticas();

  // Sincroniza tab ativa com prop activeSheet se mudar
  React.useEffect(() => {
    if (activeSheet) {
      setTabAtiva(activeSheet);
      setFavoritos(audiobooksTracking.getFavoritos());
    }
  }, [activeSheet]);

  const removerFavorito = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact();
    const livro = AUDIOBOOKS_CATALOGO.find((l) => l.id === id);
    if (livro) {
      audiobooksTracking.toggleFavorito(livro);
      setFavoritos(audiobooksTracking.getFavoritos());
      toast.info(`"${livro.titulo}" removido dos favoritos.`);
    }
  };

  const titles: Record<AudiobookQuickActionType, { title: string; subtitle: string }> = {
    favoritos: {
      title: 'Meus Favoritos',
      subtitle: 'Audiobooks salvos para ouvir quando quiser',
    },
    recentes: {
      title: 'Ouvidos Recentemente',
      subtitle: 'Histórico de capítulos e progresso de escuta',
    },
    estatisticas: {
      title: 'Minhas Estatísticas',
      subtitle: 'Tempo de audição, obras e evolução jurídica',
    },
    resumos: {
      title: 'Trilha de Resumos',
      subtitle: 'Obras clássicas sintetizadas em sequência didática',
    },
  };

  if (!activeSheet) return null;

  // ── MODO TELA CHEIA: TRILHA SEQUENCIAL DE RESUMOS (PADRÃO QUESTÕES / DRUNO) ──
  // Padrão 0ms: sem gap superior, cabeçalho sticky no topo absoluto com botão voltar 48x48/52x52
  if (tabAtiva === 'resumos') {
    return (
      <AnimatePresence>
        <motion.div
          key="audiobooks-trilha-resumos-fullscreen"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#07050E] overflow-y-auto overflow-x-hidden flex flex-col"
        >
          <AudiobooksTrilhaResumos
            onBack={onClose}
            onPlayLivro={(livro, idx) => {
              onPlayLivro(livro, idx);
              onClose();
            }}
            onPlayResumo={(livro, capIdx) => {
              if (onPlayResumo) {
                onPlayResumo(livro, capIdx);
              } else {
                onPlayLivro(livro, capIdx);
              }
              onClose();
            }}
            onSelectLivro={(livro) => {
              onSelectLivro(livro);
              onClose();
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        {/* Backdrop Escuro com Blur */}
        <motion.div
          key="audiobooks-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Painel que desliza de baixo para cima */}
        <motion.div
          key="audiobooks-sheet-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full h-[92dvh] max-h-[92dvh] bg-[#0A0A0D] border-t border-[#7C3AED]/30 rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden max-w-3xl mx-auto"
        >
          {/* Header Superior com Botão Voltar Padrão 48x48 */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-purple-500/20 shrink-0 bg-[#0D071E]/95 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-purple-950/60 hover:bg-purple-900/60 active:scale-95 border border-purple-500/30 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(124,58,237,0.25)]"
              aria-label="Fechar"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
            </button>

            <div className="text-center flex-1 px-3 min-w-0 font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
              <h2 className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-bold text-base sm:text-lg text-white truncate">
                {titles[tabAtiva].title}
              </h2>
              <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[11px] sm:text-[12px] text-purple-200/60 truncate">
                {titles[tabAtiva].subtitle}
              </p>
            </div>

            <div className="w-12 sm:w-[52px]" />
          </div>

          {/* Abas Rápidas no Topo do Sheet (Favoritos | Recentes | Estatísticas | Resumos) */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 px-3 sm:px-6 py-2 border-b border-purple-500/20 bg-[#120B24]/90 shrink-0 font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTabAtiva('favoritos');
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none text-center ${
                tabAtiva === 'favoritos'
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/35 border border-[#8B5CF6]'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30 border border-transparent'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${tabAtiva === 'favoritos' ? 'fill-white text-white' : 'text-rose-400'}`} />
              <span className="truncate">Favoritos ({favoritos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTabAtiva('recentes');
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none text-center ${
                tabAtiva === 'recentes'
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/35 border border-[#8B5CF6]'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30 border border-transparent'
              }`}
            >
              <History className={`w-3.5 h-3.5 ${tabAtiva === 'recentes' ? 'text-white' : 'text-[#60A5FA]'}`} />
              <span className="truncate">Recentes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTabAtiva('estatisticas');
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none text-center ${
                tabAtiva === 'estatisticas'
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/35 border border-[#8B5CF6]'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30 border border-transparent'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${tabAtiva === 'estatisticas' ? 'text-white' : 'text-[#FBBF24]'}`} />
              <span className="truncate">Estatísticas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTabAtiva('resumos');
              }}
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none text-center text-purple-200/70 hover:text-white hover:bg-purple-900/30 border border-transparent"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C4B5FD]" />
              <span className="truncate">Resumos</span>
            </button>
          </div>

          {/* Conteúdo Dinâmico com Scroll */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 [scrollbar-width:thin]">
            {/* ── ABA 1: FAVORITOS ── */}
            {tabAtiva === 'favoritos' && (
              <div className="space-y-3">
                {favoritos.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                      <Heart className="w-6 h-6 text-rose-400" />
                    </div>
                    <h3 className="font-sans font-bold text-white text-base">
                      Nenhum audiobook favoritado
                    </h3>
                    <p className="text-xs text-white/50 max-w-xs mt-1.5">
                      Toque no ícone de coração de qualquer livro no catálogo para salvá-lo aqui e ter acesso rápido.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // Favorita o clássico disponível para demonstração
                        audiobooksTracking.toggleFavorito(O_CASO_DOS_EXPLORADORES_DE_CAVERNAS);
                        setFavoritos(audiobooksTracking.getFavoritos());
                        toast.success('Obra adicionada aos favoritos!');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Favoritar &quot;Exploradores de Cavernas&quot;
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favoritos.map((fav) => {
                      const livroCompleto = AUDIOBOOKS_CATALOGO.find((l) => l.id === fav.id) || O_CASO_DOS_EXPLORADORES_DE_CAVERNAS;
                      return (
                        <div
                          key={`fav-${fav.id}`}
                          onClick={() => {
                            haptic.selection();
                            onClose();
                            onSelectLivro(livroCompleto);
                          }}
                          className="p-3 rounded-2xl bg-[#140D26]/85 border border-purple-500/20 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-3 cursor-pointer group shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                        >
                          <img
                            src={fav.capaUrl}
                            alt={fav.titulo}
                            loading="eager"
                            decoding="async"
                            className="w-14 h-18 rounded-xl object-cover shrink-0 border border-white/15"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-sans font-bold text-sm text-white group-hover:text-[#C4B5FD] transition-colors leading-snug">
                              {fav.titulo}
                            </h4>
                            <p className="text-[11px] text-white/50 truncate mt-0.5">
                              {fav.autor}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Play className="w-2 h-2 fill-emerald-300" />
                                Ouvir
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removerFavorito(fav.id, e)}
                            className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            aria-label="Remover favorito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA 2: RECENTES ── */}
            {tabAtiva === 'recentes' && (
              <div className="space-y-3">
                {recentes.map((item) => {
                  const livro = AUDIOBOOKS_CATALOGO.find((l) => l.id === item.id) || O_CASO_DOS_EXPLORADORES_DE_CAVERNAS;
                  return (
                    <div
                      key={`rec-${item.id}`}
                      onClick={() => {
                        haptic.impact();
                        onClose();
                        onPlayLivro(livro, item.capituloIndex);
                      }}
                      className="p-3.5 rounded-2xl bg-[#140D26]/85 border border-purple-500/20 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-3.5 cursor-pointer group shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                    >
                      <div className="relative w-14 h-18 rounded-xl overflow-hidden shrink-0 border border-white/15">
                        <img
                          src={item.capaUrl}
                          alt={item.titulo}
                          loading="eager"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white drop-shadow-md group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                            Parou no Capítulo {item.capituloIndex + 1}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-[#C4B5FD] transition-colors leading-snug">
                          {item.titulo}
                        </h4>
                        <p className="text-[11.5px] text-white/60 truncate mt-0.5">
                          {item.capituloTitulo}
                        </p>
                        <div className="mt-2 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] h-full w-[45%]" />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ABA 3: ESTATÍSTICAS ── */}
            {tabAtiva === 'estatisticas' && (
              <div className="space-y-4">
                {/* Cards de Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#140D26]/85 border border-purple-500/25 text-center shadow-md">
                    <Clock className="w-5 h-5 text-[#A78BFA] mx-auto mb-1.5" />
                    <p className="font-sans font-bold text-xl sm:text-2xl text-white">
                      {stats.tempoMinutos} <span className="text-xs font-normal text-white/60">min</span>
                    </p>
                    <p className="text-[10.5px] text-purple-200/60 uppercase tracking-wider mt-0.5">
                      Tempo Ouvido
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#140D26]/85 border border-emerald-500/25 text-center shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    <p className="font-sans font-bold text-xl sm:text-2xl text-white">
                      {stats.capitulosConcluidos}/{stats.totalCapitulosDisponiveis}
                    </p>
                    <p className="text-[10.5px] text-purple-200/60 uppercase tracking-wider mt-0.5">
                      Capítulos
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#140D26]/85 border border-amber-500/25 text-center shadow-md">
                    <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                    <p className="font-sans font-bold text-xl sm:text-2xl text-white">
                      {stats.diasConsecutivos} <span className="text-xs font-normal text-white/60">dias</span>
                    </p>
                    <p className="text-[10.5px] text-purple-200/60 uppercase tracking-wider mt-0.5">
                      Sequência
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#140D26]/85 border border-blue-500/25 text-center shadow-md">
                    <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                    <p className="font-sans font-bold text-xl sm:text-2xl text-white">
                      {stats.obrasIniciadas}
                    </p>
                    <p className="text-[10.5px] text-purple-200/60 uppercase tracking-wider mt-0.5">
                      Obras em Foco
                    </p>
                  </div>
                </div>

                {/* Selo de Evolução */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED]/25 via-purple-950/40 to-black/80 border border-[#7C3AED]/40 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/25 border border-[#8B5CF6]/50 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-[#DDD6FE]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans font-bold text-white text-sm">
                      Nível de Ouvinte: Fundamentos do Direito
                    </h4>
                    <p className="text-xs text-white/60 leading-snug mt-0.5">
                      Você está avançando na audição de obras clássicas essenciais para o raciocínio dogmático e argumentativo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

