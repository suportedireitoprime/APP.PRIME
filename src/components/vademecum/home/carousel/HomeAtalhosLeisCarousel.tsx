import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  SlidersHorizontal,
  Search,
  Check,
  Plus,
  RotateCcw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Scale,
  BookMarked,
  Sparkles,
  Landmark,
  Sword,
  Home,
  FileText,
  Gavel,
  Briefcase,
  ShoppingCart,
  Car,
  Vote,
  Shield,
  Trees,
  Ship,
  Plane,
  Droplets,
  Pickaxe,
  Radio,
  Baby,
  HeartPulse,
  Accessibility,
  Handshake,
  Building2,
  Trophy,
  Tent,
  Mountain,
  Globe2,
  Store,
  Ribbon,
  Palette,
  History,
} from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { getLeiColor, shade } from '@/lib/leiTheme';
import { HomeRecentesSheet } from './HomeRecentesSheet';

const STORAGE_KEY = 'home_atalhos_leis_v5';
const MAX_ATALHOS = 13;

/** Ordem padrão solicitada: CF, CPC, CC, CP, CPP, CLT + restantes */
const DEFAULT_ATALHOS_IDS = [
  'cf88', // 1. CF/88
  'cpc',  // 2. CPC
  'cc',   // 3. Código Civil
  'cp',   // 4. Código Penal
  'cpp',  // 5. Código de Processo Penal
  'clt',  // 6. CLT
  'cdc',  // 7. CDC
  'ctn',  // 8. CTN
  'eoab', // 9. EOAB
  'eca',  // 10. ECA
  'epd',  // 11. Estatuto PCD
  'ce',   // 12. Código Eleitoral
];

interface AlternanciaTab {
  id: string;
  label: string;
}

const ALTERNANCIA_TABS: AlternanciaTab[] = [
  { id: 'em-alta', label: 'Em Alta' },
  { id: 'todos', label: 'Todas' },
  { id: 'penal', label: 'Penal' },
  { id: 'civil', label: 'Civil' },
  { id: 'constitucional', label: 'Constitucional' },
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'tributario', label: 'Tributário' },
  { id: 'estatutos', label: 'Estatutos' },
  { id: 'administrativo', label: 'Administrativo' },
];

const CATEGORY_MAP: Record<string, string[]> = {
  penal: [
    'cp', 'cpp', 'cpm', 'cppm', 'lep', 'lmp', 'ld', 'loc', 'laa', 'lit',
    'lch', 'ltort', 'lcsf', 'lpt', 'lcp', 'lat', 'lci'
  ],
  civil: [
    'cc', 'cpc', 'cdc', 'li', 'lrp', 'lalim', 'lalp', 'lgpd', 'mci',
    'cflor', 'ccom', 'la'
  ],
  constitucional: [
    'cf88', 'lindb', 'lpaf', 'lai', 'lap', 'lmi', 'lms', 'lhd'
  ],
  trabalho: [
    'clt'
  ],
  tributario: [
    'ctn', 'lrf', 'lrt', 'lcsf'
  ],
  estatutos: [
    'eca', 'ei', 'epd', 'eir', 'ec', 'ed', 'eoab', 'et', 'ej', 'em',
    'eind', 'eterra', 'emig', 'eref', 'emet', 'emus', 'eme', 'epc'
  ],
  administrativo: [
    'lia', 'lpaf', 'nll', 'lai', 'lms', 'l8112', 'loman', 'lotcu',
    'ces', 'lcon', 'lppp', 'lace'
  ],
};

const LAW_ICON_MAP: Record<string, React.ElementType> = {
  // Constituição
  cf88: Landmark,
  // Códigos — ícone representativo do tema
  cp: Sword,
  cc: Home,
  cpc: FileText,
  cpp: Gavel,
  ctn: Landmark,
  cdc: ShoppingCart,
  clt: Briefcase,
  ctb: Car,
  ce: Vote,
  cpm: Shield,
  cppm: Shield,
  cflor: Trees,
  ccom: Ship,
  cba: Plane,
  cagua: Droplets,
  cmin: Pickaxe,
  ctel: Radio,
  // Estatutos
  eca: Baby,
  ei: HeartPulse,
  epd: Accessibility,
  eir: Handshake,
  ec: Building2,
  ed: Sword,
  eoab: Scale,
  et: Trophy,
  ej: Sparkles,
  em: Shield,
  eind: Tent,
  eterra: Mountain,
  emig: Globe2,
  eref: Globe2,
  emet: Building2,
  emus: Palette,
  eme: Store,
  epc: Ribbon,
  // Fallbacks
  constituicao: Landmark,
  codigo: Scale,
  estatuto: BookMarked,
};

function getLawIcon(id: string, tipo?: string): React.ElementType {
  if (LAW_ICON_MAP[id]) return LAW_ICON_MAP[id];
  if (tipo && LAW_ICON_MAP[tipo]) return LAW_ICON_MAP[tipo];
  return Scale;
}

interface Props {
  onOpenLei: (leiId: string) => void;
}

function HomeAtalhosLeisCarousel({ onOpenLei }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ATALHOS_IDS;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('em-alta');

  const activeLeis = useMemo(() => {
    const map = new Map<string, LeiCatalogItem>();
    LEIS_CATALOG.forEach((lei) => map.set(lei.id, lei));
    return selectedIds
      .map((id) => map.get(id))
      .filter((item): item is LeiCatalogItem => Boolean(item));
  }, [selectedIds]);

  const filteredCatalog = useMemo(() => {
    let list: LeiCatalogItem[];

    if (activeTab === 'em-alta') {
      const map = new Map<string, LeiCatalogItem>();
      LEIS_CATALOG.forEach((lei) => map.set(lei.id, lei));
      list = selectedIds
        .map((id) => map.get(id))
        .filter((item): item is LeiCatalogItem => Boolean(item));
    } else if (activeTab === 'todos') {
      list = LEIS_CATALOG;
    } else if (CATEGORY_MAP[activeTab]) {
      const allowedIds = new Set(CATEGORY_MAP[activeTab]);
      list = LEIS_CATALOG.filter((l) => allowedIds.has(l.id));
    } else {
      list = LEIS_CATALOG;
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;

    return list.filter(
      (lei) =>
        lei.sigla.toLowerCase().includes(term) ||
        lei.nome.toLowerCase().includes(term) ||
        lei.descricao.toLowerCase().includes(term) ||
        lei.tags?.some((t) => t.toLowerCase().includes(term))
    );
  }, [activeTab, selectedIds, searchTerm]);

  const toggleLei = useCallback((id: string) => {
    setSelectedIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.error('Mantenha pelo menos 1 atalho selecionado.');
          return prev;
        }
        next = prev.filter((item) => item !== id);
        toast.info('Atalho removido do Em Alta');
      } else {
        if (prev.length >= MAX_ATALHOS) {
          toast.warning(`Limite de ${MAX_ATALHOS} atalhos atingido. Remova um atalho no "Em Alta" para adicionar outro.`);
          return prev;
        }
        next = [...prev, id];
        toast.success('Atalho adicionado ao Em Alta!');
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    setSelectedIds(DEFAULT_ATALHOS_IDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ATALHOS_IDS));
    } catch {}
    toast.success('Atalhos restaurados para o padrão.');
  }, []);

  const moveLei = useCallback((id: string, direction: 'up' | 'down') => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <section className="space-y-3">
      {/* Cabeçalho da Seção com alinhamento px-1 idêntico a Legislação Brasileira */}
      <div className="px-1 min-h-[50px] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-foreground text-[18px] font-bold uppercase flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
            <span className="truncate">Em Alta</span>
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 truncate">
            Meus atalhos de leis mais consultadas
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setModalOpen(true);
          }}
          aria-label="Leis Recentes"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card hover:bg-neutral-800 px-3.5 py-1.5 text-[12px] font-semibold text-foreground active:scale-[0.96] transition-all shadow-sm cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-primary" />
          <span>Recentes</span>
        </button>
      </div>

      {/* Carrossel Horizontal de Cards Vermelhos Bordô (Design APP.PRIME) — Sem margem lateral à direita */}
      <div className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 -mt-10">
        <div
          tabIndex={0}
          aria-label="Carrossel de atalhos de leis em alta"
          className="flex items-center gap-2.5 overflow-x-auto px-4 sm:px-6 md:px-8 lg:px-12 pb-4 pt-10 scrollbar-none focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeLeis.map((lei) => {
            const LawIcon = getLawIcon(lei.id, lei.tipo);
            const baseColor = getLeiColor(lei.id, lei.tipo);
            
            let coverImage = null;
            if (lei.id === 'cdc') coverImage = '/assets/cdc-girl.webp';
            else if (lei.id === 'clt') coverImage = '/assets/cdc-worker.webp';
            else if (lei.id === 'cpp') coverImage = '/assets/cpp-court.webp';
            else if (lei.id === 'cpc') coverImage = '/assets/cpc-lawyer.webp';
            else if (lei.id === 'cc') coverImage = '/assets/cc-couple.webp';
            else if (lei.id === 'cf88') coverImage = '/assets/cf88-cover.webp';
            else if (lei.id === 'ctb') coverImage = '/assets/ctb-traffic.webp';
            else if (['cp', 'lep'].includes(lei.id)) coverImage = '/assets/homem-preso-novo.webp';
            else if (lei.id === 'ctn') coverImage = '/assets/ctn-taxes.webp';
            else if (lei.id === 'eca') coverImage = '/assets/eca-kids.webp';
            else if (lei.id === 'eoab') coverImage = '/assets/eoab-woman-fixed.webp';
            else if (lei.id === 'epd') coverImage = '/assets/epd-wheelchair.webp';
            else if (lei.id === 'ce') coverImage = '/assets/ce-vote.webp';
            else if (lei.id === 'eir') coverImage = '/assets/eir-woman.webp';
            else if (lei.id === 'ei') coverImage = '/assets/ei-idoso.webp';
            else if (lei.id === 'eind') coverImage = '/assets/eind-indio.png';

            return (
              <button
                key={lei.id}
                type="button"
                onClick={() => onOpenLei(lei.id)}
                className="border-0 min-w-[138px] max-w-[148px] sm:min-w-[152px] sm:max-w-[162px] h-[116px] sm:h-[122px] shrink-0 rounded-2xl relative flex flex-col text-left cursor-pointer select-none active:scale-[0.96] transition-all shadow-md group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {/* Fundo com clip para a cor e o ícone de marca d'água */}
                <div 
                  className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${baseColor} 0%, ${shade(baseColor, -0.3)} 100%)` }}
                >
                  {/* Ícone temático no fundo transparente */}
                  <LawIcon
                    className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-22 sm:h-22 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                    strokeWidth={1.3}
                  />
                  {/* Brilho suave no topo do card */}
                  <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
                </div>

                {coverImage && (
                  <img
                    src={coverImage}
                    alt={`Capa da lei ${lei.sigla}`}
                    className="absolute -top-6 right-0 h-[118px] w-auto max-w-none object-contain pointer-events-none z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-all duration-300"
                  />
                )}

                {/* Conteúdo visível (Sigla da lei no fundo e ícone no canto superior) */}
                <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                  {/* Canto superior (Opcional, apenas um pequeno destaque) */}
                  <div className="flex justify-between items-start">
                    <LawIcon
                      className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                      strokeWidth={1.8}
                    />
                  </div>
                  
                  {/* Canto inferior (Abreviatura) */}
                  <div className="flex justify-between items-end mt-auto">
                    <span className="font-display text-white text-[24px] sm:text-[26px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {lei.sigla}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-1"
                      strokeWidth={2.4}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Bottom Sheet de Recentes */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <HomeRecentesSheet
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onOpenLei={onOpenLei}
        />,
        document.body
      )}
    </section>
  );
}

export default HomeAtalhosLeisCarousel;
