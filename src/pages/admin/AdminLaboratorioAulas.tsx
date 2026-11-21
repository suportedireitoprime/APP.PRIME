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
import { QuestoesAnimadasPlayer } from '@/pages/laboratorio/QuestoesAnimadasPlayer';
import appLogo from '@/assets/logo-direitoprime-v2.webp';
import logoInicioApp from '@/assets/logo-coruja.webp';
import themisOficialImg from '@/assets/icon-foreground.png';

// Code Splitting do Player Nativo
const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);

type LabFiltro = 'todos' | 'questoes' | 'atlas' | 'icones' | 'aulas' | 'conversao';

export default function AdminLaboratorioAulas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<number | undefined>(undefined);
  const [filtroAtivo, setFiltroAtivo] = useState<LabFiltro>('todos');
  const [telaPosTrialAtiva, setTelaPosTrialAtiva] = useState(false);
  const [testadorIconeAtivo, setTestadorIconeAtivo] = useState(false);
  const [questaoAnimadaAtiva, setQuestaoAnimadaAtiva] = useState(false);

  const abrirAula = (aula: AulaItem, etapa?: number) => {
    try { haptic.selection(); } catch {}
    setEtapaInicial(etapa);
    setAulaAtiva(aula);
  };

  const abrirPosTrial = () => {
    try { haptic.impact('medium'); } catch {}
    setTelaPosTrialAtiva(true);
  };

  // ── SEÇÃO NOVO: QUESTÕES ANIMADAS 2D (OAB / FGV) ──
  if (questaoAnimadaAtiva) {
    return (
      <QuestoesAnimadasPlayer
        onVoltar={() => setQuestaoAnimadaAtiva(false)}
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
        
        {/* ── MENU DE ALTERNÂNCIA (Botões Brancos como antes) ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('todos'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'todos'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Todos (5)
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('questoes'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'questoes'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Questões Animadas (1)
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('icones'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'icones'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Ícones & Logo
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('atlas'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'atlas'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Atlas Jurídico 3D
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('aulas'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'aulas'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Aulas Diagramadas
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('conversao'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroAtivo === 'conversao'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Telas de Conversão (Pós-Trial)
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
            Ambiente Isolado
          </span>
        </div>

        {/* ── GRID DE PROTÓTIPOS MINIMALISTAS ── */}
        <div className="space-y-3.5">

          {/* ── PROTÓTIPO NOVO: QUESTÕES ANIMADAS 2D (OAB / FGV) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'questoes') && (
            <div className="rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-900/80 to-blue-950/30 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all hover:border-amber-400/60 relative overflow-hidden group">
              <div className="flex items-start gap-3.5 sm:gap-4.5">
                {/* Miniatura da Capa Real */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-amber-500/40 relative bg-zinc-950 shadow-md">
                  <img
                    src="/questoes-animadas/capa-furto-tentado-amanda-fernando-xli-q57.png"
                    alt="Questão Animada 2D"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      NOVO · ANIMAÇÃO 2D OAB
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      FGV · XLI Exame · Questão 57
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Questões Animadas: Furto Tentado
                    <Film className="w-4 h-4 text-amber-400" />
                  </h3>

                  <p className="text-xs text-zinc-300 line-clamp-2">
                    Amanda e Fernando escondem mercadorias no supermercado · Tentativa, crime impossível e Súmula 567 do STJ com cena em 17 ângulos, Canvas 120fps e quiz interativo.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('heavy'); } catch {}
                        setQuestaoAnimadaAtiva(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Abrir Questão Animada</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTÓTIPO NOVO: ATLAS JURÍDICO 3D (CP ART. 5º) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'atlas') && (
            <div className="rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-blue-950/40 via-zinc-900/70 to-amber-950/20 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all hover:border-amber-400/60 relative overflow-hidden group">
              <div className="flex items-start gap-3.5 sm:gap-4.5">
                {/* Miniatura do Globo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-amber-500/40 relative bg-gradient-to-br from-blue-900 to-zinc-950 shadow-md flex items-center justify-center p-2">
                  <Globe className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono font-black text-amber-300 uppercase">
                    3D TERRA
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      NOVO · 3D INTERATIVO
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      CP Art. 5º · Territorialidade
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Atlas Jurídico 3D
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    Globo 3D segurado pela mão de Têmis com 7 funções de estudo (Texto, Ouvir, Assistir, Entender, Praticar, Aprofundar e Meu Estudo), avião em órbita e planetas vizinhos.
                  </p>

                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('medium'); } catch {}
                        navigate('/admin-atlas-juridico');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-mono font-bold text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      ABRIR ATLAS 3D
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTÓTIPO NOVO: TESTADOR DE ÍCONES & LOGO ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'icones') && (
            <div className="rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-red-950/40 via-zinc-900/70 to-amber-950/20 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all hover:border-amber-400/60 relative overflow-hidden group">
              <div className="flex items-start gap-3.5 sm:gap-4.5">
                {/* Miniatura do Ícone com Fundo Oficial */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-amber-500/40 relative bg-gradient-to-br from-[#1f0101] to-[#8C1220] shadow-md flex items-center justify-center p-2">
                  <img 
                    src={logoInicioApp} 
                    alt="Ícone App"
                    className="w-full h-full object-contain filter drop-shadow(0 4px 8px rgba(0,0,0,0.85))"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = appLogo;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono font-black text-amber-300 uppercase">
                    ÍCONES
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      NOVO · DESIGN STUDIO
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Cores de Fundo & Logo
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Ícones & Logo (Testador de Cores)
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    Laboratório interativo para testar cores de fundo, gradientes (linear e radial), formatos (iOS, Android, OneUI) e proporções do logo sobreposto com simulação em smartphone real e exportação PNG 1024px.
                  </p>

                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact('medium'); } catch {}
                        setTestadorIconeAtivo(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-mono font-bold text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      TESTAR CORES DE ÍCONE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTÓTIPO 1: TELA PÓS-TRIAL DE 3 DIAS (NOVA FUNÇÃO) ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'conversao') && (
            <div className="rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-900/60 to-zinc-900/40 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all hover:border-amber-400/50">
              <div className="flex items-start gap-3.5 sm:gap-4.5">
                
                {/* Logo Minimalista 1:1 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-amber-500/30 relative bg-zinc-950 shadow-md flex items-center justify-center p-2">
                  <img 
                    src={appLogo} 
                    alt="Direito Prime"
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono font-black text-amber-300 uppercase">
                    PÓS-TRIAL
                  </span>
                </div>

                {/* Conteúdo Textual Minimalista */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      NOVA FUNÇÃO · PAYWALL
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      3 Dias de Degustação
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-white text-base sm:text-lg leading-snug">
                    Tela Pós-Trial de 3 Dias
                  </h3>

                  <p className="text-xs text-zinc-300 font-sans line-clamp-2 leading-relaxed">
                    Experiência visual exibida automaticamente ao aluno quando o período de 3 dias gratuitos expira, apresentando a trava suave, resumo do que ele desbloqueou e os planos de assinatura.
                  </p>

                  {/* Ação Direta */}
                  <div className="pt-2 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={abrirPosTrial}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Abrir Tela Pós-Trial</span>
                    </button>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Modo Interativo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTÓTIPO 2: AULA COM DIAGRAMAÇÃO AVANÇADA ── */}
          {(filtroAtivo === 'todos' || filtroAtivo === 'aulas') && (
            AULAS_LABORATORIO_CATALOGO.map((aula) => (
              <div 
                key={aula.id}
                className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-start gap-3.5 sm:gap-4.5">
                  
                  {/* Capa Minimalista 1:1 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative bg-zinc-950 shadow-md">
                    <img 
                      src={aula.capaUrl} 
                      alt={aula.titulo}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1 inset-x-0 text-center text-[7.5px] font-mono font-black text-emerald-300 uppercase">
                      SLIDE 10
                    </span>
                  </div>

                  {/* Conteúdo Textual Minimalista */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        DIREITO PENAL
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        32 Etapas · Áudio Real
                      </span>
                    </div>

                    <h3 className="font-serif font-black text-white text-base sm:text-lg leading-snug">
                      {aula.titulo}
                    </h3>

                    <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                      Árvore de decisão (Dolo vs Erro de Tipo), tabelas sinópticas e grids de pilares na Etapa 10.
                    </p>

                    {/* Ações Rápidas */}
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => abrirAula(aula, 9)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-[#10b981] to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Etapa 10 (Novo Layout)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirAula(aula, 0)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs flex items-center gap-1 border border-white/10 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-zinc-400 fill-current" />
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
