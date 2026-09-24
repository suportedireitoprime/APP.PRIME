import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShieldCheck, MessageCircle, PartyPopper, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import horusOwlAsset from '@/assets/horus/horus-owl.webp.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: (info?: { transferred?: boolean }) => void;
  initialPhone?: string;
};

interface CountryDDI {
  name: string;
  code: string;
  ddi: string;
  flag: string;
  placeholder: string;
}

const COUNTRIES: CountryDDI[] = [
  { name: 'Brasil', code: 'BR', ddi: '+55', flag: '🇧🇷', placeholder: '(11) 99999-9999' },
  { name: 'Portugal', code: 'PT', ddi: '+351', flag: '🇵🇹', placeholder: '912 345 678' },
  { name: 'Estados Unidos', code: 'US', ddi: '+1', flag: '🇺🇸', placeholder: '(555) 123-4567' },
  { name: 'Angola', code: 'AO', ddi: '+244', flag: '🇦🇴', placeholder: '923 000 000' },
  { name: 'Moçambique', code: 'MZ', ddi: '+258', flag: '🇲🇿', placeholder: '84 000 0000' },
  { name: 'Cabo Verde', code: 'CV', ddi: '+238', flag: '🇨🇻', placeholder: '990 0000' },
  { name: 'Espanha', code: 'ES', ddi: '+34', flag: '🇪🇸', placeholder: '600 00 00 00' },
  { name: 'Itália', code: 'IT', ddi: '+39', flag: '🇮🇹', placeholder: '300 000 0000' },
  { name: 'França', code: 'FR', ddi: '+33', flag: '🇫🇷', placeholder: '06 00 00 00 00' },
  { name: 'Reino Unido', code: 'GB', ddi: '+44', flag: '🇬🇧', placeholder: '7911 000000' },
  { name: 'Alemanha', code: 'DE', ddi: '+49', flag: '🇩🇪', placeholder: '151 0000000' },
  { name: 'Argentina', code: 'AR', ddi: '+54', flag: '🇦🇷', placeholder: '11 0000-0000' },
  { name: 'Paraguai', code: 'PY', ddi: '+595', flag: '🇵🇾', placeholder: '981 000000' },
  { name: 'Uruguai', code: 'UY', ddi: '+598', flag: '🇺🇾', placeholder: '99 000 000' },
  { name: 'Chile', code: 'CL', ddi: '+56', flag: '🇨🇱', placeholder: '9 0000 0000' },
  { name: 'Colômbia', code: 'CO', ddi: '+57', flag: '🇨🇴', placeholder: '300 000 0000' },
  { name: 'Japão', code: 'JP', ddi: '+81', flag: '🇯🇵', placeholder: '90-0000-0000' },
];

function formatPhoneByCountry(val: string, countryCode: string): string {
  const digits = val.replace(/\D/g, '');
  if (countryCode === 'BR') {
    const d = digits.slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return digits.slice(0, 14);
}

async function suggestName(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '';
  const meta = user.user_metadata || {};
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  const raw =
    profile?.display_name ||
    (meta as any).display_name ||
    (meta as any).full_name ||
    (meta as any).name ||
    (user.email ? user.email.split('@')[0] : '');
  return String(raw || '').trim();
}

export default function HorusVerifyPhoneSheet({ open, onClose, onVerified }: Props) {
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  // Inicia explicitamente sem número pré-preenchido
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryDDI>(COUNTRIES[0]);
  const [ddiOpen, setDdiOpen] = useState(false);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [nome, setNome] = useState('');
  const [transferred, setTransferred] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhone('');
      setSelectedCountry(COUNTRIES[0]);
      setDdiOpen(false);
      setDigits(['', '', '', '', '', '']);
      setResendIn(0);
      setNome('');
      setTransferred(false);
    } else {
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 180);
    }
  }, [open]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function getCleanFullNumber(): string {
    const rawDigits = phone.replace(/\D/g, '');
    const ddiDigits = selectedCountry.ddi.replace(/\D/g, '');
    if (selectedCountry.code === 'BR') {
      return ddiDigits + rawDigits;
    }
    return ddiDigits + rawDigits;
  }

  async function sendCode() {
    const raw = phone.replace(/\D/g, '');
    if (selectedCountry.code === 'BR' && raw.length < 10) {
      return toast.error('Digite seu DDD e número de telefone');
    }
    if (raw.length < 6) {
      return toast.error('Número de telefone inválido');
    }

    setSending(true);
    haptic.light();
    const fullNumber = getCleanFullNumber();
    const { data, error } = await supabase.functions.invoke('horus', {
      body: { fn: 'verify', action: 'start', phone: fullNumber },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.error || 'Não foi possível enviar o código');
    toast.success('Código enviado no seu WhatsApp!');
    setStep('code');
    setResendIn(60);
    setTimeout(() => inputsRef.current[0]?.focus(), 120);
  }

  function setDigit(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(0, 1);
    setDigits((arr) => {
      const next = [...arr];
      next[i] = d;
      return next;
    });
    if (d && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const arr = t.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(arr);
    inputsRef.current[Math.min(t.length, 5)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  }

  async function confirmCode() {
    const code = digits.join('');
    if (code.length !== 6) return toast.error('Digite os 6 dígitos do código');
    setSending(true);
    haptic.light();
    const fullNumber = getCleanFullNumber();
    const { data, error } = await supabase.functions.invoke('horus', {
      body: { fn: 'verify', action: 'confirm', phone: fullNumber, code },
    });
    setSending(false);
    if (error || data?.error) return toast.error(data?.error || 'Código incorreto');
    haptic.medium();
    const wasTransferred = Boolean((data as any)?.transferred);
    setTransferred(wasTransferred);
    const suggested = await suggestName();
    setNome(suggested);
    setStep('success');
    onVerified({ transferred: wasTransferred });
  }

  async function saveNameAndFinish() {
    const finalName = nome.trim();
    if (!finalName) return toast.error('Diga como o Horus deve te chamar');
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const fullNumber = getCleanFullNumber();
    if (user) {
      await supabase
        .from('horus_whatsapp_users')
        .update({ nome_preferido: finalName })
        .eq('user_id', user.id);
      await supabase
        .from('horus_user_stats')
        .update({ nome_preferido: finalName })
        .eq('telefone', fullNumber);
    }
    setSending(false);
    haptic.medium();
    toast.success(`Prazer, ${finalName.split(' ')[0]}! 👋`);
    onVerified({ transferred });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto px-4 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-10 bg-black/75 backdrop-blur-md">
          {/* Backdrop click */}
          <div
            onClick={onClose}
            className="fixed inset-0 -z-10"
            aria-hidden
          />

          {/* Modal posicionado no topo da tela para o teclado virtual não cobrir */}
          <motion.div
            initial={{ y: -36, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -36, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-md bg-[#13151b] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-foreground"
          >
            {/* Header com botão fechar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  {step === 'success' ? (
                    <PartyPopper className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  {step === 'phone'
                    ? 'Verificar seu WhatsApp'
                    : step === 'code'
                    ? 'Confirmar código'
                    : 'WhatsApp Verificado!'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ETAPA 1: DIGITAR NÚMERO (NO TOPO) */}
            {step === 'phone' && (
              <div className="space-y-4">
                <div>
                  <p className="font-body text-sm text-white/80 leading-snug">
                    Digite seu número com DDD. Você receberá um código de 6 dígitos no WhatsApp para ativar suas respostas instantâneas.
                  </p>
                </div>

                {/* Bloco de Input com Seletor DDI */}
                <div className="space-y-1.5">
                  <span className="font-body text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Número do WhatsApp
                  </span>
                  
                  <div className="flex items-center gap-2 relative">
                    {/* Seletor DDI com bandeira */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDdiOpen(!ddiOpen)}
                        className="h-[52px] px-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-1.5 transition-all text-sm font-semibold active:scale-95"
                      >
                        <span className="text-xl leading-none">{selectedCountry.flag}</span>
                        <span className="font-mono text-white/90">{selectedCountry.ddi}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${ddiOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown de países */}
                      <AnimatePresence>
                        {ddiOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setDdiOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              className="absolute left-0 top-full mt-2 w-64 max-h-64 overflow-y-auto bg-[#1a1d24] border border-white/15 rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5"
                            >
                              <div className="px-3 py-1.5 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                                Selecionar País / DDI
                              </div>
                              {COUNTRIES.map((c) => {
                                const isSel = c.code === selectedCountry.code;
                                return (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setDdiOpen(false);
                                      setPhone('');
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                                      isSel ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/80 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{c.flag}</span>
                                      <span className="truncate max-w-[120px]">{c.name}</span>
                                    </div>
                                    <span className="font-mono text-white/60 font-semibold">{c.ddi}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Input de Telefone - Limpo / Vazio por padrão */}
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="tel"
                      placeholder={selectedCountry.placeholder}
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneByCountry(e.target.value, selectedCountry.code))}
                      className="flex-1 h-[52px] px-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 focus:bg-white/10 outline-none font-mono text-base text-white placeholder:text-white/30 transition-all"
                    />
                  </div>
                </div>

                {/* Botão Enviar Código (Logo abaixo do campo para ficar 100% no topo) */}
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || phone.replace(/\D/g, '').length < (selectedCountry.code === 'BR' ? 10 : 6)}
                  className="w-full h-[52px] rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 disabled:opacity-50 text-white shadow-lg active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: '0 8px 24px -6px rgba(37, 211, 102, 0.55)',
                  }}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  Enviar código no WhatsApp
                </button>

                {/* Mascote Horus ABAIXO da área de digitação */}
                <div className="mt-2 pt-3 border-t border-white/5 flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl">
                  <img
                    src={horusOwl}
                    alt="Horus"
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain shrink-0 drop-shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs font-bold text-white uppercase tracking-wider">
                      Horus Inteligência Jurídica
                    </p>
                    <p className="font-body text-[12px] text-white/70 leading-snug mt-0.5">
                      Número seguro e criptografado. Suas dúvidas de Direito respondidas em segundos pelo WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: CONFIRMAR CÓDIGO (NO TOPO) */}
            {step === 'code' && (
              <div className="space-y-4">
                <div>
                  <p className="font-body text-sm text-white/80 leading-snug">
                    Código de 6 dígitos enviado para{' '}
                    <b className="text-emerald-400 font-mono">
                      {selectedCountry.ddi} {phone}
                    </b>
                    . Digite ou cole abaixo:
                  </p>
                </div>

                {/* 6 inputs de código no topo */}
                <div className="flex gap-1.5 sm:gap-2 justify-between" onPaste={onPaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      inputMode="numeric"
                      maxLength={1}
                      className="flex-1 min-w-0 aspect-[3/4] max-h-14 text-center rounded-xl bg-white/5 border-2 border-white/10 focus:border-emerald-500 focus:bg-white/10 outline-none font-display text-2xl font-bold text-white transition-all"
                    />
                  ))}
                </div>

                {/* Botão Confirmar Código */}
                <button
                  type="button"
                  onClick={confirmCode}
                  disabled={sending || digits.join('').length !== 6}
                  className="w-full h-13 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 disabled:opacity-50 text-white shadow-lg active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: '0 8px 24px -6px rgba(37, 211, 102, 0.55)',
                  }}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Confirmar código
                </button>

                {/* Opções de troca ou reenvio */}
                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setDigits(['', '', '', '', '', '']);
                    }}
                    className="text-white/60 hover:text-white underline underline-offset-2 py-1 transition-colors"
                  >
                    Trocar número
                  </button>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={resendIn > 0 || sending}
                    className="text-emerald-400 disabled:text-white/40 font-semibold py-1 transition-colors"
                  >
                    {resendIn > 0 ? `Reenviar em ${resendIn}s` : 'Reenviar código'}
                  </button>
                </div>

                {/* Mascote Horus ABAIXO da área de confirmação */}
                <div className="mt-2 pt-3 border-t border-white/5 flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl">
                  <img
                    src={horusOwl}
                    alt="Horus"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain shrink-0 drop-shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs font-bold text-white uppercase tracking-wider">
                      Quase pronto!
                    </p>
                    <p className="font-body text-[11px] text-white/70 leading-snug mt-0.5">
                      Confira a notificação recebida no WhatsApp do número {selectedCountry.ddi} {phone}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: SUCESSO */}
            {step === 'success' && (
              <div className="space-y-4 py-2">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/25 flex items-center justify-center">
                    <PartyPopper className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-white">🎉 Parabéns!</p>
                    <p className="font-body text-sm text-white/80 mt-1">
                      Seu WhatsApp <b className="text-white">{selectedCountry.ddi} {phone}</b> foi verificado com sucesso.
                    </p>
                    {transferred && (
                      <p className="font-body text-xs text-amber-400 mt-2">
                        O vínculo com a conta anterior foi encerrado automaticamente.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-body text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Como o Horus deve te chamar?
                  </span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none font-body text-base text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveNameAndFinish}
                  disabled={sending}
                  className="w-full h-13 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 disabled:opacity-50 text-white shadow-lg active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: '0 8px 24px -6px rgba(37, 211, 102, 0.55)',
                  }}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Começar a Estudar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
