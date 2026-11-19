import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Play, ArrowRight,
  ChevronRight, Sparkles, BookOpen, 
  X, Bookmark, Clock, CheckCircle2, Headphones, Loader2
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { getMateriaMeta, type PilulaMateriaMeta } from './data/pilulasMateriasConfig';
import { loadPilulasCatalog, type ModuloItem, type TopicoItem } from './data/pilulasCatalogLoader';

type AbaTipo = 'materias' | 'favoritos' | 'recentes';

export default function PilulasMateria() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduloParam = searchParams.get('modulo');

  const meta: PilulaMateriaMeta = useMemo(() => {
    return getMateriaMeta(slug || 'direito-civil') || {
      id: slug || 'direito-civil',
      slug: slug || 'direito-civil',
      nome: 'Pílulas do Conhecimento',
      sigla: 'DIREITO',
      descricao: 'Áudios esquematizados, legendas sincronizadas e resumos Cornell',
      borderColor: '#3B82F6',
      image: '/pilulas/cc_portrait.webp',
      totalModulos: 0,
      totalTopicos: 0,
      aliases: [],
    };
  }, [slug]);

  const [modules, setModules] = useState<ModuloItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('materias');

  // Chaves de persistência específicas por matéria
  const storagePrefix = `pilulas_${meta.slug}`;

  const [ouvidos, setOuvidos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_concluidos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_favoritos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentes, setRecentes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_recentes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Carregar catálogo de dados sob demanda
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPilulasCatalog(meta.slug)
      .then((data) => {
        if (active) {
          setModules(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[PilulasMateria] Erro ao carregar catálogo:', err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [meta.slug]);

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
        localStorage.setItem(`${storagePrefix}_favoritos`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [storagePrefix]);

  // Abrir o Player Dedicado em uma nova tela e registrar em recentes
  const handleAbrirPlayer = useCallback((topico: TopicoItem) => {
    haptic.selection();
    setRecentes(prev => {
      const next = [topico.id, ...prev.filter(id => id !== topico.id)].slice(0, 30);
      try {
        localStorage.setItem(`${storagePrefix}_recentes`, JSON.stringify(next));
      } catch {}
      return next;
    });
    navigate(`/pilulas/${meta.slug}/player/${topico.id}`);
  }, [navigate, meta.slug, storagePrefix]);

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

  if (loading) {
    return (
      <div className="theme-vademecum min-h-dvh bg-zinc-950 flex flex-col items-center justify-center text-white relative">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm text-zinc-400 font-medium">Carregando catálogo de {meta.nome}...</p>
      </div>
    );
  }

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
        {/* CASO 1: TELA DEDICADA DE LISTA DE AULAS DO MÓDULO */}
        {/* ========================================================================= */}
        {moduloAtivo ? (
          <div>
            {/* Header com Voltar Padrão Ouro */}
            <header className="pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 flex items-center justify-between gap-4 border-b border-white/5">
              <button
                onClick={() => {
                  haptic.light();
                  setSearchParams({});
                  setBusca('');
                }}
                aria-label="Voltar para a lista de módulos"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
              </button>

              <div className="flex-1 min-w-0 text-center">
                <span 
                  className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest block font-sans"
                  style={{ color: meta.borderColor }}
                >
                  MÓDULO {moduloAtivo.folderIndex.toString().padStart(2, '0')} • {meta.nome}
                </span>
                <h1 className="text-base sm:text-lg font-bold font-sans text-white tracking-normal truncate">
                  {moduloAtivo.titulo}
                </h1>
              </div>

              <div className="w-12 sm:w-[52px] shrink-0" />
            </header>

            {/* Barra de Busca de Tópicos dentro do Módulo */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={`Buscar tópico em ${moduloAtivo.titulo}...`}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista Vertical de Tópicos do Módulo */}
            <div className="space-y-2 mt-2">
              {topicosModuloFiltrados.map((topico, idx) => {
                const isConcluido = ouvidos.includes(topico.id);
                const isFav = favoritos.includes(topico.id);

                return (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Ícone de Play / Concluído */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                        style={{
                          backgroundColor: isConcluido ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: isConcluido ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                          color: isConcluido ? '#10B981' : '#FFFFFF',
                        }}
                      >
                        {isConcluido ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">
                            Áudio + Cornell
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-white/95 mt-1 leading-snug line-clamp-2">
                          {topico.titulo}
                        </h3>
                      </div>
                    </div>

                    {/* Ações: Favoritar e Abrir */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorito(topico.id, e)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFav ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        aria-label="Favoritar tópico"
                      >
                        <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}

              {topicosModuloFiltrados.length === 0 && (
                <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-500">Nenhum tópico encontrado para esta busca.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASO 2: TELA GERAL DA MATÉRIA (HEADER HERO + CARROSSEL / TABS DE MÓDULOS) */
          /* ========================================================================= */
          <div>
            {/* Header com Navegação Padrão Ouro */}
            <header className="pt-[calc(1.2rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  haptic.light();
                  navigate('/pilulas');
                }}
                aria-label="Voltar para Pílulas"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer shadow-lg"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
              </button>

              <div className="flex-1 min-w-0 text-center">
                <span 
                  className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest block font-sans"
                  style={{ color: meta.borderColor }}
                >
                  PÍLULAS DO CONHECIMENTO
                </span>
                <h1 className="text-lg sm:text-xl font-bold font-sans text-white tracking-normal truncate">
                  {meta.nome}
                </h1>
              </div>

              <div className="w-12 sm:w-[52px] shrink-0" />
            </header>

            {/* Banner Hero com Capa da Matéria e Estatísticas */}
            <div className="mt-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div 
                  className="w-24 h-36 rounded-2xl overflow-hidden shrink-0 border-2 shadow-xl bg-zinc-950"
                  style={{ borderColor: meta.borderColor }}
                >
                  <img
                    src={meta.image}
                    alt={meta.nome}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{meta.sigla} • Áudios Esquematizados</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white font-sans mt-1.5 leading-tight">
                    {meta.nome}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {meta.descricao}
                  </p>

                  {/* Barra de Progresso Geral */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-medium">Progresso de Estudos</span>
                      <span className="text-amber-400 font-mono font-bold">{porcentagemGeral}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentagemGeral}%`,
                          backgroundColor: meta.borderColor,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                      <span>{ouvidos.length} de {totalAudios} aulas ouvidas</span>
                      <span>{modules.length} módulos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas: Matérias / Favoritos / Recentes */}
            <div className="mt-5 flex items-center justify-between gap-2 p-1 rounded-2xl bg-zinc-900/80 border border-white/5">
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('materias'); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  abaAtiva === 'materias'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Módulos ({modules.length})
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('favoritos'); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  abaAtiva === 'favoritos'
                    ? 'bg-white/10 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Favoritos ({favoritos.length})
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('recentes'); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  abaAtiva === 'recentes'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Recentes ({recentes.length})
              </button>
            </div>

            {/* Barra de Busca de Módulos */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={`Buscar módulo ou tópico em ${meta.nome}...`}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conteúdo da Aba Selecionada */}
            {abaAtiva === 'materias' && (
              <div className="space-y-3">
                {modulosFiltrados.map((m) => {
                  const concluidosNoModulo = m.topicos.filter(t => ouvidos.includes(t.id)).length;
                  const pctModulo = m.topicos.length > 0 
                    ? Math.round((concluidosNoModulo / m.topicos.length) * 100) 
                    : 0;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        haptic.selection();
                        setSearchParams({ modulo: m.id });
                        setBusca('');
                      }}
                      className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border font-mono font-bold text-xs"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: meta.borderColor,
                            color: meta.borderColor,
                          }}
                        >
                          {m.folderIndex.toString().padStart(2, '0')}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                            {m.titulo}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                            <span>{m.totalTopicos} tópicos</span>
                            <span>•</span>
                            <span className={pctModulo > 0 ? 'text-emerald-400 font-semibold' : ''}>
                              {pctModulo}% concluído
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {modulosFiltrados.length === 0 && (
                  <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
                    <p className="text-xs text-zinc-500">Nenhum módulo encontrado para esta busca.</p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'favoritos' && (
              <div className="space-y-2">
                {topicosFavoritos.map(({ topico, modulo }) => (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Play className="w-4 h-4 fill-amber-400 ml-0.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-zinc-400 font-mono block truncate">
                          {modulo.titulo}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {topico.titulo}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorito(topico.id, e)}
                      className="p-2 text-amber-400"
                    >
                      <Bookmark className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>
                ))}

                {topicosFavoritos.length === 0 && (
                  <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
                    <p className="text-xs text-zinc-500">Nenhum tópico favoritado ainda nesta matéria.</p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'recentes' && (
              <div className="space-y-2">
                {topicosRecentes.map(({ topico, modulo }) => (
                  <div
                    key={topico.id}
                    onClick={() => handleAbrirPlayer(topico)}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-zinc-400 font-mono block truncate">
                          {modulo.titulo}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {topico.titulo}
                        </h4>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}

                {topicosRecentes.length === 0 && (
                  <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
                    <p className="text-xs text-zinc-500">Nenhum tópico ouvido recentemente nesta matéria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
