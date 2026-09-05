import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, ChevronRight, Loader2, ScrollText, Scale, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ANOS_DECRETOS, type LeiOrdinaria } from '@/services/legislacaoService';
import LeiOrdinariaDetail from '@/components/vademecum/artigo/LeiOrdinariaDetail';

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
  const filteredDecretos = useMemo(() => {
    if (!searchDecretos) return decretos;
    const q = searchDecretos.toLowerCase();
    return decretos.filter(d =>
      d.numero_lei.toLowerCase().includes(q) ||
      d.ementa.toLowerCase().includes(q)
    );
  }, [decretos, searchDecretos]);

  if (openDecreto) {
    return (
      <LeiOrdinariaDetail
        lei={openDecreto}
        onBack={() => setOpenDecreto(null)}
      />
    );
  }

  if (selectedAnoDecreto) {
    return (
      <div className="theme-vademecum min-h-dvh bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => { setSelectedAnoDecreto(null); setSearchDecretos(''); }}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
          <div className="relative">
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
            <div className="space-y-2">
              {filteredDecretos.map((dec, i) => (
                <motion.button
                  key={dec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setOpenDecreto(dec)}
                  className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                >
                  <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                  <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <ScrollText className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-display text-[15px] font-bold text-primary-light">
                          {dec.numero_lei}
                        </h4>
                        {dec.data_publicacao && (
                          <span className="text-muted-foreground text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                            {dec.data_publicacao}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                        {dec.ementa}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                  </div>
                </motion.button>
              ))}
              {filteredDecretos.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum decreto encontrado.</p>
              )}
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
        <div className="max-w-7xl mx-auto">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
