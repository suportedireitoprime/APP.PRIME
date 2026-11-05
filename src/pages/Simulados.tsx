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
  Shield, Flame, Compass, Bookmark, Clock, Gavel, Briefcase, UserCheck
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

type TabType = 'todos' | 'recentes' | 'estatisticas';

// Catálogo das Carreiras e Concursos Públicos
const CARREIRAS_CATALOGO = [
  {
    id: 'oab',
    nome: 'OAB (Exame de Ordem)',
    orgao: 'Conselho Federal da OAB',
    status: 'disponivel',
    provasQtd: 47,
    questoesQtd: 3820,
    descricao: 'Todas as 47 edições do Exame Unificado (1ª Fase FGV) com 3.820 questões no app.',
    badge: '47 Provas no App',
    imagem: '/assets/eoab-woman-fixed.webp',
    destaque: true,
    cor: 'from-rose-500/20 via-rose-950/40 to-black',
    borda: 'hover:border-rose-500/50',
    tagCor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  {
    id: 'juiz_direito',
    nome: 'Juiz de Direito (Magistratura Estadual)',
    orgao: 'Tribunais de Justiça (TJSP, TJGO, TJPA, TJCE, TJTO)',
    status: 'disponivel',
    provasQtd: 6,
    questoesQtd: 600,
    descricao: 'Concursos oficiais para Juiz Substituto dos Tribunais Estaduais (100 questões por prova).',
    badge: '6 Concursos',
    imagem: '/assets/praticar-juiz.webp',
    destaque: true,
    cor: 'from-amber-500/20 via-amber-950/40 to-black',
    borda: 'hover:border-amber-500/50',
    tagCor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    id: 'juiz_trabalho',
    nome: 'Juiz do Trabalho (TRT / CSJT)',
    orgao: 'Tribunal Superior do Trabalho & Enamat',
    status: 'em_breve',
    provasQtd: 2,
    questoesQtd: 200,
    descricao: 'Concurso Nacional Unificado da Magistratura do Trabalho (1ª Fase Objetiva).',
    badge: 'Em Breve',
    icone: Gavel,
    destaque: false,
    cor: 'from-blue-500/10 via-zinc-900 to-black',
    borda: 'hover:border-blue-500/40',
    tagCor: 'bg-blue-500/15 text-blue-300 border-blue-500/20'
  },
  {
    id: 'policia_federal',
    nome: 'Polícia Federal (PF)',
    orgao: 'Departamento de Polícia Federal',
    status: 'em_breve',
    provasQtd: 5,
    questoesQtd: 600,
    descricao: 'Simulados para Agente, Escrivão, Papiloscopista e Delegado de Polícia Federal (Cebraspe).',
    badge: 'Em Alta • Em Breve',
    imagem: pfLogo,
    destaque: true,
    cor: 'from-sky-500/15 via-zinc-900 to-black',
    borda: 'hover:border-sky-500/40',
    tagCor: 'bg-sky-500/15 text-sky-300 border-sky-500/20'
  },
  {
    id: 'prf',
    nome: 'Polícia Rodoviária Federal (PRF)',
    orgao: 'Departamento de Polícia Rodoviária Federal',
    status: 'em_breve',
    provasQtd: 4,
    questoesQtd: 480,
    descricao: 'Policial Rodoviário Federal - Provas com Trânsito, Legislação Especial e Direito.',
    badge: 'Em Alta • Em Breve',
    imagem: prfLogo,
    destaque: true,
    cor: 'from-yellow-500/15 via-zinc-900 to-black',
    borda: 'hover:border-yellow-500/40',
    tagCor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20'
  },
  {
    id: 'promotor',
    nome: 'Promotor de Justiça (Ministério Público)',
    orgao: 'MPE (MPSP, MPMG, MPDFT) & MPF',
    status: 'em_breve',
    provasQtd: 4,
    questoesQtd: 400,
    descricao: 'Carreira de Promotor de Justiça e Procurador da República (1ª Fase Objetiva).',
    badge: 'Em Breve',
    icone: Shield,
    destaque: false,
    cor: 'from-emerald-500/10 via-zinc-900 to-black',
    borda: 'hover:border-emerald-500/40',
    tagCor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
  },
  {
    id: 'defensoria',
    nome: 'Defensoria Pública (DPE & DPU)',
    orgao: 'Defensorias Públicas Estaduais e União',
    status: 'em_breve',
    provasQtd: 3,
    questoesQtd: 300,
    descricao: 'Defensor Público Estadual (DPSP, DPE-RJ, DPE-MG) e Federal.',
    badge: 'Em Breve',
    icone: Scale,
    destaque: false,
    cor: 'from-teal-500/10 via-zinc-900 to-black',
    borda: 'hover:border-teal-500/40',
    tagCor: 'bg-teal-500/15 text-teal-300 border-teal-500/20'
  },
  {
    id: 'delegado_civil',
    nome: 'Delegado de Polícia Civil',
    orgao: 'Polícias Civis Estaduais (PCSP, PCRJ, PCMG, PCGO)',
    status: 'em_breve',
    provasQtd: 4,
    questoesQtd: 400,
    descricao: 'Delegado de Polícia Civil - Direito Penal, Processo Penal e Criminologia.',
    badge: 'Em Breve',
    imagem: pcDfLogo,
    destaque: false,
    cor: 'from-red-500/10 via-zinc-900 to-black',
    borda: 'hover:border-red-500/40',
    tagCor: 'bg-red-500/15 text-red-300 border-red-500/20'
  },
  {
    id: 'analista_tribunais',
    nome: 'Analista & Técnico Judiciário',
    orgao: 'Tribunais Federais e Estaduais (TRF, TRT, TJ, TRE)',
    status: 'em_breve',
    provasQtd: 8,
    questoesQtd: 800,
    descricao: 'Área Judiciária e Oficial de Justiça dos Tribunais (FCC, FGV, Cebraspe).',
    badge: 'Em Breve',
    icone: Briefcase,
    destaque: false,
    cor: 'from-indigo-500/10 via-zinc-900 to-black',
    borda: 'hover:border-indigo-500/40',
    tagCor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
  },
  {
    id: 'procuradorias',
    nome: 'Procuradorias (AGU, PGE & PGM)',
    orgao: 'Advocacia-Geral da União, PGEs e PGMs',
    status: 'em_breve',
    provasQtd: 4,
    questoesQtd: 400,
    descricao: 'Advocacia Pública: Advogado da União, Procurador do Estado e Municipal.',
    badge: 'Em Breve',
    icone: Award,
    destaque: false,
    cor: 'from-purple-500/10 via-zinc-900 to-black',
    borda: 'hover:border-purple-500/40',
    tagCor: 'bg-purple-500/15 text-purple-300 border-purple-500/20'
  }
];

// Matérias da OAB para o Filtro Rápido
const MATERIAS_OAB = [
  { id: 'todas', nome: 'Todas as Matérias', short: 'Todas', peso: 80 },
  { id: 'etica', nome: 'Ética Profissional (EAOAB)', short: 'Ética', peso: 8 },
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

  // Estado de Carreira Selecionada (null = HUB Geral de Carreiras)
  const [selectedCareer, setSelectedCareer] = useState<string | null>(
    location.state?.category ? (location.state.category.includes('Juiz') ? 'juiz_direito' : 'oab') : null
  );

  // Controle de Abas dentro da Carreira (Todos | Recentes | Estatística)
  const [activeTab, setActiveTab] = useState<TabType>('todos');

  // Filtros de Provas
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [selectedMateria, setSelectedMateria] = useState<string>('todas');
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Modal Filtro Rápido por Matérias
  const [isFiltroRapidoOpen, setIsFiltroRapidoOpen] = useState(false);
  const [selectedMateriasFilter, setSelectedMateriasFilter] = useState<string[]>([]);
  const [filtroQtd, setFiltroQtd] = useState<number>(40);

  // Modais de PDF e Raio-X
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [showSobre, setShowSobre] = useState(false);

  // 1. Carregar lista completa de simulados do banco
  const { data: simuladosList, isLoading } = useQuery({
    queryKey: ['simulados_list_hub'],
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

  // 2. Histórico do Usuário
  const { data: userHistorico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['user_simulados_historico_hub', user?.id],
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

      if (error) return [];
      return data || [];
    },
  });

  // 3. Estatísticas por Resposta
  const { data: statsData } = useQuery({
    queryKey: ['user_simulados_stats_hub', user?.id],
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

      if (error || !respostas) return null;

      const total = respostas.length;
      const acertos = respostas.filter(r => r.acertou).length;
      const erros = total - acertos;
      const pctGeral = total > 0 ? Math.round((acertos / total) * 100) : 0;

      const discMap: Record<string, { total: number; acertos: number; erros: number; temas: Record<string, { total: number; acertos: number }> }> = {};

      respostas.forEach(r => {
        const d = r.disciplina || 'Outras';
        const a = r.assunto || 'Geral';
        if (!discMap[d]) discMap[d] = { total: 0, acertos: 0, erros: 0, temas: {} };
        discMap[d].total += 1;
        if (r.acertou) discMap[d].acertos += 1;
        else discMap[d].erros += 1;

        if (!discMap[d].temas[a]) discMap[d].temas[a] = { total: 0, acertos: 0 };
        discMap[d].temas[a].total += 1;
        if (r.acertou) discMap[d].temas[a].acertos += 1;
      });

      const rankingDisciplinas = Object.entries(discMap).map(([nome, item]) => ({
        nome,
        total: item.total,
        acertos: item.acertos,
        erros: item.erros,
        pct: Math.round((item.acertos / item.total) * 100),
        temas: Object.entries(item.temas).map(([tNome, t]) => ({
          nome: tNome,
          total: t.total,
          acertos: t.acertos,
          pct: Math.round((t.acertos / t.total) * 100)
        })).sort((a, b) => b.total - a.total)
      })).sort((a, b) => b.total - a.total);

      const maisAcertou = [...rankingDisciplinas].filter(d => d.total >= 3).sort((a, b) => b.pct - a.pct);

      return { total, acertos, erros, pctGeral, rankingDisciplinas, maisAcertou };
    }
  });

  // Raio-X do Simulado
  const { data: rawRaioXData, isLoading: loadingRaioX } = useQuery({
    queryKey: ['simulado_raiox_hub', selectedSimulado?.id],
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
        })).sort((a, b) => b.count - a.count)
      })).sort((a, b) => b.count - a.count);
    }
  });

  const [expandedRaioX, setExpandedRaioX] = useState<Record<string, boolean>>({});
  const toggleRaioX = (name: string) => {
    try { haptic.selection(); } catch {}
    setExpandedRaioX(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Filtragem dos Simulados da Carreira Ativa (OAB ou Juiz)
  const currentCategorySimulados = useMemo(() => {
    if (!selectedCareer) return [];
    const isJuiz = selectedCareer === 'juiz_direito';
    const list = (simuladosList || []).filter(sim => {
      const examName = (sim.exam?.name || '').toLowerCase();
      if (isJuiz) return examName.includes('juiz') || examName.includes('magistratura');
      return examName.includes('oab') || examName.includes('ordem');
    });

    return list.filter(sim => {
      const matchSearch =
        !searchTerm.trim() ||
        (sim.prova_url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.year || '').toString().includes(searchTerm);

      if (!matchSearch) return false;

      if (yearFilter === 'digitalizadas') {
        return (sim.simulado_questions?.[0]?.count || 0) > 0;
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
  }, [selectedCareer, simuladosList, searchTerm, yearFilter]);

  const paginatedItems = useMemo(() => {
    return currentCategorySimulados.slice(0, visibleCount);
  }, [currentCategorySimulados, visibleCount]);

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

  const totalSimuladosGeral = (simuladosList || []).length || 207;
  const totalQuestoesGeral = 4420; // 3820 OAB + 600 Juiz

  // Header unificado
  const mobileHeader = (
    <div className="flex items-center justify-between w-full pr-1">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            try { haptic.selection(); } catch {}
            if (selectedCareer) {
              setSelectedCareer(null);
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
            {selectedCareer ? (selectedCareer === 'oab' ? 'OAB (EXAME DE ORDEM)' : 'JUIZ DE DIREITO') : 'SIMULADOS & PROVAS'}
          </h1>
          <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {selectedCareer === 'oab' ? '3.820 Questões no App • 47 Exames Unificados' : `${totalSimuladosGeral} Provas • 100% Gabaritos`}
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          try { haptic.selection(); } catch {}
          setShowSobre(true);
        }}
        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
        title="Sobre os Simulados"
      >
        <Info className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title={selectedCareer ? (selectedCareer === 'oab' ? 'OAB (Exame de Ordem)' : 'Juiz de Direito') : 'Central de Simulados & Provas'}
      subtitle="Acervo Oficial de Provas Anteriores, Questões Digitalizadas e Cronômetro Real"
      mobileHeader={mobileHeader}
      wide
    >
      {/* Background ShapeGrid Oficial */}
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

      <div className="relative z-10 px-3.5 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1280px] mx-auto pb-24 lg:pb-12 space-y-6">

        {/* ========================================================================= */}
        {/* TELA 1: HUB PRINCIPAL DE SIMULADOS (ESTILO QUESTÕES E AUDIOBOOKS)          */}
        {/* ========================================================================= */}
        {!selectedCareer && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* ── HERO BANNER PRINCIPAL (ESTILO QUESTÕES HERO) ──────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 p-5 sm:p-7 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Acervo Oficial Consolidado
                </div>
                
                <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                  Simulados Oficiais das Principais Carreiras Jurídicas
                </h2>
                
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                  Pratique no formato real com cadernos digitalizados da OAB e Concursos Públicos, cronômetro de prova idêntico ao oficial e raio-x completo de matérias.
                </p>

                {/* Métricas do Painel Superior */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total de Provas</span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalSimuladosGeral}</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Questões no App</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5">{totalQuestoesGeral}+</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Gabaritos</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">100% PDF</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Cronômetro</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">Oficial</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARROSSEL "EM ALTA" (ESTILO AUDIOBOOKS) ────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-primary" /> Em Alta • Carreiras Principais
                  </h3>
                </div>
                <span className="text-xs text-zinc-500">Deslize para ver</span>
              </div>

              <div className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar py-1">
                {CARREIRAS_CATALOGO.filter(c => c.destaque).map((carreira) => {
                  const isAvailable = carreira.status === 'disponivel';
                  return (
                    <button
                      key={carreira.id}
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        if (isAvailable) {
                          setSelectedCareer(carreira.id);
                          setActiveTab('todos');
                        } else {
                          toast.info(`${carreira.nome} está sendo indexado e estará disponível em breve!`);
                        }
                      }}
                      className={`group relative flex flex-col justify-between w-64 sm:w-72 shrink-0 rounded-2xl bg-gradient-to-br ${carreira.cor} border border-white/10 ${carreira.borda} p-4 sm:p-5 text-left transition-all duration-300 hover:shadow-xl active:scale-[0.98] overflow-hidden`}
                    >
                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${carreira.tagCor}`}>
                            {carreira.badge}
                          </span>
                          {isAvailable ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500">Em Breve</span>
                          )}
                        </div>

                        <h4 className="font-display font-black text-lg text-white leading-tight group-hover:text-rose-200 transition-colors">
                          {carreira.nome}
                        </h4>
                        
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {carreira.descricao}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          {carreira.imagem ? (
                            <img
                              src={carreira.imagem}
                              alt={carreira.nome}
                              className="w-8 h-8 rounded-lg object-contain bg-black/40 p-1"
                            />
                          ) : carreira.icone ? (
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                              <carreira.icone className="w-4 h-4" />
                            </div>
                          ) : null}
                          <span className="text-[11px] font-bold text-zinc-300">
                            {isAvailable ? `${carreira.provasQtd} Provas` : 'Em Breve'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                          <span>{isAvailable ? 'Abrir' : 'Ver'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── GRID COM TODAS AS CARREIRAS E CONCURSOS PÚBLICOS ──────────────── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-primary" /> Todas as Carreiras & Concursos
                  </h3>
                </div>
                <span className="text-xs text-zinc-500">{CARREIRAS_CATALOGO.length} Carreiras Mapeadas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {CARREIRAS_CATALOGO.map((carreira) => {
                  const isAvailable = carreira.status === 'disponivel';
                  return (
                    <button
                      key={carreira.id}
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        if (isAvailable) {
                          setSelectedCareer(carreira.id);
                          setActiveTab('todos');
                        } else {
                          toast.info(`${carreira.nome} está sendo indexado e estará disponível em breve!`);
                        }
                      }}
                      className={`group relative flex items-start justify-between p-4 rounded-2xl bg-zinc-900/80 border border-white/10 ${carreira.borda} hover:bg-zinc-900/95 text-left transition-all duration-200 active:scale-[0.99] gap-3`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Ícone ou Capa */}
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform overflow-hidden">
                          {carreira.imagem ? (
                            <img
                              src={carreira.imagem}
                              alt={carreira.nome}
                              className="w-full h-full object-contain"
                            />
                          ) : carreira.icone ? (
                            <carreira.icone className="w-5 h-5 text-primary" />
                          ) : (
                            <Scale className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
                              {carreira.nome}
                            </h4>
                          </div>

                          <p className="text-[11px] text-zinc-400 line-clamp-1">
                            {carreira.orgao}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isAvailable
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                : 'bg-white/5 text-zinc-400 border border-white/5'
                            }`}>
                              {isAvailable ? `${carreira.provasQtd} Provas • ${carreira.questoesQtd} Qs` : 'Em Breve'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-2">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── ATALHOS RÁPIDOS INFERIORES (HISTÓRICO & ESTATÍSTICA GERAL) ────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedCareer('oab');
                  setActiveTab('recentes');
                }}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-white/20 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Seus Simulados Recentes</h5>
                    <p className="text-xs text-zinc-400">Retome de onde parou ou veja gabaritos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedCareer('oab');
                  setActiveTab('estatisticas');
                }}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-white/20 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Estatísticas & Aproveitamento</h5>
                    <p className="text-xs text-zinc-400">Acompanhe seus acertos por matéria e tema</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TELA 2: VISÃO DEDICADA DA CARREIRA (OAB / JUIZ) COM ABAS & FILTRO RÁPIDO  */}
        {/* ========================================================================= */}
        {selectedCareer && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            
            {/* Header da Carreira */}
            <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setSelectedCareer(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                  aria-label="Voltar para carreiras"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-black text-lg sm:text-xl text-white">
                      {selectedCareer === 'oab' ? 'OAB (Exame de Ordem)' : 'Juiz de Direito'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-black">
                      {currentCategorySimulados.length} Provas
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {selectedCareer === 'oab' ? '47 Edições Unificadas • 3.820 Questões Digitalizadas' : 'Concursos Estaduais • 600 Questões'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setSelectedCareer(null);
                }}
                className="text-xs text-zinc-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-colors hidden sm:block"
              >
                Trocar Carreira
              </button>
            </div>

            {/* Menu de Alternância da Carreira: Todos | Recentes | Estatística */}
            <div className="bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl backdrop-blur-md">
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
                  {currentCategorySimulados.length}
                </span>
              </button>

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
                {(userHistorico || []).length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    activeTab === 'recentes' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {(userHistorico || []).length}
                  </span>
                )}
              </button>

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

            {/* ABA 1: TODOS (COM FILTRO RÁPIDO & ANOS) */}
            {activeTab === 'todos' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* CARD DE FILTRO RÁPIDO POR MATÉRIAS (ESTILO QUESTÕES) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/10 p-5 sm:p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-primary" />
                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                          Praticar por Matérias
                        </h3>
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

                {/* Busca e Chips de Anos */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar por número do exame (ex: 47, 46, 42), ano ou banca..."
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

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
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

                {/* Lista de Cadernos Oficiais */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Cadernos Oficiais ({currentCategorySimulados.length} provas)
                    </span>
                    <span className="text-[11px] text-zinc-500">Ordenado por edição</span>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-44 bg-zinc-900/60 rounded-2xl border border-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : currentCategorySimulados.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-3">
                      <FileSignature className="w-12 h-12 text-zinc-600 mx-auto" />
                      <h3 className="font-display font-bold text-lg text-white">Nenhuma prova encontrada</h3>
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
                          const cleanTitle = (sim.prova_url || '').replace(/^https?:\/\/.*$/, '').trim() || `Exame ${sim.year}`;

                          return (
                            <div
                              key={sim.id}
                              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-primary/50 transition-all duration-300 p-5 hover:bg-zinc-900/95 shadow-md"
                            >
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

                              <div className="space-y-1.5 mb-4">
                                <h4 className="font-display font-bold text-base sm:text-lg text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                  {cleanTitle}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <span>1ª Fase Oficial</span>
                                  <span>•</span>
                                  <span>{sim.year >= 2010 ? 'FGV / CESPE' : 'OAB Estadual'}</span>
                                </div>
                              </div>

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

                      {visibleCount < currentCategorySimulados.length && (
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 24)}
                            className="px-6 py-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-primary/50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                          >
                            <Layers className="w-4 h-4 text-primary" /> Carregar Mais (+24 de {currentCategorySimulados.length - visibleCount} restantes)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: RECENTES */}
            {activeTab === 'recentes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Seus Simulados Recentes ({(userHistorico || []).length})
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
                      <h4 className="font-display font-bold text-lg text-white">Nenhum simulado registrado</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Você ainda não iniciou nenhum simulado oficial. Escolha uma prova na aba <strong>Todos</strong> para praticar.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setActiveTab('todos');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary to-rose-600 rounded-xl text-xs font-black text-white hover:brightness-110 uppercase tracking-wider"
                    >
                      Ver Provas da Carreira
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
                      const aprovado = acertos >= 40;

                      return (
                        <div
                          key={hist.id}
                          className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
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
                            </div>

                            <h4 className="font-display font-bold text-base text-white">
                              {sim?.prova_url || `Simulado ${sim?.year || ''}`}
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

            {/* ABA 3: ESTATÍSTICA */}
            {activeTab === 'estatisticas' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5" /> Raio-X de Desempenho
                      </div>
                      <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                        Seu Rendimento nos Simulados
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md">
                        Acompanhe sua assertividade por matéria e tema cobrados nos exames oficiais.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-lg">
                        40
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">Nota de Corte OAB</p>
                        <p className="text-[11px] text-zinc-400">50% para aprovação</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-3 border-t border-white/5">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Simulados Feitos</span>
                      <span className="text-2xl font-black text-white mt-1">{(userHistorico || []).length}</span>
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
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Questões Feitas</span>
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

                {/* Desempenho por Matéria */}
                {statsData && statsData.rankingDisciplinas.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5 px-1">
                      <Award className="w-4 h-4 text-primary" /> Aproveitamento por Disciplina
                    </h4>

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

                            {isExpanded && disc.temas?.length > 0 && (
                              <div className="px-4 pb-3.5 pt-1 space-y-1.5 border-t border-white/5 bg-black/40">
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
                ) : (
                  <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 text-center space-y-3">
                    <Target className="w-10 h-10 text-primary mx-auto" />
                    <h4 className="font-display font-bold text-base text-white">
                      Inicie seu primeiro simulado para gerar suas métricas
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Assim que você responder as questões de qualquer uma das provas oficiais, seu gráfico de acertos por matéria aparecerá aqui.
                    </p>
                    <button
                      onClick={() => setActiveTab('todos')}
                      className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 uppercase"
                    >
                      Ir para Todos os Simulados
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SHEET MODAL: FILTRO RÁPIDO DE MATÉRIAS                                     */}
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
                Selecione as disciplinas que você quer focar para montar um simulado sob medida.
              </p>
            </SheetHeader>

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
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setSelectedMateriasFilter(prev =>
                          prev.includes(mat.nome) ? prev.filter(m => m !== mat.nome) : [...prev, mat.nome]
                        );
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isChecked
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-primary border-primary text-white' : 'border-white/20 bg-black/40'
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

            <div className="pt-3 border-t border-white/10 shrink-0">
              <button
                onClick={() => {
                  setIsFiltroRapidoOpen(false);
                  try { haptic.selection(); } catch {}
                  toast.success(`Iniciando simulado de ${filtroQtd} questões focado nas matérias!`);
                  navigate(`/questoes/simulado/63fbd266-3c2d-4b91-85b7-25402ff2ac1f`, {
                    state: { disciplinas: selectedMateriasFilter, quantidade: filtroQtd }
                  });
                }}
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
                ) : rawRaioXData && rawRaioXData.length > 0 ? (
                  rawRaioXData.map((item, i) => {
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
      {/* MODAL SOBRE OS SIMULADOS                                                  */}
      {/* ========================================================================= */}
      <Sheet open={showSobre} onOpenChange={setShowSobre}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-[#0D0D0D] border-white/10 p-0 overflow-hidden flex flex-col sm:max-w-lg sm:mx-auto max-h-[85vh] z-50"
        >
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-display font-black text-white">
                Central de Simulados & Provas
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p>
                Nossa central de simulados reúne os cadernos de provas anteriores digitalizados das principais carreiras do Brasil, permitindo resolver questões com contagem regressiva de tempo igual à prova real e raio-x detalhado de assertividade.
              </p>
              <p>
                <strong>OAB (Exame de Ordem):</strong> 47 exames unificados completos com 3.820 questões no app e gabaritos comentados alternativa por alternativa.
              </p>
              <p>
                <strong>Magistratura e Concursos:</strong> Provas da Magistratura Estadual (TJSP, TJGO, etc.) e em breve Juiz do Trabalho, Polícia Federal, PRF, Delegado e Ministério Público.
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
