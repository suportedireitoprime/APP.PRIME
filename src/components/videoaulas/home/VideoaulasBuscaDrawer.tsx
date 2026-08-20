import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, X, ChevronRight, Play, Video } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { limparTitulo, simplificarNomeArea, ytThumb } from '@/lib/videoaulasCatalogos';
import { prefetchCatalogo } from '@/lib/videoaulasStore';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import type { AulaHit } from '@/types/videoaula';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const Highlight = React.memo(({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const vowels: Record<string, string> = {
    a: '[aáàãâä]', e: '[eéèêë]', i: '[iíìîï]', o: '[oóòõôö]', u: '[uúùûü]', c: '[cç]'
  };
  
  const termos = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (termos.length === 0) return <>{text}</>;

  const patternStr = termos.map(termo => 
    escapeRegExp(termo).split('').map(char => vowels[char] || char).join('')
  ).join('|');

  try {
    const regex = new RegExp(`(${patternStr})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="text-primary font-bold">{part}</span> : part
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
});

interface VideoaulasBuscaDrawerProps {
  drawerBusca: boolean;
  setDrawerBusca: (v: boolean) => void;
  busca: string;
  setBusca: (v: string) => void;
  drawerCategoria: string;
  setDrawerCategoria: (v: string) => void;
  areasDosResultados: string[];
  lista: any[];
  aulasFiltradas: AulaHit[];
}

export const VideoaulasBuscaDrawer = React.memo(function VideoaulasBuscaDrawer({
  drawerBusca,
  setDrawerBusca,
  busca,
  setBusca,
  drawerCategoria,
  setDrawerCategoria,
  areasDosResultados,
  lista,
  aulasFiltradas
}: VideoaulasBuscaDrawerProps) {
  const navigate = useNavigate();

  return (
    <Drawer open={drawerBusca} onOpenChange={setDrawerBusca}>
      <DrawerContent className="h-[95vh] bg-background border-t border-white/10 px-0 flex flex-col">
        <DrawerTitle className="sr-only">Pesquisar disciplina</DrawerTitle>
        <div className="p-4 border-b border-white/10 shrink-0 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Digite o nome da disciplina..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setDrawerCategoria('Todos');
                }}
                className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {busca && (
                  <button 
                    onClick={() => { setBusca(''); setDrawerCategoria('Todos'); }}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <button 
              onClick={() => { haptic.selection(); /* logica de voz (opcional) */ }}
              className="p-3 hover:bg-white/5 rounded-full transition-colors -ml-1"
            >
              <Mic className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            <button 
              onClick={() => { haptic.selection(); setDrawerBusca(false); }}
              className="p-3 hover:bg-white/5 rounded-full transition-colors -ml-1"
            >
              <X className="h-5 w-5 text-muted-foreground hover:text-white transition-colors" />
            </button>
        </div>

        {areasDosResultados.length > 1 && (
          <div className="border-b border-white/10 shrink-0">
            <div className="flex overflow-x-auto p-4 gap-2 no-scrollbar">
              {areasDosResultados.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    haptic.selection();
                    setDrawerCategoria(cat);
                  }}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    drawerCategoria === cat 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10'
                  }`}
                >
                  {simplificarNomeArea(cat)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lista.length === 0 && aulasFiltradas.length === 0 && (
            <p className="text-center text-muted-foreground text-[13px] py-8 font-medium">
              {busca.trim() ? 'Nenhum resultado encontrado.' : 'Digite para buscar disciplinas e aulas.'}
            </p>
          )}

          {/* Áreas encontradas */}
          {lista.length > 0 && busca.trim() && drawerCategoria === 'Todos' && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-1 pb-0.5">Disciplinas</p>
          )}
          {drawerCategoria === 'Todos' && lista.map((a) => {
            const { Icon, color } = areaIconFor(a.area);
            return (
              <button
                key={`${a.catalogo}-${a.slug}-busca`}
                onPointerDown={() => prefetchCatalogo('areas')}
                onClick={() => {
                  haptic.selection();
                  setDrawerBusca(false);
                  setBusca('');
                  navigate(`/videoaulas/areas/${a.slug}`);
                }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995]"
              >
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center aprender-icon-shine">
                  <Icon className="h-7 w-7" strokeWidth={1.9} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground font-display">
                    <Highlight text={simplificarNomeArea(a.area)} query={busca} />
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Video className="h-3 w-3" />
                    {a.total} {a.total === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}

          {/* Aulas individuais encontradas */}
          {aulasFiltradas.length > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-3 pb-0.5">Aulas</p>
          )}
          {aulasFiltradas.map((a) => (
            <button
              key={`aula-${a.catalogoId}-${a.videoId}`}
              onClick={() => {
                haptic.selection();
                setDrawerBusca(false);
                setBusca('');
                navigate(`/videoaulas/${a.catalogoId}/${a.slugArea}/${a.videoId}`);
              }}
              className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995]"
            >
              <div className="relative w-28 aspect-video shrink-0 rounded-lg overflow-hidden bg-muted">
                <ThumbImg
                  src={ytThumb(a.videoId, 'mq')}
                  alt={a.titulo}
                  fallback={<Play className="h-5 w-5 text-primary/50" />}
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center min-h-[63px]">
                <p className="min-w-0 text-[13px] font-semibold leading-snug text-foreground whitespace-normal">
                  <Highlight text={limparTitulo(a.titulo)} query={busca} />
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground truncate">
                  {simplificarNomeArea(a.area)}
                </p>
              </div>
              <div className="flex h-full items-center justify-center shrink-0 min-h-[63px]">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
});
