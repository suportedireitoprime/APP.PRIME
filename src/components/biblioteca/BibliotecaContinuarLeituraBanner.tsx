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

  const displayNome = currentSnap?.titulo || 'O Caso dos Exploradores de Cavernas';
  
  // Descrição minimalista consolidada em 1 linha única
  const descricaoUmaLinha = useMemo(() => {
    if (topProgress) {
      const pag = `Pág. ${topProgress.index + 1}${topProgress.total ? ` de ${topProgress.total}` : ''}`;
      const pct = percent > 0 ? `${percent}% concluído` : '';
      return [pag, pct, 'Retomar'].filter(Boolean).join(' • ');
    }
    if (topRecente) {
      return percent > 0 ? `Último acesso • ${percent}% concluído` : 'Último livro acessado • Retomar';
    }
    return 'Comece sua leitura do acervo clássico';
  }, [topProgress, topRecente, percent]);

  const capaUrl = currentSnap?.capa ? directImg(currentSnap.capa, 200) : null;

  const handleClick = () => {
    haptic.selection();
    if (currentSnap) {
      onAbrirLivro(snapToNormalizado(currentSnap), modoLeitura);
    } else {
      onAbrirLivro({
        id: '1',
        titulo: 'O Caso dos Exploradores de Cavernas',
        autor: 'Lon L. Fuller',
        sobre: 'Uma das mais célebres introduções ao pensamento jurídico e dilemas morais.',
        capa: null,
        link: null,
        download: null,
        area: 'Teoria e Filosofia do Direito',
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
      className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border text-left active:scale-[0.99] transition-all overflow-hidden relative shadow-lg group cursor-pointer bg-gradient-to-r from-purple-950/25 via-[#161022] to-[#100b18] border-purple-500/25 hover:border-purple-400/50"
    >
      {/* Capa Compacta Minimalista à Esquerda (Sem contorno) */}
      <div className="w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden bg-black/60 shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={displayNome}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2e1065] to-[#150926] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-purple-300/80" />
          </div>
        )}
        <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
      </div>

      {/* Informações Minimalistas Centrais */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Linha 1: Label + Tag de Modo */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5 fill-purple-400 text-purple-400" />
            Continuar Leitura
          </span>
          <span className="text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border tracking-wider bg-purple-400/15 text-purple-200 border-purple-400/30">
            {modoBadge}
          </span>
        </div>

        {/* Linha 2: Título da Obra (sem abreviação, traços limpos) */}
        <h4 className="font-sans font-normal text-sm sm:text-base text-white leading-snug truncate">
          {displayNome}
        </h4>

        {/* Linha 3: Descrição e Status em UMA LINHA ÚNICA com bolinha pulsante */}
        <p className="text-[11px] sm:text-[11.5px] text-white/60 truncate mt-0.5 flex items-center gap-1.5 leading-snug">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 animate-pulse" />
          <span className="truncate">{descricaoUmaLinha}</span>
        </p>

        {/* Linha 4: Barra de Progresso Fina e Minimalista (h-1) */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
          <div
            style={{ width: `${Math.max(percent, percent > 0 ? 4 : 0)}%` }}
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
          />
        </div>
      </div>

      {/* Botão Ação Circular Minimalista à Direita */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/35 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 active:scale-95 shadow-md">
        <ArrowRight className="w-3.5 h-3.5 stroke-[2.4]" />
      </div>
    </motion.button>
  );
});

export default BibliotecaContinuarLeituraBanner;