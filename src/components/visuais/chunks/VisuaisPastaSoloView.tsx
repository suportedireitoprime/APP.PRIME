import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Sparkles,
  Search,
  Mic,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord, VisualContent } from '@/lib/visuaisJuridicos/types';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { MATERIAS } from '@/lib/visuaisJuridicos/catalogo';
import { VisuaisPdfModal } from './VisuaisPdfModal';
import { VisuaisPdfCard } from './VisuaisPdfCard';
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

  // Reconhecimento de Voz
  const voice = useVoiceInput((text) => {
    setBuscaPdf(text);
  });

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
      {/* Barra de Busca de PDFs na Pasta com Pesquisa por Voz */}
      {todosArquivos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={buscaPdf}
            onChange={(e) => setBuscaPdf(e.target.value)}
            placeholder={
              voice.listening
                ? 'Ouvindo sua voz...'
                : `Buscar em ${todosArquivos.length} PDF(s) desta pasta...`
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
      )}

      {/* Grid Solo de Arquivos PDF */}
      {arquivosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {arquivosFiltrados.map((arquivo, idx) => (
            <VisuaisPdfCard
              key={arquivo.id || idx}
              arquivo={arquivo}
              index={idx}
              materia={pastaNome}
              onAbrir={handleAbrirPdf}
              onBaixar={handleBaixarPdf}
              baixando={baixandoKey === arquivo.id}
            />
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
