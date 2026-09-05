import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Scale, Heart, X, BookOpen, Gavel, Sparkles, TrendingUp } from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { LEI_ICON_MAP, LEI_ICON_DEFAULT_COLOR } from '@/lib/leiIcons';
import { isFavorito, toggleFavorito } from '@/lib/leisFavoritos';
import { useDebounce } from '@/hooks/useDebounce';
import ConteudoBusca from '@/components/vademecum/ui_elements/ConteudoBusca';
import type { LucideIcon } from 'lucide-react';

export type LeiSelecionada = {
  tipo: string;
  leiId: string;
  nome: string;
  descricao: string;
  tabela_nome: string;
  artigoNumero?: string;
};

type ModoVadeMecum = 'artigos' | 'leis' | 'jurisprudencia';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectLei: (lei: LeiSelecionada) => void;
}

const norm = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const toSel = (l: LeiCatalogItem, artigoNumero?: string): LeiSelecionada => ({
  tipo: l.tipo,
  leiId: l.id,
  nome: l.nome,
  descricao: l.descricao,
  tabela_nome: l.tabela_nome,
  artigoNumero,
});

const iconById = (id: string): LucideIcon => LEI_ICON_MAP[id] || Scale;

const ARTIGOS_EM_ALTA = [
  { artigo: '5', leiId: 'cf88', sigla: 'CF/88', tema: 'Direitos e Garantias Fundamentais' },
  { artigo: '121', leiId: 'cp', sigla: 'CP', tema: 'Dos Crimes Contra a Vida (Homicídio)' },
  { artigo: '186', leiId: 'cc', sigla: 'CC', tema: 'Dos Atos Ilícitos e Responsabilidade' },
  { artigo: '482', leiId: 'clt', sigla: 'CLT', tema: 'Demissão por Justa Causa' },
  { artigo: '312', leiId: 'cpp', sigla: 'CPP', tema: 'Requisitos da Prisão Preventiva' },
  { artigo: '14', leiId: 'cdc', sigla: 'CDC', tema: 'Responsabilidade do Fornecedor' },
];

const BuscaLeisOverlay = ({ open, onClose, onSelectLei }: Props) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 120);
  const [modo, setModo] = useState<ModoVadeMecum>('artigos');
  const [favVersion, setFavVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Extrai dígitos para busca direta de artigo (ex.: "art 121", "121", "artigo 5")
  const artigoQueryDigits = useMemo(() => {
    const match = query.match(/\d+[-a-zA-Z]*/);
    return match ? match[0].replace(/^[a-zA-Z]+/, '') : '';
  }, [query]);

  // Filtro de leis quando o usuário pesquisa um artigo específico
  const leisParaArtigo = useMemo(() => {
    if (!artigoQueryDigits) return [];
    const termo = query
      .toLowerCase()
      .replace(/\d+[-a-zA-Z]*/g, '')
      .replace(/art(?:igo)?\.?/gi, '')
      .replace(/\b(do|da|de|no|na|paragrafo|parágrafo)\b/gi, '')
      .trim();

    const principais = LEIS_CATALOG.filter(
      (l) => l.tipo === 'constituicao' || l.tipo === 'codigo' || l.tipo === 'estatuto'
    );

    if (!termo) return principais;

    const filtradas = principais.filter(
      (l) =>
        norm(l.nome).includes(norm(termo)) ||
        norm(l.descricao).includes(norm(termo)) ||
        norm(l.sigla || '').includes(norm(termo))
    );

    return filtradas.length > 0 ? filtradas : principais;
  }, [artigoQueryDigits, query]);

  // Filtro geral de leis
  const leisFiltradas = useMemo(() => {
    const q = norm(query.trim());
    if (!q) {
      // Leis em destaque inicial
      return LEIS_CATALOG.filter(
        (l) => l.tipo === 'constituicao' || l.tipo === 'codigo' || l.tipo === 'estatuto'
      ).slice(0, 30);
    }
    return LEIS_CATALOG.filter((l) => {
      const alvo = norm(`${l.nome} ${l.sigla} ${l.descricao} ${(l.tags ?? []).join(' ')}`);
      return alvo.includes(q);
    }).slice(0, 50);
  }, [query]);

  const TABS: Array<{ id: ModoVadeMecum; label: string; icon: LucideIcon }> = [
    { id: 'artigos', label: 'Artigos', icon: BookOpen },
    { id: 'leis', label: 'Leis & Códigos', icon: Scale },
    { id: 'jurisprudencia', label: 'Jurisprudência', icon: Gavel },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[49] bg-black/60 backdrop-blur-sm"
          />

          {/* Painel Principal de Busca do Vade Mecum */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed z-50 inset-0 bg-background flex flex-col lg:top-[8%] lg:bottom-auto lg:h-[84vh] lg:max-w-[850px] lg:mx-auto lg:rounded-2xl lg:shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="bg-hero-panel px-4 pb-4 pt-[calc(0.75rem+var(--sai-top))] shrink-0 shadow-md">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  onClick={onClose}
                  aria-label="Voltar"
                  className="w-11 h-11 rounded-full bg-black/40 border border-white/20 flex items-center justify-center active:scale-95 transition shrink-0"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div className="text-center flex-1 min-w-0">
                  <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-wide truncate">
                    Pesquisa no Vade Mecum
                  </h2>
                  <p className="text-[11px] text-white/70">Artigos, Legislação e Jurisprudência</p>
                </div>
                <div className="w-11 shrink-0" />
              </div>

              {/* Barra de Pesquisa */}
              <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    modo === 'artigos'
                      ? 'Número do artigo ou termo (ex: 121, homicídio)...'
                      : modo === 'leis'
                      ? 'Sigla ou nome da lei (ex: CF, CP, CDC, 8078)...'
                      : 'Termo na jurisprudência (ex: dano moral, prescrição)...'
                  }
                  className="w-full h-12 pl-11 pr-11 rounded-2xl bg-black/40 border border-white/25 text-white placeholder:text-white/50 text-[14px] outline-none focus:border-white/50 transition-colors"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Limpar campo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-90 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Abas exclusivas do Vade Mecum */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/15">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const ativo = modo === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setModo(t.id)}
                      className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        ativo
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo Dinâmico com Scroll */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-[calc(3rem+var(--sai-bottom))]">
              {/* ── ABA 1: ARTIGOS ────────────────────────────────────────── */}
              {modo === 'artigos' && (
                <div className="space-y-4">
                  {/* Cenário A: Usuário digitou um número de artigo */}
                  {artigoQueryDigits ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-1">
                        Artigo {artigoQueryDigits} nos Códigos e Leis:
                      </p>
                      <div className="space-y-2">
                        {leisParaArtigo.map((lei) => (
                          <button
                            key={lei.id}
                            onClick={() => onSelectLei(toSel(lei, artigoQueryDigits))}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 active:scale-[0.99] transition text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {lei.sigla || 'LEI'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-foreground truncate">{lei.nome}</p>
                                <p className="text-[12px] text-muted-foreground truncate">{lei.descricao}</p>
                              </div>
                            </div>
                            <span className="ml-2 shrink-0 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold">
                              Art. {artigoQueryDigits}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : query.trim().length >= 2 ? (
                    /* Cenário B: Usuário digitou uma palavra/tema (busca em texto nos artigos) */
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
                        Artigos citando "{query}":
                      </p>
                      <ConteudoBusca
                        query={debouncedQuery}
                        onNavigate={onClose}
                        grupo="conteudo"
                        categoria="leis"
                      />
                    </div>
                  ) : (
                    /* Cenário C: Busca vazia -> Sugestões de Artigos Mais Acessados */
                    <div className="space-y-4 pt-1">
                      <div>
                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-2.5 px-1">
                          <TrendingUp className="w-4 h-4" />
                          Artigos mais consultados no Vade Mecum
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ARTIGOS_EM_ALTA.map((item) => {
                            const leiItem = LEIS_CATALOG.find((l) => l.id === item.leiId);
                            return (
                              <button
                                key={`${item.leiId}-${item.artigo}`}
                                onClick={() => {
                                  if (leiItem) {
                                    onSelectLei(toSel(leiItem, item.artigo));
                                  } else {
                                    setQuery(`art ${item.artigo}`);
                                  }
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 active:scale-[0.99] transition text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {item.sigla}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-bold text-foreground">
                                    Art. {item.artigo} · {item.sigla}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">{item.tema}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                        <p className="text-xs font-semibold text-foreground">
                          Dica de Pesquisa de Artigos
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Digite o número do artigo (ex.: <span className="text-primary font-bold">121</span>, <span className="text-primary font-bold">art 5</span> ou <span className="text-primary font-bold">186 cc</span>) para ir direto ao dispositivo legal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ABA 2: LEIS & CÓDIGOS ─────────────────────────────────── */}
              {modo === 'leis' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {query ? `Leis encontradas (${leisFiltradas.length})` : 'Códigos e Leis Principais'}
                    </p>
                  </div>
                  {leisFiltradas.map((lei) => {
                    const fav = isFavorito(lei.id);
                    const Icon = iconById(lei.id);
                    return (
                      <div
                        key={`${lei.id}-${favVersion}`}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition"
                      >
                        <button
                          onClick={() => onSelectLei(toSel(lei))}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${lei.iconColor ?? LEI_ICON_DEFAULT_COLOR}18`,
                              color: lei.iconColor ?? LEI_ICON_DEFAULT_COLOR,
                            }}
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold text-foreground truncate">
                              {lei.sigla ? `${lei.sigla} · ` : ''}{lei.nome}
                            </p>
                            <p className="text-[12px] text-muted-foreground truncate">{lei.descricao}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito({
                              tipo: lei.tipo,
                              leiId: lei.id,
                              nome: lei.nome,
                              descricao: lei.descricao,
                              tabela_nome: lei.tabela_nome,
                            });
                            setFavVersion((v) => v + 1);
                          }}
                          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar lei'}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition ${
                            fav ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── ABA 3: JURISPRUDÊNCIA ─────────────────────────────────── */}
              {modo === 'jurisprudencia' && (
                <div className="space-y-3">
                  <ConteudoBusca
                    query={debouncedQuery}
                    onNavigate={onClose}
                    grupo="jurisprudencia"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuscaLeisOverlay;
