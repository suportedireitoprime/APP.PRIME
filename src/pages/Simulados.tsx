// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  PlayCircle, Search, FileText, Scale, ChevronRight, ArrowLeft, History,
  BarChart3, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Sparkles,
  Filter, BookOpen, Layers, Award, X, Trophy, Target, TrendingUp,
  RotateCcw, Check, Flame, Bookmark, Clock, Gavel, Heart, BellRing, ArrowRight,
  Shield, Compass
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { useAuth } from '@/hooks/useAuth';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import resumosHeroImg from '@/assets/covers/resumos-philosophers-hero.webp';
import revisaoOabCover from '@/assets/biblioteca/areas/revisao-oab.webp';
import pfLogo from '@/assets/cargos/policia-federal.webp';
import prfLogo from '@/assets/cargos/policia-rodoviaria-federal.webp';
import pcDfLogo from '@/assets/cargos/policia-civil-df.webp';

interface SimuladoItem {
  id: string;
  year: number;
  prova_url: string;
  gabarito_url: string;
  edital_url: string;
  created_at: string;
  exam: {
    name: string;
  };
  simulado_questions?: { count: number }[];
}

// 5 Carreiras Oficiais em Alta
const CARREIRAS_EM_ALTA = [
  {
    id: 'oab',
    nome: 'OAB (Exame de Ordem)',
    badge: '47 Provas',
    questoes: '3.820 Questões no App',
    status: 'disponivel',
    imagem: '/assets/eoab-woman-fixed.webp',
    subtitulo: '1ª Fase Oficial • FGV',
    filterChip: 'oab',
  },
  {
    id: 'delegado',
    nome: 'Delegado de Polícia',
    badge: 'Em Breve',
    questoes: 'Civil e Federal',
    status: 'em_breve',
    imagem: pcDfLogo,
    subtitulo: 'Polícia Civil e Federal',
    filterChip: null,
  },
  {
    id: 'juiz',
    nome: 'Juiz de Direito',
    badge: '6 Concursos',
    questoes: '600 Questões no App',
    status: 'disponivel',
    imagem: '/assets/praticar-juiz.webp',
    subtitulo: 'Magistratura Estadual',
    filterChip: 'juiz',
  },
  {
    id: 'pf',
    nome: 'Polícia Federal (PF)',
    badge: 'Em Breve',
    questoes: 'Agente e Escrivão',
    status: 'em_breve',
    imagem: pfLogo,
    subtitulo: 'Cebraspe / Concurso PF',
    filterChip: null,
  },
  {
    id: 'prf',
    nome: 'Polícia Rodoviária (PRF)',
    badge: 'Em Breve',
    questoes: 'Policial Rodoviário',
    status: 'em_breve',
    imagem: prfLogo,
    subtitulo: 'Carreira Policial Rodoviária',
    filterChip: null,
  },
];

// Formata o título oficial legível do exame
const getExamDisplayName = (sim: SimuladoItem) => {
  const isJuiz = (sim.exam?.name || '').toLowerCase().includes('juiz') || (sim.exam?.name || '').toLowerCase().includes('magistratura');
  if (isJuiz) {
    let orgao = 'TJ';
    const raw = (sim.prova_url || '').toLowerCase();
    if (raw.includes('tjsp')) orgao = 'TJSP';
    else if (raw.includes('tjgo')) orgao = 'TJGO';
    else if (raw.includes('tjpa')) orgao = 'TJPA';
    else if (raw.includes('tjce')) orgao = 'TJCE';
    else if (raw.includes('tjto')) orgao = 'TJTO';
    return `Juiz de Direito Substituto (${orgao} • ${sim.year})`;
  }

  const raw = (sim.prova_url || '').trim();
  // Se já tiver formato como "46º Exame de Ordem Unificado (2026.1)"
  if (/^\d{1,2}[ºoªa]?\s+Exame/i.test(raw)) {
    return raw;
  }
  // Se tiver formato como "OAB - 2026 - XLVI Exame de Ordem Unificado"
  const romanMatch = raw.match(/(X{0,3})(IX|IV|V?I{0,3})\s+Exame/i);
  if (romanMatch && romanMatch[0]) {
    return `OAB - ${sim.year} - ${romanMatch[0]} de Ordem Unificado`;
  }
  const numMatch = raw.match(/(\d{1,2})[ºoªa]?\s*exame/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    return `${num}º Exame de Ordem Unificado (${sim.year})`;
  }
  return raw.startsWith('http') ? `OAB - ${sim.year} - Exame de Ordem Unificado` : raw;
};

// Disciplinas Oficiais da OAB para o Filtro Rápido
const MATERIAS_OAB = [
  { id: 'etica', nome: 'Ética Profissional', short: 'Ética', peso: 8 },
  { id: 'constitucional', nome: 'Direito Constitucional', short: 'Constitucional', peso: 6 },
  { id: 'civil', nome: 'Direito Civil', short: 'Civil', peso: 6 },
  { id: 'proc_civil', nome: 'Direito Processual Civil', short: 'Proc. Civil', peso: 6 },
  { id: 'penal', nome: 'Direito Penal', short: 'Penal', peso: 6 },
  { id: 'proc_penal', nome: 'Direito Processual Penal', short: 'Proc. Penal', peso: 6 },
  { id: 'trabalho', nome: 'Direito do Trabalho', short: 'Trabalho', peso: 5 },
  { id: 'proc_trabalho', nome: 'Direito Processual do Trabalho', short: 'Proc. Trabalho', peso: 5 },
  { id: 'administrativo', nome: 'Direito Administrativo', short: 'Administrativo', peso: 5 },
  { id: 'tributario', nome: 'Direito Tributário', short: 'Tributário', peso: 5 },
  { id: 'empresarial', nome: 'Direito Empresarial', short: 'Empresarial', peso: 4 },
  { id: 'direitos_humanos', nome: 'Direitos Humanos', short: 'Dir. Humanos', peso: 2 },
  { id: 'consumidor', nome: 'Direito do Consumidor', short: 'Consumidor', peso: 2 },
  { id: 'ambiental', nome: 'Direito Ambiental', short: 'Ambiental', peso: 2 },
  { id: 'eca', nome: 'ECA (Criança e Adolescente)', short: 'ECA', peso: 2 },
  { id: 'internacional', nome: 'Direito Internacional', short: 'Internacional', peso: 2 },
  { id: 'filosofia', nome: 'Filosofia do Direito', short: 'Filosofia', peso: 2 },
];

export default function Simulados() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const gateSimulado = useGatedFeature('simulado', 'simulados');
  const unreadNotifs = useUnreadNotifCount();
  const listRef = useRef<HTMLDivElement>(null);

  // Estados de Modais
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentesOpen, setRecentesOpen] = useState(false);
  const [isFiltroRapidoOpen, setIsFiltroRapidoOpen] = useState(false);
  const [selectedMateriasFilter, setSelectedMateriasFilter] = useState<string[]>([]);

  // Estados de Filtro de Lista
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChip, setFilterChip] = useState<string>('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Raio-X e PDF
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');

  // Favoritos persistidos
  const [favSimulados, setFavSimulados] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('simulados_favoritos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleFavSimulado = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try { haptic.impact(); } catch {}
    setFavSimulados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info('Removido dos favoritos');
      } else {
        next.add(id);
        toast.success('Salvo nos favoritos!');
      }
      try {
        localStorage.setItem('simulados_favoritos', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // 1. Carregar lista completa de simulados
  const { data: simuladosList, isLoading } = useQuery({
    queryKey: ['simulados_list_full'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select(`
          id,
          year,
          prova_url,
          gabarito_url,
          edital_url,
          created_at,
          exam:simulado_exams(name),
          simulado_questions(count)
        `)
        .order('year', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar simulados.');
        return [];
      }
      return (data || []) as SimuladoItem[];
    },
  });

  // 2. Histórico recente do usuário
  const { data: historicoRecente } = useQuery({
    queryKey: ['simulados_historico_user', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_simulados_historico')
        .select(`
          id,
          simulado_id,
          data_fim,
          tempo_gasto_segundos,
          total_questoes,
          acertos,
          created_at,
          simulado:simulados(
            id,
            year,
            prova_url,
            exam:simulado_exams(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
  });

  // 3. Raio-X do simulado selecionado
  const { data: rawRaioXData, isLoading: loadingRaioX } = useQuery({
    queryKey: ['simulado_raiox_sheet', selectedSimulado?.id],
    staleTime: 10 * 60 * 1000,
    enabled: !!selectedSimulado,
    queryFn: async () => {
      if (!selectedSimulado) return [];
      const { data, error } = await supabase
        .from('simulado_questions')
        .select('disciplina, assunto')
        .eq('simulado_id', selectedSimulado.id);

      if (error || !data || data.length === 0) return [];

      const total = data.length;
      const counts: Record<string, { count: number; assuntos: Record<string, number> }> = {};

      data.forEach((q: any) => {
        const d = q.disciplina || 'Outras';
        const a = q.assunto || 'Geral';
        if (!counts[d]) counts[d] = { count: 0, assuntos: {} };
        counts[d].count++;
        if (!counts[d].assuntos[a]) counts[d].assuntos[a] = 0;
        counts[d].assuntos[a]++;
      });

      return Object.entries(counts).map(([name, info]) => ({
        name,
        percent: Math.round((info.count / total) * 100),
        count: info.count,
        assuntos: Object.entries(info.assuntos).map(([assunto, c]) => ({
          name: assunto,
          count: c as number,
          percent: Math.round(((c as number) / info.count) * 100),
        })).sort((a, b) => b.count - a.count),
      })).sort((a, b) => b.count - a.count);
    },
  });

  // Iniciar Simulado
  const handleStartSimulado = (sim: SimuladoItem) => {
    if (!sim) return;
    try { haptic.selection(); } catch {}

    if (gateSimulado.blocked) {
      gateSimulado.openGate();
      return;
    }

    void gateSimulado.register(sim.id);
    navigate(`/simulados/resolver/${sim.id}`, {
      state: { simulado: sim },
    });
  };

  // Simulado em Destaque para "Continuar Simulado"
  const simuladoContinuar = useMemo(() => {
    if (historicoRecente && historicoRecente.length > 0 && historicoRecente[0].simulado) {
      const h = historicoRecente[0];
      return {
        id: h.simulado.id,
        year: h.simulado.year,
        prova_url: h.simulado.prova_url,
        gabarito_url: '',
        edital_url: '',
        created_at: h.created_at,
        exam: h.simulado.exam,
        ultimoScore: `${h.acertos}/${h.total_questoes} acertos`,
        emAndamento: !h.data_fim,
      };
    }
    if (simuladosList && simuladosList.length > 0) {
      return simuladosList[0];
    }
    return null;
  }, [historicoRecente, simuladosList]);

  // Lista Filtrada para a Seção "TODOS OS SIMULADOS"
  const filteredSimulados = useMemo(() => {
    if (!simuladosList) return [];

    return simuladosList.filter((sim) => {
      // Filtro de Favoritos
      if (onlyFavorites && !favSimulados.has(sim.id)) return false;

      // Busca por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const title = getExamDisplayName(sim).toLowerCase();
        const yearStr = (sim.year || '').toString();
        const examName = (sim.exam?.name || '').toLowerCase();
        const urlStr = (sim.prova_url || '').toLowerCase();
        if (!title.includes(term) && !yearStr.includes(term) && !examName.includes(term) && !urlStr.includes(term)) {
          return false;
        }
      }

      // Filtro de Chips
      if (filterChip === 'oab') {
        return (sim.exam?.name || '').toLowerCase().includes('oab');
      }
      if (filterChip === 'juiz') {
        return (sim.exam?.name || '').toLowerCase().includes('juiz');
      }
      if (filterChip === '2026') return sim.year === 2026;
      if (filterChip === '2025') return sim.year === 2025;
      if (filterChip === '2024') return sim.year === 2024;
      if (filterChip === '2023') return sim.year === 2023;
      if (filterChip === '2022') return sim.year === 2022;
      if (filterChip === '2021') return sim.year === 2021;
      if (filterChip === '2020') return sim.year === 2020;
      if (filterChip === 'anteriores') return sim.year < 2020;

      return true;
    });
  }, [simuladosList, searchTerm, filterChip, onlyFavorites, favSimulados]);

  const paginatedList = useMemo(() => {
    return filteredSimulados.slice(0, visibleCount);
  }, [filteredSimulados, visibleCount]);

  // Alterna filtro de favoritos no Hero
  const handleToggleFavoritosHero = () => {
    try { haptic.selection(); } catch {}
    setOnlyFavorites((prev) => !prev);
    if (!onlyFavorites) {
      toast.info('Exibindo apenas simulados favoritos.');
    } else {
      toast.info('Exibindo todos os simulados.');
    }
  };

  // Clique em uma carreira de "Em Alta"
  const handleCarreiraClick = (carreira: typeof CARREIRAS_EM_ALTA[0]) => {
    try { haptic.selection(); } catch {}
    if (carreira.filterChip) {
      setFilterChip(carreira.filterChip);
      setOnlyFavorites(false);
      setSearchTerm('');
      toast.success(`Exibindo simulados de ${carreira.nome}`);
      listRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast.info(`Simulados de ${carreira.nome} estão em preparação e chegarão em breve!`);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      {/* ── PAINEL HERO (PADRÃO IDÊNTICO AO RESUMOS) ────────────────────────── */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 border-b border-rose-500/20"
        style={{
          transform: 'translateZ(0)',
          backgroundColor: '#050505',
        }}
      >
        {/* Blindagem de overscroll superior */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#050505' }}
          aria-hidden="true"
        />

        {/* Imagem de Fundo dos 5 Grandes Filósofos do Direito */}
        <img
          src={resumosHeroImg}
          alt="Simulados Jurídicos Oficiais"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[62%_center] md:object-center z-0 pointer-events-none translate-x-[4%] md:translate-x-0"
        />

        {/* Overlay vermelho com corte poligonal estilizado e motivos clássicos */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-hero-panel" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            {/* Motivos clássicos do Direito com máscara elegante */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
                maskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
              }}
            >
              <HeroMotifs />
            </div>

            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        </div>

        {/* Glow de Atmosfera */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-rose-600/25 rounded-full blur-3xl pointer-events-none z-[2]" />

        {/* Header do Painel Hero: Voltar e Notificações */}
        <header className="relative z-20 px-4 sm:px-6 md:px-8 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1 flex items-center justify-between">
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              navigate('/');
            }}
            aria-label="Voltar para tela inicial"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 grid place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest text-rose-200 flex items-center gap-1.5 drop-shadow-md">
              <Layers className="w-3.5 h-3.5 text-white" />
              Direito Prime Simulados
            </span>
            <h1 className="font-display font-bold text-base sm:text-lg text-white drop-shadow-md">
              Simulados Oficiais
            </h1>
          </div>

          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setNotifOpen(true);
            }}
            aria-label="Notificações e novidades"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 grid place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 relative cursor-pointer shadow-lg"
          >
            <BellRing className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                {unreadNotifs > 99 ? '99+' : unreadNotifs}
              </span>
            )}
          </button>
        </header>

        {/* Tipografia Central do Hero */}
        <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-2 sm:pt-3 pb-2 flex flex-col justify-start min-h-[110px]">
          <div className="flex flex-col items-start text-left z-10 w-[52%] max-w-[280px]">
            <h2 className="font-serif italic text-white text-2xl sm:text-3xl leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              Simulados
            </h2>

            <p className="font-body text-white/95 text-[9.5px] sm:text-[10.5px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
              PROVAS & CONCURSOS
            </p>

            <div className="mt-2 flex items-center text-left gap-2">
              <div className="w-[2.5px] h-7 bg-white/50 rounded-full shrink-0" />
              <p className="font-serif italic text-white/90 text-xs sm:text-[12.5px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Treine no ritmo real,<br />conquiste a aprovação.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4 BOTÕES DE AÇÃO RÁPIDA NO VIDRO (FAVORITOS, RECENTES, ESTATÍSTICAS, OUTROS) ── */}
        <div className="relative z-10 px-3 sm:px-6 md:px-8 pb-3.5 pt-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
            {/* Botão 1: Favoritos */}
            <button
              type="button"
              onClick={handleToggleFavoritosHero}
              className={`flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none ${
                onlyFavorites ? 'bg-rose-500/20 border border-rose-500/40' : ''
              }`}
              aria-label="Filtrar Favoritos"
            >
              <Heart
                className={`w-5 h-5 text-rose-500 transition-all duration-200 group-hover:scale-110 drop-shadow-md ${
                  onlyFavorites ? 'fill-rose-500' : 'fill-rose-500/20'
                }`}
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Favoritos
              </span>
            </button>

            {/* Botão 2: Recentes */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setRecentesOpen(true);
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Abrir Recentes"
            >
              <History
                className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Recentes
              </span>
            </button>

            {/* Botão 3: Estatísticas */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                navigate('/simulados/estatisticas');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Abrir Estatísticas"
            >
              <BarChart3
                className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Estatísticas
              </span>
            </button>

            {/* Botão 4: Filtro Rápido */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setIsFiltroRapidoOpen(true);
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Filtro Rápido"
            >
              <Sparkles
                className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Filtro Rápido
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO PRINCIPAL (LAYOUT IDÊNTICO AO RESUMOS) ──────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">

        {/* ── BANNER "CONTINUAR SIMULADO" (PADRÃO RESUMOSCONTINUARCARD) ────────── */}
        {simuladoContinuar && (
          <button
            type="button"
            onClick={() => handleStartSimulado(simuladoContinuar)}
            style={{
              background: 'linear-gradient(to right, rgba(244, 63, 94, 0.22), rgba(244, 63, 94, 0.06))',
              borderColor: 'rgba(244, 63, 94, 0.35)',
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer"
          >
            {/* Capa com badge */}
            <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
              <img
                src={revisaoOabCover}
                alt="Simulado"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
              <span className="absolute bottom-0 inset-x-0 bg-rose-600 text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
                SIMULADO
              </span>
            </div>

            {/* Informações Centrais */}
            <div className="flex-1 min-w-0 z-10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <PlayCircle className="w-3 h-3 text-rose-400 fill-rose-400/20" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  {simuladoContinuar.ultimoScore ? 'RETOMAR SIMULADO' : 'CONTINUAR ESTUDANDO'}
                </p>
              </div>

              <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
                {getExamDisplayName(simuladoContinuar)}
              </p>

              <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-rose-200/80 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
                <span>
                  {simuladoContinuar.ultimoScore
                    ? `Último resultado: ${simuladoContinuar.ultimoScore} • Toque para praticar`
                    : '80 Questões no formato oficial • Toque para iniciar simulado'}
                </span>
              </p>
            </div>

            {/* Seta indicativa à direita */}
            <ArrowRight
              className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-rose-400 group-hover:translate-x-1 transition-transform"
              strokeWidth={2.4}
            />
          </button>
        )}

        {/* ── SEÇÃO EM ALTA: OAB, DELEGADO, JUIZ, PF E PRF ────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">EM ALTA</span>
              </h3>
              <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate">
                Carreiras e simulados oficiais mais procurados
              </p>
            </div>
          </div>

          {/* Carrossel Horizontal com as 5 Carreiras */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {CARREIRAS_EM_ALTA.map((carreira, idx) => {
              const isAvailable = carreira.status === 'disponivel';
              return (
                <div
                  key={`em-alta-carreira-${carreira.id}`}
                  onClick={() => handleCarreiraClick(carreira)}
                  className="snap-start shrink-0 w-[130px] sm:w-[145px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
                >
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-rose-500/50 transition-all shadow-md group-hover:shadow-rose-950/40">
                    <img
                      src={carreira.imagem}
                      alt={carreira.nome}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Badge superior de Status */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${
                        isAvailable
                          ? 'bg-rose-600/95 text-white'
                          : 'bg-zinc-800/90 text-zinc-300 border border-white/10'
                      }`}>
                        {carreira.badge}
                      </span>
                    </div>

                    {/* Detalhes inferiores na capa */}
                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <p className="text-[10px] font-bold text-white/90 drop-shadow line-clamp-1">
                        {carreira.questoes}
                      </p>
                    </div>
                  </div>

                  <p className="font-sans font-bold text-xs sm:text-[13px] text-white group-hover:text-rose-300 transition-colors line-clamp-2 mt-2 leading-snug">
                    {carreira.nome}
                  </p>
                  <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                    {carreira.subtitulo}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SEÇÃO: "TODOS OS SIMULADOS" EM LISTA COMPACTA ────────────────────── */}
        <section ref={listRef} className="pt-2 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-bold">
              ACERVO COMPLETO DE SIMULADOS
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-6 rounded-full bg-rose-500" />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                {onlyFavorites ? 'Simulados Favoritos' : 'Todos os Simulados & Provas'}
              </h2>
            </div>
            <p className="text-sm text-white/60 mt-1 ml-3 truncate">
              Toque em qualquer edição para iniciar com cronômetro ou conferir prova e gabarito oficial.
            </p>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número do exame, banca, ano ou cargo…"
              className="w-full pl-11 pr-10 h-13 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/60 transition-colors shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Chips de Filtragem de Simulados */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'oab', label: 'OAB (47)' },
              { id: 'juiz', label: 'Juiz de Direito (6)' },
              { id: '2026', label: '2026' },
              { id: '2025', label: '2025' },
              { id: '2024', label: '2024' },
              { id: '2023', label: '2023' },
              { id: '2022', label: '2022' },
              { id: '2021', label: '2021' },
              { id: '2020', label: '2020' },
              { id: 'anteriores', label: 'Anteriores' },
            ].map((chip) => {
              const active = filterChip === chip.id && !onlyFavorites;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFilterChip(chip.id);
                    setOnlyFavorites(false);
                  }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'bg-zinc-900/90 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ── LISTA COMPACTA DE SIMULADOS ─────────────────────────────────────── */}
          <div className="space-y-2 pt-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-white/50">
                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-3" />
                Carregando acervo de simulados...
              </div>
            ) : paginatedList.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm space-y-3 bg-[#141416]/50 rounded-2xl border border-white/5 p-8">
                <Scale className="w-10 h-10 text-white/20 mx-auto" />
                <p>Nenhum simulado encontrado para os filtros selecionados.</p>
                {(searchTerm || filterChip !== 'todos' || onlyFavorites) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterChip('todos');
                      setOnlyFavorites(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            ) : (
              paginatedList.map((sim) => {
                const title = getExamDisplayName(sim);
                const isFav = favSimulados.has(sim.id);
                const isJuiz = (sim.exam?.name || '').toLowerCase().includes('juiz');
                const questoesQtd = isJuiz ? 100 : 80;

                return (
                  <div
                    key={sim.id}
                    className="group relative rounded-2xl bg-[#141416] border border-white/10 hover:border-rose-500/40 p-3 sm:p-3.5 transition-all duration-150 shadow-sm flex items-center justify-between gap-3 hover:bg-white/[0.03]"
                  >
                    {/* Esquerda: Badge e Título */}
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleStartSimulado(sim)}
                    >
                      {/* Badge quadrada de ano e órgão */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors">
                        <span className="text-[12px] sm:text-[13px] font-black text-white leading-none">
                          {sim.year}
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-extrabold text-rose-400 uppercase tracking-tighter mt-0.5">
                          {isJuiz ? 'JUIZ' : 'OAB'}
                        </span>
                      </div>

                      {/* Textos: Título e Detalhes */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-bold text-sm sm:text-[15px] text-white truncate group-hover:text-rose-200 transition-colors">
                          {title}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 truncate">
                          <span className="font-semibold text-zinc-300">
                            {questoesQtd} Questões
                          </span>
                          <span>•</span>
                          <span>{isJuiz ? 'Magistratura Estadual' : '1ª Fase Oficial (FGV)'}</span>
                          <span className="hidden md:inline">•</span>
                          <span className="hidden md:inline">5h00 Oficial</span>
                        </div>
                      </div>
                    </div>

                    {/* Direita: Ações Compactas */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botão Raio-X */}
                      <button
                        type="button"
                        onClick={() => {
                          try { haptic.selection(); } catch {}
                          setSelectedSimulado(sim);
                        }}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-amber-400 active:scale-95 flex items-center justify-center transition cursor-pointer"
                        title="Ver Raio-X de Matérias"
                      >
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                      </button>

                      {/* Botão Gabarito (se houver) */}
                      {sim.gabarito_url && (
                        <button
                          type="button"
                          onClick={() => {
                            try { haptic.selection(); } catch {}
                            setPreviewPdfUrl(sim.gabarito_url);
                            setPreviewPdfTitle(`Gabarito Oficial - ${title}`);
                          }}
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-emerald-400 active:scale-95 flex items-center justify-center transition cursor-pointer"
                          title="Gabarito Oficial em PDF"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}

                      {/* Botão Favoritar */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavSimulado(sim.id, e)}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition cursor-pointer"
                        title="Favoritar Simulado"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      {/* Botão Primário: Iniciar Simulado Compacto */}
                      <button
                        type="button"
                        onClick={() => handleStartSimulado(sim)}
                        className="h-9 px-3.5 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-md shadow-rose-950/40 active:scale-95 transition-all cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 fill-white/20" />
                        <span className="hidden sm:inline">Iniciar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Botão Carregar Mais */}
            {filteredSimulados.length > visibleCount && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setVisibleCount((prev) => prev + 24);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
                >
                  Carregar Mais ({filteredSimulados.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── MODAL / SHEET DE NOTIFICAÇÕES ─────────────────────────────────────── */}
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />

      {/* ── SHEET: RAIO-X DO SIMULADO ─────────────────────────────────────────── */}
      <Sheet open={!!selectedSimulado} onOpenChange={(open) => !open && setSelectedSimulado(null)}>
        <SheetContent side="bottom" className="bg-[#141416] border-white/15 rounded-t-[32px] max-h-[85vh] overflow-y-auto p-6 text-white">
          <SheetHeader className="text-left space-y-1 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                Raio-X de Matérias
              </span>
              <span className="text-xs text-zinc-400">Distribuição Oficial FGV</span>
            </div>
            <SheetTitle className="font-display font-black text-lg text-white">
              {selectedSimulado ? getExamDisplayName(selectedSimulado) : ''}
            </SheetTitle>
          </SheetHeader>

          <div className="pt-4 space-y-3">
            {loadingRaioX ? (
              <div className="text-center py-10 text-white/50 text-xs">Calculando distribuição de disciplinas...</div>
            ) : !rawRaioXData || rawRaioXData.length === 0 ? (
              <div className="text-center py-10 text-white/50 text-xs">Raio-x não disponível para esta edição.</div>
            ) : (
              rawRaioXData.map((d: any) => (
                <div key={d.name} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-200">{d.name}</span>
                    <span className="text-xs font-black text-rose-400">{d.count} Qs ({d.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: RECENTES ───────────────────────────────────────────────────── */}
      <Sheet open={recentesOpen} onOpenChange={setRecentesOpen}>
        <SheetContent side="bottom" className="bg-[#141416] border-white/15 rounded-t-[32px] max-h-[80vh] overflow-y-auto p-6 text-white">
          <SheetHeader className="text-left pb-4 border-b border-white/10">
            <SheetTitle className="font-display font-black text-lg text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" /> Seus Simulados Recentes
            </SheetTitle>
          </SheetHeader>

          <div className="pt-4 space-y-3">
            {!historicoRecente || historicoRecente.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Você ainda não realizou nenhum simulado. Inicie um agora mesmo!
              </div>
            ) : (
              historicoRecente.map((h: any) => (
                <div key={h.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-white">
                      {h.simulado ? getExamDisplayName(h.simulado) : 'Simulado OAB'}
                    </h5>
                    <p className="text-xs text-zinc-400">
                      Resultado: <span className="font-bold text-rose-300">{h.acertos}/{h.total_questoes}</span> ({Math.round((h.acertos / (h.total_questoes || 1)) * 100)}%)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRecentesOpen(false);
                      if (h.simulado) handleStartSimulado(h.simulado);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Refazer
                  </button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: FILTRO RÁPIDO POR MATÉRIAS ─────────────────────────────────── */}
      <Sheet open={isFiltroRapidoOpen} onOpenChange={setIsFiltroRapidoOpen}>
        <SheetContent side="bottom" className="bg-[#141416] border-white/15 rounded-t-[32px] max-h-[85vh] overflow-y-auto p-6 text-white">
          <SheetHeader className="text-left pb-4 border-b border-white/10">
            <SheetTitle className="font-display font-black text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Filtro Rápido por Matérias
            </SheetTitle>
            <p className="text-xs text-zinc-400">Escolha as matérias desejadas para treinar de forma focada.</p>
          </SheetHeader>

          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MATERIAS_OAB.map((mat) => {
                const selected = selectedMateriasFilter.includes(mat.nome);
                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setSelectedMateriasFilter((prev) =>
                        prev.includes(mat.nome) ? prev.filter((m) => m !== mat.nome) : [...prev, mat.nome]
                      );
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-rose-600/20 border-rose-500 text-rose-200'
                        : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <span className="truncate">{mat.nome}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                try { haptic.selection(); } catch {}
                setIsFiltroRapidoOpen(false);
                // Inicia o simulado mais recente passando o filtro de matérias
                if (simuladosList && simuladosList.length > 0) {
                  navigate(`/simulados/resolver/${simuladosList[0].id}`, {
                    state: {
                      simulado: simuladosList[0],
                      filtroMaterias: selectedMateriasFilter,
                    },
                  });
                }
              }}
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              Iniciar com {selectedMateriasFilter.length > 0 ? `${selectedMateriasFilter.length} Matérias` : 'Todas as Matérias'}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── MODAL: PREVIEW DE PDF ─────────────────────────────────────────────── */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="font-bold text-sm text-white truncate max-w-md">{previewPdfTitle}</span>
            <button
              onClick={() => setPreviewPdfUrl(null)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={previewPdfUrl}
            title={previewPdfTitle}
            className="w-full flex-1 rounded-2xl bg-white border-0 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
