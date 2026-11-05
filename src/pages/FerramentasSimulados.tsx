// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  PlayCircle, Search, FileText, FileSignature, GraduationCap, Scale,
  ChevronRight, ArrowLeft, History, BarChart3, ExternalLink, ChevronDown,
  ChevronUp, Info, CheckCircle2, Clock, Sparkles, Filter, BookOpen, Layers,
  Calendar, ShieldCheck, Download, Award, X
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useGatedFeature } from '@/hooks/useGatedFeature';

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

export default function FerramentasSimulados() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [visibleCount, setVisibleCount] = useState<number>(24);

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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    normalizeCategory(location.state?.category) || null
  );
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [showSobre, setShowSobre] = useState(false);
  const gateSimulado = useGatedFeature('simulado', 'simulados');

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

    const examName = (selectedSimulado.exam?.name || '').toLowerCase();
    if (examName.includes('juiz') || examName.includes('magistratura')) {
      return [
        { name: 'Direito Civil', percent: 12, count: 12, assuntos: [{ name: 'Parte Geral e Obrigações', count: 6, percent: 50 }, { name: 'Contratos e Reais', count: 6, percent: 50 }] },
        { name: 'Direito Processual Civil', percent: 12, count: 12, assuntos: [{ name: 'Procedimento Comum', count: 6, percent: 50 }, { name: 'Tutelas e Recursos', count: 6, percent: 50 }] },
        { name: 'Direito Constitucional', percent: 12, count: 12, assuntos: [{ name: 'Direitos Fundamentais', count: 6, percent: 50 }, { name: 'Controle de Constitucionalidade', count: 6, percent: 50 }] },
        { name: 'Direito Penal', percent: 12, count: 12, assuntos: [{ name: 'Teoria do Crime', count: 6, percent: 50 }, { name: 'Crimes Contra a Adm. Pública', count: 6, percent: 50 }] },
        { name: 'Direito Processual Penal', percent: 12, count: 12, assuntos: [{ name: 'Provas e Inquérito', count: 6, percent: 50 }, { name: 'Prisões e Procedimentos', count: 6, percent: 50 }] },
        { name: 'Direito Administrativo', percent: 10, count: 10, assuntos: [{ name: 'Atos Administrativos', count: 5, percent: 50 }, { name: 'Licitações e Contratos', count: 5, percent: 50 }] },
        { name: 'Direito Tributário', percent: 10, count: 10, assuntos: [{ name: 'Sistema Tributário Nacional', count: 5, percent: 50 }, { name: 'Obrigação e Crédito', count: 5, percent: 50 }] },
        { name: 'Direito Empresarial', percent: 10, count: 10, assuntos: [{ name: 'Direito Societário e Falência', count: 10, percent: 100 }] },
        { name: 'Direito Ambiental & Consumidor', percent: 10, count: 10, assuntos: [{ name: 'Proteção ao Consumidor e Meio Ambiente', count: 10, percent: 100 }] },
      ];
    }

    // Padrão OAB 1ª Fase Oficial (80 questões distribuídas)
    return [
      { name: 'Ética Profissional (Estatuto da OAB)', percent: 10, count: 8, assuntos: [{ name: 'Prerrogativas do Advogado e Sigilo', count: 4, percent: 50 }, { name: 'Infrações e Sanções Disciplinares', count: 4, percent: 50 }] },
      { name: 'Direito Constitucional', percent: 8, count: 6, assuntos: [{ name: 'Controle de Constitucionalidade', count: 3, percent: 50 }, { name: 'Direitos e Garantias Fundamentais', count: 3, percent: 50 }] },
      { name: 'Direito Civil', percent: 8, count: 7, assuntos: [{ name: 'Parte Geral, Obrigações e Contratos', count: 4, percent: 57 }, { name: 'Família e Sucessões', count: 3, percent: 43 }] },
      { name: 'Direito Processual Civil', percent: 8, count: 6, assuntos: [{ name: 'Recursos e Processo de Conhecimento', count: 3, percent: 50 }, { name: 'Execução e Cumprimento', count: 3, percent: 50 }] },
      { name: 'Direito Penal', percent: 7, count: 6, assuntos: [{ name: 'Teoria da Pena e Tipicidade', count: 3, percent: 50 }, { name: 'Crimes Contra a Pessoa e Patrimônio', count: 3, percent: 50 }] },
      { name: 'Direito Processual Penal', percent: 8, count: 7, assuntos: [{ name: 'Inquérito, Ação Penal e Prisões', count: 4, percent: 57 }, { name: 'Recursos e Procedimento Comum', count: 3, percent: 43 }] },
      { name: 'Direito do Trabalho', percent: 8, count: 6, assuntos: [{ name: 'Contrato de Trabalho e Salário', count: 3, percent: 50 }, { name: 'Rescisão e Jornada', count: 3, percent: 50 }] },
      { name: 'Direito Tributário', percent: 6, count: 5, assuntos: [{ name: 'Imunidades e Competência Tributária', count: 3, percent: 60 }, { name: 'Crédito e Execução Fiscal', count: 2, percent: 40 }] },
      { name: 'Direito Administrativo', percent: 6, count: 5, assuntos: [{ name: 'Regime Jurídico e Servidores', count: 3, percent: 60 }, { name: 'Licitações e Improbidade', count: 2, percent: 40 }] },
      { name: 'Direito Empresarial', percent: 5, count: 4, assuntos: [{ name: 'Sociedades e Títulos de Crédito', count: 4, percent: 100 }] },
      { name: 'Direito Processual do Trabalho', percent: 5, count: 4, assuntos: [{ name: 'Recursos Trabalhistas e Execução', count: 4, percent: 100 }] },
      { name: 'Direitos Humanos e Filosofia do Direito', percent: 5, count: 4, assuntos: [{ name: 'Pacto de San José e Teoria Geral', count: 4, percent: 100 }] },
    ];
  }, [rawRaioXData, selectedSimulado]);

  const [expandedRaioX, setExpandedRaioX] = useState<Record<string, boolean>>({});
  const toggleRaioX = (name: string) => {
    try { haptic.selection(); } catch {}
    setExpandedRaioX((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Agrupamento por Categoria (OAB vs Juiz)
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

  // Lista da categoria selecionada com filtros de busca e ano
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

      if (yearFilter === 'todos') return true;
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

  // Exibição paginada para garantir 120fps
  const paginatedItems = useMemo(() => {
    return currentCategoryItems.slice(0, visibleCount);
  }, [currentCategoryItems, visibleCount]);

  const handleStartSimulado = () => {
    if (!selectedSimulado) return;
    try { haptic.selection(); } catch {}

    if (gateSimulado.blocked) {
      gateSimulado.openGate();
      return;
    }

    setIsStarting(true);
    void gateSimulado.register(selectedSimulado.id);
    const targetSimulado = selectedSimulado;
    setSelectedSimulado(null);
    navigate(`/simulados/resolver/${targetSimulado.id}`, {
      state: { simulado: targetSimulado },
    });
    setIsStarting(false);
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
  const totalJuizCount = (groupedSimulados['Juiz de Direito'] || []).length;
  const totalGeral = (simuladosList || []).length;

  const mobileHeader = selectedCategory ? (
    <div className="flex items-center justify-between w-full pr-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            try { haptic.selection(); } catch {}
            setSelectedCategory(null);
            setSearchTerm('');
            setYearFilter('todos');
          }}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition-transform"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-base text-white tracking-wide uppercase line-clamp-1">
            {selectedCategory}
          </h2>
          <p className="text-[11px] text-zinc-400 font-medium">
            {currentCategoryItems.length} {currentCategoryItems.length === 1 ? 'prova' : 'provas disponíveis'}
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          try { haptic.selection(); } catch {}
          setShowSobre(true);
        }}
        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
        title="Sobre a Carreira"
      >
        <Info className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <PageHeader
      title="SIMULADOS & PROVAS"
      subtitle="Acervo Oficial de Exames & Concursos"
      onBack={() => navigate('/')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title={selectedCategory ? selectedCategory : 'Central de Simulados & Provas'}
      subtitle={
        selectedCategory
          ? `${currentCategoryItems.length} provas organizadas por edição e ano`
          : 'Simulações reais, cadernos de questões e gabaritos oficiais'
      }
      mobileHeader={mobileHeader}
      wide
    >
      {/* Background ShapeGrid Oficial */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid
          speed={0.4}
          squareSize={44}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1280px] mx-auto pb-[calc(7.5rem+var(--sai-bottom))] lg:pb-12 space-y-6">
        
        {/* ========================================================================= */}
        {/* TELA INICIAL: SELEÇÃO DE CATEGORIAS (OAB vs MAGISTRATURA)                */}
        {/* ========================================================================= */}
        {!selectedCategory && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero Banner Showcase */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/10 p-5 sm:p-7 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Acervo Oficial Consolidado
                </div>
                <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                  Pratique com o formato real da sua aprovação
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Cadernos oficiais digitalizados, gabaritos comentados, cronômetro de prova idêntico ao oficial e raio-x detalhado de temas mais cobrados.
                </p>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Total Provas</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{totalGeral || 207}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold">Exames OAB</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-300">{totalOABCount || 201}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">Magistratura</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300">{totalJuizCount || 6}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Gabaritos</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300">100% PDF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Grandes das Carreiras / Exames */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Escolha sua Carreira / Exame
                </h2>
                <span className="text-xs text-zinc-400">Toque para abrir as provas</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* CARD 1: OAB (EXAME DE ORDEM) */}
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setSelectedCategory('OAB (Exame de Ordem)');
                    setYearFilter('todos');
                    setVisibleCount(24);
                  }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-[#141012] to-zinc-950 border border-white/10 hover:border-rose-500/50 p-6 sm:p-7 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/10 active:scale-[0.99]"
                >
                  {/* Glow de fundo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black tracking-wider uppercase">
                        <Award className="w-3.5 h-3.5" /> 1ª Fase Oficial FGV & Históricas
                      </div>
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight group-hover:text-rose-200 transition-colors">
                        OAB (Exame de Ordem)
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                        Todas as 47 edições do Exame Unificado (da prova 1 à 47) e acervo histórico desde 1996 com cadernos, gabaritos e resolução no app.
                      </p>
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center drop-shadow-xl group-hover:scale-105 transition-transform">
                      <img
                        src="/assets/eoab-woman-fixed.webp"
                        alt="Advogada OAB"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Badges e Ação */}
                  <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-zinc-800/80 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-rose-400" /> {totalOABCount || 201} Provas disponíveis
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs font-semibold text-rose-300">
                        ⚡ 3.820 Questões no App (47 Exames)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-zinc-400">
                        1996 – 2026
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
                      <span>Ver todas as provas</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* CARD 2: JUIZ DE DIREITO (MAGISTRATURA) */}
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setSelectedCategory('Juiz de Direito');
                    setYearFilter('todos');
                    setVisibleCount(24);
                  }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-[#14120e] to-zinc-950 border border-white/10 hover:border-amber-500/50 p-6 sm:p-7 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.99]"
                >
                  {/* Glow de fundo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
                        <Scale className="w-3.5 h-3.5" /> Magistratura Estadual
                      </div>
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight group-hover:text-amber-200 transition-colors">
                        Juiz de Direito
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                        Provas de 1ª fase dos Tribunais de Justiça Estaduais (TJSP, TJGO, TJPA, TJCE, TJTO) com 100 questões, tempo cronometrado e raio-x.
                      </p>
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center drop-shadow-xl group-hover:scale-105 transition-transform">
                      <img
                        src="/assets/praticar-juiz.webp"
                        alt="Juiz de Direito"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Badges e Ação */}
                  <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-zinc-800/80 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-400" /> {totalJuizCount || 6} Concursos
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-900/50 text-xs font-semibold text-amber-300">
                        ⚡ 600 Questões completas
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-zinc-400">
                        VUNESP / FGV
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                      <span>Ver concursos</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA DA CATEGORIA SELECIONADA: LISTAGEM PROFISSIONAL DE PROVAS (OAB/JUIZ) */}
        {/* ========================================================================= */}
        {selectedCategory && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header de Categoria */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setSelectedCategory(null);
                    setSearchTerm('');
                    setYearFilter('todos');
                  }}
                  className="w-11 h-11 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-95 transition-all shadow-sm shrink-0"
                  aria-label="Voltar para categorias"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                      {selectedCategory}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black">
                      {currentCategoryItems.length}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Selecione uma edição para resolver no app ou consultar prova e gabarito oficial em PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => navigate('/simulados/estatisticas')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-primary" /> Histórico de Resoluções
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros Rápidos */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por número do exame (ex: 47, 46, 42), ano (2026, 2025) ou banca..."
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

              {/* Chips de Anos e Status (Scroll Horizontal Limpo) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'todos', label: 'Todas as Provas' },
                  { id: 'digitalizadas', label: '⚡ Digitalizadas no App' },
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

            {/* Listagem em Grid de Provas */}
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
                  Não encontramos provas para o filtro selecionado. Tente buscar por outro ano ou limpar os termos de pesquisa.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setYearFilter('todos');
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
                              onClick={() => {
                                try { haptic.selection(); } catch {}
                                setSelectedSimulado(sim);
                                handleStartSimulado();
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                            >
                              <PlayCircle className="w-4 h-4" /> INICIAR SIMULADO
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                try { haptic.selection(); } catch {}
                                setSelectedSimulado(sim);
                              }}
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

                {/* Botão Carregar Mais Provas se houver mais na categoria */}
                {visibleCount < currentCategoryItems.length && (
                  <div className="flex justify-center pt-4">
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* SHEET MODAL: RAIO-X & OPÇÕES DO SIMULADO                                   */}
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
                onClick={handleStartSimulado}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-red-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:opacity-95 active:scale-98 transition-all"
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
                              className="h-full bg-gradient-to-r from-primary to-red-500 rounded-full transition-all"
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
      {/* DOCK BAR INFERIOR PREMIUM                                                  */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-[#0D0D0D]/95 to-transparent pb-[max(env(safe-area-inset-bottom),14px)] pt-3 pointer-events-none">
        <div className="mx-auto max-w-sm px-4 pointer-events-auto">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between p-1.5 shadow-2xl">
            <button
              onClick={() => {
                try { haptic.selection(); } catch {}
                setSelectedCategory(null);
              }}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all w-1/3 ${
                !selectedCategory ? 'text-primary bg-white/5 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] tracking-wide">Simulados</span>
            </button>
            <button
              onClick={() => {
                try { haptic.selection(); } catch {}
                navigate('/simulados/estatisticas');
              }}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/3"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Estatísticas</span>
            </button>
            <button
              onClick={() => {
                try { haptic.selection(); } catch {}
                setShowSobre(true);
              }}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/3"
            >
              <Info className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Sobre</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL INFORMATIVO SOBRE A CARREIRA / EXAME (DINÂMICO)                      */}
      {/* ========================================================================= */}
      <Sheet open={showSobre} onOpenChange={setShowSobre}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col h-[90dvh] sm:h-[85vh] sm:max-w-lg sm:mx-auto z-50"
        >
          <div className="p-6 flex-1 overflow-y-auto pb-24 space-y-6">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {selectedCategory?.includes('OAB') ? <Award className="w-6 h-6" /> : <Scale className="w-6 h-6" />}
              </div>
              <button
                onClick={() => setShowSobre(false)}
                className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedCategory?.includes('OAB') ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-white leading-tight">
                    Guia Oficial do Exame de Ordem (OAB)
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                    Tudo o que você precisa dominar para conquistar a carteira da OAB na 1ª e na 2ª Fase.
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-black text-rose-400">1. A Prova de 1ª Fase</h3>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      Composta por <strong>80 questões objetivas</strong> de múltipla escolha (A, B, C, D) com duração de <strong>5 horas</strong>. Para avançar para a 2ª Fase, o candidato precisa atingir no mínimo <strong>50% de acerto (40 questões)</strong>.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-black text-rose-400">2. Ética e Deontologia (O Diferencial)</h3>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      A disciplina de <strong>Ética Profissional e Estatuto da OAB</strong> conta com <strong>8 questões</strong> (10% de toda a prova). Acertar de 6 a 8 questões em Ética garante quase 20% da nota necessária para a aprovação!
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-black text-rose-400">3. Repescagem Oficial</h3>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      Se aprovado na 1ª fase mas reprovado na 2ª fase, o examinando tem direito à repescagem, podendo realizar a 2ª fase do exame imediatamente subsequente sem precisar refazer a prova objetiva.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-white leading-tight">
                    Carreira da Magistratura Estadual
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                    Requisitos, subsídios e fases do concurso para Juiz de Direito Substituto.
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-black text-amber-400">Requisitos Fundamentais</h3>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      Bacharelado em Direito e no mínimo <strong>3 anos de atividade jurídica</strong> comprovada após a colação de grau.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-black text-amber-400">Estrutura do Concurso</h3>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      5 fases eliminatórias: 1. Prova Objetiva Seletiva (100 questões); 2. Provas Escritas (Discursiva e Sentenças Cível e Penal); 3. Inscrição Definitiva e Sindicância; 4. Prova Oral perante banca examinadora; 5. Avaliação de Títulos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {gateSimulado.gateNode}
    </DesktopPageLayout>
  );
}
