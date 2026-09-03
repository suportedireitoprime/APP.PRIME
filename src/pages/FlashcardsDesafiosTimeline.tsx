import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Play,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronDown,
  Check,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { DESAFIOS_DECKS_CATALOGO, DesafioDeckPronto } from '@/config/flashcardsDesafiosDecks';
import { useFlashcardsDesafiosStore } from '@/lib/flashcardsDesafiosStore';
import { DesafiosTimeline } from '@/components/flashcards/DesafiosTimeline';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const FlashcardsDesafiosTimeline = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const {
    isDeckConcluido,
    isDeckDesbloqueado,
    obterProgressoArea,
  } = useFlashcardsDesafiosStore();

  const [menuMateriasAberto, setMenuMateriasAberto] = useState(false);
  const [buscaMenu, setBuscaMenu] = useState('');
  const scrollTabsRef = useRef<HTMLDivElement>(null);

  // Lista ordenada de matérias em ordem alfabética
  const materiasOrdenadas = useMemo(() => {
    return [...DESAFIOS_DECKS_CATALOGO].sort((a, b) =>
      a.area.localeCompare(b.area, 'pt-BR')
    );
  }, []);

  // Matéria atualmente selecionada baseada na URL :slug
  const areaAtualInfo = useMemo(() => {
    if (slug) {
      const normalizado = slug.toLowerCase();
      const encontrada = DESAFIOS_DECKS_CATALOGO.find(
        (a) => a.slug.toLowerCase() === normalizado || a.area.toLowerCase() === normalizado
      );
      if (encontrada) return encontrada;
    }
    return DESAFIOS_DECKS_CATALOGO[0];
  }, [slug]);

  // SEO & Título
  useEffect(() => {
    document.title = `Linha do Tempo · ${areaAtualInfo.area} | Vade Mecum PRIME`;
  }, [areaAtualInfo.area]);

  // Rolar a aba ativa para o centro ao alternar
  useEffect(() => {
    if (scrollTabsRef.current) {
      const activeEl = scrollTabsRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [areaAtualInfo.slug]);

  const progressoAreaAtual = useMemo(() => {
    return obterProgressoArea(areaAtualInfo.area);
  }, [obterProgressoArea, areaAtualInfo.area]);

  const { color: corAreaAtual, icon: IconAreaAtual } = getAreaVisual(areaAtualInfo.area);

  const handlePraticar = (deck: DesafioDeckPronto) => {
    haptic.selection();
    const params = new URLSearchParams();
    params.set('area', deck.area);
    if (deck.tema) {
      params.set('temas', deck.tema);
    }
    setTimeout(() => {
      navigate(`/flashcards/estudar?${params.toString()}`);
    }, 150);
  };

  const handleTrocarMateria = (novaAreaSlug: string) => {
    haptic.selection();
    setMenuMateriasAberto(false);
    navigate(`/flashcards/desafios/${novaAreaSlug}`, { replace: true });
  };

  // Filtragem no menu de alternância modal
  const materiasFiltradasMenu = useMemo(() => {
    const q = buscaMenu.trim().toLowerCase();
    if (!q) return materiasOrdenadas;
    return materiasOrdenadas.filter(
      (m) =>
        m.area.toLowerCase().includes(q) ||
        m.descricao.toLowerCase().includes(q) ||
        m.decks.some((d) => d.titulo.toLowerCase().includes(q) || d.tema.toLowerCase().includes(q))
    );
  }, [materiasOrdenadas, buscaMenu]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-[calc(3rem+var(--sai-bottom,0px))]">
      {/* Background ShapeGrid oficial */}
      <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={areaAtualInfo.area}
          subtitle="Linha do Tempo dos Desafios"
          onBack={() => navigate('/flashcards/desafios')}
        />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 pt-2 space-y-6">
        {/* ── 1. Barra do Menu de Alternância de Matérias ───────────────── */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full" style={{ backgroundColor: corAreaAtual }} />
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Alternar Matéria ({materiasOrdenadas.length})
              </p>
            </div>

            {/* Botão para abrir gaveta de visualização rápida com todos os assuntos */}
            <button
              onClick={() => {
                haptic.selection();
                setMenuMateriasAberto(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/70 hover:border-white/20 text-xs font-bold text-foreground transition-colors active:scale-95 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Ver todos os assuntos</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Carrossel Horizontal de Abas Rápidas (Ordem Alfabética) */}
          <div
            ref={scrollTabsRef}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {materiasOrdenadas.map((cat) => {
              const { color: cor, icon: Icon } = getAreaVisual(cat.area);
              const isSelected = cat.slug === areaAtualInfo.slug;
              const prog = obterProgressoArea(cat.area);

              return (
                <button
                  key={cat.slug}
                  data-active={isSelected}
                  onClick={() => handleTrocarMateria(cat.slug)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shrink-0 transition-all active:scale-95 select-none ${
                    isSelected
                      ? 'bg-card border-white text-foreground shadow-lg'
                      : 'bg-card/50 border-border/60 text-muted-foreground hover:bg-card/90 hover:border-border'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: cor,
                          boxShadow: `0 4px 16px -2px ${cor}40`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cor}20`,
                      color: cor,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <span className="text-xs font-bold whitespace-nowrap">
                    {cat.area}
                  </span>

                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums"
                    style={{
                      backgroundColor: `${cor}22`,
                      color: cor,
                    }}
                  >
                    {prog.porcentagem}%
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Card de Destaque da Matéria Selecionada ───────────────── */}
        <section
          className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all shadow-xl backdrop-blur-md"
          style={{
            backgroundColor: `${corAreaAtual}12`,
            borderColor: `${corAreaAtual}44`,
          }}
        >
          {/* Brilho de fundo */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-20 blur-3xl"
            style={{ background: corAreaAtual }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border"
                style={{
                  backgroundColor: `${corAreaAtual}25`,
                  borderColor: `${corAreaAtual}55`,
                  color: corAreaAtual,
                }}
              >
                <IconAreaAtual className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                    style={{ backgroundColor: corAreaAtual }}
                  >
                    Matéria Selecionada
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {areaAtualInfo.decks.length} assuntos disponíveis
                  </span>
                </div>

                <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {areaAtualInfo.area}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  {areaAtualInfo.descricao}
                </p>
              </div>
            </div>

            {/* Progresso da Matéria */}
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <span className="text-xs font-bold text-foreground bg-card/80 border border-border/80 px-3.5 py-1.5 rounded-full shadow-sm">
                {progressoAreaAtual.concluidos} de {progressoAreaAtual.total} concluídos ({progressoAreaAtual.porcentagem}%)
              </span>
              <div className="w-full sm:w-40 h-2 rounded-full bg-muted/40 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressoAreaAtual.porcentagem}%`,
                    backgroundColor: corAreaAtual,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Linha do Tempo dos Decks / Assuntos ───────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: corAreaAtual }} />
              Sequência de Assuntos em Linha do Tempo
            </h2>
          </div>

          <DesafiosTimeline
            decks={areaAtualInfo.decks}
            corArea={corAreaAtual}
            isDeckConcluido={isDeckConcluido}
            isDeckDesbloqueado={isDeckDesbloqueado}
            onPraticarDeck={handlePraticar}
          />
        </section>
      </main>

      {/* ── Modal / Sheet "Todas as Matérias & Assuntos" ─────────────── */}
      <Sheet open={menuMateriasAberto} onOpenChange={setMenuMateriasAberto}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-3xl border-t border-border bg-card/95 backdrop-blur-xl px-4 sm:px-6 pb-6 pt-5 overflow-y-auto"
        >
          <SheetHeader className="text-left pb-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Todas as Matérias & Assuntos
              </SheetTitle>
              <button
                onClick={() => setMenuMateriasAberto(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Navegue pelos desafios estruturados em ordem alfabética com todos os seus assuntos.
            </p>

            {/* Campo de Busca Rápida no Menu */}
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={buscaMenu}
                onChange={(e) => setBuscaMenu(e.target.value)}
                placeholder="Buscar matéria ou assunto..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </SheetHeader>

          {/* Lista de Matérias com Seus Assuntos */}
          <div className="space-y-4 pt-4">
            {materiasFiltradasMenu.map((cat) => {
              const { color: cor, icon: Icon } = getAreaVisual(cat.area);
              const prog = obterProgressoArea(cat.area);
              const isSelected = cat.slug === areaAtualInfo.slug;

              return (
                <div
                  key={cat.slug}
                  className={`rounded-2xl border transition-all p-3.5 ${
                    isSelected
                      ? 'bg-card border-white/40 shadow-md ring-1 ring-white/20'
                      : 'bg-background/60 border-border/60 hover:border-border'
                  }`}
                >
                  {/* Cabeçalho da Matéria no Menu */}
                  <div
                    onClick={() => handleTrocarMateria(cat.slug)}
                    className="flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cor}22`,
                          color: cor,
                        }}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {cat.area}
                          </h3>
                          {isSelected && (
                            <span
                              className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded text-white"
                              style={{ backgroundColor: cor }}
                            >
                              Ativa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {cat.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-extrabold px-2 py-0.5 rounded-full tabular-nums"
                        style={{
                          backgroundColor: `${cor}20`,
                          color: cor,
                        }}
                      >
                        {prog.concluidos}/{prog.total} ({prog.porcentagem}%)
                      </span>
                    </div>
                  </div>

                  {/* Lista Compacta de Assuntos da Matéria */}
                  <div className="mt-3 pt-2.5 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.decks.map((deck) => {
                      const conc = isDeckConcluido(deck.id);
                      const desbloq = isDeckDesbloqueado(deck, cat.decks);

                      return (
                        <div
                          key={deck.id}
                          onClick={() => handleTrocarMateria(cat.slug)}
                          className="flex items-center justify-between p-2 rounded-xl bg-card/40 hover:bg-card border border-border/30 hover:border-border cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              #{String(deck.ordem).padStart(2, '0')}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {deck.titulo}
                            </span>
                          </div>

                          <div className="shrink-0 ml-2">
                            {conc ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            ) : desbloq ? (
                              <Play className="w-3 h-3 text-muted-foreground fill-current" />
                            ) : (
                              <Lock className="w-3 h-3 text-muted-foreground/40" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FlashcardsDesafiosTimeline;
