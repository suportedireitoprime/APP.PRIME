import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Sparkles,
  Search,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord, VisualCategoria, VisualContent } from '@/lib/visuaisJuridicos/types';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { MATERIAS } from '@/lib/visuaisJuridicos/catalogo';
import { VisuaisPdfModal } from './VisuaisPdfModal';
import { exportarPdf } from '../VisualScene';
import { toast } from 'sonner';

interface VisuaisPastasViewProps {
  prontos: Record<string, VisualRecord>;
  catalogoItens: CatalogoItem[];
  categoria: VisualCategoria;
  onEscolherItem: (item: CatalogoItem) => void;
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
  categoria,
  onEscolherItem,
}: VisuaisPastasViewProps) {
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);
  const [buscaPasta, setBuscaPasta] = useState('');
  const [registroPdf, setRegistroPdf] = useState<VisualRecord | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [baixandoKey, setBaixandoKey] = useState<string | null>(null);

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

  // Pasta atualmente aberta
  const pastaSelecionada = useMemo(
    () => pastas.find((p) => p.label === pastaAtiva) || null,
    [pastas, pastaAtiva],
  );

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
    <div className="w-full space-y-4">
      {/* Visualização de uma Pasta Específica */}
      {pastaSelecionada ? (
        <div className="space-y-4">
          {/* Header da Pasta Aberta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  haptic.light();
                  setPastaAtiva(null);
                }}
                className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
                aria-label="Voltar para pastas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Pasta de PDFs
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  {pastaSelecionada.label}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                {pastaSelecionada.pdfCount} PDF{pastaSelecionada.pdfCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Lista de PDFs na Pasta */}
          {pastaSelecionada.arquivos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pastaSelecionada.arquivos.map((arquivo) => (
                <motion.div
                  key={arquivo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between gap-3 group"
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

                    <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-tight">
                      {arquivo.titulo}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleAbrirPdf(arquivo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold active:scale-95 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver PDF</span>
                    </button>

                    <button
                      onClick={() => handleBaixarPdf(arquivo)}
                      disabled={baixandoKey === arquivo.id}
                      className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
                      aria-label="Baixar PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-white">
                  Pasta vazia no momento
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gere um Mapa Mental, Infográfico ou Fluxograma para que ele seja arquivado automaticamente aqui em formato PDF!
                </p>
              </div>
              {pastaSelecionada.catalogoItem && (
                <button
                  onClick={() => {
                    haptic.selection();
                    onEscolherItem(pastaSelecionada.catalogoItem!);
                  }}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explorar e Gerar PDFs</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Visualização de Todas as Pastas */
        <div className="space-y-4">
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
                  key={pasta.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                  onClick={() => {
                    haptic.selection();
                    setPastaAtiva(pasta.label);
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
      )}

      {/* Modal de Exibição Direta do PDF */}
      {modalPdfOpen && registroPdf && (
        <VisuaisPdfModal
          open={modalPdfOpen}
          registro={registroPdf}
          onClose={() => {
            setModalPdfOpen(false);
            setRegistroPdf(null);
          }}
        />
      )}
    </div>
  );
}
