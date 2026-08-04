import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { COLECOES, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { supabase } from '@/integrations/supabase/client';
import BibliotecaSearchBar from '@/components/biblioteca/BibliotecaSearchBar';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import FilosofosPanel from '@/components/biblioteca/FilosofosPanel';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import BibliotecaColecoesSidebar from '@/components/biblioteca/BibliotecaColecoesSidebar';
import BibliotecaAtividadeRail from '@/components/biblioteca/BibliotecaAtividadeRail';

/**
 * Desktop-native Biblioteca layout. Not a shrunk-down mobile screen: it uses
 * DesktopTopHeader + breadcrumb, a wide 12-col content area, and a
 * multi-column collections grid so the wide side margins are actually put to
 * work (matches the density of Amazon Kindle / Apple Books / Google Play
 * Livros catalog pages).
 */
const BibliotecasDesktop = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const colecoesVisiveis = useVisibleColecoes();

  useEffect(() => {
    const prefetch = async () => {
      await Promise.all(
        COLECOES.map((colecao) =>
          queryClient
            .prefetchQuery({
              queryKey: ['biblioteca-colecao', colecao.id],
              staleTime: 10 * 60 * 1000,
              queryFn: async () => {
                let q: any = supabase.from(colecao.table as any).select(colecao.select);
                if (colecao.orderBy) q = q.order(colecao.orderBy, { ascending: true, nullsFirst: false });
                q = q.limit(2000);
                const { data, error } = await q;
                if (error) throw error;
                return (data as any[]).map((r) => normalizeLivro(r, colecao));
              },
            })
            .catch(() => {})
        )
      );
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 300);
    }
  }, [queryClient]);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Global header/breadcrumb já é renderizado por GlobalDesktopHeader
          no App shell — não duplicar aqui. */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1600px] mx-auto w-full px-6 py-6 grid grid-cols-12 gap-6 items-start">
          {/* ── Coluna esquerda: navegação por coleções ── */}
          <aside className="hidden xl:block col-span-3 2xl:col-span-2">
            <BibliotecaColecoesSidebar />
          </aside>

          {/* ── Centro: hero, atalhos, recomendações e acervo ── */}
          <div className="col-span-12 xl:col-span-6 2xl:col-span-7 min-w-0 space-y-8">
            <section>
              <div className="rounded-3xl overflow-hidden">
                <FilosofosPanel>
                  <div className="[&>div]:!px-0 [&>div]:!mb-0">
                    <BibliotecaSearchBar onAbrirLivro={(l) => setLivroAberto(l)} />
                  </div>
                </FilosofosPanel>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-secondary/40 px-3 py-2">
                  <div className="text-xl font-bold text-foreground">{colecoesVisiveis.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">coleções</div>
                </div>
                <div className="rounded-xl bg-secondary/40 px-3 py-2">
                  <div className="text-xl font-bold text-foreground">2k+</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">livros</div>
                </div>
                <div className="rounded-xl bg-secondary/40 px-3 py-2">
                  <div className="text-xl font-bold text-foreground">24/7</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">offline</div>
                </div>
              </div>
            </section>

            <section>
              <BibliotecaAtalhosBar onAbrirLivro={(l) => setLivroAberto(l)} />
            </section>

            <section>
              <ContinuarLeituraCarousel onAbrirLivro={(l) => setLivroAberto(l)} />
              <RecomendacoesCarousel onAbrirLivro={(l) => setLivroAberto(l)} />
            </section>

            <section className="pb-16">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colecoesVisiveis.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/bibliotecas/${c.id}`)}
                    className="group relative flex items-stretch h-[132px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="relative w-[130px] shrink-0 overflow-hidden">
                      <img
                        src={c.cover}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-card pointer-events-none" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center px-5 py-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/90 truncate">
                        {c.eyebrow}
                      </p>
                      <h3 className="text-base font-bold leading-tight mt-1 text-foreground truncate">
                        {c.label}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug mt-1.5 line-clamp-2">
                        {c.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center pr-4 text-muted-foreground group-hover:text-primary transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ── Coluna direita: atividade do usuário ── */}
          <aside className="hidden lg:block col-span-12 lg:col-span-4 xl:col-span-3">
            <BibliotecaAtividadeRail onAbrirLivro={(l) => setLivroAberto(l)} />
          </aside>
        </div>
      </main>

      <LivroDetailSheet
        livro={livroAberto}
        open={!!livroAberto}
        onClose={() => setLivroAberto(null)}
      />
    </div>
  );
};

export default BibliotecasDesktop;