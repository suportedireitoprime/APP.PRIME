import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Clock, 
  Lock, 
  Unlock, 
  Star, 
  ChevronRight, 
  CreditCard, 
  Zap, 
  BookOpen, 
  BrainCircuit, 
  Scale, 
  Flame,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  PRECO_MENSAL, 
  PRECO_ANUAL, 
  PRECO_VITALICIO, 
  MAX_PARCELAS_ANUAL, 
  parcelamento, 
  brl, 
  type PlanoCheckout 
} from '@/lib/precos';
import { CheckoutModal } from '@/components/assinatura/CheckoutModal';
import { haptic } from '@/lib/nativeHaptics';

// Capas oficiais das principais áreas jurídicas
import penalCover from '@/assets/biblioteca/areas/direito-penal.webp';
import civilCover from '@/assets/biblioteca/areas/direito-civil.webp';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';
import adminCover from '@/assets/biblioteca/areas/direito-administrativo.webp';
import trabCover from '@/assets/biblioteca/areas/direito-do-trabalho.webp';
import tribCover from '@/assets/biblioteca/areas/direito-tributario.webp';
import procPenalCover from '@/assets/biblioteca/areas/direito-processual-penal.webp';
import procCivilCover from '@/assets/biblioteca/areas/direito-processual-civil.webp';
import horusBalanca from '@/assets/horus/03_coruja_balanca_justica.webp';

interface TelaPosTrialViewProps {
  onVoltar?: () => void;
  isLabMode?: boolean;
  alunoNomeSimulado?: string;
}

const MATERIAS_SHOWCASE = [
  { id: 'penal', nome: 'Direito Penal', cor: '#e23e57', cover: penalCover },
  { id: 'civil', nome: 'Direito Civil', cor: '#3b82f6', cover: civilCover },
  { id: 'const', nome: 'Constitucional', cor: '#10b981', cover: constCover },
  { id: 'admin', nome: 'Administrativo', cor: '#f59e0b', cover: adminCover },
  { id: 'trab', nome: 'Trabalho', cor: '#8b5cf6', cover: trabCover },
  { id: 'proc_penal', nome: 'Processo Penal', cor: '#ec4899', cover: procPenalCover },
  { id: 'trib', nome: 'Tributário', cor: '#06b6d4', cover: tribCover },
  { id: 'proc_civil', nome: 'Processo Civil', cor: '#6366f1', cover: procCivilCover },
];

export const TelaPosTrialView: React.FC<TelaPosTrialViewProps> = ({
  onVoltar,
  isLabMode = false,
  alunoNomeSimulado,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();

  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoCheckout>('anual');
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [planoCheckout, setPlanoCheckout] = useState<PlanoCheckout | null>(null);

  // Nome do aluno para personalização nobre
  const nomeAluno = alunoNomeSimulado || 
    user?.user_metadata?.full_name?.split(' ')[0] || 
    user?.user_metadata?.name?.split(' ')[0] || 
    'Doutor(a)';

  // Parcelamento oficial do plano anual (6x com juros Asaas)
  const parcelamentoAnual = parcelamento(MAX_PARCELAS_ANUAL, PRECO_ANUAL);

  const handleSelecionarPlano = (plano: PlanoCheckout) => {
    try { haptic.selection(); } catch {}
    setPlanoSelecionado(plano);
  };

  const handleAvancarCheckout = () => {
    try { haptic.impact('medium'); } catch {}
    setPlanoCheckout(planoSelecionado);
    setCheckoutAberto(true);
  };

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white flex flex-col overflow-x-hidden selection:bg-amber-500/30">
      
      {/* ── BARRA FLUTUANTE DE LABORATÓRIO (QUANDO EM MODO DE TESTE) ── */}
      {isLabMode && (
        <div className="sticky top-0 z-[100] w-full bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono font-bold text-emerald-300 uppercase tracking-wider">
              Simulador de Tela Pós-Trial (3 Dias)
            </span>
          </div>
          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-medium cursor-pointer transition-all active:scale-95"
            >
              ← Voltar ao Laboratório
            </button>
          )}
        </div>
      )}

      {/* ── AMBIENTE DE ILUMINAÇÃO & GLOW DARK LUXURY ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-amber-500/15 via-emerald-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[140px]" />
      </div>

      {/* ── HEADER MINIMALISTA COM BOTÃO DE VOLTAR ── */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 max-w-5xl mx-auto w-full">
        {onVoltar ? (
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </button>
        ) : (
          <div className="w-11" />
        )}

        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-black tracking-widest text-xs uppercase text-zinc-300">
            DIREITO PRIME
          </span>
        </div>

        <div className="w-11 flex justify-end">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-300 uppercase">
            Pós-Trial
          </span>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 space-y-6 sm:space-y-8 pb-16">
        
        {/* ── HERO DE CONCLUSÃO DOS 3 DIAS ── */}
        <div className="text-center space-y-3.5 pt-2">
          
          {/* Badge Nobre de Expiração dos 3 Dias */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>TESTE DE 3 DIAS CONCLUÍDO</span>
          </div>

          {/* Headline de Alto Impacto */}
          <h1 className="font-serif font-black text-2xl xs:text-3xl sm:text-4xl text-white tracking-tight leading-[1.15] max-w-2xl mx-auto">
            Continue sua jornada rumo à <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">aprovação e ao topo</span>
          </h1>

          {/* Copy Persuasiva e Direta */}
          <p className="text-xs xs:text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            <strong className="text-white">{nomeAluno}</strong>, seus 3 dias de degustação gratuita chegaram ao fim. 
            Você comprovou a velocidade do método interativo — não deixe o seu ritmo desacelerar.
          </p>
        </div>

        {/* ── SHOWCASE VISUAL DAS MATÉRIAS (CARROSSEL DINÂMICO 3D) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400" />
              Acervo Completo Bloqueado
            </span>
            <span className="text-[11px] font-mono text-amber-400/90 font-bold">
              3.192 Aulas Prontas
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {MATERIAS_SHOWCASE.map((mat) => (
              <div 
                key={mat.id}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-zinc-950 shadow-lg"
              >
                <img 
                  src={mat.cover} 
                  alt={mat.nome} 
                  className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-1.5 text-center">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold font-serif text-white uppercase tracking-wider line-clamp-1">
                    {mat.nome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4 PILARES QUE O ALUNO CONTINUA RECEBENDO ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-3.5 space-y-1.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-white">3.192 Aulas</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">Áudio narrado em estúdio e fixação ativa.</p>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-3.5 space-y-1.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-white">Tutor IA Hórus</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">Tire dúvidas jurídicas complexas 24h por dia.</p>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-3.5 space-y-1.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <Scale className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-white">Vade Mecum</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">Legislação atualizada com áudios de artigos.</p>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-3.5 space-y-1.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-white">+100 Mil Questões</h4>
            <p className="text-[11px] text-zinc-400 leading-snug">Flashcards e simulados com repetição espaçada.</p>
          </div>
        </div>

        {/* ── CARDS DE PLANOS (DESIGN MINIMALISTA DE ALTA CONVERSÃO) ── */}
        <div className="space-y-3 pt-2">
          <div className="text-center space-y-1">
            <h3 className="font-serif font-black text-lg sm:text-xl text-white">
              Escolha como deseja continuar
            </h3>
            <p className="text-xs text-zinc-400">
              Acesso imediato e liberação de todas as disciplinas em segundos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* PLANO ANUAL (RECOMENDADO / MAIOR DESTAQUE) */}
            <div
              onClick={() => handleSelecionarPlano('anual')}
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                planoSelecionado === 'anual'
                  ? 'bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]'
                  : 'bg-zinc-900/50 border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Badge de Melhor Valor */}
              <div className="absolute top-0 right-0">
                <span className="px-3 py-1 rounded-bl-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-mono font-black text-[10px] uppercase tracking-wider shadow">
                  MELHOR VALOR · 70% OFF
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-serif font-bold text-white text-base">Plano Anual</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-zinc-400">Em até 6x de</span>
                    <span className="font-serif font-black text-2xl sm:text-3xl text-amber-300">
                      {brl(parcelamentoAnual.parcela)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400">
                    ou {brl(PRECO_ANUAL)} à vista por 1 ano
                  </p>
                </div>

                <ul className="text-xs text-zinc-300 space-y-1.5 pt-2 border-t border-white/10 font-sans">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Acesso total por 12 meses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Menos de R$ 0,25 por dia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Todas as atualizações incluídas</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <div className={`w-full py-2 rounded-xl text-center font-bold text-xs tracking-wider uppercase transition-all ${
                  planoSelecionado === 'anual'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-white/10 text-white'
                }`}>
                  {planoSelecionado === 'anual' ? 'Selecionado' : 'Escolher Anual'}
                </div>
              </div>
            </div>

            {/* PLANO MENSAL */}
            <div
              onClick={() => handleSelecionarPlano('mensal')}
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                planoSelecionado === 'mensal'
                  ? 'bg-gradient-to-b from-zinc-800/60 via-zinc-900 to-zinc-950 border-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.2)] scale-[1.02]'
                  : 'bg-zinc-900/40 border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span className="font-serif font-bold text-white text-base">Plano Mensal</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif font-black text-2xl sm:text-3xl text-white">
                      {brl(PRECO_MENSAL)}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">/ mês</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Sem fidelidade, cancele quando quiser
                  </p>
                </div>

                <ul className="text-xs text-zinc-300 space-y-1.5 pt-2 border-t border-white/10 font-sans">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Acesso a todas as ferramentas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Renovação mensal flexível</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <div className={`w-full py-2 rounded-xl text-center font-bold text-xs tracking-wider uppercase transition-all ${
                  planoSelecionado === 'mensal'
                    ? 'bg-teal-400 text-black shadow-md'
                    : 'bg-white/10 text-white'
                }`}>
                  {planoSelecionado === 'mensal' ? 'Selecionado' : 'Escolher Mensal'}
                </div>
              </div>
            </div>

            {/* PLANO VITALÍCIO */}
            <div
              onClick={() => handleSelecionarPlano('vitalicio')}
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                planoSelecionado === 'vitalicio'
                  ? 'bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-950 border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.2)] scale-[1.02]'
                  : 'bg-zinc-900/40 border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-400" />
                  <span className="font-serif font-bold text-white text-base">Acesso Vitalício</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif font-black text-2xl sm:text-3xl text-purple-300">
                      {brl(PRECO_VITALICIO)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Pagamento único · Acesso para sempre
                  </p>
                </div>

                <ul className="text-xs text-zinc-300 space-y-1.5 pt-2 border-t border-white/10 font-sans">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Sem mensalidades ou renovações</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Todas as futuras ferramentas</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <div className={`w-full py-2 rounded-xl text-center font-bold text-xs tracking-wider uppercase transition-all ${
                  planoSelecionado === 'vitalicio'
                    ? 'bg-purple-400 text-black shadow-md'
                    : 'bg-white/10 text-white'
                }`}>
                  {planoSelecionado === 'vitalicio' ? 'Selecionado' : 'Escolher Vitalício'}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── BOTÃO PRINCIPAL DE CALL TO ACTION (CTA) ── */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleAvancarCheckout}
            className="w-full min-h-[56px] py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black font-serif text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
          >
            <Unlock className="w-5 h-5 fill-current" />
            <span>Desbloquear Acesso Imediato</span>
          </button>

          {/* Garantia & Confiança */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Garantia incondicional de 7 dias
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-300" />
              Pix instantâneo ou Cartão
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Cancelamento simples a qualquer momento
            </span>
          </div>
        </div>

      </main>

      {/* ── MODAL NATIVO DE CHECKOUT INTEGRADO ── */}
      <CheckoutModal
        open={checkoutAberto}
        onOpenChange={(v) => { if (!v) setCheckoutAberto(false); }}
        plan={planoCheckout}
        userEmail={user?.email || 'aluno@direitoprime.com'}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name || nomeAluno}
        onSuccess={() => {
          setCheckoutAberto(false);
          refreshSubscription();
          if (onVoltar) onVoltar();
          else navigate('/vademecum');
        }}
      />

    </div>
  );
};

export default TelaPosTrialView;
