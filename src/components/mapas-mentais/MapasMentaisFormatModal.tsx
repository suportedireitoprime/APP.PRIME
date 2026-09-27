import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Brain, Layers, GitBranch, Network, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualTipo } from '@/lib/visuaisJuridicos/types';

export interface MapasMentaisFormatModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTipo: (tipo: VisualTipo) => void;
  targetRotulo?: string;
  initialTipo?: VisualTipo;
}

const FORMATOS: Array<{
  tipo: VisualTipo;
  nome: string;
  tag: string;
  subtitulo: string;
  descricao: string;
  cor: string;
  icone: typeof Brain;
}> = [
  {
    tipo: 'mapa_mental',
    nome: 'Mapa Mental',
    tag: 'ESTRUTURA RADIAL',
    subtitulo: 'Conceito Central & Ramificações',
    descricao: 'Visão geral ramificada do tema, conectando os pontos-chave de forma visual e memorável.',
    cor: '#A855F7',
    icone: Brain,
  },
  {
    tipo: 'infografico',
    nome: 'Infográfico',
    tag: 'CARDS ESTRUTURADOS',
    subtitulo: 'Requisitos & Elementos',
    descricao: 'Requisitos, pressupostos e prazos organizados em cartões numerados de alta fixação.',
    cor: '#F59E0B',
    icone: Layers,
  },
  {
    tipo: 'fluxograma',
    nome: 'Fluxograma',
    tag: 'PASSO A PASSO LÓGICO',
    subtitulo: 'Decisões Sim / Não',
    descricao: 'Caminho decisório sequencial para aplicar a lei ao caso concreto sem dúvidas.',
    cor: '#10B981',
    icone: GitBranch,
  },
  {
    tipo: 'diagrama',
    nome: 'Diagrama',
    tag: 'HIERARQUIA NORMATIVA',
    subtitulo: 'Gênero às Espécies',
    descricao: 'Organização estrutural e relações de subordinação do gênero para as espécies.',
    cor: '#38BDF8',
    icone: Network,
  },
];

export function MapasMentaisFormatModal({
  open,
  onClose,
  onSelectTipo,
  targetRotulo,
  initialTipo = 'mapa_mental',
}: MapasMentaisFormatModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop com fechamento ao clique */}
      <div
        onClick={() => {
          haptic.light();
          onClose();
        }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Conteúdo do Modal (Bottom-sheet no mobile, Diálogo central no desktop) */}
      <div className="relative z-10 w-full max-w-lg bg-[#111114] border border-white/10 rounded-t-[28px] sm:rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg font-bold text-white tracking-tight">
              Escolha o Formato Visual
            </h2>
            {targetRotulo && (
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                {targetRotulo}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Formatos */}
        <div className="py-3 space-y-2.5 overflow-y-auto">
          {FORMATOS.map((f) => {
            const Icon = f.icone;
            const isPadrao = f.tipo === initialTipo;

            return (
              <button
                key={f.tipo}
                type="button"
                onClick={() => {
                  haptic.selection();
                  onSelectTipo(f.tipo);
                }}
                className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 hover:border-purple-500/50 transition-all flex items-center gap-3.5 group cursor-pointer active:scale-[0.98] shadow-sm"
              >
                {/* Ícone */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                  style={{ backgroundColor: `${f.cor}18`, color: f.cor }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      {f.nome}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase"
                      style={{ backgroundColor: `${f.cor}25`, color: f.cor }}
                    >
                      {f.tag}
                    </span>
                    {isPadrao && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        RECOMENDADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    {f.subtitulo}
                  </p>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                    {f.descricao}
                  </p>
                </div>

                {/* Seta */}
                <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center text-zinc-400 shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
