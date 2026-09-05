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
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { DESAFIOS_DECKS_CATALOGO, DesafioDeckPronto, AREA_TEMAS_COUNT_MAP } from '@/config/flashcardsDesafiosDecks';
import { useFlashcardsDesafiosStore } from '@/lib/flashcardsDesafiosStore';
import { DesafiosTimeline } from '@/components/flashcards/DesafiosTimeline';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const FlashcardsDesafiosTimeline = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const {
    isDeckConcluido,
    isDeckDesbloqueado,
    obterProgressoArea,
  } = useFlashcardsDesafiosStore();

  const [menuAssuntosAberto, setMenuAssuntosAberto] = useState(false);
  const [temaAtivo, setTemaAtivo] = useState<string>('todos');
  const [buscaAssuntos, setBuscaAssuntos] = useState('');
  const scrollTabsRef = useRef<HTMLDivElement>(null);

  // Identifica a área atual pela URL
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

  const { color: corAreaAtual, icon: IconAreaAtual } = getAreaVisual(areaAtualInfo.area);

  // SEO & Título
  useEffect(() => {
    document.title = `Linha do Tempo · ${areaAtualInfo.area} | Vade Mecum PRIME`;
  }, [areaAtualInfo.area]);

  // Carrega os temas/assuntos reais do Supabase para esta matéria específica
  const { data: temasDb, isLoading: loadingTemas } = useQuery({
    queryKey: ['flashcards_temas_desafios_area', areaAtualInfo.area],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('flashcards_temas', { _area: areaAtualInfo.area });
      if (error) {
        console.warn('[FlashcardsDesafiosTimeline] Erro ao carregar temas:', error);
        return [];
      }
      return (data || []) as Array<{
        tema: string;
        total: number;
        compreendidos: number;
        a_revisar: number;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Constrói a lista completa de decks para a matéria a partir dos temas reais do Supabase
  const decksDaMateria: DesafioDeckPronto[] = useMemo(() => {
    if (temasDb && temasDb.length > 0) {
      return temasDb.map((t, idx) => {
        let nivel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Especialista' = 'Iniciante';
        const frac = idx / temasDb.length;
        if (frac > 0.75) nivel = 'Especialista';
        else if (frac > 0.5) nivel = 'Avançado';
        else if (frac > 0.25) nivel = 'Intermediário';

        return {
          id: `${areaAtualInfo.slug}-deck-${idx + 1}`,
          area: areaAtualInfo.area,
          tema: t.tema,
          titulo: t.tema,
          subtitulo: `${t.total} flashcards inteligentes para fixação e retenção`,
          ordem: idx + 1,
          nivel,
          cardsEstimados: Number(t.total) || 20,
        };
      });
    }

    // Fallback caso ainda esteja carregando ou offline
    return areaAtualInfo.decks;
  }, [temasDb, areaAtualInfo]);

  // Filtra a lista de decks pelo tema ativo do menu de alternância
  const decksExibidos = useMemo(() => {
    if (temaAtivo === 'todos') {
      return decksDaMateria;
    }
    return decksDaMateria.filter((d) => d.tema === temaAtivo || d.titulo === temaAtivo);
  }, [decksDaMateria, temaAtivo]);

  // Lista filtrada para o modal de busca de assuntos
  const assuntosFiltradosModal = useMemo(() => {
    const q = buscaAssuntos.trim().toLowerCase();
    if (!q) return decksDaMateria;
    return decksDaMateria.filter(
      (d) => d.titulo.toLowerCase().includes(q) || d.subtitulo.toLowerCase().includes(q)
    );
  }, [decksDaMateria, buscaAssuntos]);

  const progressoAreaAtual = useMemo(() => {
    const total = decksDaMateria.length;
    const concluidos = decksDaMateria.filter((d) => isDeckConcluido(d.id)).length;
    const porcentagem = total > 0 ? Math.min(100, Math.round((concluidos / total) * 100)) : 0;
    return { total, concluidos, porcentagem };
  }, [decksDaMateria, isDeckConcluido]);

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

  const handleSelecionarTema = (tema: string) => {
    haptic.selection();
    setTemaAtivo(tema);
    setMenuAssuntosAberto(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-foreground relative overflow-x-hidden pb-[calc(3rem+var(--sai-bottom,0px))]">
      {/* Background ShapeGrid oficial idêntico ao de Pílulas */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
        {/* ── 1. Card de Destaque da Matéria Selecionada ───────────────── */}
        <section
          className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all shadow-xl backdrop-blur-md bg-zinc-950/80"
          style={{
            borderColor: `${corAreaAtual}44`,
          }}
        >
          {/* Brilho de fundo com a cor temática da matéria */}
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
                  <span className="text-xs text-zinc-400 font-semibold">
                    {decksDaMateria.length} assuntos disponíveis
                  </span>
                </div>

                <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
                  {areaAtualInfo.area}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
                  {areaAtualInfo.descricao}
                </p>
              </div>
            </div>

            {/* Contador de Progresso */}
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <span className="text-xs font-bold text-white bg-zinc-900/90 border border-white/10 px-3.5 py-1.5 rounded-full shadow-sm">
                {progressoAreaAtual.concluidos} de {progressoAreaAtual.total} concluídos ({progressoAreaAtual.porcentagem}%)
              </span>
              <div className="w-full sm:w-44 h-2 rounded-full bg-zinc-800/80 overflow-hidden mt-1">
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

        {/* ── 2. Menu de Alternância de Assuntos da Matéria ─────────────── */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full" style={{ backgroundColor: corAreaAtual }} />
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                Menu de Alternância de Assuntos ({decksDaMateria.length})
              </p>
            </div>

            {/* Botão para abrir gaveta completa com todos os assuntos */}
            <button
              onClick={() => {
                haptic.selection();
                setMenuAssuntosAberto(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 hover:border-white/20 text-xs font-bold text-white transition-colors active:scale-95 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver todos ({decksDaMateria.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Carrossel Horizontal com os Assuntos DENTRO desta Matéria */}
          <div
            ref={scrollTabsRef}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {/* Opção "Todos os Assuntos" */}
            <button
              onClick={() => handleSelecionarTema('todos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shrink-0 text-xs font-bold transition-all active:scale-95 select-none ${
                temaAtivo === 'todos'
                  ? 'bg-white text-zinc-950 font-black shadow-lg shadow-white/10 border-white'
                  : 'bg-zinc-900/70 text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>Todos os Assuntos</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  temaAtivo === 'todos' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-white/10 text-zinc-300'
                }`}
              >
                {decksDaMateria.length}
              </span>
            </button>

            {/* Abas individuais para cada assunto de Direito Administrativo */}
            {decksDaMateria.map((d) => {
              const isSelected = temaAtivo === d.tema;
              const concluido = isDeckConcluido(d.id);

              return (
                <button
                  key={d.id}
                  onClick={() => handleSelecionarTema(d.tema)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shrink-0 text-xs font-bold transition-all active:scale-95 select-none ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: corAreaAtual,
                          borderColor: corAreaAtual,
                          boxShadow: `0 4px 16px -2px ${corAreaAtual}66`,
                        }
                      : undefined
                  }
                >
                  <span className="truncate max-w-[200px]">{d.titulo}</span>

                  {concluido ? (
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] opacity-75 shrink-0">~{d.cardsEstimados}c</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. Linha do Tempo dos Decks / Assuntos ───────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: corAreaAtual }} />
              {temaAtivo === 'todos'
                ? `Sequência Completa (${decksExibidos.length} Assuntos em Linha do Tempo)`
                : `Assunto Selecionado · ${temaAtivo}`}
            </h2>

            {temaAtivo !== 'todos' && (
              <button
                onClick={() => setTemaAtivo('todos')}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Exibir todos os assuntos
              </button>
            )}
          </div>

          <DesafiosTimeline
            decks={decksExibidos}
            corArea={corAreaAtual}
            isDeckConcluido={isDeckConcluido}
            isDeckDesbloqueado={isDeckDesbloqueado}
            onPraticarDeck={handlePraticar}
          />
        </section>
      </main>

      {/* ── Modal / Sheet "Todos os Assuntos de [Matéria]" ────────────── */}
      <Sheet open={menuAssuntosAberto} onOpenChange={setMenuAssuntosAberto}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-3xl border-t border-white/10 bg-zinc-950/95 backdrop-blur-2xl px-4 sm:px-6 pb-6 pt-5 overflow-y-auto text-foreground"
        >
          <SheetHeader className="text-left pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5" style={{ color: corAreaAtual }} />
                Assuntos de {areaAtualInfo.area}
              </SheetTitle>
              <button
                onClick={() => setMenuAssuntosAberto(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Selecione qualquer assunto da lista abaixo para praticar ou filtrar na linha do tempo.
            </p>

            {/* Campo de Busca Rápida nos Assuntos */}
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={buscaAssuntos}
                onChange={(e) => setBuscaAssuntos(e.target.value)}
                placeholder={`Buscar assunto em ${areaAtualInfo.area}...`}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </SheetHeader>

          {/* Grade de Assuntos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
            {assuntosFiltradosModal.map((deck) => {
              const conc = isDeckConcluido(deck.id);
              const isSelected = temaAtivo === deck.tema;

              return (
                <div
                  key={deck.id}
                  onClick={() => handleSelecionarTema(deck.tema)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all select-none ${
                    isSelected
                      ? 'bg-zinc-900 border-white/40 ring-1 ring-white/20'
                      : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        #{String(deck.ordem).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                        {deck.nivel}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {deck.titulo}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      ~{deck.cardsEstimados} flashcards
                    </p>
                  </div>

                  <div className="shrink-0">
                    {conc ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${corAreaAtual}20`,
                          color: corAreaAtual,
                        }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
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
