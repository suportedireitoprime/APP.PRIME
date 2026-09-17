import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  Download,
  Eye,
  Sparkles,
  Search,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord, VisualContent } from '@/lib/visuaisJuridicos/types';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { MATERIAS } from '@/lib/visuaisJuridicos/catalogo';
import { VisuaisPdfModal } from './VisuaisPdfModal';
import { exportarPdf } from '../VisualScene';
import { toast } from 'sonner';

interface VisuaisPastaSoloViewProps {
  pastaNome: string;
  prontos: Record<string, VisualRecord>;
  catalogoItens: CatalogoItem[];
  onEscolherItem: (item: CatalogoItem) => void;
  onBack: () => void;
}

export function VisuaisPastaSoloView({
  pastaNome,
  prontos,
  catalogoItens,
  onEscolherItem,
}: VisuaisPastaSoloViewProps) {
  const [buscaPdf, setBuscaPdf] = useState('');
  const [registroPdf, setRegistroPdf] = useState<VisualRecord | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [baixandoKey, setBaixandoKey] = useState<string | null>(null);

  // Todos os arquivos prontos desta pasta
  const todosArquivos = useMemo(() => {
    return Object.values(prontos).filter(
      (v) => (v.item_label || 'Geral').toLowerCase() === pastaNome.toLowerCase(),
    );
  }, [prontos, pastaNome]);

  // CatalogoItem correspondente se houver (para poder explorar e gerar novos)
  const catalogoItemCorrespondente = useMemo(() => {
    const todosItens = catalogoItens.length > 0 ? catalogoItens : MATERIAS;
    return (
      todosItens.find(
        (i) => i.label.toLowerCase() === pastaNome.toLowerCase(),
      ) || null
    );
  }, [catalogoItens, pastaNome]);

  // Filtra por texto na busca
  const arquivosFiltrados = useMemo(() => {
    const q = buscaPdf.trim().toLowerCase();
    if (!q) return todosArquivos;
    return todosArquivos.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        a.tipo.toLowerCase().includes(q),
    );
  }, [todosArquivos, buscaPdf]);

  const handleAbrirPdf = (reg: VisualRecord) => {
    haptic.selection();
    setRegistroPdf(reg);
    setModalPdfOpen(true);
  };

  const handleBaixarPdf = async (reg: VisualRecord) => {
    haptic.selection();
    setBaixandoKey(reg.id);
    try {
      const nome = `${reg.tipo}-${reg.item_key.replace(/[^a-z0-9]+/gi, '-')}`;
      await exportarPdf(reg.conteudo as VisualContent, 'limpo', nome);
      toast.success('Download do PDF concluído!');
    } catch {
      toast.error('Erro ao baixar o arquivo PDF.');
    } finally {
      setBaixandoKey(null);
    }
  };

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Barra de Busca de PDFs na Pasta */}
      {todosArquivos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={buscaPdf}
            onChange={(e) => setBuscaPdf(e.target.value)}
            placeholder={`Buscar em ${todosArquivos.length} PDF(s) desta pasta...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-white text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      )}

      {/* Grid Solo de Arquivos PDF */}
      {arquivosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {arquivosFiltrados.map((arquivo, idx) => (
            <motion.div
              key={arquivo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.25) }}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between gap-3 group shadow-lg shadow-black/40"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {arquivo.tipo.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-tight font-['Plus_Jakarta_Sans',sans-serif] tracking-wide">
                  {arquivo.titulo}
                </h3>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleAbrirPdf(arquivo)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold active:scale-95 transition-all shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBaixarPdf(arquivo)}
                  disabled={baixandoKey === arquivo.id}
                  className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
                  aria-label="Baixar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="py-16 px-6 rounded-3xl bg-zinc-900/40 border border-white/5 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {todosArquivos.length === 0 ? 'Pasta vazia no momento' : 'Nenhum PDF encontrado'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {todosArquivos.length === 0
                ? 'Gere um Mapa Mental, Infográfico ou Fluxograma para que ele seja arquivado automaticamente aqui em formato PDF!'
                : 'Nenhum arquivo corresponde ao termo pesquisado nesta pasta.'}
            </p>
          </div>

          {catalogoItemCorrespondente && (
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onEscolherItem(catalogoItemCorrespondente);
              }}
              className="mt-2 flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold active:scale-95 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explorar e Gerar PDFs</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Exibição Direta do PDF */}
      <VisuaisPdfModal
        open={modalPdfOpen && !!registroPdf}
        registro={registroPdf}
        onClose={() => {
          setModalPdfOpen(false);
          setRegistroPdf(null);
        }}
      />
    </div>
  );
}
