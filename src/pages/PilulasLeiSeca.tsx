import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Pill, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { CONFIG_MAP, type LeiSecaSlug } from '@/pages/pilulas/data/leiSecaConfig';
import { PilulaLeiSecaItem, type ArtigoLeiSeca } from '@/pages/pilulas/components/PilulaLeiSecaItem';

export type { LeiSecaSlug } from '@/pages/pilulas/data/leiSecaConfig';
export type { ArtigoLeiSeca } from '@/pages/pilulas/components/PilulaLeiSecaItem';

export default function PilulasLeiSeca({ slug }: { slug: LeiSecaSlug }) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const config = CONFIG_MAP[slug] || CONFIG_MAP.cp;

  const { data: artigos = [], isLoading: loading } = useQuery<ArtigoLeiSeca[]>({
    queryKey: ['pilulas', 'lei', slug],
    queryFn: async () => {
      const { data: leiData, error: leiError } = await supabase
        .from('vade_mecum_leis')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (leiError || !leiData) {
        throw new Error(`Erro ao buscar ID do ${slug}`);
      }
      
      const { data, error } = await supabase
        .from('vade_mecum_artigos')
        .select('id, numero, texto, audio_pilula_url, ordem')
        .eq('lei_id', leiData.id)
        .ilike('texto', 'Art.%')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return (data || []) as ArtigoLeiSeca[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24 // 24 horas
  });

  const artigosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return artigos;
    return artigos.filter(
      (a) =>
        a.numero.toLowerCase().includes(termo) ||
        (a.texto && a.texto.toLowerCase().includes(termo))
    );
  }, [artigos, busca]);

  const artigosVirtualizer = useWindowVirtualizer({
    count: artigosFiltrados.length,
    estimateSize: () => 128,
    overscan: 6,
  });

  return (
    <div className="min-h-dvh bg-zinc-950 text-white pb-32 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        {/* Header Fixo */}
        <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                haptic.selection();
                navigate(-1);
              }}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2 truncate">
                <Pill className={`w-5 h-5 shrink-0 ${config.iconColor}`} />
                <span className="truncate">{config.title}</span>
              </h1>
              <p className="text-xs text-white/50 truncate">{config.subtitle}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por número ou termo no artigo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none transition-colors ${config.inputFocusClass}`}
            />
          </div>
        </div>

        {/* Lista de Artigos Virtualizada */}
        <div className="px-4 py-6">
          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse">
                  <div className="w-16 h-24 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="pt-3 flex items-center justify-between">
                      <div className="h-6 w-24 bg-white/10 rounded-full" />
                      <div className="h-8 w-8 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : artigosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center">
              <BookOpen className="w-12 h-12 opacity-20 mb-4" />
              <p className="text-sm">Nenhuma pílula encontrada para os termos buscados.</p>
            </div>
          ) : (
            <div
              className="w-full relative"
              style={{ height: `${artigosVirtualizer.getTotalSize()}px` }}
            >
              {artigosVirtualizer.getVirtualItems().map((virtualItem) => {
                const artigo = artigosFiltrados[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={artigosVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="pb-3">
                      <PilulaLeiSecaItem 
                        artigo={artigo} 
                        navigate={navigate}
                        config={config}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
