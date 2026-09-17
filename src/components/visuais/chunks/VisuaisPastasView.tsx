import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Folder, Search } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord, VisualCategoria } from '@/lib/visuaisJuridicos/types';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { MATERIAS } from '@/lib/visuaisJuridicos/catalogo';

interface VisuaisPastasViewProps {
  prontos: Record<string, VisualRecord>;
  catalogoItens: CatalogoItem[];
  categoria: VisualCategoria;
  onEscolherItem: (item: CatalogoItem) => void;
  onSelectPasta: (pastaNome: string) => void;
}

interface PastaInfo {
  key: string;
  label: string;
  sub?: string;
  catalogoItem?: CatalogoItem;
  pdfCount: number;
  arquivos: VisualRecord[];
}

export function VisuaisPastasView({
  prontos,
  catalogoItens,
  onSelectPasta,
}: VisuaisPastasViewProps) {
  const [buscaPasta, setBuscaPasta] = useState('');

  // Lista todos os registros prontos
  const todosProntos = useMemo(() => Object.values(prontos), [prontos]);

  // Agrupa os PDFs por pasta (matéria / lei / código)
  const pastas = useMemo<PastaInfo[]>(() => {
    // Coleta todos os itens base disponíveis no catálogo atual ou padrão
    const itensBase = catalogoItens.length > 0 ? catalogoItens : MATERIAS;
    const mapa = new Map<string, PastaInfo>();

    // Inicializa pastas para todos os itens do catálogo
    for (const item of itensBase) {
      mapa.set(item.label, {
        key: item.key,
        label: item.label,
        sub: item.sub,
        catalogoItem: item,
        pdfCount: 0,
        arquivos: [],
      });
    }

    // Associa cada PDF pronto à sua respectiva pasta
    for (const visual of todosProntos) {
      const pastaNome = visual.item_label || 'Geral';
      let pasta = mapa.get(pastaNome);

      if (!pasta) {
        pasta = {
          key: visual.item_key.split('#')[0] || visual.item_key,
          label: pastaNome,
          pdfCount: 0,
          arquivos: [],
        };
        mapa.set(pastaNome, pasta);
      }

      pasta.arquivos.push(visual);
      pasta.pdfCount = pasta.arquivos.length;
    }

    // Ordena colocando primeiro as pastas que já possuem PDFs gerados
    return Array.from(mapa.values()).sort((a, b) => {
      if (b.pdfCount !== a.pdfCount) return b.pdfCount - a.pdfCount;
      return a.label.localeCompare(b.label);
    });
  }, [catalogoItens, todosProntos]);

  // Filtra pastas pela busca
  const pastasFiltradas = useMemo(() => {
    const q = buscaPasta.trim().toLowerCase();
    if (!q) return pastas;
    return pastas.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.sub && p.sub.toLowerCase().includes(q)),
    );
  }, [pastas, buscaPasta]);

  return (
    <div className="w-full space-y-4">
      {/* Barra de Pesquisa de Pastas */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={buscaPasta}
          onChange={(e) => setBuscaPasta(e.target.value)}
          placeholder="Buscar pasta por matéria ou código..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-white text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      {/* Grid de Pastas Estilo Fichário / Diretório */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {pastasFiltradas.map((pasta, idx) => {
          const temPdfs = pasta.pdfCount > 0;
          return (
            <motion.div
              key={pasta.key || pasta.label || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.2) }}
              onClick={() => {
                haptic.selection();
                onSelectPasta(pasta.label);
              }}
              className="relative group cursor-pointer"
            >
              {/* Orelha / Aba Superior da Pasta */}
              <div
                className={`w-16 h-3 rounded-t-lg -mb-[1px] ml-3 transition-colors ${
                  temPdfs
                    ? 'bg-amber-500/40 border-t border-x border-amber-500/50'
                    : 'bg-zinc-800/80 border-t border-x border-white/10'
                }`}
              />

              {/* Corpo da Pasta */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl rounded-tl-none border transition-all flex flex-col justify-between min-h-[115px] h-[115px] ${
                  temPdfs
                    ? 'bg-gradient-to-b from-[#201d18] to-[#141210] border-amber-500/40 shadow-lg shadow-black/60 group-hover:border-amber-400/80 group-hover:from-[#2a241b]'
                    : 'bg-gradient-to-b from-[#1c1c20] to-[#121215] border-white/10 group-hover:border-white/20 group-hover:bg-[#232328]'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      temPdfs
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/5 text-muted-foreground border border-white/10'
                    }`}
                  >
                    <Folder className="w-5 h-5" />
                  </div>

                  {temPdfs ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                      {pasta.pdfCount} PDF{pasta.pdfCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60">
                      Vazia
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                    {pasta.label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {temPdfs
                      ? `${pasta.pdfCount} arquivo(s) prontos`
                      : 'Clique para abrir'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
