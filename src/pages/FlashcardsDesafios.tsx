import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, CheckCircle2, Play, Sparkles, ArrowRight, Layers, Search, X, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import {
  DESAFIOS_DECKS_CATALOGO,
  DesafioDeckPronto,
  AREA_TEMAS_COUNT_MAP,
  TOTAL_DESAFIOS_COUNT,
} from '@/config/flashcardsDesafiosDecks';
import { useFlashcardsDesafiosStore } from '@/lib/flashcardsDesafiosStore';
import { DesafiosHero } from '@/components/flashcards/DesafiosHero';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';

const FlashcardsDesafios = () => {
  const navigate = useNavigate();
  const {
    totalDecks,
    totalConcluidos,
    porcentagemGlobal,
    obterProgressoArea,
    desafioAtualGlobal,
  } = useFlashcardsDesafiosStore();

  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);

  // SEO
  useEffect(() => {
    document.title = 'Desafios & Decks Prontos | Vade Mecum PRIME';
  }, []);

  // Matérias ordenadas em ordem alfabética
  const materiasOrdenadas = useMemo(() => {
    return [...DESAFIOS_DECKS_CATALOGO].sort((a, b) =>
      a.area.localeCompare(b.area, 'pt-BR')
    );
  }, []);

  // Filtragem por busca
  const materiasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return materiasOrdenadas;
    return materiasOrdenadas.filter(
      (m) =>
        m.area.toLowerCase().includes(q) ||
        m.descricao.toLowerCase().includes(q) ||
        m.decks.some((d) => d.titulo.toLowerCase().includes(q) || d.tema.toLowerCase().includes(q))
    );
  }, [materiasOrdenadas, busca]);

  const handleContinuarDesafio = (deck: DesafioDeckPronto) => {
    haptic.impact();
    const params = new URLSearchParams();
    params.set('area', deck.area);
    if (deck.tema) {
      params.set('temas', deck.tema);
    }
    setTimeout(() => {
      navigate(`/flashcards/estudar?${params.toString()}`);
    }, 150);
  };

  const handleAbrirMateria = (slug: string) => {
    haptic.selection();
    navigate(`/flashcards/desafios/${slug}`);
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
          title="Desafios"
          subtitle="Decks prontos por área do Direito em linha do tempo"
          onBack={() => navigate('/flashcards')}
        />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 pt-2 space-y-6">
        {/* ── 1. Painel Hero Oficial no Padrão Flashcards (Porcentagem + Continuar Desafio) ── */}
        <DesafiosHero
          porcentagemGlobal={porcentagemGlobal}
          totalConcluidos={totalConcluidos}
          totalDecks={TOTAL_DESAFIOS_COUNT}
          desafioAtual={desafioAtualGlobal}
          onContinuar={handleContinuarDesafio}
        />

        {/* ── 2. Desafios por Matéria em Ordem Alfabética ──────────────── */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-emerald-500" />
                Desafios por Matéria
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha uma matéria para abrir sua linha do tempo com todos os assuntos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground bg-zinc-900/80 border border-white/10 px-2.5 py-1 rounded-full shrink-0">
                {materiasFiltradas.length} matérias
              </span>

              <button
                onClick={() => {
                  haptic.selection();
                  setBuscaAberta((v) => !v);
                  if (buscaAberta) setBusca('');
                }}
                aria-label={buscaAberta ? 'Fechar busca' : 'Buscar matéria'}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
              >
                {buscaAberta ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          {buscaAberta && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="relative"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar matérias por nome..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-zinc-900/90 border border-white/15 text-sm font-medium text-foreground focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
                autoFocus
              />
            </motion.div>
          )}

          {/* Grade de Matérias em Ordem Alfabética */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {materiasFiltradas.map((cat) => {
              const { color: cor, icon: Icon } = getAreaVisual(cat.area);
              const prog = obterProgressoArea(cat.area);
              const totalAssuntos = AREA_TEMAS_COUNT_MAP[cat.area] ?? cat.decks.length;
              const isCompleto = prog.concluidos > 0 && prog.concluidos >= totalAssuntos;

              return (
                <motion.div
                  key={cat.slug}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAbrirMateria(cat.slug)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/75 hover:bg-zinc-900/85 hover:border-white/20 p-5 shadow-lg backdrop-blur-md transition-all flex flex-col justify-between select-none"
                  style={{
                    borderColor: `${cor}30`,
                  }}
                >
                  {/* Brilho hover sutil no canto */}
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-15 transition-opacity blur-2xl"
                    style={{ background: cor }}
                  />

                  <div>
                    {/* Topo do Card: Ícone e Badge de Porcentagem */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${cor}25`,
                          color: cor,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCompleto ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            100%
                          </span>
                        ) : (
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold tabular-nums border"
                            style={{
                              backgroundColor: `${cor}15`,
                              borderColor: `${cor}30`,
                              color: cor,
                            }}
                          >
                            {prog.porcentagem}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Título e Descrição */}
                    <h3 className="font-display text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {cat.area}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.descricao}
                    </p>
                  </div>

                  {/* Rodapé: Progresso e Ação de Abertura */}
                  <div className="mt-5 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                      <span>{prog.concluidos} de {totalAssuntos} assuntos</span>
                      <span className="text-white font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Linha do tempo
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Barra de Progresso Fina */}
                    <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${prog.porcentagem}%`,
                          backgroundColor: cor,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {materiasFiltradas.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-10 text-center text-muted-foreground space-y-2">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-bold">Nenhuma matéria encontrada com o termo pesquisado.</p>
              <button
                onClick={() => setBusca('')}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default FlashcardsDesafios;
