import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
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
  VisuaisPassoTipos,
  VisuaisPassoCategorias,
  VisuaisPassoItens,
  VisuaisPassoDetalhes,
} from './chunks';

export interface VisuaisJuridicosSheetProps {
  open: boolean;
  onClose: () => void;
  /** Quando definido, o componente abre direto neste formato, em tela cheia (rota própria). */
  tipoInicial?: VisualTipo;
  /** Categoria inicial quando aberta pela URL (ex.: 'materias' | 'leis' | 'jurisprudencia'). */
  categoriaInicial?: VisualCategoria;
  itemSlugInicial?: string;
  temaSlugInicial?: string;
  /** 'sheet' = folha de baixo pra cima (escolha do formato). 'page' = tela cheia dedicada. */
  modo?: 'sheet' | 'page';
  /** Chamado ao escolher um formato no passo 1 (usado para navegar para a rota do formato). */
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

  const [tipo, setTipo] = useState<VisualTipo | null>(tipoInicial ?? null);
  const [categoria, setCategoria] = useState<VisualCategoria | null>(categoriaInicial ?? null);

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

  // Sincroniza o item a partir da URL se itemSlugInicial for fornecido
  useEffect(() => {
    if (!categoria || !itemSlugInicial) return;
    const todos = categoria === 'materias' ? (areas.length ? areas : MATERIAS) : itensDaCategoria(categoria);
    const hit = todos.find(
      (i) =>
        slugTema(i.label) === itemSlugInicial ||
        i.key === itemSlugInicial ||
        (i as any).leiId === itemSlugInicial ||
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

  const passo = !tipo ? 1 : !categoria ? 2 : !item ? 3 : 4;

  const reset = useCallback(() => {
    setTipo(tipoInicial ?? null);
    setCategoria(categoriaInicial ?? null);
    setItem(null);
    setArtigo('');
    setBusca('');
    setArtigos([]);
    setBuscaArtigo('');
    setTemas([]);
    setTema(null);
    setSubtemas([]);
    setFiltro('todos');
  }, [tipoInicial, categoriaInicial]);

  // Espelha o passo atual na URL (…/visuais/mapa-mental/materias/direito-civil/lindb).
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

  // Usa o cache já pré-carregado no início do app — abre instantâneo, sem delay.
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

  const itemKey = useMemo(() => (item ? chaveDe(item, artigo) : ''), [item, artigo, chaveDe]);

  // Matérias reaproveitam a tabela de resumos jurídicos.
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

  // Carrega os artigos da lei escolhida — reaproveita a tabela do Vade Mecum.
  useEffect(() => {
    if (categoria !== 'leis' || !item?.tabela) {
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
    const todos = categoria === 'materias' ? areas : itensDaCategoria(categoria);
    const q = norm(busca.trim());
    const filtrados = q ? todos.filter((i) => norm(`${i.label} ${i.sub ?? ''}`).includes(q)) : todos;
    const porAba = aplicarFiltro(filtrados, (i) => i.key);
    if (filtro === 'recentes') return porAba;
    return [...porAba].sort((a, b) => Number(Boolean(prontos[b.key])) - Number(Boolean(prontos[a.key])));
  }, [categoria, areas, busca, prontos, aplicarFiltro, filtro]);

  const gerar = async (alvo?: CatalogoItem, sub?: string, kind: 'artigo' | 'tema' = 'artigo', temaPai?: string) => {
    const base = alvo || item;
    if (!tipo || !categoria || !base) return;
    if (!podeGerar) {
      setGateOpen(true);
      return;
    }
    const valor = (sub ?? (alvo ? '' : artigo)).trim();
    const chave = chaveDe(base, temaPai ? `${temaPai} ${valor}` : valor, kind);
    const pronto = prontos[chave];
    if (pronto) {
      marcarRecente(chave);
      setAberto(pronto);
      return;
    }

    setGerando(true);
    setGerandoKey(chave);
    try {
      const rotulo = valor
        ? kind === 'tema'
          ? `${base.label} — ${temaPai ? `${temaPai} · ${valor}` : valor}`
          : `${base.label} — Art. ${valor.replace(/^art\.?\s*/i, '')}`
        : base.label;
      const contexto = valor
        ? kind === 'tema'
          ? temaPai
            ? `${base.contexto} Foque exclusivamente no subtópico "${valor}", dentro do tópico "${temaPai}" desta matéria.`
            : `${base.contexto} Foque exclusivamente no tópico "${valor}" desta matéria.`
          : `${base.contexto} Foque exclusivamente no artigo ${valor}.`
        : base.contexto;
      const { data, error } = await supabase.functions.invoke('visual-juridico-gerar', {
        body: { tipo, categoria, item_key: chave, item_label: rotulo, contexto },
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
    if (tema) {
      setTema(null);
      setBuscaArtigo('');
    } else if (item) {
      setItem(null);
      setBuscaArtigo('');
    } else if (categoria) {
      setCategoria(null);
      setBusca('');
    } else if (tipo) {
      setTipo(null);
    } else {
      onClose();
    }
  };

  const getTitle = () => {
    if (passo === 1 || !tipo) return 'Visuais jurídicos';
    if (passo === 2 || !categoria) return TIPO_INFO[tipo]?.label ?? 'Visuais jurídicos';
    if (passo === 3 || !item) return CATEGORIA_INFO[categoria]?.label ?? 'Categorias';
    if (tema) return tema.tema;
    return item?.label ?? '';
  };

  const getSubtitle = () => {
    if (passo === 1 || !tipo) return 'Escolha o formato que combina com o seu estudo';
    if (passo === 2 || !categoria) return 'De onde vem o conteúdo?';
    if (passo === 3 || !item) return 'Escolha o tema — o que já está gerado abre na hora';
    if (categoria === 'materias') {
      return tema ? `Subtemas de ${tema.tema} — escolha um para gerar` : 'Escolha o tópico para ver os subtemas';
    }
    return 'Escolha o artigo';
  };

  const trilha = useMemo(() => {
    const c: Array<{ label: string; onClick?: () => void }> = [
      {
        label: 'Visuais',
        onClick: () => {
          setTema(null);
          setItem(null);
          setCategoria(null);
          setTipo(null);
        },
      },
    ];
    if (tipo) {
      c.push({
        label: TIPO_INFO[tipo]?.label ?? 'Visual',
        onClick: () => {
          setTema(null);
          setItem(null);
          setCategoria(null);
        },
      });
    }
    if (categoria) {
      c.push({
        label: CATEGORIA_INFO[categoria]?.label ?? 'Categoria',
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
  }, [tipo, categoria, item, tema]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {!emPagina && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[60] bg-black/60"
              />
            )}
            <motion.div
              initial={emPagina ? { opacity: 0 } : { y: '100%' }}
              animate={emPagina ? { opacity: 1 } : { y: 0 }}
              exit={emPagina ? { opacity: 0 } : { y: '100%' }}
              transition={emPagina ? { duration: 0.2 } : { type: 'spring', damping: 30, stiffness: 300 }}
              className={
                emPagina
                  ? 'fixed inset-0 z-[61] flex h-[100dvh] flex-col overflow-hidden bg-background'
                  : `fixed inset-x-0 bottom-0 z-[61] flex flex-col overflow-hidden bg-background shadow-2xl ${
                      tipo ? 'top-0 h-[100dvh] rounded-none' : 'max-h-[90dvh] rounded-t-3xl'
                    }`
              }
            >
              {emPagina ? (
                <PageHeader title={getTitle()} subtitle={getSubtitle()} onBack={onClose} />
              ) : (
                <>
                  <div className="flex items-center justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-5 pb-3">
                    {passo > 1 && (
                      <button
                        onClick={() => {
                          haptic.light();
                          voltar();
                        }}
                        aria-label="Voltar"
                        className="w-11 h-11 shrink-0 rounded-full bg-secondary/70 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <ChevronLeft className="w-6 h-6 text-foreground" strokeWidth={2.2} />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold uppercase tracking-[0.04em] leading-none text-foreground truncate">
                        {getTitle()}
                      </h3>
                      <p className="mt-1 font-body text-[12px] leading-tight text-muted-foreground truncate">
                        {getSubtitle()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        haptic.light();
                        onClose();
                      }}
                      aria-label="Fechar"
                      className="w-11 h-11 shrink-0 rounded-full bg-secondary/70 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <X className="w-6 h-6 text-foreground" strokeWidth={2.2} />
                    </button>
                  </div>
                </>
              )}

              {passo > 1 && (
                <nav
                  aria-label="Trilha de navegação"
                  className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-5 pb-2 pt-1 text-[12px] font-body text-muted-foreground lg:mx-auto lg:w-full lg:max-w-[900px] lg:px-8"
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

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+var(--sai-bottom))] pt-3 lg:mx-auto lg:w-full lg:max-w-[900px] lg:px-8">
                {/* 1 — tipo */}
                {passo === 1 && (
                  <VisuaisPassoTipos
                    onSelectTipo={setTipo}
                    onEscolherTipo={onEscolherTipo}
                  />
                )}

                {/* 2 — categoria */}
                {passo === 2 && (
                  <VisuaisPassoCategorias
                    onSelectCategoria={setCategoria}
                  />
                )}

                {/* 3 — item */}
                {passo === 3 && (
                  <VisuaisPassoItens
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
                    categoria={categoria!}
                    favoritos={favoritos}
                    onEscolherItem={(i) => {
                      setArtigo('');
                      setBuscaArtigo('');
                      setFiltro('todos');
                      if (categoria === 'leis' || categoria === 'materias') setItem(i);
                      else gerar(i);
                    }}
                    alternarFavorito={alternarFavorito}
                  />
                )}

                {/* 4 — tópicos da matéria (resumos) ou artigos da lei */}
                {passo === 4 && item && (
                  <VisuaisPassoDetalhes
                    categoria={categoria!}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
}
