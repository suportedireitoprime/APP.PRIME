import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  Crown,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  Bookmark,
  TrendingUp,
  ArrowLeft,
  Award,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { isFavorito, toggleFavorito } from '@/lib/bibliotecaTracking';
import { getLivrosEmAlta, type LivroEmAltaRanking } from '@/data/bibliotecaEmAltaData';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { formatDuration } from '@/lib/leituraProgress';
import ShapeGrid from '@/components/ui/ShapeGrid';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FiltroTab = 'todos' | 'semana' | 'classicos' | 'oab';

const FILTROS: { id: FiltroTab; label: string; icon: typeof Flame }[] = [
  { id: 'todos', label: 'Top Geral', icon: Trophy },
  { id: 'semana', label: 'Em Alta na Semana', icon: Flame },
  { id: 'classicos', label: 'Clássicos', icon: Award },
  { id: 'oab', label: 'OAB & Prática', icon: Sparkles },
];

const BibliotecaEmAlta = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<FiltroTab>('todos');
  const [, setFavTick] = useState(0);
  const [livroSelecionado, setLivroSelecionado] = useState<LivroNormalizado | null>(null);
  const [leitorPdfUrl, setLeitorPdfUrl] = useState<string | null>(null);
  const [leitorPdfTitulo, setLeitorPdfTitulo] = useState<string>('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const ranking = useMemo(() => {
    return getLivrosEmAlta(filtro);
  }, [filtro]);

  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);

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

  const handleAbrirLivro = (livro: LivroNormalizado) => {
    haptic.selection();
    setLivroSelecionado(livro);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-x-hidden pb-24">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        {/* Barra Superior de Navegação */}
        <header className="flex items-center justify-between pb-4">
          <button
            onClick={() => {
              haptic.light();
              navigate('/bibliotecas');
            }}
            aria-label="Voltar para Biblioteca"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 grid place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/25">
              <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
              RANKING AO VIVO
            </span>
          </div>
        </header>

        {/* Título Principal */}
        <div className="py-2">
          <h1 className="font-serif text-[26px] sm:text-[32px] font-bold tracking-tight text-white flex items-center gap-2.5">
            Obras Em Alta
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Os livros e clássicos do Direito mais acessados pela comunidade, com horas de leitura coletivas acumuladas e ranking de preferência.
          </p>
        </div>

        {/* Cards de Métricas da Comunidade */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-[#141419]/90 border border-white/10 shadow-lg text-center flex flex-col items-center justify-center">
            <span className="flex items-center gap-1 text-sm sm:text-base font-extrabold text-amber-400">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {totalHorasColetivas}h
            </span>
            <span className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">Leitura Coletiva</span>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#141419]/90 border border-white/10 shadow-lg text-center flex flex-col items-center justify-center">
            <span className="flex items-center gap-1 text-sm sm:text-base font-extrabold text-emerald-400">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {totalLeitoresAtivos.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">Leitores Ativos</span>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#141419]/90 border border-white/10 shadow-lg text-center flex flex-col items-center justify-center">
            <span className="flex items-center gap-1 text-sm sm:text-base font-extrabold text-purple-300">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              96%
            </span>
            <span className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">Conclusão Média</span>
          </div>
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-4">
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
                  'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/50 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* PÓDIO TOP 3 */}
        {top3.length >= 3 && (
          <section className="my-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Pódio das Obras Mais Lidas
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
              {/* #2 Prata */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAbrirLivro(top3[1].livro)}
                className="relative flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-slate-800/80 to-zinc-900 border border-slate-400/30 shadow-lg text-center cursor-pointer group"
              >
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs flex items-center justify-center border-2 border-[#0D0D11] shadow-md">
                  2
                </div>
                <div className="w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 shadow-md my-2 ring-1 ring-slate-300/30">
                  <img
                    src={top3[1].livro.capa || ''}
                    alt={top3[1].livro.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight">
                  {top3[1].livro.titulo}
                </p>
                <span className="text-[11px] text-slate-300 font-bold mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {top3[1].horasLidas}h
                </span>
                <span className="text-[10px] text-white/50">{top3[1].leitoresAtivos} leitores</span>
              </motion.div>

              {/* #1 Ouro */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAbrirLivro(top3[0].livro)}
                className="relative flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-600/30 via-orange-950/40 to-zinc-900 border-2 border-amber-400/60 shadow-[0_0_36px_rgba(245,158,11,0.3)] text-center cursor-pointer -mt-4 group z-10"
              >
                <div className="absolute -top-5 w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-sm flex items-center justify-center border-2 border-[#0D0D11] shadow-xl">
                  <Crown className="w-4 h-4 fill-amber-950" />
                </div>
                <div className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-black/60 shadow-xl my-2 ring-2 ring-amber-400/50">
                  <img
                    src={top3[0].livro.capa || ''}
                    alt={top3[0].livro.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md mb-0.5">
                  1º LUGAR
                </span>
                <p className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-tight">
                  {top3[0].livro.titulo}
                </p>
                <span className="text-xs text-amber-400 font-extrabold mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {top3[0].horasLidas}h lidas
                </span>
                <span className="text-[11px] text-white/70">{top3[0].leitoresAtivos} leitores</span>
              </motion.div>

              {/* #3 Bronze */}
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAbrirLivro(top3[2].livro)}
                className="relative flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-amber-900/40 to-zinc-900 border border-amber-700/40 shadow-lg text-center cursor-pointer group"
              >
                <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-extrabold text-xs flex items-center justify-center border-2 border-[#0D0D11] shadow-md">
                  3
                </div>
                <div className="w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 shadow-md my-2 ring-1 ring-amber-700/40">
                  <img
                    src={top3[2].livro.capa || ''}
                    alt={top3[2].livro.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight">
                  {top3[2].livro.titulo}
                </p>
                <span className="text-[11px] text-amber-300 font-bold mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {top3[2].horasLidas}h
                </span>
                <span className="text-[10px] text-white/50">{top3[2].leitoresAtivos} leitores</span>
              </motion.div>
            </div>
          </section>
        )}

        {/* LISTA COMPLETA DAS DEMAIS OBRAS DO RANKING */}
        <section className="space-y-3 mt-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-white/80">
              Ranking Geral da Comunidade
            </h2>
            <span className="text-xs text-white/40">{ranking.length} Obras Monitoradas</span>
          </div>

          {ranking.map((item, idx) => {
            const isFav = isFavorito(item.livro);
            const pos = idx + 1;
            const isTop3 = pos <= 3;

            return (
              <motion.div
                key={`ranking-page-${item.livro.id}-${pos}`}
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleAbrirLivro(item.livro)}
                className={cn(
                  'group relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left overflow-hidden',
                  isTop3
                    ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border-amber-500/30'
                    : 'bg-[#141419] hover:bg-[#1A1A22] border-white/10 hover:border-amber-500/30'
                )}
              >
                {/* Número da Posição */}
                <div className="shrink-0 w-8 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'text-base sm:text-lg font-mono font-black',
                      pos === 1 && 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
                      pos === 2 && 'text-slate-300',
                      pos === 3 && 'text-amber-600',
                      pos > 3 && 'text-white/40 group-hover:text-white/70'
                    )}
                  >
                    #{pos}
                  </span>
                  {item.tendencia && (
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center mt-0.5">
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    </span>
                  )}
                </div>

                {/* Miniatura da Capa */}
                <div className="relative w-14 sm:w-16 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-zinc-900 shadow-md ring-1 ring-white/10">
                  <img
                    src={item.livro.capa || ''}
                    alt={item.livro.titulo}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Informações da Obra */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                      {item.categoriaBadge}
                    </span>
                    {item.destaqueBadge && (
                      <span className="text-[9.5px] font-bold text-amber-400">
                        {item.destaqueBadge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1 group-hover:text-amber-200 transition-colors">
                    {item.livro.titulo}
                  </h3>
                  {item.livro.autor && (
                    <p className="text-xs text-white/50 truncate">
                      {item.livro.autor}
                    </p>
                  )}

                  {/* Métricas Coletivas & Pessoais */}
                  <div className="flex items-center gap-3.5 mt-2 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.horasLidas}h acumuladas
                    </span>
                    <span className="text-white/50 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {item.leitoresAtivos} leitores
                    </span>
                  </div>

                  {item.tempoPessoalMs ? (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      ✨ Seu tempo nesta obra: {formatDuration(item.tempoPessoalMs)}
                    </p>
                  ) : null}
                </div>

                {/* Ações Rápidas: Favoritar & Botão Ler */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(e, item.livro)}
                    className="p-2.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-amber-400 active:scale-90 transition-all cursor-pointer"
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbrirLivro(item.livro);
                    }}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Ler
                  </button>
                </div>
              </motion.div>
            );
          })}
        </section>
      </div>

      {/* Sheet de Detalhes do Livro */}
      {livroSelecionado && (
        <LivroDetailSheet
          livro={livroSelecionado}
          open={!!livroSelecionado}
          onClose={() => setLivroSelecionado(null)}
        />
      )}

      {/* Leitor de PDF Paginado */}
      <AnimatePresence>
        {leitorPdfUrl && (
          <PdfPaginatedReader
            url={leitorPdfUrl}
            titulo={leitorPdfTitulo}
            onClose={() => {
              setLeitorPdfUrl(null);
              setLeitorPdfTitulo('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BibliotecaEmAlta;
