import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { directImg } from '@/lib/cdnImg';
import { getRecentes, subscribeTracking, type LivroSnapshot } from '@/lib/bibliotecaTracking';
import { readLeituraProgress, type EmProgresso } from '@/lib/leituraProgress';
import { pullLeituraProgress } from '@/lib/leituraProgressSync';
import { getUltimoModoLeitura, type UltimoModoLeitura } from '@/lib/leituraModoTracker';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const BEIGE_ACCENT = '#D1BA9A';
const BEIGE_LIGHT = '#ECE0D1';

interface BibliotecaContinuarLeituraBannerProps {
  onAbrirLivro: (livro: LivroNormalizado, modoInicial?: 'nativa' | 'pdf' | 'pdf-clara' | 'pdf-escura') => void;
}

const snapToNormalizado = (s: LivroSnapshot): LivroNormalizado => ({
  id: s.id,
  titulo: s.titulo,
  autor: s.autor ?? null,
  sobre: s.sobre ?? null,
  capa: s.capa ?? null,
  link: s.link ?? null,
  download: s.download ?? null,
  area: s.area ?? null,
  colecaoId: s.colecaoId,
});

export const BibliotecaContinuarLeituraBanner = memo(function BibliotecaContinuarLeituraBanner({
  onAbrirLivro,
}: BibliotecaContinuarLeituraBannerProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeTracking(() => setTick((t) => t + 1));
    void pullLeituraProgress().then(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const emProgresso = readLeituraProgress(tick);
  const recentes = getRecentes();

  const topProgress: EmProgresso | null = emProgresso.length > 0 ? emProgresso[0] : null;
  const topRecente: LivroSnapshot | null = recentes.length > 0 ? recentes[0] : null;

  const currentSnap: LivroSnapshot | null = topProgress ? topProgress.snap : topRecente;

  const modoLeitura: UltimoModoLeitura = useMemo(() => {
    if (!currentSnap) return 'nativa';
    return getUltimoModoLeitura(currentSnap.id, {
      hasNativaProgress: !!topProgress,
      urlClara: currentSnap.download,
    });
  }, [currentSnap, topProgress]);

  const modoBadge = useMemo(() => {
    if (modoLeitura === 'pdf-escura') return 'PDF Dark';
    if (modoLeitura === 'pdf-clara') return 'PDF Claro';
    return 'Leitura Nativa';
  }, [modoLeitura]);

  const percent = useMemo(() => {
    if (topProgress && topProgress.total && topProgress.total > 0) {
      return Math.min(100, Math.max(1, Math.round(((topProgress.index + 1) / topProgress.total) * 100)));
    }
    if (topProgress && typeof topProgress.percent === 'number') {
      return Math.min(100, Math.max(1, topProgress.percent));
    }
    if (currentSnap?.download) {
      const saved = Number(localStorage.getItem(`pdf-reader:page:${currentSnap.download}`) || '0');
      if (saved > 0) return Math.min(100, Math.max(1, saved));
    }
    return 0;
  }, [topProgress, currentSnap]);

  const displayTag = 'CONTINUAR LEITURA';
  const displayNome = currentSnap?.titulo || 'O Que é Direito · Roberto Lyra Filho';
  const displaySubtitulo = topProgress
    ? `Parou na pág. ${topProgress.index + 1}${topProgress.total ? ` de ${topProgress.total}` : ''}`
    : topRecente
    ? 'Último livro acessado'
    : 'Comece sua leitura do acervo clássico';

  const capaUrl = currentSnap?.capa ? directImg(currentSnap.capa) : null;

  const handleClick = () => {
    haptic.selection();
    if (currentSnap) {
      onAbrirLivro(snapToNormalizado(currentSnap), modoLeitura);
    } else {
      onAbrirLivro({
        id: '1',
        titulo: 'O Que é Direito',
        autor: 'Roberto Lyra Filho',
        sobre: 'Uma das mais célebres introduções ao pensamento jurídico.',
        capa: null,
        link: null,
        download: null,
        area: 'Filosofia do Direito',
        colecaoId: 'classicos',
      }, 'nativa');
    }
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(to right, rgba(207, 186, 162, 0.22), rgba(207, 186, 162, 0.05))',
        borderColor: 'rgba(207, 186, 162, 0.38)',
      }}
      className="w-full flex items-stretch rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer min-h-[84px] sm:min-h-[90px]"
    >
      {/* Capa do Livro à esquerda — flush sem margens em cima, na esquerda e embaixo (idêntico a Resumos) */}
      <div className="w-[72px] sm:w-[84px] shrink-0 self-stretch relative overflow-hidden bg-black flex flex-col justify-end border-r border-white/10">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={displayNome}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3d3226] to-[#1c1611] flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#d1ba9a]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
        <span className="relative z-10 w-full bg-[#8c7355] text-[8px] sm:text-[8.5px] font-black uppercase text-center text-white py-0.5 tracking-wider">
          LIVRO
        </span>
      </div>

      {/* Textos centrais, progresso e seta indicativa */}
      <div className="flex-1 min-w-0 z-10 py-3 pl-3 pr-3.5 sm:py-3.5 sm:pl-3.5 sm:pr-4 flex items-center justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <BookOpen className="w-2.5 h-2.5 fill-[#d1ba9a] text-[#d1ba9a]" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d1ba9a]">
              {displayTag}
            </p>
            <span className="text-[8.5px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[#d1ba9a]/20 text-[#ece0d1] border border-[#d1ba9a]/30">
              {modoBadge}
            </span>
          </div>

          <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug line-clamp-1">
            {displayNome}
          </p>

          <p className="text-[11px] sm:text-[11.5px] font-semibold truncate flex items-center gap-1.5 text-[#e5d3b8]/90 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#d1ba9a] shrink-0" />
            <span className="truncate">{displaySubtitulo}</span>
            <span className="text-white/40">• Retomar</span>
          </p>

          {/* Barra de Progresso bege sutil */}
          <div className="w-full mt-2">
            <div className="flex items-center justify-between text-[9.5px] font-medium text-white/50 mb-0.5">
              <span>Progresso</span>
              <span className="font-bold text-[#e5d3b8]">
                {percent > 0 ? `${percent}% concluído` : 'Início'}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8c7355] via-[#bfa482] to-[#d1ba9a] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(209,186,154,0.6)]"
                style={{ width: `${Math.max(percent, percent > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Seta indicativa à direita */}
        <ArrowRight
          className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 z-10 text-[#d1ba9a] group-hover:translate-x-1 transition-transform"
          strokeWidth={2.4}
        />
      </div>

      {/* Decoração de fundo com BookOpen no canto direito */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center opacity-20"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(209, 186, 154, 0.4))',
        }}
      >
        <BookOpen className="w-24 h-24 text-[#d1ba9a]" strokeWidth={1.2} />
      </div>
    </motion.button>
  );
});

export default BibliotecaContinuarLeituraBanner;
