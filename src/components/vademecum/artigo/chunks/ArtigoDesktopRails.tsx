import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Volume2,
  Feather,
  StickyNote,
  Target,
  LayoutGrid,
  Scale,
  Play,
  BookOpen,
  MessageCircle,
  Network,
  Copy,
  Bell,
  Download,
  Share2,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ArtigoLei } from '@/data/mockData';

interface ArtigoDesktopRailsProps {
  isDesktop: boolean;
  artigo: ArtigoLei | null;
  activeTab: string;
  handleNarrarButtonPress: (e: any) => void;
  activeActionMenu: null | 'funcoes' | 'grifar';
  setActiveActionMenu: (m: null | 'funcoes' | 'grifar') => void;
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  gateFeature: (featureKey: string, gateKey: any, label: string, action: () => void) => void;
  setShowAnotacoesSheet: (v: boolean) => void;
  setShowPraticarSheet: (v: boolean) => void;
  requireOnline: (feature: string) => boolean;
  tabelaNome?: string;
  setShowJurisPanel: (v: boolean) => void;
  navigate: (path: string) => void;
  setShowVideoaulasListSheet: (v: boolean) => void;
  setShowTermosSheet: (v: boolean) => void;
  setShowPerguntarSheet: (v: boolean) => void;
  setShowGrafo: (v: boolean) => void;
  handleCopy: () => void;
  setShowLembretesLocal: (v: boolean) => void;
  setShowBaixarSheet: (v: boolean) => void;
  setShowSharePanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowFontControls: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowCommentPanel: (v: boolean) => void;
  anyPanelOpen: boolean;
  selectionPill: { x: number; y: number } | null;
}

type RailItem = {
  id?: string;
  icon: any;
  label: string;
  color?: string;
  active?: boolean;
  onClick: (e: any) => void;
};

export const ArtigoDesktopRails: React.FC<ArtigoDesktopRailsProps> = ({
  isDesktop,
  artigo,
  activeTab,
  handleNarrarButtonPress,
  activeActionMenu,
  setActiveActionMenu,
  isPremium,
  openPremiumGate,
  gateFeature,
  setShowAnotacoesSheet,
  setShowPraticarSheet,
  requireOnline,
  tabelaNome,
  setShowJurisPanel,
  navigate,
  setShowVideoaulasListSheet,
  setShowTermosSheet,
  setShowPerguntarSheet,
  setShowGrafo,
  handleCopy,
  setShowLembretesLocal,
  setShowBaixarSheet,
  setShowSharePanel,
  setShowFontControls,
  setShowCommentPanel,
  anyPanelOpen,
  selectionPill,
}) => {
  if (!isDesktop || !artigo) return null;

  const Rail = ({
    items,
    side,
    title,
  }: {
    items: RailItem[];
    side: 'left' | 'right';
    title: string;
  }) => (
    <div
      data-artigo-rail
      aria-hidden={false}
      style={{ pointerEvents: anyPanelOpen ? 'none' : 'auto' }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`fixed ${side === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-[10000] w-[188px] ${
        anyPanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } transition-opacity flex flex-col gap-0.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border p-2 shadow-xl shadow-black/40 max-h-[88vh] overflow-y-auto`}
    >
      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            type="button"
            onClick={item.onClick}
            aria-label={item.label}
            style={{ pointerEvents: 'auto' }}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left cursor-pointer transition-colors ${
              item.active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
            }`}
          >
            <Icon
              className="w-[18px] h-[18px] shrink-0"
              style={!item.active && item.color ? { color: item.color } : undefined}
            />
            <span className="font-body text-[13px] font-medium truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const principais: RailItem[] = [
    {
      icon: Volume2,
      label: 'Narração',
      color: '#22C55E',
      onClick: (e) => handleNarrarButtonPress(e),
    },
    {
      icon: Feather,
      label: 'Grifar',
      color: '#DC2626',
      active: activeActionMenu === 'grifar',
      onClick: () => {
        if (!isPremium) {
          openPremiumGate('grifo');
          return;
        }
        setActiveActionMenu(activeActionMenu === 'grifar' ? null : 'grifar');
      },
    },
    {
      icon: StickyNote,
      label: 'Anotações',
      color: '#38BDF8',
      onClick: () =>
        gateFeature('anotacoes', 'anotacoes', 'Anotações', () => setShowAnotacoesSheet(true)),
    },
    {
      icon: Target,
      label: 'Praticar',
      color: '#A855F7',
      onClick: () =>
        gateFeature('praticar', 'praticar', 'Praticar', () => setShowPraticarSheet(true)),
    },
  ];

  let secundarias: RailItem[] = [
    {
      icon: LayoutGrid,
      label: 'Funções',
      active: activeActionMenu === 'funcoes',
      onClick: () => setActiveActionMenu(activeActionMenu === 'funcoes' ? null : 'funcoes'),
    },
    {
      id: 'juris',
      icon: Scale,
      label: 'Jurisprudência',
      color: '#D4AF37',
      onClick: () => {
        if (!requireOnline('Jurisprudência')) return;
        if (!tabelaNome || !artigo?.numero) {
          toast.error('Artigo não identificado');
          return;
        }
        gateFeature('jurisprudencia', 'jurisprudencia', 'Jurisprudência', () => {
          if (isDesktop) setShowJurisPanel(true);
          else
            navigate(
              `/jurisprudencia/${tabelaNome}/${encodeURIComponent(String(artigo.numero))}`
            );
        });
      },
    },
    {
      icon: Play,
      label: 'Videoaulas',
      color: 'hsl(348 78% 38%)',
      onClick: () => {
        if (!requireOnline('Videoaulas')) return;
        gateFeature('videoaula', 'videoaula', 'Videoaulas', () =>
          setShowVideoaulasListSheet(true)
        );
      },
    },
    {
      icon: BookOpen,
      label: 'Termos',
      color: '#F97316',
      onClick: () => {
        if (!requireOnline('Termos jurídicos')) return;
        gateFeature('termos', 'termos', 'Termos jurídicos', () => setShowTermosSheet(true));
      },
    },
    {
      icon: MessageCircle,
      label: 'Perguntar à IA',
      color: '#A855F7',
      onClick: () => {
        if (!requireOnline('Perguntar à IA')) return;
        gateFeature('perguntar', 'perguntar', 'Perguntar à IA', () =>
          setShowPerguntarSheet(true)
        );
      },
    },
    ...(tabelaNome
      ? [
          {
            icon: Network,
            label: 'Grafo',
            color: '#10B981',
            onClick: () =>
              gateFeature('grafo', 'grafo', 'Grafo de conexões', () => setShowGrafo(true)),
          },
        ]
      : []),
    { icon: Copy, label: 'Copiar', color: '#8B5CF6', onClick: () => handleCopy() },
    {
      icon: Bell,
      label: 'Lembretes',
      color: '#DC2626',
      onClick: () => {
        import('@/components/vademecum/sheets/LembretesArtigoSheet');
        gateFeature('lembretes', 'lembretes', 'Lembretes', () => setShowLembretesLocal(true));
      },
    },
    {
      icon: Download,
      label: 'Baixar',
      color: '#0EA5E9',
      onClick: () =>
        gateFeature('baixar', 'baixar', 'Baixar artigo', () => setShowBaixarSheet(true)),
    },
    {
      icon: Share2,
      label: 'Compartilhar',
      color: '#06B6D4',
      onClick: () =>
        gateFeature('default', 'default', 'Compartilhar', () => setShowSharePanel((p) => !p)),
    },
    {
      icon: Type,
      label: 'Fonte',
      onClick: () => {
        setShowFontControls((v) => !v);
        setShowCommentPanel(false);
      },
    },
  ];

  if (tabelaNome === 'LEIS_CF') {
    secundarias = secundarias.filter((item) => item.id !== 'juris');
  }

  return (
    <>
      {(activeTab ?? 'artigo') === 'artigo' &&
        createPortal(
          <>
            <Rail items={principais} side="left" title="Principais" />
            <Rail items={secundarias} side="right" title="Mais funções" />
          </>,
          document.body
        )}

      {/* Desktop: pílula flutuante Narrar / Grifar ao selecionar trecho */}
      {selectionPill &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[10002] -translate-x-1/2 -translate-y-full"
            style={{ left: selectionPill.x, top: selectionPill.y - 8 }}
          >
            <div className="flex items-center gap-1 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl shadow-black/40 px-1.5 py-1">
              <button
                onClick={(e) => {
                  handleNarrarButtonPress(e as any);
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Narrar</span>
              </button>
              <span className="w-px h-5 bg-border" />
              <button
                onClick={() => setActiveActionMenu('grifar')}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Feather className="w-4 h-4" />
                <span>Grifar</span>
              </button>
            </div>
          </motion.div>,
          document.body
        )}
    </>
  );
};
