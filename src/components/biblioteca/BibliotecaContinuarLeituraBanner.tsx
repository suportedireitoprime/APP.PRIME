import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { directImg } from '@/lib/cdnImg';
import { getRecentes, subscribeTracking, type LivroSnapshot } from '@/lib/bibliotecaTracking';
import { readLeituraProgress, type EmProgresso } from '@/lib/leituraProgress';
import { pullLeituraProgress } from '@/lib/leituraProgressSync';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const RED_COLOR = '#E11D48';

interface BibliotecaContinuarLeituraBannerProps {
  onAbrirLivro: (livro: LivroNormalizado) => void;
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

  const displayTag = 'CONTINUAR LEITURA';
  const displayNome = currentSnap?.titulo || 'O Que é Direito · Roberto Lyra Filho';
  const displaySubtitulo = topProgress
    ? `Parou na pág. ${topProgress.index + 1}${topProgress.total ? ` de ${topProgress.total}` : ''} · Clique para retomar`
    : topRecente
    ? 'Último livro acessado · Clique para ler'
    : 'Comece sua leitura do acervo clássico';

  const capaUrl = currentSnap?.capa ? directImg(currentSnap.capa) : null;

  const handleClick = () => {
    haptic.selection();
    if (currentSnap) {
      onAbrirLivro(snapToNormalizado(currentSnap));
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
      });
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
        background: `linear-gradient(to right, ${RED_COLOR}33, ${RED_COLOR}0D)`,
        borderColor: `${RED_COLOR}4D`,
      }}
      className="w-full flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-transform overflow-hidden relative shadow-lg group cursor-pointer my-4"
    >
      {/* Ícone principal / capa em miniatura à esquerda */}
      <div className="flex items-center justify-center shrink-0 z-10 w-11 h-11 rounded-xl bg-black/40 border border-white/10 overflow-hidden shadow-inner">
        {capaUrl ? (
          <img src={capaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <BookOpen
            className="w-6 h-6 text-red-400 group-hover:scale-105 transition-transform"
            strokeWidth={1.8}
          />
        )}
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-red-400">
          {displayTag}
        </p>
        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {displayNome}
        </p>
        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-red-300/80 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500 shrink-0" />
          <span>{displaySubtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita ampliada */}
      <ArrowRight
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-red-400 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />

      {/* Decoração de fundo — SVG translúcido no lado direito com glow vermelho */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center"
        style={{
          filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${RED_COLOR}40)`,
        }}
      >
        <BookOpen
          className="w-24 h-24 opacity-25 text-red-500"
          strokeWidth={1.2}
        />
      </div>
    </motion.button>
  );
});
export default BibliotecaContinuarLeituraBanner;

