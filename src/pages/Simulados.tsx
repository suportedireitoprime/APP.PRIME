// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import {
  PlayCircle, Search, FileText, Scale, ChevronRight, ArrowLeft, History,
  BarChart3, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Sparkles,
  Filter, BookOpen, Layers, Award, X, Trophy, Target, TrendingUp,
  RotateCcw, Check, Flame, Bookmark, Clock, Gavel, Heart, BellRing, ArrowRight,
  Shield, Compass, Briefcase, GraduationCap
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
  },
  {
    id: 'delegado',
    nome: 'Delegado de Polícia',
    badge: 'Em Breve',
    questoes: 'Civil e Federal',
    status: 'em_breve',
    imagem: pcDfLogo,
    subtitulo: 'Polícia Civil e Federal',
  },
  {
    id: 'juiz',
    nome: 'Juiz de Direito',
    badge: '6 Concursos',
    questoes: '600 Questões no App',
    status: 'disponivel',
    imagem: '/assets/praticar-juiz.webp',
    subtitulo: 'Magistratura Estadual',
  },
  {
    id: 'pf',
    nome: 'Polícia Federal (PF)',
    badge: 'Em Breve',
    questoes: 'Agente e Escrivão',
    status: 'em_breve',
    imagem: pfLogo,
    subtitulo: 'Cebraspe / Concurso PF',
  },
  {
    id: 'prf',
    nome: 'Polícia Rodoviária (PRF)',
    badge: 'Em Breve',
    questoes: 'Policial Rodoviário',
    status: 'em_breve',
    imagem: prfLogo,
    subtitulo: 'Carreira Policial Rodoviária',
  },
];

// Catálogo Completo de Cargos
const CARGOS_CATALOGO = [
  {
    id: 'oab',
    nome: 'OAB (Exame de Ordem)',
    orgao: 'Conselho Federal da OAB • FGV',
    descricao: '47 Provas Oficiais • 3.820 Questões no App • 1ª Fase Unificada',
    status: 'disponivel',
    provasQtd: 47,
    questoesQtd: 3820,
    imagem: '/assets/eoab-woman-fixed.webp',
    categoria: 'juridica',
  },
  {
    id: 'juiz',
    nome: 'Juiz de Direito (Magistratura Estadual)',
    orgao: 'Tribunais de Justiça (TJSP, TJGO, TJPA, TJCE, TJTO)',
    descricao: '6 Concursos Oficiais • 600 Questões no App • Vunesp / FGV',
    status: 'disponivel',
    provasQtd: 6,
    questoesQtd: 600,
    imagem: '/assets/praticar-juiz.webp',
    categoria: 'magistratura',
  },
  {
    id: 'delegado',
    nome: 'Delegado de Polícia (Civil e Federal)',
    orgao: 'Polícia Civil e Departamento de Polícia Federal',
    descricao: 'Concursos para Delegado de Polícia Civil e Federal',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    imagem: pcDfLogo,
    categoria: 'policial',
  },
  {
    id: 'pf',
    nome: 'Polícia Federal (PF)',
    orgao: 'Departamento de Polícia Federal (Cebraspe)',
    descricao: 'Agente, Escrivão, Papiloscopista e Perito Criminal Federal',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    imagem: pfLogo,
    categoria: 'policial',
  },
  {
    id: 'prf',
    nome: 'Polícia Rodoviária Federal (PRF)',
    orgao: 'Ministério da Justiça e Segurança Pública',
    descricao: 'Concurso Nacional para Policial Rodoviário Federal',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    imagem: prfLogo,
    categoria: 'policial',
  },
  {
    id: 'juiz_trabalho',
    nome: 'Juiz do Trabalho (TRT / CSJT)',
    orgao: 'Tribunal Superior do Trabalho & Enamat',
    descricao: 'Concurso Nacional Unificado da Magistratura do Trabalho',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    imagem: '/assets/praticar-juiz.webp',
    categoria: 'magistratura',
  },
  {
    id: 'promotor',
    nome: 'Promotor de Justiça (Ministério Público)',
    orgao: 'Ministérios Públicos Estaduais e MPDFT',
    descricao: 'Provas anteriores para Promotor de Justiça Substituto',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    icone: Scale,
    categoria: 'juridica',
  },
  {
    id: 'defensoria',
    nome: 'Defensor Público (DPE / DPU)',
    orgao: 'Defensorias Públicas Estaduais e União',
    descricao: 'Provas para Defensor Público Estadual e Federal',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    icone: Shield,
    categoria: 'juridica',
  },
  {
    id: 'procuradorias',
    nome: 'Procuradorias (AGU, PGE, PGM)',
    orgao: 'Advocacia-Geral da União e Procuradorias',
    descricao: 'Carreiras da Advocacia Pública Federal, Estadual e Municipal',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    icone: Briefcase,
    categoria: 'juridica',
  },
  {
    id: 'analista_tribunais',
    nome: 'Analista Judiciário (Tribunais)',
    orgao: 'STF, STJ, TST, TSE, TRFs, TJs e TRTs',
    descricao: 'Concursos oficiais para Analista Judiciário e Oficial de Justiça',
    status: 'em_breve',
    provasQtd: 0,
    questoesQtd: 0,
    icone: GraduationCap,
    categoria: 'tribunais',
  },
];

// Disciplinas Oficiais para o Filtro Rápido
const MATERIAS_FILTRO = [
  { id: 'todas', nome: 'Todas as Matérias' },
  { id: 'etica', nome: 'Ética Profissional' },
  { id: 'constitucional', nome: 'Direito Constitucional' },
  { id: 'civil', nome: 'Direito Civil' },
  { id: 'proc_civil', nome: 'Direito Processual Civil' },
  { id: 'penal', nome: 'Direito Penal' },
  { id: 'proc_penal', nome: 'Direito Processual Penal' },
  { id: 'trabalho', nome: 'Direito do Trabalho' },
  { id: 'proc_trabalho', nome: 'Direito Processual do Trabalho' },
  { id: 'administrativo', nome: 'Direito Administrativo' },
  { id: 'tributario', nome: 'Direito Tributário' },
  { id: 'empresarial', nome: 'Direito Empresarial' },
  { id: 'direitos_humanos', nome: 'Direitos Humanos' },
  { id: 'consumidor', nome: 'Direito do Consumidor' },
  { id: 'ambiental', nome: 'Direito Ambiental' },
  { id: 'eca', nome: 'ECA' },
];

const ANOS_FILTRO = [
  { id: 'todas', label: 'Todas as Edições' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
  { id: '2020', label: '2020' },
];

// Formata o título oficial legível do exame
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

export default function Simulados() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const gateSimulado = useGatedFeature('simulado', 'simulados');
  const unreadNotifs = useUnreadNotifCount();

  // Modais de Header
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentesOpen, setRecentesOpen] = useState(false);

  // Estados do Filtro Rápido (Estilo Questões)
  const [filtroCargo, setFiltroCargo] = useState('oab');
  const [filtroDisciplina, setFiltroDisciplina] = useState('todas');
  const [filtroAno, setFiltroAno] = useState('todas');

  // Busca do Catálogo
  const [cargoSearchTerm, setCargoSearchTerm] = useState('');

  // 1. Carregar lista completa de simulados
  const { data: simuladosList } = useQuery({
    queryKey: ['simulados_list_full'],
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
      return data as SimuladoItem[];
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

  // Iniciar Simulado
  const handleStartSimulado = (sim: SimuladoItem, materias?: string[]) => {
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
        filtroMaterias: materias && materias.length > 0 ? materias : undefined,
      },
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

  // Navegar para a tela individual do cargo com controle total
  const handleAbrirCargo = (cargoId: string) => {
    try { haptic.selection(); } catch {}
    const c = CARGOS_CATALOGO.find((item) => item.id === cargoId);
    if (c && c.status === 'em_breve') {
      toast.info(`Simulados de ${c.nome} estão sendo indexados com questões oficiais e estarão disponíveis em breve!`);
      return;
    }
    navigate(`/simulados/cargo/${cargoId}`);
  };

  // Disparar início do Simulado pelo Filtro Rápido
  const handleExecutarFiltroRapido = () => {
    try { haptic.selection(); } catch {}
    if (!simuladosList || simuladosList.length === 0) return;

    const isJuiz = filtroCargo === 'juiz';
    const provasDoCargo = simuladosList.filter((s) => {
      const name = (s.exam?.name || '').toLowerCase();
      if (isJuiz) return name.includes('juiz');
      return name.includes('oab');
    });

    if (provasDoCargo.length === 0) {
      toast.info('Nenhuma prova encontrada para este cargo.');
      return;
    }

    // Filtra por ano se selecionado
    let provaAlvo = provasDoCargo[0];
    if (filtroAno !== 'todas') {
      const anoNum = parseInt(filtroAno, 10);
      const achou = provasDoCargo.find((p) => p.year === anoNum);
      if (achou) provaAlvo = achou;
    }

    const materiasLista = filtroDisciplina !== 'todas'
      ? [MATERIAS_FILTRO.find((m) => m.id === filtroDisciplina)?.nome || filtroDisciplina]
      : undefined;

    handleStartSimulado(provaAlvo, materiasLista);
  };

  // Lista Filtrada de Cargos para a busca
  const filteredCargos = useMemo(() => {
    if (!cargoSearchTerm.trim()) return CARGOS_CATALOGO;
    const term = cargoSearchTerm.toLowerCase();
    return CARGOS_CATALOGO.filter(
      (c) => c.nome.toLowerCase().includes(term) || c.orgao.toLowerCase().includes(term)
    );
  }, [cargoSearchTerm]);

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
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#050505' }}
          aria-hidden="true"
        />

        <img
          src={resumosHeroImg}
          alt="Simulados Jurídicos Oficiais"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[62%_center] md:object-center z-0 pointer-events-none translate-x-[4%] md:translate-x-0"
        />

        {/* Overlay vermelho com corte poligonal estilizado */}
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

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
                maskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
              }}
            >
              <HeroMotifs />
            </div>

            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        </div>

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

        {/* ── 4 BOTÕES DE VIDRO NO PADRÃO RESUMOS ────────────────────────────── */}
        <div className="relative z-10 px-3 sm:px-6 md:px-8 pb-3.5 pt-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
            {/* OAB Rápida */}
            <button
              type="button"
              onClick={() => handleAbrirCargo('oab')}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20 group-hover:scale-110 drop-shadow-md" strokeWidth={2} />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                OAB
              </span>
            </button>

            {/* Recentes */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setRecentesOpen(true);
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            >
              <History className="w-5 h-5 text-blue-400 group-hover:scale-110 drop-shadow-md" strokeWidth={2} />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Recentes
              </span>
            </button>

            {/* Estatísticas */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                navigate('/simulados/estatisticas');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            >
              <BarChart3 className="w-5 h-5 text-amber-400 group-hover:scale-110 drop-shadow-md" strokeWidth={2} />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Estatísticas
              </span>
            </button>

            {/* Juiz Rápido */}
            <button
              type="button"
              onClick={() => handleAbrirCargo('juiz')}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            >
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 drop-shadow-md" strokeWidth={2} />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Juiz
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">

        {/* ── BANNER CONTINUAR SIMULADO ───────────────────────────────────────── */}
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

            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-rose-400 group-hover:translate-x-1 transition-transform" strokeWidth={2.4} />
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
                Toque no cargo desejado para abrir o painel de controle e provas
              </p>
            </div>
          </div>

          {/* Carrossel Horizontal com as 5 Carreiras (Abre nova tela ao tocar) */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {CARREIRAS_EM_ALTA.map((carreira, idx) => {
              const isAvailable = carreira.status === 'disponivel';
              return (
                <div
                  key={`em-alta-${carreira.id}`}
                  onClick={() => handleAbrirCargo(carreira.id)}
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

                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${
                        isAvailable
                          ? 'bg-rose-600/95 text-white'
                          : 'bg-zinc-800/90 text-zinc-300 border border-white/10'
                      }`}>
                        {carreira.badge}
                      </span>
                    </div>

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

        {/* ── CARD: FILTRO RÁPIDO DE SIMULADOS (ESTILO QUESTÕES) ─────────────── */}
        <section className="rounded-3xl bg-[#141416] border border-white/10 p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-rose-500" />
              <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                Filtro Rápido de Simulados
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1 ml-3">
              Configure seu simulado escolhendo o cargo, as disciplinas desejadas e o ano da prova.
            </p>
          </div>

          {/* 1. SELETOR DE CARGO */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              1. Selecione a Carreira / Cargo
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'oab', nome: 'OAB (Exame de Ordem)', ativo: true },
                { id: 'juiz', nome: 'Juiz de Direito', ativo: true },
                { id: 'delegado', nome: 'Delegado de Polícia', ativo: false },
                { id: 'pf', nome: 'Polícia Federal (PF)', ativo: false },
                { id: 'prf', nome: 'Polícia Rodoviária (PRF)', ativo: false },
              ].map((c) => {
                const isSelected = filtroCargo === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      if (!c.ativo) {
                        toast.info(`Simulados de ${c.nome} estarão disponíveis em breve!`);
                        return;
                      }
                      setFiltroCargo(c.id);
                    }}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {c.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELETOR DE DISCIPLINAS */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              2. Selecione as Disciplinas
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {MATERIAS_FILTRO.map((mat) => {
                const isSelected = filtroDisciplina === mat.id;
                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroDisciplina(mat.id);
                    }}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {mat.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SELETOR DE ANO */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              3. Selecione o Ano da Prova
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {ANOS_FILTRO.map((ano) => {
                const isSelected = filtroAno === ano.id;
                return (
                  <button
                    key={ano.id}
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroAno(ano.id);
                    }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {ano.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTÕES DE AÇÃO: INICIAR OU ABRIR TELA DO CARGO */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleExecutarFiltroRapido}
              className="flex-1 h-13 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-rose-950/60 active:scale-[0.98] transition cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 fill-white/20" /> Iniciar Simulado com Filtros
            </button>

            <button
              onClick={() => handleAbrirCargo(filtroCargo)}
              className="sm:w-auto px-5 h-13 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-rose-400" /> Abrir Painel Completo do Cargo
            </button>
          </div>
        </section>

        {/* ── SEÇÃO: TODAS AS CARREIRAS (CATÁLOGO COMPLETO) ──────────────────── */}
        <section className="pt-2 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-bold">
              CATÁLOGO OFICIAL DE CARREIRAS
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-6 rounded-full bg-rose-500" />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                Todas as Carreiras & Cargos
              </h2>
            </div>
            <p className="text-sm text-white/60 mt-1 ml-3 truncate">
              Toque em qualquer carreira para abrir a tela dedicada com todas as provas e controle total.
            </p>
          </div>

          {/* Campo de Busca de Cargos */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={cargoSearchTerm}
              onChange={(e) => setCargoSearchTerm(e.target.value)}
              placeholder="Buscar carreira ou concurso (ex: OAB, Juiz, PF, Delegado)…"
              className="w-full pl-11 pr-10 h-13 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/60 transition-colors shadow-sm"
            />
            {cargoSearchTerm && (
              <button
                type="button"
                onClick={() => setCargoSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lista Compacta de Todas as Carreiras (Ao tocar, abre nova tela daquele cargo) */}
          <div className="space-y-2.5 pt-1">
            {filteredCargos.map((cargo) => {
              const isAvailable = cargo.status === 'disponivel';
              return (
                <div
                  key={cargo.id}
                  onClick={() => handleAbrirCargo(cargo.id)}
                  className="group relative rounded-2xl bg-[#141416] border border-white/10 hover:border-rose-500/40 p-3 sm:p-3.5 transition-all duration-150 shadow-sm flex items-center justify-between gap-3 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors overflow-hidden p-1">
                      {cargo.imagem ? (
                        <img
                          src={cargo.imagem}
                          alt={cargo.nome}
                          className="w-full h-full object-contain"
                        />
                      ) : cargo.icone ? (
                        <cargo.icone className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Scale className="w-5 h-5 text-rose-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm sm:text-[15px] text-white truncate group-hover:text-rose-200 transition-colors">
                          {cargo.nome}
                        </h4>
                        {isAvailable && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {cargo.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isAvailable
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-white/5 text-zinc-400 border border-white/5'
                    }`}>
                      {isAvailable ? `${cargo.provasQtd} Provas` : 'Em Breve'}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── MODAL DE NOTIFICAÇÕES ─────────────────────────────────────────────── */}
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />

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
                      {h.simulado ? getExamDisplayName(h.simulado) : 'Simulado'}
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
    </div>
  );
}
