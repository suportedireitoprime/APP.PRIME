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
        download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-clara.pdf',
        downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-escura.pdf',
        versoesPdf: {
          clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-clara.pdf',
          escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-escura.pdf',
        },
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
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className="w-full flex items-center gap-3.5 p-3 rounded-2xl border text-left active:scale-[0.99] transition-all overflow-hidden relative group cursor-pointer bg-zinc-900/80 border-white/10 hover:border-white/20 hover:bg-zinc-900"
    >
      {/* Capa Compacta Minimalista à Esquerda */}
      <div className="w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0 relative">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={displayNome}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-zinc-400" />
          </div>
        )}
      </div>

      {/* Informações Minimalistas Centrais */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Continuar leitura
          </span>
          <span className="text-[9px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
            {modoBadge}
          </span>
        </div>

        <h4 className="font-sans font-medium text-sm sm:text-base text-white leading-snug truncate">
          {displayNome}
        </h4>

        <p className="text-xs text-zinc-400 truncate mt-0.5 leading-snug">
          {descricaoUmaLinha}
        </p>

        {/* Barra de Progresso Fina e Minimalista */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
          <div
            style={{ width: `${Math.max(percent, percent > 0 ? 4 : 0)}%` }}
            className="h-full rounded-full transition-all duration-300 bg-white"
          />
        </div>
      </div>

      {/* Botão Ação Circular Minimalista à Direita */}
      <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 active:scale-95">
        <ArrowRight className="w-4 h-4 stroke-[2.2]" />
      </div>
    </motion.button>
  );
});

export default BibliotecaContinuarLeituraBanner;