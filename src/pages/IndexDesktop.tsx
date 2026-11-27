import { useState, useEffect, useCallback, Suspense } from 'react';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { useQueryClient } from '@tanstack/react-query';

import DesktopHeroBanner from '@/components/vademecum/desktop/DesktopHeroBanner';
import DesktopRadarLeisCarousel from '@/components/vademecum/desktop/DesktopRadarLeisCarousel';
import DesktopTopHeader from '@/components/vademecum/desktop/DesktopTopHeader';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopBreadcrumb from '@/components/vademecum/desktop/DesktopBreadcrumb';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import AtualizacaoTab from '@/components/vademecum/outros/AtualizacaoTab';
import DesktopEstudosGrid from '@/components/desktop/DesktopEstudosGrid';
import NoticiasJuridicasCarousel from '@/components/vademecum/blog/NoticiasJuridicasCarousel';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';

import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';
import { resetGlobalScroll } from '@/lib/scrollUtils';
import heroImageAsset from '@/assets/hero-vademecum.webp';

const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlay'));

type Tab = 'legislacao' | 'noticias' | 'ferramentas' | 'biblioteca';

const IndexDesktop = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('legislacao');
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [typingHint, setTypingHint] = useState('');
  const unreadCount = useUnreadNotifCount();

  useHotkeys('mod+k', (e) => { e.preventDefault(); setSearchOpen(true); }, { enableOnFormTags: true });
  useHotkeys('escape', () => { setSearchOpen(false); setAssistenteOpen(false); });

  useEffect(() => { warmCoverCache(); }, []);
  useHomeWarmup([heroImageAsset], queryClient, true);

  useEffect(() => {
    const hints = ['Buscar lei...', 'Ler artigo...', 'Consultar código...', 'Pesquisar jurisprudência...'];
    let hintIndex = 0;
    let charIndex = 0;
    let direction = 1;
    let pauseCounter = 0;

    const interval = setInterval(() => {
      if (pauseCounter > 0) { pauseCounter--; return; }
      const current = hints[hintIndex];
      if (direction === 1) {
        charIndex++;
        setTypingHint(current.slice(0, charIndex));
        if (charIndex === current.length) { direction = -1; pauseCounter = 15; }
      } else {
        charIndex--;
        setTypingHint(current.slice(0, charIndex));
        if (charIndex === 0) { direction = 1; hintIndex = (hintIndex + 1) % hints.length; pauseCounter = 5; }
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleSearchSelectLei = useCallback((lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
    pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
    const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
    const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
    navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
  }, [navigate]);

  const handleSearchClose = useCallback(() => setSearchOpen(false), []);
  const handleAssistenteClose = useCallback(() => setAssistenteOpen(false), []);

  useEffect(() => {
    resetGlobalScroll();
  }, [activeTab]);

  return (
    <div className="h-dvh bg-zinc-950 flex flex-col relative overflow-hidden">
      <div className="relative z-10 flex h-full w-full min-h-0 overflow-hidden">
        <DesktopOnboardingOverlay />

        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div id="desktop-scroll-container" data-desktop-scroll="true" className="flex flex-col flex-1 h-full min-w-0 relative overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="border-b border-white/5 bg-transparent">
            <DesktopTopHeader onAssistenteClick={() => setAssistenteOpen(true)} />
            <DesktopBreadcrumb />
          </div>

          <div className="px-4 lg:px-6 py-5 relative z-20">
            {activeTab === 'legislacao' && (
              <>
                <div className="mb-7 relative z-0 pointer-events-auto">
                  <DesktopHeroBanner
                    typingHint={typingHint}
                    onSearchClick={() => setSearchOpen(true)}
                    onNotifClick={() => setNotifOpen(true)}
                    unreadCount={unreadCount}
                  />
                </div>

                <div className="relative z-30 mb-7 w-full mx-auto">
                  <DesktopRadarLeisCarousel />
                </div>

                <div className="relative z-30 mb-7 w-full mx-auto">
                  <NoticiasJuridicasCarousel />
                </div>

                <div className="mb-10">
                  <DesktopEstudosGrid
                    onChatClick={() => setAssistenteOpen(true)}
                    onFerramentasClick={() => setActiveTab('ferramentas')}
                  />
                </div>
              </>
            )}

            {activeTab === 'noticias' && <AtualizacaoTab searchQuery="" />}

            {activeTab === 'ferramentas' && (
              <div className="mx-auto w-full">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-foreground mb-1">Ferramentas</h2>
                    <p className="text-muted-foreground text-sm font-body">Recursos do Direito Prime em um só lugar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/ferramentas')}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    Abrir página completa
                  </button>
                </div>
                <div className="space-y-8">
                  {DESKTOP_TOOL_GROUPS.map((group) => (
                    <section key={group.id}>
                      <p className="mb-3 border-b border-border pb-2 text-[11px] font-body font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {group.tools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => {
                                if (tool.id === 'assistente') { setAssistenteOpen(true); return; }
                                navigate(tool.route);
                              }}
                              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
                            >
                              <span
                                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${tool.color}20` }}
                              >
                                <Icon className="w-5 h-5" style={{ color: tool.color }} strokeWidth={1.7} />
                              </span>
                              <span className="min-w-0">
                                <span className="block font-display text-[13px] font-bold text-foreground group-hover:text-primary transition-colors truncate">{tool.label}</span>
                                <span className="block text-[11px] text-muted-foreground leading-tight line-clamp-1">{tool.desc}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Suspense fallback={null}>
            <SearchOverlay open={searchOpen} onClose={handleSearchClose} onSelectLei={handleSearchSelectLei} />
            <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />
          </Suspense>
          <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default IndexDesktop;
