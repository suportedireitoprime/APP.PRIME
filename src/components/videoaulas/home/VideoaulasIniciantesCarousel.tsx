import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { VIDEOAULAS_INICIANTES, type VideoaulaDriveItem } from '@/data/videoaulas/videoaulasDriveData';
import { getTituloCurado } from '@/data/videoaulas/titulosIniciantes';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { getCachedProgresso, loadProgresso, subscribeVideoaulas } from '@/lib/videoaulasStore';

interface VideoaulasIniciantesCarouselProps {
  onSelectAula?: (item: VideoaulaDriveItem) => void;
}

export const VideoaulasIniciantesCarousel: React.FC<VideoaulasIniciantesCarouselProps> = memo(
  function VideoaulasIniciantesCarousel({ onSelectAula }) {
    const navigate = useNavigate();
    const { tocarVideo } = useVideoaulasPlayer();

    // Sincronização do progresso real do usuário (Supabase + Cache)
    const [progresso, setProgresso] = useState<Record<string, { percentual: number; concluida: boolean }>>(() => {
      const map: Record<string, { percentual: number; concluida: boolean }> = {};
      const rows = getCachedProgresso() ?? [];
      rows.forEach((r) => {
        if (r?.video_id) {
          map[r.video_id] = {
            percentual: Math.min(100, Math.round(Number(r.percentual) || 0)),
            concluida: !!r.concluida,
          };
        }
      });
      return map;
    });

    useEffect(() => {
      let alive = true;
      void loadProgresso().then((rows) => {
        if (!alive || !rows) return;
        const map: Record<string, { percentual: number; concluida: boolean }> = {};
        rows.forEach((r) => {
          if (r?.video_id) {
            map[r.video_id] = {
              percentual: Math.min(100, Math.round(Number(r.percentual) || 0)),
              concluida: !!r.concluida,
            };
          }
        });
        setProgresso(map);
      });

      const off = subscribeVideoaulas(() => {
        if (!alive) return;
        const rows = getCachedProgresso() ?? [];
        const map: Record<string, { percentual: number; concluida: boolean }> = {};
        rows.forEach((r) => {
          if (r?.video_id) {
            map[r.video_id] = {
              percentual: Math.min(100, Math.round(Number(r.percentual) || 0)),
              concluida: !!r.concluida,
            };
          }
        });
        setProgresso(map);
      });

      return () => {
        alive = false;
        off();
      };
    }, []);

    const totalConcluidas = Object.values(progresso).filter((p) => p.concluida || p.percentual >= 90).length;

    const handleCardClick = (item: VideoaulaDriveItem) => {
      haptic.selection();
      if (onSelectAula) {
        onSelectAula(item);
      } else {
        tocarVideo({
          id: item.id,
          video_id: item.video_id,
          titulo: item.titulo,
          area: 'Fundamentos do Direito',
          descricao: `Aula completa ministrada por ${item.canal}`,
          thumb: item.thumb,
          thumbnail: item.thumb,
          catalogoId: 'iniciante',
          areaSlug: 'todas',
        });
        navigate(`/videoaulas/iniciante/todas/${item.video_id}`);
      }
    };

    return (
      <section className="space-y-3">
        {/* Cabeçalho da Seção */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>Para Iniciantes</span>
                {totalConcluidas > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {totalConcluidas} concluídas
                  </span>
                )}
              </h3>
            </div>
            <p className="text-zinc-400 text-xs sm:text-[13px] leading-tight ml-3.5 mt-0.5 font-sans whitespace-nowrap overflow-visible">
              Fundamentos do Direito do zero
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              navigate('/videoaulas/iniciante');
            }}
            className="shrink-0 flex items-center justify-center gap-1.5 h-[32px] px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap shadow-sm shadow-rose-950/50 active:scale-95 transition-all"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Carrossel Horizontal Fluido com Indicador de Progresso (Permite scroll vertical ao tocar na capa) */}
        <div 
          className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {VIDEOAULAS_INICIANTES.map((item, idx) => {
            const numStr = String(item.numero).padStart(2, '0');
            const p = progresso[item.video_id];
            const concluida = p?.concluida || (p?.percentual ?? 0) >= 90;
            const pct = concluida ? 100 : (p?.percentual ?? 0);
            const curado = getTituloCurado(item);

            return (
              <div
                key={`iniciante-${item.video_id}`}
                onClick={() => handleCardClick(item)}
                style={{ touchAction: 'pan-y' }}
                className="snap-start shrink-0 w-[240px] sm:w-[260px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-[0.98] transition-all duration-150 touch-pan-y"
              >
                {/* Capa 16:9 Limpa e Minimalista (Sem tags cobrindo a arte) */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-amber-500/50 transition-all shadow-lg group-hover:shadow-amber-500/10">
                  <img
                    src={item.thumb}
                    alt={curado.titulo}
                    loading={idx < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                  {/* Número da Aula */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-black text-amber-400 shadow">
                    <span>#{numStr}</span>
                  </div>

                  {/* Badge de Progresso / Duração no Topo Direito */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {concluida ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/95 text-[10px] font-black text-white shadow-md flex items-center gap-1 border border-emerald-400/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluída
                      </span>
                    ) : pct > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/95 text-[10px] font-black text-zinc-950 shadow-md border border-amber-400/40">
                        {pct}%
                      </span>
                    ) : item.duracao ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold text-zinc-300">
                        {item.duracao}
                      </span>
                    ) : null}
                  </div>

                  {/* Botão Play Central Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Barra de Progresso Visual na Base da Capa */}
                  {pct > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          concluida
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            : 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Detalhes da Aula: Título Curto + Descrição Curta e Objetiva */}
                <div className="mt-2.5 px-0.5 space-y-1">
                  <p className="font-sans font-bold text-xs sm:text-[13px] text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-1">
                    {curado.titulo}
                  </p>
                  <p className="font-sans text-[11px] text-zinc-400 font-normal leading-snug line-clamp-1">
                    {curado.descricao}
                  </p>
                  <p className="text-[10.5px] text-zinc-500 font-medium leading-none flex items-center justify-between pt-0.5">
                    <span className="truncate max-w-[130px]">{item.canal}</span>
                    {concluida ? (
                      <span className="text-emerald-400 font-semibold text-[10.5px]">Assistida</span>
                    ) : pct > 0 ? (
                      <span className="text-amber-400 font-semibold text-[10.5px]">{pct}% visto</span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Não iniciada</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);
