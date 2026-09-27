import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar, ExternalLink, Newspaper, X, Loader2, ChevronDown, Briefcase, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsDesktop } from '@/hooks/use-desktop';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LoadingState, EmptyState } from '@/components/ui/states';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getConcursoVisual, getBandeiraUrl, extractConcursoUf } from '@/lib/concursosVisuais';
import { getSharedConcursos, setSharedConcursos } from '@/lib/concursosCache';
import { haptic } from '@/lib/nativeHaptics';
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type ConcursoNoticia = {
  id: string;
  data_publicacao: string;
  created_at?: string;
  conteudo_md?: string | null;
  titulo: string;
  imagem_url?: string;
  link: string;
  uf?: string;
  cargos?: string[];
  cargos_resumo?: string;
  vagas_salario?: string;
  formacao?: string;
  resumo?: string;
  dias_restantes?: number;
};

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const CARGOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Cargos' },
  { value: 'delegado_de_policia', label: '👮 Segurança Pública & Policial' },
  { value: 'tribunais_judiciario_analistas', label: '🏛️ Tribunais & Judiciário' },
  { value: 'juiz_magistratura', label: '⚖️ Magistratura' },
  { value: 'advocacia_publica', label: '📜 Advocacia Pública' },
  { value: 'fiscal_controle_auditores', label: '📊 Fiscal & Auditoria' },
  { value: 'enfermagem_saude_geral', label: '🩺 Saúde & Enfermagem' },
  { value: 'educacao_professor', label: '🎓 Educação & Docência' },
  { value: 'administrativo', label: '🏢 Gestão & Administrativo' },
  { value: 'tecnologia_da_informacao', label: '💻 Tecnologia da Informação' },
  { value: 'engenharia_arquitetura', label: '📐 Engenharia & Arquitetura' },
  { value: 'contabilidade_e_financas', label: '💰 Contabilidade & Finanças' },
  { value: 'odontologia', label: '🦷 Odontologia & Saúde Bucal' },
  { value: 'operacional_servicos_gerais', label: '🛠️ Operacional & Serviços Gerais' },
  { value: 'curinga_cargo_generico', label: '📋 Outros / Vários Cargos' },
];

const PRAZOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Prazos' },
  { value: 'urgente_3', label: '🔥 Urgente: Até 3 dias' },
  { value: 'urgente_7', label: '⚡ Esta semana: Até 7 dias' },
  { value: 'mais_7', label: '📅 Mais de 7 dias' },
  { value: 'mais_15', label: '⏳ Mais de 15 dias' },
];

const SALARIOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Salários' },
  { value: '3000', label: '+ R$ 3.000' },
  { value: '5000', label: '+ R$ 5.000' },
  { value: '8000', label: '+ R$ 8.000' },
  { value: '10000', label: '+ R$ 10.000' },
  { value: '15000', label: '+ R$ 15.000' },
];

function extractSalarioNumber(text: string): number | null {
  if (!text) return null;
  const match = text.match(/R\$\s*([\d.]+)(?:,\d{2})?/i);
  if (match && match[1]) {
    const clean = match[1].replace(/\./g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }
  return null;
}

function formatDateParts(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return { day, month, time: `${hours}:${minutes}` };
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} · ${hours}:${minutes}`;
}

function getDayList(centerDate: Date, count = 5): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function dayLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'HOJE';
  return WEEKDAYS[date.getDay()];
}

function formatFullDate(date: Date): string {
  const weekdayFull = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const monthFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${weekdayFull[date.getDay()]}, ${date.getDate()} de ${monthFull[date.getMonth()]} de ${date.getFullYear()}`;
}

function extractCargo(item: ConcursoNoticia): string {
  if (item.cargos_resumo) return item.cargos_resumo;
  if (item.cargos && item.cargos.length > 0) return item.cargos[0];
  const match = item.titulo.match(/(?:para|cargo(?:s)? de|função de)\s+(.+?)(?:\s*-|\s*$)/i);
  if (match && match[1]) {
    return match[1].split(' e ')[0].trim();
  }
  return "Vários Cargos";
}

const Concursos = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();

  // Cache instantâneo de 0ms
  const [concursos, setConcursos] = useState<ConcursoNoticia[]>(() => getSharedConcursos() as ConcursoNoticia[]);
  const [loading, setLoading] = useState<boolean>(() => getSharedConcursos().length === 0);

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayYMD = toYMD(new Date());

  // Data ativa padrão na data vigente de hoje
  const [dataFiltro, setDataFiltro] = useState<string>(() => todayYMD);

  // 3 Filtros em menus de alternância / suspensão
  const [cargoFiltro, setCargoFiltro] = useState<string>('TODOS');
  const [prazoFiltro, setPrazoFiltro] = useState<string>('TODOS');
  const [salarioFiltro, setSalarioFiltro] = useState<string>('TODOS');

  // Modal/Drawer state
  const [selectedItem, setSelectedItem] = useState<ConcursoNoticia | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    if (getSharedConcursos().length === 0) {
      setLoading(true);
    }
    supabase
      .from('concursos_noticias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (!cancel && data) {
          setSharedConcursos(data as any);
          setConcursos(data as any);
          setLoading(false);
        }
      });
    return () => { cancel = true; };
  }, []);

  const openExternalLink = (url: string) => {
    if (Capacitor.isNativePlatform()) {
      void Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenItem = async (item: ConcursoNoticia) => {
    setSelectedItem(item);
    setFullContent(null);
    setLoadingFull(true);
    setIsDrawerOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('pciconcursos-noticia', {
        body: { url: item.link }
      });
      if (error) throw error;
      if (data && data.success) {
        setFullContent(data.html);
      } else {
        setFullContent('<p>Não foi possível carregar o edital completo.</p>');
      }
    } catch (e) {
      console.error(e);
      setFullContent('<p>Falha ao carregar conteúdo do edital.</p>');
    } finally {
      setLoadingFull(false);
    }
  };

  const datasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const n of concursos) set.add(toYMD(new Date(n.created_at || n.data_publicacao)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [concursos]);

  const preFiltroCargo = (location.state as any)?.preFiltroCargo as string | undefined;

  const dateFiltered = useMemo(() => {
    return !dataFiltro
      ? concursos
      : concursos.filter(n => toYMD(new Date(n.created_at || n.data_publicacao)) === dataFiltro);
  }, [concursos, dataFiltro]);

  const finalFiltered = useMemo(() => {
    let filtered = dateFiltered;

    // 1. Filtro de Cargo / Carreira
    if (cargoFiltro !== 'TODOS') {
      filtered = filtered.filter(n => {
        const visual = getConcursoVisual(n.titulo, n.imagem_url, n.cargos_resumo || n.cargos);
        return visual.profissaoKey === cargoFiltro;
      });
    }

    // 2. Filtro de Dias Faltantes para Encerrar
    if (prazoFiltro !== 'TODOS') {
      filtered = filtered.filter(item => {
        if (item.dias_restantes === undefined || item.dias_restantes === null) return true;
        if (prazoFiltro === 'urgente_3') return item.dias_restantes <= 3 && item.dias_restantes >= 0;
        if (prazoFiltro === 'urgente_7') return item.dias_restantes <= 7 && item.dias_restantes >= 0;
        if (prazoFiltro === 'mais_7') return item.dias_restantes > 7;
        if (prazoFiltro === 'mais_15') return item.dias_restantes > 15;
        return true;
      });
    }

    // 3. Filtro de Salário
    if (salarioFiltro !== 'TODOS') {
      const minVal = parseInt(salarioFiltro, 10);
      filtered = filtered.filter(item => {
        const sal = extractSalarioNumber(`${item.vagas_salario || ''} ${item.titulo || ''}`);
        if (!sal) return false;
        return sal >= minVal;
      });
    }

    // 4. Pre-filtro de cargo vindo de tela anterior
    if (preFiltroCargo && cargoFiltro === 'TODOS') {
      const term = preFiltroCargo.toLowerCase();
      filtered = filtered.filter(n => {
        const textToSearch = `${n.titulo} ${n.cargos_resumo || ''} ${(n.cargos || []).join(' ')}`.toLowerCase();
        if (term === 'pf') return textToSearch.includes('polícia federal') || textToSearch.includes('pf ');
        if (term === 'prf') return textToSearch.includes('polícia rodoviária federal') || textToSearch.includes('prf');
        if (term === 'delegado') return textToSearch.includes('delegado');
        if (term === 'juiz') return textToSearch.includes('juiz') || textToSearch.includes('magistratura');
        if (term === 'escrevente') return textToSearch.includes('escrevente') || textToSearch.includes('tribunal') || textToSearch.includes('tj') || textToSearch.includes('trt') || textToSearch.includes('trf');
        if (term === 'fiscal') return textToSearch.includes('auditor') || textToSearch.includes('fiscal') || textToSearch.includes('receita');
        if (term === 'bancaria') return textToSearch.includes('banco') || textToSearch.includes('caixa') || textToSearch.includes('escriturário');
        if (term === 'saude') return textToSearch.includes('médico') || textToSearch.includes('enfermeiro') || textToSearch.includes('saúde') || textToSearch.includes('fisioterapeuta') || textToSearch.includes('psicólogo');
        if (term === 'educacao') return textToSearch.includes('professor') || textToSearch.includes('educação') || textToSearch.includes('pedagogo') || textToSearch.includes('docente');
        return textToSearch.includes(term);
      });
    }

    return [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.created_at || b.data_publicacao).getTime() - new Date(a.created_at || a.data_publicacao).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  }, [dateFiltered, cargoFiltro, prazoFiltro, salarioFiltro, preFiltroCargo]);

  const centerDate = useMemo(() => new Date(), []);
  const dayList = useMemo(() => getDayList(centerDate, 5), [centerDate]);
  const availableDatesSet = useMemo(() => new Set(datasDisponiveis), [datasDisponiveis]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-b from-[#10B981]/30 via-[#10B981]/15 to-background pb-4">
        <PageHeader
          title="Concursos Públicos"
          subtitle="Últimas oportunidades"
          onBack={() => goBack()}
        />

        {/* Barra de 5 Dias */}
        <div className="flex justify-between gap-1.5 px-3 py-3 max-w-3xl mx-auto">
          {dayList.map((day, idx) => {
            const key = toYMD(day);
            const isSelected = dataFiltro === key;
            const hasData = availableDatesSet.has(key);
            const label = dayLabel(day);
            const prev = dayList[idx - 1];
            const monthChanged = !prev || prev.getMonth() !== day.getMonth();
            return (
              <button
                key={key}
                onClick={() => {
                  haptic.selection();
                  setDataFiltro(isSelected ? '' : key);
                }}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] rounded-2xl transition-all shadow-lg shadow-black/20 ${
                  isSelected
                    ? 'bg-[#10B981] shadow-[#10B981]/30'
                    : 'bg-card/40 text-foreground hover:bg-card/60'
                }`}
              >
                {monthChanged && (
                  <span
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[9px] font-body font-semibold uppercase tracking-wider ${
                      isSelected ? 'bg-white text-[#10B981]' : 'bg-[#10B981]/20 text-[#10B981]'
                    }`}
                  >
                    {MONTHS[day.getMonth()]}
                  </span>
                )}
                <span className={`text-xs font-body font-semibold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-foreground/85'}`}>{label}</span>
                <span className={`text-2xl font-display font-bold leading-none ${isSelected ? 'text-white' : 'text-foreground'}`}>{day.getDate()}</span>
                {hasData && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Indicador de Data Ativa com Ação Rápida */}
        <div className="flex items-center justify-between px-5 pb-1 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[11px] font-display text-[#10B981] font-bold tracking-wider uppercase">
              {dataFiltro ? formatFullDate(new Date(dataFiltro + 'T00:00:00')) : 'Exibindo Todos os Editais'}
            </span>
          </div>
          {dataFiltro && (
            <button
              onClick={() => { haptic.selection(); setDataFiltro(''); }}
              className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors underline cursor-pointer"
            >
              Ver todas as datas
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Filtros em Menus de Alternância: Cargos, Dias Faltantes e Salário */}
        <div className="bg-card/60 border border-border/70 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* 1. Menu de Cargos / Carreiras */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-0.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cargo / Carreira</span>
              </label>
              <div className="relative">
                <select
                  value={cargoFiltro}
                  onChange={(e) => {
                    haptic.selection();
                    setCargoFiltro(e.target.value);
                  }}
                  className="w-full appearance-none px-3 py-2 rounded-xl bg-card border border-border/80 text-xs sm:text-sm text-foreground font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-7 cursor-pointer shadow-sm truncate"
                >
                  {CARGOS_FILTRO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Menu de Dias Faltantes para Encerrar */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dias p/ Encerrar</span>
              </label>
              <div className="relative">
                <select
                  value={prazoFiltro}
                  onChange={(e) => {
                    haptic.selection();
                    setPrazoFiltro(e.target.value);
                  }}
                  className="w-full appearance-none px-3 py-2 rounded-xl bg-card border border-border/80 text-xs sm:text-sm text-foreground font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-7 cursor-pointer shadow-sm truncate"
                >
                  {PRAZOS_FILTRO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Menu de Salário */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-0.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Remuneração</span>
              </label>
              <div className="relative">
                <select
                  value={salarioFiltro}
                  onChange={(e) => {
                    haptic.selection();
                    setSalarioFiltro(e.target.value);
                  }}
                  className="w-full appearance-none px-3 py-2 rounded-xl bg-card border border-border/80 text-xs sm:text-sm text-foreground font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-7 cursor-pointer shadow-sm truncate"
                >
                  {SALARIOS_FILTRO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {finalFiltered.length > 0 ? (
          <>
            {/* List cards com Personagem 3D e Bandeira do Estado em Segundo Plano */}
            <div className="space-y-3 -mx-4 md:mx-0">
              {finalFiltered.map((item, i) => {
                const { time } = formatDateParts(item.created_at || item.data_publicacao);
                const visual = getConcursoVisual(item.titulo, item.imagem_url, (item as any).cargos_resumo || (item as any).cargos);
                const itemUf = extractConcursoUf(item);
                const flagUrl = getBandeiraUrl(itemUf);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleOpenItem(item)}
                    className="group flex items-stretch gap-0 bg-card border-y md:border md:rounded-2xl border-border hover:border-[#10B981]/40 active:bg-secondary/30 transition-colors cursor-pointer overflow-hidden relative shadow-sm"
                  >
                    {/* Thumbnail - Ilustração 3D com Bandeira do Estado em Marca d'Água Atrás */}
                    <div className="w-24 sm:w-28 shrink-0 relative flex items-center justify-center p-2 bg-gradient-to-br from-emerald-500/10 via-card to-card/40 overflow-hidden">
                      {/* Bandeira do Estado em marca d'água / contorno transparente */}
                      <img
                        src={flagUrl}
                        alt={`Bandeira ${itemUf}`}
                        className="absolute inset-0 w-full h-full object-cover opacity-20 filter brightness-90 scale-110 pointer-events-none transition-opacity duration-300 group-hover:opacity-30"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/25 to-transparent pointer-events-none" />

                      {/* Personagem 3D em Primeiro Plano */}
                      <img
                        src={visual.imagemUrl}
                        alt={item.titulo}
                        className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300 relative z-10"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Tag do Cargo */}
                      <span className="absolute bottom-1.5 left-1.5 z-20 inline-flex items-center text-[8px] sm:text-[9px] font-bold px-1.5 py-[1px] rounded bg-[#10B981]/90 text-white border border-[#10B981]/60 backdrop-blur-sm uppercase tracking-wide shadow">
                        {visual.tag}
                      </span>

                      {/* Sigla da UF */}
                      {itemUf !== 'BR' && (
                        <span className="absolute top-1.5 right-1.5 z-20 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm shadow-sm">
                          {itemUf}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate">
                          {item.cargos_resumo || (item.cargos && item.cargos.length > 0 ? item.cargos[0] : (item.titulo.match(/(?:para|cargo(?:s)? de|função de)\s+(.+?)(?:\s*-|\s*$)/i)?.[1] || "Vários Cargos"))}
                        </span>
                        {item.dias_restantes !== undefined && item.dias_restantes !== null && (
                          item.dias_restantes <= 5 ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shrink-0">
                              {item.dias_restantes > 0 ? `${item.dias_restantes}d p/ fechar` : 'Hoje!'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/80 shrink-0 font-medium">
                              {`${item.dias_restantes} dias`}
                            </span>
                          )
                        )}
                      </div>
                      <h3 className="font-display text-[13px] sm:text-[14px] text-foreground font-semibold leading-snug line-clamp-2 group-hover:text-[#10B981] transition-colors mt-0.5">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-[12px] font-body text-muted-foreground mt-auto pt-1">
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-semibold">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="inline-flex items-center text-muted-foreground font-medium truncate">
                          {(item.vagas_salario || visual.subtitulo).replace(/.*?até\s+R\$/i, 'Salários até R$')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          loading ? (
            <LoadingState variant="list" rows={4} label="Carregando concursos" />
          ) : (
            <EmptyState
              icon={Newspaper}
              title={concursos.length === 0 ? 'Nenhum concurso disponível' : 'Sem resultados'}
              description={
                concursos.length === 0
                  ? 'Ainda não há concursos carregados. Tente novamente em instantes.'
                  : 'Não encontramos editais para esta busca ou data. Tente outro filtro.'
              }
            />
          )
        )}
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[92vh] max-h-[92vh] flex flex-col p-0 bg-background overflow-hidden">
          <div className="absolute right-4 top-4 z-[60]">
            <DrawerClose asChild>
              <button className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>

          {selectedItem && (
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe relative">
              {/* Header Image com Personagem 3D e Bandeira do Estado em Segundo Plano */}
              {(() => {
                const modalUf = extractConcursoUf(selectedItem);
                const modalFlagUrl = getBandeiraUrl(modalUf);
                const modalVisual = getConcursoVisual(selectedItem.titulo, selectedItem.imagem_url, (selectedItem as any).cargos_resumo || (selectedItem as any).cargos);

                return (
                  <div className="relative h-60 w-full shrink-0 flex items-center justify-center bg-gradient-to-b from-emerald-950/40 via-card to-background p-6 overflow-hidden">
                    <img
                      src={modalFlagUrl}
                      alt={`Bandeira ${modalUf}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-15 filter brightness-75 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

                    <img
                      src={modalVisual.imagemUrl}
                      alt={selectedItem.titulo}
                      className="h-44 max-w-[200px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] relative z-10"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2 z-20">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981] text-white uppercase tracking-wide">
                          {extractCargo(selectedItem)}
                        </span>
                        {modalUf !== 'BR' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black/70 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                            {modalUf}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-tight line-clamp-2">
                        {selectedItem.titulo}
                      </h2>
                    </div>
                  </div>
                );
              })()}

              {/* Content Body */}
              <div className="px-6 py-6 space-y-6">
                <div className="flex flex-col gap-3 text-sm font-body text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Salário / Vagas</span>
                    <p className="text-foreground font-medium text-right text-xs">{selectedItem.vagas_salario || "Não informado"}</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Formação</span>
                    <p className="text-foreground font-medium text-right text-xs">{selectedItem.formacao || "Não informado"}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Disponibilizado</span>
                    <p className="text-foreground font-medium text-right text-xs">{formatDateFull(selectedItem.created_at || selectedItem.data_publicacao)}</p>
                  </div>
                </div>

                <div className="prose prose-invert prose-emerald max-w-none prose-sm sm:prose-base font-body text-foreground/90 space-y-4">
                  {loadingFull ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
                      <p className="text-sm font-medium animate-pulse">Extraindo edital completo...</p>
                    </div>
                  ) : fullContent ? (
                    <div dangerouslySetInnerHTML={{ __html: fullContent }} />
                  ) : (
                    <p>{selectedItem.resumo}</p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-6 pb-8 flex flex-col gap-3">
                  <Button 
                    onClick={() => openExternalLink(selectedItem.link)}
                    className="w-full h-14 rounded-2xl bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold text-base shadow-lg shadow-[#10B981]/25"
                  >
                    Acessar Edital Oficial <ExternalLink className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Concursos;
