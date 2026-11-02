import React from 'react';
import { Star, Play } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';

interface AulasTabFavoritosProps {
  aulasFavoritas: AulaItem[];
  onIniciarAula: (aula: AulaItem) => void;
  onAlternarFavorito: (aula: AulaItem) => void;
  corDestaque?: string;
  onVoltarParaTrilhas: () => void;
}

export const AulasTabFavoritos: React.FC<AulasTabFavoritosProps> = ({
  aulasFavoritas,
  onIniciarAula,
  onAlternarFavorito,
  corDestaque = '#fbbf24',
  onVoltarParaTrilhas
}) => {
  if (aulasFavoritas.length === 0) {
    return (
      <div className="py-14 text-center flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-xl">
          <Star className="w-8 h-8 text-amber-400 stroke-[1.5]" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Nenhuma aula favoritada ainda
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Toque no ícone de estrela em qualquer aula das trilhas para salvá-la aqui e estudar com acesso rápido.
          </p>
        </div>
        <button
          type="button"
          onClick={onVoltarParaTrilhas}
          className="mt-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all active:scale-95 shadow-md"
          style={{ backgroundColor: corDestaque }}
        >
          Explorar Trilhas de Aulas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 fill-current" style={{ color: corDestaque }} />
          <span>AULAS FAVORITAS ({aulasFavoritas.length})</span>
        </h4>
        <span className="text-[11px] text-zinc-400">Salvas para revisão rápida</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {aulasFavoritas.map((aula) => (
          <div
            key={aula.id}
            className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 shadow-lg group"
          >
            {/* Capa miniatura */}
            <div 
              onClick={() => onIniciarAula(aula)}
              className="relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden shrink-0 border border-white/15 cursor-pointer shadow-md group-hover:scale-105 transition-transform"
            >
              <img
                src={aula.capaUrl}
                alt={aula.titulo}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="min-w-0 flex-1">
              <span 
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest block truncate"
                style={{ color: corDestaque }}
              >
                {aula.numeroAula}
              </span>
              <h5 
                onClick={() => onIniciarAula(aula)}
                className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-200 transition-colors line-clamp-2 cursor-pointer mt-0.5 leading-snug"
              >
                {aula.titulo}
              </h5>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 line-clamp-1">
                {aula.etapas} etapas interativas
              </p>
            </div>

            {/* Ações: Desfavoritar e Iniciar */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onAlternarFavorito(aula)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-zinc-400 transition"
                title="Remover dos favoritos"
                aria-label="Remover favorito"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={() => onIniciarAula(aula)}
                className="px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-black flex items-center gap-1 active:scale-95 transition shadow"
                style={{ backgroundColor: corDestaque }}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Ver</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

