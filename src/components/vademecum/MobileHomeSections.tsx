import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Accessibility, Baby, Banknote, BellRing, BookA, BookMarked, BookOpen, Briefcase, BriefcaseBusiness, Building,
  Brain, Headphones, Library, Video,

  Cannabis, Car, ChevronRight, CircleDollarSign, Clock, Columns3, Cross, Drama,
  Droplets, Factory, FileCheck, FileLock, FileText, FileWarning, Flame, Gavel,
  Globe, GraduationCap, HandCoins, Handshake, HeartPulse, Hospital, House, IdCard, Layers, Monitor,
  Landmark, LandPlot, LayoutGrid, Leaf, List, Map, MapPin, Mic, MicOff, Network, NotebookPen,
  PiggyBank, Plane, PocketKnife, RadioTower, ReceiptText, Scale, Scroll, ScrollText, Search,
  Shield, ShieldAlert, ShieldCheck, ShieldX, Ship, ShoppingCart, Siren, Award, Sprout, Stamp, Store,
  Tractor, TreePine, Users, Vote, Wallet, Wifi, X, type LucideIcon,
  Presentation, FolderOpen, RefreshCw, MessageCircle, Heart, Newspaper, Radar, History, ChevronLeft,
} from 'lucide-react';
import { estiloPasta } from '@/lib/documentosTipos';
import { usePastasDocumentos } from '@/hooks/useDocumentosDrive';
import DocumentosSheet from '@/components/documentos/DocumentosSheet';
import { CalendarCheck, CalendarDays, Inbox } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';


import { LEIS_CATALOG } from '@/data/leisCatalog';
import { ESTADOS } from '@/pages/LegislacaoEstadual';
import { LEI_ICON_MAP } from '@/lib/leiIcons';

import { PillarIcon } from '@/components/icons/PillarIcon';
import { leiPath, tipoToSlug } from '@/lib/legislacaoSlugs';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import VoiceCaptureOverlay from './VoiceCaptureOverlay';
import HomeNoticiasCarousel from './HomeNoticiasCarousel';
import AprendaSobreLeis from './AprendaSobreLeis';
import NoticiasJuridicasCarousel from './NoticiasJuridicasCarousel';
import HomeCard from './HomeCard';
import ContinueLendoCard from './ContinueLendoCard';
import { toast } from '@/hooks/use-toast';
import { useOutrasNormasCounts } from '@/hooks/useOutrasNormasCounts';
import JurisprudenciaSheet from './JurisprudenciaSheet';
const VisuaisJuridicosSheet = lazy(() => import('@/components/visuais/VisuaisJuridicosSheet'));
import { TIPO_SLUG } from '@/lib/visuaisJuridicos/rotas';
import { bandeiraUF } from '@/data/estadoFlags';



interface Cat {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
}

const GRID_CATS: Cat[] = [
  { id: 'constituicao',    label: 'Constituição',    sublabel: 'CF/88',                     icon: Landmark,   color: '#d97706' },
  { id: 'codigo',          label: 'Códigos',         sublabel: 'Civil, Penal, Processo…',   icon: Gavel,      color: '#dc2626' },
  { id: 'estatuto',        label: 'Estatutos',       sublabel: 'ECA, Idoso, OAB…',          icon: BookMarked, color: '#0284c7' },
  { id: 'jurisprudencia',  label: 'Jurisprudência',  sublabel: 'STF, STJ, Vinculantes',     icon: Scale,      color: '#059669' },
  { id: 'lei-ordinaria',   label: 'Leis Ordinárias', sublabel: 'Federais complementares',   icon: Columns3,   color: '#ea580c' },
  { id: 'lei-especial',    label: 'Penal Especial',  sublabel: 'Leis penais extravagantes', icon: PocketKnife, color: '#475569' },
];

// Cards de "Outras normas" que apontam para o Radar 360 com filtro pré-selecionado
type RadarCat = Cat & { radarTipo: string; normaSlug: string };
const RADAR_CATS: RadarCat[] = [
  { id: 'radar-lei',       label: 'Leis Ordinárias',     sublabel: 'Leis ordinárias publicadas no DOU',   icon: Scroll,     color: 'hsl(348 78% 38%)', radarTipo: 'Lei',                normaSlug: 'leis' },
  { id: 'radar-lc',        label: 'Leis Complementares', sublabel: 'Complementares à Constituição',       icon: Stamp,      color: 'hsl(348 78% 38%)', radarTipo: 'Lei Complementar',   normaSlug: 'leis-complementares' },
  { id: 'radar-decreto',   label: 'Decretos',            sublabel: 'Regulamentos do Executivo',           icon: Stamp,      color: 'hsl(348 78% 38%)', radarTipo: 'Decreto',            normaSlug: 'decretos' },
  { id: 'radar-mp',        label: 'Medidas Provisórias', sublabel: 'Editadas pelo Presidente',            icon: FileWarning,color: 'hsl(348 78% 38%)', radarTipo: 'Medida Provisória',  normaSlug: 'medidas-provisorias' },
];

const LIST_CATS: Cat[] = [
  { id: 'decreto',         label: 'Decretos (Coleção)', sublabel: 'Regulamentos do Executivo', icon: Stamp,      color: 'hsl(348 78% 38%)' },
];

const ALL_CATS: Cat[] = [...GRID_CATS, ...LIST_CATS];

interface AreaCat extends Cat { leiIds: string[]; }

const AREA_CATS: AreaCat[] = [
  { id: 'area-penal',          label: 'Direito Penal',          sublabel: 'CP, CPP, LEP, Lei Maria da Penha…',          icon: ShieldAlert, color: 'hsl(348 78% 38%)', leiIds: ['cp','cpp','lep','lmp','ld','loc','laa','lcp','lch','ltort','lcsf','lpt','laa'] },
  { id: 'area-civil',          label: 'Direito Civil',          sublabel: 'CC, LI, LRP, alimentos, alienação…',          icon: House,       color: '#3B82F6', leiIds: ['cc','li','lrp','lalim','lalp','lgpd','mci','ld','laa'] },
  { id: 'area-tributario',     label: 'Direito Tributário',     sublabel: 'CTN, LRF, Reforma Tributária…',              icon: CircleDollarSign, color: '#10B981', leiIds: ['ctn','lrf','lrt'] },
  { id: 'area-constitucional', label: 'Direito Constitucional', sublabel: 'CF/88, LINDB, LPAF, LAI…',                  icon: Landmark,    color: '#FFD400', leiIds: ['cf88','lindb','lpaf','lai','lap','lap','lmi','lms','lhd'] },
  { id: 'area-processual-civil',  label: 'Direito Processual Civil',  sublabel: 'CPC, LJE, mandado de segurança…',       icon: FileText,    color: '#DC2626', leiIds: ['cpc','lje','lms','lmi','lhd'] },
  { id: 'area-processual-penal',  label: 'Direito Processual Penal',  sublabel: 'CPP, interceptação, mandado…',        icon: ShieldCheck, color: '#F97316', leiIds: ['cpp','lit','lpt','lms'] },
  { id: 'area-trabalho',       label: 'Direito do Trabalho',    sublabel: 'CLT, legislação trabalhista…',              icon: Briefcase,   color: '#8B5CF6', leiIds: ['clt'] },
  { id: 'area-empresarial',    label: 'Direito Empresarial',    sublabel: 'CCom, LSA, LF, arbitragem, startups…',      icon: Store,       color: '#A855F7', leiIds: ['ccom','lsa','lf','la','lpi','lace','lcon','lppp','lmls','lda','eme','lfl'] },
  { id: 'area-administrativo', label: 'Direito Administrativo', sublabel: 'LIA, LPAF, licitações, improbidade…',       icon: Building,    color: '#06B6D4', leiIds: ['lia','lpaf','nll','lai','lms','l8112','loman','lotcu','ces'] },
  { id: 'area-eleitoral',      label: 'Direito Eleitoral',      sublabel: 'CE, LPP, Lei das Eleições, Ficha Limpa…',   icon: Vote,        color: '#6366F1', leiIds: ['ce','lpp','lele','lfl','line'] },
  { id: 'area-previdenciario', label: 'Direito Previdenciário', sublabel: 'LBPS, LCSS, LPC, LOAS…',                    icon: HeartPulse,  color: '#14B8A6', leiIds: ['lbps','lcss','lpc','loas'] },
  { id: 'area-ambiental',      label: 'Direito Ambiental',      sublabel: 'Código Florestal, crimes ambientais, biossegurança…', icon: TreePine, color: '#16A34A', leiIds: ['cflor','lca','lbio'] },
  { id: 'area-consumidor',     label: 'Direito do Consumidor',  sublabel: 'CDC, defesa do consumidor…',                icon: ShoppingCart, color: '#EC4899', leiIds: ['cdc'] },
  { id: 'area-crianca-idoso',  label: 'Criança, Idoso e PCD',   sublabel: 'ECA, Estatuto do Idoso, EPD…',              icon: Baby,        color: '#F43F5E', leiIds: ['eca','ei','epd'] },
  { id: 'area-militar',        label: 'Direito Militar',        sublabel: 'CPM, CPPM, Estatuto dos Militares…',        icon: Shield,      color: '#64748B', leiIds: ['cpm','cppm','em'] },
  { id: 'area-internacional',  label: 'Direito Internacional',  sublabel: 'Estatuto da Migração, Refugiado…',          icon: Globe,       color: '#0891B2', leiIds: ['emig','eref'] },
];

interface CategoriaFormal extends Cat { route?: string; leiIds?: string[]; }

const CATEGORIA_CATS: CategoriaFormal[] = [
  { id: 'cat-federais',      label: 'Leis Federais',      sublabel: 'Constituição, Códigos, Estatutos…', icon: Stamp, color: 'hsl(348 78% 38%)', leiIds: LEIS_CATALOG.map(l => l.id) },
  { id: 'cat-estadual',      label: 'Legislação Estadual', sublabel: '27 unidades federativas',           icon: Map,        color: '#38BDF8', route: '/legislacao-estadual' },
  { id: 'cat-jurisprudencia',label: 'Jurisprudência',      sublabel: 'STF, STJ, Súmulas Vinculantes',     icon: Gavel,      color: '#EC4899' },
  { id: 'cat-oab',           label: 'OAB',                 sublabel: 'Estatuto, ética e advocacia',       icon: Scale,      color: '#1D4ED8' },
  { id: 'cat-decretos',      label: 'Decretos',            sublabel: 'Regulamentos do Executivo',         icon: Stamp,      color: 'hsl(348 78% 38%)', route: '/normas/decretos' },
];

const JURI_OPCOES = [
  { id: 'STF_VINCULANTE', nome: 'Súmulas Vinculantes', desc: 'Efeito vinculante para o Judiciário' },
  { id: 'STF',            nome: 'Súmulas do STF',      desc: 'Supremo Tribunal Federal' },
  { id: 'STJ',            nome: 'Súmulas do STJ',      desc: 'Superior Tribunal de Justiça' },
];

// Aba "Em Alta" — funções de estudo (evita repetir o que já existe no Vade Mecum)
type EmAltaCat = Cat & { route: string; emBreve?: boolean };
const EMALTA_CATS: EmAltaCat[] = [
  { id: 'ea-biblioteca',  label: 'Biblioteca',     sublabel: 'Livros, clássicos e coleções',   icon: Library,     color: 'hsl(var(--primary))', route: '/bibliotecas' },
  { id: 'ea-videoaulas',  label: 'Videoaulas',     sublabel: 'Aulas em vídeo por área',        icon: Video,       color: 'hsl(var(--primary))', route: '/videoaulas' },
  { id: 'ea-resumos',     label: 'Resumos',        sublabel: 'Resumos jurídicos por tema',     icon: NotebookPen, color: 'hsl(var(--primary))', route: '/resumos-juridicos' },
  { id: 'ea-audioaulas',  label: 'Audioaulas',     sublabel: 'Estude ouvindo, onde estiver',   icon: Headphones,  color: 'hsl(var(--primary))', route: '/audioaulas' },
  { id: 'ea-mapas',       label: 'Mapas Mentais',  sublabel: 'Mapas, infográficos e fluxogramas',    icon: Brain,       color: 'hsl(var(--primary))', route: '/assistente' },
  { id: 'ea-dicionario',  label: 'Dicionário',     sublabel: 'Termos jurídicos explicados',    icon: BookA,       color: 'hsl(var(--primary))', route: '/ferramentas/dicionario' },
  { id: 'ea-lei-seca',    label: 'Lei Seca',       sublabel: 'Treine o texto da lei por área',  icon: Scale,       color: 'hsl(var(--primary))', route: '/lei-seca' },
  { id: 'ea-apresentacao', label: 'Apresentação',  sublabel: 'Aulas narradas em slides',       icon: Presentation, color: 'hsl(var(--primary))', route: '/apresentacoes' },
];


type Tab = 'agenda' | 'estudos' | 'faculdade' | 'documentos' | 'categorias' | 'emalta' | 'areas';

const TABS_HOME: { id: Tab; label: string; icon: any }[] = [
  { id: 'agenda',     label: 'Pendências',     icon: CalendarCheck },
  { id: 'estudos',    label: 'Estudos',    icon: GraduationCap },
  { id: 'faculdade',  label: 'Faculdade',  icon: Library },
];

const TABS_VADEMECUM: { id: Tab; label: string; icon: any }[] = [
  { id: 'categorias', label: 'Categorias', icon: LayoutGrid },
  { id: 'emalta',     label: 'Em Alta',     icon: Flame },
  { id: 'areas',      label: 'Áreas',       icon: Scale },
];





const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }
  return days;
}

interface Props {
  onTabChange?: (tab: Tab) => void;
  onNewsOpenChange?: (open: boolean) => void;
  /** Oculta a seção "Aprenda sobre as Leis" (blog jurídico). */
  hideBlog?: boolean;
  /** Oculta o carrossel de notícias/blogger do topo. */
  hideNoticias?: boolean;
  /** Controla o avanço automático do carrossel de notícias. */
  noticiasAutoplay?: boolean;
  /** Na aba "Em Alta", mostra categorias de leis em vez das funções de estudo. */
  emAltaLeis?: boolean;
  /** Oculta o menu de abas do topo */
  hideTabs?: boolean;
  /** Força a aba ativa */
  activeTab?: Tab;
  /** Passado para renderizar o buscador */
  onBuscar?: () => void;
}

const MobileHomeSections = ({ onTabChange, onNewsOpenChange, hideBlog = false, hideNoticias = false, noticiasAutoplay = true, emAltaLeis = false, hideTabs = false, activeTab, onBuscar }: Props = {}) => {
  const navigate = useNavigate();
  const [juriOpen, setJuriOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState<Cat | AreaCat | CategoriaFormal | null>(null);
  const [visuaisOpen, setVisuaisOpen] = useState(false);
  const [docPasta, setDocPasta] = useState<{ id: string; nome: string } | null>(null);
  const docPastas = usePastasDocumentos();
  const [areasOpen, setAreasOpen] = useState(false);
  const [agendaOffset, setAgendaOffset] = useState(0);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  }, []);

  const calendarDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + calendarMonthOffset, 1);
  }, [calendarMonthOffset]);

  const calendarDays = useMemo(() => {
    return generateCalendar(calendarDate.getFullYear(), calendarDate.getMonth());
  }, [calendarDate]);

  const daysWithTasks = useMemo(() => {
    const set = new Set<number>();
    set.add(todayStr);
    set.add(todayStr + 86400000); // amanhã
    set.add(todayStr + 86400000 * 3);
    set.add(todayStr - 86400000 * 2);
    return set;
  }, [todayStr]);

  const agendaTasks = useMemo(() => {
    if (agendaOffset === 0) {
      return [
        { id: 1, type: 'questoes', title: 'Resolver 15 questões', subtitle: 'Direito Penal Geral', icon: FileCheck, color: 'text-[#F87171]', route: '/aprender' },
        { id: 2, type: 'flashcards', title: 'Revisar Flashcards', subtitle: 'Constitucional (12 pendentes)', icon: Library, color: 'text-[#22c55e]', route: '/flashcards' },
        { id: 3, type: 'trilha', title: 'Avançar na Trilha', subtitle: 'Licitações e Contratos', icon: Map, color: 'text-[#3b82f6]', route: '/aprender' },
        { id: 4, type: 'resumo', title: 'Leitura de Resumo', subtitle: 'Dolo e Culpa', icon: BookOpen, color: 'text-[#d97706]', route: '/resumos-juridicos' }
      ];
    }
    if (agendaOffset === 1) {
      return [
        { id: 5, type: 'questoes', title: 'Resolver 15 questões', subtitle: 'Direito Penal Geral', icon: FileCheck, color: 'text-[#F87171]', route: '/aprender' },
        { id: 6, type: 'flashcards', title: 'Revisar Flashcards', subtitle: 'Constitucional (12 pendentes)', icon: Library, color: 'text-[#22c55e]', route: '/flashcards' },
        { id: 7, type: 'trilha', title: 'Avançar na Trilha', subtitle: 'Licitações e Contratos', icon: Map, color: 'text-[#3b82f6]', route: '/aprender' },
        { id: 8, type: 'resumo', title: 'Leitura de Resumo', subtitle: 'Dolo e Culpa', icon: BookOpen, color: 'text-[#d97706]', route: '/resumos-juridicos' }
      ];
    }
    return [];
  }, [agendaOffset]);


  const [categorySearch, setCategorySearch] = useState('');
  const activeTabs = useMemo(() => (emAltaLeis ? TABS_VADEMECUM : TABS_HOME), [emAltaLeis]);
  const [tab, setTab] = useState<Tab>(() => (emAltaLeis ? 'emalta' : 'estudos'));
  const currentTab = activeTab || tab;

  const handleVoiceSearch = useCallback((text: string) => {
    setCategorySearch(text);
  }, []);
  const voiceSearch = useVoiceInput(handleVoiceSearch);

  useEffect(() => { onTabChange?.(tab); }, [tab, onTabChange]);

  // Deixa os visuais jurídicos prontos assim que o app abre (chunk + dados),
  // para o clique no card não ter delay de rede nem de carregamento.
  useEffect(() => {
    const aquecer = () => {
      import('@/components/visuais/VisuaisJuridicosSheet');
      import('@/lib/visuaisJuridicos/cache').then((m) => m.prefetchVisuais());
    };
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(aquecer, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(aquecer, 1200);
    return () => clearTimeout(t);
  }, []);

  const { counts: radarCounts } = useOutrasNormasCounts();

  const handle = useCallback((id: string) => {
    const radarCat = RADAR_CATS.find(c => c.id === id);
    if (radarCat) {
      navigate(`/normas/${radarCat.normaSlug}`);
      return;
    }
    if (id === 'jurisprudencia') { navigate('/jurisprudencia'); return; }
    const cat = ALL_CATS.find(c => c.id === id);
    if (cat) {
      const leisDaCategoria = LEIS_CATALOG.filter(l => l.tipo === id);
      if (leisDaCategoria.length > 1) {
        setCategorySearch('');
        setCategoryOpen(cat);
        return;
      }
      if (leisDaCategoria.length === 1) {
        navigate(leiPath(leisDaCategoria[0]));
        return;
      }
      navigate(`/legislacao/${tipoToSlug(id)}`);
      return;
    }
    navigate(`/legislacao/${tipoToSlug(id)}`);
  }, [navigate]);

  // Memoize the derived lei lists so voice-input keystrokes and unrelated
  // parent re-renders don't reshape/refilter the entire catalog every tick.
  const categoryItems = useMemo(() => {
    if (!categoryOpen) return [] as typeof LEIS_CATALOG;
    if ('leiIds' in categoryOpen) {
      const ids = new Set((categoryOpen as AreaCat).leiIds);
      return LEIS_CATALOG.filter(l => ids.has(l.id));
    }
    return LEIS_CATALOG.filter(l => l.tipo === categoryOpen.id);
  }, [categoryOpen]);
  const filteredCategoryItems = useMemo(() => {
    const term = categorySearch.trim();
    if (!term) return categoryItems;
    const needle = normalizeSearch(term);
    return categoryItems.filter((lei) => {
      const haystack = normalizeSearch(`${lei.nome} ${lei.sigla} ${lei.descricao} ${(lei.tags || []).join(' ')}`);
      return haystack.includes(needle);
    });
  }, [categoryItems, categorySearch]);
  const CategorySheetIcon = categoryOpen?.icon || BookMarked;

  // Lock background scroll while any bottom sheet is open
  useEffect(() => {
    const anyOpen = !!categoryOpen || juriOpen;
    if (!anyOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [categoryOpen, juriOpen]);

  return (
    <div className="space-y-6 pt-4">
      {/* Carrossel de notícias no topo — full-bleed (sem margens laterais) */}
      {!hideNoticias && (
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} />
        </div>
      )}

      {/* Segmented toggle */}
      {!hideTabs && (
      <div>
        <div className="relative flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/60">
          {activeTabs.map(t => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-track="home_tab_switch"
                data-track-tab={t.id}
                className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-full font-display text-[13px] font-bold uppercase tracking-wide transition-colors"
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full shadow-lg shadow-black/20 bg-hero-panel" />
                )}
                <span className={`relative flex items-center gap-2 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {currentTab === 'categorias' && (
          <motion.div
            key="categorias"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-4 px-1 pb-8"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                <h2 className="font-body text-foreground text-2xl sm:text-3xl font-bold tracking-tight">
                  Categorias
                </h2>
              </div>
              <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
                Leis federais, legislação estadual, jurisprudência, OAB, decretos e outras normas.
              </p>
            </div>
            <div className="h-[1.5px] bg-border/70 w-full -mt-2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {CATEGORIA_CATS.map((c, i) => (
                <HomeCard
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color={c.color}
                  delay={i * 0.05}
                  onClick={() => {
                    if ('route' in c && c.route) { navigate(c.route); return; }
                    if (c.id === 'cat-jurisprudencia') { navigate('/jurisprudencia'); return; }
                    setCategorySearch('');
                    setCategoryOpen(c);
                  }}
                  data-track="home_card_click"
                  data-track-name={c.label}
                  data-track-section="categorias"
                />
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'emalta' && (
          <motion.div
            key="emalta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-4 px-1 pb-8"
          >
            <style>{`
              @keyframes icon-shine-mask {
                0% { -webkit-mask-position: 250% center; mask-position: 250% center; }
                100% { -webkit-mask-position: -250% center; mask-position: -250% center; }
              }
            `}</style>


            <div className="grid grid-cols-4 gap-2 mb-10 w-full">
              <button onClick={() => navigate('/vade-mecum/favoritos')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Favoritos</span>
              </button>
              
              <button onClick={() => toast({ title: 'Em breve' })} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <NotebookPen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Anotações</span>
              </button>

              <button onClick={() => navigate('/radares')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <Radar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Radares</span>
              </button>

              <button onClick={() => navigate('/vade-mecum/recentes')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Histórico</span>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                Em Alta
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
                As leis e normas mais acessadas no momento
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {GRID_CATS.map((c, i) => (
                <HomeCard
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color={c.color}
                  delay={i * 0.05}
                  solidColor={true}
                  onClick={() => {
                    if (c.id === 'jurisprudencia') {
                      navigate('/jurisprudencia');
                    } else {
                      setCategorySearch(''); setCategoryOpen(c);
                    }
                  }}
                  data-track="home_card_click"
                  data-track-name={c.label}
                  data-track-section="emalta"
                />
              ))}
            </div>

            <div className="pt-6 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
              <AprendaSobreLeis titleClassName="px-4 sm:px-6 md:px-8 lg:px-12" />
            </div>

            <div className="pt-6">
              <div className="mb-4">
                <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-primary" />
                  Outras Normas
                </h3>
                <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
                  Acompanhe publicações diárias, radares e boletins jurídicos
                </p>
              </div>
              <div className="space-y-2.5">
                {RADAR_CATS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handle(c.id)}
                      data-track="home_radar_cat_click"
                      className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm active:scale-[0.99] transition"
                    >
                      <Icon
                        className="w-8 h-8 shrink-0"
                        style={{
                          color: c.color,
                          filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                        }}
                        strokeWidth={1.15}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                          {c.label}
                        </p>
                        <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                          {c.sublabel}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'areas' && (
          <motion.div
            key="areas"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-4 px-1 pb-8"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                <h2 className="font-body text-foreground text-2xl sm:text-3xl font-bold tracking-tight">
                  Áreas do Direito
                </h2>
              </div>
              <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
                Navegue pela legislação organizada por área de atuação.
              </p>
            </div>
            <div className="h-[1.5px] bg-border/70 w-full -mt-2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {AREA_CATS.map((c, i) => (
                <HomeCard
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color={c.color}
                  delay={Math.min(i * 0.04, 0.3)}
                  onClick={() => {
                    setCategorySearch('');
                    setCategoryOpen(c);
                  }}
                  data-track="home_card_click"
                  data-track-name={c.label}
                  data-track-section="areas"
                />
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'agenda' && (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-6 px-1"
          >
            {/* Continue de onde parou movido para a aba Pendências */}
            <div className="-mx-1">
              <ContinueLendoCard />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-primary" />
                    <h2 className="font-body text-foreground text-2xl sm:text-3xl font-bold tracking-tight">
                      Agenda
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <CalendarDays className="w-5 h-5" />
                </button>
              </div>
              <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
                Suas tarefas e metas diárias de estudo.
              </p>
            </div>
            
            <div className="mt-4 rounded-2xl bg-card border border-border/60 overflow-hidden pb-4">
              <div className="bg-muted/30 px-3 py-2 border-b border-border/50 flex justify-between items-center">
                <button onClick={() => setAgendaOffset(prev => prev - 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                  <h3 className="font-display font-bold text-foreground text-[15px]">
                    {agendaOffset === 0 ? 'Hoje' : agendaOffset === 1 ? 'Amanhã' : agendaOffset === -1 ? 'Ontem' : ''}
                    {agendaOffset === 0 || agendaOffset === 1 || agendaOffset === -1 ? ', ' : ''}
                    {new Date(Date.now() + agendaOffset * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </h3>
                  <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider">{agendaTasks.length > 0 ? `${agendaTasks.length} pendentes` : 'livre'}</span>
                </div>
                <button onClick={() => setAgendaOffset(prev => prev + 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={agendaOffset}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="divide-y divide-border/40 min-h-[200px]"
                  >
                    {agendaTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                          <Inbox className="w-6 h-6 text-muted-foreground opacity-60" />
                        </div>
                        <h4 className="text-[15px] font-bold text-foreground">Nada pendente para hoje</h4>
                        <p className="text-[13px] text-muted-foreground mt-1">
                          Você não tem tarefas, trilhas ou flashcards agendados para esta data.
                        </p>
                      </div>
                    ) : (
                      agendaTasks.map(task => (
                        <button key={task.id} onClick={() => navigate(task.route)} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors active:bg-muted">
                          <task.icon className={`w-7 h-7 ${task.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-foreground truncate">{task.title}</p>
                            <p className="text-[13px] text-muted-foreground truncate mt-0.5">{task.subtitle}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 shrink-0" />
                        </button>
                      ))
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
          </motion.div>
        )}

        <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 flex flex-col bg-background border-t-0">
            <div className="p-6">
              <h2 className="text-xl font-display font-bold text-foreground">Visão Geral</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Acompanhe seu progresso ao longo do mês.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-12">
              <div className="rounded-2xl bg-card border border-border/60 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalendarMonthOffset(p => p - 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-display font-bold text-foreground text-[16px] capitalize">
                    {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => setCalendarMonthOffset(p => p + 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 gap-x-2">
                  {calendarDays.map((d, i) => {
                    const ts = d.date.getTime();
                    const isToday = ts === todayStr;
                    const targetOffset = Math.round((ts - todayStr) / 86400000);
                    const isSelected = targetOffset === agendaOffset;
                    const hasTasks = daysWithTasks.has(ts);

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setAgendaOffset(targetOffset);
                          setIsCalendarOpen(false);
                        }}
                        className={`
                          relative flex items-center justify-center h-10 sm:h-12 rounded-full text-[15px] font-medium transition-all
                          ${!d.currentMonth ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted'}
                          ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary font-bold shadow-md shadow-primary/20 scale-105' : ''}
                          ${isToday && !isSelected ? 'ring-1 ring-primary text-primary' : ''}
                        `}
                      >
                        {d.day}
                        {hasTasks && (
                          <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {currentTab === 'estudos' && (
          <motion.div
            key="estudos"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Em Alta — leis (Vade Mecum) ou funções de estudo (home) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {emAltaLeis
                ? GRID_CATS.map((c, i) => (
                    <HomeCard
                      key={c.id}
                      icon={c.icon}
                      label={c.label}
                      sublabel={c.sublabel}
                      color={c.color}
                      delay={i * 0.05}
                      onClick={() => {
                        if (c.id === 'jurisprudencia') {
                          navigate('/jurisprudencia');
                        } else {
                          setCategorySearch(''); setCategoryOpen(c);
                        }
                      }}
                      data-track="home_card_click"
                      data-track-name={c.label}
                      data-track-section="estudos"
                    />
                  ))
                : EMALTA_CATS.map((c, i) => (
                    <HomeCard
                      key={c.id}
                      icon={c.icon}
                      label={c.label}
                      sublabel={c.sublabel}
                      color={c.color}
                      delay={i * 0.05}
                      iconClassName={c.id === 'ea-mapas' ? 'w-6 h-6' : undefined}
                      badge={c.emBreve ? 'Em breve' : undefined}
                      onClick={() => {
                        if (c.emBreve) {
                          toast({ title: 'Em breve', description: 'Essa função está sendo preparada.' });
                          return;
                        }
                        if (c.id === 'ea-mapas') { setVisuaisOpen(true); return; }
                        if (c.id === 'ea-areas') { setAreasOpen(true); return; }

                        navigate(c.route);
                      }}
                      data-track="home_card_click"
                      data-track-name={c.label}
                      data-track-section="estudos"
                    />
                  ))}
            </div>




      {/* Aprenda sobre as Leis — carrossel infinito de posts do blog (categoria Leis) */}
      {!hideBlog && (
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
          <NoticiasJuridicasCarousel />
        </div>
      )}

      {/* Lembretes e Assistente */}
      <div className="px-1 pb-6">
        <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Lembretes & Hórus
        </h3>
        <p className="font-body text-muted-foreground text-[12.5px] leading-snug mb-3 ml-3">
          Todos os lembretes que você ativou no app e o seu assistente jurídico.
        </p>
        <div className="space-y-2.5">
          <button
            onClick={() => navigate('/lembretes')}
            data-track="home_lembretes_click"
            className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm active:scale-[0.99] transition"
          >
            <BellRing
              className="w-8 h-8 shrink-0"
              style={{
                color: '#F59E0B',
                filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
              }}
              strokeWidth={1.15}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                Meus Lembretes
              </p>
              <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                Estudo, leitura, questões, Lei Seca e geolocalização
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          <button
            onClick={() => navigate('/assistente-horus')}
            data-track="home_horus_click"
            className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm active:scale-[0.99] transition"
          >
            <MessageCircle
              className="w-8 h-8 shrink-0"
              style={{
                color: '#25D366', // Cor verde do WhatsApp
                filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
              }}
              strokeWidth={1.15}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                Hórus
              </p>
              <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                Seu assistente jurídico no WhatsApp
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>

      {/* Modo Aula */}
      <div className="px-1 pb-24">
        <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Modo Aula
        </h3>
        <p className="font-body text-muted-foreground text-[12.5px] leading-snug mb-3 ml-3">
          Grave sua aula e receba o material e resumos automáticos.
        </p>
        <div className="space-y-2.5">
          <button
            onClick={() => navigate('/modo-aula')}
            data-track="home_modo_aula_click"
            className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm active:scale-[0.99] transition"
          >
            <GraduationCap
              className="w-8 h-8 shrink-0"
              style={{
                color: '#8B1E3F',
                filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
              }}
              strokeWidth={1.15}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                Modo Aula
              </p>
              <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                Grave a aula e receba o material
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>



          </motion.div>
        )}

        {currentTab === 'faculdade' && (
          <motion.div
            key="faculdade"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-6 px-1 pb-8 pt-2"
          >
            {/* Seção 1: Anotações e Captura */}
            <div>
              <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                Anotações e Captura
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => navigate('/anotacoes/audio')}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center hover:border-primary/50 transition-colors active:scale-95 shadow-sm relative"
                >
                  <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-muted-foreground/60" strokeWidth={2} />
                  <Mic className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[14px] text-foreground">Gravar Aula</span>
                </motion.button>
                
                <motion.button
                  onClick={() => navigate('/faculdade/lousa')}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center hover:border-primary/50 transition-colors active:scale-95 shadow-sm relative"
                >
                  <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-muted-foreground/60" strokeWidth={2} />
                  <Monitor className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[14px] text-foreground">Lousa Scanner</span>
                </motion.button>
              </div>
            </div>

            {/* Seção 2: Caderno Inteligente */}
            <div>
              <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                Caderno Inteligente
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <motion.button
                  onClick={() => navigate('/faculdade/resumos')}
                  className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                >
                  <FileText className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[11px] text-foreground leading-tight">Resumos</span>
                </motion.button>
                
                <motion.button
                  onClick={() => navigate('/flashcards-personalizados')}
                  className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                >
                  <Layers className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[11px] text-foreground leading-tight">Flashcards</span>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/assistente')}
                  className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                >
                  <Brain className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[11px] text-foreground leading-tight">Mapas</span>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/faculdade/lembretes')}
                  className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                >
                  <BellRing className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-display font-bold text-[11px] text-foreground leading-tight">Lembretes</span>
                </motion.button>
              </div>
            </div>

            {/* Seção 3: Recentes */}
            <div>
              <h3 className="font-display text-foreground text-[18px] font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary" />
                Recentes
              </h3>
              
              <div className="space-y-4 pl-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-border">
                {/* Item 1 */}
                <div className="relative pl-8">
                  <div className="absolute left-[2px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition cursor-pointer" onClick={() => navigate('/anotacoes/audio')}>
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground">Gravação de Aula</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">Há 2 horas</span>
                    </div>
                    <p className="font-display font-bold text-[14px] text-foreground">Direito Penal - Teoria do Erro</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Duração: 45:12 • Resumo inteligente gerado</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="relative pl-8">
                  <div className="absolute left-[2px] top-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                  <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition cursor-pointer" onClick={() => navigate('/faculdade/lousa')}>
                    <div className="flex items-center gap-2 mb-1">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground">Lousa Scanner</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">Ontem, 19:30</span>
                    </div>
                    <p className="font-display font-bold text-[14px] text-foreground">Direito Civil - Contratos</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">2 fotos processadas e transcritas</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="relative pl-8">
                  <div className="absolute left-[2px] top-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                  <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition cursor-pointer" onClick={() => navigate('/flashcards-personalizados')}>
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground">Flashcards</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">15 de Ago</span>
                    </div>
                    <p className="font-display font-bold text-[14px] text-foreground">Direito Constitucional</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">15 novos cards gerados pelo Assistente</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>


      {/* Category bottom sheet — opens categories from bottom to top */}
      {createPortal(
      <AnimatePresence>
        {categoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCategoryOpen(null)}
              className="fixed inset-0 z-[1400] bg-black/85"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[1401] flex h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-background pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]"
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/70 flex items-center justify-center shrink-0">
                    <CategorySheetIcon
                      className="w-6 h-6"
                      style={{ color: categoryOpen.color, filter: 'saturate(1.3) brightness(1.1)' }}
                      strokeWidth={1.2}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-foreground font-bold leading-none truncate">
                      {categoryOpen.label}
                    </h3>
                    <p className="text-muted-foreground text-[12px] font-body leading-tight mt-1 truncate">
                      {categoryOpen.sublabel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCategoryOpen(null)}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/45 px-3 h-12">
                    <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                    <input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder={
                        categoryOpen && 'leiIds' in categoryOpen
                          ? 'Pesquisar nesta área'
                          : 'Pesquisar nesta categoria'
                      }
                      className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={voiceSearch.toggle}
                    aria-label={voiceSearch.listening ? 'Parar gravação' : 'Pesquisar por voz'}
                    className={`btn-attention-shine relative overflow-hidden shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${
                      voiceSearch.listening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                        : 'bg-primary text-primary-foreground shadow-primary/30'
                    }`}
                  >
                    {voiceSearch.listening
                      ? <MicOff className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />
                      : <Mic className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {categoryOpen?.id === 'cat-estadual' ? (
                  (() => {
                    const q = normalizeSearch(categorySearch.trim());
                    const estados = [...ESTADOS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                    const filtered = q
                      ? estados.filter(e => normalizeSearch(`${e.nome} ${e.uf} ${e.capital}`).includes(q))
                      : estados;
                    return (
                      <div className="space-y-2">
                        {filtered.map((estado, i) => (
                          <motion.button
                            key={estado.uf}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                            onClick={() => {
                              setCategoryOpen(null);
                              navigate(`/legislacao-estadual/${estado.uf.toLowerCase()}`);
                            }}
                            className="w-full flex items-center gap-4 p-4 min-h-[76px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
                          >
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden">
                              <img
                                src={bandeiraUF(estado.uf, 96) || ''}
                                alt={`Bandeira de ${estado.nome}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const el = e.currentTarget as HTMLImageElement;
                                  el.style.display = 'none';
                                  if (el.parentElement) {
                                    el.parentElement.innerHTML = `<span class="font-display text-[15px] font-bold text-foreground tracking-wider">${estado.uf}</span>`;
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.06em]">
                                {estado.nome}
                              </p>
                              <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                                {estado.capital} · {estado.regiao}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          </motion.button>
                        ))}
                        {filtered.length === 0 && (
                          <div className="py-8 text-center font-body text-sm text-muted-foreground">
                            Nenhum estado encontrado.
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                <div className="space-y-2">
                  {filteredCategoryItems.map((lei, i) => {
                    const LawIcon = LEI_ICON_MAP[lei.id] || CategorySheetIcon;
                    return (
                    <motion.button
                      key={lei.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                      onClick={() => {
                        setCategoryOpen(null);
                        navigate(leiPath(lei));
                      }}
                      className="w-full flex items-center gap-4 p-4 min-h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
                    >
                      <div className="relative overflow-hidden rounded-xl shrink-0">
                        <LawIcon
                          className="w-8 h-8 relative"
                          style={{
                            color: lei.iconColor || categoryOpen.color,
                            filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                          }}
                          strokeWidth={1.3}
                        />
                        <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                          {lei.nome}
                        </p>
                        <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-2">
                          {lei.descricao}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </motion.button>
                  );})}
                  {filteredCategoryItems.length === 0 && (
                    <div className="py-8 text-center font-body text-sm text-muted-foreground">
                      Nenhuma lei encontrada.
                    </div>
                  )}
                </div>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}




      {/* Jurisprudência bottom sheet */}
      <AnimatePresence>
        {juriOpen && (
          <JurisprudenciaSheet open={juriOpen} onClose={() => setJuriOpen(false)} />
        )}
      </AnimatePresence>


      {/* Visuais jurídicos (mapas mentais, infográficos, fluxogramas, diagramas) */}
      {visuaisOpen && (
        <Suspense fallback={null}>
          <VisuaisJuridicosSheet
            open={visuaisOpen}
            onClose={() => setVisuaisOpen(false)}
            onEscolherTipo={(t) => {
              setVisuaisOpen(false);
              navigate(`/visuais/${TIPO_SLUG[t]}`);
            }}
          />
        </Suspense>
      )}

      {/* Documentos — modelos jurídicos vindos do Drive */}
      <DocumentosSheet categoria={docPasta} open={!!docPasta} onClose={() => setDocPasta(null)} />

      {/* Áreas do Direito — grade completa (aberta pela aba Estudos) */}
      {areasOpen && createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-border/60 px-3 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
            <button
              onClick={() => setAreasOpen(false)}
              aria-label="Voltar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition"
            >
              <ChevronRight className="h-6 w-6 rotate-180 text-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[19px] font-bold leading-tight text-foreground">Áreas do Direito</p>
              <p className="truncate font-body text-[12px] text-muted-foreground">
                Escolha uma área para ver as leis daquela área
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {AREA_CATS.map((c, i) => (
                <HomeCard
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color={c.color}
                  delay={Math.min(i * 0.04, 0.3)}
                  onClick={() => {
                    setAreasOpen(false);
                    setCategorySearch('');
                    setCategoryOpen(c);
                  }}
                  data-track="home_card_click"
                  data-track-name={c.label}
                  data-track-section="areas"
                />
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Voice capture full-screen overlay (ChatGPT Live style) */}
      <VoiceCaptureOverlay
        open={voiceSearch.listening}
        partial={voiceSearch.partial}
        onStop={voiceSearch.stop}
      />
    </div>

  );
};

// Parent (IndexMobile) re-renders on scroll/tab state — memo prevents the
// whole 700-line section tree from re-rendering when its props are unchanged.
export default memo(MobileHomeSections);
