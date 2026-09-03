import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, CheckCircle2, Play, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { DESAFIOS_DECKS_CATALOGO, DesafioDeckPronto } from '@/config/flashcardsDesafiosDecks';
import { useFlashcardsDesafiosStore } from '@/lib/flashcardsDesafiosStore';
import { DesafiosTimeline } from '@/components/flashcards/DesafiosTimeline';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';

const FlashcardsDesafios = () => {
  const navigate = useNavigate();
  const {
    totalDecks,
    totalConcluidos,
    porcentagemGlobal,
    isDeckConcluido,
    isDeckDesbloqueado,
    obterProgressoArea,
    desafioAtualGlobal,
  } = useFlashcardsDesafiosStore();

  // Área atualmente selecionada para visualização da linha do tempo
  const [selectedAreaNome, setSelectedAreaNome] = useState<string>('Direito Penal');

  // SEO
  useEffect(() => {
    document.title = 'Desafios & Decks Prontos | Vade Mecum PRIME';
  }, []);

  const areaAtualInfo = useMemo(() => {
    return (
      DESAFIOS_DECKS_CATALOGO.find(a => a.area === selectedAreaNome) ||
      DESAFIOS_DECKS_CATALOGO[0]
    );
  }, [selectedAreaNome]);

  const progressoAreaAtual = useMemo(() => {
    return obterProgressoArea(areaAtualInfo.area);
  }, [obterProgressoArea, areaAtualInfo.area]);

  const { color: corAreaAtual, icon: IconAreaAtual } = getAreaVisual(areaAtualInfo.area);

  // Desafio em destaque: se houver pendente na área selecionada, usa ele; senão usa o global
  const desafioEmDestaque = progressoAreaAtual.proximoDeck || desafioAtualGlobal;
  const visualDestaque = getAreaVisual(desafioEmDestaque.area);

  const handlePraticar = (deck: DesafioDeckPronto) => {
    haptic.selection();
    const params = new URLSearchParams();
    params.set('area', deck.area);
    if (deck.tema) {
      params.set('temas', deck.tema);
    }
    // Adiciona delay para permitir que a animação tátil/click aconteça antes de desmontar
    setTimeout(() => {
      navigate(`/flashcards/estudo?${params.toString()}`);
    }, 150);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh bg-background pb-20 pt-[calc(0.5rem+var(--sai-top))]"
    >
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Desafios"
          subtitle="Decks prontos por área do Direito em linha do tempo"
          onBack={() => navigate('/flashcards')}
        />

        {/* 1. Painel de Progresso Geral */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-card/60 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Seu Progresso Geral
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {porcentagemGlobal}% <span className="text-base sm:text-lg font-medium text-muted-foreground">concluído</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {totalConcluidos} de {totalDecks} desafios concluídos em todas as áreas
              </p>
            </div>

            {/* Círculo visual de progresso */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${porcentagemGlobal}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-display text-xs sm:text-sm font-extrabold text-foreground">
                {porcentagemGlobal}%
              </span>
            </div>
          </div>

          {/* Barra horizontal fina com gradiente */}
          <div className="mt-4 w-full h-2 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${porcentagemGlobal}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400"
            />
          </div>
        </div>

        {/* 2. Card de Destaque — "Seu Desafio Atual" */}
        {desafioEmDestaque && (
          <div
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all shadow-lg"
            style={{
              backgroundColor: `${visualDestaque.color}10`,
              borderColor: `${visualDestaque.color}44`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: visualDestaque.color }}
              />
              <p
                className="text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: visualDestaque.color }}
              >
                Seu Desafio Atual
              </p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: visualDestaque.color }}
                  >
                    {desafioEmDestaque.area}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Deck {String(desafioEmDestaque.ordem).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  {desafioEmDestaque.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {desafioEmDestaque.subtitulo} · ~{desafioEmDestaque.cardsEstimados} cards
                </p>
              </div>

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${visualDestaque.color}20`,
                  borderColor: `${visualDestaque.color}40`,
                  color: visualDestaque.color,
                }}
              >
                <Flame className="w-6 h-6 fill-current" />
              </div>
            </div>

            <button
              onClick={() => handlePraticar(desafioEmDestaque)}
              className="mt-4 w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
              style={{
                backgroundColor: visualDestaque.color,
                boxShadow: `0 6px 20px -2px ${visualDestaque.color}66`,
              }}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Continuar desafio</span>
            </button>
          </div>
        )}

        {/* 3. Seletor de Áreas do Direito (Carrossel Horizontal de Chips) */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Selecione a Área do Direito
            </h2>
            <span className="text-xs font-semibold text-muted-foreground/70">
              {DESAFIOS_DECKS_CATALOGO.length} matérias
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            {DESAFIOS_DECKS_CATALOGO.map((cat) => {
              const { color: cor, icon: Icon } = getAreaVisual(cat.area);
              const isSelected = cat.area === selectedAreaNome;
              const prog = obterProgressoArea(cat.area);

              return (
                <button
                  key={cat.area}
                  onClick={() => {
                    haptic.selection();
                    setSelectedAreaNome(cat.area);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shrink-0 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-card border-white text-foreground shadow-lg'
                      : 'bg-card/60 border-border/60 text-muted-foreground hover:bg-card/90 hover:border-border'
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
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cor}20`,
                      color: cor,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                    {cat.area}
                  </span>

                  {/* Badge de porcentagem */}
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums"
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
        </div>

        {/* 4. Linha do Tempo dos Decks da Área Selecionada */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 mb-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  backgroundColor: `${corAreaAtual}20`,
                  color: corAreaAtual,
                }}
              >
                <IconAreaAtual className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Linha do Tempo · {areaAtualInfo.area}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {areaAtualInfo.descricao}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-foreground bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {progressoAreaAtual.concluidos}/{progressoAreaAtual.total} concluídos ({progressoAreaAtual.porcentagem}%)
              </span>
            </div>
          </div>

          {/* Componente Linha do Tempo */}
          <DesafiosTimeline
            decks={areaAtualInfo.decks}
            corArea={corAreaAtual}
            isDeckConcluido={isDeckConcluido}
            isDeckDesbloqueado={isDeckDesbloqueado}
            onPraticarDeck={handlePraticar}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FlashcardsDesafios;
