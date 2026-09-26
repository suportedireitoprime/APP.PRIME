import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Sparkles,
  Check,
  Search,
  Clock,
  ExternalLink,
  MapPin,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2,
  X,
  Share2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import horusAsset from '@/assets/horus/horus-owl.webp';
import { getConcursoVisual } from '@/lib/concursosVisuais';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface ConcursoItem {
  id: string;
  pci_id?: number;
  titulo: string;
  link: string;
  resumo?: string;
  imagem_url?: string;
  uf?: string;
  regiao?: string;
  cargos?: string[];
  cargos_resumo?: string;
  vagas_salario?: string;
  formacao?: string;
  dias_restantes?: number;
  data_publicacao?: string;
}

const UFS_LIST = [
  { value: 'TODOS', label: 'Todos os Estados (Brasil)' },
  { value: 'NACIONAL', label: '🇧🇷 Âmbito Nacional' },
  { value: 'SP', label: 'São Paulo (SP)' },
  { value: 'RJ', label: 'Rio de Janeiro (RJ)' },
  { value: 'MG', label: 'Minas Gerais (MG)' },
  { value: 'RS', label: 'Rio Grande do Sul (RS)' },
  { value: 'PR', label: 'Paraná (PR)' },
  { value: 'SC', label: 'Santa Catarina (SC)' },
  { value: 'BA', label: 'Bahia (BA)' },
  { value: 'PE', label: 'Pernambuco (PE)' },
  { value: 'CE', label: 'Ceará (CE)' },
  { value: 'GO', label: 'Goiás (GO)' },
  { value: 'DF', label: 'Distrito Federal (DF)' },
  { value: 'ES', label: 'Espírito Santo (ES)' },
  { value: 'MT', label: 'Mato Grosso (MT)' },
  { value: 'MS', label: 'Mato Grosso do Sul (MS)' },
  { value: 'MA', label: 'Maranhão (MA)' },
  { value: 'PA', label: 'Pará (PA)' },
  { value: 'PB', label: 'Paraíba (PB)' },
  { value: 'RN', label: 'Rio Grande do Norte (RN)' },
  { value: 'PI', label: 'Piauí (PI)' },
  { value: 'AL', label: 'Alagoas (AL)' },
  { value: 'SE', label: 'Sergipe (SE)' },
  { value: 'RO', label: 'Rondônia (RO)' },
  { value: 'TO', label: 'Tocantins (TO)' },
  { value: 'AC', label: 'Acre (AC)' },
  { value: 'AP', label: 'Amapá (AP)' },
  { value: 'AM', label: 'Amazonas (AM)' },
  { value: 'RR', label: 'Roraima (RR)' },
];

const CARREIRAS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Cargos & Carreiras', termos: [] },
  { value: 'juridico', label: '⚖️ Carreiras Jurídicas (Advogado, Juiz, Promotor...)', termos: ['ADVOGADO', 'PROCURADOR', 'DEFENSOR', 'JUIZ', 'PROMOTOR', 'MAGISTRATURA'] },
  { value: 'tribunais', label: '🏛️ Tribunais & Judiciário (Analista, Técnico...)', termos: ['ANALISTA JUDICIÁRIO', 'TÉCNICO JUDICIÁRIO', 'OFICIAL DE JUSTIÇA', 'ESCREVENTE'] },
  { value: 'seguranca', label: '👮 Segurança Pública (Delegado, Policial, Perito...)', termos: ['DELEGADO', 'AGENTE', 'ESCRIVÃO', 'POLÍCIA', 'PERITO', 'GUARDA CIVIL', 'OFICIAL'] },
  { value: 'fiscal', label: '📊 Fiscal & Controle (Auditor, TCE, TCU...)', termos: ['AUDITOR FISCAL', 'ANALISTA TRIBUTÁRIO', 'TCE', 'TCU', 'CONTADOR', 'CONTROLADOR'] },
  { value: 'administrativo', label: '🏢 Administrativo & Gestão', termos: ['ADMINISTRATIVO', 'AUXILIAR', 'ASSISTENTE', 'ANALISTA', 'GESTÃO'] },
  { value: 'professores', label: '🎓 Educação & Professores', termos: ['PROFESSOR', 'PEDAGOGO', 'DOCENTE', 'EDUCADOR'] },
  { value: 'saude', label: '🩺 Saúde & Medicina', termos: ['MÉDICO', 'ENFERMEIRO', 'PSICÓLOGO', 'FARMACÊUTICO'] },
];

export default function RadarConcursos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [, startTransition] = useTransition();

  // Filtros em menu de suspensão
  const [selectedUf, setSelectedUf] = useState<string>('TODOS');
  const [selectedCarreira, setSelectedCarreira] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Notificações
  const [notifPush, setNotifPush] = useState(true);
  const [notifHorus, setNotifHorus] = useState(true);

  // Dados
  const [concursos, setConcursos] = useState<ConcursoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal de Conteúdo Completo do Edital
  const [selectedEdital, setSelectedEdital] = useState<ConcursoItem | null>(null);

  // Modal de Simulação do Hórus
  const [simulacaoOpen, setSimulacaoOpen] = useState(false);
  const [simulacaoItem, setSimulacaoItem] = useState<ConcursoItem | null>(null);

  useEffect(() => {
    let cancel = false;

    async function loadData() {
      setLoading(true);
      try {
        // Carregar preferências
        if (user?.id) {
          const { data: alertaData } = await supabase
            .from('usuario_alertas_concursos')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (alertaData && !cancel) {
            if (alertaData.ufs && alertaData.ufs.length === 1) {
              setSelectedUf(alertaData.ufs[0]);
            }
            if (alertaData.cargos && alertaData.cargos.length === 1) {
              setSelectedCarreira(alertaData.cargos[0]);
            }
            if (alertaData.notificar_push !== undefined) setNotifPush(alertaData.notificar_push);
            if (alertaData.notificar_horus !== undefined) setNotifHorus(alertaData.notificar_horus);
          }
        }

        // Carregar editais do Supabase
        const { data: concursosData } = await supabase
          .from('concursos_noticias')
          .select('*')
          .order('data_publicacao', { ascending: false })
          .limit(300);

        if (!cancel && concursosData) {
          setConcursos(concursosData as ConcursoItem[]);
        }
      } catch (err) {
        console.error('Erro ao carregar concursos:', err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    loadData();
    return () => { cancel = true; };
  }, [user]);

  // Salvar configurações
  const salvarConfiguracoes = async () => {
    haptic.success();
    setSaving(true);

    try {
      if (user?.id) {
        await supabase
          .from('usuario_alertas_concursos')
          .upsert({
            user_id: user.id,
            ufs: [selectedUf],
            cargos: [selectedCarreira],
            notificar_push: notifPush,
            notificar_horus: notifHorus,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }

      toast.success('Alertas atualizados!', {
        description: `Estado: ${selectedUf} · Filtro: ${selectedCarreira === 'TODOS' ? 'Todos os cargos' : selectedCarreira}`
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  };

  // Filtragem dos concursos pelos dropdowns
  const concursosFiltrados = useMemo(() => {
    if (!concursos.length) return [];

    const carreiraConfig = CARREIRAS_OPTIONS.find(c => c.value === selectedCarreira);
    const termosCarreira = carreiraConfig ? carreiraConfig.termos : [];

    return concursos.filter(item => {
      // 1. Filtro de Estado (UF)
      if (selectedUf !== 'TODOS') {
        const ufConcurso = (item.uf || '').toUpperCase();
        if (selectedUf === 'NACIONAL') {
          if (item.uf && item.regiao !== 'NACIONAL') return false;
        } else if (ufConcurso !== selectedUf) {
          return false;
        }
      }

      // 2. Filtro de Cargo / Carreira
      if (selectedCarreira !== 'TODOS' && termosCarreira.length > 0) {
        const cargosTexto = (item.cargos || []).join(' ').toUpperCase();
        const tituloTexto = (item.titulo || '').toUpperCase();
        const resumoTexto = (item.resumo || '').toUpperCase();
        const textoCompleto = `${tituloTexto} ${resumoTexto} ${cargosTexto}`;

        const bateCargo = termosCarreira.some(termo => textoCompleto.includes(termo));
        if (!bateCargo) return false;
      }

      // 3. Busca por texto livre
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (item.titulo || '').toLowerCase().includes(q) ||
          (item.resumo || '').toLowerCase().includes(q) ||
          (item.uf || '').toLowerCase().includes(q) ||
          (item.vagas_salario || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [concursos, selectedUf, selectedCarreira, searchTerm]);

  // Abertura de link externo segura
  const openExternalLink = async (url: string) => {
    haptic.selection();
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, presentationStyle: 'popover' });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Simular alerta do Hórus IA
  const testarAlertaHorus = () => {
    haptic.impact();
    const itemDestaque = concursosFiltrados[0] || concursos[0];
    if (!itemDestaque) {
      toast.info('Nenhum edital disponível no momento.');
      return;
    }
    setSimulacaoItem(itemDestaque);
    setSimulacaoOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background ShapeGrid oficial */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShapeGrid speed={0.5} squareSize={38} direction="diagonal" borderColor="rgba(255,255,255,0.06)" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 pt-[var(--sai-top,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between px-4 h-16 sm:h-20 max-w-4xl mx-auto w-full">
          <button
            type="button"
            onClick={() => { haptic.light(); navigate(-1); }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md hover:bg-black/70 active:scale-95 shadow-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-[16px] sm:text-[18px] font-display font-bold uppercase tracking-widest text-foreground">
                RADAR DE CONCURSOS
              </h1>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              PCI Concursos Oficial · 470+ Editais
            </span>
          </div>

          <button
            type="button"
            onClick={() => { haptic.selection(); startTransition(() => navigate('/concursos')); }}
            className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 space-y-6 relative z-10 pb-36">

        {/* 1. CARROSSEL DE ÚLTIMAS NOTÍCIAS / CONCURSOS ABERTOS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <h2 className="font-display text-foreground text-[15px] sm:text-[17px] font-bold uppercase tracking-widest">
                Últimos Editais Abertos ({concursosFiltrados.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => { haptic.selection(); startTransition(() => navigate('/concursos')); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 hide-scrollbar px-1 -mr-4 pr-4">
            {concursosFiltrados.length > 0 ? concursosFiltrados.slice(0, 15).map((conc) => {
              const visual = getConcursoVisual(conc.titulo, conc.imagem_url);
              const dias = conc.dias_restantes ?? null;

              return (
                <div
                  key={conc.id}
                  onClick={() => {
                    haptic.selection();
                    setSelectedEdital(conc);
                  }}
                  className="w-[240px] h-[210px] sm:w-[270px] sm:h-[220px] shrink-0 snap-start relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform flex flex-col bg-card/60 hover:bg-card border border-white/10 group shadow-lg p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between w-full mb-auto z-20">
                     <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center p-1.5 shrink-0 shadow-md border border-border/50">
                        <img
                          src={visual.imagemUrl}
                          alt={conc.titulo}
                          className="w-full h-full object-contain rounded-full group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                     </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide text-emerald-950 bg-emerald-400 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse shrink-0" />
                        <span>{conc.uf || visual.tag}</span>
                      </span>

                      {dias !== null && dias <= 7 && dias >= 0 && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/90 text-black shadow-md">
                          {dias === 0 ? 'ÚLTIMO DIA' : `${dias}d restantes`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo inferior */}
                  <div className="flex flex-col z-10 mt-3">
                    <div className="flex items-center gap-2 mb-1.5 text-[11px] text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{conc.vagas_salario || visual.subtitulo}</span>
                    </div>
                    <p className="font-display text-foreground text-[14px] sm:text-[15px] font-semibold leading-snug line-clamp-3 group-hover:text-emerald-400 transition-colors">
                      {conc.titulo}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 px-4 text-center w-full text-muted-foreground text-xs">
                Nenhum edital encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </section>

        {/* 2. FILTROS VIA MENU DE SUSPENSÃO (DROPDOWNS) */}
        <section className="bg-card/60 border border-border/60 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/30">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                Filtrar Oportunidades
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {concursosFiltrados.length} encontrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dropdown de Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estado de Interesse</span>
              </label>
              <div className="relative">
                <select
                  value={selectedUf}
                  onChange={e => { haptic.selection(); setSelectedUf(e.target.value); }}
                  className="w-full appearance-none px-4 py-3 rounded-2xl bg-card border border-border/80 text-sm text-foreground font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-10 cursor-pointer shadow-sm"
                >
                  {UFS_LIST.map(uf => (
                    <option key={uf.value} value={uf.value} className="bg-zinc-900 text-white">
                      {uf.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown de Cargos / Carreiras */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cargo ou Carreira</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCarreira}
                  onChange={e => { haptic.selection(); setSelectedCarreira(e.target.value); }}
                  className="w-full appearance-none px-4 py-3 rounded-2xl bg-card border border-border/80 text-sm text-foreground font-medium focus:outline-none focus:border-emerald-500 transition-colors pr-10 cursor-pointer shadow-sm"
                >
                  {CARREIRAS_OPTIONS.map(carreira => (
                    <option key={carreira.value} value={carreira.value} className="bg-zinc-900 text-white">
                      {carreira.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Busca livre opcional */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ou busque por órgão, cidade ou termo livre..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card/40 border border-border/60 text-xs sm:text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </section>

        {/* 3. CARD DE CHAMADA PARA A LISTA COMPLETA */}
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-card to-card border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <span>{concursosFiltrados.length} Editais Disponíveis</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedUf === 'TODOS' ? 'Brasil' : selectedUf}
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Abra a lista completa com salários detalhados, prazos de encerramento e todos os cargos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              startTransition(() => navigate('/concursos'));
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>Ver todos em lista ({concursosFiltrados.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* 4. CONFIGURAÇÃO DE NOTIFICAÇÕES COMPACTA NO RODAPÉ */}
        <section className="bg-card/70 border border-emerald-500/25 rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-sm text-foreground">
                Alertas & Notificações Automáticas
              </h3>
            </div>
            <button
              type="button"
              onClick={testarAlertaHorus}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Testar Alerta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Toggle Push */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-card/40 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-semibold text-foreground">Push no Celular</p>
                <p className="text-[11px] text-muted-foreground">Notifica assim que o edital sair</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.selection(); setNotifPush(!notifPush); }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  notifPush ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  notifPush ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Toggle Hórus IA */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="space-y-0.5 pr-2">
                <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Radar Hórus IA</span>
                  {isPremium && <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">VIP</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">Análise e resumo estratégico</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.selection(); setNotifHorus(!notifHorus); }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  notifHorus ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  notifHorus ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={salvarConfiguracoes}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Preferências de Alerta</span>
            </button>
          </div>
        </section>
      </main>

      {/* 5. MODAL DE CONTEÚDO COMPLETO DO CONCURSO */}
      <AnimatePresence>
        {selectedEdital && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative space-y-5"
            >
              {/* Botão Fechar */}
              <button
                type="button"
                onClick={() => setSelectedEdital(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Imagem de Capa Grande */}
              <div className="relative h-48 sm:h-56 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 overflow-hidden rounded-t-3xl">
                <img
                  src={getConcursoVisual(selectedEdital.titulo, selectedEdital.imagem_url).imagemUrl}
                  alt={selectedEdital.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                    {selectedEdital.uf ? `Estado: ${selectedEdital.uf}` : selectedEdital.regiao || 'NACIONAL'}
                  </span>
                  {selectedEdital.dias_restantes !== undefined && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 border border-white/20 text-emerald-400 backdrop-blur-md">
                      {selectedEdital.dias_restantes > 0
                        ? `${selectedEdital.dias_restantes} dias para o encerramento`
                        : 'Inscrições encerrando'}
                    </span>
                  )}
                </div>
              </div>

              {/* Título & Detalhes Principais */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground leading-snug">
                  {selectedEdital.titulo}
                </h3>

                {selectedEdital.vagas_salario && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{selectedEdital.vagas_salario}</span>
                  </div>
                )}
              </div>

              {/* Cargos Oferecidos */}
              {selectedEdital.cargos && selectedEdital.cargos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Cargos Ofertados ({selectedEdital.cargos.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {selectedEdital.cargos.map((cargo, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/80 border border-border/80 text-foreground font-medium"
                      >
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conteúdo / Resumo */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Informações do Edital
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed font-body">
                  {selectedEdital.resumo || 'Acompanhe todas as regras e convocações deste concurso pelo link oficial.'}
                </p>
              </div>

              {/* Análise Inteligente do Hórus IA */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-card to-card border border-emerald-500/30 flex items-start gap-3">
                <img src={horusAsset} alt="Hórus" className="w-10 h-10 object-contain shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>Recomendação do Hórus IA</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </p>
                  <p className="text-xs text-white/85 leading-relaxed font-body">
                    Para este concurso ({selectedEdital.uf || 'Nacional'}), priorize o estudo de Direito Constitucional, Administrativo e a legislação específica do órgão.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openExternalLink(selectedEdital.link)}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Acessar Edital Oficial & Inscrições</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL DE SIMULAÇÃO DO HÓRUS IA */}
      <AnimatePresence>
        {simulacaoOpen && simulacaoItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <img src={horusAsset} alt="Hórus" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground flex items-center gap-1.5">
                      <span>Simulação: Alerta do Hórus IA</span>
                      <Zap className="w-4 h-4 text-amber-400" />
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">Novo Edital no seu Radar</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSimulacaoOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Volume2 className="w-4 h-4" />
                  <span>Mensagem do Hórus:</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-body">
                  "Um novo edital compatível com suas carreiras foi aberto: <strong>{simulacaoItem.titulo}</strong> ({simulacaoItem.uf || 'Nacional'}).
                  {simulacaoItem.vagas_salario && ` ${simulacaoItem.vagas_salario}.`} As inscrições estão abertas!"
                </p>
              </div>

              {/* Push simulado */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">APP.PRIME · Alerta de Concurso</p>
                  <p className="text-[11px] text-white/70 truncate">{simulacaoItem.titulo}</p>
                </div>
                <span className="text-[10px] text-white/40">Agora</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimulacaoOpen(false);
                    setSelectedEdital(simulacaoItem);
                  }}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer text-center"
                >
                  Ver Conteúdo Completo
                </button>
                <button
                  type="button"
                  onClick={() => setSimulacaoOpen(false)}
                  className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
