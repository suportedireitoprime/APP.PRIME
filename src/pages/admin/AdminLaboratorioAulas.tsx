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
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AULAS_LABORATORIO_CATALOGO } from '@/data/aulasLaboratorioData';
import { TelaPosTrialView } from '@/components/subscription/TelaPosTrialView';
import appLogo from '@/assets/logo-direitoprime-v2.webp';

// Code Splitting do Player Nativo
const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);

type LabFiltro = 'todos' | 'aulas' | 'conversao';

export default function AdminLaboratorioAulas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<number | undefined>(undefined);
  const [filtroAtivo, setFiltroAtivo] = useState<LabFiltro>('todos');
  const [telaPosTrialAtiva, setTelaPosTrialAtiva] = useState(false);

  const abrirAula = (aula: AulaItem, etapa?: number) => {
    try { haptic.selection(); } catch {}
    setEtapaInicial(etapa);
    setAulaAtiva(aula);
  };

  const abrirPosTrial = () => {
    try { haptic.impact('medium'); } catch {}
    setTelaPosTrialAtiva(true);
  };

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
        onBack={() => navigate(-1)}
        variant="dark"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
        
        {/* ── MENU DE ALTERNÂNCIA MINIMALISTA ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('todos'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                filtroAtivo === 'todos'
                  ? 'bg-white text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Todos (2)
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('aulas'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                filtroAtivo === 'aulas'
                  ? 'bg-emerald-500 text-black shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Aulas Diagramadas
            </button>
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setFiltroAtivo('conversao'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                filtroAtivo === 'conversao'
                  ? 'bg-amber-400 text-black shadow'
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
