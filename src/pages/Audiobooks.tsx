import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Headphones,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  Layers,
  ChevronRight,
  Info,
  X,
  Volume2,
  LayoutList,
  LayoutGrid,
  Bookmark
} from 'lucide-react';
import { toast } from 'sonner';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro
} from '@/data/audiobooksCatalogo';
import { AudiobookPlayerModal } from '@/components/audiobooks/AudiobookPlayerModal';

export default function AudiobooksPage() {
  const navigate = useNavigate();

  // Livro ativo no Hero
  const [livroAtivo, setLivroAtivo] = useState<AudiobookLivro>(O_CASO_DOS_EXPLORADORES_DE_CAVERNAS);

  // Modal do Player
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedCapituloIndex, setSelectedCapituloIndex] = useState(0);

  // Modal de Detalhes "Em Breve"
  const [livroEmBreveModal, setLivroEmBreveModal] = useState<AudiobookLivro | null>(null);

  // Modo de visualização do catálogo: Lista (Padrão Biblioteca) vs Grade (Capas)
  const [visualizacao, setVisualizacao] = useState<'lista' | 'grade'>('lista');

  // Lembretes de notificação salvos em localStorage
  const [notificados, setNotificados] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('audiobooks_notificacoes');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Busca e Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'disponivel' | 'em_breve'>('todos');

  // Ref da seção do Hero para scroll suave
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Recupera onde o usuário parou em O Caso dos Exploradores de Cavernas
  const storageKey = `audiobook_prog_${O_CASO_DOS_EXPLORADORES_DE_CAVERNAS.id}`;
  const [progressoSalvo, setProgressoSalvo] = useState<{ capituloIndex: number; time: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setProgressoSalvo(JSON.parse(raw));
      }
    } catch {}
  }, [storageKey, playerOpen]);

  const abrirCapitulo = useCallback((index: number) => {
    haptic.selection();
    setSelectedCapituloIndex(index);
    setPlayerOpen(true);
  }, []);

  const iniciarOuContinuar = useCallback(() => {
    haptic.impact();
    const idx = progressoSalvo?.capituloIndex || 0;
    setSelectedCapituloIndex(idx);
    setPlayerOpen(true);
  }, [progressoSalvo]);

  // Alterna notificação do usuário para obras "Em Breve"
  const toggleNotificacao = useCallback((livroId: string, titulo: string) => {
    haptic.impact();
    setNotificados((prev) => {
      const novoEstado = !prev[livroId];
      const atualizado = { ...prev, [livroId]: novoEstado };
      try {
        localStorage.setItem('audiobooks_notificacoes', JSON.stringify(atualizado));
      } catch {}

      if (novoEstado) {
        toast.success(`Notificação ativada para "${titulo}"! Você será avisado no lançamento.`);
      } else {
        toast.info(`Notificação cancelada para "${titulo}".`);
      }

      return atualizado;
    });
  }, []);

  // Lista filtrada do catálogo completo
  const livrosFiltrados = useMemo(() => {
    return AUDIOBOOKS_CATALOGO.filter((livro) => {
      // Filtro de Status
      if (filtroStatus === 'disponivel' && livro.status !== 'disponivel') return false;
      if (filtroStatus === 'em_breve' && livro.status !== 'em_breve') return false;

      // Filtro de Busca por Título ou Autor
      if (termoBusca.trim()) {
        const query = termoBusca.toLowerCase().trim();
        const matchTitulo = livro.titulo.toLowerCase().includes(query);
        const matchAutor = livro.autor.toLowerCase().includes(query);
        if (!matchTitulo && !matchAutor) return false;
      }

      return true;
    });
  }, [filtroStatus, termoBusca]);

  // Contadores para as abas
  const totalCount = AUDIOBOOKS_CATALOGO.length;
  const disponivelCount = useMemo(() => AUDIOBOOKS_CATALOGO.filter((l) => l.status === 'disponivel').length, []);
  const emBreveCount = useMemo(() => AUDIOBOOKS_CATALOGO.filter((l) => l.status === 'em_breve').length, []);

  const handleCardClick = (livro: AudiobookLivro) => {
    haptic.selection();
    if (livro.status === 'disponivel') {
      setLivroAtivo(livro);
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setLivroEmBreveModal(livro);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-[calc(1rem+var(--sai-top,0px))]">
        {/* Header Superior com Botão de Voltar Padrão Premium */}
        <header className="flex items-center justify-between pb-4 border-b border-white/5">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              navigate(-1);
            }}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E11D48] flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              Direito Prime Audiobooks
            </span>
            <h1 className="font-display font-bold text-lg sm:text-xl text-white">
              Audiobooks Clássicos
            </h1>
          </div>

          <div className="w-12 sm:w-[52px]" />
        </header>

        {/* Hero Card do Livro em Destaque */}
        <div ref={heroRef}>
          <section className="mt-6 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1C1C20] via-[#161619] to-[#101012] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
              {/* Capa do Livro em Destaque */}
              <div className="w-44 sm:w-52 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-950 aspect-[3/4] relative group">
                <img
                  src={livroAtivo.capaUrl}
                  alt={livroAtivo.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#E11D48]" />
                    Edição Especial
                  </span>
                </div>
              </div>

              {/* Metadados e Sinopse */}
              <div className="flex-1 flex flex-col justify-between text-center md:text-left">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/15 border border-[#E11D48]/30 text-[#E11D48] text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3" />
                    Obra Prima da Filosofia do Direito
                  </div>

                  <h2 className="font-serif italic text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {livroAtivo.titulo}
                  </h2>

                  <p className="text-white/60 text-sm mt-1 font-medium">
                    Por <span className="text-white font-semibold">{livroAtivo.autor}</span> {livroAtivo.ano && `(${livroAtivo.ano})`}
                  </p>

                  <p className="text-white/80 text-xs sm:text-sm mt-3 leading-relaxed line-clamp-3 md:line-clamp-none">
                    {livroAtivo.descricao}
                  </p>
                </div>

                {/* Informações de Duração e Capítulos */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5 pt-4 border-t border-white/10 text-xs text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#E11D48]" />
                    <span>{livroAtivo.totalCapitulos} Capítulos</span>
                  </div>
                  {livroAtivo.duracaoTotalFormatada && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#E11D48]" />
                      <span>Duração: {livroAtivo.duracaoTotalFormatada}</span>
                    </div>
                  )}
                </div>

                {/* Botão de Ação Primária */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={iniciarOuContinuar}
                    className="flex-1 min-h-[48px] px-6 py-3 rounded-2xl bg-[#E11D48] hover:bg-[#E11D48]/90 active:scale-95 text-white font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-[#E11D48]/25 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {progressoSalvo
                        ? `Continuar Capítulo ${progressoSalvo.capituloIndex + 1}`
                        : 'Começar Audiobook'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Sinopse da Obra em Destaque */}
          {livroAtivo.sinopse && (
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
              <p className="text-xs text-white/70 leading-relaxed">
                {livroAtivo.sinopse}
              </p>
            </div>
          )}

          {/* Lista de Capítulos do Livro Ativo */}
          {livroAtivo.capitulos && livroAtivo.capitulos.length > 0 && (
            <section className="mt-8 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                  Capítulos Gravados ({livroAtivo.totalCapitulos})
                </h3>
                <span className="text-xs text-white/50">Toque para reproduzir</span>
              </div>

              <div className="space-y-2.5">
                {livroAtivo.capitulos.map((cap, index) => {
                  const isCurrent = progressoSalvo?.capituloIndex === index;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => abrirCapitulo(index)}
                      className={`w-full flex items-center gap-3.5 p-4 rounded-2xl text-left border transition-all active:scale-[0.99] group cursor-pointer ${
                        isCurrent
                          ? 'bg-[#E11D48]/15 border-[#E11D48]/35 shadow-lg'
                          : 'bg-[#18181B] hover:bg-[#202024] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Círculo do número do capítulo */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm transition-transform group-hover:scale-105 ${
                          isCurrent
                            ? 'bg-[#E11D48] text-white shadow-md'
                            : 'bg-white/10 text-white/80 group-hover:bg-[#E11D48] group-hover:text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </div>

                      {/* Informações do Capítulo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E11D48]">
                            Capítulo {cap.numero}
                          </span>
                          <span className="text-[10px] text-white/40">•</span>
                          <span className="text-[10px] text-white/50 truncate">{cap.autor}</span>
                        </div>

                        <h4 className="font-display font-bold text-[15px] sm:text-[16px] text-white truncate mt-0.5 group-hover:text-[#E11D48] transition-colors">
                          {cap.titulo}
                        </h4>

                        <p className="text-xs text-white/60 truncate mt-0.5 font-sans">
                          {cap.descricao}
                        </p>
                      </div>

                      {/* Duração formatada e seta */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="font-mono text-xs text-white/50">
                          {cap.duracaoFormatada}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ======================================================== */}
        {/* SEÇÃO DO ACERVO NO FORMATO PADRÃO DA BIBLIOTECA         */}
        {/* ======================================================== */}
        <section className="mt-14 pt-8 border-t border-white/10">
          {/* Header da Seção Idêntico à Biblioteca */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#E11D48] font-bold">
              ACERVO DE AUDIOBOOKS
            </p>
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-[#E11D48]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Todos os livros
                </h2>
              </div>

              {/* Botões de Alternância: Lista (Biblioteca) vs Grade */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setVisualizacao('lista');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    visualizacao === 'lista'
                      ? 'bg-[#E11D48] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="Visualização em Lista"
                  title="Modo Lista (Padrão Biblioteca)"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setVisualizacao('grade');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    visualizacao === 'grade'
                      ? 'bg-[#E11D48] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="Visualização em Grade"
                  title="Modo Grade"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-white/60 mt-1 ml-3">
              Toque em um livro para ouvir o audiobook ou ser avisado assim que o áudio for lançado.
            </p>
          </div>

          {/* Campo de Busca Rápida Idêntico à Biblioteca */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar livro, autor ou tema…"
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#E11D48]/60 transition-colors shadow-sm"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas de Filtro de Status */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus('todos');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                filtroStatus === 'todos'
                  ? 'bg-[#E11D48] border-[#E11D48] text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus('disponivel');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === 'disponivel'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Disponível ({disponivelCount})
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus('em_breve');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === 'em_breve'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-300" />
              Em Breve ({emBreveCount})
            </button>
          </div>

          {/* Listagem de Livros */}
          {livrosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-sm bg-white/[0.02] border border-white/5 rounded-3xl">
              Nenhum livro encontrado com o termo informado.
            </div>
          ) : visualizacao === 'lista' ? (
            /* ======================================================== */
            /* MODO LISTA: DESIGN IDÊNTICO AO DA BIBLIOTECA DO APP     */
            /* ======================================================== */
            <div className="flex flex-col gap-2.5">
              {livrosFiltrados.map((livro, index) => {
                const isDisponivel = livro.status === 'disponivel';
                const isNotificado = notificados[livro.id];
                const pct = isDisponivel && progressoSalvo ? Math.round(((progressoSalvo.capituloIndex + 1) / 8) * 100) : 0;

                return (
                  <motion.button
                    key={livro.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.03, 0.3),
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleCardClick(livro)}
                    aria-label={`Abrir audiobook ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ''}`}
                    className="group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/10 hover:border-[#E11D48]/40 transition-colors text-left w-full relative overflow-hidden shadow-sm cursor-pointer select-none"
                  >
                    {/* Capa Retangular à Esquerda (Padrão 72px x 100px) */}
                    <div className="w-[72px] sm:w-[80px] h-[100px] sm:h-[110px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-md relative">
                      <img
                        src={livro.capaUrl}
                        alt={`Capa do livro: ${livro.titulo}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Selo no topo da capinha */}
                      <div className="absolute top-1 left-1">
                        {isDisponivel ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-md animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400/80 block shadow-md" />
                        )}
                      </div>
                    </div>

                    {/* Informações Centrais da Obra */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                      <p className="text-[14px] sm:text-[15.5px] font-bold text-white line-clamp-2 leading-snug group-hover:text-[#E11D48] transition-colors break-words">
                        {livro.titulo}
                      </p>

                      <p className="mt-1 text-[11px] sm:text-[12px] text-white/50 line-clamp-1">
                        {livro.autor} {livro.ano && `• ${livro.ano}`}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {/* Tag de Coleção */}
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-bold border border-white/10">
                          {livro.tags?.[0] || 'CLÁSSICO'}
                        </span>

                        {/* Status: Disponível vs Em Breve */}
                        {isDisponivel ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Headphones className="w-2.5 h-2.5" />
                            8 Capítulos Gravados
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5 text-amber-300" />
                            Em Breve
                          </span>
                        )}

                        {isNotificado && !isDisponivel && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#E11D48]/15 text-[#E11D48] border border-[#E11D48]/30">
                            <Bell className="w-2.5 h-2.5 fill-current" />
                            Aviso Ativo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação à Direita (Padrão Biblioteca) */}
                    <div className="flex flex-col items-center justify-center pl-2 pr-1 shrink-0">
                      {isDisponivel ? (
                        <span className="text-[11px] uppercase tracking-wide font-bold text-white px-3.5 py-1.5 rounded-full bg-[#E11D48] hover:bg-[#E11D48]/90 transition-colors shadow-md shadow-[#E11D48]/20 flex items-center gap-1">
                          <Play className="w-3 h-3 fill-white" />
                          Ouvir
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-white/70 px-3 py-1.5 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Em breve
                        </span>
                      )}
                    </div>

                    {/* Barra de progresso na base se houver */}
                    {pct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                        <div
                          className="h-full bg-[#E11D48] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* MODO GRADE: VISUALIZAÇÃO POR CAPAS                      */
            /* ======================================================== */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {livrosFiltrados.map((livro) => {
                const isDisponivel = livro.status === 'disponivel';
                const isNotificado = notificados[livro.id];

                return (
                  <motion.div
                    key={livro.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCardClick(livro)}
                    className="group relative flex flex-col bg-[#141416] hover:bg-[#1C1C20] border border-white/10 hover:border-[#E11D48]/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer select-none"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={livro.capaUrl}
                        alt={livro.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent opacity-80" />

                      <div className="absolute top-2 left-2 z-10">
                        {isDisponivel ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            Disponível
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/30 text-amber-300 text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-md">
                            <Clock className="w-2.5 h-2.5" />
                            Em Breve
                          </span>
                        )}
                      </div>

                      {isNotificado && !isDisponivel && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-md">
                          <Bell className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-[#E11D48] transition-colors line-clamp-2 leading-snug">
                          {livro.titulo}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate mt-1">
                          {livro.autor} {livro.ano && `• ${livro.ano}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        {isDisponivel ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {livro.totalCapitulos} Capítulos
                          </span>
                        ) : (
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400/80" />
                            Em Produção
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL DETALHADO DO LIVRO EM BREVE                        */}
      {/* ======================================================== */}
      <AnimatePresence>
        {livroEmBreveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#141416] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
            >
              {/* Botão de Fechar */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setLivroEmBreveModal(null);
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-1 space-y-5">
                {/* Header do Modal com Capa e Título */}
                <div className="flex gap-4 items-start">
                  <div className="w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-950 aspect-[3/4] border border-white/10 shadow-lg">
                    <img
                      src={livroEmBreveModal.capaUrl}
                      alt={livroEmBreveModal.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <Clock className="w-3 h-3" />
                      Audiobook em Breve
                    </div>
                    <h3 className="font-serif italic font-bold text-lg sm:text-xl text-white leading-tight">
                      {livroEmBreveModal.titulo}
                    </h3>
                    <p className="text-white/60 text-xs mt-1">
                      Por <span className="text-white font-medium">{livroEmBreveModal.autor}</span>
                      {livroEmBreveModal.ano && ` (${livroEmBreveModal.ano})`}
                    </p>
                  </div>
                </div>

                {/* Card Informativo sobre a Produção */}
                <div className="p-4 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/25 flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                  <div className="text-xs text-white/80 leading-relaxed space-y-1">
                    <p className="font-bold text-white">Audiobook em Fase de Gravação</p>
                    <p className="text-white/70">
                      Nossos audiobooks contam com narração profissional imersiva em estúdio, trilha orquestrada, divisão em capítulos e legendas sincronizadas para estudo ativo.
                    </p>
                  </div>
                </div>

                {/* Sinopse da Obra */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Sobre a Obra
                  </h4>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl">
                    {livroEmBreveModal.sinopse || livroEmBreveModal.descricao}
                  </p>
                </div>

                {/* Ações: Notificar no Lançamento + Ler na Biblioteca */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleNotificacao(livroEmBreveModal.id, livroEmBreveModal.titulo)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      notificados[livroEmBreveModal.id]
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-[#E11D48] hover:bg-[#E11D48]/90 text-white shadow-lg shadow-[#E11D48]/25'
                    }`}
                  >
                    {notificados[livroEmBreveModal.id] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Notificação Ativada (Você será avisado)</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        <span>Quero Ser Avisado no Lançamento</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setLivroEmBreveModal(null);
                      navigate('/bibliotecas/classicos');
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-98 text-white/80 hover:text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-white/60" />
                    <span>Ler Obra em Texto na Biblioteca</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Player em Tela Cheia para o Livro Disponível */}
      <AudiobookPlayerModal
        livro={livroAtivo}
        capituloInicialIndex={selectedCapituloIndex}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </div>
  );
}
