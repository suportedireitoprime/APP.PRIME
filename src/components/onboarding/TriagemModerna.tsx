import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles,
  GraduationCap,
  Scale,
  Landmark,
  Briefcase
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import horusAsset from '@/assets/horus/horus-star.webp';
import personaAdvogado from '@/assets/onboarding/persona-advogado.webp';

// Imagens geradas
import historia1 from '@/assets/onboarding/historia_direito_1.jpg';
import historia2 from '@/assets/onboarding/historia_direito_2.jpg';
import historia3 from '@/assets/onboarding/historia_direito_3.jpg';

import { toast } from 'sonner';
import type { CadastroResult } from './CadastroOnboardingOverlay';

export interface TriagemModernaProps {
  initialName?: string;
  onComplete: (data: CadastroResult) => void;
  previewMode?: boolean;
}

const INTRO_SCREENS = [
  {
    image: historia1,
    title: 'A História do Direito',
    text: 'Por séculos, o estudo do Direito foi marcado por livros densos e uma teoria desconectada da realidade prática.',
  },
  {
    image: historia2,
    title: 'Tempo Desperdiçado',
    text: 'A doutrina tradicional toma o seu tempo. Você estuda horas a fio e sente que não aprendeu o necessário para avançar.',
  },
  {
    image: historia3,
    title: 'A Evolução do Aprendizado',
    text: 'Nós unimos a inteligência artificial com a didática prática para mudar de vez a forma como você absorve o Direito.',
  },
  {
    image: horusAsset,
    title: 'Foco no que Importa',
    text: 'Uma ferramenta que se adapta ao seu objetivo, entregando o conteúdo exato que você precisa para evoluir rápido.',
  },
  {
    image: personaAdvogado,
    title: 'Sua Prática, Elevada',
    text: 'Desbloqueie agora o seu acesso à plataforma definitiva e transforme para sempre seus resultados jurídicos.',
  }
];

const PERSONAS = [
  { id: 'faculdade', label: 'Estudante (Graduação)', desc: 'Preparação para provas, TCC e início da jornada.', icon: GraduationCap },
  { id: 'concurso', label: 'Concurseiro', desc: 'Magistratura, MP, Delegado, Defensoria ou Tribunais.', icon: Landmark },
  { id: 'oab', label: 'OABeiro (1ª ou 2ª Fase)', desc: 'Foco absoluto nas disciplinas e simulados para aprovação.', icon: Scale },
  { id: 'advogado', label: 'Advogado / Prática Jurídica', desc: 'Pesquisa jurisprudencial, peças e atualização constante.', icon: Briefcase },
] as const;

const FAIXAS = ['18 a 24 anos', '25 a 30 anos', '31 a 40 anos', '41 anos ou mais'];

export default function TriagemModerna({ initialName = '', onComplete, previewMode = false }: TriagemModernaProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [introIndex, setIntroIndex] = useState(0);
  
  const [persona, setPersona] = useState<'faculdade' | 'oab' | 'concurso' | 'advogado' | null>(null);
  const [faixa, setFaixa] = useState('');
  const [calculatingPhase, setCalculatingPhase] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const personaRef = useRef(persona);
  personaRef.current = persona;
  const faixaRef = useRef(faixa);
  faixaRef.current = faixa;
  const initialNameRef = useRef(initialName);
  initialNameRef.current = initialName;

  // Animação de análise neural da IA no Step 4
  useEffect(() => {
    if (step !== 4) return;

    let isFinished = false;
    const finishStep = () => {
      if (isFinished) return;
      isFinished = true;
      haptic.success();
      const currentPersona = personaRef.current;
      const selectedPersonaObj = PERSONAS.find(p => p.id === currentPersona);
      
      onCompleteRef.current?.({
        persona: currentPersona || 'oab',
        personaLabel: selectedPersonaObj?.label || 'Direito',
        faixa: faixaRef.current || '25 a 30 anos',
        nome: initialNameRef.current.trim() || 'Doutor(a)',
        areas: ['Direito Constitucional'],
        interesses: ['leis', 'leis-comentadas', 'questoes', 'resumos'],
        dores: [],
        whatsapp: null,
      });
    };

    haptic.impact('medium');
    const t1 = setTimeout(() => setCalculatingPhase(1), 500);
    const t2 = setTimeout(() => setCalculatingPhase(2), 1100);
    const t3 = setTimeout(() => setCalculatingPhase(3), 1600);
    const t4 = setTimeout(() => finishStep(), 2200);

    const fallbackTimer = setTimeout(() => {
      finishStep();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(fallbackTimer);
    };
  }, [step]);

  const nextIntro = () => {
    haptic.impact('light');
    if (introIndex < INTRO_SCREENS.length - 1) {
      setIntroIndex(prev => prev + 1);
    } else {
      setStep(2);
    }
  };

  const prevIntro = () => {
    haptic.impact('light');
    if (introIndex > 0) {
      setIntroIndex(prev => prev - 1);
    }
  };

  const canContinue = 
    (step === 1) ||
    (step === 2 && persona !== null) ||
    (step === 3 && faixa !== '');

  const nextStep = React.useCallback(() => {
    if (!canContinue) return;
    haptic.impact('light');
    setStep(prev => (Math.min(prev + 1, 4) as 1 | 2 | 3 | 4));
  }, [canContinue]);

  const prevStep = React.useCallback(() => {
    haptic.impact('light');
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0C10] text-white flex flex-col overflow-hidden select-none">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-25">
        <ShapeGrid
          speed={0.4}
          squareSize={44}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(224, 31, 71, 0.1)"
          shape="square"
          hoverTrailAmount={4}
        />
      </div>

      {step < 4 && (
        <header className="relative z-20 w-full max-w-xl mx-auto px-4 pt-[calc(0.75rem+var(--sai-top,0px))] pb-3 flex flex-col gap-2.5">
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 via-primary to-rose-500 rounded-full shadow-[0_0_12px_rgba(224,31,71,0.6)]"
              initial={false}
              animate={{ width: step === 1 ? `${((introIndex + 1) / 5) * 100}%` : `${(step / 3) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            />
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] max-w-xl mx-auto w-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* PASSO 1: INTRO (Carrossel Persuasivo) */}
          {step === 1 && (
            <motion.div
              key={`intro-${introIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                {/* Imagens renderizadas sem bordas grossas, fundo escuro */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0C10]/80 z-10 pointer-events-none" />
                <img 
                  src={INTRO_SCREENS[introIndex].image} 
                  alt={INTRO_SCREENS[introIndex].title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3 px-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {INTRO_SCREENS[introIndex].title}
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-sm mx-auto">
                  {INTRO_SCREENS[introIndex].text}
                </p>
              </div>
            </motion.div>
          )}

          {/* PASSO 2: FOCO (Sem Imagens) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-6 pt-4 h-full flex flex-col"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
                  ETAPA 1 • SEU OBJETIVO
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug tracking-normal">
                  Qual é o seu foco no Direito?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Personalizaremos o ambiente para a sua necessidade.
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-3 pt-2">
                {PERSONAS.map(p => {
                  const Icon = p.icon;
                  const isSelected = persona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setPersona(p.id);
                      }}
                      className={`w-full relative flex items-center gap-4 text-left p-4 min-h-[48px] rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/20 shadow-[0_0_24px_rgba(224,31,71,0.25)] ring-1 ring-primary'
                          : 'border-white/10 bg-neutral-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white/10 text-white/80'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-bold text-base text-white/95 truncate">
                          {p.label}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                          {p.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PASSO 3: IDADE */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-6 pt-4 flex flex-col h-full justify-center pb-20"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
                  ETAPA 2 • PERFIL
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug tracking-normal">
                  Qual é a sua faixa etária?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Para adaptarmos a linguagem e a didática do conteúdo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {FAIXAS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setFaixa(f);
                    }}
                    className={`min-h-[56px] py-3 px-4 rounded-xl text-base font-bold transition-all cursor-pointer active:scale-[0.98] ${
                      faixa === f
                        ? 'bg-primary text-white border border-primary/40 shadow-[0_0_15px_rgba(224,31,71,0.3)]'
                        : 'bg-neutral-900/80 border border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASSO 4: ANÁLISE COM IA */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-6 h-full"
            >
              <div className="relative w-24 h-24">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <div className="absolute inset-2 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center shadow-2xl">
                  <img src={horusAsset} alt="Horus" className="w-10 h-10 object-contain drop-shadow-md animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="font-extrabold text-xl sm:text-2xl text-white tracking-wide uppercase">
                  Liberando Seu Acesso...
                </h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={calculatingPhase}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs sm:text-sm text-neutral-400 font-medium min-h-[2.5rem]"
                  >
                    {calculatingPhase === 0 && 'Analisando perfil e momento jurídico...'}
                    {calculatingPhase === 1 && `Configurando Vade Mecum inteligente...`}
                    {calculatingPhase === 2 && `Preparando promoção de boas vindas...`}
                    {calculatingPhase === 3 && 'Tudo pronto! Entrando na plataforma...'}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(calculatingPhase + 1) * 25}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {step < 4 && (
          <motion.footer 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/95 to-transparent pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]"
          >
            <div className="max-w-xl mx-auto w-full">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={nextIntro}
                  className={`btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(224,31,71,0.35)] cursor-pointer`}
                >
                  <span>{introIndex < 4 ? 'PRÓXIMO' : 'COMEÇAR AGORA'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinue}
                  className={`relative overflow-hidden w-full h-14 rounded-2xl font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg cursor-pointer ${
                    canContinue 
                      ? 'bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(224,31,71,0.35)] btn-shine-loop' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed opacity-70'
                  }`}
                >
                  <span>{step === 3 ? 'FINALIZAR E LIBERAR ACESSO' : 'CONTINUAR'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
