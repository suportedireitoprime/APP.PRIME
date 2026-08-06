import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Scale, Heart, History, X } from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { LEI_ICON_MAP, LEI_ICON_DEFAULT_COLOR } from '@/lib/leiIcons';
import { getFavoritos, type LeiFavorita } from '@/lib/leisFavoritos';
import { getRecentes, type LeiRecente } from '@/lib/leisRecentes';
import type { LucideIcon } from 'lucide-react';


export type LeiSelecionada = {
  tipo: string;
  leiId: string;
  nome: string;
  descricao: string;
  tabela_nome: string;
};

type Modo = 'leis' | 'favoritos' | 'recentes';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectLei: (lei: LeiSelecionada) => void;
}

const norm = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const toSel = (l: LeiCatalogItem): LeiSelecionada => ({
  tipo: l.tipo,
  leiId: l.id,
  nome: l.nome,
  descricao: l.descricao,
  tabela_nome: l.tabela_nome,
});

/**
 * Ícone sem fundo, com reflexo animado e cores vivas, usando a cor da lei.
 */
const LeiIcon = ({
  icon: Icon,
  color,
  size = 26,
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
}) => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <Icon
        className="relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
        style={{
          color,
          width: size,
          height: size,
          filter: 'saturate(1.6) brightness(1.15)',
        }}
        strokeWidth={1.7}
      />

      {/* Reflexo animado */}
      <motion.div
        className="absolute left-1/2 top-[60%] -translate-x-1/2 pointer-events-none overflow-hidden"
        style={{ width: size, height: size * 0.55 }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <motion.div
          animate={{
            opacity: [0.22, 0.45, 0.22],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon
            style={{
              color,
              width: size,
              height: size,
              transform: 'scaleY(-1)',
              filter: 'saturate(1.6) brightness(1.15)',
            }}
            strokeWidth={1.7}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};


const iconById = (id: string): LucideIcon => LEI_ICON_MAP[id] || Scale;
const colorById = (id: string): string => {
  const item = LEIS_CATALOG.find((l) => l.id === id);
  return item?.iconColor ?? LEI_ICON_DEFAULT_COLOR;
};

const BuscaLeisOverlay = ({ open, onClose, onSelectLei }: Props) => {
  const [query, setQuery] = useState('');
  const [modo, setModo] = useState<Modo>('leis');
  const [favoritos, setFavoritos] = useState<LeiFavorita[]>([]);
  const [recentes, setRecentes] = useState<LeiRecente[]>([]);

  useEffect(() => {
    if (!open) return;
    setFavoritos(getFavoritos());
    setRecentes(getRecentes());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setModo('leis');
    }
  }, [open]);

  const leis = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return LEIS_CATALOG.slice(0, 40);
    return LEIS_CATALOG.filter((l) => {
      const alvo = norm(
        `${l.nome} ${l.sigla} ${l.descricao} ${(l.tags ?? []).join(' ')}`,
      );
      return alvo.includes(q);
    }).slice(0, 60);
  }, [query]);

  const listaFiltrada = <T extends { nome: string; descricao: string }>(list: T[]) => {
    const q = norm(query.trim());
    if (!q) return list;
    return list.filter((i) => norm(`${i.nome} ${i.descricao}`).includes(q));
  };

  const TABS: Array<{ id: Modo; label: string; icon: typeof Scale }> = [
    { id: 'leis', label: 'Leis', icon: Scale },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'recentes', label: 'Recentes', icon: History },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            onClick={onClose}
            className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', pointerEvents: 'none' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="theme-vademecum fixed z-50 inset-x-0 bottom-0 top-[10vh] bg-background flex flex-col rounded-t-3xl lg:top-[10%] lg:max-w-[800px] lg:mx-auto lg:rounded-t-2xl lg:shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0"
                aria-label="Fechar"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <div className="flex-1 text-center">
                <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">
                  Pesquisar leis
                </h2>
              </div>
              <div className="w-12 shrink-0" />
            </div>

            {/* Abas */}
            <div className="flex gap-2 px-4 py-3">
              {TABS.map((t) => {
                const Icon = t.icon;
                const ativo = modo === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setModo(t.id)}
                    className={`flex-1 h-11 rounded-xl font-display text-[13px] font-bold flex items-center justify-center gap-1.5 transition ${
                      ativo
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${ativo && t.id === 'favoritos' ? 'fill-current' : ''}`} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Campo de busca */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nome, sigla ou número da lei..."
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-muted/60 border border-border font-body text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
              {modo === 'leis' &&
                leis.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onSelectLei(toSel(l))}
                    className="w-full text-left p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3 active:scale-[0.99] transition"
                  >
                    <LeiIcon icon={iconById(l.id)} color={l.iconColor ?? LEI_ICON_DEFAULT_COLOR} />
                    <div className="min-w-0">
                      <p className="font-display text-[15px] font-bold text-foreground truncate">
                        {l.sigla} · {l.nome}
                      </p>
                      <p className="font-body text-[12.5px] text-muted-foreground truncate">
                        {l.descricao}
                      </p>
                    </div>
                  </button>
                ))}

              {modo === 'favoritos' &&
                (listaFiltrada(favoritos).length === 0 ? (
                  <p className="py-10 text-center font-body text-sm text-muted-foreground">
                    Nenhuma lei favoritada ainda.
                  </p>
                ) : (
                  listaFiltrada(favoritos).map((f) => (
                    <button
                      key={f.leiId}
                      onClick={() => onSelectLei(f)}
                      className="w-full text-left p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3 active:scale-[0.99] transition"
                    >
                      <LeiIcon icon={iconById(f.leiId)} color={colorById(f.leiId)} />
                      <div className="min-w-0">
                        <p className="font-display text-[15px] font-bold text-foreground truncate">{f.nome}</p>
                        <p className="font-body text-[12.5px] text-muted-foreground truncate">{f.descricao}</p>
                      </div>
                    </button>
                  ))
                ))}

              {modo === 'recentes' &&
                (listaFiltrada(recentes).length === 0 ? (
                  <p className="py-10 text-center font-body text-sm text-muted-foreground">
                    Você ainda não abriu nenhuma lei.
                  </p>
                ) : (
                  listaFiltrada(recentes).map((r) => (
                    <button
                      key={r.leiId}
                      onClick={() => onSelectLei(r)}
                      className="w-full text-left p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3 active:scale-[0.99] transition"
                    >
                      <LeiIcon icon={iconById(r.leiId)} color={colorById(r.leiId)} />
                      <div className="min-w-0">
                        <p className="font-display text-[15px] font-bold text-foreground truncate">{r.nome}</p>
                        <p className="font-body text-[12.5px] text-muted-foreground truncate">{r.descricao}</p>
                      </div>
                    </button>
                  ))
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuscaLeisOverlay;
