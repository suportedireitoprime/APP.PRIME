import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import {
  getCachedProgresso,
  getCachedAula,
  loadProgresso,
  subscribeVideoaulas,
} from '@/lib/videoaulasStore';
import { CATALOGOS, ytThumb, limparTitulo, slugify } from '@/lib/videoaulasCatalogos';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';

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

  const areaSlug = ultimaAula?.slug || 'constitucional';
  const temaInterativo = getDisciplinaVisualTheme(areaSlug);
  const coverUrl = temaInterativo.fundoAssetUrl || ultimaAula?.thumb;

  const titulo = ultimaAula ? ultimaAula.titulo : 'Direitos e Garantias Fundamentais';
  const subtitulo = ultimaAula
    ? `${ultimaAula.area}${ultimaAula.percentual > 0 ? ` • ${ultimaAula.percentual}% assistido` : ''}`
    : 'Direito Constitucional • Iniciar estudos';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      className="w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 text-left active:scale-[0.985] transition-all overflow-hidden relative shadow-lg group cursor-pointer touch-manipulation backdrop-blur-xl"
    >
      {/* Capa Oficial da Matéria Interativa à esquerda */}
      <div className="relative w-14 sm:w-16 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
        <img
          src={coverUrl}
          alt={titulo}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-1 left-1 right-1 text-center py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-black uppercase text-white border border-white/10 font-sans">
          {ultimaAula?.percentual ? `${ultimaAula.percentual}%` : 'Aula'}
        </span>
      </div>

      {/* Conteúdo Central Sem Abreviar */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-sans">
            Continuar Assistindo
          </p>
        </div>

        {/* Título sem abreviação com quebra limpa */}
        <h3 className="font-sans text-sm sm:text-base font-bold text-white group-hover:text-zinc-200 transition-colors leading-snug break-words">
          {titulo}
        </h3>

        <p className="font-sans text-xs sm:text-[13px] text-zinc-400 leading-tight mt-1 break-words">
          {subtitulo}
        </p>

        {ultimaAula && ultimaAula.percentual > 0 && (
          <div className="w-full bg-white/10 h-1 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${ultimaAula.percentual}%` }}
            />
          </div>
        )}
      </div>

      {/* Botão Play Tátil Circular à Direita */}
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 text-white group-hover:bg-white/15 flex items-center justify-center shrink-0 shadow-md transition-all duration-200">
        <Play className="w-5 h-5 fill-current ml-0.5" />
      </div>
    </motion.button>
  );
});
