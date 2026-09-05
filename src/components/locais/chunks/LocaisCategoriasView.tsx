import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CATEGORIAS_LOCAIS,
  labelCategoria,
  type CategoriaLocal,
} from '@/lib/locaisCategorias';
import { obterCapaLocal } from '@/lib/locaisCapas';
import { formatKm, type Contagens, type Local } from './locaisConstants';

interface LocaisCategoriasViewProps {
  locaisProximosGeral: Local[];
  categoriaAtiva: CategoriaLocal | null;
  carregandoGeral: boolean;
  carregandoContagens: boolean;
  contagens: Contagens;
  photos: Record<string, any>;
  onSelectLocal: (local: Local) => void;
  onAbrirCategoria: (categoria: CategoriaLocal) => void;
}

export function LocaisCategoriasView({
  locaisProximosGeral,
  categoriaAtiva,
  carregandoGeral,
  carregandoContagens,
  contagens,
  photos,
  onSelectLocal,
  onAbrirCategoria,
}: LocaisCategoriasViewProps) {
  return (
    <div className="pb-10 lg:px-0 lg:py-0">
      {/* Carrossel de locais próximos globais */}
      {locaisProximosGeral.length > 0 && !categoriaAtiva && (
        <div className="mb-6 mt-2">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-foreground">Perto de você</h3>
            {carregandoGeral && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar">
            {locaisProximosGeral.map((local, idx) => {
              const km = formatKm(local.dist_km);
              const metaCategoria = CATEGORIAS_LOCAIS.find((c) => c.id === local.categoria);
              const Icon = metaCategoria?.icon ?? MapPin;
              return (
                <motion.button
                  key={local.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => onSelectLocal(local)}
                  className="relative snap-start shrink-0 w-[62vw] max-w-[280px] text-left active:scale-95 transition-transform"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                    <img
                      src={obterCapaLocal(local, photos[local.id]?.photo_url)}
                      alt={local.nome}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        const fallbackUrl = obterCapaLocal(local, null);
                        if (e.currentTarget.src !== fallbackUrl) e.currentTarget.src = fallbackUrl;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  </div>
                  {/* Badges no topo */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    {km && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-semibold">
                        <Navigation className="w-3 h-3" /> {km}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-black text-[10px] font-semibold uppercase tracking-wider">
                      <Icon className="w-3 h-3" /> {labelCategoria(local.categoria)}
                    </span>
                  </div>
                  {/* Texto no rodapé */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-[15px] font-bold text-white leading-tight line-clamp-2 drop-shadow">
                      {local.nome}
                    </p>
                    {(local.cidade || local.endereco) && (
                      <p className="text-xs text-white/85 mt-1 line-clamp-1">
                        {local.endereco ?? `${local.cidade}${local.uf ? '/' + local.uf : ''}`}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4">
        <h3 className="font-display text-lg font-bold text-foreground mb-3">Categorias</h3>
        <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
          {CATEGORIAS_LOCAIS.map((categoria) => {
            const total = contagens[categoria.id] ?? 0;
            const disponivel = total > 0;
            const Icon = categoria.icon;
            return (
              <button
                key={categoria.id}
                onClick={() => onAbrirCategoria(categoria.id)}
                className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-base font-semibold text-foreground truncate">
                      {categoria.label}
                    </span>
                    {!disponivel && !carregandoContagens && (
                      <Badge variant="secondary" className="text-[11px]">
                        Novo
                      </Badge>
                    )}
                  </div>
                  <div className="font-body text-[12px] text-muted-foreground truncate mt-0.5">
                    {carregandoContagens
                      ? 'Verificando locais…'
                      : disponivel
                      ? `${total} ${total === 1 ? 'local disponível' : 'locais disponíveis'}`
                      : 'Locais em expansão'}
                  </div>
                </div>
                {carregandoContagens ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
