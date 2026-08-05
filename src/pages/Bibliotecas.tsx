import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Library, BookOpen, Gauge, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { COLECOES, findColecao, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { supabase } from '@/integrations/supabase/client';
import { startCapasPrefetch } from '@/services/bibliotecaCapasPrefetch';
import { startLeituraNativaPrefetch } from '@/services/leituraNativaPrefetch';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { styleForArea, styleForPerformance } from '@/lib/bibliotecaIcons';
import { directImg } from '@/lib/cdnImg';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import BibliotecaSearchBar from '@/components/biblioteca/BibliotecaSearchBar';
import BibliotecaBottomNav from '@/components/biblioteca/BibliotecaBottomNav';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import FilosofosPanel from '@/components/biblioteca/FilosofosPanel';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import { useIsDesktop } from '@/hooks/use-desktop';
import { track } from '@/lib/analyticsEvents';
import { useTrackArea } from "@/hooks/useTrackArea";

const BibliotecasDesktop = lazy(() => import('./BibliotecasDesktop'));

/** Coleções que compõem a aba "Performance" (desenvolvimento além do Direito). */
const PERFORMANCE_IDS = ['fora-da-toga', 'oratoria', 'lideranca', 'portugues', 'pesquisa'];

type AbaBiblioteca = 'performance' | 'acervos' | 'materias';

const ABAS: { id: AbaBiblioteca; label: string; icon: typeof Library }[] = [
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'acervos', label: 'Acervos', icon: Library },
  { id: 'materias', label: 'Matérias', icon: BookOpen },
];

const Bibliotecas = () => {
  useTrackArea("biblioteca_aberta");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const [aba, setAba] = useState<AbaBiblioteca>('acervos');
  const [materiaAberta, setMateriaAberta] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const colecoesVisiveis = useVisibleColecoes();

  const colecoesPerformance = useMemo(
    () => colecoesVisiveis.filter((c) => PERFORMANCE_IDS.includes(c.id)),
    [colecoesVisiveis],
  );
  // Acervos lista todas as coleções (inclusive as de Performance).
  const colecoesAcervos = colecoesVisiveis;

  // Matérias = áreas do Direito do acervo principal (biblioteca_estudos)
  const colecaoAreas = findColecao('areas');
  const { data: livrosAreas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ['biblioteca-colecao', 'areas'],
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev: any) => prev,
    queryFn: async () => {
      if (!colecaoAreas) return [] as LivroNormalizado[];
      let q: any = supabase.from(colecaoAreas.table as any).select(colecaoAreas.select);
      if (colecaoAreas.orderBy) q = q.order(colecaoAreas.orderBy, { ascending: true, nullsFirst: false });
      const { data, error } = await q.limit(2000);
      if (error) throw error;
      return (data as any[]).map((r) => normalizeLivro(r, colecaoAreas));
    },
  });

  const materias = useMemo(() => {
    const map = new Map<string, { name: string; capa?: string; count: number }>();
    for (const l of livrosAreas) {
      const a = l.area || 'Outros';
      const cur = map.get(a);
      if (cur) cur.count++;
      else map.set(a, { name: a, capa: l.capa || undefined, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [livrosAreas]);

  const livrosDaMateria = useMemo(
    () => (materiaAberta ? livrosAreas.filter((l) => (l.area || 'Outros') === materiaAberta) : []),
    [livrosAreas, materiaAberta],
  );




  // SEO & Título dinâmico por aba da biblioteca
  useEffect(() => {
    const rotulos = {
      acervos: 'Biblioteca - Acervos | Vade Mecum PRIME',
      performance: 'Biblioteca - Performance & Desenvolvimento | Vade Mecum PRIME',
      materias: 'Biblioteca - Matérias do Direito | Vade Mecum PRIME',
    };
    document.title = rotulos[aba] || 'Biblioteca Jurídica | Vade Mecum PRIME';
  }, [aba]);

  useEffect(() => {
    // Mesma mecânica de aquecimento usada no desktop:
    // hidrata cache persistente → prefetch de todas as coleções → capas.
    const cancel = scheduleWarmBiblioteca(queryClient);

    if (!Capacitor.isNativePlatform()) return cancel;
    // Capas: qualquer rede — usuário quer instantâneo offline.
    startCapasPrefetch({ wifiOnly: false }).catch(() => {});
    startLeituraNativaPrefetch({ wifiOnly: true }).catch(() => {});
    return cancel;
  }, [queryClient]);


  if (isDesktop) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <BibliotecasDesktop />
      </Suspense>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-[calc(96px+var(--sai-bottom,0px))]">
      <PageHeader
        title="Biblioteca"
        onBack={() => navigate('/')}
      />

      <div className="max-w-3xl mx-auto w-full">
        {/* Painel marrom flush com o header, com a busca dentro */}
        <FilosofosPanel>
          <div className="[&>div]:!px-0 [&>div]:!mb-0">
            <BibliotecaSearchBar onAbrirLivro={(l) => setLivroAberto(l)} />
          </div>
        </FilosofosPanel>
        {/* Painéis hospedados pelo rodapé (Leitura, Favoritos, Recentes, Offline) */}
        <BibliotecaAtalhosBar onAbrirLivro={(l) => setLivroAberto(l)} />

        <div className="mt-8">
          <RecomendacoesCarousel onAbrirLivro={(l) => setLivroAberto(l)} />
        </div>

        <div className="px-4 pt-6 mb-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
            {aba === 'acervos' ? 'ACERVO' : aba === 'performance' ? 'DESENVOLVIMENTO' : 'ÁREAS'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {aba === 'acervos' ? 'Acervos de livros' : aba === 'performance' ? 'Performance' : 'Matérias'}
            </h2>
          </div>
          <p className="text-sm leading-5 text-muted-foreground mt-1 ml-3 line-clamp-2 min-h-[2.5rem]">
            {aba === 'acervos'
              ? 'Explore as coleções completas por área, autor e temática jurídica.'
              : aba === 'performance'
                ? 'Oratória, liderança, português, pesquisa e leituras fora da toga.'
                : 'Todas as áreas do Direito reunidas para escolher e começar a ler.'}
          </p>
        </div>

        {/* Menu de alternância — mesmo padrão dos Resumos */}
        <div className="px-4 mb-6">
          <div className="relative flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/60">
            {ABAS.map((a) => {
              const ativo = aba === a.id;
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  className="relative flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full font-display text-[12px] font-bold uppercase tracking-wide transition-colors"
                >
                  {ativo && (
                    <span className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-black/20" />
                  )}
                  <span className={`relative flex items-center gap-1.5 ${ativo ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


        {aba === 'materias' ? (
          <div className="px-4">
            {loadingAreas && materias.length === 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[112px] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : materias.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma área disponível ainda.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {materias.map((m, i) => {
                  const s = styleForArea(m.name);
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={m.name}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                      onClick={() => setMateriaAberta(m.name)}
                      className="relative flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left min-h-[112px] active:scale-[0.985]"
                    >
                      <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-muted-foreground" />
                      <Icon className="w-7 h-7 shrink-0" style={{ color: s.color }} strokeWidth={1.7} />
                      <div className="font-display font-bold text-foreground text-[13px] leading-tight uppercase line-clamp-2">
                        {m.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground -mt-1">
                        {m.count} {m.count === 1 ? 'livro' : 'livros'}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        ) : aba === 'performance' ? (
          <div className="px-4 grid grid-cols-2 gap-3">
            {colecoesPerformance.map((c, i) => {
              const s = styleForPerformance(c.id);
              const Icon = s.icon;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                  onClick={() => { track('biblioteca_colecao_opened', { colecao_id: c.id, colecao_label: c.label }); navigate(`/bibliotecas/${c.id}`); }}
                  className="relative flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left min-h-[112px] active:scale-[0.985]"
                >
                  <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-muted-foreground" />
                  <Icon className="w-7 h-7 shrink-0" style={{ color: s.color }} strokeWidth={1.7} />
                  <div className="font-display font-bold text-foreground text-[13px] leading-tight uppercase line-clamp-2">
                    {c.label}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-2">
            {colecoesAcervos.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                onClick={() => { track('biblioteca_colecao_opened', { colecao_id: c.id, colecao_label: c.label }); navigate(`/bibliotecas/${c.id}`); }}
                data-track="biblioteca_colecao_click"
                data-colecao-id={c.id}
                data-colecao-label={c.label}
                className="group relative flex items-stretch h-[104px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:-translate-y-0.5 transition-transform text-left w-full active:scale-[0.985]"
              >
                <div className="relative w-[140px] shrink-0 overflow-hidden">
                  <img
                    src={c.cover}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={i < 2 ? undefined : 'lazy'}
                  />
                  {/* Fade suave para o card, sem tingir a capa */}
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-card pointer-events-none" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-3 bg-card text-foreground">
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/90">
                    {c.eyebrow}
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold leading-tight mt-0.5 truncate">
                    {c.label}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">
                    {c.subtitle}
                  </p>

                </div>

                <div className="flex items-center pr-4 text-muted-foreground">
                  <ChevronRight className="w-5 h-5" />
                </div>

                {/* Reflexo cascata ao entrar na biblioteca */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-screen"
                  initial={{ x: '-40%', opacity: 0 }}
                  animate={{ x: '420%', opacity: [0, 1, 1, 0] }}
                  transition={{
                    delay: 0.25 + i * 0.18,
                    duration: 1.1,
                    ease: 'easeInOut',
                    times: [0, 0.15, 0.85, 1],
                  }}
                />
              </motion.button>
            ))}
          </div>
        )}


      </div>

      <BibliotecaBottomNav />

      {/* Matéria: abre de baixo para cima até 90% (mesmo padrão dos Resumos) */}
      <AnimatePresence>
        {materiaAberta && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMateriaAberta(null)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[71] flex h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-background pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]"
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/70 flex items-center justify-center shrink-0">
                    {(() => {
                      const s = styleForArea(materiaAberta);
                      const Icon = s.icon;
                      return <Icon className="w-6 h-6" style={{ color: s.color }} strokeWidth={1.4} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-foreground font-bold leading-none truncate uppercase">
                      {materiaAberta}
                    </h3>
                    <p className="text-muted-foreground text-[12px] mt-1">
                      {livrosDaMateria.length} {livrosDaMateria.length === 1 ? 'livro' : 'livros'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMateriaAberta(null)}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-secondary/70 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
                {livrosDaMateria.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLivroAberto(l)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="w-[56px] h-[76px] shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                      {l.capa && (
                        <img src={directImg(l.capa, 200)} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{l.titulo}</p>
                      {l.autor && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{l.autor}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
                {livrosDaMateria.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum livro nesta matéria.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LivroDetailSheet
        livro={livroAberto}
        open={!!livroAberto}
        onClose={() => setLivroAberto(null)}
      />
    </main>
  );
};

export default Bibliotecas;
