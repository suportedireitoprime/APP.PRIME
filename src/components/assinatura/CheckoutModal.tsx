import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, ShieldCheck, User, MapPin, Smartphone, ArrowRight, CheckCircle2, Copy, X, ChevronLeft, Clock, ChevronDown, QrCode, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { isFuture, addMonths } from 'date-fns';
import { openExternal } from '@/lib/nativeBrowser';
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from '@/lib/nativeHaptics';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: 'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | 'anual_regular_pix' | null;
  userEmail: string;
  userName: string;
  onSuccess: () => void;
}

// Funções de máscara simples
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCard = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const maskExpiry = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
const maskCVC = (v: string) => v.replace(/\D/g, '').slice(0, 4);

const isValidCPF = (cpf: string) => {
  const strCPF = cpf.replace(/\D/g, '');
  if (strCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(strCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(10, 11))) return false;
  
  return true;
};

const CreditCardPreview = ({ name, number, expiry, cvc, isFlipped }: { name: string, number: string, expiry: string, cvc: string, isFlipped: boolean }) => {
  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-[1.586/1] mb-8 mt-2" style={{ perspective: "1000px" }}>
      <motion.div
        className="w-full h-full relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl overflow-hidden p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden" }}
        >
           {/* Chips and Logos */}
           <div className="flex justify-between items-start">
              <div className="w-12 h-8 bg-gradient-to-r from-amber-200 to-amber-500 rounded-md opacity-80 flex items-center justify-center">
                 <div className="w-8 h-5 border border-amber-800/30 rounded-sm"></div>
              </div>
              <div className="text-white/30 font-black italic">PRIME</div>
           </div>
           
           <div>
             <div className="text-white/80 font-mono text-xl tracking-widest mb-2 shadow-sm">
               {number || '•••• •••• •••• ••••'}
             </div>
             <div className="flex justify-between items-end">
               <div className="flex flex-col">
                 <span className="text-[9px] text-white/50 uppercase tracking-wider">Titular</span>
                 <span className="text-white font-medium uppercase text-sm tracking-widest truncate max-w-[150px]">
                   {name || 'NOME IMPRESSO'}
                 </span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[9px] text-white/50 uppercase tracking-wider">Validade</span>
                 <span className="text-white font-mono text-sm tracking-widest">
                   {expiry || '••/••'}
                 </span>
               </div>
             </div>
           </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-center" 
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
           <div className="w-full h-12 bg-black/80 absolute top-6"></div>
           <div className="px-4 w-full flex justify-end absolute top-24">
              <div className="bg-white text-black px-3 py-1 rounded text-sm font-mono font-bold w-16 text-center">
                {cvc || '•••'}
              </div>
           </div>
           <div className="absolute bottom-4 left-4 right-4 text-[8px] text-white/20 text-center uppercase">
             Este Cartão é seguro e processado com criptografia.
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onOpenChange, plan, userEmail, userName, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [activePlan, setActivePlan] = useState<'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | 'anual_regular_pix'>('anual');

  useEffect(() => {
    if (plan) {
      setActivePlan(plan);
    }
  }, [plan]);

  const isPix = activePlan === 'vitalicio_pix' || activePlan === 'anual_pix' || activePlan === 'anual_regular_pix';

  // Garantir limite de parcelas ao alternar entre Anual (máx 6x) e Vitalício (máx 10x)
  useEffect(() => {
    if (activePlan === 'anual' && installmentCount > 6) {
      setInstallmentCount(6);
    } else if (activePlan === 'vitalicio' && installmentCount > 10) {
      setInstallmentCount(10);
    }
  }, [activePlan, installmentCount]);
  const [addressInfo, setAddressInfo] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [formData, setFormData] = useState({
    name: userName || '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    addressNumber: '',
    neighborhood: '',
    city: '',
    uf: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: ''
  });

  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(600);
  const [pixExpiryTime, setPixExpiryTime] = useState<number | null>(null);
  const [verifyCooldown, setVerifyCooldown] = useState<number>(0);
  const triggerSuccessAnimation = () => {
    setStep(4);
    haptic.success();
    
    // Animação de confete rica
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#ffffff', '#047857']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#ffffff', '#047857']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
    }, 2800);
  };

  const isProcessingRef = useRef(false);
  const hasWarnedExpiryRef = useRef(false);



  useEffect(() => {
    if (plan) {
      setActivePlan(plan);
    }
  }, [plan]);



  useEffect(() => {
    if (open) {
      setStep(1);
      setPixData(null);
      setPixTimeLeft(600);
      setPixExpiryTime(null);
      setInstallmentCount(1);
      setAddressInfo('');
      setVerifyingPayment(false);
      setVerifyCooldown(0);
      hasWarnedExpiryRef.current = false;
      isProcessingRef.current = false;
      if (plan) setActivePlan(plan);
      setFormData(prev => ({ ...prev, name: userName || '', cardName: userName || '' }));
    }
  }, [open, userName, plan]);

  // ViaCEP integration
  useEffect(() => {
    if (formData.cep.length === 9) {
      const fetchCep = async () => {
        try {
          const cleanCep = formData.cep.replace(/\D/g, '');
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setAddressInfo(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
            setFormData(prev => ({
              ...prev,
              address: data.logradouro || '',
              neighborhood: data.bairro || '',
              city: data.localidade || '',
              uf: data.uf || ''
            }));
          } else {
            setAddressInfo('CEP não encontrado');
          }
        } catch (e) {
          setAddressInfo('');
        }
      };
      fetchCep();
    } else {
      setAddressInfo('');
    }
  }, [formData.cep]);

  // Item 40: PIX Realtime + Polling com Backoff Progressivo (5s, 8s, 11s, 14s, 15s)
  useEffect(() => {
    if (step !== 3 || !pixData) return;

    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let delay = 5000;

    const handleSuccess = () => {
    if (!isMounted) return;
    toast.success("Pagamento confirmado via PIX!");
    triggerSuccessAnimation();
  };

    // 1. Escuta Realtime na tabela asaas_subscriptions e profiles
    let channelAsaas: any = null;
    let channelProfile: any = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted || !session?.user?.id) return;
      const uid = session.user.id;

      channelAsaas = supabase
        .channel(`pix-pay-${uid}-${Date.now()}`)
        .on('postgres_changes' as any, {
          event: '*',
          schema: 'public',
          table: 'asaas_subscriptions',
          filter: `user_id=eq.${uid}`,
        }, (payload: any) => {
          if (payload?.new?.status === 'ACTIVE' || payload?.new?.status === 'ACTIVE_GRACE') {
            handleSuccess();
          }
        })
        .subscribe();

      channelProfile = supabase
        .channel(`pix-profile-${uid}-${Date.now()}`)
        .on('postgres_changes' as any, {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
        }, (payload: any) => {
          if (payload?.new?.is_premium === true) {
            handleSuccess();
          }
        })
        .subscribe();
    });

    // 2. Polling de contingência com backoff progressivo
    const pollCheck = async () => {
      if (!isMounted) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase.from('asaas_subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const { data: profile } = await supabase.from('profiles')
            .select('is_premium')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data?.status === 'ACTIVE' || data?.status === 'ACTIVE_GRACE' || profile?.is_premium) {
            handleSuccess();
            return;
          }
        }
      } catch {}

      if (isMounted) {
        delay = Math.min(delay + 3000, 15000);
        pollTimer = setTimeout(pollCheck, delay);
      }
    };

    pollTimer = setTimeout(pollCheck, delay);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [step, pixData, onSuccess, onOpenChange]);

  // PIX Expiration Timer — stable interval, uses absolute time to survive background states
  useEffect(() => {
    if (step !== 3 || !pixData || !pixExpiryTime) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((pixExpiryTime - Date.now()) / 1000));
      setPixTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [step, pixData, pixExpiryTime]);

  // Item 47: PIX expirado — mantém no step 3 com badge expirado e botão de regenerar
  useEffect(() => {
    if (step === 3 && pixTimeLeft === 0 && !hasWarnedExpiryRef.current) {
      hasWarnedExpiryRef.current = true;
      toast.error('O código PIX expirou. Gere um novo abaixo.');
    }
  }, [pixTimeLeft, step]);

  // Item 48: Cooldown countdown de 5s para anti-spam no botão de verificação
  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const t = setInterval(() => {
      setVerifyCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [verifyCooldown]);

  const pixExpired = step === 3 && pixTimeLeft === 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (field: keyof typeof formData, maskFn?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (maskFn) val = maskFn(val);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNextStep = () => {
    if (!formData.cpf || !isValidCPF(formData.cpf)) {
      toast.error('Preencha um CPF válido.');
      return;
    }
    if (!formData.phone || formData.phone.length < 14) {
      toast.error('Preencha um telefone válido.');
      return;
    }
    
    if (!isPix) {
      if (!formData.cep || formData.cep.length < 9) {
        toast.error('Preencha um CEP válido.');
        return;
      }
      if (!formData.addressNumber) {
        toast.error('Preencha o número do endereço.');
        return;
      }
      setStep(2);
    } else {
      processCheckout();
    }
  };

  const processCheckout = async () => {
    if (!isPix) {
      if (formData.cardNumber.length < 18) {
        toast.error('Número de Cartão inválido.');
        return;
      }
      if (formData.cardExpiry.length < 5) {
        toast.error('Validade inválida.');
        return;
      }
      if (formData.cardCvc.length < 3) {
        toast.error('CVV inválido.');
        return;
      }
      if (!formData.cardName) {
        toast.error('Nome impresso no Cartão é obrigatório.');
        return;
      }
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    try {
      const payload: any = {
        plan: activePlan,
        email: userEmail,
        name: formData.name,
        cpfCnpj: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        installmentCount: (activePlan === 'vitalicio') ? installmentCount : 1
      };

      if (!isPix) {
        const [expMonth, expYear] = formData.cardExpiry.split('/');
        
        // Remove accents for Asaas
        const normalizedHolderName = formData.cardName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        payload.creditCard = {
          holderName: normalizedHolderName,
          number: formData.cardNumber.replace(/\D/g, ''),
          expiryMonth: expMonth,
          expiryYear: `20${expYear}`,
          ccv: formData.cardCvc
        };
        payload.creditCardHolderInfo = {
          name: normalizedHolderName || userName,
          email: userEmail,
          cpfCnpj: formData.cpf.replace(/\D/g, ''),
          postalCode: formData.cep.replace(/\D/g, ''),
          addressNumber: formData.addressNumber || 'SN',
          phone: formData.phone.replace(/\D/g, '')
        };
      }

      const { data, error } = await supabase.functions.invoke('asaas-checkout', { body: payload });

      if (error) {
        let errorMessage = error.message;
        try {
          if ((error as any).context && typeof (error as any).context.json === 'function') {
            const errBody = await (error as any).context.json();
            if (errBody.error) errorMessage = errBody.error;
          }
        } catch (e) {}
        throw new Error(errorMessage || 'Erro ao processar pagamento');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (isPix && data?.pixQrCode) {
        setPixData({ qrCode: data.pixQrCode, payload: data.pixCopyPaste });
        setPixExpiryTime(Date.now() + 600 * 1000);
        setStep(3);
      } else if (!isPix) {
        const status = data?.status;
        if (['CONFIRMED', 'RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(status)) {
          toast.success('Assinatura ativada com sucesso!');
          triggerSuccessAnimation();
        } else if (status === 'REJECTED') {
          throw new Error('Pagamento recusado. Verifique os dados e tente novamente.');
        } else if (status === 'PENDING' || status === 'ACTIVE') {
          toast.info('Pagamento em processamento. O acesso será liberado em instantes!');
          triggerSuccessAnimation();
        } else {
          if (data?.invoiceUrl) {
             openExternal(data.invoiceUrl);
             onSuccess();
             onOpenChange(false);
          } else {
             throw new Error('Pagamento não foi autorizado. Tente outro Cartão.');
          }
        }
      } else if (data?.invoiceUrl) {
        openExternal(data.invoiceUrl);
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Erro ao gerar cobrança. Tente novamente.');
      }

    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao processar.');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  const copyPix = async () => {
    if (!pixData?.payload) return;
    try {
      // Try Capacitor clipboard first for native apps
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: pixData.payload });
      } else {
        await navigator.clipboard.writeText(pixData.payload);
      }
      toast.success('Código PIX copiado!');
    } catch {
      // Fallback: textarea trick
      try {
        const ta = document.createElement('textarea');
        ta.value = pixData.payload;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.success('Código PIX copiado!');
      } catch {
        toast.error('Não foi possível copiar. Toque e segure o código.');
      }
    }
  };

  const handleVerifyPayment = async () => {
    if (verifyCooldown > 0) return;
    setVerifyingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('asaas_subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        const { data: profile } = await supabase.from('profiles')
          .select('is_premium')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.status === 'ACTIVE' || data?.status === 'ACTIVE_GRACE' || profile?.is_premium) {
          toast.success('Pagamento confirmado!');
          triggerSuccessAnimation();
          return;
        }
      }
      toast('Pagamento ainda não confirmado. Aguarde alguns segundos e tente novamente.', { icon: 'â³' });
      setVerifyCooldown(5);
    } catch {
      toast.error('Erro ao verificar pagamento.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleRegeneratePixQr = () => {
    hasWarnedExpiryRef.current = false;
    setPixData(null);
    setPixTimeLeft(600);
    setPixExpiryTime(null);
    processCheckout();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    // Pequeno atraso para dar tempo de o teclado nativo subir antes de rolar
    setTimeout(() => {
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {}
    }, 400);
  };

  const getPlanInfo = () => {
    if (activePlan === 'mensal') return { title: 'Mensal', price: 'R$ 29,90', sub: '/ mês' };
    if (activePlan === 'anual') return { title: 'Anual', price: 'R$ 149,90', sub: '' };
    if (activePlan === 'anual_pix') return { title: 'Anual', price: 'R$ 149,90', sub: '' };
    if (activePlan === 'anual_regular_pix') return { title: 'Anual', price: 'R$ 149,90', sub: '' };
    if (activePlan === 'vitalicio') return { title: 'Vitalício', price: 'R$ 249,90', sub: '' };
    if (activePlan === 'vitalicio_pix') return { title: 'Vitalício', price: 'R$ 249,90', sub: '' };
    return { title: '', price: '', sub: '' };
  };

  const planInfo = getPlanInfo();

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent 
        className="max-w-none sm:max-w-lg w-full min-h-[100vh] sm:min-h-0 sm:max-h-[92vh] h-[100dvh] sm:h-auto m-0 p-0 rounded-none sm:rounded-3xl border-none sm:border sm:border-white/10 flex flex-col bg-gradient-to-b from-zinc-800 to-[#0D0D0D] overflow-hidden shadow-2xl [&>button]:hidden"
      >
        <DialogDescription className="sr-only">Checkout e pagamento do Direito Prime.</DialogDescription>

        
        
        {/* Top Header with Custom Close/Back Button */}
        <div className="relative z-10 flex items-center justify-between px-4 pb-4 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] bg-background/60 backdrop-blur-xl border-b border-white/5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step === 1 ? onOpenChange(false) : setStep(1)}
            disabled={loading}
            className="rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
             {step === 1 ? <X className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </Button>
          <DialogTitle className="text-xl font-display font-black flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Checkout
          </DialogTitle>
          <div className="w-10"></div> {/* Spacer to center the title */}
        </div>
        
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-md mx-auto w-full p-6 flex flex-col pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            
            {/* Plan Info Card - Hidden on Step 2 as requested */}
            {step !== 2 && (
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 mb-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  VOCÊ ESTÁ ASSINANDO:
                </p>
                <h3 className="font-display text-lg font-black text-foreground/90 mb-1">
                  Estudos Jurídicos {planInfo.title}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-foreground">{planInfo.price}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{planInfo.sub}</span>
                </div>
                
                
              </div>
            )}

            {/* Alternador de Método de Pagamento (Cartão vs PIX) para Planos Vitalício / Anual */}
            {step === 1 && (plan === 'vitalicio' || plan === 'vitalicio_pix' || plan === 'anual' || plan === 'anual_pix' || plan === 'anual_regular_pix') && (
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/50 rounded-2xl border border-white/10 mb-5">
                                  <button
                    type="button"
                    onClick={() => setActivePlan(plan?.includes('vitalicio') ? 'vitalicio_pix' : (plan === 'anual_pix' ? 'anual_pix' : 'anual_regular_pix'))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      (activePlan === 'vitalicio_pix' || activePlan === 'anual_pix' || activePlan === 'anual_regular_pix')
                        ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/30'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg"><path d="M11.954 1.34l-5.617 5.617a2.53 2.53 0 0 0 0 3.578L10.3 14.5a2.53 2.53 0 0 0 3.578 0l3.963-3.965a2.53 2.53 0 0 0 0-3.578L12.224 1.34a.19.19 0 0 0-.27 0zm8.012 8.653l3.056 3.056c.394.394.614.928.614 1.485s-.22 1.092-.614 1.485l-9.155 9.155c-.195.195-.45.293-.705.293s-.51-.098-.705-.293l-3.32-3.32 1.38-1.38 2.645 2.645 8.16-8.16-2.062-2.062a.19.19 0 0 0-.27 0l-3.518 3.518a4.42 4.42 0 0 1-6.251 0L5.3 12.443a.19.19 0 0 0-.27 0L2.969 14.51c-.195.195-.293.45-.293.705s.098.51.293.705l3.52 3.52-1.38 1.38-4.516-4.516c-.394-.394-.614-.928-.614-1.485s.22-1.092.614-1.485l9.156-9.155c.39-.39 1.02-.39 1.41 0l3.057 3.057a.19.19 0 0 0 .27 0l2.062-2.062a4.42 4.42 0 0 1 6.25 0l3.208 3.208-1.38 1.38-2.215-2.216z" /></svg>
                    <span>PIX à vista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePlan(plan?.includes('vitalicio') ? 'vitalicio' : 'anual')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      (activePlan === 'vitalicio' || activePlan === 'anual')
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(224,31,71,0.5)] border border-red-400/30'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{activePlan === 'vitalicio' || activePlan === 'vitalicio_pix' ? 'Cartão (10x)' : 'Cartão'}</span>
                  </button>
              </div>
            )}

            {/* Step Indicator */}
            {!isPix && (
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step >= s 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-muted/60 text-muted-foreground'
                    }`}>
                      {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    {s < 2 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > 1 ? 'bg-primary' : 'bg-muted/60'}`} />}
                  </div>
                ))}
              </div>
            )}
            {isPix && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === 1 ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <div className={`w-8 h-0.5 rounded-full transition-all ${step === 3 ? 'bg-emerald-500' : 'bg-muted/60'}`} />
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === 3 ? 'bg-emerald-500 text-white shadow-md' : 'bg-muted/60 text-muted-foreground'
                }`}>
                  {step === 3 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
              </div>
            )}

            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, filter: 'blur(10px)', x: -20 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                    exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> Nome Completo
                      </Label>
                      <Input 
                        value={formData.name} 
                        onChange={handleChange('name')}
                        onFocus={handleFocus}
                        placeholder="Nome Completo"
                        className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> E-mail
                      </Label>
                      <Input 
                        value={userEmail || ''} 
                        disabled
                        className="h-11 rounded-xl bg-black/20 border-white/10 font-medium text-sm opacity-50 backdrop-blur-md cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> CPF (Obrigatório)
                      </Label>
                      <Input 
                        value={formData.cpf} 
                        onChange={handleChange('cpf', maskCPF)}
                        onFocus={handleFocus}
                        placeholder="000.000.000-00" 
                        className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <Smartphone className="w-3.5 h-3.5"/> Telefone
                      </Label>
                      <Input 
                        value={formData.phone} 
                        onChange={handleChange('phone', maskPhone)}
                        onFocus={handleFocus}
                        placeholder="(00) 00000-0000" 
                        className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                        inputMode="numeric"
                      />
                    </div>

                    {!isPix && (
                      <>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5"/> CEP
                            </Label>
                            <Input 
                              value={formData.cep} 
                              onChange={handleChange('cep', maskCEP)}
                              onFocus={handleFocus}
                              placeholder="00000-000" 
                              className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                              inputMode="numeric"
                            />
                          </div>

                        <AnimatePresence>
                          {addressInfo && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 pt-2"
                            >
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Endereço</Label>
                                <Input 
                                  value={formData.address} 
                                  onChange={handleChange('address')}
                                  onFocus={handleFocus}
                                  placeholder="Rua, Avenida..." 
                                  className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Bairro</Label>
                                  <Input 
                                    value={formData.neighborhood} 
                                    onChange={handleChange('neighborhood')}
                                    onFocus={handleFocus}
                                    placeholder="Bairro" 
                                    className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 space-y-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Cidade</Label>
                                    <Input 
                                      value={formData.city} 
                                      onChange={handleChange('city')}
                                      onFocus={handleFocus}
                                      placeholder="Cidade" 
                                      className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all"
                                    />
                                  </div>
                                  <div className="col-span-1 space-y-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">UF</Label>
                                    <Input 
                                      value={formData.uf} 
                                      onChange={handleChange('uf')}
                                      onFocus={handleFocus}
                                      placeholder="SP" 
                                      maxLength={2}
                                      className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-sm backdrop-blur-md transition-all uppercase"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}

                    <div className="pt-4">
                      <Button 
                        onClick={handleNextStep}
                        disabled={loading}
                        className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white text-sm transition-all active:opacity-70 shadow-[0_8px_30px_rgba(224,31,71,0.3)]"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                        isPix ? 'Gerar PIX' : 'Continuar para Pagamento'}
                        {!loading && !isPix && <ArrowRight className="w-5 h-5 ml-2" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, filter: 'blur(10px)', x: -20 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                    exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <CreditCardPreview 
                       name={formData.cardName}
                       number={formData.cardNumber}
                       expiry={formData.cardExpiry}
                       cvc={formData.cardCvc}
                       isFlipped={isFlipped}
                    />

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <CreditCard className="w-3 h-3"/> Número do Cartão
                      </Label>
                      <Input 
                        value={formData.cardNumber} 
                        onChange={handleChange('cardNumber', maskCard)}
                        onFocus={(e) => { setIsFlipped(false); handleFocus(e); }}
                        placeholder="0000 0000 0000 0000" 
                        className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-sm backdrop-blur-md transition-all"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Nome Impresso no Cartão</Label>
                      <Input 
                        value={formData.cardName} 
                        onChange={handleChange('cardName')}
                        onFocus={(e) => { setIsFlipped(false); handleFocus(e); }}
                        placeholder="JOAO S SILVA" 
                        className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium uppercase text-sm backdrop-blur-md transition-all"
                        autoComplete="cc-name"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Validade</Label>
                        <Input 
                          value={formData.cardExpiry} 
                          onChange={handleChange('cardExpiry', maskExpiry)}
                          onFocus={(e) => { setIsFlipped(false); handleFocus(e); }}
                          placeholder="MM/AA" 
                          className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-sm backdrop-blur-md transition-all"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">CVV</Label>
                        <Input 
                          value={formData.cardCvc} 
                          onChange={handleChange('cardCvc', maskCVC)}
                          onFocus={(e) => { setIsFlipped(true); handleFocus(e); }}
                          onBlur={() => setIsFlipped(false)}
                          placeholder="123" 
                          className="h-11 rounded-xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-sm backdrop-blur-md transition-all"
                          inputMode="numeric"
                          type="password"
                          autoComplete="cc-csc"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    {(activePlan === 'vitalicio') && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Parcelamento</Label>
                        <div className="relative">
                          <select 
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(Number(e.target.value))}
                            onFocus={(e) => { setIsFlipped(false); handleFocus(e); }}
                            className="w-full h-11 rounded-xl bg-black/40 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary font-medium px-3 text-sm appearance-none outline-none backdrop-blur-md transition-all text-white"
                          >
                          {Array.from({ length: activePlan === 'vitalicio' ? 10 : 6 }, (_, idx) => idx + 1).map(num => {
                            // Cálculo sem juros no display (absorvidos pela operação)
                            const totalWithTax = activePlan === 'vitalicio' ? 249.90 : 149.90;
                            const installmentValue = totalWithTax / num;

                            return (
                              <option key={num} value={num} className="bg-background text-foreground">
                                {num}x de R$ {installmentValue.toFixed(2).replace('.', ',')} {num === 1 ? ' à vista' : ''}
                              </option>
                            );
                          })}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button 
                        onClick={processCheckout}
                        disabled={loading}
                        className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white text-sm transition-all active:opacity-70 shadow-[0_8px_30px_rgba(224,31,71,0.4)]"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Assinatura'}
                        {!loading && <CheckCircle2 className="w-5 h-5 ml-2" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && pixData && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center space-y-6 pt-4"
                  >
                    <div className="w-64 h-64 bg-white p-3 rounded-[2rem] border-4 shadow-2xl relative overflow-hidden" style={{ borderColor: pixExpired ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)' }}>
                      <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay"></div>
                      <img src={`data:image/jpeg;base64,${pixData.qrCode}`} alt="QR Code PIX" className={`w-full h-full object-contain relative z-10 transition-opacity duration-300 ${pixExpired ? 'opacity-20' : ''}`} />
                      {pixExpired && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-[1.75rem]">
                          <Clock className="w-10 h-10 text-red-400 mb-2" />
                          <span className="text-red-400 font-black text-sm uppercase tracking-wider">Expirado</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h4 className={`font-display font-black text-2xl tracking-tight ${pixExpired ? 'text-red-400' : 'text-emerald-500'}`}>
                        {pixExpired ? 'QR Code Expirado' : 'PIX Gerado com Sucesso'}
                      </h4>
                      <p className="text-sm font-medium text-muted-foreground px-4">
                        {pixExpired
                          ? 'O código expirou. Gere um novo QR Code com um clique abaixo.'
                          : 'Escaneie o QR code ou copie a chave abaixo para finalizar sua assinatura em poucos segundos.'}
                      </p>
                      {!pixExpired && (
                        <p className="text-[12px] font-medium text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg mx-6 leading-tight">
                          Pode fechar esta tela ou o app. O acesso será liberado automaticamente após a compensação.
                        </p>
                      )}
                      {!pixExpired && (
                        <div className="inline-flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-lg px-4 py-1.5 rounded-full mt-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          â± Expira em {formatTime(pixTimeLeft)}
                        </div>
                      )}
                    </div>

                    {pixExpired ? (
                      <Button
                        onClick={handleRegeneratePixQr}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white text-base transition-transform active:opacity-70 shadow-[0_8px_30px_rgba(224,31,71,0.4)] flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        {loading ? 'Gerando...' : 'Gerar Novo QR Code PIX'}
                      </Button>
                    ) : (
                      <Button onClick={copyPix} variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 border-white/10 bg-black/30 backdrop-blur-md hover:bg-black/50 flex items-center gap-2 text-base shadow-xl">
                        <Copy className="w-5 h-5" />
                        Copiar Código PIX
                      </Button>
                    )}
                    
                    {!pixExpired && (
                      <div className="pt-4 w-full">
                         <Button 
                           onClick={handleVerifyPayment}
                           disabled={verifyingPayment || verifyCooldown > 0}
                           className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl text-base transition-transform active:opacity-70 shadow-[0_10px_30px_rgba(224,31,71,0.3)]"
                         >
                           {verifyingPayment ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                           {verifyingPayment ? 'Verificando...' : verifyCooldown > 0 ? `Aguarde ${verifyCooldown}s para verificar` : 'Já realizei o pagamento'}
                         </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center space-y-8 pt-10 pb-8 min-h-[400px]"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="w-32 h-32 text-emerald-500 relative z-10" />
                      </motion.div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-black text-white tracking-widest uppercase"
                      >
                        Pagamento Confirmado!
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-muted-foreground font-medium max-w-xs mx-auto"
                      >
                        Seu acesso premium foi liberado com sucesso. Bem-vindo ao ecossistema!
                      </motion.p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};




