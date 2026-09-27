import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  Search,
  FileText,
  Eye,
  Download,
  Loader2,
  FolderOpen,
  Mic,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord, VisualCategoria, VisualContent } from '@/lib/visuaisJuridicos/types';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { MATERIAS } from '@/lib/visuaisJuridicos/catalogo';
import { VisuaisPdfModal } from './VisuaisPdfModal';
import { VisuaisPdfCard } from './VisuaisPdfCard';
import { exportarPdf } from '../VisualScene';
import { toast } from 'sonner';
import { extrairHierarquiaVisual, type HierarquiaVisual } from '@/lib/visuaisJuridicos/hierarquia';

export type { HierarquiaVisual };

interface VisuaisPastasViewProps {
  prontos: Record<string, VisualRecord>;
  catalogoItens: CatalogoItem[];
  categoria: VisualCategoria;
  materiaAtiva?: string | null;
  topicoAtivo?: string | null;
  onSelectMateria?: (materia: string) => void;
  onSelectTopico?: (topico: string) => void;
  onEscolherItem?: (item: CatalogoItem) => void;
}

export function VisuaisPastasView({
  prontos,
  catalogoItens,
  materiaAtiva,
  topicoAtivo,
  onSelectMateria,
  onSelectTopico,
}: VisuaisPastasViewProps) {
  const [busca, setBusca] = useState('');
  const [registroPdf, setRegistroPdf] = useState<VisualRecord | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [baixandoKey, setBaixandoKey] = useState<string | null>(null);

  // Reconhecimento de Voz nativo/web
  const voice = useVoiceInput((text) => {
    setBusca(text);
  });

  // Lista todos os registros prontos
  const todosProntos = useMemo(() => Object.values(prontos), [prontos]);

  // Agrupamento hierárquico: Matéria -> Tópicos -> PDFs
  const mapaMaterias = useMemo(() => {
    const mapa = new Map<
      string,
      {
        label: string;
        sub?: string;
        pdfCount: number;
        topicos: Map<string, VisualRecord[]>;
      }
    >();

    // Inicializa com as matérias do catálogo atual
    const itensBase = catalogoItens.length > 0 ? catalogoItens : MATERIAS;
    for (const item of itensBase) {
      mapa.set(item.label, {
        label: item.label,
        sub: item.sub,
        pdfCount: 0,
        topicos: new Map(),
      });
    }

    // Associa cada visual pronto à sua matéria e tópico
    for (const visual of todosProntos) {
      const { materia, topico } = extrairHierarquiaVisual(visual);
      let entry = mapa.get(materia);
      if (!entry) {
        entry = {
          label: materia,
          pdfCount: 0,
          topicos: new Map(),
        };
        mapa.set(materia, entry);
      }
      entry.pdfCount += 1;
      const list = entry.topicos.get(topico) || [];
      list.push(visual);
      entry.topicos.set(topico, list);
    }

    return mapa;
  }, [catalogoItens, todosProntos]);

  // Nível 1: Lista de Matérias
  const materiasLista = useMemo(() => {
    return Array.from(mapaMaterias.values()).sort((a, b) => {
      if (b.pdfCount !== a.pdfCount) return b.pdfCount - a.pdfCount;
      return a.label.localeCompare(b.label);
    });
  }, [mapaMaterias]);

  const materiasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return materiasLista;
    return materiasLista.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        (m.sub && m.sub.toLowerCase().includes(q)),
    );
  }, [materiasLista, busca]);

  // Nível 2: Tópicos da Matéria Ativa
  const topicosDaMateria = useMemo(() => {
    if (!materiaAtiva) return [];
    const entry = mapaMaterias.get(materiaAtiva);
    if (!entry) return [];

    const list: Array<{ label: string; pdfCount: number; arquivos: VisualRecord[] }> = [];
    for (const [topicoNome, arquivos] of entry.topicos.entries()) {
      list.push({
        label: topicoNome,
        pdfCount: arquivos.length,
        arquivos,
      });
    }

    return list.sort((a, b) => {
      if (b.pdfCount !== a.pdfCount) return b.pdfCount - a.pdfCount;
      return a.label.localeCompare(b.label);
    });
  }, [materiaAtiva, mapaMaterias]);

  const topicosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return topicosDaMateria;
    return topicosDaMateria.filter((t) => t.label.toLowerCase().includes(q));
  }, [topicosDaMateria, busca]);

  // Nível 3: Arquivos / Temas do Tópico Ativo
  const arquivosDoTopico = useMemo(() => {
    if (!materiaAtiva || !topicoAtivo) return [];
    const entry = mapaMaterias.get(materiaAtiva);
    if (!entry) return [];
    return entry.topicos.get(topicoAtivo) || [];
  }, [materiaAtiva, topicoAtivo, mapaMaterias]);

  const arquivosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return arquivosDoTopico;
    return arquivosDoTopico.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        a.tipo.toLowerCase().includes(q),
    );
  }, [arquivosDoTopico, busca]);

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
      {/* Barra de Pesquisa Adaptativa por Nível com Pesquisa por Voz */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={
            voice.listening
              ? 'Ouvindo sua voz...'
              : topicoAtivo
                ? `Buscar temas em ${topicoAtivo}...`
                : materiaAtiva
                  ? `Buscar tópicos em ${materiaAtiva}...`
                  : 'Buscar pasta por matéria ou código...'
          }
          className={`w-full pl-10 pr-12 py-2.5 rounded-xl bg-zinc-900/80 border text-white text-sm placeholder:text-muted-foreground/60 focus:outline-none transition-all font-['Plus_Jakarta_Sans',sans-serif] ${
            voice.listening
              ? 'border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-500/50'
              : 'border-white/10 focus:border-red-500/50'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            haptic.light();
            voice.toggle();
          }}
          aria-label={voice.listening ? 'Parar gravação de voz' : 'Pesquisar por voz'}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
            voice.listening
              ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40 ring-2 ring-red-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* ── NÍVEL 3: Arquivos / Temas do Tópico ── */}
      {materiaAtiva && topicoAtivo ? (
        <div className="space-y-4">
          {arquivosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {arquivosFiltrados.map((arquivo, idx) => (
                <VisuaisPdfCard
                  key={arquivo.id || idx}
                  arquivo={arquivo}
                  index={idx}
                  materia={materiaAtiva}
                  onAbrir={handleAbrirPdf}
                  onBaixar={handleBaixarPdf}
                  baixando={baixandoKey === arquivo.id}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
                Nenhum tema encontrado neste tópico
              </p>
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-muted-foreground">
                Tente buscar com outro termo ou volte aos tópicos anteriores.
              </p>
            </div>
          )}
        </div>
      ) : materiaAtiva ? (
        /* ── NÍVEL 2: Pastas de Tópicos da Matéria ── */
        <div className="space-y-4">
          {topicosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {topicosFiltrados.map((topico, idx) => {
                const temPdfs = topico.pdfCount > 0;
                return (
                  <motion.div
                    key={topico.label || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    onClick={() => {
                      haptic.selection();
                      onSelectTopico?.(topico.label);
                    }}
                    className="relative group cursor-pointer"
                  >
                    {/* Cabinho escuro no topo */}
                    <div
                      className={`w-16 h-3.5 rounded-t-lg -mb-[1px] ml-3 transition-colors ${
                        temPdfs
                          ? 'bg-[#180406] border-t border-x border-red-900/70'
                          : 'bg-[#141416] border-t border-x border-white/10'
                      }`}
                    />

                    {/* Corpo da Pasta Vermelha */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl rounded-tl-none border transition-all flex flex-col justify-between min-h-[125px] h-[125px] ${
                        temPdfs
                          ? 'bg-gradient-to-b from-[#4a0e14] via-[#2f090d] to-[#1a0507] border-red-500/40 shadow-lg shadow-black/60 group-hover:border-red-400/80 group-hover:from-[#5c1219]'
                          : 'bg-gradient-to-b from-[#260a0d] to-[#140506] border-red-900/30 group-hover:border-red-700/50 group-hover:from-[#320d11]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            temPdfs
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-red-950/40 text-red-400/60 border border-red-900/30'
                          }`}
                        >
                          <FolderOpen className="w-5 h-5 fill-current/20" />
                        </div>

                        {temPdfs ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 font-['Plus_Jakarta_Sans',sans-serif]">
                            {topico.pdfCount} PDF{topico.pdfCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-['Plus_Jakarta_Sans',sans-serif]">
                            Vazia
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-red-200 transition-colors tracking-normal normal-case">
                          {topico.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-1 font-['Plus_Jakarta_Sans',sans-serif] font-medium">
                          {temPdfs
                            ? `${topico.pdfCount} tema(s) disponível(is)`
                            : 'Clique para abrir'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
                Nenhum tópico encontrado nesta matéria
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── NÍVEL 1: Pastas de Matérias Principais ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {materiasFiltradas.map((pasta, idx) => {
            const temPdfs = pasta.pdfCount > 0;
            return (
              <motion.div
                key={pasta.label || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                onClick={() => {
                  haptic.selection();
                  onSelectMateria?.(pasta.label);
                }}
                className="relative group cursor-pointer"
              >
                {/* Cabinho escuro no topo */}
                <div
                  className={`w-16 h-3.5 rounded-t-lg -mb-[1px] ml-3 transition-colors ${
                    temPdfs
                      ? 'bg-[#180406] border-t border-x border-red-900/70'
                      : 'bg-[#141416] border-t border-x border-white/10'
                  }`}
                />

                {/* Corpo da Pasta Vermelha */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl rounded-tl-none border transition-all flex flex-col justify-between min-h-[125px] h-[125px] ${
                    temPdfs
                      ? 'bg-gradient-to-b from-[#4a0e14] via-[#2f090d] to-[#1a0507] border-red-500/40 shadow-lg shadow-black/60 group-hover:border-red-400/80 group-hover:from-[#5c1219]'
                      : 'bg-gradient-to-b from-[#260a0d] to-[#140506] border-red-900/30 group-hover:border-red-700/50 group-hover:from-[#320d11]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        temPdfs
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-red-950/40 text-red-400/60 border border-red-900/30'
                      }`}
                    >
                      <Folder className="w-5 h-5 fill-current/20" />
                    </div>

                    {temPdfs ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 font-['Plus_Jakarta_Sans',sans-serif]">
                        {pasta.pdfCount} PDF{pasta.pdfCount !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-['Plus_Jakarta_Sans',sans-serif]">
                        Vazia
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-red-200 transition-colors tracking-normal normal-case">
                      {pasta.label}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate mt-1 font-['Plus_Jakarta_Sans',sans-serif] font-medium">
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
      )}

      {/* Modal de Leitura / Download do PDF */}
      <VisuaisPdfModal
        open={modalPdfOpen}
        registro={registroPdf}
        onClose={() => setModalPdfOpen(false)}
      />
    </div>
  );
}
