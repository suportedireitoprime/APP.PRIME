import { useEffect, useState, Suspense, useRef, memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Scale, BookOpen, Gavel, Library, MessageSquare, BookOpenText, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { lazyWithRetry } from "@/utils/lazyWithRetry";

import { type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import { directImg } from '@/lib/cdnImg';

import DesktopTopHeader from '@/components/vademecum/DesktopTopHeader';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopBreadcrumb from '@/components/vademecum/DesktopBreadcrumb';
import DesktopSidebar from '@/components/vademecum/DesktopSidebar';

import DesktopBibliotecaHero from '@/components/desktop/DesktopBibliotecaHero';
import DesktopBibliotecaGrid from '@/components/desktop/DesktopBibliotecaGrid';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';

const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/AssistenteOverlayV2'));

const DESKTOP_TABS: Array<{ id: string; label: string; icon: any; path: string; prefetch?: PrefetchKey }> = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, path: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, path: '/bibliotecas' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, path: '/ferramentas', prefetch: 'ferramentas' },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap, path: '/aprender', prefetch: 'aprender' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/assistente-horus' },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText, path: '/vade-mecum' },
];

const BibliotecasDesktop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const colecoesVisiveis = useVisibleColecoes();
  const acervoRef = useRef<HTMLDivElement>(null);
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  
  const handleAssistenteClose = () => setAssistenteOpen(false);
  const handleSearchClose = () => setSearchOpen(false);

  useEffect(() => scheduleWarmBiblioteca(queryClient), [queryClient]);

  const scrollToAcervo = useCallback(() => {
    if (acervoRef.current) {
      acervoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleTabChange = useCallback((t: string) => {
    const tab = DESKTOP_TABS.find(x => x.id === t);
    if (tab) navigate(tab.path);
  }, [navigate]);

  return (
    <div className="h-[calc(100dvh-104px)] bg-background flex flex-col">
      <DesktopOnboardingOverlay />
      
      <div className="flex flex-1 min-h-0">
        <DesktopSidebar activeTab="biblioteca" onTabChange={handleTabChange} />
        
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative contain-content overscroll-contain">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-1 px-8 h-12">
              {DESKTOP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = 'biblioteca' === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    onMouseEnter={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
                    onFocus={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
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
          
          <AnimatePresence mode="wait">
            <motion.div
              key="biblioteca-desktop"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-8 py-6 2xl:px-14"
            >
              <div className="mb-6 -mx-8 -mt-6 2xl:-mx-14">
                 <DesktopBibliotecaHero onSearchClick={() => setSearchOpen(true)} />
              </div>

              <div className="mb-8">
                {/* Aqui substituimos o BibliotecaAtalhosBar pelo Grid novo */}
                <DesktopBibliotecaGrid 
                  onScrollToAcervo={scrollToAcervo} 
                  onUploadPdf={() => {
                    // Se o usuário clicar, disparamos um evento customizado ou alert que o upload será tratado na UI correspondente
                    // No Desktop, o ideal é despachar evento pro componente Bibliotecas (pai) ou redirecionar.
                    // Para simplificar, vou focar apenas no scrollToAcervo para "Coleções" e navegar para "/bibliotecas?aba=acervos"
                  }} 
                />
              </div>

              <div className="mb-10 space-y-6">
                <ContinuarLeituraCarousel onAbrirLivro={setLivroAberto} />
                <RecomendacoesCarousel onAbrirLivro={setLivroAberto} />
              </div>

              <section className="pb-16" ref={acervoRef}>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
                      Acervo
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1 h-7 rounded-full bg-primary" />
                      <h2 className="font-display text-2xl text-foreground leading-tight">
                        Explore todas as coleções
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground hidden md:block">
                    {colecoesVisiveis.length} coleções
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {colecoesVisiveis.map((c) => (
                    <ColecaoCard 
                      key={c.id} 
                      c={c} 
                      onClick={() => navigate(`/bibliotecas/${c.id}`)} 
                    />
                  ))}
                </div>
              </section>

            </motion.div>
          </AnimatePresence>
        </div>
        
        <Suspense fallback={null}>
          {searchOpen && (
             <SearchOverlay open={searchOpen} onClose={handleSearchClose} />
          )}
          {assistenteOpen && (
             <AssistenteOverlay open={assistenteOpen} onClose={handleAssistenteClose} />
          )}
        </Suspense>
      </div>
      
      <AnimatePresence>
        {livroAberto && (
          <LivroDetailSheet
            livro={livroAberto}
            open={!!livroAberto}
            onOpenChange={(v) => !v && setLivroAberto(null)}
          />
        )}
      </AnimatePresence>
      
      <BibliotecaAtalhosBar onAbrirLivro={setLivroAberto} />
    </div>
  );
};

const ColecaoCard = memo(({ c, onClick }: { c: any; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative min-h-[140px] will-change-transform"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500 will-change-transform" />
      
      <div className="p-5 flex items-start gap-4 flex-1">
        <div className="w-16 h-20 shrink-0 bg-muted rounded border border-border shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10 mix-blend-overlay" />
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/20 z-20" />
          <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-black/10 z-20" />
          {c.cover ? (
            <img src={directImg(c.cover, 200)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover relative z-0" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Library className="w-6 h-6 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
            {c.eyebrow || 'Coleção'}
          </div>
          <h3 className="font-display font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
            {c.label}
          </h3>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-border/50 bg-secondary/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Ver coleção</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 will-change-transform" />
      </div>
    </button>
  );
});

export default BibliotecasDesktop;