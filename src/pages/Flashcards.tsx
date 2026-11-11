import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ChevronRight, Search, X, Layers, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Landmark, History, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { cn } from '@/lib/utils';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import { FallingLotusPetals } from '@/components/flashcards/FallingLotusPetals';

// Louro de vitória clássico em miniatura
const MiniLaurel = ({ flip = false }: { flip?: boolean }) => (
  <svg 
    viewBox="0 0 40 30" 
    className={cn("w-5 h-4 text-[#f59e0b]/80 shrink-0", flip && "scale-x-[-1]")} 
    fill="currentColor"
  >
    <path d="M5,25 Q18,20 22,5 Q20,15 10,24 Z" opacity="0.9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M22,5 C25,4 28,6 26,9 C24,12 21,8 22,5 Z" />
    <path d="M20,11 C24,10 27,13 24,16 C21,19 19,15 20,11 Z" />
    <path d="M17,17 C21,17 24,20 21,23 C18,26 16,21 17,17 Z" />
    <path d="M19,8 C15,6 13,9 15,12 C17,15 20,10 19,8 Z" />
    <path d="M16,14 C12,13 10,16 13,19 C16,22 17,17 16,14 Z" />
  </svg>
);

// Formatação limpa do nome da matéria (remove prefixo "Direito" para exibição direta)
export const formatarNomeArea = (nome: string) => {
  if (!nome) return '';
  const limpo = nome.replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '').trim();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
};

// Cores do progresso circular por faixa de rendimento
const getProgressColor = (pct: number) => {
  if (pct <= 0) return { stroke: '#52525b', text: '#a1a1aa', glow: 'none' };
  if (pct <= 40) return { stroke: '#ef4444', text: '#f87171', glow: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.7))' };
  if (pct <= 69) return { stroke: '#eab308', text: '#fde047', glow: 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.7))' };
  return { stroke: '#10b981', text: '#34d399', glow: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' };
};

const ATALHOS_FLASHCARDS = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/flashcards/historico' },
  { id: 'decks', label: 'Decks', desc: 'Seus baralhos', icon: Layers, route: '/flashcards/decks' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/flashcards/revisar' },
  { id: 'progresso', label: 'Progresso', desc: 'Estatísticas', icon: BarChart3, route: '/flashcards/progresso' },
];

const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash } = useFlashcardsDashboard();
  const { data: areasRaw } = useFlashcardsResumoAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroDisciplinaPrevia, setFiltroDisciplinaPrevia] = useState<string | undefined>();
  const [filtroPassoPrevio, setFiltroPassoPrevio] = useState<'disciplinas' | 'assuntos' | 'tipos' | 'status' | 'quantidade' | undefined>();
  const [areaSelecionadaModal, setAreaSelecionadaModal] = useState<FlashcardsAreaRow | null>(null);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'materias' | 'recentes' | 'favoritos'>('materias');
  
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('flashcards_favoritos_areas');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Atualiza favoritos automaticamente ao focar na janela / voltar da matéria
  useEffect(() => {
    const syncFavs = () => {
      try {
        const raw = localStorage.getItem('flashcards_favoritos_areas');
        setFavoritos(raw ? JSON.parse(raw) : []);
      } catch {}
    };
    window.addEventListener('focus', syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      window.removeEventListener('focus', syncFavs);
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  const areas = useMemo(() => {
    const list = areasRaw && areasRaw.length > 0 ? areasRaw : FALLBACK_FLASHCARDS_AREAS;
    return [...list].sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  }, [areasRaw]);

  const totalCardsGeral = useMemo(() => {
    return areas.reduce((acc, a) => acc + (a.total_cards || 0), 0);
  }, [areas]);

  const areasFiltradas = useMemo(() => {
    let list = areas;
    if (abaAtiva === 'favoritos') {
      list = list.filter((a) => favoritos.includes(a.slug || a.area));
    } else if (abaAtiva === 'recentes') {
      const comProgresso = list.filter((a) => a.compreendidos > 0);
      list = comProgresso.length > 0 ? comProgresso : list.slice(0, 5);
    }

    if (!busca.trim()) return list;
    const q = busca.toLowerCase();
    return list.filter(
      (a) => 
        a.area.toLowerCase().includes(q) || 
        formatarNomeArea(a.area).toLowerCase().includes(q) || 
        (a.slug && a.slug.toLowerCase().includes(q))
    );
  }, [areas, abaAtiva, favoritos, busca]);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Praticar Flashcards | Vade Mecum PRIME';
  }, []);

  return (
    <div className="min-h-dvh relative overflow-x-hidden bg-[#0e0805] text-[#fef3c7] pb-[calc(3.5rem+var(--sai-bottom,0px))] select-none">
      {/* ── Fundo da Grécia Antiga com Filósofos Suavemente Ofuscado (Pouquinho Só) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#1c120c]">
        <img
          src={greciaFilosofosFundo}
          alt="Grécia Antiga, Filósofos e Templo Clássico"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top opacity-92 select-none pointer-events-none filter blur-[1.8px] brightness-[0.95] contrast-[1.06]"
        />
        {/* Vinheta leve nas extremidades preservando a imagem equilibrada e nítida */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Símbolos Jurídicos Sagrados caindo suavemente ao fundo */}
      <FallingLotusPetals />

      <div className="relative z-10 mx-auto w-full max-w-lg sm:max-w-xl lg:max-w-3xl px-3.5 sm:px-6 pt-3 pb-12 box-border">
        {/* ── Top Bar com Botão Voltar Circular Helênico ───────────────── */}
        <div className="flex items-center justify-between mb-2 pt-1">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              navigate('/');
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/60 border border-[#78350f]/60 text-[#fef3c7] hover:border-[#f59e0b] hover:bg-black/80 transition-all cursor-pointer shadow-lg"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-[#fef3c7] stroke-[2.4]" />
          </button>
        </div>

        {/* ── Título Imperial da Página: [ Quantidade Total em Fundo Preto ] Flashcards ── */}
        <div className="text-center mb-5 px-2">
          <h1 className="inline-flex items-center justify-center gap-2.5 flex-wrap">
            <span 
              className="px-2.5 py-1 rounded-xl text-xs sm:text-sm font-mono font-black text-[#fde047] border shadow-inner tracking-wider"
              style={{
                background: 'rgba(0, 0, 0, 0.65)',
                borderColor: 'rgba(217, 119, 6, 0.55)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {totalCardsGeral > 0 ? totalCardsGeral.toLocaleString('pt-BR') : '78.077'}
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-[#fef3c7] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Flashcards
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-serif italic text-[#fef3c7]/75 mt-1.5">
            Escolha filtros por matéria, assunto e tipo para praticar
          </p>
        </div>

        <div className="space-y-5">
          {/* ── Card "Filtro Rápido" (Pergaminho em Mármore Helênico com Louros) ── */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              try { haptic.selection(); } catch {}
              setFiltroAberto(true);
            }}
            className="w-full relative flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer text-left overflow-hidden shadow-2xl transition-all border border-[#d97706]/70 group"
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fef08a 35%, #fde68a 70%, #fef3c7 100%)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.7), 0 0 20px rgba(245, 158, 11, 0.3), inset 0 2px 4px rgba(255,255,255,0.9)',
            }}
          >
            {/* Louros Esculpidos no Canto Esquerdo */}
            <div className="absolute left-1.5 inset-y-0 flex items-center pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
              <MiniLaurel />
            </div>

            {/* Conteúdo Central */}
            <div className="flex items-center gap-3.5 sm:gap-4 pl-4 sm:pl-5 min-w-0 flex-1">
              {/* Ícone de Filtro Estilizado em Bronze */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#78350f]/15 border border-[#78350f]/30 flex items-center justify-center shrink-0">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-[#78350f] stroke-[2.2]" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-serif font-black text-[#451a03] leading-tight flex items-center gap-2">
                  <span>Filtro Rápido</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-[#78350f]/85 font-serif italic mt-0.5">
                  Encontre o que deseja revisar...
                </p>
              </div>
            </div>

            {/* Chevron e Louros do Canto Direito */}
            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              <ChevronRight className="w-5 h-5 text-[#78350f] stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              <div className="opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none">
                <MiniLaurel flip />
              </div>
            </div>
          </motion.button>

          {/* ── Seção "Atalhos" (4 Blocos Esculpidos em Bronze com Louros) ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              <MiniLaurel />
              <p className="text-xs sm:text-sm font-serif font-bold tracking-widest text-[#fde047] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Atalhos
              </p>
              <MiniLaurel flip />
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {ATALHOS_FLASHCARDS.map((a) => {
                const IconComponent = a.icon;
                return (
                  <motion.button
                    key={a.id}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      navigate(a.route);
                    }}
                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all text-center group cursor-pointer shadow-lg min-w-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(38, 25, 16, 0.92) 0%, rgba(20, 13, 8, 0.95) 100%)',
                      borderColor: 'rgba(217, 119, 6, 0.45)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 2px rgba(254, 240, 138, 0.15)',
                    }}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1 text-[#fde047] group-hover:scale-110 transition-transform">
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-serif font-bold text-[#fef3c7] leading-tight text-center w-full whitespace-nowrap overflow-hidden text-ellipsis">
                      {a.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Seção "Matérias" (Título, Busca, Menu de Alternância e Lista Unificada) ── */}
          <section className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <MiniLaurel />
              <p className="text-xs sm:text-sm font-serif font-bold tracking-widest text-[#fde047] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Matérias ({areas.length})
              </p>
            </div>

            {/* Barra de Pesquisa Rápida */}
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-[#f59e0b]">
                <Search className="w-4 h-4 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar matéria de flashcards (ex: Penal)"
                className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-2xl text-sm text-[#fef3c7] placeholder:text-[#fef3c7]/45 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]/50 transition-all shadow-inner"
                style={{
                  background: 'rgba(26, 17, 11, 0.88)',
                  border: '1px solid rgba(217, 119, 6, 0.45)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                }}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer z-10"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Menu de Alternância (Matérias, Recentes, Favoritos) - Sem números, 100% responsivo e elegante */}
            <div 
              className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border backdrop-blur-md w-full"
              style={{
                background: 'rgba(24, 16, 10, 0.88)',
                borderColor: 'rgba(180, 83, 9, 0.45)',
              }}
            >
              {[
                { id: 'materias', label: 'Matérias', icon: Landmark },
                { id: 'recentes', label: 'Recentes', icon: RotateCcw },
                { id: 'favoritos', label: 'Favoritos', icon: Heart },
              ].map((tab) => {
                const isActive = abaAtiva === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setAbaAtiva(tab.id as any);
                    }}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderColor: '#d97706',
                      color: '#451a03',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(245, 158, 11, 0.3)',
                    } : {
                      color: '#fef3c7',
                    }}
                    className={cn(
                      "w-full py-2.5 px-2 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border min-w-0",
                      isActive
                        ? "border-[#d97706] font-black"
                        : "border-transparent text-[#fef3c7]/80 hover:bg-[#352014]/60 hover:text-white"
                    )}
                  >
                    <TabIcon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[#451a03]" : "text-[#f59e0b]")} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Lista com Fundo Único Compartilhado e Divisão por Linha Fina Elegante */}
            {areasFiltradas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#1c120c]/80 border border-[#78350f]/40 text-[#fef3c7]/60 text-xs font-serif">
                {abaAtiva === 'favoritos'
                  ? 'Nenhuma matéria favoritada ainda. Abra a matéria e toque no coração para favoritar!'
                  : `Nenhuma matéria encontrada para "${busca}".`}
              </div>
            ) : (
              <div 
                className="rounded-3xl border backdrop-blur-md overflow-hidden divide-y divide-[#78350f]/35 shadow-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(28, 18, 12, 0.92) 0%, rgba(18, 11, 7, 0.96) 100%)',
                  borderColor: 'rgba(180, 83, 9, 0.45)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}
              >
                {areasFiltradas.map((area) => {
                  const iconInfo = areaIconFor(area.slug || area.area);
                  const AreaIcon = iconInfo?.Icon || BookOpen;
                  const iconColor = iconInfo?.color || '#f59e0b';
                  const pctArea = area.total_cards > 0 ? Math.round((area.compreendidos / area.total_cards) * 100) : 0;
                  const radius = 14;
                  const circumference = 2 * Math.PI * radius;
                  const strokeOffset = circumference - (circumference * Math.min(100, Math.max(0, pctArea))) / 100;
                  const isFav = favoritos.includes(area.slug || area.area);

                  return (
                    <button
                      key={area.slug || area.area}
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setAreaSelecionadaModal(area);
                      }}
                      className="group relative w-full flex items-center justify-between py-4 sm:py-5 px-3.5 sm:px-5 hover:bg-[#382315]/40 transition-colors text-left focus-visible:outline-none cursor-pointer"
                    >
                      {/* Lado Esquerdo: Ícone da Matéria (Sem fundo de cor atrás) e Textos */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                        {/* Ícone da Matéria grande e direto com a cor temática */}
                        <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                          <AreaIcon
                            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200"
                            style={{ color: iconColor }}
                            strokeWidth={1.8}
                          />
                        </div>

                        {/* Detalhes da Matéria - Tipografia Clássica sem Abreviações (sem prefixo "Direito") */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-serif font-black text-[#fef3c7] leading-snug group-hover:text-[#fde047] transition-colors break-words line-clamp-2">
                            {formatarNomeArea(area.area)}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] sm:text-xs font-serif text-[#fef3c7]/75 shrink-0">
                              {area.total_cards > 0 ? `${area.total_cards.toLocaleString('pt-BR')} cards` : 'Em breve'}
                            </span>
                            {isFav && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 shrink-0">
                                • <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Barra de Progresso Circular (Zero=Neutro, 1-40=Vermelho, 41-69=Amarelo, 70-100=Verde) e Chevron */}
                      <div className="shrink-0 flex items-center gap-2.5 pl-2">
                        {(() => {
                          const progColor = getProgressColor(pctArea);
                          return (
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                                {/* Trilho circular escuro */}
                                <circle
                                  cx="18"
                                  cy="18"
                                  r={radius}
                                  fill="none"
                                  stroke="rgba(45, 30, 20, 0.85)"
                                  strokeWidth="3.2"
                                />
                                {/* Anel de progresso com cor estrita por faixa */}
                                <circle
                                  cx="18"
                                  cy="18"
                                  r={radius}
                                  fill="none"
                                  stroke={progColor.stroke}
                                  strokeWidth="3.2"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeOffset}
                                  strokeLinecap="round"
                                  style={{
                                    filter: progColor.glow,
                                    transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                                  }}
                                />
                              </svg>

                              {/* Valor da porcentagem no centro do círculo */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span 
                                  className="text-[10px] sm:text-[10.5px] font-mono font-bold"
                                  style={{ color: progColor.text }}
                                >
                                  {pctArea}%
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Chevron de navegação */}
                        <div className="w-5 h-5 flex items-center justify-center text-[#fef3c7]/40 group-hover:text-[#fde047] group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Modal Flutuante: Opções da Matéria (Filtrar vs Trilhas) ── */}
      <AnimatePresence>
        {areaSelecionadaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAreaSelecionadaModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 overflow-hidden border"
              style={{
                background: 'linear-gradient(135deg, rgba(32, 22, 14, 0.98) 0%, rgba(18, 12, 8, 0.98) 100%)',
                borderColor: 'rgba(217, 119, 6, 0.6)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.9), 0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              <button
                type="button"
                onClick={() => setAreaSelecionadaModal(null)}
                className="absolute top-4 right-4 p-2 text-[#fef3c7]/60 hover:text-white rounded-full bg-black/40 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(45, 30, 20, 0.95) 0%, rgba(20, 13, 8, 0.95) 100%)',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                  }}
                >
                  {(() => {
                    const AreaIcon = areaIconFor(areaSelecionadaModal.slug || areaSelecionadaModal.area)?.Icon || BookOpen;
                    return <AreaIcon className="w-7 h-7 text-[#fde047]" strokeWidth={1.8} />;
                  })()}
                </div>
                <h3 className="text-lg font-serif font-black text-[#fef3c7] leading-snug px-2">
                  {areaSelecionadaModal.area}
                </h3>
                <p className="text-xs text-[#fef3c7]/70 font-serif italic mt-1">
                  {areaSelecionadaModal.total_cards > 0 ? `${areaSelecionadaModal.total_cards.toLocaleString('pt-BR')} flashcards disponíveis` : 'Matéria'}
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const areaNome = areaSelecionadaModal.area;
                    setAreaSelecionadaModal(null);
                    setFiltroDisciplinaPrevia(areaNome);
                    setFiltroPassoPrevio('assuntos');
                    setFiltroAberto(true);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#2a1b12] hover:bg-[#382417] border border-[#78350f]/60 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#fde047] group-hover:scale-105 transition-transform">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-serif font-bold text-[#fef3c7] group-hover:text-[#fde047] transition-colors">
                        Filtrar Assuntos
                      </p>
                      <p className="text-[11px] text-[#fef3c7]/65">
                        Escolha temas, tipos e quantidade
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#fef3c7]/50 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const slug = areaSelecionadaModal.slug || areaSelecionadaModal.area;
                    setAreaSelecionadaModal(null);
                    navigate(`/flashcards/area/${slug}`);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all group cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(45, 30, 20, 0.95) 0%, rgba(28, 18, 12, 0.95) 100%)',
                    borderColor: 'rgba(217, 119, 6, 0.6)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#fde047] group-hover:scale-105 transition-transform">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-serif font-bold text-[#fef3c7] group-hover:text-[#fde047] transition-colors">
                        Trilhas de Estudo
                      </p>
                      <p className="text-[11px] text-[#fef3c7]/65">
                        Avançar pelos decks temáticos na montanha
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#fef3c7]/50 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Filtro Rápido (Sheet Oficial de Seleção) ── */}
      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(filtro: FlashcardsFiltro) => {
          setFiltroAberto(false);
          const params = new URLSearchParams();
          if (filtro.disciplinas && filtro.disciplinas.length > 0) params.set('disciplinas', filtro.disciplinas.join(','));
          if (filtro.assuntos && filtro.assuntos.length > 0) params.set('assuntos', filtro.assuntos.join(','));
          if (filtro.tipos && filtro.tipos.length > 0) params.set('tipos', filtro.tipos.join(','));
          if (filtro.status && filtro.status.length > 0) params.set('status', filtro.status.join(','));
          if (filtro.quantidade && filtro.quantidade > 0) params.set('quantidade', filtro.quantidade.toString());
          navigate(`/flashcards/estudo?${params.toString()}`);
        }}
        disciplinaInicial={filtroDisciplinaPrevia}
        passoInicial={filtroPassoPrevio}
      />
    </div>
  );
};

export default Flashcards;
