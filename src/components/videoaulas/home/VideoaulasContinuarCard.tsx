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
import { CATALOGOS, ytThumb, limparTitulo, slugify, getCapaDaArea } from '@/lib/videoaulasCatalogos';
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

  const areaNome = ultimaAula?.area || ultimaAula?.slug || 'constitucional';
  const coverUrl = getCapaDaArea(areaNome) || ultimaAula?.thumb;

  const titulo = ultimaAula ? ultimaAula.titulo : 'Direitos e Garantias Fundamentais';
  const percentual = ultimaAula?.percentual || 0;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
      style={{ touchAction: 'pan-y' }}
      className="w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-white/[0.07] hover:border-white/15 text-left active:scale-[0.99] transition-all overflow-hidden relative shadow-sm group cursor-pointer touch-pan-y backdrop-blur-md"
    >
      {/* Capa Oficial da Matéria Interativa à esquerda */}
      <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 shadow group-hover:scale-105 transition-transform duration-300">
        <img
          src={coverUrl}
          alt={titulo}
          className="w-full h-full object-cover pointer-events-none select-none"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-1 left-1 right-1 text-center py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-medium uppercase text-white border border-white/10 font-sans">
          {percentual > 0 ? `${percentual}%` : 'Aula'}
        </span>
      </div>

      {/* Conteúdo Central: Apenas Título Sem Negrito + Porcentagem de Quanto Já Viu */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <p className="text-[10px] sm:text-[10.5px] font-light uppercase tracking-wider text-zinc-400 font-sans">
            Continuar Assistindo
          </p>
        </div>

        {/* Título com tipografia fina e elegante */}
        <h3 className="font-sans text-[13.5px] sm:text-[14.5px] font-normal text-white/95 group-hover:text-white transition-colors leading-snug line-clamp-2">
          {titulo}
        </h3>

        {/* Porcentagem de quanto a pessoa já viu */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 max-w-[130px] bg-white/10 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <span className="font-sans text-[11px] text-emerald-400 font-light leading-none">
            {percentual}% concluído
          </span>
        </div>
      </div>

      {/* Botão Play Minimalista */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/60 group-hover:bg-rose-600/80 group-hover:text-white group-hover:border-rose-500/40 flex items-center justify-center shrink-0 transition-all duration-200">
        <Play className="w-4 h-4 fill-current ml-0.5" />
      </div>
    </motion.button>
  );
});
