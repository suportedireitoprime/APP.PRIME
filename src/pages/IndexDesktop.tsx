import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion } from 'framer-motion';
import { Scale, Gavel, BookOpenText, GraduationCap, Library, MessageSquare, Search, Bell, Bird } from 'lucide-react';
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

import DesktopHeroBanner from '@/components/vademecum/desktop/DesktopHeroBanner';
import DesktopTopHeader from '@/components/vademecum/desktop/DesktopTopHeader';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopBreadcrumb from '@/components/vademecum/desktop/DesktopBreadcrumb';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import AtualizacaoTab from '@/components/vademecum/outros/AtualizacaoTab';
import DesktopEstudosGrid from '@/components/desktop/DesktopEstudosGrid';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import ShapeGrid from '@/components/ui/ShapeGrid';
import HomeAprenderCarousel from '@/components/vademecum/home/aprender/HomeAprenderCarousel';
import HomeTresPoderes from '@/components/vademecum/home/sections/HomeTresPoderes';
import HomeApresentacoesTimeline from '@/components/vademecum/home/sections/HomeApresentacoesTimeline';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';

import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

// Overlays only mount when opened — lazy so they don't inflate the initial
// desktop chunk.
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlayV2'));
import { useQueryClient } from '@tanstack/react-query';
import { pushRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';

const HERO_CONFIG: Record<string, { image: string; title: string }> = {
  radar: { image: camaraHero, title: 'Radar Legislativo' },
  legislacao: { image: heroImage, title: 'Legislação' },
  noticias: { image: senadoHero, title: 'Aprender' },
};

type Tab = 'legislacao' | 'noticias' | 'ferramentas';

const DESKTOP_TABS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'legislacao', label: 'Início', icon: Scale },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [typingHint, setTypingHint] = useState('');
  const unreadCount = useUnreadNotifCount();

  useHotkeys('mod+k', (e) => { e.preventDefault(); setSearchOpen(true); }, { enableOnFormTags: true });
  useHotkeys('escape', () => { setSearchOpen(false); setAssistenteOpen(false); });

  useEffect(() => { warmCoverCache(); }, []);

  // Usa o hook de warmup centralizado para a Home Desktop
  useHomeWarmup([primeLogo, ...Object.values(HERO_CONFIG).map(c => c.image)], queryClient, true);

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
    <div className="h-dvh bg-zinc-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-60">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>
      <div className="relative z-10 flex h-full w-full min-h-0">
        <DesktopOnboardingOverlay />
        
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex flex-col flex-1 min-w-0 relative">
          
            <div className={`border-b border-white/5 transition-colors duration-300 bg-transparent`}>

              <DesktopBreadcrumb />
            </div>
            
            <div className={`px-8 py-6 2xl:px-14 relative z-20 ${activeTab !== 'legislacao' ? 'pt-[104px]' : ''}`}>
              <div key={activeTab} className="animate-fade-in">
                {activeTab === 'legislacao' && (
                  <>
                    <div className="mb-8 mt-4 relative z-0 pointer-events-auto">
                      <DesktopHeroBanner 
                        typingHint={typingHint} 
                        onSearchClick={() => setSearchOpen(true)} 
                        onNotifClick={() => setNotifOpen(true)}
                        unreadCount={unreadCount}
                      />
                    </div>

                    <div className="relative z-30 mb-8 -mx-8 2xl:-mx-14 mt-6">
                      <HomeAprenderCarousel />
                    </div>

                    <div className="mb-10">
                      <DesktopEstudosGrid
                        onChatClick={() => setAssistenteOpen(true)}
                        onFerramentasClick={() => setActiveTab('ferramentas')}
                      />
                    </div>

                    <div className="space-y-12 max-w-[1600px] mx-auto pb-16 pt-8">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <HomeTresPoderes />
                        <HomeApresentacoesTimeline />
                      </div>
                    </div>
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
                          <motion.div 
                            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
                            variants={{
                              hidden: { opacity: 0 },
                              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                            }}
                            initial="hidden"
                            animate="show"
                          >
                            {group.tools.map((tool) => {
                              const Icon = tool.icon;
                              return (
                                <motion.button
                                  key={tool.id}
                                  variants={{
                                    hidden: { opacity: 0, y: 15 },
                                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    if (tool.id === 'assistente') { setAssistenteOpen(true); return; }
                                    navigate(tool.route);
                                  }}
                                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group cursor-pointer focus-visible:outline-none"
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
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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