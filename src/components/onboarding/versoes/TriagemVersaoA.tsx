import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Volume2, VolumeX, X } from 'lucide-react';
import {
  AREAS,
  INTERESSES,
  PERSONAS,
  emptyResult,
  type PersonaId,
  type TriagemResult,
} from './triagemShared';
import { useTriagemAudio } from './useTriagemAudio';

type Props = {
  open: boolean;
  onFinished: (r: TriagemResult) => void;
  previewMode?: boolean;
};

type Step = 'persona' | 'foco' | 'solucao' | 'areas' | 'interesses' | 'nome' | 'whatsapp';
const ORDER: Step[] = ['persona', 'foco', 'solucao', 'areas', 'interesses', 'nome', 'whatsapp'];

const STEP_META: Record<Step, { eyebrow: string; title: string; sub: string; bg: string }> = {
  persona: {
    eyebrow: '01 · SEU MOMENTO',
    title: 'Onde você está\nna jornada?',
    sub: 'Isso muda tudo que aparece pra você depois.',
    bg: 'radial-gradient(circle at 20% 20%, rgba(239,68,68,0.28), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #1a1408 100%)',
  },
  foco: {
    eyebrow: '02 · O PROBLEMA',
    title: 'Você sente que perde\no foco estudando?',
    sub: 'Muitas abas abertas, PDFs pesados e leis desatualizadas...',
    bg: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.25), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #170f1a 100%)',
  },
  solucao: {
    eyebrow: '03 · A SOLUÇÃO',
    title: 'A culpa não é sua.\nFalta a ferramenta certa.',
    sub: 'O Direito Prime centraliza a lei atualizada, doutrina e questões num só lugar. É o essencial para sua aprovação.',
    bg: 'radial-gradient(circle at 50% 80%, rgba(45,212,168,0.35), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #071612 100%)',
  },
  areas: {
    eyebrow: '04 · ÁREAS DO DIREITO',
    title: 'O que te move\nno estudo?',
    sub: 'Escolha 2 ou mais. Vamos priorizar seu conteúdo.',
    bg: 'radial-gradient(circle at 80% 20%, rgba(232,93,58,0.32), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #1c0f0a 100%)',
  },
  interesses: {
    eyebrow: '05 · SEU FOCO',
    title: 'O que você\nmais procura?',
    sub: 'Vamos deixar isso na porta de entrada.',
    bg: 'radial-gradient(circle at 20% 80%, rgba(45,212,168,0.28), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #071612 100%)',
  },
  nome: {
    eyebrow: '06 · QUASE LÁ',
    title: 'Como posso\nte chamar?',
    sub: 'Vou usar seu nome nas mensagens.',
    bg: 'radial-gradient(circle at 80% 80%, rgba(59,130,246,0.28), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #06101f 100%)',
  },
  whatsapp: {
    eyebrow: '07 · OPCIONAL',
    title: 'Qual seu\nWhatsApp?',
    sub: 'Vamos enviar o acesso e informações importantes por lá.',
    bg: 'radial-gradient(circle at 50% 30%, rgba(239,68,68,0.32), transparent 55%), linear-gradient(135deg, #0A0A0A 0%, #1a1408 100%)',
  },
};

export default function TriagemVersaoA({ open, onFinished, previewMode }: Props) {
  const [step, setStep] = useState<Step>('persona');
  const [data, setData] = useState<TriagemResult>(emptyResult());
  const { muted, toggleMute, playSfx } = useTriagemAudio(open);

  useEffect(() => {
    if (open) {
      setStep('persona');
      setData(emptyResult());
    }
  }, [open]);

  const meta = STEP_META[step];
  const stepIndex = ORDER.indexOf(step);
  const progress = ((stepIndex + 1) / ORDER.length) * 100;

  const advance = (patch: Partial<TriagemResult>) => {
    playSfx('whoosh');
    const next = { ...data, ...patch };
    setData(next);
    const nextStep = ORDER[stepIndex + 1];
    if (nextStep) setStep(nextStep);
    else finalize(next);
  };

  const finalize = (final: TriagemResult) => {
    playSfx('ding');
    setTimeout(() => onFinished(final), 400);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col text-white overflow-hidden"
      style={{ background: meta.bg, transition: 'background 900ms ease' }}
    >
      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-5 pt-4"
        style={{ paddingTop: 'calc(var(--sai-top, env(safe-area-inset-top,0px)) + 12px)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95"
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 mx-3 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-[#F5C518]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
        <button
          onClick={() => onFinished(data)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95"
          aria-label="Pular"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Header info — always TOP */}
      <div className="relative z-10 px-6 pt-8 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-[#F5C518] font-bold mb-3">
              <span className="w-6 h-[2px] bg-[#F5C518]" />
              {meta.eyebrow}
            </div>
            <h1 className="text-4xl leading-[1.05] font-black whitespace-pre-line">
              {meta.title}
            </h1>
            <p className="text-white/70 text-sm mt-3 max-w-xs">{meta.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        <AnimatePresence mode="wait">
          {step === 'persona' && (
            <motion.div
              key="persona"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="grid grid-cols-2 gap-3 max-w-md mx-auto"
            >
              {PERSONAS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playSfx('tap');
                      advance({ persona: p.id as PersonaId, personaLabel: p.label });
                    }}
                    className="relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/10 transition-all hover:border-white/30 hover:shadow-lg hover:shadow-black/50"
                  >
                    <motion.img 
                      src={p.cover} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover" 
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                      <Icon className="w-5 h-5 mb-1 drop-shadow-md" style={{ color: p.accent }} />
                      <div className="text-white font-bold text-sm leading-tight drop-shadow-md">{p.label}</div>
                      <div className="text-white/70 text-[11px] mt-0.5 leading-tight drop-shadow-md">{p.desc}</div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {step === 'foco' && (
            <FocoStep
              key="foco"
              onSelect={() => {
                playSfx('tap');
                advance({});
              }}
            />
          )}

          {step === 'solucao' && (
            <SolucaoStep
              key="solucao"
              onContinue={() => {
                playSfx('ding');
                advance({});
              }}
            />
          )}

          {step === 'areas' && (
            <MultiChipsStep
              key="areas"
              options={AREAS.map((a) => ({ id: a, label: a }))}
              selected={data.areas}
              min={2}
              onSelect={(a) => {
                playSfx('tap');
                setData((d) => ({
                  ...d,
                  areas: d.areas.includes(a)
                    ? d.areas.filter((x) => x !== a)
                    : [...d.areas, a],
                }));
              }}
              onContinue={() => advance({})}
            />
          )}

          {step === 'interesses' && (
            <MultiInteressesStep
              key="int"
              selected={data.interesses}
              onSelect={(id) => {
                playSfx('tap');
                setData((d) => ({
                  ...d,
                  interesses: d.interesses.includes(id)
                    ? d.interesses.filter((x) => x !== id)
                    : [...d.interesses, id],
                }));
              }}
              onContinue={() => advance({})}
            />
          )}

          {step === 'nome' && (
            <NomeStep
              key="nome"
              value={data.nome}
              onChange={(v) => setData((d) => ({ ...d, nome: v }))}
              onContinue={() => data.nome.trim() && advance({})}
            />
          )}

          {step === 'whatsapp' && (
            <WhatsappStep
              key="wa"
              value={data.whatsapp || ''}
              onChange={(v) => setData((d) => ({ ...d, whatsapp: v }))}
              onContinue={(wa) => advance({ whatsapp: wa || null })}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MultiChipsStep({
  options,
  selected,
  min,
  onSelect,
  onContinue,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  min: number;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto"
    >
      <motion.div 
        className="flex flex-wrap gap-2 justify-center"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <motion.button
              key={o.id}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(o.id)}
              className={`px-4 h-11 rounded-full border-2 text-sm font-semibold transition-colors ${
                on
                  ? 'bg-[#F5C518] border-[#F5C518] text-black shadow-lg shadow-[#F5C518]/20'
                  : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
              }`}
            >
              {o.label}
            </motion.button>
          );
        })}
      </motion.div>
      <motion.div 
        className="mt-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          disabled={selected.length < min}
          onClick={onContinue}
          whileTap={{ scale: 0.95 }}
          className="h-14 px-8 rounded-full bg-[#F5C518] text-black font-bold flex items-center gap-2 disabled:opacity-30 disabled:scale-100 transition-opacity"
        >
          Continuar <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <p className="text-white/70 text-xs">Selecione ao menos {min}</p>
      </motion.div>
    </motion.div>
  );
}

function MultiInteressesStep({
  selected,
  onSelect,
  onContinue,
}: {
  selected: string[];
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto space-y-3"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-3"
      >
        {INTERESSES.map((it) => {
          const Icon = it.icon;
          const on = selected.includes(it.id);
          return (
            <motion.button
              key={it.id}
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(it.id)}
              className={`w-full text-left rounded-2xl border-2 p-4 flex items-center gap-4 transition-colors ${
                on
                  ? 'bg-[#2DD4A8]/20 border-[#2DD4A8] shadow-lg shadow-[#2DD4A8]/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  on ? 'bg-[#2DD4A8]/30' : 'bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{it.label}</div>
                <div className="text-white/60 text-xs">{it.desc}</div>
              </div>
              <AnimatePresence>
                {on && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-5 h-5 text-[#2DD4A8]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        disabled={selected.length === 0}
        className="mt-6 w-full h-14 rounded-full bg-[#F5C518] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:scale-100 transition-opacity"
      >
        Continuar <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}

function NomeStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const preview = useMemo(() => (value.trim() ? value.trim().split(' ')[0] : ''), [value]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: 0.2 }}
      className="max-w-sm mx-auto"
    >
      <div className="rounded-3xl bg-white/5 border border-white/10 p-5 mb-5 min-h-[80px] flex items-center">
        <div className="text-2xl font-black leading-tight">
          Bora estudar
          {preview ? (
            <>
              ,{' '}
              <span className="text-[#F5C518]">{preview}</span>!
            </>
          ) : (
            <span className="text-white/60">...</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 40))}
          onKeyDown={(e) => e.key === 'Enter' && onContinue()}
          placeholder="Seu nome"
          className="flex-1 h-14 px-5 rounded-2xl bg-white/10 border border-white/20 text-white text-lg outline-none focus:border-[#F5C518]"
        />
        <button
          onClick={onContinue}
          disabled={!value.trim()}
          className="h-14 w-14 rounded-2xl bg-[#F5C518] text-black flex items-center justify-center active:scale-95 disabled:opacity-30"
        >
          <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}

function WhatsappStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="max-w-sm mx-auto space-y-4"
    >
      <motion.input
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d+\s()-]/g, '').slice(0, 20))}
        placeholder="(11) 98765-4321"
        className="w-full h-14 px-5 rounded-2xl bg-white/10 border border-white/20 text-white text-lg outline-none focus:border-[#F5C518] focus:bg-white/15 transition-all shadow-inner"
      />
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onContinue(value.trim())}
        disabled={!value.trim() || value.replace(/\D/g, '').length < 10}
        className="w-full h-14 rounded-full bg-[#F5C518] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:scale-100 transition-opacity"
      >
        Finalizar <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onContinue('')}
        className="w-full h-12 rounded-full bg-transparent border border-white/20 text-white/70 font-semibold hover:bg-white/5 transition-colors"
      >
        Pular (Não quero receber novidades)
      </motion.button>
    </motion.div>
  );
}

function FocoStep({ onSelect }: { onSelect: () => void }) {
  const options = [
    { id: 'sim', label: 'Sim, perco o foco fácil' },
    { id: 'asvezes', label: 'Às vezes me perco' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="max-w-sm mx-auto space-y-4"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="space-y-3"
      >
        {options.map((o) => (
          <motion.button
            key={o.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSelect}
            className="w-full h-16 rounded-2xl border-2 border-white/10 bg-white/5 text-white font-bold text-[15px] flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
          >
            {o.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

function SolucaoStep({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="max-w-sm mx-auto flex flex-col items-center pt-4"
    >
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-20 h-20 bg-[#2DD4A8]/20 rounded-full flex items-center justify-center mb-8 border border-[#2DD4A8]/40 shadow-[0_0_40px_rgba(45,212,168,0.2)]"
      >
        <Check className="w-10 h-10 text-[#2DD4A8]" />
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full h-14 rounded-full bg-[#2DD4A8] text-black font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2DD4A8]/20"
      >
        Entendi, quero conhecer <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
