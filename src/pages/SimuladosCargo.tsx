// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  ArrowLeft, Search, PlayCircle, BarChart3, FileText, Heart, X, Check,
  Sparkles, Filter, Trophy, Target, TrendingUp, AlertCircle, Clock,
  Scale, Shield, Compass, BookOpen, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { useAuth } from '@/hooks/useAuth';
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

const CARGOS_INFO: Record<string, any> = {
  oab: {
    id: 'oab',
    nome: 'OAB (Exame de Ordem)',
    orgao: 'Conselho Federal da OAB • Fundação Getulio Vargas (FGV)',
    descricao: 'Todas as 47 edições do Exame de Ordem Unificado com questões digitalizadas.',
    status: 'disponivel',
    provasQtd: 47,
    questoesQtd: 3820,
    tempoProva: '5h00',
    formato: '80 Questões Objetivas',
    notaCorte: '40 Acertos (50%)',
    imagem: '/assets/eoab-woman-fixed.webp',
  },
  juiz: {
    id: 'juiz',
    nome: 'Juiz de Direito (Magistratura Estadual)',
    orgao: 'Tribunais de Justiça Estaduais (TJSP, TJGO, TJPA, TJCE, TJTO)',
    descricao: 'Concursos oficiais para Juiz Substituto dos Tribunais de Justiça estaduais.',
    status: 'disponivel',
    provasQtd: 6,
    questoesQtd: 600,
    tempoProva: '5h00',
    formato: '100 Questões Objetivas',
    notaCorte: 'Média de 75%',
    imagem: '/assets/praticar-juiz.webp',
  },
  delegado: {
    id: 'delegado',
    nome: 'Delegado de Polícia (Civil e Federal)',
    orgao: 'Polícia Civil e Departamento de Polícia Federal',
    descricao: 'Provas oficiais de Delegado de Polícia Civil e Federal.',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    tempoProva: '5h00',
    formato: '100 a 120 Questões',
    notaCorte: 'Média 70%',
    imagem: pcDfLogo,
  },
  pf: {
    id: 'pf',
    nome: 'Polícia Federal (PF)',
    orgao: 'Departamento de Polícia Federal • Cebraspe',
    descricao: 'Simulados para Agente, Escrivão, Papiloscopista e Perito Criminal Federal.',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    tempoProva: '4h30',
    formato: '120 Questões C/E',
    notaCorte: 'Classificatória',
    imagem: pfLogo,
  },
  prf: {
    id: 'prf',
    nome: 'Polícia Rodoviária Federal (PRF)',
    orgao: 'Ministério da Justiça e Segurança Pública • Cebraspe',
    descricao: 'Concursos nacionais para Policial Rodoviário Federal.',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    tempoProva: '4h30',
    formato: '120 Questões C/E',
    notaCorte: 'Classificatória',
    imagem: prfLogo,
  },
};

const MATERIAS_OAB = [
  { id: 'etica', nome: 'Ética Profissional', peso: 8, cor: 'text-amber-400' },
  { id: 'constitucional', nome: 'Direito Constitucional', peso: 6, cor: 'text-blue-400' },
  { id: 'civil', nome: 'Direito Civil', peso: 6, cor: 'text-emerald-400' },
  { id: 'proc_civil', nome: 'Direito Processual Civil', peso: 6, cor: 'text-cyan-400' },
  { id: 'penal', nome: 'Direito Penal', peso: 6, cor: 'text-rose-400' },
  { id: 'proc_penal', nome: 'Direito Processual Penal', peso: 6, cor: 'text-red-400' },
  { id: 'trabalho', nome: 'Direito do Trabalho', peso: 5, cor: 'text-purple-400' },
  { id: 'proc_trabalho', nome: 'Direito Processual do Trabalho', peso: 5, cor: 'text-violet-400' },
  { id: 'administrativo', nome: 'Direito Administrativo', peso: 5, cor: 'text-orange-400' },
  { id: 'tributario', nome: 'Direito Tributário', peso: 5, cor: 'text-yellow-400' },
  { id: 'empresarial', nome: 'Direito Empresarial', peso: 4, cor: 'text-indigo-400' },
  { id: 'direitos_humanos', nome: 'Direitos Humanos', peso: 2, cor: 'text-pink-400' },
  { id: 'consumidor', nome: 'Direito do Consumidor', peso: 2, cor: 'text-teal-400' },
  { id: 'ambiental', nome: 'Direito Ambiental', peso: 2, cor: 'text-green-400' },
  { id: 'eca', nome: 'ECA', peso: 2, cor: 'text-sky-400' },
  { id: 'internacional', nome: 'Direito Internacional', peso: 2, cor: 'text-blue-300' },
  { id: 'filosofia', nome: 'Filosofia do Direito', peso: 2, cor: 'text-zinc-300' },
];

const getExamDisplayName = (sim: SimuladoItem) => {
  const isJuiz = (sim.exam?.name || '').toLowerCase().includes('juiz');
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
  if (/^\d{1,2}[ºoªa]?\s+Exame/i.test(raw)) return raw;
  const romanMatch = raw.match(/(X{0,3})(IX|IV|V?I{0,3})\s+Exame/i);
  if (romanMatch && romanMatch[0]) return `OAB - ${sim.year} - ${romanMatch[0]} de Ordem Unificado`;
  const numMatch = raw.match(/(\d{1,2})[ºoªa]?\s*exame/i);
  if (numMatch) return `${parseInt(numMatch[1], 10)}º Exame de Ordem Unificado (${sim.year})`;
  return raw.startsWith('http') ? `OAB - ${sim.year} - Exame de Ordem Unificado` : raw;
};

export default function SimuladosCargo() {
  const { cargoId } = useParams<{ cargoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gateSimulado = useGatedFeature('simulado', 'simulados');

  const cargo = CARGOS_INFO[cargoId || 'oab'] || CARGOS_INFO.oab;
  const isJuiz = cargo.id === 'juiz';

  // Tabs: 'provas' | 'disciplinas' | 'estatisticas'
  const [activeTab, setActiveTab] = useState<'provas' | 'disciplinas' | 'estatisticas'>('provas');

  // Filtros de Provas
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  // Filtro de Disciplinas
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);

  // Modais de Raio-X e PDF
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

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

  // 1. Carregar simulados deste cargo
  const { data: examsList, isLoading } = useQuery({
    queryKey: ['simulados_cargo_list', cargo.id],
    staleTime: 5 * 60 * 1000,
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

      if (error || !data) return [];

      return data.filter((s) => {
        const name = (s.exam?.name || '').toLowerCase();
        if (isJuiz) return name.includes('juiz') || name.includes('magistratura');
        return name.includes('oab') || name.includes('ordem');
      }) as SimuladoItem[];
    },
  });

  // 2. Histórico do usuário neste cargo
  const { data: userStats } = useQuery({
    queryKey: ['simulados_cargo_stats', cargo.id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_simulados_historico')
        .select(`
          id,
          acertos,
          total_questoes,
          created_at,
          simulado:simulados!inner(
            id,
            exam:simulado_exams!inner(name)
          )
        `)
        .eq('user_id', user.id);

      if (error || !data) return { totalResolvidos: 0, acertosTotal: 0, questoesTotal: 0 };

      const filtered = data.filter((h: any) => {
        const name = (h.simulado?.exam?.name || '').toLowerCase();
        if (isJuiz) return name.includes('juiz');
        return name.includes('oab');
      });

      const totalResolvidos = filtered.length;
      const acertosTotal = filtered.reduce((acc: number, cur: any) => acc + (cur.acertos || 0), 0);
      const questoesTotal = filtered.reduce((acc: number, cur: any) => acc + (cur.total_questoes || 0), 0);

      return { totalResolvidos, acertosTotal, questoesTotal };
    },
  });

  // 3. Raio-X
  const { data: rawRaioXData, isLoading: loadingRaioX } = useQuery({
    queryKey: ['cargo_simulado_raiox', selectedSimulado?.id],
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
      const counts: Record<string, number> = {};
      data.forEach((q: any) => {
        const d = q.disciplina || 'Outras';
        counts[d] = (counts[d] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      })).sort((a, b) => b.count - a.count);
    },
  });

  // Iniciar Simulado
  const handleStartSimulado = (sim: SimuladoItem, materiasCustom?: string[]) => {
    if (!sim) return;
    try { haptic.selection(); } catch {}
    if (gateSimulado.blocked) {
      gateSimulado.openGate();
      return;
    }
    void gateSimulado.register(sim.id);
    navigate(`/simulados/resolver/${sim.id}`, {
      state: {
        simulado: sim,
        filtroMaterias: materiasCustom && materiasCustom.length > 0 ? materiasCustom : undefined,
      },
    });
  };

  // Filtragem das Provas
  const filteredExams = useMemo(() => {
    if (!examsList) return [];
    return examsList.filter((sim) => {
      if (onlyFavorites && !favSimulados.has(sim.id)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const title = getExamDisplayName(sim).toLowerCase();
        const yearStr = (sim.year || '').toString();
        if (!title.includes(term) && !yearStr.includes(term)) return false;
      }
      if (yearFilter === '2026') return sim.year === 2026;
      if (yearFilter === '2025') return sim.year === 2025;
      if (yearFilter === '2024') return sim.year === 2024;
      if (yearFilter === '2023') return sim.year === 2023;
      if (yearFilter === '2022') return sim.year === 2022;
      if (yearFilter === '2021') return sim.year === 2021;
      if (yearFilter === '2020') return sim.year === 2020;
      if (yearFilter === 'anteriores') return sim.year < 2020;
      return true;
    });
  }, [examsList, searchTerm, yearFilter, onlyFavorites, favSimulados]);

  const paginatedExams = useMemo(() => {
    return filteredExams.slice(0, visibleCount);
  }, [filteredExams, visibleCount]);

  const aproveitamento = userStats && userStats.questoesTotal > 0
    ? Math.round((userStats.acertosTotal / userStats.questoesTotal) * 100)
    : 0;

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      {/* ── HEADER SUPERIOR NATIVO ─────────────────────────────────────────── */}
      <header className="relative z-20 px-4 sm:px-6 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 flex items-center justify-between border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <button
          onClick={() => {
            try { haptic.selection(); } catch {}
            navigate('/simulados');
          }}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label="Voltar para Simulados"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-rose-300">
            PAINEL DE CONTROLE DA CARREIRA
          </span>
          <h1 className="font-display font-black text-base sm:text-lg text-white">
            {cargo.nome}
          </h1>
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30">
            {cargo.status === 'disponivel' ? `${cargo.provasQtd} Provas` : 'Em Breve'}
          </span>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">

        {/* ── HERO BANNER DA CARREIRA ────────────────────────────────────────── */}
        <div className="relative rounded-3xl bg-gradient-to-br from-rose-950/40 via-zinc-900/90 to-[#141416] border border-rose-500/30 p-5 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/40 border border-white/15 p-2 shrink-0 flex items-center justify-center shadow-lg">
                <img
                  src={cargo.imagem}
                  alt={cargo.nome}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                    {cargo.nome}
                  </h2>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 max-w-md">
                  {cargo.orgao}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {cargo.descricao}
                </p>
              </div>
            </div>

            {/* Ação Rápida de Iniciar Mais Recente */}
            {cargo.status === 'disponivel' && examsList && examsList.length > 0 && (
              <button
                onClick={() => handleStartSimulado(examsList[0])}
                className="w-full sm:w-auto px-5 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 active:scale-95 transition-all cursor-pointer"
              >
                <PlayCircle className="w-5 h-5 fill-white/20" /> Iniciar Edição Mais Recente
              </button>
            )}
          </div>

          {/* 4 Métricas de Formato Oficial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-5 mt-4 border-t border-white/10 relative z-10">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Formato Oficial</span>
              <span className="text-sm sm:text-base font-black text-white mt-0.5">{cargo.formato}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-rose-400">Tempo de Prova</span>
              <span className="text-sm sm:text-base font-black text-rose-300 mt-0.5">{cargo.tempoProva}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Nota de Corte</span>
              <span className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">{cargo.notaCorte}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400">Seu Aproveitamento</span>
              <span className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                {userStats?.totalResolvidos ? `${aproveitamento}%` : 'Não iniciado'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3 ABAS DE CONTROLE (PROVAS, DISCIPLINAS, ESTATÍSTICAS) ─────────── */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141416] border border-white/10 shadow-lg">
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('provas');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'provas'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Provas Oficiais ({cargo.provasQtd})
          </button>

          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('disciplinas');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'disciplinas'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtro Disciplinas
          </button>

          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('estatisticas');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'estatisticas'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Estatísticas
          </button>
        </div>

        {/* ── ABA 1: PROVAS OFICIAIS EM LISTA COMPACTA ──────────────────────── */}
        {activeTab === 'provas' && (
          <section className="space-y-4">
            {/* Campo de Busca Rápida */}
            <div className="relative">
              <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prova por número do exame ou ano…"
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

            {/* Chips de Anos */}
            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'todos', label: 'Todas as Edições' },
                { id: '2026', label: '2026' },
                { id: '2025', label: '2025' },
                { id: '2024', label: '2024' },
                { id: '2023', label: '2023' },
                { id: '2022', label: '2022' },
                { id: '2021', label: '2021' },
                { id: '2020', label: '2020' },
                { id: 'anteriores', label: 'Anteriores' },
              ].map((chip) => {
                const active = yearFilter === chip.id && !onlyFavorites;
                return (
                  <button
                    key={chip.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setYearFilter(chip.id);
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

            {/* Lista Compacta de Provas */}
            <div className="space-y-2 pt-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-white/50">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-3" />
                  Carregando provas da carreira...
                </div>
              ) : paginatedExams.length === 0 ? (
                <div className="text-center py-16 text-white/50 text-sm space-y-3 bg-[#141416]/50 rounded-2xl border border-white/5 p-8">
                  <Scale className="w-10 h-10 text-white/20 mx-auto" />
                  <p>Nenhuma prova encontrada para este filtro.</p>
                </div>
              ) : (
                paginatedExams.map((sim) => {
                  const title = getExamDisplayName(sim);
                  const isFav = favSimulados.has(sim.id);
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
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors">
                          <span className="text-[12px] sm:text-[13px] font-black text-white leading-none">
                            {sim.year}
                          </span>
                          <span className="text-[8.5px] sm:text-[9px] font-extrabold text-rose-400 uppercase tracking-tighter mt-0.5">
                            {isJuiz ? 'JUIZ' : 'OAB'}
                          </span>
                        </div>

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
                            <span className="hidden md:inline">{cargo.tempoProva}</span>
                          </div>
                        </div>
                      </div>

                      {/* Direita: Ações Compactas */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Raio-X */}
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

                        {/* Gabarito */}
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

                        {/* Favoritar */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavSimulado(sim.id, e)}
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-rose-400 active:scale-95 flex items-center justify-center transition cursor-pointer"
                          title="Favoritar Simulado"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* Iniciar */}
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

              {filteredExams.length > visibleCount && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setVisibleCount((prev) => prev + 24);
                    }}
                    className="px-6 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
                  >
                    Carregar Mais ({filteredExams.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── ABA 2: FILTRO RÁPIDO DE DISCIPLINAS DA CARREIRA ─────────────────── */}
        {activeTab === 'disciplinas' && (
          <section className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" /> Treinamento Focado por Matérias
              </h3>
              <p className="text-xs text-zinc-400">
                Selecione as disciplinas que deseja treinar com questões oficiais desta carreira.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MATERIAS_OAB.map((mat) => {
                const selected = selectedDisciplinas.includes(mat.nome);
                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setSelectedDisciplinas((prev) =>
                        prev.includes(mat.nome) ? prev.filter((m) => m !== mat.nome) : [...prev, mat.nome]
                      );
                    }}
                    className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-rose-600/20 border-rose-500 text-rose-200 shadow-md'
                        : 'bg-[#141416] border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="truncate block font-bold">{mat.nome}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold">{mat.peso} Questões na prova</span>
                    </div>
                    {selected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                try { haptic.selection(); } catch {}
                if (examsList && examsList.length > 0) {
                  handleStartSimulado(examsList[0], selectedDisciplinas);
                }
              }}
              className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-rose-950/60 cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 fill-white/20" /> Iniciar com {selectedDisciplinas.length > 0 ? `${selectedDisciplinas.length} Matérias Selecionadas` : 'Todas as Disciplinas'}
            </button>
          </section>
        )}

        {/* ── ABA 3: ESTATÍSTICAS DA CARREIRA ─────────────────────────────────── */}
        {activeTab === 'estatisticas' && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#141416] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Simulados Realizados</span>
                <p className="font-display font-black text-2xl text-white mt-1">
                  {userStats?.totalResolvidos || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">De {cargo.provasQtd} provas disponíveis</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141416] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-rose-400">Total de Acertos</span>
                <p className="font-display font-black text-2xl text-rose-300 mt-1">
                  {userStats?.acertosTotal || 0} / {userStats?.questoesTotal || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Questões oficiais resolvidas</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141416] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Índice de Acertos</span>
                <p className="font-display font-black text-2xl text-emerald-300 mt-1">
                  {aproveitamento}%
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Média necessária: {cargo.notaCorte}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/simulados/estatisticas')}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" /> Ver Relatório Completo de Desempenho
            </button>
          </section>
        )}
      </main>

      {/* ── SHEET: RAIO-X ────────────────────────────────────────────────────── */}
      <Sheet open={!!selectedSimulado} onOpenChange={(open) => !open && setSelectedSimulado(null)}>
        <SheetContent side="bottom" className="bg-[#141416] border-white/15 rounded-t-[32px] max-h-[85vh] overflow-y-auto p-6 text-white">
          <SheetHeader className="text-left space-y-1 pb-4 border-b border-white/10">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
              Raio-X Oficial da Edição
            </span>
            <SheetTitle className="font-display font-black text-lg text-white">
              {selectedSimulado ? getExamDisplayName(selectedSimulado) : ''}
            </SheetTitle>
          </SheetHeader>

          <div className="pt-4 space-y-2.5">
            {loadingRaioX ? (
              <div className="text-center py-10 text-white/50 text-xs">Calculando disciplinas...</div>
            ) : !rawRaioXData || rawRaioXData.length === 0 ? (
              <div className="text-center py-10 text-white/50 text-xs">Raio-x não disponível para esta edição.</div>
            ) : (
              rawRaioXData.map((d: any) => (
                <div key={d.name} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
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
