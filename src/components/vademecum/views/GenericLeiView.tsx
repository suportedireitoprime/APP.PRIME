import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, ChevronRight, Scale, Shield, FileText, ScrollText, Gavel, BookMarked, HeartPulse, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { track } from '@/lib/analyticsEvents';

interface GenericLeiViewProps {
  tipo: string | undefined;
  leis: any[];
  config: { label: string; icon: React.ElementType; bg: string } | null;
  goBack: () => void;
  setSelectedLeiId: (id: string) => void;
  setSelectedLeiNome: (nome: string) => void;
  setSelectedLeiDescricao: (desc: string) => void;
  setSelectedTabelaNome: (nome: string) => void;
}

const GenericLeiView: React.FC<GenericLeiViewProps> = ({
  tipo,
  leis,
  config,
  goBack,
  setSelectedLeiId,
  setSelectedLeiNome,
  setSelectedLeiDescricao,
  setSelectedTabelaNome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subcat, setSubcat] = useState('todas');

  const filteredLeis = useMemo(() => {
    return leis.filter(lei => {
      const matchSearch = lei.nome.toLowerCase().includes(searchQuery.toLowerCase()) || lei.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = subcat === 'todas' || (lei as any).area === subcat;
      return matchSearch && matchCat;
    });
  }, [leis, searchQuery, subcat]);

  const subcats = useMemo(() => {
    const areas = new Set<string>();
    leis.forEach(l => {
      if ((l as any).area) areas.add((l as any).area);
    });
    return Array.from(areas).sort();
  }, [leis]);

  const IconComponent = config?.icon || Landmark;

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
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white font-bold">{config?.label || 'Legislação'}</h1>
              <p className="text-white/70 text-sm">Explore o acervo</p>
            </div>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou tema..."
              className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 h-12 focus-visible:ring-white/30"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {subcats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSubcat('todas')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                subcat === 'todas' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              Todas
            </button>
            {subcats.map(cat => (
              <button
                key={cat}
                onClick={() => setSubcat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                  subcat === cat ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLeis.map((lei, i) => (
            <motion.button
              key={lei.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                track('legislacao_selecionada', { id: lei.id, nome: lei.nome, tipo: tipo });
                setSelectedLeiId(lei.id);
                setSelectedLeiNome(lei.nome);
                setSelectedLeiDescricao(lei.descricao);
                setSelectedTabelaNome(lei.tabela_nome);
              }}
              className="w-full text-left rounded-xl p-5 bg-card hover:bg-secondary/50 transition-all group flex items-start gap-4 border border-border/40 hover:border-primary/30"
            >
              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors font-bold line-clamp-2">
                    {lei.nome}
                  </h3>
                  {(lei as any).data_publicacao && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground whitespace-nowrap">
                      {(lei as any).data_publicacao}
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                  {lei.descricao || (lei as any).ementa}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-3 transition-colors" />
            </motion.button>
          ))}
          {filteredLeis.length === 0 && (
            <p className="text-center text-muted-foreground py-8 col-span-full">Nenhuma lei encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericLeiView;
