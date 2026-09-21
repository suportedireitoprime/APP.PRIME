import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ArrowLeft, Calendar, ChevronRight, Loader2, ScrollText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ANOS_DECRETOS, type LeiOrdinaria } from '@/services/legislacaoService';
import LeiOrdinariaDetail from '@/components/vademecum/artigo/LeiOrdinariaDetail';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DecretoViewProps {
  goBack: () => void;
  config: { label: string; bg: string } | null;
  selectedAnoDecreto: number | null;
  setSelectedAnoDecreto: (ano: number | null) => void;
  decretos: LeiOrdinaria[];
  loadingDecretos: boolean;
  searchDecretos: string;
  setSearchDecretos: (s: string) => void;
  openDecreto: LeiOrdinaria | null;
  setOpenDecreto: (lei: LeiOrdinaria | null) => void;
}

const DecretoView: React.FC<DecretoViewProps> = ({
  goBack,
  config,
  selectedAnoDecreto,
  setSelectedAnoDecreto,
  decretos,
  loadingDecretos,
  searchDecretos,
  setSearchDecretos,
  openDecreto,
  setOpenDecreto,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const filteredDecretos = useMemo(() => {
    if (!searchDecretos) return decretos;
    const q = searchDecretos.toLowerCase();
    return decretos.filter(d =>
      d.numero_lei.toLowerCase().includes(q) ||
      d.ementa.toLowerCase().includes(q)
    );
  }, [decretos, searchDecretos]);

  const listVirtualizer = useWindowVirtualizer({
    count: filteredDecretos.length,
    estimateSize: () => 120,
    overscan: 5,
  });

  if (openDecreto && !isDesktop) {
    return (
      <LeiOrdinariaDetail
        lei={openDecreto}
        onBack={() => setOpenDecreto(null)}
      />
    );
  }

  if (selectedAnoDecreto) {
    return (
      <div className="theme-vademecum min-h-dvh bg-background pb-20 lg:pb-0 flex flex-col">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-[1600px] mx-auto">
            <button
              onClick={() => { setSelectedAnoDecreto(null); setSearchDecretos(''); setOpenDecreto(null); }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4 touch-manipulation select-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">Decretos — {selectedAnoDecreto}</h1>
                <p className="text-white/70 text-sm">{decretos.length} decretos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 md:px-8 py-4 flex gap-6 items-start">
          <div className={`w-full flex flex-col space-y-4 ${isDesktop && openDecreto ? 'lg:w-[380px] xl:w-[420px] shrink-0' : ''}`}>
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou ementa..."
                value={searchDecretos}
                onChange={(e) => setSearchDecretos(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {loadingDecretos ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Carregando decretos...</p>
              </div>
            ) : (
              <div className="relative w-full" style={{ height: `${listVirtualizer.getTotalSize()}px` }}>
                {listVirtualizer.getVirtualItems().map((virtualRow) => {
                  const dec = filteredDecretos[virtualRow.index];
                  const i = virtualRow.index;
                  const isActive = openDecreto?.id === dec.id;
                  return (
                    <div
                      key={dec.id}
                      data-index={virtualRow.index}
                      ref={listVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-2"
                    >
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i < 10 ? i * 0.015 : 0 }}
                        onClick={() => setOpenDecreto(dec)}
                        className={`w-full text-left rounded-2xl transition-all group flex overflow-hidden min-h-[82px] ${isActive ? 'bg-primary shadow-md' : 'bg-card hover:bg-secondary/50 border border-transparent'}`}
                      >
                        <div className={`w-1.5 shrink-0 rounded-l-2xl ${isActive ? 'bg-primary-foreground' : 'bg-primary/50'}`} />
                        <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                            <ScrollText className="w-4 h-4 text-primary-light" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-display text-base font-bold text-primary-light">
                                {dec.numero_lei}
                              </h4>
                              {dec.data_publicacao && (
                                <span className="text-muted-foreground text-xs bg-secondary px-2 py-0.5 rounded-full">
                                  {dec.data_publicacao}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed line-clamp-2 text-foreground/80">
                              {dec.ementa}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 mt-3 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                        </div>
                      </motion.button>
                    </div>
                  );
                })}
                {filteredDecretos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum decreto encontrado.</p>
                )}
              </div>
            )}
          </div>

          {isDesktop && openDecreto && (
            <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden h-[calc(100vh-160px)] sticky top-6 shadow-xl relative z-10 flex flex-col">
              <div className="h-full overflow-y-auto">
                <LeiOrdinariaDetail
                  lei={openDecreto}
                  onBack={() => setOpenDecreto(null)}
                  isEmbedded={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Year selection view for decretos
  return (
    <div className="theme-vademecum min-h-dvh bg-background pb-20 lg:pb-0">
      <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
        <div className="max-w-[1600px] mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4 touch-manipulation select-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">Decretos</h1>
              <p className="text-white/70 text-sm">Selecione o ano</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {ANOS_DECRETOS.map((ano, i) => (
            <motion.button
              key={ano}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedAnoDecreto(ano)}
              className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-center gap-4"
              style={{ borderLeft: '3px solid hsl(var(--primary))' }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-foreground group-hover:text-primary transition-colors font-bold">
                  {ano}
                </h3>
                <p className="text-muted-foreground text-sm">Decretos</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecretoView;
