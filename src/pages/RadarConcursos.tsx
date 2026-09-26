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
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import horusAsset from '@/assets/horus/horus-owl.webp';
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

const UFS_BRASIL = [
  'NACIONAL', 'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO',
  'DF', 'ES', 'MT', 'MS', 'MA', 'PA', 'PB', 'RN', 'PI', 'AL', 'SE', 'RO',
  'TO', 'AC', 'AP', 'AM', 'RR'
];

const CARREIRAS_PRESETS = [
  { id: 'juridico', label: 'Carreiras Jurídicas', termos: ['ADVOGADO', 'PROCURADOR', 'DEFENSOR', 'JUIZ', 'PROMOTOR', 'MAGISTRATURA'] },
  { id: 'tribunais', label: 'Tribunais & Judiciário', termos: ['ANALISTA JUDICIÁRIO', 'TÉCNICO JUDICIÁRIO', 'OFICIAL DE JUSTIÇA', 'ESCREVENTE'] },
  { id: 'seguranca', label: 'Segurança Pública & Polícia', termos: ['DELEGADO', 'AGENTE', 'ESCRIVÃO', 'POLÍCIA', 'PERITO', 'GUARDA CIVIL', 'OFICIAL'] },
  { id: 'fiscal', label: 'Fiscal & Controle', termos: ['AUDITOR FISCAL', 'ANALISTA TRIBUTÁRIO', 'TCE', 'TCU', 'CONTADOR', 'CONTROLADOR'] },
  { id: 'administrativo', label: 'Administrativo & Gestão', termos: ['ADMINISTRATIVO', 'AUXILIAR', 'ASSISTENTE', 'ANALISTA', 'GESTÃO'] },
  { id: 'professores', label: 'Educação & Professores', termos: ['PROFESSOR', 'PEDAGOGO', 'DOCENTE', 'EDUCADOR'] },
  { id: 'saude', label: 'Saúde & Medicina', termos: ['MÉDICO', 'ENFERMEIRO', 'PSICÓLOGO', 'FARMACÊUTICO'] },
];

export default function RadarConcursos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [, startTransition] = useTransition();

  // Estados dos filtros
  const [selectedUfs, setSelectedUfs] = useState<string[]>(['NACIONAL', 'SP', 'RJ', 'MG']);
  const [selectedCarreiras, setSelectedCarreiras] = useState<string[]>(['juridico', 'tribunais']);
  const [cargoCustom, setCargoCustom] = useState('');
  const [customCargosList, setCustomCargosList] = useState<string[]>([]);
  const [notifPush, setNotifPush] = useState(true);
  const [notifHorus, setNotifHorus] = useState(true);

  // Estados de dados
  const [concursos, setConcursos] = useState<ConcursoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Simulação do Hórus
  const [simulacaoOpen, setSimulacaoOpen] = useState(false);
  const [simulacaoItem, setSimulacaoItem] = useState<ConcursoItem | null>(null);

  // Carregar preferências salvas e lista de concursos
  useEffect(() => {
    let cancel = false;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Carregar preferências salvas do usuário
        if (user?.id) {
          const { data: alertaData } = await supabase
            .from('usuario_alertas_concursos')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (alertaData && !cancel) {
            if (alertaData.ufs && alertaData.ufs.length > 0) setSelectedUfs(alertaData.ufs);
            if (alertaData.cargos && alertaData.cargos.length > 0) {
              const presetsFound = CARREIRAS_PRESETS.filter(p => alertaData.cargos.includes(p.id)).map(p => p.id);
              const customs = alertaData.cargos.filter((c: string) => !CARREIRAS_PRESETS.some(p => p.id === c));
              setSelectedCarreiras(presetsFound);
              setCustomCargosList(customs);
            }
            if (alertaData.notificar_push !== undefined) setNotifPush(alertaData.notificar_push);
            if (alertaData.notificar_horus !== undefined) setNotifHorus(alertaData.notificar_horus);
          }
        } else {
          // Fallback para localStorage
          const saved = localStorage.getItem('app_prime_radar_concursos');
          if (saved && !cancel) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.ufs) setSelectedUfs(parsed.ufs);
              if (parsed.carreiras) setSelectedCarreiras(parsed.carreiras);
              if (parsed.customs) setCustomCargosList(parsed.customs);
            } catch { /* ignore */ }
          }
        }

        // 2. Carregar concursos do Supabase enriquecidos pelo MCP
        const { data: concursosData } = await supabase
          .from('concursos_noticias')
          .select('*')
          .order('data_publicacao', { ascending: false })
          .limit(200);

        if (!cancel && concursosData) {
          setConcursos(concursosData as ConcursoItem[]);
        }
      } catch (err) {
        console.error('Erro ao carregar radar de concursos:', err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    loadData();
    return () => { cancel = true; };
  }, [user]);

  // Alternar UF
  const toggleUf = (uf: string) => {
    haptic.selection();
    setSelectedUfs(prev => {
      if (uf === 'TODOS') {
        return prev.length === UFS_BRASIL.length ? ['NACIONAL'] : [...UFS_BRASIL];
      }
      if (prev.includes(uf)) {
        const next = prev.filter(item => item !== uf);
        return next.length === 0 ? ['NACIONAL'] : next;
      }
      return [...prev, uf];
    });
  };

  // Alternar Carreira
  const toggleCarreira = (carreiraId: string) => {
    haptic.selection();
    setSelectedCarreiras(prev =>
      prev.includes(carreiraId)
        ? prev.filter(c => c !== carreiraId)
        : [...prev, carreiraId]
    );
  };

  // Adicionar cargo personalizado
  const addCustomCargo = () => {
    if (!cargoCustom.trim()) return;
    haptic.impact();
    const termo = cargoCustom.trim().toUpperCase();
    if (!customCargosList.includes(termo)) {
      setCustomCargosList(prev => [...prev, termo]);
    }
    setCargoCustom('');
  };

  const removeCustomCargo = (termo: string) => {
    haptic.light();
    setCustomCargosList(prev => prev.filter(c => c !== termo));
  };

  // Salvar configurações
  const salvarConfiguracoes = async () => {
    haptic.success();
    setSaving(true);
    const todosCargos = [...selectedCarreiras, ...customCargosList];

    try {
      if (user?.id) {
        await supabase
          .from('usuario_alertas_concursos')
          .upsert({
            user_id: user.id,
            ufs: selectedUfs,
            cargos: todosCargos,
            notificar_push: notifPush,
            notificar_horus: notifHorus,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }

      // Salva no localStorage também
      localStorage.setItem('app_prime_radar_concursos', JSON.stringify({
        ufs: selectedUfs,
        carreiras: selectedCarreiras,
        customs: customCargosList,
        notifPush,
        notifHorus
      }));

      toast.success('Radar de Concursos atualizado com sucesso!', {
        description: `${selectedUfs.length} estados e ${todosCargos.length} áreas monitoradas.`
      });
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  // Filtragem dos concursos de acordo com os alertas
  const concursosFiltrados = useMemo(() => {
    if (!concursos.length) return [];

    // Termos de cargos ativos
    const termosAtivos: string[] = [];
    selectedCarreiras.forEach(carreiraId => {
      const preset = CARREIRAS_PRESETS.find(p => p.id === carreiraId);
      if (preset) termosAtivos.push(...preset.termos);
    });
    termosAtivos.push(...customCargosList);

    return concursos.filter(item => {
      // 1. Filtro de UF
      const ufConcurso = (item.uf || '').toUpperCase();
      const bateUf = selectedUfs.length === 0 ||
        selectedUfs.includes('TODOS') ||
        selectedUfs.includes(ufConcurso) ||
        (selectedUfs.includes('NACIONAL') && (!item.uf || item.regiao === 'NACIONAL'));

      if (!bateUf) return false;

      // 2. Filtro de Cargo / Área
      if (termosAtivos.length > 0) {
        const cargosTexto = (item.cargos || []).join(' ').toUpperCase();
        const tituloTexto = (item.titulo || '').toUpperCase();
        const resumoTexto = (item.resumo || '').toUpperCase();
        const textoCompleto = `${tituloTexto} ${resumoTexto} ${cargosTexto}`;

        const bateCargo = termosAtivos.some(termo => textoCompleto.includes(termo));
        if (!bateCargo) return false;
      }

      // 3. Busca livre opcional
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (item.titulo || '').toLowerCase().includes(q) ||
          (item.resumo || '').toLowerCase().includes(q) ||
          (item.uf || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [concursos, selectedUfs, selectedCarreiras, customCargosList, searchTerm]);

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
      toast.info('Nenhum edital encontrado no momento para simular.');
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
              PCI Concursos MCP · 470+ Editais
            </span>
          </div>

          <button
            type="button"
            onClick={salvarConfiguracoes}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-8 relative z-10 pb-36">

        {/* Hero Card Informativo & Hórus Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-card to-card border border-emerald-500/20 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Radar Inteligente 24h</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
                Nunca mais perca um edital de seu interesse.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure os estados e cargos que você deseja. Assim que uma vaga abrir, o app alerta você instantaneamente via notificação push e pelo <strong className="text-emerald-400">Hórus IA</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:items-center shrink-0 w-full sm:w-auto gap-2">
              <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                <img
                  src={horusAsset}
                  alt="Hórus IA"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl relative z-10"
                />
              </div>
              <button
                type="button"
                onClick={testarAlertaHorus}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Testar Alerta do Hórus</span>
              </button>
            </div>
          </div>
        </section>

        {/* 1. SELEÇÃO DE ESTADOS / UFS */}
        <section className="space-y-3 bg-card/60 border border-border/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-base text-foreground">1. Estados de Interesse</h3>
            </div>
            <button
              type="button"
              onClick={() => toggleUf('TODOS')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {selectedUfs.length === UFS_BRASIL.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Selecione onde você tem disponibilidade para prestar provas:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {UFS_BRASIL.map(uf => {
              const active = selectedUfs.includes(uf);
              return (
                <button
                  key={uf}
                  type="button"
                  onClick={() => toggleUf(uf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 border border-emerald-400'
                      : 'bg-card border border-border/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  {uf === 'NACIONAL' ? '🇧🇷 NACIONAL' : uf}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. SELEÇÃO DE CARGOS & CARREIRAS */}
        <section className="space-y-4 bg-card/60 border border-border/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-bold text-base text-foreground">2. Cargos & Áreas de Foco</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CARREIRAS_PRESETS.map(carreira => {
              const active = selectedCarreiras.includes(carreira.id);
              return (
                <button
                  key={carreira.id}
                  type="button"
                  onClick={() => toggleCarreira(carreira.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500 text-foreground shadow-sm'
                      : 'bg-card/40 border-border/70 text-muted-foreground hover:bg-card/70'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-emerald-400' : 'text-foreground'}`}>
                      {carreira.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {carreira.termos.slice(0, 3).join(', ')}...
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    active ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border/80'
                  }`}>
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Adicionar cargo personalizado */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Procurando um cargo específico? Digite e adicione:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cargoCustom}
                onChange={e => setCargoCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCargo()}
                placeholder="Ex: Delegado, Auditor, Enfermeiro..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={addCustomCargo}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Adicionar
              </button>
            </div>

            {customCargosList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {customCargosList.map(cargo => (
                  <span
                    key={cargo}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30"
                  >
                    <span>{cargo}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomCargo(cargo)}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. CANAIS DE ALERTA & HÓRUS IA */}
        <section className="space-y-3 bg-card/60 border border-border/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-bold text-base text-foreground">3. Canais de Disparo</h3>
          </div>

          <div className="space-y-3">
            {/* Push Notification Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/40 border border-border/60">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Notificações Push no Celular</p>
                <p className="text-xs text-muted-foreground">Dispara um aviso assim que a PCI Concursos publicar o edital.</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.selection(); setNotifPush(!notifPush); }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifPush ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  notifPush ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Hórus IA Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-card/40 border border-emerald-500/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-400">Radar Hórus IA</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isPremium ? 'ASSINANTE PRIME' : 'ATIVO'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">O Hórus gera um resumo estratégico das disciplinas e prazos para você.</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.selection(); setNotifHorus(!notifHorus); }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifHorus ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  notifHorus ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* FEED DE EDITAIS EM TEMPO REAL COMPATÍVEIS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Editais Abertos Compatíveis
              </h3>
              <p className="text-xs text-muted-foreground">
                {concursosFiltrados.length} oportunidades correspondentes aos seus filtros de estado e cargo.
              </p>
            </div>

            {/* Barra de busca rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar por órgão ou termo..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-28 rounded-2xl bg-card/40 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : concursosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-card/30 rounded-3xl border border-dashed border-border/60 p-6 space-y-3">
              <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-base font-semibold text-foreground">Nenhum edital encontrado para esses filtros no momento</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente selecionar mais estados ou marcar outras áreas de formação para ampliar seu radar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {concursosFiltrados.map((item, i) => {
                const dias = item.dias_restantes ?? null;
                const isUrgente = dias !== null && dias <= 5 && dias >= 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => openExternalLink(item.link)}
                    className="group bg-card border border-border/70 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {item.uf && (
                            <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px]">
                              {item.uf}
                            </span>
                          )}
                          {item.regiao && !item.uf && (
                            <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-500/80 text-white text-[10px]">
                              {item.regiao}
                            </span>
                          )}
                          {dias !== null && (
                            <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                              isUrgente ? 'text-amber-400 font-bold' : 'text-emerald-400'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {dias > 0 ? `${dias} dias restantes` : dias === 0 ? 'Último dia de inscrição!' : 'Encerrado'}
                            </span>
                          )}
                          {item.vagas_salario && (
                            <span className="text-muted-foreground/80 font-medium text-[11px]">
                              · {item.vagas_salario}
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-semibold text-base sm:text-lg text-foreground group-hover:text-emerald-400 transition-colors leading-snug">
                          {item.titulo}
                        </h4>

                        {item.resumo && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.resumo}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center sm:self-center">
                        <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE SIMULAÇÃO DO HÓRUS IA */}
      <AnimatePresence>
        {simulacaoOpen && simulacaoItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <img src={horusAsset} alt="Hórus" className="w-9 h-9 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground flex items-center gap-1.5">
                      <span>Alerta do Hórus IA</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">Edital Recém-Publicado no seu Radar</p>
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

              {/* Mensagem simulada do Hórus */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Volume2 className="w-4 h-4" />
                  <span>Mensagem enviada pelo Hórus:</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-body">
                  "Olá! Um novo edital compatível com suas carreiras foi aberto: <strong>{simulacaoItem.titulo}</strong> ({simulacaoItem.uf || 'Nacional'}).
                  {simulacaoItem.vagas_salario && ` Oportunidade com ${simulacaoItem.vagas_salario}.`} As inscrições já estão abertas e se encerram em breve. Preparei o link do edital e o cronograma para você."
                </p>
              </div>

              {/* Push Banner simulado */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">APP.PRIME · Radar de Concursos</p>
                  <p className="text-[11px] text-white/70 truncate">Novo edital: {simulacaoItem.titulo}</p>
                </div>
                <span className="text-[10px] text-white/40">Agora</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimulacaoOpen(false);
                    openExternalLink(simulacaoItem.link);
                  }}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-center"
                >
                  Abrir Edital Oficial
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
