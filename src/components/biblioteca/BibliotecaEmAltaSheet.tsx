import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  Crown,
  Medal,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  Bookmark,
  TrendingUp,
  X,
  ChevronRight,
  Award,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { isFavorito, toggleFavorito } from '@/lib/bibliotecaTracking';
import {
  getLivrosEmAlta,
  type LivroEmAltaRanking,
} from '@/data/bibliotecaEmAltaData';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { formatDuration } from '@/lib/leituraProgress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

type FiltroTab = 'todos' | 'semana' | 'classicos' | 'oab';

const FILTROS: { id: FiltroTab; label: string; icon: typeof Flame }[] = [
  { id: 'todos', label: 'Top Geral', icon: Trophy },
  { id: 'semana', label: 'Em Alta na Semana', icon: Flame },
  { id: 'classicos', label: 'Clássicos', icon: Award },
  { id: 'oab', label: 'OAB & Prática', icon: Sparkles },
];

export const BibliotecaEmAltaSheet: React.FC<Props> = ({ open, onClose, onAbrirLivro }) => {
  const [filtro, setFiltro] = useState<FiltroTab>('todos');
  const [favTick, setFavTick] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top > 75) {
      if (!isScrolled) setIsScrolled(true);
    } else {
      if (isScrolled) setIsScrolled(false);
    }
  };

  const ranking = useMemo(() => {
    return getLivrosEmAlta(filtro);
  }, [filtro]);

  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);
  const demais = useMemo(() => ranking.slice(3), [ranking]);

  const totalHorasColetivas = useMemo(() => {
    return ranking.reduce((acc, curr) => acc + curr.horasLidas, 0);
  }, [ranking]);

  const totalLeitoresAtivos = useMemo(() => {
    return ranking.reduce((acc, curr) => acc + curr.leitoresAtivos, 0);
  }, [ranking]);

  const handleToggleFav = (e: React.MouseEvent, livro: LivroNormalizado) => {
    e.stopPropagation();
    haptic.selection();
    const added = toggleFavorito(livro);
    setFavTick((t) => t + 1);
    toast.success(added ? 'Livro salvo na sua estante!' : 'Livro removido dos salvos');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex flex-col justify-end">
        {/* Backdrop escurecido suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic.light();
            onClose();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Conteúdo do Sheet Principal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="relative w-full max-h-[92vh] sm:max-h-[94vh] flex flex-col bg-[#0D0D11] border-t border-amber-500/30 rounded-t-[36px] shadow-[0_-20px_60px_rgba(0,0,0,0.95)] overflow-hidden z-10 text-white select-none"
        >
          {/* Cabeçalho Compacto Flutuante (aparece apenas quando a pessoa desce a tela e some ao voltar ao topo) */}
          <AnimatePresence>
            {isScrolled && (
              <motion.div
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 bg-[#0D0D11]/95 backdrop-blur-xl border-b border-amber-500/25 shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-md border border-amber-300/40 shrink-0">
                    <Flame className="w-4 h-4 text-white fill-white animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] sm:text-[14px] font-bold text-white tracking-tight truncate leading-tight">
                      Obras Em Alta
                    </h3>
                    <p className="text-[9.5px] text-amber-400 font-extrabold tracking-wider uppercase truncate">
                      Ranking da Comunidade
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    onClose();
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer border border-white/15 shrink-0"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Área Rolável Completa (quando a pessoa desce a tela, sobe tudo livremente) */}
          <div
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-[calc(2.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-5"
          >
            {/* Puxador de Arrasto / Indicador Superior */}
            <div className="w-full flex items-center justify-center pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header Hero com Identidade 'Em Alta' / Chamas Douradas */}
            <div className="border-b border-white/10 pb-4 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.5)] border border-amber-300/40 shrink-0">
                    <Flame className="w-6 h-6 text-white fill-white drop-shadow-md animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D0D11]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                        RANKING DA COMUNIDADE
                      </span>
                    </div>
                    <h2 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                      Obras Em Alta
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer border border-white/10"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Painel de Métricas Rápidas Coletivas da Comunidade */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mb-0.5">
                    <Clock className="w-3 h-3" />
                    {totalHorasColetivas}h
                  </span>
                  <span className="text-[10px] text-white/50 leading-tight">Tempo Coletivo</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mb-0.5">
                    <Users className="w-3 h-3" />
                    {totalLeitoresAtivos.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-white/50 leading-tight">Leitores Ativos</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="flex items-center gap-1 text-[11px] text-purple-300 font-semibold mb-0.5">
                    <Sparkles className="w-3 h-3" />
                    96%
                  </span>
                  <span className="text-[10px] text-white/50 leading-tight">Conclusão Média</span>
                </div>
              </div>

              {/* Abas de Filtros em Pílulas */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 -mx-1 px-1">
                {FILTROS.map((f) => {
                  const isActive = filtro === f.id;
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setFiltro(f.id);
                      }}
                      className={cn(
                        'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer border',
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/50 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS */}
            {top3.length >= 3 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Pódio das Obras Mais Lidas
                  </h3>
                  <span className="text-[11px] text-white/40">Atualizado ao vivo</span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
                  {/* #2 Prata (Esquerda) */}
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic.selection();
                      onAbrirLivro(top3[1].livro);
                    }}
                    className="relative flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-zinc-900 border border-slate-400/30 shadow-lg text-center cursor-pointer group"
                  >
                    <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-extrabold text-[11px] flex items-center justify-center border-2 border-[#0D0D11] shadow-md">
                      2
                    </div>
                    <div className="w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 shadow-md my-1.5 ring-1 ring-slate-300/30">
                      <img
                        src={top3[1].livro.capa || ''}
                        alt={top3[1].livro.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="font-semibold text-white text-[11px] line-clamp-2 leading-tight">
                      {top3[1].livro.titulo}
                    </p>
                    <span className="text-[10px] text-slate-300 font-bold mt-1 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {top3[1].horasLidas}h
                    </span>
                    <span className="text-[9px] text-white/50">{top3[1].leitoresAtivos} leitores</span>
                  </motion.div>

                  {/* #1 Ouro (Centro - Mais Elevado) */}
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic.selection();
                      onAbrirLivro(top3[0].livro);
                    }}
                    className="relative flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-amber-600/30 via-orange-950/40 to-zinc-900 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] text-center cursor-pointer -mt-3 group z-10"
                  >
                    <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-[13px] flex items-center justify-center border-2 border-[#0D0D11] shadow-xl">
                      <Crown className="w-4 h-4 fill-amber-950" />
                    </div>
                    <div className="w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden bg-black/60 shadow-xl my-2 ring-2 ring-amber-400/50">
                      <img
                        src={top3[0].livro.capa || ''}
                        alt={top3[0].livro.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded-md mb-0.5">
                      1º LUGAR
                    </span>
                    <p className="font-bold text-white text-[12px] sm:text-[13px] line-clamp-2 leading-tight">
                      {top3[0].livro.titulo}
                    </p>
                    <span className="text-[11px] text-amber-400 font-extrabold mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {top3[0].horasLidas}h lidas
                    </span>
                    <span className="text-[10px] text-white/70">{top3[0].leitoresAtivos} leitores ativos</span>
                  </motion.div>

                  {/* #3 Bronze (Direita) */}
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic.selection();
                      onAbrirLivro(top3[2].livro);
                    }}
                    className="relative flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-amber-900/40 to-zinc-900 border border-amber-700/40 shadow-lg text-center cursor-pointer group"
                  >
                    <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-extrabold text-[11px] flex items-center justify-center border-2 border-[#0D0D11] shadow-md">
                      3
                    </div>
                    <div className="w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 shadow-md my-1.5 ring-1 ring-amber-700/40">
                      <img
                        src={top3[2].livro.capa || ''}
                        alt={top3[2].livro.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="font-semibold text-white text-[11px] line-clamp-2 leading-tight">
                      {top3[2].livro.titulo}
                    </p>
                    <span className="text-[10px] text-amber-300 font-bold mt-1 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {top3[2].horasLidas}h
                    </span>
                    <span className="text-[9px] text-white/50">{top3[2].leitoresAtivos} leitores</span>
                  </motion.div>
                </div>
              </div>
            )}

            {/* LISTA COMPLETA DAS DEMAIS OBRAS DO RANKING */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 pt-2">
                <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-white/80">
                  Ranking Geral da Comunidade
                </h3>
                <span className="text-[11px] text-white/40">{ranking.length} Obras Monitoradas</span>
              </div>

              {ranking.map((item, idx) => {
                const isFav = isFavorito(item.livro);
                const pos = idx + 1;
                const isTop3 = pos <= 3;

                return (
                  <motion.div
                    key={`ranking-${item.livro.id}-${pos}`}
                    whileHover={{ scale: 1.008 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      haptic.selection();
                      onAbrirLivro(item.livro);
                    }}
                    className={cn(
                      'group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left overflow-hidden',
                      isTop3
                        ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border-amber-500/30'
                        : 'bg-[#141419] hover:bg-[#1A1A22] border-white/10 hover:border-amber-500/30'
                    )}
                  >
                    {/* Número da Posição */}
                    <div className="shrink-0 w-8 flex flex-col items-center justify-center">
                      <span
                        className={cn(
                          'text-[15px] sm:text-[16px] font-mono font-black',
                          pos === 1 && 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
                          pos === 2 && 'text-slate-300',
                          pos === 3 && 'text-amber-600',
                          pos > 3 && 'text-white/40 group-hover:text-white/70'
                        )}
                      >
                        #{pos}
                      </span>
                      {item.tendencia && (
                        <span className="text-[8.5px] text-emerald-400 font-bold flex items-center mt-0.5">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        </span>
                      )}
                    </div>

                    {/* Miniatura da Capa */}
                    <div className="relative w-12 sm:w-14 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-zinc-900 shadow-md ring-1 ring-white/10">
                      <img
                        src={item.livro.capa || ''}
                        alt={item.livro.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Informações da Obra */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-white/10 text-white/80">
                          {item.categoriaBadge}
                        </span>
                        {item.destaqueBadge && (
                          <span className="text-[9px] font-bold text-amber-400">
                            {item.destaqueBadge}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[13px] sm:text-[14px] font-bold text-white leading-snug line-clamp-1 group-hover:text-amber-200 transition-colors">
                        {item.livro.titulo}
                      </h4>
                      {item.livro.autor && (
                        <p className="text-[11px] text-white/50 truncate">
                          {item.livro.autor}
                        </p>
                      )}

                      {/* Métricas Coletivas & Pessoais */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10.5px]">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.horasLidas}h acumuladas
                        </span>
                        <span className="text-white/50 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {item.leitoresAtivos} leitores
                        </span>
                      </div>

                      {item.tempoPessoalMs ? (
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                          ✨ Seu tempo nesta obra: {formatDuration(item.tempoPessoalMs)}
                        </p>
                      ) : null}
                    </div>

                    {/* Ações Rápidas: Favoritar & Botão Ler */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFav(e, item.livro)}
                        className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-amber-400 active:scale-90 transition-all cursor-pointer"
                        aria-label="Salvar nos favoritos"
                      >
                        <Bookmark
                          className={cn(
                            'w-4 h-4',
                            isFav && 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          )}
                          strokeWidth={2}
                        />
                      </button>

                      <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-amber-500 text-white/60 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default memo(BibliotecaEmAltaSheet);
