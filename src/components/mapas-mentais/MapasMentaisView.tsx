import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { isAdminEmail } from '@/lib/adminEmails';
import { toast } from 'sonner';
import PremiumGate from '@/components/PremiumGate';
import { haptic } from '@/lib/nativeHaptics';

import { CATEGORIA_INFO, itensDaCategoria, MATERIAS, type CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { fetchAreasResumos, fetchTemasResumos, fetchSubtemasResumos, getCachedAreasResumos, type TemaResumo, type SubtemaResumo } from '@/lib/visuaisJuridicos/materias';
import { fetchArtigosLei, getCachedArtigos } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';
import type { VisualCategoria, VisualRecord, VisualTipo } from '@/lib/visuaisJuridicos/types';
import { prefetchVisuais, registrarVisual, visuaisEmCache } from '@/lib/visuaisJuridicos/cache';
import { listarFavoritos, listarRecentes, registrarRecente, toggleFavorito } from '@/lib/visuaisJuridicos/prefs';

import { norm, isArtigoReal, type Filtro } from './mapasConstants';
import { MapasMentaisHeader } from './MapasMentaisHeader';
import { MapasMentaisGrid } from './MapasMentaisGrid';
import { MapasMentaisDetalhes } from './MapasMentaisDetalhes';
import { MapasMentaisFormatModal } from './MapasMentaisFormatModal';
import { MapasMentaisViewer } from './MapasMentaisViewer';
import { MapasMentaisPastas } from './MapasMentaisPastas';
import { MapasMentaisBottomNav } from './MapasMentaisBottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';

export interface MapasMentaisViewProps {
  onClose: () => void;
  tipoInicial?: VisualTipo;
  categoriaInicial?: VisualCategoria;
  itemSlugInicial?: string;
  temaSlugInicial?: string;
  modo?: 'sheet' | 'page';
  onRotaChange?: (segmentos: string[]) => void;
}

export default function MapasMentaisView({
  onClose,
  tipoInicial = 'mapa_mental',
  categoriaInicial = 'materias',
  itemSlugInicial,
  temaSlugInicial,
  modo = 'page',
  onRotaChange,
}: MapasMentaisViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const podeGerar = isPremium || isAdminEmail(user?.email);

  // Estados principais
  const [categoria, setCategoria] = useState<VisualCategoria>(categoriaInicial);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [buscaDetalhe, setBuscaDetalhe] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [limite, setLimite] = useState(30);

  // Itens selecionados na navegação
  const [item, setItem] = useState<CatalogoItem | null>(null);
  const [tema, setTema] = useState<TemaResumo | null>(null);

  // Garante posicionamento no topo ao iniciar ou mudar de visualização
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [item, filtro, categoria]);

  // Dados carregados de matérias / resumos — 0ms instantâneo do cache compilado
  const [areas, setAreas] = useState<CatalogoItem[]>(() => getCachedAreasResumos() || MATERIAS);
  const [carregandoAreas, setCarregandoAreas] = useState(false);
  const [temas, setTemas] = useState<TemaResumo[]>([]);
  const [carregandoTemas, setCarregandoTemas] = useState(false);
  const [subtemas, setSubtemas] = useState<SubtemaResumo[]>([]);
  const [carregandoSubtemas, setCarregandoSubtemas] = useState(false);

  // Dados carregados de leis / códigos
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [carregandoArtigos, setCarregandoArtigos] = useState(false);

  // Cache e persistência
  const [prontos, setProntos] = useState<Record<string, VisualRecord>>({});
  const [favoritos, setFavoritos] = useState<string[]>(() => listarFavoritos());
  const [recentes, setRecentes] = useState<string[]>(() => listarRecentes());

  // Modal de formato e visualizador
  const [modalFormatoOpen, setModalFormatoOpen] = useState(false);
  const [targetGeracao, setTargetGeracao] = useState<{
    alvo: CatalogoItem;
    sub?: string;
    kind: 'artigo' | 'tema';
    temaPai?: string;
    rotulo: string;
  } | null>(null);
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState<VisualRecord | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  // Reseta limite ao mudar categoria ou filtro
  useEffect(() => {
    setLimite(30);
  }, [categoria, filtro, busca]);

  // Carrega visuais em cache
  useEffect(() => {
    let cancelado = false;
    const aplicar = (rows: VisualRecord[]) => {
      if (cancelado) return;
      const map: Record<string, VisualRecord> = {};
      rows.forEach((r) => {
        map[r.item_key] = r;
      });
      setProntos(map);
    };

    const cache = visuaisEmCache();
    if (cache) {
      aplicar(cache);
    } else {
      prefetchVisuais().then(aplicar).catch(() => {});
    }
    return () => {
      cancelado = true;
    };
  }, []);

  // Busca áreas/matérias reais do catálogo compilado / resumos
  useEffect(() => {
    if (categoria !== 'materias') return;
    let cancelado = false;
    const cacheAtual = getCachedAreasResumos();
    if (!cacheAtual || cacheAtual.length === 0) {
      setCarregandoAreas(true);
    }
    fetchAreasResumos()
      .then((rows) => {
        if (!cancelado && rows?.length) setAreas(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoAreas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [categoria]);

  // Busca tópicos da matéria selecionada
  useEffect(() => {
    if (categoria !== 'materias' || !item) {
      setTemas([]);
      return;
    }
    let cancelado = false;
    setCarregandoTemas(true);
    fetchTemasResumos(item.label)
      .then((rows) => {
        if (!cancelado) setTemas(rows);
      })
      .catch(() => {
        if (!cancelado) setTemas([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoTemas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [categoria, item]);

  // Busca subtemas do tópico selecionado
  useEffect(() => {
    if (categoria !== 'materias' || !item || !tema) {
      setSubtemas([]);
      return;
    }
    let cancelado = false;
    setCarregandoSubtemas(true);
    fetchSubtemasResumos(item.label, tema.tema)
      .then((rows) => {
        if (!cancelado) setSubtemas(rows);
      })
      .catch(() => {
        if (!cancelado) setSubtemas([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoSubtemas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [categoria, item, tema]);

  // Busca artigos quando for código/estatuto/lei
  useEffect(() => {
    if (categoria === 'materias' || !item?.tabela) {
      setArtigos([]);
      return;
    }
    let cancelado = false;
    const cache = getCachedArtigos(item.tabela);
    if (cache?.length) {
      setArtigos(cache);
      setCarregandoArtigos(false);
      return;
    }
    setCarregandoArtigos(true);
    fetchArtigosLei(item.leiId || item.key, item.tabela)
      .then((rows) => {
        if (!cancelado) setArtigos(rows || []);
      })
      .catch(() => {
        if (!cancelado) setArtigos([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoArtigos(false);
      });
    return () => {
      cancelado = true;
    };
  }, [categoria, item]);

  // Função utilitária de chave única
  const chaveDe = useCallback((base: CatalogoItem, sub?: string, kind: 'artigo' | 'tema' = 'artigo') => {
    const a = (sub || '').trim().replace(/^art\.?\s*/i, '');
    if (!a) return base.key;
    return `${base.key}#${kind === 'tema' ? 'tema' : 'art'}-${norm(a).replace(/[^a-z0-9]+/g, '-')}`;
  }, []);

  const alternarFavorito = useCallback((key: string) => {
    toggleFavorito(key);
    setFavoritos(listarFavoritos());
  }, []);

  const marcarRecente = useCallback((key: string) => {
    registrarRecente(key);
    setRecentes(listarRecentes());
  }, []);

  // Lista de itens filtrados para o catálogo principal
  const listaItens = useMemo(() => {
    const todos = categoria === 'materias' ? (areas.length ? areas : MATERIAS) : itensDaCategoria(categoria);
    const q = norm(busca.trim());
    let filtrados = q ? todos.filter((i) => norm(`${i.label} ${i.sub ?? ''}`).includes(q)) : todos;

    if (filtro === 'favoritos') {
      filtrados = filtrados.filter((i) => favoritos.includes(i.key));
    } else if (filtro === 'recentes') {
      const ordem = new Map(recentes.map((k, idx) => [k, idx]));
      filtrados = filtrados.filter((i) => ordem.has(i.key)).sort((a, b) => (ordem.get(a.key) ?? 0) - (ordem.get(b.key) ?? 0));
    } else {
      const prioridades: Record<string, number> = {
        'lei:cf88': 1,
        'lei:cp': 2,
        'lei:cpp': 3,
        'lei:cc': 4,
        'lei:eoab': 1,
        'lei:eca': 2,
      };
      filtrados = [...filtrados].sort((a, b) => {
        const pesoA = prioridades[a.key] || 999;
        const pesoB = prioridades[b.key] || 999;
        if (pesoA !== pesoB) return pesoA - pesoB;
        return a.label.localeCompare(b.label);
      });
    }
    return filtrados;
  }, [categoria, areas, busca, filtro, favoritos, recentes]);

  // Tópicos filtrados por busca
  const temasFiltrados = useMemo(() => {
    const q = norm(buscaDetalhe.trim());
    const base = q ? temas.filter((t) => norm(t.tema).includes(q)) : temas;
    return [...base].sort((a, b) => a.tema.localeCompare(b.tema));
  }, [temas, buscaDetalhe]);

  // Subtemas filtrados por busca
  const subtemasFiltrados = useMemo(() => {
    const q = norm(buscaDetalhe.trim());
    const base = q ? subtemas.filter((s) => norm(s.subtema).includes(q)) : subtemas;
    return [...base].sort((a, b) => a.subtema.localeCompare(b.subtema));
  }, [subtemas, buscaDetalhe]);

  // Artigos filtrados por busca
  const artigosFiltrados = useMemo(() => {
    const reais = artigos.filter(isArtigoReal);
    const q = norm(buscaDetalhe.trim());
    if (!q) return reais;
    return reais.filter((a) => norm(`art ${a.numero} ${a.caput ?? ''} ${a.titulo ?? ''}`).includes(q));
  }, [artigos, buscaDetalhe]);

  // Navegação de Voltar Padrão e Limpa
  const voltar = useCallback(() => {
    if (aberto) {
      setAberto(null);
      return;
    }
    if (tema) {
      setTema(null);
      setBuscaDetalhe('');
      return;
    }
    if (item) {
      setItem(null);
      setBuscaDetalhe('');
      return;
    }
    if (filtro !== 'todos') {
      setFiltro('todos');
      return;
    }
    onClose();
  }, [aberto, tema, item, filtro, onClose]);

  // Disparo para abrir o modal de formato
  const handleSolicitarGeracao = (
    alvo: CatalogoItem,
    sub?: string,
    kind: 'artigo' | 'tema' = 'artigo',
    temaPai?: string
  ) => {
    if (!podeGerar) {
      setGateOpen(true);
      return;
    }
    const valor = (sub ?? '').trim();
    const rotulo = valor
      ? kind === 'tema'
        ? `${alvo.label} — ${temaPai ? `${temaPai} · ${valor}` : valor}`
        : `${alvo.label} — Art. ${valor.replace(/^art\.?\s*/i, '')}`
      : alvo.label;

    setTargetGeracao({ alvo, sub: valor, kind, temaPai, rotulo });
    setModalFormatoOpen(true);
  };

  // Executa geração na Edge Function
  const handleExecutarGeracao = async (tipoEscolhido: VisualTipo) => {
    setModalFormatoOpen(false);
    if (!targetGeracao) return;

    const base = targetGeracao.alvo;
    const valor = targetGeracao.sub ?? '';
    const chave = chaveDe(base, targetGeracao.temaPai ? `${targetGeracao.temaPai} ${valor}` : valor, targetGeracao.kind);

    // Se já estiver pronto no cache, abre instantaneamente a 0ms
    const cache = visuaisEmCache();
    const prontoEmCache = cache?.find((r) => r.item_key === chave && r.tipo === tipoEscolhido);
    if (prontoEmCache) {
      marcarRecente(chave);
      setAberto(prontoEmCache);
      return;
    }

    setGerando(true);
    try {
      const contexto = valor
        ? targetGeracao.kind === 'tema'
          ? targetGeracao.temaPai
            ? `${base.contexto} Foque no subtópico "${valor}", dentro de "${targetGeracao.temaPai}".`
            : `${base.contexto} Foque no tópico "${valor}".`
          : `${base.contexto} Foque no artigo ${valor}.`
        : base.contexto;

      const { data, error } = await supabase.functions.invoke('visual-juridico-gerar', {
        body: {
          tipo: tipoEscolhido,
          categoria,
          item_key: chave,
          item_label: targetGeracao.rotulo,
          contexto,
        },
      });

      if (error) throw new Error(error.message || 'Erro ao gerar o mapa');
      const registro = (data as Record<string, unknown>)?.visual as VisualRecord | undefined;
      if (!registro) throw new Error('Resposta vazia');

      registrarVisual(registro);
      setProntos((prev) => ({ ...prev, [registro.item_key]: registro }));
      marcarRecente(registro.item_key);
      setAberto(registro);
      toast.success('Visual gerado com sucesso!');
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message || '');
      toast.error(msg ? `Falha ao gerar: ${msg.slice(0, 60)}` : 'Não foi possível gerar no momento.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0D0D0D] text-white overflow-y-auto overscroll-contain"
    >
      {/* Fundo Padrão com Grid Animado (ShapeGrid) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <ShapeGrid 
          speed={0.4} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.08)'
          hoverFillColor='rgba(168, 85, 247, 0.15)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      {/* 1. Header com Capa Roxa (na visualização inicial do catálogo) */}
      {!item && filtro !== 'pastas' && (
        <MapasMentaisHeader
          categoria={categoria}
          setCategoria={setCategoria}
          filtro={filtro}
          setFiltro={setFiltro}
          busca={busca}
          setBusca={setBusca}
          favoritosCount={favoritos.length}
          recentesCount={recentes.length}
          pastasCount={Object.keys(prontos).length}
          onBack={voltar}
        />
      )}

      {/* 2. Barra de Navegação / Trilha quando estiver em detalhes ou pastas */}
      {(item || filtro === 'pastas') && (
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,var(--sai-top))] bg-[#141416]/95 backdrop-blur-md border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:opacity-70 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto no-scrollbar whitespace-nowrap">
              <span
                onClick={() => {
                  setItem(null);
                  setTema(null);
                  setFiltro('todos');
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Início
              </span>

              {filtro === 'pastas' ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-white font-bold">Pastas Salvas</span>
                </>
              ) : item ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span
                    onClick={() => {
                      setItem(null);
                      setTema(null);
                    }}
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    {CATEGORIA_INFO[categoria]?.label ?? 'Catálogo'}
                  </span>

                  {tema && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span
                        onClick={() => setTema(null)}
                        className="hover:text-white cursor-pointer transition-colors truncate max-w-[130px] sm:max-w-[200px]"
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base font-bold text-white truncate leading-tight">
                {filtro === 'pastas'
                  ? 'Pastas de Mapas e PDFs'
                  : tema
                  ? tema.tema
                  : item?.label ?? 'Detalhes'}
              </h2>
              {item && !tema && item.sub && item.sub.includes('—') && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                  {item.sub.split('—')[0].trim()}
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 3. Área de Conteúdo Principal */}
      <main className="relative z-10 flex-1 pb-[calc(5.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        {filtro === 'pastas' ? (
          <MapasMentaisPastas
            prontos={prontos}
            onAbrir={(reg) => {
              marcarRecente(reg.item_key);
              setAberto(reg);
            }}
          />
        ) : item ? (
          <MapasMentaisDetalhes
            categoria={categoria}
            item={item}
            busca={buscaDetalhe}
            setBusca={setBuscaDetalhe}
            tema={tema}
            setTema={setTema}
            carregandoTemas={carregandoTemas}
            temas={temasFiltrados}
            carregandoSubtemas={carregandoSubtemas}
            subtemas={subtemasFiltrados}
            carregandoArtigos={carregandoArtigos}
            artigos={artigosFiltrados}
            prontos={prontos}
            favoritos={favoritos}
            chaveDe={chaveDe}
            onGerar={handleSolicitarGeracao}
            onAbrir={(reg) => {
              marcarRecente(reg.item_key);
              setAberto(reg);
            }}
            onToggleFavorito={alternarFavorito}
            scrollRef={scrollContainerRef}
          />
        ) : (
          <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pt-4">
            <MapasMentaisGrid
              itens={listaItens}
              limite={limite}
              onCarregarMais={() => setLimite((l) => l + 30)}
              prontos={prontos}
              favoritos={favoritos}
              onToggleFavorito={alternarFavorito}
              onSelect={(selecionado) => {
                setItem(selecionado);
                setTema(null);
                setBuscaDetalhe('');
              }}
              carregando={categoria === 'materias' && carregandoAreas}
            />
          </div>
        )}
      </main>

      {/* 4. Modal Limpo de Escolha de Formato */}
      <MapasMentaisFormatModal
        open={modalFormatoOpen}
        onClose={() => setModalFormatoOpen(false)}
        onSelectTipo={handleExecutarGeracao}
        targetRotulo={targetGeracao?.rotulo}
        initialTipo={tipoInicial}
      />

      {/* 5. Overlay de Loading quando estiver gerando na IA */}
      {gerando && (
        <div className="fixed inset-0 z-[140] bg-black/85 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-3 border-purple-500/20 border-t-purple-500 animate-spin" />
            <Loader2 className="w-8 h-8 text-purple-400 absolute inset-0 m-auto animate-spin" />
          </div>
          <div className="space-y-1 text-left w-full max-w-[280px] mx-auto bg-[#141416]/90 p-5 rounded-2xl border border-white/10 shadow-2xl mt-6">
            <div className="flex items-center gap-3 text-sm font-medium text-white mb-3">
               <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Analisando legislação e doutrina...
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-300 mb-3">
               <div className="w-2 h-2 rounded-full bg-purple-500/60 animate-pulse" style={{ animationDelay: '0.2s' }} /> Estruturando tópicos e conexões...
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
               <div className="w-2 h-2 rounded-full bg-purple-500/30 animate-pulse" style={{ animationDelay: '0.4s' }} /> Renderizando material visual...
            </div>
          </div>
        </div>
      )}

      {/* 6. Visualizador em Tela Cheia */}
      {aberto && (
        <MapasMentaisViewer
          registro={aberto}
          onClose={() => setAberto(null)}
        />
      )}

      {/* 7. Gate Premium */}
      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="mapa_mental"
      />

      {/* 8. Barra de Pesquisa Flutuante (abre ao clicar em Pesquisar no BottomNav) */}
      {buscaAtiva && (
        <div className="fixed bottom-[calc(4.5rem+16px+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] left-4 right-4 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="relative h-14 w-full flex items-center shadow-2xl shadow-black/80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 shrink-0 pointer-events-none" strokeWidth={2.2} />
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value.slice(0, 60))}
              placeholder="Pesquisar matéria, código, tema..."
              className="h-full w-full rounded-2xl bg-[#1a1025]/95 backdrop-blur-md border border-purple-500/30 pl-12 pr-14 font-sans text-[15px] font-medium text-white placeholder:text-white/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all shadow-inner"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-[52px] top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setBuscaAtiva(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 9. Bottom Navigation Principal */}
      <MapasMentaisBottomNav
        categoria={categoria}
        setCategoria={(cat) => {
          setCategoria(cat);
          setBusca('');
          setBuscaAtiva(false);
          setItem(null);
          setTema(null);
        }}
        buscaAtiva={buscaAtiva}
        onSearchClick={() => {
          setBuscaAtiva(!buscaAtiva);
          if (buscaAtiva) setBusca('');
        }}
      />
    </div>
  );
}
