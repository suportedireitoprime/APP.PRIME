import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  GraduationCap, 
  Scale, 
  Landmark, 
  Briefcase,
  FileWarning,
  Highlighter,
  Gavel,
  Search,
  Compass,
  Lock,
  Phone,
  User,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import horusAsset from '@/assets/horus/horus-star.webp';
import personaEstudante from '@/assets/onboarding/persona-estudante.webp';
import personaOAB from '@/assets/onboarding/persona-oab-homem.webp';
import personaConcurseiro from '@/assets/onboarding/persona-concurseiro.webp';
import personaAdvogado from '@/assets/onboarding/persona-advogado.webp';
import { toast } from 'sonner';
import type { CadastroResult } from './CadastroOnboardingOverlay';

export interface TriagemModernaProps {
  initialName?: string;
  onComplete: (data: CadastroResult) => void;
  previewMode?: boolean;
}

function maskPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const PERSONAS = [
  {
    id: 'faculdade' as const,
    label: 'Estudante de Direito',
    tag: 'GRADUAÇÃO & ESTÁGIO',
    desc: 'Preciso passar nas matérias, entender a teoria e me preparar desde a faculdade.',
    cover: personaEstudante,
    accent: '#F5C518',
    icon: GraduationCap,
  },
  {
    id: 'oab' as const,
    label: 'Exame de Ordem (OAB)',
    tag: '1ª E 2ª FASE',
    desc: 'Foco absoluto nas 20 disciplinas, simulados e aprovação rápida na carteira da OAB.',
    cover: personaOAB,
    accent: '#E01F47',
    icon: Scale,
  },
  {
    id: 'concurso' as const,
    label: 'Concurseiro(a)',
    tag: 'CARREIRAS JURÍDICAS',
    desc: 'Magistratura, MP, Delegado, Defensoria ou Tribunais: letra da lei na veia.',
    cover: personaConcurseiro,
    accent: '#10B981',
    icon: Landmark,
  },
  {
    id: 'advogado' as const,
    label: 'Advogado(a) / Prática',
    tag: 'ATUAÇÃO PROFISSIONAL',
    desc: 'Consulta ágil de artigos, jurisprudência recente, teses e peças na rotina do escritório.',
    cover: personaAdvogado,
    accent: '#6366F1',
    icon: Briefcase,
  },
];

const DORES = [
  {
    id: 'leis-desatualizadas',
    title: 'Leis desatualizadas & insegurança',
    desc: 'Receio de ler um artigo que foi revogado ou alterado recentemente.',
    icon: FileWarning,
    beneficio: 'Garantia de 100% de vigência em tempo real.',
  },
  {
    id: 'lei-dificil',
    title: 'Artigos difíceis sem explicação prática',
    desc: 'Juridiquês excessivo e doutrinas longas que travam a compreensão.',
    icon: Highlighter,
    beneficio: 'Explicações em português claro artigo por artigo com IA.',
  },
  {
    id: 'material-espalhado',
    title: 'Material disperso em várias abas',
    desc: 'Lei num site, súmula em outro, anotações perdidas no caderno.',
    icon: Search,
    beneficio: 'Tudo integrado: texto, áudio, comentários e questões.',
  },
  {
    id: 'falta-tempo',
    title: 'Falta de tempo e rotina organizada',
    desc: 'Dificuldade em manter constância e foco nos pontos que mais caem.',
    icon: Compass,
    beneficio: 'Resumos objetivos e pílulas de áudio para qualquer hora.',
  },
  {
    id: 'jurisprudencia-lenta',
    title: 'Demora para encontrar jurisprudência',
    desc: 'Dificuldade de localizar súmulas e precedentes do STF e STJ.',
    icon: Gavel,
    beneficio: 'Radar jurisprudencial inteligente na ponta dos dedos.',
  },
];

const AREAS = [
  'Direito Constitucional',
  'Direito Penal',
  'Direito Civil',
  'Processo Civil',
  'Processo Penal',
  'Direito Administrativo',
  'Direito do Trabalho',
  'Direito Tributário',
  'Direito Empresarial',
  'Consumidor',
  'Direitos Humanos',
  'Direito Ambiental',
];

const FAIXAS = ['18 a 24 anos', '25 a 30 anos', '31 a 40 anos', '41 anos ou mais'];

export default function TriagemModerna({ initialName = '', onComplete, previewMode = false }: TriagemModernaProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [persona, setPersona] = useState<'faculdade' | 'oab' | 'concurso' | 'advogado'>('oab');
  const [dores, setDores] = useState<string[]>(['leis-desatualizadas', 'lei-dificil']);
  const [areas, setAreas] = useState<string[]>(['Direito Constitucional', 'Direito Penal', 'Direito Civil']);
  const [nome, setNome] = useState(initialName);
  const [whatsapp, setWhatsapp] = useState('');
  const [faixa, setFaixa] = useState('25 a 30 anos');
  const [calculatingPhase, setCalculatingPhase] = useState(0);

  // Animação de análise neural da IA no Step 5 com fallback garantido contra timeout/congelamento
  useEffect(() => {
    if (step !== 5) return;

    let isFinished = false;
    const finishStep = () => {
      if (isFinished) return;
      isFinished = true;
      haptic.success();
      const selectedPersonaObj = PERSONAS.find(p => p.id === persona);
      onComplete({
        persona,
        personaLabel: selectedPersonaObj?.label || 'Direito',
        faixa,
        nome: nome.trim() || 'Doutor(a)',
        areas: areas.length > 0 ? areas : ['Direito Constitucional'],
        interesses: ['leis', 'leis-comentadas', 'questoes', 'resumos'],
        dores,
        whatsapp: whatsapp.trim() ? whatsapp.replace(/\D/g, '') : null,
      });
    };

    haptic.impact('medium');
    const t1 = setTimeout(() => setCalculatingPhase(1), 500);
    const t2 = setTimeout(() => setCalculatingPhase(2), 1100);
    const t3 = setTimeout(() => setCalculatingPhase(3), 1600);
    const t4 = setTimeout(() => finishStep(), 2200);

    // Fallback de segurança de 2.5s se a aba ou app for desacelerada pelo sistema
    const fallbackTimer = setTimeout(() => {
      finishStep();
    }, 2500);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        finishStep();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [step, persona, dores, areas, nome, whatsapp, faixa, onComplete]);

  const toggleDor = (id: string) => {
    haptic.selection();
    setDores(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) 
        : [...prev, id]
    );
  };

  const toggleArea = (area: string) => {
    haptic.selection();
    setAreas(prev => 
      prev.includes(area) 
        ? prev.filter(x => x !== area) 
        : [...prev, area]
    );
  };

  const nextStep = () => {
    if (step === 3 && areas.length === 0) {
      toast.error('Selecione ao menos 1 matéria prioritária para continuar.');
      return;
    }
    haptic.impact('light');
    setStep(prev => (Math.min(prev + 1, 5) as 1 | 2 | 3 | 4 | 5));
  };

  const prevStep = () => {
    haptic.impact('light');
    setStep(prev => (Math.max(prev - 1, 1) as 1 | 2 | 3 | 4 | 5));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0C10] text-white flex flex-col overflow-hidden select-none">
      {/* Fundo sutil com grid animado */}
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

      {/* Header com Progresso */}
      <header className="relative z-20 w-full max-w-xl mx-auto px-4 pt-[calc(0.75rem+var(--sai-top,0px))] pb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {step > 1 && step < 5 ? (
            <button
              type="button"
              onClick={prevStep}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-transform cursor-pointer"
              aria-label="Voltar etapa"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={horusAsset} alt="Horus" className="w-7 h-7 object-contain drop-shadow-md" />
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-display font-black tracking-widest uppercase text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>DIREITO PRIME PRO</span>
          </div>

          <div className="text-right">
            <span className="font-display font-black text-xs text-primary tracking-wider">
              {step < 5 ? `${step} / 4` : '100%'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Fluida */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 via-primary to-rose-500 rounded-full shadow-[0_0_12px_rgba(224,31,71,0.6)]"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>
      </header>

      {/* Conteúdo Principal com Rolagem Suave */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[calc(6rem+var(--sai-bottom,0px))] max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* PASSO 1: PERSONA */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-display font-black tracking-widest text-primary uppercase">
                  ETAPA 1 • SEU MOMENTO ATUAL
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight tracking-tight">
                  Qual é o seu objetivo principal?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Personalizaremos artigos, questões e recomendações de estudo sob medida para você.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                      className={`relative flex flex-col text-left p-3.5 rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-[0_0_24px_rgba(224,31,71,0.25)] ring-1 ring-primary'
                          : 'border-white/10 bg-neutral-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-display font-black tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 uppercase">
                          {p.tag}
                        </span>
                      </div>

                      <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2.5">
                        <img src={p.cover} alt={p.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <span className="font-display font-black text-xs text-white uppercase drop-shadow">
                            {p.label}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {p.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PASSO 2: DORES / DESAFIOS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-display font-black tracking-widest text-primary uppercase">
                  ETAPA 2 • SEUS DESAFIOS
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight tracking-tight">
                  O que mais atrapalha seus estudos hoje?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Selecione todas as opções que se aplicam. A IA cuidará de cada uma delas.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {DORES.map(d => {
                  const Icon = d.icon;
                  const isSelected = dores.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDor(d.id)}
                      className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 text-left cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                          : 'border-white/10 bg-neutral-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-white/10 text-white/80'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display font-bold text-sm text-white leading-snug">
                            {d.title}
                          </h3>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                          {d.desc}
                        </p>
                        {isSelected && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{d.beneficio}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PASSO 3: ÁREAS DE INTERESSE */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-display font-black tracking-widest text-primary uppercase">
                  ETAPA 3 • MATÉRIAS PRIORITÁRIAS
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight tracking-tight">
                  Quais ramos você mais precisa estudar?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Essas disciplinas ficarão em destaque no seu Vade Mecum e nas trilhas interativas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {AREAS.map(area => {
                  const isSelected = areas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-[0_0_15px_rgba(224,31,71,0.2)] text-white'
                          : 'border-white/10 bg-neutral-900/60 text-neutral-300 hover:border-white/20'
                      }`}
                    >
                      <span className="font-display font-bold text-xs truncate pr-2">
                        {area}
                      </span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                        isSelected ? 'bg-primary text-white' : 'border border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-neutral-400 pt-1">
                {areas.length} {areas.length === 1 ? 'matéria selecionada' : 'matérias selecionadas'} (você poderá alterar a qualquer momento).
              </p>
            </motion.div>
          )}

          {/* PASSO 4: IDENTIDADE & CONTATO */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1 text-center">
                <span className="text-[11px] font-display font-black tracking-widest text-primary uppercase">
                  ETAPA 4 • PERSONALIZAÇÃO
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight tracking-tight">
                  Seu espaço está quase pronto.
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Como devemos te chamar dentro do Direito Prime?
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Campo de Nome */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Seu nome ou como prefere ser chamado(a):
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Ex: Dra. Juliana ou Carlos"
                      className="w-full h-12 rounded-xl bg-neutral-900/80 border border-white/15 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                {/* Campo de WhatsApp (Opcional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-300">
                      WhatsApp para alertas de novas leis:
                    </label>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Opcional</span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(maskPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full h-12 rounded-xl bg-neutral-900/80 border border-white/15 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 pl-1">
                    <Lock className="w-3 h-3" />
                    <span>Seus dados ficam 100% seguros. Não enviamos spam.</span>
                  </p>
                </div>

                {/* Faixa Etária */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Faixa etária:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FAIXAS.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setFaixa(f);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          faixa === f
                            ? 'bg-primary text-white border border-primary/40 shadow-sm'
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 5: ANÁLISE COM IA (1.8s) */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-6"
            >
              <div className="relative w-24 h-24">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <div className="absolute inset-2 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-9 h-9 text-primary animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="font-display font-black text-2xl text-white tracking-wide uppercase">
                  Personalizando Seu Espaço...
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
                    {calculatingPhase === 1 && `Configurando Vade Mecum com foco em ${PERSONAS.find(p => p.id === persona)?.label}...`}
                    {calculatingPhase === 2 && `Sincronizando ${areas.length} áreas jurídicas e questões comentadas...`}
                    {calculatingPhase === 3 && 'Tudo pronto! Desbloqueando seu acesso PRO...'}
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

      {/* Footer Fixo com Botão de Ação */}
      {step < 5 && (
        <footer className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/95 to-transparent pb-[calc(1rem+var(--sai-bottom,0px))]">
          <div className="max-w-xl mx-auto w-full">
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 3 && areas.length === 0}
              className={`btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(224,31,71,0.35)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
            >
              <span>{step === 4 ? 'FINALIZAR E LIBERAR ACESSO' : 'CONTINUAR'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
