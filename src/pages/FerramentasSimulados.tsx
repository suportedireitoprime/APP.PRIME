// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  PlayCircle, Search, FileText, FileSignature, Scale,
  ChevronRight, ArrowLeft, History, BarChart3, ExternalLink, ChevronDown,
  ChevronUp, Info, CheckCircle2, Sparkles, Filter, BookOpen, Layers,
  Award, X, Trophy, Target, TrendingUp, AlertCircle, RotateCcw, Check,
  BookMarked, Flame, SlidersHorizontal
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

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

type TabType = 'todos' | 'recentes' | 'estatisticas';

// Matérias Oficiais da OAB com palavras-chave de filtro
const MATERIAS_OAB = [
  { id: 'todas', nome: 'Todas as Matérias', short: 'Todas', peso: 80 },
  { id: 'etica', nome: 'Ética Profissional (EAOAB)', short: 'Ética', keywords: ['ética', 'estatuto da advocacia', 'eaoab'], peso: 8 },
  { id: 'constitucional', nome: 'Direito Constitucional', short: 'Constitucional', keywords: ['constitucional'], peso: 6 },
  { id: 'civil', nome: 'Direito Civil', short: 'Civil', keywords: ['civil'], peso: 6 },
  { id: 'proc_civil', nome: 'Direito Processual Civil', short: 'Proc. Civil', keywords: ['processual civil', 'processo civil', 'cpc'], peso: 6 },
  { id: 'penal', nome: 'Direito Penal', short: 'Penal', keywords: ['penal'], peso: 6 },
  { id: 'proc_penal', nome: 'Direito Processual Penal', short: 'Proc. Penal', keywords: ['processual penal', 'processo penal', 'cpp'], peso: 6 },
  { id: 'trabalho', nome: 'Direito do Trabalho', short: 'Trabalho', keywords: ['do trabalho', 'clt'], peso: 5 },
  { id: 'proc_trabalho', nome: 'Direito Processual do Trabalho', short: 'Proc. Trabalho', keywords: ['processual do trabalho', 'processo do trabalho'], peso: 5 },
  { id: 'administrativo', nome: 'Direito Administrativo', short: 'Administrativo', keywords: ['administrativo'], peso: 5 },
  { id: 'tributario', nome: 'Direito Tributário', short: 'Tributário', keywords: ['tributário'], peso: 5 },
  { id: 'empresarial', nome: 'Direito Empresarial', short: 'Empresarial', keywords: ['empresarial', 'comercial'], peso: 4 },
  { id: 'direitos_humanos', nome: 'Direitos Humanos', short: 'Dir. Humanos', keywords: ['humanos'], peso: 2 },
  { id: 'consumidor', nome: 'Direito do Consumidor', short: 'Consumidor', keywords: ['consumidor', 'cdc'], peso: 2 },
  { id: 'ambiental', nome: 'Direito Ambiental', short: 'Ambiental', keywords: ['ambiental'], peso: 2 },
  { id: 'eca', nome: 'Estatuto da Criança e do Adolescente', short: 'ECA', keywords: ['criança', 'adolescente', 'eca'], peso: 2 },
  { id: 'internacional', nome: 'Direito Internacional', short: 'Internacional', keywords: ['internacional'], peso: 2 },
  { id: 'filosofia', nome: 'Filosofia do Direito', short: 'Filosofia', keywords: ['filosofia'], peso: 2 },
  { id: 'eleitoral', nome: 'Direito Eleitoral', short: 'Eleitoral', keywords: ['eleitoral'], peso: 2 },
  { id: 'financeiro', nome: 'Direito Financeiro', short: 'Financeiro', keywords: ['financeiro'], peso: 2 },
  { id: 'previdenciario', nome: 'Direito Previdenciário', short: 'Previdenciário', keywords: ['previdenciário'], peso: 2 },
];

export default function FerramentasSimulados() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const gateSimulado = useGatedFeature('simulado', 'simulados');

  // Controle de Abas solicitadas: Todos, Recentes, Estatísticas
  const [activeTab, setActiveTab] = useState<TabType>('todos');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [selectedMateria, setSelectedMateria] = useState<string>('todas');
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Modal de Filtro Rápido por Matérias
  const [isFiltroRapidoOpen, setIsFiltroRapidoOpen] = useState(false);
  const [selectedMateriasFilter, setSelectedMateriasFilter] = useState<string[]>([]);
  const [filtroQtd, setFiltroQtd] = useState<number>(40);

  const normalizeCategory = (cat: string | null | undefined) => {
    if (!cat) return null;
    const trimmed = cat.trim();
    if (trimmed.toLowerCase().includes('juiz') || trimmed.toLowerCase().includes('magistratura')) {
      return 'Juiz de Direito';
    }
    if (trimmed.toLowerCase().includes('oab') || trimmed.toLowerCase().includes('ordem')) {
      return 'OAB (Exame de Ordem)';
    }
    return trimmed;
  };

  // Por padrão foca em OAB (Exame de Ordem) se não houver categoria selecionada
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    normalizeCategory(location.state?.category) || 'OAB (Exame de Ordem)'
  );

  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [showSobre, setShowSobre] = useState(false);

  // 1. Listagem completa de Simulados
  const { data: simuladosList, isLoading } = useQuery({
    queryKey: ['simulados_list_full'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select(`
          *,
          exam:simulado_exams(name),
          simulado_questions(count)
        `)
        .order('year', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // 2. Histórico de Simulados do Usuário (para aba "Recentes")
  const { data: userHistorico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['user_simulados_historico_tab', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_simulados_historico')
        .select(`
          *,
          simulado:simulados(
            id,
            year,
            prova_url,
            gabarito_url,
            exam:simulado_exams(name)
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('Erro ao carregar histórico:', error);
        return [];
      }
      return data || [];
    },
  });

  // 3. Respostas do Usuário para gerar a aba "Estatísticas"
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['user_simulados_stats_tab', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: respostas, error } = await supabase
        .from('user_simulados_respostas')
        .select(`
          id,
          acertou,
          disciplina,
          assunto,
          created_at,
          user_simulados_historico!inner(user_id)
        `)
        .eq('user_simulados_historico.user_id', user.id);

      if (error) {
        console.warn('Erro ao carregar estatísticas:', error);
        return null;
      }

      const total = respostas?.length || 0;
      const acertos = respostas?.filter(r => r.acertou).length || 0;
      const erros = total - acertos;
      const pctGeral = total > 0 ? Math.round((acertos / total) * 100) : 0;

      // Desempenho por Disciplina
      const discMap: Record<string, { total: number; acertos: number; erros: number; temas: Record<string, { total: number; acertos: number }> }> = {};

      (respostas || []).forEach(r => {
        const d = r.disciplina || 'Outras Matérias';
        const a = r.assunto || 'Tópico Geral';

        if (!discMap[d]) {
          discMap[d] = { total: 0, acertos: 0, erros: 0, temas: {} };
        }
        discMap[d].total += 1;
        if (r.acertou) discMap[d].acertos += 1;
        else discMap[d].erros += 1;

        if (!discMap[d].temas[a]) {
          discMap[d].temas[a] = { total: 0, acertos: 0 };
        }
        discMap[d].temas[a].total += 1;
        if (r.acertou) discMap[d].temas[a].acertos += 1;
      });

      const rankingDisciplinas = Object.entries(discMap).map(([nome, item]) => {
        const pct = Math.round((item.acertos / item.total) * 100);
        const temasRank = Object.entries(item.temas).map(([tNome, t]) => ({
          nome: tNome,
          total: t.total,
          acertos: t.acertos,
          pct: Math.round((t.acertos / t.total) * 100),
        })).sort((a, b) => b.total - a.total);

        return {
          nome,
          total: item.total,
          acertos: item.acertos,
          erros: item.erros,
          pct,
          temas: temasRank,
        };
      }).sort((a, b) => b.total - a.total);

      // Disciplinas com maior acerto vs menor acerto
      const maisAcertou = [...rankingDisciplinas].filter(d => d.total >= 3).sort((a, b) => b.pct - a.pct);
      const precisaMelhorar = [...rankingDisciplinas].filter(d => d.total >= 3).sort((a, b) => a.pct - b.pct);

      return {
        total,
        acertos,
        erros,
        pctGeral,
        rankingDisciplinas,
        maisAcertou,
        precisaMelhorar,
      };
    },
  });

  // Raio-X do Simulado selecionado
  const { data: rawRaioXData, isLoading: loadingRaioX } = useQuery({
    queryKey: ['simulado_raiox', selectedSimulado?.id],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      if (!selectedSimulado) return null;
      try {
        const { data, error } = await supabase
          .from('simulado_questions')
          .select('disciplina, assunto')
          .eq('simulado_id', selectedSimulado.id);

        if (error || !data || data.length === 0) return [];

        const total = data.length;
        const counts: Record<string, { count: number; assuntos: Record<string, number> }> = {};

        data.forEach((q: any) => {
          const d = q.disciplina || 'Outras Disciplinas';
          const a = q.assunto || 'Tópico Geral';
          if (!counts[d]) counts[d] = { count: 0, assuntos: {} };
          counts[d].count++;
          if (!counts[d].assuntos[a]) counts[d].assuntos[a] = 0;
          counts[d].assuntos[a]++;
        });

        return Object.entries(counts)
          .map(([name, info]) => ({
            name,
            percent: Math.round((info.count / total) * 100),
            count: info.count,
            assuntos: Object.entries(info.assuntos)
              .map(([assunto, c]) => ({
                name: assunto,
                count: c as number,
                percent: Math.round(((c as number) / info.count) * 100),
              }))
              .sort((a, b) => b.count - a.count),
          }))
          .sort((a, b) => b.count - a.count);
      } catch (err) {
        console.warn('Erro ao carregar raio-x:', err);
        return [];
      }
    },
    enabled: !!selectedSimulado,
  });

  // Fallback de disciplinas oficiais da OAB / Magistratura
  const raioXData = useMemo(() => {
    if (rawRaioXData && rawRaioXData.length > 0) return rawRaioXData;
    if (!selectedSimulado) return [];

    return [
      { name: 'Ética Profissional (Estatuto da OAB)', percent: 10, count: 8, assuntos: [{ name: 'Prerrogativas do Advogado e Sigilo', count: 4, percent: 50 }, { name: 'Infrações e Sanções Disciplinares', count: 4, percent: 50 }] },
      { name: 'Direito Constitucional', percent: 8, count: 6, assuntos: [{ name: 'Controle de Constitucionalidade', count: 3, percent: 50 }, { name: 'Direitos e Garantias Fundamentais', count: 3, percent: 50 }] },
      { name: 'Direito Civil', percent: 8, count: 6, assuntos: [{ name: 'Parte Geral e Contratos', count: 3, percent: 50 }, { name: 'Família e Sucessões', count: 3, percent: 50 }] },
      { name: 'Direito Processual Civil', percent: 8, count: 6, assuntos: [{ name: 'Recursos e Processo de Conhecimento', count: 3, percent: 50 }] },
      { name: 'Direito Penal', percent: 8, count: 6, assuntos: [{ name: 'Teoria do Crime e Penas', count: 3, percent: 50 }] },
      { name: 'Direito Processual Penal', percent: 8, count: 6, assuntos: [{ name: 'Prisões e Procedimentos', count: 3, percent: 50 }] },
      { name: 'Direito do Trabalho', percent: 6, count: 5, assuntos: [{ name: 'Contrato de Trabalho', count: 3, percent: 60 }] },
      { name: 'Direito Processual do Trabalho', percent: 6, count: 5, assuntos: [{ name: 'Recursos Trabalhistas', count: 3, percent: 60 }] },
      { name: 'Direito Administrativo', percent: 6, count: 5, assuntos: [{ name: 'Atos e Licitações', count: 3, percent: 60 }] },
      { name: 'Direito Tributário', percent: 6, count: 5, assuntos: [{ name: 'Sistema Tributário Nacional', count: 3, percent: 60 }] },
      { name: 'Direito Empresarial', percent: 5, count: 4, assuntos: [{ name: 'Sociedades Empresárias', count: 4, percent: 100 }] },
    ];
  }, [rawRaioXData, selectedSimulado]);

  const [expandedRaioX, setExpandedRaioX] = useState<Record<string, boolean>>({});
  const toggleRaioX = (name: string) => {
    try { haptic.selection(); } catch {}
    setExpandedRaioX((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Agrupamento por Categoria
  const groupedSimulados = useMemo(() => {
    const groups: Record<string, SimuladoItem[]> = {};
    (simuladosList || []).forEach((sim) => {
      const cat = normalizeCategory(sim.exam?.name) || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sim);
    });

    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => (b.year || 0) - (a.year || 0));
    });

    return groups;
  }, [simuladosList]);

  // Itens da categoria atual (OAB) com busca e filtros
  const currentCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    const list = groupedSimulados[selectedCategory] || [];

    return list.filter((sim) => {
      const matchSearch =
        !searchTerm.trim() ||
        (sim.prova_url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.year || '').toString().includes(searchTerm) ||
        (sim.exam?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Filtro de ano
      if (yearFilter === 'digitalizadas') {
        const qCount = sim.simulado_questions?.[0]?.count || 0;
        return qCount > 0;
      }
      if (yearFilter === '2026') return sim.year === 2026;
      if (yearFilter === '2025') return sim.year === 2025;
      if (yearFilter === '2024') return sim.year === 2024;
      if (yearFilter === '2023') return sim.year === 2023;
      if (yearFilter === '2020-2022') return sim.year >= 2020 && sim.year <= 2022;
      if (yearFilter === '2015-2019') return sim.year >= 2015 && sim.year <= 2019;
      if (yearFilter === '2010-2014') return sim.year >= 2010 && sim.year <= 2014;
      if (yearFilter === '1996-2009') return sim.year < 2010;

      return true;
    });
  }, [selectedCategory, groupedSimulados, searchTerm, yearFilter]);

  const paginatedItems = useMemo(() => {
    return currentCategoryItems.slice(0, visibleCount);
  }, [currentCategoryItems, visibleCount]);

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

  const handlePreviewPdf = (e: React.MouseEvent, url: string | null | undefined, title: string) => {
    e.stopPropagation();
    try { haptic.selection(); } catch {}
    if (!url) {
      toast.info('Documento em fase de indexação.');
      return;
    }
    setPreviewPdfUrl(url);
    setPreviewPdfTitle(title);
  };

  const totalOABCount = (groupedSimulados['OAB (Exame de Ordem)'] || []).length;
  const totalHistoricoCount = (userHistorico || []).length;

  // Disparar treino customizado baseado nas matérias do Filtro Rápido
  const handleIniciarTreinoFiltro = () => {
    setIsFiltroRapidoOpen(false);
    try { haptic.selection(); } catch {}
    
    // Se selecionou matérias, navega para o simulador por matérias
    if (selectedMateriasFilter.length > 0) {
      toast.success(`Iniciando simulado de ${filtroQtd} questões focado nas matérias selecionadas!`);
      navigate(`/questoes/simulado/63fbd266-3c2d-4b91-85b7-25402ff2ac1f`, {
        state: {
          disciplinas: selectedMateriasFilter,
          quantidade: filtroQtd,
        }
      });
    } else {
      // Pega o simulado mais recente da OAB
      const topSim = currentCategoryItems[0];
      if (topSim) {
        handleStartSimulado(topSim);
      } else {
        toast.info('Selecione pelo menos uma matéria ou um simulado da lista.');
      }
    }
  };

  const toggleMateriaFilter = (nome: string) => {
    try { haptic.selection(); } catch {}
    setSelectedMateriasFilter((prev) =>
      prev.includes(nome) ? prev.filter((m) => m !== nome) : [...prev, nome]
    );
  };

  // Header superior mobile padronizado
  const mobileHeader = (
    <div className="flex items-center justify-between w-full pr-1">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            try { haptic.selection(); } catch {}
            if (selectedCategory && selectedCategory !== 'OAB (Exame de Ordem)') {
              setSelectedCategory('OAB (Exame de Ordem)');
            } else {
              navigate('/');
            }
          }}
          className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-transform"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>
        <div>
          <h1 className="font-display font-black text-base sm:text-lg text-white tracking-wide uppercase line-clamp-1">
            {selectedCategory || 'SIMULADOS & PROVAS'}
          </h1>
          <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            3.820 Questões no App • 47 Exames Unificados
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          try { haptic.selection(); } catch {}
          setShowSobre(true);
        }}
        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
        title="Sobre o Exame de Ordem"
      >
        <Info className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title={selectedCategory ? selectedCategory : 'Central de Simulados & Provas'}
      subtitle="47 Edições do Exame de Ordem Unificado (3.820 questões), cadernos oficiais e gabaritos comentados"
      mobileHeader={mobileHeader}
      wide
    >
      {/* Background ShapeGrid Oficial do App */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <ShapeGrid
          speed={0.4}
          squareSize={44}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
        />
      </div>

      <div className="relative z-10 px-3.5 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1280px] mx-auto pb-24 lg:pb-12 space-y-5">

        {/* ========================================================================= */}
        {/* MENU DE ALTERNÂNCIA: TODOS | RECENTES | ESTATÍSTICA (ESTILO QUESTÕES)     */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl backdrop-blur-md">
          
          {/* ABA 1: TODOS */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('todos');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'todos'
                ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-lg shadow-primary/20 scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Todos os Simulados</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
              activeTab === 'todos' ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'
            }`}>
              47
            </span>
          </button>

          {/* ABA 2: RECENTES */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('recentes');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'recentes'
                ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-lg shadow-primary/20 scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recentes</span>
            {totalHistoricoCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                activeTab === 'recentes' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {totalHistoricoCount}
              </span>
            )}
          </button>

          {/* ABA 3: ESTATÍSTICA */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              setActiveTab('estatisticas');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'estatisticas'
                ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-lg shadow-primary/20 scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estatística</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: TODOS OS SIMULADOS (COM FILTRO RÁPIDO & LISTA POR ANOS)            */}
        {/* ========================================================================= */}
        {activeTab === 'todos' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* ── CARD PRINCIPAL: FILTRO RÁPIDO POR MATÉRIAS (ESTILO QUESTÕES) ──── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/10 p-5 sm:p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                      Praticar por Matérias
                    </h2>
                  </div>
                  <p className="ml-3 mt-1 text-xs text-zinc-400 max-w-lg leading-relaxed">
                    Escolha as matérias que deseja treinar ou selecione uma prova oficial completa abaixo.
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  <Award className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-zinc-300">Corte 1ª Fase: 40/80</span>
                </div>
              </div>

              {/* Botão de Destaque "Filtro Rápido" */}
              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setIsFiltroRapidoOpen(true);
                }}
                className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-rose-600 to-red-600 hover:brightness-110 text-white text-base sm:text-lg font-black shadow-xl shadow-black/40 transition-all active:scale-[0.99] border border-rose-500/40"
              >
                <Filter className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
                <span className="tracking-wide text-white uppercase font-display">Filtro Rápido de Matérias</span>
                <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1 drop-shadow-md" strokeWidth={2.5} />
              </button>

              {/* Carrossel Horizontal de Matérias Oficiais da OAB */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold px-1">
                  <span>Toque para filtrar por disciplina:</span>
                  {selectedMateria !== 'todas' && (
                    <button
                      onClick={() => setSelectedMateria('todas')}
                      className="text-primary hover:underline font-bold"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {MATERIAS_OAB.map((mat) => {
                    const isSelected = selectedMateria === mat.id;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => {
                          try { haptic.selection(); } catch {}
                          setSelectedMateria(mat.id);
                        }}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-white shadow-md shadow-primary/20 border border-primary'
                            : 'bg-zinc-800/80 text-zinc-300 border border-white/10 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        <span>{mat.short}</span>
                        {mat.peso > 0 && mat.id !== 'todas' && (
                          <span className={`text-[10px] px-1 rounded font-black ${
                            isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'
                          }`}>
                            {mat.peso}Q
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── BARRA DE PESQUISA & CHIPS DE ANOS ────────────────────────────── */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar prova por número (ex: 47, 46, 42, 33), ano (2026, 2025) ou banca..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setVisibleCount(24);
                  }}
                  className="w-full h-12 pl-10 pr-10 rounded-xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary text-sm transition-colors shadow-inner"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Chips de Anos em Scroll Horizontal */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'todos', label: 'Todas as Provas' },
                  { id: 'digitalizadas', label: '⚡ 47 Exames Unificados' },
                  { id: '2026', label: '2026' },
                  { id: '2025', label: '2025' },
                  { id: '2024', label: '2024' },
                  { id: '2023', label: '2023' },
                  { id: '2020-2022', label: '2020 – 2022' },
                  { id: '2015-2019', label: '2015 – 2019' },
                  { id: '2010-2014', label: '2010 – 2014' },
                  { id: '1996-2009', label: '1996 – 2009' },
                ].map((chip) => {
                  const isActive = yearFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setYearFilter(chip.id);
                        setVisibleCount(24);
                      }}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'bg-zinc-900/90 text-zinc-400 border border-white/10 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── LISTA DOS SIMULADOS DOS ANOS ─────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Cadernos Oficiais ({currentCategoryItems.length} provas)
                </span>
                <span className="text-[11px] text-zinc-500">Ordenado por edição</span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-44 bg-zinc-900/60 rounded-2xl border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : currentCategoryItems.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-3">
                  <FileSignature className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-white">Nenhuma prova encontrada</h3>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                    Não encontramos provas com os filtros selecionados. Tente buscar por outro ano ou termo.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setYearFilter('todos');
                      setSelectedMateria('todas');
                    }}
                    className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-zinc-700"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedItems.map((sim) => {
                      const qCount = sim.simulado_questions?.[0]?.count || 0;
                      const isDigitized = qCount > 0;
                      const cleanTitle = (sim.prova_url || '')
                        .replace(/^https?:\/\/.*$/, '')
                        .trim() || `Exame ${sim.year}`;

                      return (
                        <div
                          key={sim.id}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-primary/50 transition-all duration-300 p-5 hover:bg-zinc-900/95 shadow-md"
                        >
                          {/* Top row: Year & Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-xs font-black text-white">
                              {sim.year || 'ND'}
                            </span>

                            {isDigitized ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500/20 to-red-600/20 border border-rose-500/40 text-[11px] font-black text-rose-300 uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" /> {qCount} Qs no App
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                <FileText className="w-3 h-3" /> Prova & Gabarito
                              </span>
                            )}
                          </div>

                          {/* Title and details */}
                          <div className="space-y-1.5 mb-4">
                            <h3 className="font-display font-bold text-base sm:text-lg text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {cleanTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span>1ª Fase Oficial</span>
                              <span>•</span>
                              <span>{sim.year >= 2010 ? 'FGV / CESPE' : 'OAB Estadual'}</span>
                            </div>
                          </div>

                          {/* Action buttons on card */}
                          <div className="pt-3 border-t border-white/5 space-y-2">
                            {isDigitized ? (
                              <button
                                onClick={() => handleStartSimulado(sim)}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 tracking-wide uppercase"
                              >
                                <PlayCircle className="w-4 h-4" /> INICIAR SIMULADO
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedSimulado(sim)}
                                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/5"
                              >
                                <FileText className="w-4 h-4 text-primary" /> Visualizar Caderno / Raio-X
                              </button>
                            )}

                            {/* Quick Secondary Links */}
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                onClick={(e) => handlePreviewPdf(e, sim.prova_url, `Prova ${cleanTitle}`)}
                                disabled={!sim.prova_url}
                                className="py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 text-[11px] font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                                title="Visualizar Prova"
                              >
                                <FileText className="w-3.5 h-3.5 text-zinc-400" /> Prova
                              </button>
                              <button
                                onClick={(e) => handlePreviewPdf(e, sim.gabarito_url, `Gabarito ${cleanTitle}`)}
                                disabled={!sim.gabarito_url}
                                className="py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                                title="Visualizar Gabarito"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Gabarito
                              </button>
                              <button
                                onClick={() => {
                                  try { haptic.selection(); } catch {}
                                  setSelectedSimulado(sim);
                                }}
                                className="py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 transition-colors"
                                title="Ver Raio-X"
                              >
                                <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Raio-X
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Carregar Mais */}
                  {visibleCount < currentCategoryItems.length && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 24)}
                        className="px-6 py-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-primary/50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                      >
                        <Layers className="w-4 h-4 text-primary" /> Carregar Mais Provas (+24 de {currentCategoryItems.length - visibleCount} restantes)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: RECENTES (HISTÓRICO DE SIMULADOS INICIADOS / CONCLUÍDOS)           */}
        {/* ========================================================================= */}
        {activeTab === 'recentes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Seus Simulados Recentes ({totalHistoricoCount})
              </span>
              <button
                onClick={() => setActiveTab('todos')}
                className="text-xs text-primary hover:underline font-bold"
              >
                + Fazer Novo Simulado
              </button>
            </div>

            {loadingHistorico ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-zinc-900/60 rounded-2xl border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : !userHistorico || userHistorico.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <History className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="font-display font-bold text-lg text-white">Nenhum simulado registrado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Você ainda não iniciou nenhum simulado oficial. Escolha uma prova na aba <strong>Todos</strong> para praticar com cronômetro real.
                  </p>
                </div>
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setActiveTab('todos');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-rose-600 rounded-xl text-xs font-black text-white hover:brightness-110 uppercase tracking-wider"
                >
                  Ver Lista de Provas OAB
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userHistorico.map((hist) => {
                  const sim = hist.simulado;
                  const isFinalizado = hist.status === 'finalizado';
                  const acertos = hist.acertos ?? 0;
                  const total = hist.total_questoes ?? 80;
                  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
                  const aprovado = acertos >= 40; // Corte oficial da 1ª Fase OAB: 40 acertos de 80

                  const dataFormatada = hist.started_at
                    ? new Date(hist.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Data não registrada';

                  return (
                    <div
                      key={hist.id}
                      className="bg-zinc-900/80 border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isFinalizado
                              ? aprovado
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isFinalizado ? (aprovado ? '🎉 Aprovado na 1ª Fase' : 'Finalizado') : '⏱ Em Andamento'}
                          </span>
                          <span className="text-[11px] text-zinc-400">{dataFormatada}</span>
                        </div>

                        <h4 className="font-display font-bold text-base text-white">
                          {sim?.prova_url || `Simulado OAB ${sim?.year || ''}`}
                        </h4>

                        {isFinalizado && (
                          <div className="flex items-center gap-3 text-xs text-zinc-300">
                            <span className="font-bold text-white">
                              {acertos} / {total} acertos ({pct}%)
                            </span>
                            <span>•</span>
                            <span className={aprovado ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                              {aprovado ? 'Meta de 40 pts atingida' : `Faltaram ${Math.max(0, 40 - acertos)} pontos para a meta`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isFinalizado ? (
                          <button
                            onClick={() => sim && handleStartSimulado(sim)}
                            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" /> Refazer
                          </button>
                        ) : (
                          <button
                            onClick={() => sim && handleStartSimulado(sim)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all uppercase"
                          >
                            <PlayCircle className="w-4 h-4" /> Continuar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: ESTATÍSTICA (DESEMPENHO, ONDE MAIS ACERTOU, MATÉRIAS & TEMAS)       */}
        {/* ========================================================================= */}
        {activeTab === 'estatisticas' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header de Metas OAB */}
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5" /> Raio-X de Desempenho Oficial
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                    Seu Rendimento nos Simulados OAB
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md">
                    Monitore sua evolução disciplina por disciplina e garanta seus 40 pontos na 1ª fase.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-lg">
                    40
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">Nota de Corte OAB</p>
                    <p className="text-[11px] text-zinc-400">50% de acertos para aprovação</p>
                  </div>
                </div>
              </div>

              {/* 4 Cards de Métricas Principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-3 border-t border-white/5">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Simulados Feitos</span>
                  <span className="text-2xl font-black text-white mt-1">{totalHistoricoCount || 0}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Média Geral</span>
                  <span className={`text-2xl font-black mt-1 ${
                    (statsData?.pctGeral || 0) >= 50 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {statsData?.pctGeral || 0}%
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Questões Respondidas</span>
                  <span className="text-2xl font-black text-white mt-1">{statsData?.total || 0}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Acertos / Erros</span>
                  <span className="text-2xl font-black text-white mt-1">
                    <span className="text-emerald-400">{statsData?.acertos || 0}</span>
                    <span className="text-zinc-600 text-lg mx-1">/</span>
                    <span className="text-rose-400 text-lg">{statsData?.erros || 0}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ONDE VOCÊ MAIS ACERTOU & PONTOS DE ATENÇÃO */}
            {statsData && statsData.rankingDisciplinas.length > 0 ? (
              <div className="space-y-6">
                
                {/* DESTAQUES: ONDE MAIS ACERTOU */}
                {statsData.maisAcertou.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-emerald-500" />
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Matérias com Maior Aproveitamento
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {statsData.maisAcertou.slice(0, 4).map((m, i) => (
                        <div key={i} className="bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white line-clamp-1">{m.nome}</span>
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {m.pct}% ({m.acertos}/{m.total})
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${m.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TODAS AS MATÉRIAS E TEMAS DETALHADOS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-primary" />
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-white">
                        Desempenho por Matéria & Temas
                      </h4>
                    </div>
                    <span className="text-[11px] text-zinc-500">Toque para ver os temas</span>
                  </div>

                  <div className="space-y-2.5">
                    {statsData.rankingDisciplinas.map((disc, idx) => {
                      const isExpanded = expandedRaioX[`stat_${disc.nome}`];
                      const isBom = disc.pct >= 50;
                      return (
                        <div key={idx} className="bg-zinc-900/80 border border-white/5 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => toggleRaioX(`stat_${disc.nome}`)}
                            className="w-full p-4 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors text-left"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-xs sm:text-sm font-bold text-zinc-200 line-clamp-1 pr-2">
                                {disc.nome}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                  isBom ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                                }`}>
                                  {disc.pct}% ({disc.acertos}/{disc.total})
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                                )}
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isBom ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${disc.pct}%` }}
                              />
                            </div>
                          </button>

                          {/* Temas da disciplina */}
                          {isExpanded && disc.temas?.length > 0 && (
                            <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-white/5 bg-black/40">
                              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                Temas Cobrados:
                              </p>
                              {disc.temas.map((t, j) => (
                                <div key={j} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.03] last:border-none">
                                  <span className="text-zinc-300 line-clamp-1 pr-2">• {t.nome}</span>
                                  <span className="text-[11px] font-semibold text-zinc-400 shrink-0">
                                    {t.acertos}/{t.total} ({t.pct}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ESTADO INICIAL PEDAGÓGICO: ESTRUTURA OFICIAL DE 80 QUESTÕES OAB */
              <div className="space-y-4">
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    Inicie seu primeiro simulado para gerar suas estatísticas
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Assim que você responder as questões de qualquer um dos 47 exames oficiais, seu gráfico de acertos por matéria e tema aparecerá automaticamente aqui.
                  </p>
                  <button
                    onClick={() => setActiveTab('todos')}
                    className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all uppercase"
                  >
                    Ir para Todos os Simulados
                  </button>
                </div>

                {/* Guia Oficial de Peso das 17 Matérias na 1ª Fase */}
                <div className="space-y-2.5">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 px-1">
                    Distribuição Oficial de Questões por Matéria (Prova FGV):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MATERIAS_OAB.filter(m => m.id !== 'todas').map((mat, k) => (
                      <div key={k} className="bg-zinc-900/80 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-medium">{mat.nome}</span>
                        <span className="font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                          {mat.peso} Questões
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SHEET MODAL: FILTRO RÁPIDO DE MATÉRIAS (GAVETA DE CONFIGURAÇÃO)            */}
      {/* ========================================================================= */}
      <Sheet open={isFiltroRapidoOpen} onOpenChange={setIsFiltroRapidoOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col sm:max-w-xl sm:mx-auto h-[90dvh] sm:h-[85vh] z-50"
        >
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col pb-8 space-y-5">
            <SheetHeader className="text-left shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg">
                    Filtro Rápido
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    OAB 1ª Fase
                  </span>
                </div>
                <button
                  onClick={() => setIsFiltroRapidoOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <SheetTitle className="text-xl sm:text-2xl font-display font-black text-white">
                Escolha as Matérias do Simulado
              </SheetTitle>
              <p className="text-xs text-zinc-400">
                Selecione as disciplinas que você quer focar para montar um simulado personalizado sob medida.
              </p>
            </SheetHeader>

            {/* Atalhos Rápidos de Seleção */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedMateriasFilter(MATERIAS_OAB.filter(m => m.id !== 'todas').map(m => m.nome));
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white"
              >
                Selecionar Todas (17)
              </button>
              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedMateriasFilter([
                    'Ética Profissional (EAOAB)',
                    'Direito Constitucional',
                    'Direito Civil',
                    'Direito Penal',
                    'Direito do Trabalho',
                  ]);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
              >
                Top 5 Mais Cobradas
              </button>
              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedMateriasFilter([]);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Limpar
              </button>
            </div>

            {/* Quantidade de Questões */}
            <div className="space-y-2 shrink-0 pt-2 border-t border-white/5">
              <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400">
                Quantidade de Questões:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 40, 80].map((qtd) => (
                  <button
                    key={qtd}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroQtd(qtd);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      filtroQtd === qtd
                        ? 'bg-primary text-white border border-primary shadow-md shadow-primary/20'
                        : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {qtd} Questões
                  </button>
                ))}
              </div>
            </div>

            {/* Lista com Checkboxes das 17 Matérias */}
            <div className="space-y-2 flex-1 pt-2 border-t border-white/5">
              <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400">
                Disciplinas ({selectedMateriasFilter.length} selecionadas):
              </span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {MATERIAS_OAB.filter(m => m.id !== 'todas').map((mat) => {
                  const isChecked = selectedMateriasFilter.includes(mat.nome);
                  return (
                    <button
                      key={mat.id}
                      onClick={() => toggleMateriaFilter(mat.nome)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isChecked
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-primary border-primary text-white'
                            : 'border-white/20 bg-black/40'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-bold">{mat.nome}</span>
                      </div>
                      <span className="text-[11px] font-black text-zinc-500">
                        {mat.peso}Q
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ação Primária */}
            <div className="pt-3 border-t border-white/10 shrink-0">
              <button
                onClick={handleIniciarTreinoFiltro}
                className="btn-attention-shine w-full py-4 rounded-2xl bg-gradient-to-r from-primary via-rose-600 to-red-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-110 active:scale-98 transition-all"
              >
                <PlayCircle className="w-5 h-5" /> Iniciar Simulado com Matérias ({filtroQtd} Qs)
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* SHEET MODAL: RAIO-X & OPÇÕES DO SIMULADO SELECIONADO                       */}
      {/* ========================================================================= */}
      <Sheet open={!!selectedSimulado} onOpenChange={(open) => !open && setSelectedSimulado(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col sm:max-w-lg sm:mx-auto h-[90dvh] sm:h-[85vh] z-50"
        >
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col pb-10 space-y-5">
            <SheetHeader className="text-left shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg">
                    {selectedSimulado?.year || 'Ano ND'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Caderno Oficial
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSimulado(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <SheetTitle className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                {(selectedSimulado?.prova_url || '')
                  .replace(/^https?:\/\/.*$/, '')
                  .trim() || selectedSimulado?.exam?.name || 'Simulado Oficial'}
              </SheetTitle>
            </SheetHeader>

            {/* Ação Primária */}
            <div className="space-y-3 shrink-0">
              <button
                onClick={() => selectedSimulado && handleStartSimulado(selectedSimulado)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-rose-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:opacity-95 active:scale-98 transition-all"
              >
                <PlayCircle className="w-5 h-5" /> Iniciar Modo Simulado (Com Cronômetro)
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={(e) =>
                    selectedSimulado &&
                    handlePreviewPdf(e, selectedSimulado.prova_url, `Prova ${selectedSimulado.year}`)
                  }
                  disabled={!selectedSimulado?.prova_url}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border border-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-zinc-400" /> Ver Prova PDF
                </button>
                <button
                  onClick={(e) =>
                    selectedSimulado &&
                    handlePreviewPdf(e, selectedSimulado.gabarito_url, `Gabarito ${selectedSimulado.year}`)
                  }
                  disabled={!selectedSimulado?.gabarito_url}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border border-white/5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gabarito Oficial
                </button>
                <button
                  onClick={(e) =>
                    selectedSimulado &&
                    handlePreviewPdf(e, selectedSimulado.edital_url, `Edital ${selectedSimulado.year}`)
                  }
                  disabled={!selectedSimulado?.edital_url}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border border-white/5 transition-colors"
                >
                  <FileSignature className="w-4 h-4 text-blue-400" /> Edital Oficial
                </button>
              </div>
            </div>

            {/* Seção Raio-X */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Raio-X das Disciplinas
                </h4>
                <span className="text-[11px] text-zinc-500 font-medium">Peso e proporção</span>
              </div>

              <div className="space-y-2.5">
                {loadingRaioX ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : raioXData && raioXData.length > 0 ? (
                  raioXData.map((item, i) => {
                    const isExpanded = expandedRaioX[item.name];
                    return (
                      <div key={i} className="bg-zinc-900/90 border border-white/5 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleRaioX(item.name)}
                          className="w-full p-3.5 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs sm:text-[13px] font-bold text-zinc-200 line-clamp-1 pr-2">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {item.percent}% ({item.count} Qs)
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-zinc-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-rose-500 rounded-full transition-all"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </button>

                        {isExpanded && item.assuntos?.length > 0 && (
                          <div className="px-3.5 pb-3 pt-1 space-y-1.5 border-t border-white/5 bg-black/40">
                            {item.assuntos.map((assunto, j) => (
                              <div key={j} className="flex justify-between items-center text-xs py-0.5">
                                <span className="text-zinc-400 line-clamp-1 pr-2">• {assunto.name}</span>
                                <span className="text-[11px] font-semibold text-zinc-500 shrink-0">
                                  {assunto.count} Q ({assunto.percent}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-4">Sem dados de raio-x para este simulado.</p>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* MODAL PREVIEW DE PDF EM TELA CHEIA                                        */}
      {/* ========================================================================= */}
      <Sheet open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col h-[100dvh] sm:h-[92vh] sm:max-w-4xl sm:mx-auto z-50"
        >
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-zinc-950">
            <h3 className="font-display font-bold text-sm sm:text-base text-white line-clamp-1 pr-4">
              {previewPdfTitle}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => previewPdfUrl && window.open(previewPdfUrl, '_blank')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
                title="Abrir no navegador"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full bg-zinc-950/70">
            {previewPdfUrl && (
              <iframe
                src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none"
                title={previewPdfTitle}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* MODAL SOBRE O EXAME DE ORDEM                                              */}
      {/* ========================================================================= */}
      <Sheet open={showSobre} onOpenChange={setShowSobre}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col sm:max-w-lg sm:mx-auto max-h-[85vh] z-50"
        >
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-display font-black text-white">
                Guia da 1ª Fase do Exame de Ordem
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p>
                A 1ª Fase da OAB é composta por <strong>80 questões de múltipla escolha</strong> com 4 alternativas (A, B, C, D). A nota de corte mínima é de <strong>40 acertos (50%)</strong> sem concorrência com outros candidatos.
              </p>
              <p>
                <strong>Duração:</strong> 5 horas oficiais (média de 3 minutos e 45 segundos por questão).
              </p>
              <p>
                <strong>Estratégia de Aprovação:</strong> Ética Profissional (8 questões), Constitucional (6), Civil (6), Penal (6) e Trabalho (5) representam mais de 31 pontos da prova, sendo fundamentais para ultrapassar a nota de corte.
              </p>
            </div>
            <button
              onClick={() => setShowSobre(false)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs"
            >
              Entendido
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </DesktopPageLayout>
  );
}
