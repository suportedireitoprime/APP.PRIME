import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';

import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopBibliotecaHero from '@/components/desktop/DesktopBibliotecaHero';
import DesktopBibliotecaGrid from '@/components/desktop/DesktopBibliotecaGrid';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import { DesktopBibliotecaTabsBar } from '@/components/desktop/DesktopBibliotecaTabsBar';
import { DesktopBibliotecaModals } from '@/components/desktop/DesktopBibliotecaModals';
import { DesktopColecaoCard } from '@/components/desktop/DesktopColecaoCard';

const BibliotecasDesktop = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const colecoesVisiveis = useVisibleColecoes();
  const acervoRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);

  useEffect(() => scheduleWarmBiblioteca(queryClient), [queryClient]);

  const scrollToAcervo = useCallback(() => {
    if (acervoRef.current) {
      acervoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-6 space-y-8">
      <DesktopOnboardingOverlay />
      <DesktopBibliotecaTabsBar />

      <div>
        <DesktopBibliotecaHero onSearchClick={() => setSearchOpen(true)} />
      </div>

      <div>
        <DesktopBibliotecaGrid
          onScrollToAcervo={scrollToAcervo}
          onUploadPdf={() => {}}
        />
      </div>

      <div className="space-y-6">
        <ContinuarLeituraCarousel onAbrirLivro={setLivroAberto} />
        <RecomendacoesCarousel onAbrirLivro={setLivroAberto} />
      </div>

      <section className="pb-12" ref={acervoRef}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-semibold">
              Acervo
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-6 rounded-full bg-rose-500" />
              <h2 className="font-display text-2xl text-white leading-tight">
                Explore todas as coleções
              </h2>
            </div>
          </div>
          <p className="text-sm text-zinc-400 hidden md:block">
            {colecoesVisiveis.length} coleções
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {colecoesVisiveis.map((c) => (
            <DesktopColecaoCard
              key={c.id}
              c={c}
              onClick={() => navigate(`/bibliotecas/${c.id}`)}
            />
          ))}
        </div>
      </section>

      <DesktopBibliotecaModals
        searchOpen={searchOpen}
        onCloseSearch={() => setSearchOpen(false)}
        assistenteOpen={assistenteOpen}
        onCloseAssistente={() => setAssistenteOpen(false)}
        livroAberto={livroAberto}
        onCloseLivro={() => setLivroAberto(null)}
      />

      <BibliotecaAtalhosBar onAbrirLivro={setLivroAberto} />
    </div>
  );
};

export default BibliotecasDesktop;