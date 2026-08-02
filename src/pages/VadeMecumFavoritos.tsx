import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HeartOff, Heart, Scale, Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFavoritos, LEIS_FAVORITOS_EVENT, type LeiFavorita } from '@/lib/leisFavoritos';
import {
  ARTIGOS_FAV_EVENT,
  listArtigosFavoritos,
  type ArtigoFav,
} from '@/lib/artigosFavoritos';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { LEIS_CATALOG, getLeiByTabela, type LeiCatalogItem } from '@/data/leisCatalog';
import { LEI_ICON_MAP, LEI_ICON_DEFAULT_COLOR } from '@/lib/leiIcons';
import VadeMecumSubpage from '@/components/vademecum/VadeMecumSubpage';

type Modo = 'leis' | 'artigos';

const iconById = (id: string) => LEI_ICON_MAP[id] ?? Scale;
const colorById = (id: string) =>
  LEIS_CATALOG.find((l) => l.id === id)?.iconColor ?? LEI_ICON_DEFAULT_COLOR;

/** Ícone da lei sem fundo, com reflexo suave. */
const LeiIcon = ({ id, size = 24 }: { id: string; size?: number }) => {
  const Icon = iconById(id);
  const color = colorById(id);
  return (
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      <Icon
        className="relative z-10"
        style={{ color, width: size, height: size, filter: 'saturate(1.6) brightness(1.15)' }}
        strokeWidth={1.7}
      />
      <motion.div
        className="absolute left-1/2 top-[62%] -translate-x-1/2 pointer-events-none"
        style={{ width: size, height: size * 0.5 }}
        animate={{ opacity: [0.18, 0.4, 0.18] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-full h-full blur-[6px] rounded-full"
          style={{ background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)` }}
        />
      </motion.div>
    </div>
  );
};

type GrupoArtigos = {
  lei: LeiCatalogItem;
  artigos: ArtigoFav[];
};

const VadeMecumFavoritos = () => {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('leis');
  const [favoritos, setFavoritos] = useState<LeiFavorita[]>([]);
  const [artigos, setArtigos] = useState<ArtigoFav[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(true);

  useEffect(() => {
    const refreshLeis = () => setFavoritos(getFavoritos());
    refreshLeis();
    window.addEventListener(LEIS_FAVORITOS_EVENT, refreshLeis);
    window.addEventListener('storage', refreshLeis);
    return () => {
      window.removeEventListener(LEIS_FAVORITOS_EVENT, refreshLeis);
      window.removeEventListener('storage', refreshLeis);
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      listArtigosFavoritos()
        .then((r) => { if (!cancel) setArtigos(r); })
        .finally(() => { if (!cancel) setLoadingArtigos(false); });
    };
    load();
    window.addEventListener(ARTIGOS_FAV_EVENT, load);
    return () => { cancel = true; window.removeEventListener(ARTIGOS_FAV_EVENT, load); };
  }, []);

  const grupos: GrupoArtigos[] = useMemo(() => {
    const map = new Map<string, GrupoArtigos>();
    for (const a of artigos) {
      const lei = getLeiByTabela(a.tabela_codigo);
      if (!lei) continue;
      const g = map.get(lei.id) ?? { lei, artigos: [] };
      g.artigos.push(a);
      map.set(lei.id, g);
    }
    return Array.from(map.values());
  }, [artigos]);

  const abrirLei = (lei: { tipo: string; id: string; nome: string }) =>
    navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.id, nome: lei.nome })}`);

  const abrirArtigo = (lei: LeiCatalogItem, numero: string) =>
    navigate(
      `/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug(lei)}/${encodeURIComponent(numero)}`,
    );

  return (
    <VadeMecumSubpage titulo="Favoritos" descricao="Suas leis e artigos salvos para acesso rápido">
      {/* Alternância Leis / Artigos */}
      <div className="flex items-center gap-2 p-1 rounded-full bg-muted/40 border border-border w-full max-w-xs mx-auto mb-5">
        {([
          { key: 'leis' as Modo, label: 'Leis', icon: Scale, count: favoritos.length },
          { key: 'artigos' as Modo, label: 'Artigos', icon: FileText, count: artigos.length },
        ]).map(({ key, label, icon: Icon, count }) => {
          const active = modo === key;
          return (
            <button
              key={key}
              onClick={() => setModo(key)}
              className={`relative flex-1 h-9 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span className={`text-[10px] ${active ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {modo === 'leis' ? (
        favoritos.length === 0 ? (
          <div className="text-center py-16">
            <HeartOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Você ainda não favoritou nenhuma lei.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoritos.map((l) => (
              <button
                key={l.leiId}
                onClick={() => {
                  pushRecente(l);
                  abrirLei({ tipo: l.tipo, id: l.leiId, nome: l.nome });
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
              >
                <LeiIcon id={l.leiId} />
                <span className="min-w-0 flex-1">
                  <span className="block text-foreground font-semibold text-sm truncate">{l.nome}</span>
                  <span className="block text-muted-foreground text-xs truncate">{l.descricao}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )
      ) : loadingArtigos ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-1" />
          <p className="text-muted-foreground text-sm">Você ainda não favoritou nenhum artigo.</p>
          <p className="text-xs text-muted-foreground">
            Abra uma lei e toque no coração dentro do artigo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <section key={g.lei.id}>
              <button
                onClick={() => abrirLei({ tipo: g.lei.tipo, id: g.lei.id, nome: g.lei.nome })}
                className="w-full flex items-center gap-3 text-left mb-2"
              >
                <LeiIcon id={g.lei.id} size={22} />
                <span className="min-w-0 flex-1">
                  <span className="block text-foreground font-semibold text-sm truncate">
                    {g.lei.nome}
                  </span>
                  <span className="block text-muted-foreground text-[11px]">
                    {g.artigos.length} {g.artigos.length === 1 ? 'artigo favoritado' : 'artigos favoritados'}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>

              {/* Carrossel de quadradinhos com os números dos artigos */}
              <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2.5 pb-1">
                  {g.artigos.map((a, i) => (
                    <motion.button
                      key={`${a.tabela_codigo}-${a.numero_artigo}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                      onClick={() => abrirArtigo(g.lei, a.numero_artigo)}
                      className="shrink-0 w-[76px] h-[76px] rounded-2xl bg-card border border-border hover:border-primary/60 transition-colors flex flex-col items-center justify-center gap-0.5"
                      title={a.conteudo_preview ?? `Art. ${a.numero_artigo}`}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Art.
                      </span>
                      <span
                        className="font-display text-lg font-bold leading-none truncate max-w-[64px]"
                        style={{ color: colorById(g.lei.id) }}
                      >
                        {a.numero_artigo}
                      </span>
                      <Heart className="w-3 h-3 text-primary fill-primary mt-0.5" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </VadeMecumSubpage>
  );
};

export default VadeMecumFavoritos;
