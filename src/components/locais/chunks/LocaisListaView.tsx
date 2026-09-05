import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import gmapsLogo from '@/assets/logos/gmaps.svg';
import { iconCategoria, labelCategoria } from '@/lib/locaisCategorias';
import { obterCapaLocal } from '@/lib/locaisCapas';
import { googleMapsUrl, openInNewTab } from '@/lib/deepLinksMapa';
import { LocaisFiltroBar, type SortOption } from '@/components/locais/LocaisFiltroBar';
import { LocaisCardSkeleton } from '@/components/locais/LocaisCardSkeleton';
import { formatKm, type Local } from './locaisConstants';

interface LocaisListaViewProps {
  sort: SortOption;
  setSort: (s: SortOption) => void;
  buscaCoords: { lat: number; lng: number; endereco: string } | null;
  setBuscaCoords: (coords: { lat: number; lng: number; endereco: string } | null) => void;
  coordsAtivas: { lat: number; lng: number } | null;
  geoLoading: boolean;
  carregandoLocais: boolean;
  locais: Local[];
  destaques: Local[];
  resto: Local[];
  photos: Record<string, any>;
  hasLocation: boolean;
  onSelectLocal: (local: Local) => void;
}

export function LocaisListaView({
  sort,
  setSort,
  buscaCoords,
  setBuscaCoords,
  coordsAtivas,
  geoLoading,
  carregandoLocais,
  locais,
  destaques,
  resto,
  photos,
  hasLocation,
  onSelectLocal,
}: LocaisListaViewProps) {
  const renderCapa = (local: Local, tamanho: 'hero' | 'thumb') => {
    const photoUrlApi = photos[local.id]?.photo_url;
    const url = obterCapaLocal(local, photoUrlApi);
    const base = tamanho === 'hero' ? 'aspect-[4/3] rounded-2xl' : 'w-20 h-20 rounded-xl shrink-0';
    return (
      <div className={`relative overflow-hidden bg-muted ${base}`}>
        <img
          src={url}
          alt={local.nome}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            const fallbackUrl = obterCapaLocal(local, null);
            if (e.currentTarget.src !== fallbackUrl) {
              e.currentTarget.src = fallbackUrl;
            }
          }}
        />
        {tamanho === 'hero' ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        ) : (
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />
        )}
      </div>
    );
  };

  return (
    <div className="pb-10 lg:px-0 lg:py-0">
      <LocaisFiltroBar
        sort={sort}
        onSortChange={setSort}
        onBuscaEndereco={setBuscaCoords}
        onLimparBusca={() => setBuscaCoords(null)}
        buscaAtiva={buscaCoords?.endereco ?? null}
      />

      {/* Barra de status */}
      <div className="px-4 pt-1 pb-2">
        {geoLoading && !coordsAtivas && (
          <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando sua localização…
          </div>
        )}
        {coordsAtivas && (
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            {carregandoLocais
              ? 'Carregando…'
              : `${locais.length} resultados ${buscaCoords ? 'próximos ao endereço' : 'perto de você'}`}
          </div>
        )}
      </div>

      {carregandoLocais && locais.length === 0 && (
        <>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2">
            <LocaisCardSkeleton variant="hero" />
            <LocaisCardSkeleton variant="hero" />
          </div>
          <div className="mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <LocaisCardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {!carregandoLocais && locais.length === 0 && (
        <div className="mx-4 rounded-2xl border border-border bg-card p-6 text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-bold text-foreground">Nenhum local encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ativar a localização ou volte mais tarde.
          </p>
        </div>
      )}

      {/* Carrossel hero */}
      {destaques.length > 0 && (
        <div className="mt-2">
          <div className="px-4 flex items-baseline justify-between mb-2">
            <h3 className="font-display text-base font-bold text-foreground">
              {hasLocation ? 'Perto de você' : 'Em destaque'}
            </h3>
            <span className="text-xs text-muted-foreground">deslize →</span>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-hide">
            {destaques.map((local, idx) => {
              const Icon = iconCategoria(local.categoria);
              const km = formatKm(local.dist_km);
              return (
                <motion.button
                  key={local.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => onSelectLocal(local)}
                  className="relative snap-start shrink-0 w-[62vw] max-w-[280px] text-left"
                >
                  {renderCapa(local, 'hero')}
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

      {/* Lista compacta */}
      {resto.length > 0 && (
        <div className="mt-5">
          <div className="px-4 mb-2">
            <h3 className="font-display text-base font-bold text-foreground">Todos os locais</h3>
          </div>
          <div className="divide-y divide-border border-y border-border bg-card">
            {resto.map((local) => {
              const km = formatKm(local.dist_km);
              return (
                <button
                  key={local.id}
                  onClick={() => onSelectLocal(local)}
                  className="w-full px-4 py-3.5 min-h-[72px] flex items-center gap-3 text-left active:bg-muted/60 transition-colors"
                >
                  {renderCapa(local, 'thumb')}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[16px] font-bold text-foreground leading-tight line-clamp-2">
                      {local.nome}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1 line-clamp-1">
                      {local.endereco || [local.cidade, local.uf].filter(Boolean).join(' / ')}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {km && (
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                          <Navigation className="w-3.5 h-3.5" /> {km}
                        </span>
                      )}
                      {local.cidade && (
                        <span className="text-[13px] text-muted-foreground">
                          {local.cidade}
                          {local.uf ? `/${local.uf}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInNewTab(googleMapsUrl(local));
                    }}
                    className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-sm"
                    aria-label="Traçar rota no Google Maps"
                  >
                    <img src={gmapsLogo} alt="Google Maps" className="w-5 h-5" />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="px-4 pt-4 text-[10px] text-muted-foreground text-center">
        Fotos: Google · Dados: OpenStreetMap
      </p>
    </div>
  );
}
