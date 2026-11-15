import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Play, ArrowRight,
  ChevronRight, Sparkles, BookOpen, 
  X, Bookmark, Clock, CheckCircle2, Headphones
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import penalCover from '@/assets/covers/cp_artigos_v2.webp';
import modulesData from '@/data/pilulasDireitoPenalCatalog.json';

interface TopicoItem {
  id: string;
  baseSlug: string;
  titulo: string;
  audioUrl: string | null;
  srtUrl: string | null;
  pdfUrl: string | null;
  roteiroUrl: string | null;
  driveMp3Id: string | null;
  driveSrtId: string | null;
  drivePdfId: string | null;
  driveTxtId: string | null;
}

interface ModuloItem {
  id: string;
  folderIndex: number;
  titulo: string;
  folderName: string;
  slug: string;
  totalTopicos: number;
  topicos: TopicoItem[];
}

type AbaTipo = 'materias' | 'favoritos' | 'recentes';

export default function PilulasDireitoPenal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduloParam = searchParams.get('modulo');

  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('materias');

  // Estados persistidos de progresso, favoritos e recentes
  const [ouvidos, setOuvidos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pilulas_penal_concluidos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pilulas_penal_favoritos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentes, setRecentes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pilulas_penal_recentes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const modules = modulesData as ModuloItem[];

  // Módulo ativo quando o usuário clica para abrir a tela de lista de tópicos
  const moduloAtivo = useMemo(() => {
    if (!moduloParam) return null;
    return modules.find(m => m.id === moduloParam || m.slug === moduloParam || m.folderName === moduloParam) || null;
  }, [modules, moduloParam]);

  // Mapa plano de todos os tópicos para consultas rápidas
  const todosTopicosMap = useMemo(() => {
    const map = new Map<string, { topico: TopicoItem; modulo: ModuloItem }>();
    for (const m of modules) {
      for (const t of m.topicos) {
        map.set(t.id, { topico: t, modulo: m });
      }
    }
    return map;
  }, [modules]);

  const totalAudios = useMemo(() => {
    return modules.reduce((acc, m) => acc + m.topicos.filter(t => t.audioUrl || t.driveMp3Id).length, 0);
  }, [modules]);

  // Porcentagem geral ouvida
  const porcentagemGeral = useMemo(() => {
    if (totalAudios === 0) return 0;
    return Math.min(100, Math.round((ouvidos.length / totalAudios) * 100));
  }, [ouvidos.length, totalAudios]);

  // Alternar favorito
  const toggleFavorito = useCallback((topicoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    setFavoritos(prev => {
      const next = prev.includes(topicoId) ? prev.filter(id => id !== topicoId) : [...prev, topicoId];
      try {
        localStorage.setItem('pilulas_penal_favoritos', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Abrir o Player Dedicado em uma nova tela e registrar em recentes
  const handleAbrirPlayer = useCallback((topico: TopicoItem) => {
    haptic.selection();
    setRecentes(prev => {
      const next = [topico.id, ...prev.filter(id => id !== topico.id)].slice(0, 30);
      try {
        localStorage.setItem('pilulas_penal_recentes', JSON.stringify(next));
      } catch {}
      return next;
    });
    navigate(`/pilulas/penal/player/${topico.id}`);
  }, [navigate]);

  // Busca e filtragem de módulos
  const modulosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return modules;

    return modules
      .map(m => {
        const moduloMatch = m.titulo.toLowerCase().includes(termo);
        const topicosFiltrados = m.topicos.filter(t => 
          t.titulo.toLowerCase().includes(termo) || t.baseSlug.toLowerCase().includes(termo)
        );

        if (moduloMatch) return m;
        if (topicosFiltrados.length > 0) {
          return { ...m, topicos: topicosFiltrados };
        }
        return null;
      })
      .filter(Boolean) as ModuloItem[];
  }, [modules, busca]);

  // Tópicos filtrados dentro do módulo ativo
  const topicosModuloFiltrados = useMemo(() => {
    if (!moduloAtivo) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return moduloAtivo.topicos;
    return moduloAtivo.topicos.filter(t => 
      t.titulo.toLowerCase().includes(termo) || t.baseSlug.toLowerCase().includes(termo)
    );
  }, [moduloAtivo, busca]);

  // Lista de tópicos favoritos
  const topicosFavoritos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return favoritos
      .map(id => todosTopicosMap.get(id))
      .filter(Boolean)
      .filter(item => {
        if (!termo) return true;
        return item!.topico.titulo.toLowerCase().includes(termo) || item!.modulo.titulo.toLowerCase().includes(termo);
      }) as { topico: TopicoItem; modulo: ModuloItem }[];
  }, [favoritos, todosTopicosMap, busca]);

  // Lista de tópicos recentes
  const topicosRecentes = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return recentes
      .map(id => todosTopicosMap.get(id))
      .filter(Boolean)
      .filter(item => {
        if (!termo) return true;
        return item!.topico.titulo.toLowerCase().includes(termo) || item!.modulo.titulo.toLowerCase().includes(termo);
      }) as { topico: TopicoItem; modulo: ModuloItem }[];
  }, [recentes, todosTopicosMap, busca]);

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-28 text-white relative overflow-x-hidden">
      {/* Background Padrão Oficial ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.08)"
          hoverFillColor="rgba(255, 255, 255, 0.12)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* ========================================================================= */}
        {/* CASO 1: TELA DEDICADA DE LISTA DE AULAS DO MÓDULO (COM PORCENTAGEM EM CÍRCULO) */}
        {/* ========================================================================= */}
        {moduloAtivo ? (
          <div>
            {/* Header com Voltar Padrão Ouro para a Lista de Matérias */}
            <header className="pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 flex items-center justify-between gap-4 border-b border-white/5">
              <button
                onClick={() => {
                  haptic.light();
                  setSearchParams({});
                  setBusca('');
                }}
                aria-label="Voltar para a lista de matérias"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
              </button>

              <div className="flex-1 min-w-0 text-center">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-red-400 uppercase tracking-widest block font-sans">
                  MATÉRIA {moduloAtivo.folderIndex.toString().padStart(2, '0')}
                </span>
                <h1 className="text-base sm:text-lg font-bold font-sans text-white tracking-normal truncate">
                  {moduloAtivo.titulo}
                </h1>
              </div>

              <div className="w-12 sm:w-[52px] shrink-0" />
            </header>

            {/* Banner do Módulo: Capa com Círculo Minimalista de Porcentagem Dentro da Capa */}
            <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-red-950/40 via-zinc-900/70 to-black/85 border border-red-500/25 backdrop-blur-md shadow-2xl">
              {(() => {
                const ouvidosModulo = moduloAtivo.topicos.filter(t => ouvidos.includes(t.id)).length;
                const pctModulo = Math.round((ouvidosModulo / moduloAtivo.topicos.length) * 100);

                return (
                  <div className="flex items-center gap-4 sm:gap-5">
                    {/* Capa com Círculo de Porcentagem Minimalista Dentro */}
                    <div className="relative w-20 h-28 sm:w-24 sm:h-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-red-500/50 shrink-0 shadow-2xl shadow-red-950/60 bg-zinc-900">
                      <img 
                        src={penalCover} 
                        alt="Capa Direito Penal" 
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Overlay com Círculo de Porcentagem Minimalista */}
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] flex items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-white/20"
                              strokeWidth="3.2"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-amber-400"
                              strokeWidth="3.2"
                              strokeDasharray={`${pctModulo}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-[11px] font-black font-sans text-white">
                            {pctModulo}%
                          </span>
                        </div>
                      </div>

                      {/* Tag do Módulo */}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/90 text-[9px] font-black text-amber-300 font-sans">
                        #{moduloAtivo.folderIndex.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Detalhes da Matéria ao Lado da Capa */}
                    <div className="flex-1 min-w-0">
                      <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                        <span>Direito Penal</span>
                      </div>

                      <h2 className="text-base sm:text-xl font-bold font-sans text-white tracking-normal leading-snug">
                        {moduloAtivo.titulo}
                      </h2>

                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-sans font-medium">
                        {moduloAtivo.topicos.length} {moduloAtivo.topicos.length === 1 ? 'aula em áudio' : 'aulas em áudio'}
                      </p>

                      <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 mt-2 font-sans">
                        <span>{ouvidosModulo} de {moduloAtivo.topicos.length} concluídas</span>
                        {ouvidosModulo > 0 && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Em andamento
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Barra de Busca de Aulas dentro da Matéria */}
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aula nesta matéria..."
                className="w-full h-12 pl-12 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.08] transition-all font-sans"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Lista Limpa de Aulas: Sem Ficha, Somente Favoritar e Seta/Play para Abrir */}
            <div className="mt-5 space-y-2.5">
              {topicosModuloFiltrados.map((topico, idx) => {
                const isFavorito = favoritos.includes(topico.id);
                const isOuvido = ouvidos.includes(topico.id);

                return (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="group relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md hover:bg-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer active:scale-[0.99] shadow-md"
                  >
                    {/* Número e Título da Aula */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-sans border ${
                        isOuvido 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-400/40'
                      }`}>
                        {isOuvido ? '✓' : (idx + 1).toString().padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-sans font-semibold text-[14.5px] sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors leading-snug tracking-normal">
                          {topico.titulo}
                        </h3>
                        <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate font-sans">
                          Aula {(idx + 1).toString().padStart(2, '0')} • Áudio com Legenda
                        </p>
                      </div>
                    </div>

                    {/* Ações: Somente Favoritar e Seta para Abrir o Áudio */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {/* Botão Favoritar */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorito(topico.id, e)}
                        title={isFavorito ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                          isFavorito 
                            ? 'bg-amber-400/15 border-amber-400/40 text-amber-400' 
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isFavorito ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Seta para Abrir o Áudio */}
                      <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 group-hover:bg-amber-400 group-hover:text-zinc-950 flex items-center justify-center transition-all shadow-sm">
                        <ArrowRight className="w-4 h-4 stroke-[2.4] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {topicosModuloFiltrados.length === 0 && (
                <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                  <p className="text-zinc-500 font-sans text-sm">Nenhuma aula encontrada nesta matéria.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASO 2: TELA PRINCIPAL (LISTA DE 42 MATÉRIAS TEMÁTICAS)                   */
          /* ========================================================================= */
          <div>
            {/* Header Superior Fixo com Voltar Padrão Ouro */}
            <header className="pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 flex items-center justify-between gap-4 border-b border-white/5">
              <button
                onClick={() => {
                  haptic.light();
                  navigate('/pilulas');
                }}
                aria-label="Voltar para Pílulas"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
              </button>

              <div className="flex-1 min-w-0 text-center">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest truncate">
                  Direito Penal
                </h1>
                <p className="text-xs text-amber-400/90 font-medium tracking-tight">
                  Pílulas de Matérias • Áudios, Legendas & Fichas Cornell
                </p>
              </div>

              <div className="w-12 sm:w-[52px] shrink-0" />
            </header>

            {/* Banner Superior: Capa à Esquerda, Título Direito Penal e Subtítulo com Quantidade */}
            <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-red-950/40 via-zinc-900/70 to-black/85 border border-red-500/25 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3.5 sm:gap-5">
                {/* Capa alinhada à esquerda */}
                <div className="relative w-20 h-28 sm:w-24 sm:h-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-red-500/50 shrink-0 shadow-2xl shadow-red-950/60 bg-zinc-900">
                  <img 
                    src={penalCover} 
                    alt="Capa Vermelha Direito Penal" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Ao lado da capa: Direito Penal e Subtítulo com Quantidade de Matérias e Aulas */}
                <div className="flex-1 min-w-0">
                  <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                    <span>Grade Doutrinária</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black font-sans text-white tracking-normal leading-tight">
                    Direito Penal
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-sans font-medium">
                    {modules.length} matérias • {totalAudios} aulas em áudio
                  </p>
                </div>
              </div>

              {/* Barra de Progresso Geral */}
              <div className="mt-4 pt-3 border-t border-white/10 w-full">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-sans">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Progresso Geral de Estudos</span>
                  </span>
                  <span className="font-extrabold text-amber-400 text-sm">
                    {porcentagemGeral}%
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-zinc-800/80 border border-white/5 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(porcentagemGeral, 2)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5 font-sans">
                  <span>{ouvidos.length} de {totalAudios} aulas ouvidas</span>
                  {ouvidos.length > 0 && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Em andamento
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu de Alternância de Abas Responsivo (Zero Vazamento / Quebra de Número) */}
            <div className="mt-5 p-1 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md grid grid-cols-3 gap-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setAbaAtiva('materias');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer font-sans truncate ${
                  abaAtiva === 'materias'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Matérias</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                  abaAtiva === 'materias' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'
                }`}>
                  {modules.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setAbaAtiva('favoritos');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer font-sans truncate ${
                  abaAtiva === 'favoritos'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Favoritos</span>
                {favoritos.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                    abaAtiva === 'favoritos' ? 'bg-black/20 text-black font-extrabold' : 'bg-amber-400/20 text-amber-400'
                  }`}>
                    {favoritos.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setAbaAtiva('recentes');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer font-sans truncate ${
                  abaAtiva === 'recentes'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Recentes</span>
                {recentes.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                    abaAtiva === 'recentes' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {recentes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Barra de Busca de Matérias */}
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={
                  abaAtiva === 'materias'
                    ? 'Buscar matéria ou tema de Direito Penal...'
                    : abaAtiva === 'favoritos'
                    ? 'Buscar nos favoritos...'
                    : 'Buscar nos recentes...'
                }
                className="w-full h-12 pl-12 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.08] transition-all font-sans"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── ABA 1: MATÉRIAS (Cards que abrem a tela de lista de cada Matéria) ── */}
            {abaAtiva === 'materias' && (
              <div className="mt-5 space-y-3">
                {modulosFiltrados.map((modulo) => {
                  const ouvidosNoModulo = modulo.topicos.filter(t => ouvidos.includes(t.id)).length;
                  const percentModulo = Math.round((ouvidosNoModulo / modulo.topicos.length) * 100);

                  return (
                    <div 
                      key={modulo.id}
                      onClick={() => {
                        haptic.selection();
                        setSearchParams({ modulo: modulo.id });
                        setBusca('');
                      }}
                      className="group rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-900/80 shadow-md p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Capa com Índice da Matéria */}
                        <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow-md bg-zinc-900">
                          <img 
                            src={penalCover} 
                            alt="Capa Vermelha Direito Penal" 
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8.5px] font-black text-amber-300 leading-none shadow font-sans">
                            {modulo.folderIndex.toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Informações da Matéria com Tipografia Moderna e Legível */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-sans font-bold text-[15px] sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors tracking-normal leading-snug line-clamp-1">
                            {modulo.titulo}
                          </h3>

                          <p className="text-[11.5px] text-zinc-400 mt-0.5 font-sans">
                            {modulo.topicos.length} {modulo.topicos.length === 1 ? 'aula em áudio' : 'aulas em áudio'}
                          </p>

                          {/* Barra de Progresso da Matéria */}
                          <div className="mt-2 w-full max-w-sm">
                            <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-1 font-sans">
                              <span>{ouvidosNoModulo} de {modulo.topicos.length} ouvidas</span>
                              <span className="font-bold text-amber-400">{percentModulo}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                                style={{ width: `${percentModulo}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seta indicando navegação para a tela de lista da matéria */}
                      <div className="shrink-0 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all pl-2">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}

                {modulosFiltrados.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                    <p className="text-zinc-500 font-sans text-sm">Nenhuma matéria encontrada com esse termo.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ABA 2: FAVORITOS ── */}
            {abaAtiva === 'favoritos' && (
              <div className="mt-5 space-y-2.5">
                {topicosFavoritos.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                    <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white font-sans">Nenhum favorito salvo ainda</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-sans">
                      Toque no ícone de marcador nas aulas de Direito Penal para salvá-las aqui e estudar quando quiser.
                    </p>
                  </div>
                ) : (
                  topicosFavoritos.map(({ topico, modulo }) => {
                    return (
                      <div
                        key={topico.id}
                        onClick={() => handleAbrirPlayer(topico)}
                        className="group relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md hover:border-amber-400/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-11 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow bg-zinc-900">
                            <img src={penalCover} alt="Capa" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8px] font-black text-amber-300 font-sans">
                              {modulo.folderIndex.toString().padStart(2, '0')}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-bold font-sans text-white group-hover:text-amber-300 transition-colors leading-snug tracking-normal">
                              {topico.titulo}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate font-sans">
                              Matéria {modulo.folderIndex}: {modulo.titulo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorito(topico.id, e)}
                            className="w-9 h-9 rounded-xl border bg-amber-400/15 border-amber-400/40 text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Bookmark className="w-4 h-4 fill-amber-400" />
                          </button>

                          <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 group-hover:bg-amber-400 group-hover:text-zinc-950 flex items-center justify-center transition-all">
                            <ArrowRight className="w-4 h-4 stroke-[2.4]" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── ABA 3: RECENTES ── */}
            {abaAtiva === 'recentes' && (
              <div className="mt-5 space-y-2.5">
                {topicosRecentes.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                    <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white font-sans">Nenhum áudio recente</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-sans">
                      Assim que você começar a ouvir qualquer aula, ela aparecerá automaticamente nesta lista para acesso rápido.
                    </p>
                  </div>
                ) : (
                  topicosRecentes.map(({ topico, modulo }) => {
                    const isFavorito = favoritos.includes(topico.id);

                    return (
                      <div
                        key={topico.id}
                        onClick={() => handleAbrirPlayer(topico)}
                        className="group relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md hover:border-amber-400/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-11 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow bg-zinc-900">
                            <img src={penalCover} alt="Capa" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8px] font-black text-amber-300 font-sans">
                              {modulo.folderIndex.toString().padStart(2, '0')}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-bold font-sans text-white group-hover:text-amber-300 transition-colors leading-snug tracking-normal">
                              {topico.titulo}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate font-sans">
                              Matéria {modulo.folderIndex}: {modulo.titulo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorito(topico.id, e)}
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isFavorito 
                                ? 'bg-amber-400/15 border-amber-400/40 text-amber-400' 
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isFavorito ? 'fill-amber-400' : ''}`} />
                          </button>

                          <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 group-hover:bg-amber-400 group-hover:text-zinc-950 flex items-center justify-center transition-all">
                            <ArrowRight className="w-4 h-4 stroke-[2.4]" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
