import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { resumosLocal, ResumoRef } from '@/lib/resumosLocal';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';

interface ResumosContinuarCardProps {
  onOpenResumo?: (ref: ResumoRef) => void;
}

export const ResumosContinuarCard: React.FC<ResumosContinuarCardProps> = ({ onOpenResumo }) => {
  const navigate = useNavigate();
  const [recente, setRecente] = React.useState<ResumoRef | null>(() => {
    const list = resumosLocal.recentes();
    return list.length > 0 ? list[0] : null;
  });

  React.useEffect(() => {
    const sync = () => {
      const list = resumosLocal.recentes();
      setRecente(list.length > 0 ? list[0] : null);
    };
    window.addEventListener('resumos-local-change', sync);
    return () => window.removeEventListener('resumos-local-change', sync);
  }, []);

  const handleClick = () => {
    haptic.impact();
    if (recente) {
      if (onOpenResumo) {
        onOpenResumo(recente);
      } else {
        navigate(
          `/resumos-juridicos/${encodeURIComponent(recente.area)}/${encodeURIComponent(recente.tema)}`
        );
      }
    } else {
      navigate('/resumos-juridicos/Direito%20Constitucional');
    }
  };

  const coverUrl = recente ? getAreaCover(recente.area)?.cover || constCover : constCover;
  const titulo = recente ? recente.subtema || recente.tema : 'Direitos e Garantias Fundamentais';
  const subtitulo = recente
    ? `${recente.area} · Toque para continuar lendo`
    : 'Direito Constitucional · Toque para começar a estudar';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(to right, rgba(244, 63, 94, 0.22), rgba(244, 63, 94, 0.06))',
        borderColor: 'rgba(244, 63, 94, 0.35)',
      }}
      className="w-full flex items-center gap-3.5 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer"
    >
      {/* Capa do Resumo à esquerda */}
      <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
        <img
          src={coverUrl}
          alt={titulo}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <span className="absolute bottom-0 inset-x-0 bg-rose-600 text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
          RESUMO
        </span>
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <BookOpen className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
            CONTINUAR ESTUDANDO
          </p>
        </div>

        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {titulo}
        </p>

        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-rose-200/80 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span>{subtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita */}
      <ArrowRight
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-rose-400 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />

      {/* Decoração de fundo com glow rose no canto direito */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center opacity-20"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(244, 63, 94, 0.4))',
        }}
      >
        <Layers className="w-24 h-24 text-rose-400" strokeWidth={1.2} />
      </div>
    </motion.button>
  );
};

export default memo(ResumosContinuarCard);

