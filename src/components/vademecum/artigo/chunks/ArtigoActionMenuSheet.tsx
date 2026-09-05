import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Play,
  BookOpen,
  MessageCircle,
  Network,
  Copy,
  Bell,
  Download,
  Share2,
  Highlighter,
  Sparkles,
  Mic,
  Camera,
  Trash2,
  Feather,
  LayoutGrid,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ArtigoActionMenuSheetProps {
  activeActionMenu: 'funcoes' | 'grifar' | null;
  setActiveActionMenu: (v: 'funcoes' | 'grifar' | null) => void;
  tabelaNome?: string;
  artigoNumero?: string | number;
  requireOnline: (name: string) => boolean;
  gateFeature: (feature: any, gateKey: string, label: string, action: () => void) => void;
  navigate: (path: string) => void;
  setShowVideoaulasListSheet: (v: boolean) => void;
  setShowTermosSheet: (v: boolean) => void;
  setShowPerguntarSheet: (v: boolean) => void;
  setShowGrafo: (v: boolean) => void;
  handleCopy: () => void;
  setShowLembretesLocal: (v: boolean) => void;
  setShowBaixarSheet: (v: boolean) => void;
  setShowSharePanel: React.Dispatch<React.SetStateAction<boolean>>;
  highlightMode: boolean;
  toggleMode: () => void;
  magicMode: boolean;
  magicLoading: boolean;
  magicHighlightsCount: number;
  handleToggleMagic: () => void;
  setVoiceGrifoActive: (v: boolean) => void;
  setShowGrifoFoto: (v: boolean) => void;
  eraseSheetHighlightsCount: number;
  setShowEraseSheet: (v: boolean) => void;
  grifoIaDefaultOn: boolean;
  setGrifoIaDefault: (v: boolean) => void;
}

export const ArtigoActionMenuSheet = memo(function ArtigoActionMenuSheet({
  activeActionMenu,
  setActiveActionMenu,
  tabelaNome,
  artigoNumero,
  requireOnline,
  gateFeature,
  navigate,
  setShowVideoaulasListSheet,
  setShowTermosSheet,
  setShowPerguntarSheet,
  setShowGrafo,
  handleCopy,
  setShowLembretesLocal,
  setShowBaixarSheet,
  setShowSharePanel,
  highlightMode,
  toggleMode,
  magicMode,
  magicLoading,
  magicHighlightsCount,
  handleToggleMagic,
  setVoiceGrifoActive,
  setShowGrifoFoto,
  eraseSheetHighlightsCount,
  setShowEraseSheet,
  grifoIaDefaultOn,
  setGrifoIaDefault,
}: ArtigoActionMenuSheetProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {activeActionMenu && (() => {
        let funcoesItems = [
          {
            id: 'juris',
            icon: Scale,
            label: 'Jurisprudência',
            desc: 'Súmulas, temas e acórdãos do STF/STJ',
            color: '#D4AF37',
            onClick: () => {
              setActiveActionMenu(null);
              if (!requireOnline('Jurisprudência')) return;
              if (!tabelaNome || !artigoNumero) {
                toast.error('Artigo não identificado');
                return;
              }
              gateFeature('jurisprudencia', 'jurisprudencia', 'Jurisprudência', () =>
                navigate(`/jurisprudencia/${tabelaNome}/${encodeURIComponent(String(artigoNumero))}`)
              );
            },
          },
          {
            icon: Play,
            label: 'Videoaulas',
            desc: 'Aulas em vídeo sobre este artigo',
            color: 'hsl(348 78% 38%)',
            onClick: () => {
              setActiveActionMenu(null);
              if (!requireOnline('Videoaulas')) return;
              gateFeature('videoaula', 'videoaula', 'Videoaulas', () =>
                setShowVideoaulasListSheet(true)
              );
            },
          },
          {
            icon: BookOpen,
            label: 'Termos jurídicos',
            desc: 'Vocabulário do artigo explicado',
            color: '#F97316',
            onClick: () => {
              setActiveActionMenu(null);
              if (!requireOnline('Termos jurídicos')) return;
              gateFeature('termos', 'termos', 'Termos jurídicos', () =>
                setShowTermosSheet(true)
              );
            },
          },
          {
            icon: MessageCircle,
            label: 'Perguntar',
            desc: 'Tire dúvidas com a IA',
            color: '#A855F7',
            onClick: () => {
              setActiveActionMenu(null);
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
                  label: 'Grafo de conexões',
                  desc: 'Ver relações do artigo',
                  color: '#10B981',
                  onClick: () => {
                    setActiveActionMenu(null);
                    gateFeature('grafo', 'grafo', 'Grafo de conexões', () =>
                      setShowGrafo(true)
                    );
                  },
                },
              ]
            : []),
          {
            icon: Copy,
            label: 'Copiar artigo',
            desc: 'Texto para a área de transferência',
            color: '#8B5CF6',
            onClick: () => {
              setActiveActionMenu(null);
              handleCopy();
            },
          },
          {
            icon: Bell,
            label: 'Lembretes',
            desc: 'Avisar ao chegar em um local',
            color: '#DC2626',
            onClick: () => {
              setActiveActionMenu(null);
              import('@/components/vademecum/sheets/LembretesArtigoSheet');
              gateFeature('lembretes', 'lembretes', 'Lembretes', () =>
                setShowLembretesLocal(true)
              );
            },
          },
          {
            icon: Download,
            label: 'Baixar artigo',
            desc: 'PDF ou imagem, lei seca ou comentado',
            color: '#0EA5E9',
            onClick: () => {
              setActiveActionMenu(null);
              gateFeature('baixar', 'baixar', 'Baixar artigo', () =>
                setShowBaixarSheet(true)
              );
            },
          },
          {
            icon: Share2,
            label: 'Compartilhar',
            desc: 'Enviar para outro app',
            color: '#06B6D4',
            onClick: () => {
              setActiveActionMenu(null);
              gateFeature('default', 'default', 'Compartilhar', () =>
                setShowSharePanel((p) => !p)
              );
            },
          },
        ];

        if (tabelaNome === 'LEIS_CF') {
          funcoesItems = funcoesItems.filter((item) => item.id !== 'juris');
        }

        const gateGrifo = (label: string, action: () => void) =>
          gateFeature('grifo', 'grifo', label, action);

        const grifarItems = [
          {
            icon: Highlighter,
            label: highlightMode ? 'Desativar grifo manual' : 'Grifo manual',
            desc: 'Marcar com o dedo',
            color: '#EC4899',
            active: highlightMode,
            onClick: () => {
              setActiveActionMenu(null);
              if (highlightMode) {
                toggleMode();
                return;
              }
              gateGrifo('Grifar', () => toggleMode());
            },
          },
          {
            icon: Sparkles,
            label: 'Grifo mágico (IA)',
            desc: 'Destaques automáticos',
            color: '#DC2626',
            active: magicMode,
            spin: magicLoading,
            badge: magicHighlightsCount,
            onClick: () => {
              setActiveActionMenu(null);
              gateGrifo('Grifar', () => handleToggleMagic());
            },
          },
          {
            icon: Mic,
            label: 'Grifar por voz',
            desc: 'Dite o trecho a destacar',
            color: '#DC2626',
            onClick: () => {
              setActiveActionMenu(null);
              gateGrifo('Grifar', () => setVoiceGrifoActive(true));
            },
          },
          {
            icon: Camera,
            label: 'Grifar de foto',
            desc: 'OCR de imagem',
            color: '#3B82F6',
            onClick: () => {
              setActiveActionMenu(null);
              gateGrifo('Grifar', () => setShowGrifoFoto(true));
            },
          },
          {
            icon: Trash2,
            label: 'Apagar grifos',
            desc: 'Escolha por cor ou apague todos',
            color: 'hsl(348 78% 38%)',
            badge: eraseSheetHighlightsCount,
            onClick: () => {
              setActiveActionMenu(null);
              setShowEraseSheet(true);
            },
          },
        ];

        const isGrifar = activeActionMenu === 'grifar';
        const items = isGrifar ? grifarItems : funcoesItems;
        const title = isGrifar ? 'Grifar' : 'Funções';
        const HeaderIcon = isGrifar ? Feather : LayoutGrid;

        return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-artigo-menu=""
              onClick={() => setActiveActionMenu(null)}
              style={{ pointerEvents: 'auto' }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10005]"
            />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              data-artigo-menu=""
              style={{ pointerEvents: 'auto' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-[10006] bg-card border-t border-border rounded-t-3xl shadow-2xl flex flex-col pb-safe min-h-[74vh] max-h-[92vh] mx-auto max-w-lg md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-6 md:top-auto md:w-[92vw] md:max-w-2xl md:rounded-3xl md:border md:border-border md:shadow-2xl md:min-h-0"
            >
              <div className="pt-3 pb-2 flex justify-center">
                <span className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <HeaderIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                </div>
                <button
                  onClick={() => setActiveActionMenu(null)}
                  className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {items.map((item, i, arr) => {
                  const Icon = item.icon;
                  return (
                    <div key={i}>
                      <button
                        onClick={item.onClick}
                        className={`w-full min-h-[68px] flex items-center gap-3 px-5 py-3.5 transition-colors text-left ${
                          (item as any).active ? 'bg-primary/10' : 'hover:bg-secondary/60'
                        }`}
                      >
                        <span
                          className="w-9 h-9 flex items-center justify-center shrink-0"
                          style={{ color: item.color }}
                        >
                          <Icon
                            className={`w-[22px] h-[22px] ${
                              (item as any).spin ? 'animate-spin' : ''
                            }`}
                            strokeWidth={2}
                          />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14.5px] font-medium text-foreground truncate">
                            {item.label}
                          </span>
                          <span className="block text-[12px] text-foreground/60 truncate mt-0.5">
                            {item.desc}
                          </span>
                        </span>
                        {(item as any).badge > 0 && (
                          <span className="ml-2 inline-flex min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold items-center justify-center">
                            {(item as any).badge}
                          </span>
                        )}
                      </button>
                      {i < arr.length - 1 && <div className="mx-5 h-px bg-border/60" />}
                    </div>
                  );
                })}
                {isGrifar && (
                  <div className="mt-2 mx-5 p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-foreground">
                        Mostrar grifo por padrão
                      </p>
                      <p className="text-[11.5px] text-foreground/60 mt-0.5">
                        Ao abrir o artigo, exibe os grifos da IA automaticamente.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={grifoIaDefaultOn}
                      onClick={() => setGrifoIaDefault(!grifoIaDefaultOn)}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                        grifoIaDefaultOn ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          grifoIaDefaultOn ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        );
      })()}
    </AnimatePresence>,
    document.body
  );
});
