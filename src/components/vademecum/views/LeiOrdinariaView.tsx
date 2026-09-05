import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, ChevronRight, FileText, Loader2, Scale, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ANOS_LEIS_ORDINARIAS, type LeiOrdinaria } from '@/services/legislacaoService';
import LeiOrdinariaDetail from '@/components/vademecum/artigo/LeiOrdinariaDetail';

interface LeiOrdinariaViewProps {
  goBack: () => void;
  config: { label: string; bg: string } | null;
  selectedAno: number | null;
  setSelectedAno: (ano: number | null) => void;
  leisOrdinarias: LeiOrdinaria[];
  loadingLeisOrd: boolean;
  searchLeisOrd: string;
  setSearchLeisOrd: (s: string) => void;
  openLeiOrd: LeiOrdinaria | null;
  setOpenLeiOrd: (lei: LeiOrdinaria | null) => void;
}

const LeiOrdinariaView: React.FC<LeiOrdinariaViewProps> = ({
  goBack,
  config,
  selectedAno,
  setSelectedAno,
  leisOrdinarias,
  loadingLeisOrd,
  searchLeisOrd,
  setSearchLeisOrd,
  openLeiOrd,
  setOpenLeiOrd,
}) => {
  const filteredLeisOrdinarias = useMemo(() => {
    if (!searchLeisOrd) return leisOrdinarias;
    const q = searchLeisOrd.toLowerCase();
    return leisOrdinarias.filter(l =>
      l.numero_lei.toLowerCase().includes(q) ||
      l.ementa.toLowerCase().includes(q)
    );
  }, [leisOrdinarias, searchLeisOrd]);

  // If viewing a specific lei ordinária detail
  if (openLeiOrd) {
    return (
      <LeiOrdinariaDetail
        lei={openLeiOrd}
        onBack={() => setOpenLeiOrd(null)}
      />
    );
  }

  // If a year is selected, show the list of laws
  if (selectedAno) {
    return (
      <div className="theme-vademecum min-h-dvh bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => { setSelectedAno(null); setSearchLeisOrd(''); }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4 touch-manipulation select-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">Leis Ordinárias — {selectedAno}</h1>
                <p className="text-white/70 text-sm">{leisOrdinarias.length} leis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou ementa..."
              value={searchLeisOrd}
              onChange={(e) => setSearchLeisOrd(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          {loadingLeisOrd ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Carregando leis ordinárias...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeisOrdinarias.map((lei, i) => (
                <motion.button
                  key={lei.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setOpenLeiOrd(lei)}
                  className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                >
                  <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                  <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-display text-[15px] font-bold text-primary-light">
                          {lei.numero_lei}
                        </h4>
                        {lei.data_publicacao && (
                          <span className="text-muted-foreground text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                            {lei.data_publicacao}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                        {lei.ementa}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                  </div>
                </motion.button>
              ))}
              {filteredLeisOrdinarias.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma lei encontrada.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Year selection view
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">Leis Ordinárias</h1>
              <p className="text-white/70 text-sm">Selecione o ano</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {ANOS_LEIS_ORDINARIAS.map((ano, i) => (
            <motion.button
              key={ano}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedAno(ano)}
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
                <p className="text-muted-foreground text-sm">Leis Ordinárias</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeiOrdinariaView;
