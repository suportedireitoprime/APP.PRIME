import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Gavel, Scale, FileText, ShieldAlert, Briefcase, CircleDollarSign, ShoppingCart, Baby, BookMarked, History, LucideIcon } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { getLeiColor, shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';
import { useEmAltaConfig } from '@/hooks/useEmAltaConfig';
import { HomeRecentesSheet } from './HomeRecentesSheet';

export interface EmAltaItem {
  id: string;
  tipo: string;
  title: string;
  sigla: string;
  sublabel: string;
  icon: LucideIcon;
}

const EM_ALTA_ITEMS: EmAltaItem[] = [
  {
    id: 'cf88',
    tipo: 'constituicao',
    title: 'Constituição Federal',
    sigla: 'CF/88',
    sublabel: 'Carta Magna · 1988',
    icon: Landmark,
  },
  {
    id: 'cp',
    tipo: 'codigo',
    title: 'Código Penal',
    sigla: 'CP',
    sublabel: 'Dec.-Lei 2.848/1940',
    icon: Gavel,
  },
  {
    id: 'cc',
    tipo: 'codigo',
    title: 'Código Civil',
    sigla: 'CC',
    sublabel: 'Lei 10.406/2002',
    icon: Scale,
  },
  {
    id: 'cpc',
    tipo: 'codigo',
    title: 'Processo Civil',
    sigla: 'CPC',
    sublabel: 'Lei 13.105/2015',
    icon: FileText,
  },
  {
    id: 'cpp',
    tipo: 'codigo',
    title: 'Processo Penal',
    sigla: 'CPP',
    sublabel: 'Dec.-Lei 3.689/1941',
    icon: ShieldAlert,
  },
  {
    id: 'clt',
    tipo: 'codigo',
    title: 'Leis do Trabalho',
    sigla: 'CLT',
    sublabel: 'Dec.-Lei 5.452/1943',
    icon: Briefcase,
  },
  {
    id: 'ctn',
    tipo: 'codigo',
    title: 'Tributário Nacional',
    sigla: 'CTN',
    sublabel: 'Lei 5.172/1966',
    icon: CircleDollarSign,
  },
  {
    id: 'cdc',
    tipo: 'codigo',
    title: 'Defesa do Consumidor',
    sigla: 'CDC',
    sublabel: 'Lei 8.078/1990',
    icon: ShoppingCart,
  },
  {
    id: 'eca',
    tipo: 'estatuto',
    title: 'Criança e Adolescente',
    sigla: 'ECA',
    sublabel: 'Lei 8.069/1990',
    icon: Baby,
  },
  {
    id: 'eoab',
    tipo: 'estatuto',
    title: 'Estatuto da OAB',
    sigla: 'EOAB',
    sublabel: 'Lei 8.906/1994',
    icon: BookMarked,
  },
];

const getIconForLei = (tipo: string, id: string) => {
  const original = EM_ALTA_ITEMS.find(i => i.id === id);
  if (original) return original.icon;
  if (tipo === 'codigo') return FileText;
  if (tipo === 'estatuto') return BookMarked;
  if (tipo === 'constituicao') return Landmark;
  return FileText;
};

// Função utilitária para embaralhar array (Fisher-Yates) no acesso
function shuffleArray<T>(items: readonly T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

interface HomeEmAltaCarouselProps {
  onSelectItem?: (item: EmAltaItem) => void;
  onOpenLei?: (id: string) => void;
}

const HomeEmAltaCarousel = ({ onSelectItem, onOpenLei }: HomeEmAltaCarouselProps) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const { config } = useEmAltaConfig();
  const [isRecentesOpen, setIsRecentesOpen] = useState(false);

  const displayItems = useMemo(() => {
    if (!config || config.length === 0) return EM_ALTA_ITEMS;

    return config.map(id => {
      const original = EM_ALTA_ITEMS.find(item => item.id === id);
      if (original) return original;
      
      const catalogItem = LEIS_CATALOG.find(l => l.id === id);
      if (catalogItem) {
        return {
          id: catalogItem.id,
          tipo: catalogItem.tipo,
          title: catalogItem.nome,
          sigla: catalogItem.sigla,
          sublabel: catalogItem.descricao || 'Lei',
          icon: getIconForLei(catalogItem.tipo, catalogItem.id)
        };
      }
      return null;
    }).filter(Boolean) as EmAltaItem[];
  }, [config]);

  const displayIdsKey = useMemo(() => displayItems.map((i) => i.id).join(','), [displayItems]);

  // Sorteia a ordem aleatória das leis ao acessar a tela (sem passar sozinho)
  const randomizedItems = useMemo(() => {
    return shuffleArray(displayItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayIdsKey]);

  const loopedItems = useMemo(() => {
    if (randomizedItems.length === 0) return [];
    // 4 cópias para permitir navegação infinita manual suave em ambas as direções
    return [...randomizedItems, ...randomizedItems, ...randomizedItems, ...randomizedItems];
  }, [randomizedItems]);

  const handleOpenItem = useCallback(
    (item: EmAltaItem) => {
      haptic.selection();
      if (onOpenLei) {
        onOpenLei(item.id);
        return;
      }
      if (onSelectItem) {
        onSelectItem(item);
        return;
      }
      const targetLei = LEIS_CATALOG.find((l) => l.id === item.id);
      if (targetLei) {
        navigate(leiPath(targetLei));
      } else {
        navigate(`/legislacao/${item.tipo}`);
      }
    },
    [navigate, onSelectItem, onOpenLei]
  );

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    if (randomizedItems.length > 0 && !isReady) {
      const initialIndex = randomizedItems.length;
      setActiveIndex(initialIndex);
      setTimeout(() => {
        scrollToIndex(initialIndex, 'instant' as ScrollBehavior);
        setIsReady(true);
      }, 50);
    }
  }, [randomizedItems.length, isReady, scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const mid = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }

    const N = randomizedItems.length;
    if (N > 0) {
      if (best <= 1) {
        const jumpTo = best + N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      } else if (best >= loopedItems.length - 2) {
        const jumpTo = best - N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      }
    }

    setActiveIndex(best);
  }, [randomizedItems.length, loopedItems.length]);

  return (
    <section className="space-y-3.5">
      {/* Cabeçalho "EM ALTA" */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 uppercase tracking-[0.05em]">
            <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="truncate">LEIS EM ALTA</span>
          </h3>
          <p className="font-sans text-white/50 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate mt-0.5">
            As leis e normas mais acessadas no momento
          </p>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            setIsRecentesOpen(true);
          }}
          className="group shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-[11.5px] sm:text-[12px] font-semibold text-white/80 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-all" />
          <span>Recentes</span>
        </button>
      </div>

      {/* Faixa Carrossel Horizontal Manual (a pessoa que passa, sem passar só) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-74px)] sm:px-[calc(50vw-81px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
      >
        {loopedItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          const baseColor = getLeiColor(item.id, item.tipo);

          let coverImage = null;
          if (item.id === 'cdc') coverImage = '/assets/cdc-girl.webp';
          else if (item.id === 'clt') coverImage = '/assets/cdc-worker.webp';
          else if (item.id === 'cpp') coverImage = '/assets/cpp-court.webp';
          else if (item.id === 'cpc') coverImage = '/assets/cpc-lawyer.webp';
          else if (item.id === 'cc') coverImage = '/assets/cc-couple.webp';
          else if (item.id === 'cf88') coverImage = '/assets/cf88-cover.webp';
          else if (item.id === 'ctb') coverImage = '/assets/ctb-traffic.webp';
          else if (['cp', 'lep'].includes(item.id)) coverImage = '/assets/homem-preso-novo.webp';
          else if (item.id === 'ctn') coverImage = '/assets/ctn-taxes.webp';
          else if (item.id === 'eca') coverImage = '/assets/eca-kids.webp';
          else if (item.id === 'eoab') coverImage = '/assets/eoab-woman-fixed.webp';
          else if (item.id === 'epd') coverImage = '/assets/epd-wheelchair.webp';
          else if (item.id === 'ce') coverImage = '/assets/ce-vote.webp';
          else if (item.id === 'eir') coverImage = '/assets/eir-woman.webp';
          else if (item.id === 'ei') coverImage = '/assets/ei-idoso.webp';
          else if (item.id === 'eind') coverImage = '/assets/eind-indio.png';

          return (
            <button
              key={`${item.id}-${i}`}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                handleOpenItem(item);
              }}
              className={`snap-center shrink-0 min-w-[138px] max-w-[148px] sm:min-w-[152px] sm:max-w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative flex flex-col rounded-2xl group transition-all duration-400 ease-out ${
                isActive
                  ? 'scale-[1.02] opacity-100 z-10 shadow-xl'
                  : 'scale-[0.94] opacity-75 z-0 shadow-sm'
              }`}
            >
              <div 
                className={`absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-all duration-300 ${isActive ? 'shadow-lg ring-1 ring-white/15' : 'shadow-sm group-hover:opacity-100 opacity-95'}`}
                style={{ background: `linear-gradient(135deg, ${baseColor} 0%, ${shade(baseColor, -0.3)} 100%)` }}
              >
                <Icon
                  className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-22 sm:h-22 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                  strokeWidth={1.3}
                />
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
              </div>

              {coverImage && (
                <div
                  className={`absolute right-0 w-auto h-[96px] sm:h-[100px] max-w-none pointer-events-none z-10 transform-gpu origin-bottom transition-all duration-500 ease-out ${
                    isActive
                      ? 'scale-[1.08] sm:scale-[1.10] -top-3.5 sm:-top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] opacity-100'
                      : 'scale-[0.86] -top-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] opacity-60'
                  }`}
                >
                  <img
                    src={coverImage}
                    alt={`Capa ${item.sigla}`}
                    className="h-full w-auto object-contain select-none pointer-events-none"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                <div className="flex justify-between items-start">
                  <Icon
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                    strokeWidth={1.8}
                  />
                </div>
                
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col">
                    <span className="font-display text-white text-[24px] sm:text-[26px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none">
                      {item.id === 'ei' ? 'IDOSO' : item.sigla}
                    </span>
                    <span className="text-white/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {item.tipo === 'codigo' ? 'Código' : item.tipo === 'estatuto' ? 'Estatuto' : item.tipo === 'constituicao' ? 'Constituição' : 'Lei'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Indicador de Paginação */}
      <CarouselDots total={randomizedItems.length} activeIndex={randomizedItems.length > 0 ? activeIndex % randomizedItems.length : 0} />

      <HomeRecentesSheet 
        isOpen={isRecentesOpen}
        onClose={() => setIsRecentesOpen(false)}
        onOpenLei={(leiId) => {
          if (onOpenLei) {
            onOpenLei(leiId);
            return;
          }
          const targetLei = LEIS_CATALOG.find((l) => l.id === leiId);
          if (targetLei) {
            navigate(leiPath(targetLei));
          } else {
            navigate(`/legislacao/${leiId}`);
          }
        }}
      />
    </section>
  );
};

export default memo(HomeEmAltaCarousel);

