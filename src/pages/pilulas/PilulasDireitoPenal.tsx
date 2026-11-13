import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Play, FileText, 
  ChevronDown, ChevronUp, Sparkles, BookOpen, 
  X, Bookmark, Clock, CheckCircle2, Headphones, Star
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import penalCover from '@/assets/covers/cp_artigos_v2.webp';
import PdfPaginatedReader from '@/components/biblioteca/PdfPaginatedReader';
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
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('materias');
  const [moduloAberto, setModuloAberto] = useState<string | null>('01-historia-do-direito-penal');
  const [pdfAtivo, setPdfAtivo] = useState<{ url: string; titulo: string } | null>(null);

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

  // Abrir o PDF da Ficha Cornell no leitor paginado dentro do app
  const handleAbrirPDF = useCallback((topico: TopicoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    const pdfSrc = topico.pdfUrl || (topico.drivePdfId ? `https://drive.google.com/uc?export=download&id=${topico.drivePdfId}` : '');
    if (pdfSrc) {
      setPdfAtivo({ url: pdfSrc, titulo: topico.titulo });
    }
  }, []);

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

        {/* Banner de Estatísticas e Progresso com a Capa Vermelha Oficial */}
        <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-red-950/40 via-zinc-900/70 to-black/85 border border-red-500/25 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Capa Vermelha Oficial de Direito Penal */}
          <div className="relative w-20 h-28 sm:w-24 sm:h-34 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-red-500/50 shrink-0 shadow-2xl shadow-red-950/60 bg-zinc-900">
            <img 
              src={penalCover} 
              alt="Capa Vermelha Direito Penal" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Textos e Barra de Porcentagem Geral Ouvida */}
          <div className="flex-1 min-w-0 w-full text-left">
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Grade Doutrinária Completa</span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              42 Módulos Temáticos • {totalAudios} Pílulas em Áudio
            </h2>

            <p className="text-xs text-zinc-400 mt-1">
              Toque em qualquer matéria para abrir a lista e entrar no player completo.
            </p>

            {/* Barra de Progresso e Porcentagem que a pessoa já ouviu */}
            <div className="mt-3.5 pt-3 border-t border-white/10 w-full">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  <span>Progresso Geral de Estudos</span>
                </span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {porcentagemGeral}%
                </span>
              </div>

              {/* Barra de Progresso com Gradiente */}
              <div className="w-full h-2.5 rounded-full bg-zinc-800/80 border border-white/5 overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(porcentagemGeral, 2)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                <span>{ouvidos.length} de {totalAudios} pílulas ouvidas</span>
                {ouvidos.length > 0 && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Em andamento
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu de Alternância de Matérias, Favoritos e Recentes */}
        <div className="mt-5 p-1 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaAtiva('materias');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              abaAtiva === 'materias'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Matérias</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              abaAtiva === 'favoritos'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Favoritos</span>
            {favoritos.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              abaAtiva === 'recentes'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recentes</span>
            {recentes.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                abaAtiva === 'recentes' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'
              }`}>
                {recentes.length}
              </span>
            )}
          </button>
        </div>

        {/* Barra de Busca de Tópicos */}
        <div className="mt-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              abaAtiva === 'materias'
                ? 'Buscar tema, assunto ou infração penal...'
                : abaAtiva === 'favoritos'
                ? 'Buscar nos favoritos...'
                : 'Buscar nos recentes...'
            }
            className="w-full h-12 pl-12 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.08] transition-all"
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

        {/* ── ABA 1: MATÉRIAS (Módulos com Barra de Progresso e Tipografia Elegante) ── */}
        {abaAtiva === 'materias' && (
          <div className="mt-5 space-y-3">
            {modulosFiltrados.map((modulo) => {
              const isAberto = moduloAberto === modulo.id || Boolean(busca.trim());

              // Progresso deste módulo específico
              const ouvidosNoModulo = modulo.topicos.filter(t => ouvidos.includes(t.id)).length;
              const percentModulo = Math.round((ouvidosNoModulo / modulo.topicos.length) * 100);

              return (
                <div 
                  key={modulo.id}
                  className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-white/15 shadow-md"
                >
                  {/* Cabeçalho do Módulo com a Capa Vermelha Oficial */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setModuloAberto(isAberto && !busca ? null : modulo.id);
                    }}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-white/5 transition-colors cursor-pointer select-none gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Capa Vermelha Oficial com Índice do Módulo */}
                      <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow-md bg-zinc-900">
                        <img 
                          src={penalCover} 
                          alt="Capa Vermelha Direito Penal" 
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8.5px] font-black text-amber-300 leading-none shadow">
                          {modulo.folderIndex.toString().padStart(2, '0')}
                        </span>
                      </div>

                      {/* Informações do Módulo com Tipografia Elegante e Barra de Progresso */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] sm:text-base font-bold text-zinc-100 tracking-tight leading-snug truncate">
                          {modulo.titulo}
                        </h3>

                        <p className="text-[11.5px] text-zinc-400 mt-0.5">
                          {modulo.topicos.length} {modulo.topicos.length === 1 ? 'pílula em áudio' : 'pílulas em áudio'} • Resumos Cornell
                        </p>

                        {/* Barra de Progresso do Módulo */}
                        <div className="mt-2 w-full max-w-sm">
                          <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-1">
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

                    <div className="shrink-0 text-zinc-400 pl-2">
                      {isAberto ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Lista de Pílulas do Módulo */}
                  {isAberto && (
                    <div className="p-3 pt-0 border-t border-white/5 divide-y divide-white/5">
                      {modulo.topicos.map((topico, idx) => {
                        const isFavorito = favoritos.includes(topico.id);
                        const isOuvido = ouvidos.includes(topico.id);

                        return (
                          <div 
                            key={topico.id}
                            onClick={() => handleAbrirPlayer(topico)}
                            className="p-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] cursor-pointer group"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <span className={`shrink-0 text-xs font-bold mt-1 min-w-[22px] ${
                                isOuvido ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-amber-400'
                              }`}>
                                {isOuvido ? '✓' : (idx + 1).toString().padStart(2, '0')}.
                              </span>

                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold tracking-tight text-white group-hover:text-amber-300 transition-colors leading-snug">
                                  {topico.titulo}
                                </h4>
                                <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate">
                                  Direito Penal • Módulo {modulo.folderIndex}
                                </p>
                              </div>
                            </div>

                            {/* Ações: Favoritar, Ficha Cornell e Ouvir */}
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              {/* Botão Favoritar */}
                              <button
                                type="button"
                                onClick={(e) => toggleFavorito(topico.id, e)}
                                title={isFavorito ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                                  isFavorito 
                                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-400' 
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Bookmark className={`w-4 h-4 ${isFavorito ? 'fill-amber-400' : ''}`} />
                              </button>

                              {/* Botão Ficha Cornell em PDF (Abre igual o livro no app) */}
                              <button
                                type="button"
                                onClick={(e) => handleAbrirPDF(topico, e)}
                                title="Abrir Resumo Ficha Cornell em PDF no App"
                                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ficha Cornell</span>
                              </button>

                              {/* Botão Ouvir Player */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirPlayer(topico);
                                }}
                                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-bold transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Ouvir</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABA 2: FAVORITOS ── */}
        {abaAtiva === 'favoritos' && (
          <div className="mt-5 space-y-3">
            {topicosFavoritos.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum favorito salvo ainda</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Toque no ícone de marcador nas pílulas de Direito Penal para salvá-las aqui e estudar quando quiser.
                </p>
              </div>
            ) : (
              topicosFavoritos.map(({ topico, modulo }, idx) => {
                const isOuvido = ouvidos.includes(topico.id);

                return (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md hover:border-amber-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative w-12 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow bg-zinc-900">
                        <img src={penalCover} alt="Capa" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8px] font-black text-amber-300">
                          {modulo.folderIndex.toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                          {topico.titulo}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          Módulo {modulo.folderIndex}: {modulo.titulo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorito(topico.id, e)}
                        className="w-9 h-9 rounded-xl border bg-amber-400/15 border-amber-400/40 text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 fill-amber-400" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleAbrirPDF(topico, e)}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ficha Cornell</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirPlayer(topico);
                        }}
                        className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 text-xs font-bold shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ouvir</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ABA 3: RECENTES ── */}
        {abaAtiva === 'recentes' && (
          <div className="mt-5 space-y-3">
            {topicosRecentes.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum áudio recente</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Assim que você começar a ouvir qualquer pílula, ela aparecerá automaticamente nesta lista para acesso rápido.
                </p>
              </div>
            ) : (
              topicosRecentes.map(({ topico, modulo }, idx) => {
                const isFavorito = favoritos.includes(topico.id);

                return (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md hover:border-amber-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative w-12 aspect-[3/4] rounded-xl overflow-hidden border border-red-500/40 shrink-0 shadow bg-zinc-900">
                        <img src={penalCover} alt="Capa" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8px] font-black text-amber-300">
                          {modulo.folderIndex.toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                          {topico.titulo}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          Módulo {modulo.folderIndex}: {modulo.titulo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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

                      <button
                        type="button"
                        onClick={(e) => handleAbrirPDF(topico, e)}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ficha Cornell</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAbrirPlayer(topico);
                        }}
                        className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 text-xs font-bold shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ouvir</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Leitor Oficial de PDF Paginated (Igual ao Livro no Próprio App) */}
      {pdfAtivo && (
        <PdfPaginatedReader
          url={pdfAtivo.url}
          titulo={`Ficha Cornell: ${pdfAtivo.titulo}`}
          capaUrl={penalCover}
          onClose={() => setPdfAtivo(null)}
        />
      )}
    </div>
  );
}
