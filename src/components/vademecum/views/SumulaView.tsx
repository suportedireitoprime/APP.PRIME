import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, Ban, ChevronRight, Gavel, Loader2, Scale, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SUMULA_TRIBUNAIS, type Sumula } from '@/services/sumulasService';
import SumulaVinculanteSheet from '@/components/vademecum/sheets/SumulaVinculanteSheet';
import ArtigoBottomSheet from '@/components/vademecum/artigo/ArtigoBottomSheet';

interface SumulaViewProps {
  goBack: () => void;
  config: { label: string; bg: string } | null;
  selectedTribunal: string | null;
  setSelectedTribunal: (t: string | null) => void;
  sumulas: Sumula[];
  loadingSumulas: boolean;
  searchSumulas: string;
  setSearchSumulas: (s: string) => void;
  openSumula: Sumula | null;
  setOpenSumula: (s: Sumula | null) => void;
}

const SumulaView: React.FC<SumulaViewProps> = ({
  goBack,
  config,
  selectedTribunal,
  setSelectedTribunal,
  sumulas,
  loadingSumulas,
  searchSumulas,
  setSearchSumulas,
  openSumula,
  setOpenSumula,
}) => {
  const filteredSumulas = useMemo(() => {
    if (!searchSumulas) return sumulas;
    const q = searchSumulas.toLowerCase();
    return sumulas.filter(s =>
      s.enunciado.toLowerCase().includes(q) ||
      String(s.numero).includes(q)
    );
  }, [sumulas, searchSumulas]);

  const highlightText = (text: string) => text;

  // If a tribunal is selected, show the list of sumulas
  if (selectedTribunal) {
    const tribunalInfo = SUMULA_TRIBUNAIS.find(t => t.id === selectedTribunal);
    return (
      <div className="theme-vademecum min-h-dvh bg-background pb-20 lg:pb-0">
        <div className={`bg-gradient-to-br ${config?.bg || 'from-primary to-primary/80'} px-4 pt-10 pb-6 sm:px-6 md:px-8`}>
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => { setSelectedTribunal(null); setSearchSumulas(''); }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4 touch-manipulation select-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-white font-bold">{tribunalInfo?.nome || selectedTribunal}</h1>
                <p className="text-white/70 text-sm">{sumulas.length} súmulas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou enunciado..."
              value={searchSumulas}
              onChange={(e) => setSearchSumulas(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          {loadingSumulas ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Carregando jurisprudência...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSumulas.map((sumula, i) => (
                <motion.button
                  key={sumula.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.5) }}
                  onClick={() => setOpenSumula(sumula)}
                  className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                >
                  <div
                    className="w-1.5 rounded-l-2xl shrink-0"
                    style={{ backgroundColor: sumula.situacao === 'cancelada' ? '#c2274a' : (tribunalInfo?.iconColor || 'hsl(var(--primary))') }}
                  />
                  <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-display text-[15px] font-bold text-primary-light">
                          Súmula {selectedTribunal === 'STF_VINCULANTE' ? 'Vinculante ' : ''}{sumula.numero}
                        </h4>
                        {sumula.situacao === 'cancelada' && (
                          <span className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Cancelada
                          </span>
                        )}
                        {sumula.situacao === 'vigente' && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" /> Vigente
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                        {searchSumulas ? highlightText(sumula.enunciado) : sumula.enunciado}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
                  </div>
                </motion.button>
              ))}
              {filteredSumulas.length === 0 && !loadingSumulas && (
                <p className="text-center text-muted-foreground py-8">Nenhuma jurisprudência encontrada.</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom sheet for súmula detail */}
        {openSumula && selectedTribunal === 'STF_VINCULANTE' && (
          <SumulaVinculanteSheet sumula={openSumula} onClose={() => setOpenSumula(null)} />
        )}
        {openSumula && selectedTribunal !== 'STF_VINCULANTE' && (
          <ArtigoBottomSheet
            artigo={{
              id: openSumula.id,
              numero: `Súmula ${selectedTribunal === 'STF_VINCULANTE' ? 'Vinculante ' : ''}${openSumula.numero}`,
              caput: openSumula.enunciado,
            }}
            onClose={() => setOpenSumula(null)}
          />
        )}
      </div>
    );
  }

  // Tribunal selection view
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
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">Jurisprudência</h1>
              <p className="text-white/70 text-sm">Selecione o tribunal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SUMULA_TRIBUNAIS.map((trib, i) => (
            <motion.button
              key={trib.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedTribunal(trib.id)}
              className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-center gap-4"
              style={{ borderLeft: `3px solid ${trib.iconColor}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${trib.iconColor}20` }}
              >
                <Gavel className="w-6 h-6" style={{ color: trib.iconColor }} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors font-bold">
                  {trib.nome}
                </h3>
                <p className="text-muted-foreground text-xs">{trib.descricao}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SumulaView;
