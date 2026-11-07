import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import {
  getCachedProgresso,
  getCachedAula,
  loadProgresso,
  subscribeVideoaulas,
} from '@/lib/videoaulasStore';
import { CATALOGOS, ytThumb, limparTitulo, slugify } from '@/lib/videoaulasCatalogos';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';

interface UltimaAulaState {
  videoId: string;
  tabela: string;
  percentual: number;
  concluida: boolean;
  titulo: string;
  area: string;
  thumb: string;
  catalogoId: string;
  slug: string;
}

export const VideoaulasContinuarCard: React.FC = memo(function VideoaulasContinuarCard() {
  const navigate = useNavigate();
  const [ultimaAula, setUltimaAula] = useState<UltimaAulaState | null>(null);

  useEffect(() => {
    let alive = true;

    const atualizar = () => {
      const progresso = getCachedProgresso();
      if (!progresso || progresso.length === 0) {
        if (alive) setUltimaAula(null);
        return;
      }

      const alvo = progresso.find((p) => !p.concluida) || progresso[0];
      let detalhesAula: any = null;
      let catalogoRef: any = null;

      for (const cat of CATALOGOS) {
        if (cat.tabela === alvo.tabela) {
          const aulaCache = getCachedAula(cat.id, alvo.video_id);
          if (aulaCache) {
            detalhesAula = aulaCache;
            catalogoRef = cat;
            break;
          }
        }
      }

      if (detalhesAula && catalogoRef && alive) {
        const areaNome = detalhesAula.area || catalogoRef.titulo || 'Direito Constitucional';
        setUltimaAula({
          videoId: alvo.video_id,
          tabela: alvo.tabela,
          percentual: Math.min(100, Math.round(Number(alvo.percentual) || 0)),
          concluida: !!alvo.concluida,
          titulo: limparTitulo(detalhesAula.titulo),
          area: areaNome,
          thumb: detalhesAula.thumb || detalhesAula.thumbnail || ytThumb(alvo.video_id, 'hq'),
          catalogoId: catalogoRef.id,
          slug: catalogoRef.temAreas ? slugify(areaNome) : 'aulas',
        });
      }
    };

    atualizar();

    void loadProgresso().then(() => {
      if (alive) atualizar();
    });

    const off = subscribeVideoaulas(() => {
      if (alive) atualizar();
    });

    return () => {
      alive = false;
      off();
    };
  }, []);

  const handleClick = () => {
    haptic.impact();
    if (ultimaAula) {
      navigate(`/videoaulas/${ultimaAula.catalogoId}/${ultimaAula.slug}/${ultimaAula.videoId}`);
    } else {
      navigate('/videoaulas/areas/direito-constitucional');
    }
  };

  const coverUrl = ultimaAula
    ? getAreaCover(ultimaAula.area)?.cover || ultimaAula.thumb || constCover
    : constCover;

  const titulo = ultimaAula ? ultimaAula.titulo : 'Direitos e Garantias Fundamentais';
  const subtitulo = ultimaAula
    ? `${ultimaAula.area}${ultimaAula.percentual > 0 ? ` · ${ultimaAula.percentual}% assistido` : ''} · Toque para continuar`
    : 'Direito Constitucional · Toque para começar a assistir';

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
      {/* Capa da Videoaula à esquerda */}
      <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
        <img
          src={coverUrl}
          alt={titulo}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <span className="absolute bottom-0 inset-x-0 bg-rose-600 text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
          AULA
        </span>
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PlayCircle className="w-3 h-3 fill-rose-400 text-black shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
            CONTINUAR ASSISTINDO
          </p>
        </div>

        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug line-clamp-1">
          {titulo}
        </p>

        <p className="text-[11px] sm:text-[11.5px] font-semibold truncate flex items-center gap-1.5 text-rose-200/90 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span className="truncate">{subtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita */}
      <ArrowRight
        className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 z-10 text-rose-400 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />
    </motion.button>
  );
});

