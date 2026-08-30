import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { Scale, Gavel, BookOpenText, GraduationCap, Library, MessageSquare } from 'lucide-react';
import heroImageAsset from '@/assets/hero-vademecum.webp';
const heroImage = heroImageAsset;
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import {pickAsset, srcOf } from '@/lib/assetUrl';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));
import camaraHeroAsset from '@/assets/radar/camara-hero.webp';
const camaraHero = camaraHeroAsset;
import senadoHeroAsset from '@/assets/radar/senado-hero.webp';
const senadoHero = senadoHeroAsset;

import DesktopHeroBanner from '@/components/vademecum/DesktopHeroBanner';
import DesktopTopHeader from '@/components/vademecum/DesktopTopHeader';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopBreadcrumb from '@/components/vademecum/DesktopBreadcrumb';
import DesktopSidebar from '@/components/vademecum/DesktopSidebar';
import AtualizacaoTab from '@/components/vademecum/AtualizacaoTab';
import DesktopEstudosGrid from '@/components/desktop/DesktopEstudosGrid';
import HomeNoticiasCarousel from '@/components/vademecum/HomeNoticiasCarousel';

import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

// Overlays only mount when opened — lazy so they don't inflate the initial
// desktop chunk.
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/AssistenteOverlayV2'));
import { prefetchAllArtigos } from '@/services/legislacaoService';
import { prefetchResenha } from '@/services/atualizacaoService';
import { prefetchNoticias } from '@/services/noticiasService';
import { useQueryClient } from '@tanstack/react-query';
import { warmBiblioteca } from '@/services/bibliotecaWarmup';

import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';

const HERO_CONFIG: Record<string, { image: string; title: string }> = {
  radar: { image: camaraHero, title: 'Radar Legislativo' },
  legislacao: { image: heroImage, title: 'Legislação' },
  noticias: { image: senadoHero, title: 'Aprender' },
};

type Tab = 'legislacao' | 'noticias' | 'ferramentas';

const DESKTOP_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'legislacao', label: 'Legislação', icon: Scale },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText },
];


const IndexDesktop = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('legislacao');
  const [searchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [typingHint, setTypingHint] = useState('');

  useHotkeys('mod+k', (e) => { e.preventDefault(); setSearchOpen(true); }, { enableOnFormTags: true });
  useHotkeys('escape', () => { setSearchOpen(false); setAssistenteOpen(false); });

  useEffect(() => { warmCoverCache(); }, []);

  useEffect(() => {
    const ric: (cb: () => void) => number = (window as any).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => window.setTimeout(cb, 500);
      
    const id = ric(() => {
      // 1. Prefetch Overlays
      import('@/components/vademecum/SearchOverlay').catch(() => {});
      import('@/components/vademecum/AssistenteOverlayV2').catch(() => {});

      // 2. Preload Images
      [primeLogo, ...Object.values(HERO_CONFIG).map(c => c.image)].forEach(src => {
        const img = new Image();
        img.src = src;
      });
      
      // 3. Prefetch Data
      prefetchAllArtigos(4);
      prefetchResenha();
      prefetchNoticias();
      
      // 4. Warm up Biblioteca
      window.setTimeout(() => warmBiblioteca(queryClient), 600);
    });
    
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(id); else window.clearTimeout(id);
    };
  }, [queryClient]);

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

  return (
    <div className="h-dvh bg-background flex flex-col">
      <DesktopOnboardingOverlay />
      <DesktopTopHeader onAssistenteClick={() => setAssistenteOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-1 px-8 h-12">
              {DESKTOP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      const ROUTES: Record<string, string> = {
                        noticias: '/noticias',
                        ferramentas: '/ferramentas',
                        biblioteca: '/bibliotecas',
                        aprender: '/aprender',
                        chat: '/assistente-horus',
                        vademecum: '/vade-mecum',
                      };
                      if (ROUTES[tab.id]) {
                        navigate(ROUTES[tab.id]);
                        return;
                      }
                      setActiveTab(tab.id as Tab);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />}
                  </button>
                );
              })}
            </div>
            {/* O Breadcrumb agora fica logo ABAIXO das abas e somente no lado direito */}
            <DesktopBreadcrumb />
          </div>
          <div className="px-8 py-6 2xl:px-14">
            <div key={activeTab} className="animate-fade-in">
              {activeTab === 'legislacao' && (
                <>
                  <div className="mb-6 -mx-8 -mt-6 2xl:-mx-14">
                    <DesktopHeroBanner typingHint={typingHint} onSearchClick={() => setSearchOpen(true)} />
                  </div>

                  <div className="mb-8">
                    <DesktopEstudosGrid
                      onChatClick={() => setAssistenteOpen(true)}
                      onFerramentasClick={() => setActiveTab('ferramentas')}
                    />
                  </div>
                  <div className="mb-10 -mx-8 2xl:-mx-14"><HomeNoticiasCarousel /></div>

                </>
              )}

              {activeTab === 'noticias' && <AtualizacaoTab searchQuery={searchQuery} />}
              {activeTab === 'ferramentas' && (
                <div className="mx-auto w-full max-w-[1600px]">
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl text-foreground mb-1">Ferramentas</h2>
                      <p className="text-muted-foreground text-sm font-body">Todos os recursos do Direito Prime em um só lugar</p>
                    </div>
                    <button
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
                                onClick={() => {
                                  if (tool.id === 'assistente') { setAssistenteOpen(true); return; }
                                  navigate(tool.route);
                                }}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 transition-all text-left group cursor-pointer"
                              >
                                <span
                                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm"
                                  style={{ backgroundColor: `${tool.color}26` }}
                                >
                                  <Icon className="w-5 h-5" style={{ color: tool.color }} strokeWidth={1.6} />
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
          </div>
        </div>

        <Suspense fallback={null}>
          {searchOpen && (
            <SearchOverlay open={searchOpen} onClose={handleSearchClose} onSelectLei={handleSearchSelectLei} />
          )}
          {assistenteOpen && (
            <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default IndexDesktop;