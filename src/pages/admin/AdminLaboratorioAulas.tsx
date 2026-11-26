import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  ArrowLeft, 
  Play, 
  Layers, 
  Sparkles, 
  Eye, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Unlock,
  CheckCircle2,
  FileCode2,
  ChevronRight,
  Globe,
  Film
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AULAS_LABORATORIO_CATALOGO } from '@/data/aulasLaboratorioData';
import { TelaPosTrialView } from '@/components/subscription/TelaPosTrialView';
import { IconesLogoStudio } from '@/pages/laboratorio/icones-logo/IconesLogoStudio';
import { HomeLayoutStudio } from '@/pages/laboratorio/layouts-inicio/HomeLayoutStudio';
import { AnimacaoLabStudio } from '@/pages/laboratorio/AnimacaoLabStudio';
import { QuestoesAnimadasPlayer } from '@/pages/laboratorio/QuestoesAnimadasPlayer';
import { QuestoesAnimadasAlfredoPlayer } from '@/pages/laboratorio/QuestoesAnimadasAlfredoPlayer';
import { AssinaturaVitaliciaView } from '@/components/assinatura/AssinaturaVitaliciaView';
import { getSubscriptionLayout, setSubscriptionLayout, type SubscriptionLayoutType } from '@/lib/subscriptionLayoutStore';
import { toast } from 'sonner';
import appLogo from '@/assets/logo-direitoprime-v2.webp';
import logoInicioApp from '@/assets/logo-coruja.webp';
import themisOficialImg from '@/assets/icon-foreground.png';
import thumbFurtoTentado from '@/assets/questoes-animadas/thumb-furto-tentado.webp';

// Code Splitting do Player Nativo
const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);

type LabFiltro = 'todos' | 'layouts' | 'questoes' | 'atlas' | 'icones' | 'aulas' | 'conversao';

export default function AdminLaboratorioAulas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<number | undefined>(undefined);
  const [filtroAtivo, setFiltroAtivo] = useState<LabFiltro>('todos');
  const [estudioLayoutAtivo, setEstudioLayoutAtivo] = useState(false);
  const [editorAnimacaoAtivo, setEditorAnimacaoAtivo] = useState(false);
  const [telaPosTrialAtiva, setTelaPosTrialAtiva] = useState(false);
  const [testadorIconeAtivo, setTestadorIconeAtivo] = useState(false);
  const [questaoAnimadaAtiva, setQuestaoAnimadaAtiva] = useState(false);
  const [questaoAlfredoAtiva, setQuestaoAlfredoAtiva] = useState(false);
  const [activeSubLayout, setActiveSubLayout] = useState<SubscriptionLayoutType>(() => getSubscriptionLayout());
  const [previewSubLayout, setPreviewSubLayout] = useState<'padrao' | 'vitalicio' | null>(null);

  const alternarLayoutAssinatura = (novo: SubscriptionLayoutType) => {
    try { haptic.selection(); } catch {}
    setSubscriptionLayout(novo);
    setActiveSubLayout(novo);
    toast.success(
      novo === 'vitalicio_promocional'
        ? 'Layout ativo no App: Plano Vitalício Promocional (R$ 89,90 no Pix)!'
        : 'Layout ativo no App: Padrão 3 Planos (Mensal, Anual e Vitalício)!'
    );
  };

  const abrirAula = (aula: AulaItem, etapa?: number) => {
    try { haptic.selection(); } catch {}
    setEtapaInicial(etapa);
    setAulaAtiva(aula);
  };

  const abrirPosTrial = () => {
    try { haptic.impact('medium'); } catch {}
    setTelaPosTrialAtiva(true);
  };

  // ── SEÇÃO NOVO: ESTÚDIO DE LAYOUTS DA TELA DE INÍCIO (10 VERSÕES) ──
  if (estudioLayoutAtivo) {
    return (
      <HomeLayoutStudio
        onVoltar={() => setEstudioLayoutAtivo(false)}
      />
    );
  }

  // ── SEÇÃO NOVO: ESTÚDIO DE EDIÇÃO DE ANIMAÇÕES (30 CASOS DO R2) ──
  if (editorAnimacaoAtivo) {
    return (
      <AnimacaoLabStudio
        onVoltar={() => setEditorAnimacaoAtivo(false)}
      />
    );
  }

  // ── SEÇÃO NOVO: PREVIEW DO LAYOUT DE ASSINATURA VITALÍCIA ──
  if (previewSubLayout === 'vitalicio') {
    return (
      <AssinaturaVitaliciaView
        onVoltar={() => setPreviewSubLayout(null)}
      />
    );
  }

  // ── SEÇÃO NOVO: QUESTÕES ANIMADAS 2D (OAB / FGV) ──
  if (questaoAnimadaAtiva) {
    return (
      <QuestoesAnimadasPlayer
        onVoltar={() => setQuestaoAnimadaAtiva(false)}
      />
    );
  }

  // ── SEÇÃO NOVO: QUESTÃO ANIMADA OAB XLII Q60 (ALFREDO E RECEPTAÇÃO) ──
  if (questaoAlfredoAtiva) {
    return (
      <QuestoesAnimadasAlfredoPlayer
        onVoltar={() => setQuestaoAlfredoAtiva(false)}
      />
    );
  }

  // ── SEÇÃO 0: ESTÚDIO DE TESTES DE ÍCONES & LOGO ──
  if (testadorIconeAtivo) {
    return (
      <IconesLogoStudio
        onVoltar={() => setTestadorIconeAtivo(false)}
      />
    );
  }

  // ── SEÇÃO 1: EXIBIÇÃO DA TELA PÓS-TRIAL (NOVA FUNÇÃO SOLICITADA) ──
  if (telaPosTrialAtiva) {
    return (
      <TelaPosTrialView
        isLabMode={true}
        onVoltar={() => setTelaPosTrialAtiva(false)}
      />
    );
  }

  // ── SEÇÃO 2: EXIBIÇÃO DA AULA INTERATIVA EM TESTE ──
  if (aulaAtiva) {
    return (
      <div className="relative w-full h-full min-h-screen bg-[#0D0D0D]">
        {/* Badge Discreto de Laboratório */}
        <div className="fixed top-2.5 right-14 sm:right-20 z-50 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-md shadow-lg shadow-black/60">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-wide">LABORATÓRIO</span>
          </div>
        </div>

        <Suspense fallback={
          <div className="fixed inset-0 bg-[#0D0D0D] flex flex-col items-center justify-center gap-3 text-white">
            <FlaskConical className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-sm font-sans text-zinc-400">Carregando protótipo...</span>
          </div>
        }>
          <PlayerAulaNativo
            aula={aulaAtiva}
            disciplinaNome="Direito Penal"
            corDestaque="#e23e57"
            etapaInicial={etapaInicial}
            onVoltar={() => {
              setAulaAtiva(null);
              setEtapaInicial(undefined);
            }}
            onConcluir={() => {
              setAulaAtiva(null);
              setEtapaInicial(undefined);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(6rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden selection:bg-teal-500/30">
      
      {/* ── HEADER NATIVO COM BOTÃO VOLTAR PREMIUM ── */}
      <PageHeader 
        title="LABORATÓRIO" 
        subtitle="Ambiente de Testes Visuais & Protótipos"
        onBack={() => {
          try { haptic.selection(); } catch {}
          navigate('/admin-funcoes');
        }}
        variant="dark"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
        
        {/* ── MENU DE ALTERNÂNCIA MINIMALISTA ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('todos'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'todos'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Todos (7)
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('layouts'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'layouts'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Layouts da Home
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('questoes'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'questoes'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Questões Animadas
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('icones'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'icones'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Ícones & Logo
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('atlas'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'atlas'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Atlas 3D
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('aulas'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'aulas'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Aulas Diagramadas
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('conversao'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'conversao'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Pós-Trial
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
            Ambiente Isolado
          </span>
        </div>

        {/* ── GRID DE PROTÓTIPOS ULTRA-MINIMALISTAS ── */}
        <div className="space-y-3">

          {/* ── 0. NOVO: ESTÚDIO DE LAYOUTS DA TELA DE INÍCIO ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'layouts') && (
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-zinc-900/60 to-zinc-900/40 p-4 transition-all hover:border-emerald-500/50 group relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-emerald-500/30 relative bg-[#0a1410] shadow-sm flex items-center justify-center p-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-emerald-400 uppercase font-bold">
                    LAYOUTS
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      NOVO · INTERATIVO
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      Tela de Início · Design Studio
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Estúdio de Layouts da Tela de Início
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Arquiteturas interativas e imersivas da Home (Central de Comando, Streaming Prime, Duolingo RPG, Leitor Clássico, Bento Grid, Daily Briefing e mais) com simulador de tela e seletor ativo.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('heavy'); } catch {}
                        setEstudioLayoutAtivo(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Abrir Estúdio de Layouts</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 0B. NOVO: ESTÚDIO DE EDIÇÃO DE ANIMAÇÕES ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'questoes') && (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-zinc-900/40 p-4 transition-all hover:border-amber-500/50 group relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-amber-500/30 relative bg-[#161005] shadow-sm flex items-center justify-center p-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-amber-400 uppercase font-bold">
                    EDITOR 2D
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      NOVO · EDITOR
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      Animações Jurídicas · R2 Studio
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Estúdio de Edição de Animações
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Carregue qualquer uma das 30 animações prontas do R2, edite o código HTML/Canvas, teste ajustes visuais ao vivo, ouça as faixas MP3 e baixe a versão melhorada.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('heavy'); } catch {}
                        setEditorAnimacaoAtivo(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Abrir Editor de Animações</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 1. QUESTÕES ANIMADAS 2D (OAB / FGV) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'questoes') && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
              <div className="flex items-start gap-3.5">
                {/* Miniatura da Capa Otimizada WebP */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-sm">
                  <img
                    src={thumbFurtoTentado}
                    alt="Questão Animada 2D"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/questoes-animadas/thumb-furto-tentado.webp';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo Minimalista */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-medium">
                      ANIMAÇÃO 2D · OAB
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      FGV · XLI · Q57
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Furto Tentado no Supermercado
                    <Film className="w-3.5 h-3.5 text-zinc-400" />
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Amanda e Fernando escondem mercadorias · Tentativa, crime impossível e Súmula 567 do STJ com cena em 17 ângulos e quiz interativo.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('heavy'); } catch {}
                        setQuestaoAnimadaAtiva(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Abrir Questão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 1.2. QUESTÃO ANIMADA 2D: ALFREDO E RECEPTAÇÃO (OAB XLII · Q60) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'questoes') && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
              <div className="flex items-start gap-3.5">
                {/* Miniatura com Ícone de Carro / Blitz */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-amber-500/30 relative bg-[#0a1120] shadow-sm flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-blue-950/40 to-black/80" />
                  <Film className="w-7 h-7 text-amber-400 relative z-10" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                      ANIMAÇÃO 2D · OAB XLII
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      FGV · XLII · Q60 · Penal
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Alfredo e a Receptação Sem Dolo
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Motorista de escolta é parado em blitz com veículo funcional roubado · Ausência de dolo, elemento subjetivo e tese de exclusão da tipicidade (Gabarito C).
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('heavy'); } catch {}
                        setQuestaoAlfredoAtiva(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Abrir Questão (OAB XLII)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. ATLAS JURÍDICO 3D (CP ART. 5º) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'atlas') && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-sm flex items-center justify-center p-2">
                  <Globe className="w-7 h-7 text-sky-400 animate-spin" style={{ animationDuration: '24s' }} />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-zinc-400 uppercase">
                    3D
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-medium">
                      3D INTERATIVO
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      CP Art. 5º · Territorialidade
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Atlas Jurídico 3D
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Globo 3D segurado pela mão de Têmis com 7 funções de estudo, avião em órbita e planetas vizinhos.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('medium'); } catch {}
                        navigate('/admin-atlas-juridico');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Abrir Atlas</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. TESTADOR DE ÍCONES & LOGO ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'icones') && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-sm flex items-center justify-center p-2">
                  <img 
                    src={logoInicioApp} 
                    alt="Ícone App"
                    className="w-full h-full object-contain filter drop-shadow(0 2px 4px rgba(0,0,0,0.7))"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = appLogo;
                    }}
                  />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-zinc-400 uppercase">
                    ÍCONES
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-medium">
                      DESIGN STUDIO
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      Cores & Logos
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    Ícones & Logo (Testador de Cores)
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Testador interativo de fundos, gradientes, formatos (iOS, Android, OneUI) e proporções do logo.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('medium'); } catch {}
                        setTestadorIconeAtivo(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Testar Cores</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3.5. NOVO: SELETOR DE LAYOUT TELA DE ASSINATURA ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'conversao') && (
            <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-zinc-900/60 to-zinc-900/40 p-4 transition-all hover:border-rose-500/60 shadow-lg group">
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-rose-500/30 relative bg-zinc-950 shadow-md flex items-center justify-center p-2">
                  <CreditCard className="w-7 h-7 text-rose-400 animate-pulse" />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7px] font-mono text-rose-300 font-bold uppercase">
                    LAYOUT
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                      NOVO RECURSO · PAYWALL
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      activeSubLayout === 'vitalicio_promocional'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      Ativo no App: {activeSubLayout === 'vitalicio_promocional' ? 'Plano Vitalício Promocional' : '3 Planos Padrão'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Layout da Tela de Assinatura
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Alterne instantaneamente a experiência que os usuários encontram ao clicar para assinar. Escolha entre o layout com os 3 planos ou o novo <b>Plano Vitalício Promocional a R$ 89,90 no Pix</b> com timer de 5 dias cíclico.
                  </p>

                  {/* Alternador de Layouts */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => alternarLayoutAssinatura('vitalicio_promocional')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 border cursor-pointer ${
                        activeSubLayout === 'vitalicio_promocional'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                          : 'bg-zinc-800/80 text-zinc-300 border-white/10 hover:bg-zinc-700/80'
                      }`}
                    >
                      <span>🔥 Vitalício Promocional (R$ 89,90 Pix)</span>
                      {activeSubLayout === 'vitalicio_promocional' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarLayoutAssinatura('padrao_3_planos')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 border cursor-pointer ${
                        activeSubLayout === 'padrao_3_planos'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50'
                          : 'bg-zinc-800/80 text-zinc-300 border-white/10 hover:bg-zinc-700/80'
                      }`}
                    >
                      <span>💳 Padrão 3 Planos (Mensal/Anual/Vitalício)</span>
                      {activeSubLayout === 'padrao_3_planos' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Botões de Ação para Visualizar / Testar as Telas */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('medium'); } catch {}
                        setPreviewSubLayout('vitalicio');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Visualizar Tela Vitalício (R$ 89,90)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        navigate('/assinatura?layout=padrao');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Ver Tela 3 Planos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. TELA PÓS-TRIAL DE 3 DIAS ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'conversao') && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-sm flex items-center justify-center p-2">
                  <img 
                    src={appLogo} 
                    alt="Direito Prime"
                    className="w-full h-full object-contain" 
                  />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-zinc-400 uppercase">
                    PÓS-TRIAL
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-medium">
                      PAYWALL
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      3 Dias de Degustação
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                    Tela Pós-Trial de 3 Dias
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Experiência visual exibida quando o período gratuito expira, com trava suave e planos.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={abrirPosTrial}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Abrir Pós-Trial</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. AULAS COM DIAGRAMAÇÃO AVANÇADA ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'aulas') && (
            AULAS_LABORATORIO_CATALOGO.map((aula) => (
              <div 
                key={aula.id}
                className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60 hover:border-white/10 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-sm">
                    <img 
                      src={aula.capaUrl} 
                      alt={aula.titulo}
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono text-zinc-400 uppercase">
                      SLIDE 10
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-medium">
                        DIREITO PENAL
                      </span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        32 Etapas · Áudio Real
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                      {aula.titulo}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      Árvore de decisão (Dolo vs Erro de Tipo), tabelas sinópticas e grids de pilares na Etapa 10.
                    </p>

                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => abrirAula(aula, 9)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Etapa 10</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirAula(aula, 0)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-medium text-xs flex items-center gap-1 border border-white/5 active:scale-95 transition-all"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Do Início</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>

        {/* ── NOTA DISCRETA DE RODAPÉ (MINIMALISTA) ── */}
        <div className="pt-2 pb-6 text-center">
          <p className="text-[11px] font-mono text-zinc-500">
            Ambiente isolado de testes. Nenhuma alteração afeta a plataforma principal até aprovação.
          </p>
        </div>

      </div>
    </div>
  );
}
