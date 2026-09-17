import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { isAdminEmail } from '@/lib/adminEmails';
import { toast } from 'sonner';
import PremiumGate from '@/components/PremiumGate';
import VisualViewer from './VisualViewer';
import GeracaoAnimacaoOverlay from '@/components/vademecum/overlays/GeracaoAnimacaoOverlay';
import { CATEGORIA_INFO, itensDaCategoria, MATERIAS, type CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import { TIPO_SLUG } from '@/lib/visuaisJuridicos/rotas';
import { TIPO_INFO, type VisualCategoria, type VisualRecord, type VisualTipo } from '@/lib/visuaisJuridicos/types';
import { prefetchVisuais, registrarVisual, visuaisEmCache } from '@/lib/visuaisJuridicos/cache';
import { fetchArtigosLei, getCachedArtigos } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import ShapeGrid from '@/components/ui/ShapeGrid';
import VisuaisDeckModal from './VisuaisDeckModal';
import {
  fetchAreasResumos,
  fetchTemasResumos,
  fetchSubtemasResumos,
  slugTema,
  type TemaResumo,
  type SubtemaResumo,
} from '@/lib/visuaisJuridicos/materias';
import { listarFavoritos, listarRecentes, registrarRecente, toggleFavorito } from '@/lib/visuaisJuridicos/prefs';
import { haptic } from '@/lib/nativeHaptics';
import {
  norm,
  isArtigoReal,
  type Filtro,
  VisuaisPassoItens,
  VisuaisPassoDetalhes,
  VisuaisPastasView,
  VisuaisPastaSoloView,
  ITEM_CORES,
  EstrelaFavorito,
} from './chunks';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';

export interface VisuaisJuridicosSheetProps {
  open: boolean;
  onClose: () => void;
  /** Quando definido, o componente abre com este formato pré-selecionado. */
  tipoInicial?: VisualTipo;
  /** Categoria inicial quando aberta pela URL (ex.: 'materias' | 'codigos' | 'estatutos'). */
  categoriaInicial?: VisualCategoria;
  itemSlugInicial?: string;
  temaSlugInicial?: string;
  /** 'sheet' = folha de baixo pra cima. 'page' = tela cheia dedicada. */
  modo?: 'sheet' | 'page';
  /** Chamado ao escolher um formato (usado para navegar para a rota do formato se necessário). */
  onEscolherTipo?: (tipo: VisualTipo) => void;
  /** Espelha a navegação interna na URL (ex.: ['materias','direito-civil','lindb']). */
  onRotaChange?: (segmentos: string[]) => void;
}

export default function VisuaisJuridicosSheet({
  open,
  onClose,
  tipoInicial,
  categoriaInicial,
  itemSlugInicial,
  temaSlugInicial,
  modo = 'sheet',
  onEscolherTipo,
  onRotaChange,
}: VisuaisJuridicosSheetProps) {
  const emPagina = modo === 'page';
  useBodyScrollLock(open && !emPagina);
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const podeGerar = isPremium || isAdminEmail(user?.email);

  const [tipo, setTipo] = useState<VisualTipo>(tipoInicial ?? 'mapa_mental');
  const [categoria, setCategoria] = useState<VisualCategoria>(categoriaInicial ?? 'materias');

  useEffect(() => {
    if (tipoInicial) setTipo(tipoInicial);
  }, [tipoInicial]);

  useEffect(() => {
    if (categoriaInicial && categoriaInicial !== categoria) {
      setCategoria(categoriaInicial);
    }
  }, [categoriaInicial, categoria]);

  const [item, setItem] = useState<CatalogoItem | null>(null);
  const [artigo, setArtigo] = useState('');
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [carregandoArtigos, setCarregandoArtigos] = useState(false);
  const [buscaArtigo, setBuscaArtigo] = useState('');
  const [gerandoKey, setGerandoKey] = useState<string | null>(null);
  const [areas, setAreas] = useState<CatalogoItem[]>([]);
  const [carregandoMaterias, setCarregandoMaterias] = useState(false);
  const [temas, setTemas] = useState<TemaResumo[]>([]);
  const [carregandoTemas, setCarregandoTemas] = useState(false);
  const [tema, setTema] = useState<TemaResumo | null>(null);

  // Deck modal para seleção 3D do formato ao gerar
  const [deckOpen, setDeckOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<{
    alvo: CatalogoItem;
    sub?: string;
    kind: 'artigo' | 'tema';
    temaPai?: string;
    rotulo: string;
  } | null>(null);

  // Sincroniza o item a partir da URL se itemSlugInicial for fornecido
  useEffect(() => {
    if (!categoria || !itemSlugInicial) return;
    const todos = categoria === 'materias' ? (areas.length ? areas : MATERIAS) : itensDaCategoria(categoria);
    const hit = todos.find(
      (i) =>
        slugTema(i.label) === itemSlugInicial ||
        i.key === itemSlugInicial ||
        i.leiId === itemSlugInicial ||
        norm(i.label) === norm(itemSlugInicial.replace(/-/g, ' ')),
    );
    if (hit && hit.key !== item?.key) {
      setItem(hit);
    }
  }, [categoria, itemSlugInicial, areas, item?.key]);

  // Sincroniza o tema a partir da URL se temaSlugInicial for fornecido
  useEffect(() => {
    if (!temaSlugInicial || !temas.length) return;
    const hit = temas.find((t) => slugTema(t.tema) === temaSlugInicial);
    if (hit && hit.tema !== tema?.tema) {
      setTema(hit);
    }
  }, [temaSlugInicial, temas, tema?.tema]);

  const [subtemas, setSubtemas] = useState<SubtemaResumo[]>([]);
  const [carregandoSubtemas, setCarregandoSubtemas] = useState(false);

  const [busca, setBusca] = useState('');
  const [prontos, setProntos] = useState<Record<string, VisualRecord>>({});
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState<VisualRecord | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [pastaAtiva, setPastaAtiva] = useState<string | null>(null);
  const [materiaPasta, setMateriaPasta] = useState<string | null>(null);
  const [topicoPasta, setTopicoPasta] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>(() => listarFavoritos());
  const [recentes, setRecentes] = useState<string[]>(() => listarRecentes());

  const [limiteLista, setLimiteLista] = useState(30);
  const [limiteDetalhe, setLimiteDetalhe] = useState(30);

  useEffect(() => {
    setLimiteLista(30);
  }, [categoria, busca, filtro]);

  useEffect(() => {
    setLimiteDetalhe(30);
  }, [item, tema, buscaArtigo, filtro]);

  const alternarFavorito = useCallback((key: string) => {
    toggleFavorito(key);
    setFavoritos(listarFavoritos());
  }, []);

  const marcarRecente = useCallback((key: string) => {
    registrarRecente(key);
    setRecentes(listarRecentes());
  }, []);

  // Oculta a navegação inferior (BottomNav) enquanto o visualizador estiver aberto
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: false } }));
    };
  }, [open]);

  /** Aplica a aba ativa sobre uma lista já filtrada por texto. */
  const aplicarFiltro = useCallback(
    <T,>(itens: T[], chave: (i: T) => string) => {
      if (filtro === 'favoritos') return itens.filter((i) => favoritos.includes(chave(i)));
      if (filtro === 'recentes') {
        const ordem = new Map(recentes.map((k, i) => [k, i]));
        return itens.filter((i) => ordem.has(chave(i))).sort((a, b) => ordem.get(chave(a))! - ordem.get(chave(b))!);
      }
      return itens;
    },
    [filtro, favoritos, recentes],
  );

  const reset = useCallback(() => {
    setTipo(tipoInicial ?? 'mapa_mental');
    setCategoria(categoriaInicial ?? 'materias');
    setItem(null);
    setArtigo('');
    setBusca('');
    setArtigos([]);
    setBuscaArtigo('');
    setTemas([]);
    setTema(null);
    setSubtemas([]);
    setFiltro('todos');
    setPastaAtiva(null);
    setDeckOpen(false);
    setPendingTarget(null);
  }, [tipoInicial, categoriaInicial]);

  // Espelha o passo atual na URL (…/visuais/materias/direito-civil/lindb).
  const onRotaRef = useRef(onRotaChange);
  onRotaRef.current = onRotaChange;
  useEffect(() => {
    if (!open || !onRotaRef.current) return;
    if (itemSlugInicial && !item) return;
    if (temaSlugInicial && !tema) return;
    const segs: string[] = [];
    if (tipo) segs.push(TIPO_SLUG[tipo]);
    if (categoria) segs.push(categoria);
    if (item) segs.push(slugTema(item.label));
    if (tema) segs.push(slugTema(tema.tema));
    onRotaRef.current(segs);
  }, [open, tipo, categoria, item, tema, itemSlugInicial, temaSlugInicial]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Carrega visuais já em cache
  useEffect(() => {
    if (!open || !tipo || !categoria) return;
    let cancelado = false;
    const aplicar = (rows: VisualRecord[]) => {
      if (cancelado) return;
      const map: Record<string, VisualRecord> = {};
      rows
        .filter((r) => r.tipo === tipo && r.categoria === categoria)
        .forEach((r) => {
          map[r.item_key] = r;
        });
      setProntos(map);
      setCarregando(false);
    };
    const cache = visuaisEmCache();
    if (cache) {
      aplicar(cache);
    } else {
      setCarregando(true);
      prefetchVisuais().then(aplicar).catch(() => !cancelado && setCarregando(false));
    }
    return () => {
      cancelado = true;
    };
  }, [open, tipo, categoria]);

  const chaveDe = useCallback((base: CatalogoItem, sub?: string, kind: 'artigo' | 'tema' = 'artigo') => {
    const a = (sub || '').trim().replace(/^art\.?\s*/i, '');
    if (!a) return base.key;
    return `${base.key}#${kind === 'tema' ? 'tema' : 'art'}-${norm(a).replace(/[^a-z0-9]+/g, '-')}`;
  }, []);

  // Matérias: busca resumos jurídicos
  useEffect(() => {
    if (!open || categoria !== 'materias') return;
    let cancelado = false;
    setCarregandoMaterias(true);
    fetchAreasResumos()
      .then((rows) => {
        if (!cancelado) setAreas(rows);
      })
      .catch(() => {
        if (!cancelado) setAreas([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoMaterias(false);
      });
    return () => {
      cancelado = true;
    };
  }, [open, categoria]);

  // Tópicos da matéria escolhida.
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

  // Subtemas do tópico escolhido.
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

  const temasFiltrados = useMemo(() => {
    const q = norm(buscaArtigo.trim());
    const base = q ? temas.filter((t) => norm(t.tema).includes(q)) : temas;
    return aplicarFiltro(base, (t) => chaveDe(item!, t.tema, 'tema'));
  }, [temas, buscaArtigo, aplicarFiltro, chaveDe, item]);

  const subtemasFiltrados = useMemo(() => {
    const q = norm(buscaArtigo.trim());
    const base = q ? subtemas.filter((s) => norm(s.subtema).includes(q)) : subtemas;
    return aplicarFiltro(base, (s) => chaveDe(item!, `${tema?.tema ?? ''} ${s.subtema}`, 'tema'));
  }, [subtemas, buscaArtigo, aplicarFiltro, chaveDe, item, tema]);

  // Carrega os artigos da lei/código/estatuto escolhido — reaproveita a tabela do Vade Mecum.
  useEffect(() => {
    if ((categoria !== 'leis' && categoria !== 'codigos' && categoria !== 'estatutos') || !item?.tabela) {
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

  const artigosFiltrados = useMemo(() => {
    const reais = artigos.filter(isArtigoReal);
    const q = norm(buscaArtigo.trim());
    const base = q ? reais.filter((a) => norm(`art ${a.numero} ${a.caput}`).includes(q)) : reais;
    return aplicarFiltro(base, (a) => chaveDe(item!, a.numero));
  }, [artigos, buscaArtigo, aplicarFiltro, chaveDe, item]);

  const lista = useMemo(() => {
    if (!categoria) return [];
    const todos = categoria === 'materias' ? (areas.length ? areas : MATERIAS) : itensDaCategoria(categoria);
    const q = norm(busca.trim());
    const filtrados = q ? todos.filter((i) => norm(`${i.label} ${i.sub ?? ''}`).includes(q)) : todos;
    const porAba = aplicarFiltro(filtrados, (i) => i.key);
    if (filtro === 'recentes') return porAba;
    return [...porAba].sort((a, b) => Number(Boolean(prontos[b.key])) - Number(Boolean(prontos[a.key])));
  }, [categoria, areas, busca, prontos, aplicarFiltro, filtro]);

  /**
   * Disparado quando o usuário clica num tópico/artigo para gerar.
   * Conforme o fluxo solicitado, abre o Deck 3D para escolha do formato!
   */
  const gerar = (alvo?: CatalogoItem, sub?: string, kind: 'artigo' | 'tema' = 'artigo', temaPai?: string) => {
    const base = alvo || item;
    if (!base) return;
    if (!podeGerar) {
      setGateOpen(true);
      return;
    }
    const valor = (sub ?? (alvo ? '' : artigo)).trim();
    const rotulo = valor
      ? kind === 'tema'
        ? `${base.label} — ${temaPai ? `${temaPai} · ${valor}` : valor}`
        : `${base.label} — Art. ${valor.replace(/^art\.?\s*/i, '')}`
      : base.label;

    setPendingTarget({ alvo: base, sub: valor, kind, temaPai, rotulo });
    setDeckOpen(true);
  };

  /**
   * Execução da geração chamada quando o usuário confirma o formato no Deck Modal.
   */
  const executarGeracao = async (
    tipoEscolhido: VisualTipo,
    target: { alvo: CatalogoItem; sub?: string; kind: 'artigo' | 'tema'; temaPai?: string; rotulo: string }
  ) => {
    const base = target.alvo;
    const valor = target.sub ?? '';
    const chave = chaveDe(base, target.temaPai ? `${target.temaPai} ${valor}` : valor, target.kind);

    setTipo(tipoEscolhido);

    // Se já estiver pronto no cache para esse tipo, abre na hora
    const cache = visuaisEmCache();
    const prontoEmCache = cache?.find((r) => r.item_key === chave && r.tipo === tipoEscolhido);
    if (prontoEmCache) {
      marcarRecente(chave);
      setAberto(prontoEmCache);
      return;
    }
    const prontoLocal = prontos[chave];
    if (prontoLocal && prontoLocal.tipo === tipoEscolhido) {
      marcarRecente(chave);
      setAberto(prontoLocal);
      return;
    }

    setGerando(true);
    setGerandoKey(chave);
    try {
      const contexto = valor
        ? target.kind === 'tema'
          ? target.temaPai
            ? `${base.contexto} Foque exclusivamente no subtópico "${valor}", dentro do tópico "${target.temaPai}" desta matéria.`
            : `${base.contexto} Foque exclusivamente no tópico "${valor}" desta matéria.`
          : `${base.contexto} Foque exclusivamente no artigo ${valor}.`
        : base.contexto;

      const { data, error } = await supabase.functions.invoke('visual-juridico-gerar', {
        body: { tipo: tipoEscolhido, categoria, item_key: chave, item_label: target.rotulo, contexto },
      });
      if (error) {
        let errorDetails = ((error as Record<string, unknown>).message as string) || '';
        const errObj = error as unknown as Record<string, unknown>;
        if (errObj?.context && typeof (errObj.context as Record<string, unknown>)?.json === 'function') {
          try {
            const body = await (errObj.context as { json: () => Promise<Record<string, unknown>> }).json();
            if (typeof body?.error === 'string') errorDetails = body.error;
          } catch {
            /* ignora */
          }
        }
        throw new Error(errorDetails || 'Falha ao chamar a IA');
      }
      const registro = (data as Record<string, unknown>)?.visual as VisualRecord | undefined;
      if (!registro) throw new Error('resposta vazia');
      registrarVisual(registro);
      setProntos((p) => ({ ...p, [registro.item_key]: registro }));
      marcarRecente(registro.item_key);
      setAberto(registro);
    } catch (e: unknown) {
      console.error('[VisuaisJuridicosSheet] Erro ao gerar visual:', e);
      const msg = String((e as { message?: string })?.message || '');
      toast.error(
        msg.includes('429')
          ? 'Muitas gerações agora. Tente em alguns minutos.'
          : msg
            ? `Não foi possível gerar o visual: ${msg.slice(0, 70)}`
            : 'Não foi possível gerar o visual agora.',
      );
    } finally {
      setGerando(false);
      setGerandoKey(null);
    }
  };

  const voltar = () => {
    if (pastaAtiva) {
      setPastaAtiva(null);
    } else if (topicoPasta) {
      setTopicoPasta(null);
    } else if (materiaPasta) {
      setMateriaPasta(null);
    } else if (filtro !== 'todos') {
      setFiltro('todos');
    } else if (tema) {
      setTema(null);
      setBuscaArtigo('');
    } else if (item) {
      setItem(null);
      setBuscaArtigo('');
    } else {
      onClose();
    }
  };

  const getTitle = () => {
    if (pastaAtiva) return pastaAtiva;
    if (topicoPasta) return topicoPasta;
    if (materiaPasta) return materiaPasta;
    if (filtro === 'pastas') return 'PASTAS DE MATÉRIAS';
    if (filtro === 'favoritos') return 'MEUS FAVORITOS';
    if (filtro === 'recentes') return 'HISTÓRICO RECENTE';
    if (!item) return 'VISUAIS JURÍDICOS';
    if (tema) return tema.tema;
    return item?.label ?? 'VISUAIS JURÍDICOS';
  };

  const getSubtitle = () => {
    if (pastaAtiva) {
      const count = Object.values(prontos).filter(
        (v) => (v.item_label || 'Geral').toLowerCase() === pastaAtiva.toLowerCase(),
      ).length;
      return `Pasta de PDFs · ${count} PDF${count !== 1 ? 's' : ''} disponível${count !== 1 ? 'is' : ''}`;
    }
    if (topicoPasta) return `Temas de ${topicoPasta} · ${materiaPasta}`;
    if (materiaPasta) return `Tópicos e matérias de ${materiaPasta}`;
    if (filtro === 'pastas') return 'Escolha a matéria para ver as pastas de tópicos';
    if (filtro === 'favoritos') return `${favoritos.length} item(ns) salvo(s) como favorito`;
    if (filtro === 'recentes') return `${recentes.length} item(ns) consultado(s) recentemente`;
    if (!item) return 'Escolha uma matéria, código ou estatuto para estudar';
    if (categoria === 'materias') {
      return tema ? `Subtemas de ${tema.tema} — escolha um para gerar` : 'Escolha o tópico para ver os subtemas';
    }
    return 'Escolha o artigo para gerar o visual';
  };

  const trilha = useMemo(() => {
    const c: Array<{ label: string; onClick?: () => void }> = [
      {
        label: 'Início',
        onClick: () => {
          setPastaAtiva(null);
          setMateriaPasta(null);
          setTopicoPasta(null);
          setFiltro('todos');
          setTema(null);
          setItem(null);
        },
      },
    ];

    if (filtro === 'pastas') {
      c.push({
        label: 'Pastas',
        onClick: materiaPasta
          ? () => {
              setMateriaPasta(null);
              setTopicoPasta(null);
            }
          : undefined,
      });

      if (materiaPasta) {
        c.push({
          label: materiaPasta,
          onClick: topicoPasta ? () => setTopicoPasta(null) : undefined,
        });
      }

      if (topicoPasta) {
        c.push({
          label: topicoPasta,
        });
      }

      const last = c[c.length - 1];
      if (last) last.onClick = undefined;
      return c;
    }

    if (filtro !== 'todos' && !item) {
      const labelFiltro = filtro === 'favoritos' ? 'Favoritos' : 'Recentes';
      c.push({
        label: labelFiltro,
      });
      return c;
    }

    if (pastaAtiva) {
      c.push({
        label: pastaAtiva,
      });
      return c;
    }

    if (filtro === 'todos') {
      c.push({
        label: CATEGORIA_INFO[categoria]?.label ?? 'Matérias',
        onClick: () => {
          setTema(null);
          setItem(null);
        },
      });
    }

    if (item) {
      c.push({
        label: item.label,
        onClick: () => setTema(null),
      });
    }
    if (tema) c.push({ label: tema.tema });
    const last = c[c.length - 1];
    if (last) last.onClick = undefined;
    return c;
  }, [categoria, item, tema, pastaAtiva, filtro, materiaPasta, topicoPasta]);

  if (!open) return null;

  const sheetContent = (
    <>
      <div className="fixed inset-0 z-[100] isolate">
      {!emPagina && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-0"
        />
      )}
      <div
        className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#0D0D0D] text-foreground shadow-2xl z-10"
      >
        {/* Fundo animado quadrado padrão do aplicativo (ShapeGrid) */}
              <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <ShapeGrid
                  speed={0.5}
                  squareSize={40}
                  direction="diagonal"
                  borderColor="rgba(255, 255, 255, 0.05)"
                  hoverFillColor="rgba(255, 255, 255, 0.08)"
                  shape="square"
                  hoverTrailAmount={4}
                />
              </div>

              <div className="relative z-10 flex h-full flex-col overflow-hidden">
                {/* Cabeçalho fixo padrão apenas quando em detalhes, tela solo de pasta OU abas solo (pastas, favoritos, recentes) */}
                {(item || pastaAtiva || filtro !== 'todos') && (
                  emPagina ? (
                    <PageHeader title={getTitle()} subtitle={getSubtitle()} onBack={voltar} />
                  ) : (
                    <PageHeader
                      title={getTitle()}
                      subtitle={getSubtitle()}
                      onBack={voltar}
                      rightAction={
                        <button
                          onClick={() => {
                            haptic.light();
                            onClose();
                          }}
                          aria-label="Fechar"
                          className="w-10 h-10 rounded-full bg-secondary/70 flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <X className="w-5 h-5 text-foreground" strokeWidth={2.2} />
                        </button>
                      }
                    />
                  )
                )}

                {(item || pastaAtiva || filtro !== 'todos') && (
                  <nav
                    aria-label="Trilha de navegação"
                    className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-5 pb-2 pt-1 text-[12px] font-body text-muted-foreground lg:mx-auto lg:w-full lg:max-w-[1200px] lg:px-8"
                  >
                    {trilha.map((c, i) => (
                      <span key={`${c.label}-${i}`} className="flex items-center gap-1 shrink-0">
                        {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
                        {c.onClick ? (
                          <button onClick={c.onClick} className="hover:text-foreground active:scale-95 transition">
                            {c.label}
                          </button>
                        ) : (
                          <span className="text-foreground font-semibold">{c.label}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                )}

                <div className={`flex-1 overflow-y-auto overscroll-contain pb-[calc(1.25rem+var(--sai-bottom))] ${(item || pastaAtiva || filtro !== 'todos') ? 'px-4 pt-3 lg:mx-auto lg:w-full lg:max-w-[1400px] lg:px-8' : ''}`}>
                  {/* 1 — Tela Solo da Pasta de PDFs */}
                  {pastaAtiva ? (
                    <VisuaisPastaSoloView
                      pastaNome={pastaAtiva}
                      prontos={prontos}
                      catalogoItens={lista}
                      onEscolherItem={(i) => {
                        setPastaAtiva(null);
                        setItem(i);
                      }}
                      onBack={() => setPastaAtiva(null)}
                    />
                  ) : filtro === 'pastas' ? (
                    /* 2 — Tela Solo de Pastas Hierárquica em 3 Níveis (Materia -> Topicos -> Temas) */
                    <div className="w-full pb-12">
                      <VisuaisPastasView
                        prontos={prontos}
                        catalogoItens={lista}
                        categoria={categoria}
                        materiaAtiva={materiaPasta}
                        topicoAtivo={topicoPasta}
                        onSelectMateria={(mat) => {
                          setMateriaPasta(mat);
                          setTopicoPasta(null);
                        }}
                        onSelectTopico={(top) => {
                          setTopicoPasta(top);
                        }}
                        onEscolherItem={(i) => {
                          setArtigo('');
                          setBuscaArtigo('');
                          setItem(i);
                        }}
                      />
                    </div>
                  ) : filtro === 'favoritos' || filtro === 'recentes' ? (
                    /* 3 — Tela Solo de Favoritos / Recentes (sem painel vermelho no topo) */
                    <div className="w-full pb-12 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
                        {lista.slice(0, limiteLista).map((i, idx) => {
                          const Icon = iconeDoItem(i.key, i.label, i.sub);
                          const cor = ITEM_CORES[idx % ITEM_CORES.length];
                          const favorito = favoritos.includes(i.key);
                          const isPronto = Boolean(prontos[i.key]);

                          return (
                            <motion.div
                              key={i.key}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.28 }}
                              className="relative group"
                            >
                              <HomeCard
                                icon={Icon}
                                label={i.label}
                                sublabel={i.sub || ''}
                                color={cor}
                                delay={0}
                                badge={isPronto ? 'PRONTO' : undefined}
                                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm min-h-[96px] h-[96px]"
                                iconClassName="w-7 h-7"
                                iconStrokeWidth={1.5}
                                onClick={() => {
                                  setArtigo('');
                                  setBuscaArtigo('');
                                  setItem(i);
                                }}
                              />
                              <div className="absolute top-2 right-2 z-20">
                                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(i.key)} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {!lista.length && (
                        <div className="py-16 text-center space-y-2">
                          <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
                            {filtro === 'favoritos'
                              ? 'Nenhum favorito salvo ainda'
                              : 'Nenhum histórico recente'}
                          </p>
                          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-muted-foreground max-w-sm mx-auto">
                            {filtro === 'favoritos'
                              ? 'Marque matérias ou códigos com a estrela para reuni-los nesta tela.'
                              : 'Os conteúdos que você abrir recentemente serão organizados automaticamente nesta tela.'}
                          </p>
                        </div>
                      )}

                      {lista.length > limiteLista && (
                        <div className="pt-2 pb-6">
                          <button
                            type="button"
                            onClick={() => setLimiteLista((l) => l + 30)}
                            className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform hover:bg-secondary/70"
                          >
                            Mostrar mais opções...
                          </button>
                        </div>
                      )}
                    </div>
                  ) : !item ? (
                    /* 4 — Painel Principal: Seleção de Matéria / Código / Estatuto com HomeCards e Hero no topo que rola junto */
                    <VisuaisPassoItens
                      categoria={categoria}
                      onSelectCategoria={(cat) => {
                        setCategoria(cat);
                        setBusca('');
                        setFiltro('todos');
                      }}
                      filtro={filtro}
                      setFiltro={setFiltro}
                      busca={busca}
                      setBusca={setBusca}
                      carregando={carregando}
                      carregandoMaterias={carregandoMaterias}
                      lista={lista}
                      limiteLista={limiteLista}
                      setLimiteLista={setLimiteLista}
                      gerando={gerando}
                      gerandoKey={gerandoKey}
                      prontos={prontos}
                      favoritos={favoritos}
                      recentesCount={recentes.length}
                      totalCount={categoria === 'materias' ? (areas.length || MATERIAS.length) : itensDaCategoria(categoria).length}
                      onEscolherItem={(i) => {
                        setArtigo('');
                        setBuscaArtigo('');
                        setFiltro('todos');
                        setItem(i);
                      }}
                      onSelectPasta={(nomePasta) => {
                        setPastaAtiva(nomePasta);
                      }}
                      alternarFavorito={alternarFavorito}
                      onBack={voltar}
                      onClose={onClose}
                    />
                  ) : (
                    /* 5 — Tópicos da matéria ou Artigos da lei/código/estatuto */
                  <VisuaisPassoDetalhes
                    categoria={categoria}
                    filtro={filtro}
                    setFiltro={setFiltro}
                    buscaArtigo={buscaArtigo}
                    setBuscaArtigo={setBuscaArtigo}
                    item={item}
                    tema={tema}
                    setTema={setTema}
                    carregandoTemas={carregandoTemas}
                    temasFiltrados={temasFiltrados}
                    carregandoSubtemas={carregandoSubtemas}
                    subtemasFiltrados={subtemasFiltrados}
                    carregandoArtigos={carregandoArtigos}
                    artigosFiltrados={artigosFiltrados}
                    limiteDetalhe={limiteDetalhe}
                    setLimiteDetalhe={setLimiteDetalhe}
                    gerando={gerando}
                    gerandoKey={gerandoKey}
                    prontos={prontos}
                    favoritos={favoritos}
                    chaveDe={chaveDe}
                    gerar={gerar}
                    alternarFavorito={alternarFavorito}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

      {/* ── Deck 3D Modal: Escolha do formato (Mapa Mental, Infográfico, Fluxograma, Diagrama) ao gerar ── */}
      <VisuaisDeckModal
        open={deckOpen}
        onClose={() => setDeckOpen(false)}
        onSelectTipo={(tipoEscolhido) => {
          setDeckOpen(false);
          if (pendingTarget) {
            executarGeracao(tipoEscolhido, pendingTarget);
          }
        }}
        title="VISUAIS JURÍDICOS"
        subtitle={pendingTarget ? `Escolha o formato para ${pendingTarget.rotulo}` : 'Escolha o formato'}
        initialTipo={tipo}
      />

      <GeracaoAnimacaoOverlay
        open={gerando}
        titulo={tipo ? TIPO_INFO[tipo].label : 'Gerando visual'}
        steps={['Lendo o conteúdo jurídico', 'Estruturando com IA', 'Montando o visual', 'Pronto']}
        stepRanges={[
          [0, 15],
          [15, 85],
          [85, 97],
          [100, 100],
        ]}
        estTotalSec={22}
      />

      {aberto && <VisualViewer registro={aberto} onClose={() => setAberto(null)} />}
      <PremiumGate open={gateOpen} onClose={() => setGateOpen(false)} feature="mapa_mental" />
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(sheetContent, document.body);
}
