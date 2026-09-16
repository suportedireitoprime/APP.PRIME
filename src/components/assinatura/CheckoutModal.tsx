import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, ShieldCheck, User, MapPin, Smartphone, ArrowRight, CheckCircle2, Copy, X, ChevronLeft, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: 'mensal' | 'anual' | 'anual_pix' | null;
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
             Este cartão é seguro e processado com criptografia.
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onOpenChange, plan, userEmail, userName, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [addressInfo, setAddressInfo] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [formData, setFormData] = useState({
    name: userName || '',
    cpf: '',
    phone: '',
    cep: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: ''
  });

  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(600);

  const isPix = plan === 'anual_pix';

  useEffect(() => {
    if (open) {
      setStep(1);
      setPixData(null);
      setPixTimeLeft(600);
      setInstallmentCount(1);
      setAddressInfo('');
      setVerifyingPayment(false);
      setFormData(prev => ({ ...prev, name: userName || '', cardName: userName || '' }));
    }
  }, [open, userName]);

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

  // PIX Polling e Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 3 && pixData) {
      interval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
           const { data } = await supabase.from('asaas_subscriptions')
             .select('status')
             .eq('user_id', session.user.id)
             .maybeSingle();
           
           if (data?.status === 'ACTIVE') {
             clearInterval(interval);
             toast.success("Pagamento confirmado via PIX!");
             onSuccess();
             onOpenChange(false);
           }
        }
      }, 4000); // Check every 4 seconds
    }
    return () => clearInterval(interval);
  }, [step, pixData, onSuccess, onOpenChange]);

  // PIX Expiration Timer — stable interval, no dep on pixTimeLeft
  useEffect(() => {
    if (step !== 3 || !pixData) return;
    const timer = setInterval(() => {
      setPixTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, pixData]);

  useEffect(() => {
    if (step === 3 && pixTimeLeft === 0) {
      toast.error('O código PIX expirou. Por favor, gere novamente.');
      setStep(1);
      setPixData(null);
    }
  }, [pixTimeLeft, step]);

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
    if (!formData.cpf || formData.cpf.length < 14) {
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
      setStep(2);
    } else {
      processCheckout();
    }
  };

  const processCheckout = async () => {
    if (!isPix) {
      if (formData.cardNumber.length < 18) {
        toast.error('Número de cartão inválido.');
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
        toast.error('Nome impresso no cartão é obrigatório.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        plan,
        email: userEmail,
        name: formData.name,
        cpfCnpj: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        installmentCount: plan === 'anual' ? installmentCount : 1
      };

      if (!isPix) {
        const [expMonth, expYear] = formData.cardExpiry.split('/');
        payload.creditCard = {
          holderName: formData.cardName.toUpperCase(),
          number: formData.cardNumber.replace(/\D/g, ''),
          expiryMonth: expMonth,
          expiryYear: `20${expYear}`,
          ccv: formData.cardCvc
        };
        payload.creditCardHolderInfo = {
          name: formData.cardName.toUpperCase() || userName,
          email: userEmail,
          cpfCnpj: formData.cpf.replace(/\D/g, ''),
          postalCode: formData.cep.replace(/\D/g, ''),
          addressNumber: 'SN', // Oculto mas preenchido
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
        setStep(3);
      } else if (!isPix) {
        if (data?.status === 'ACTIVE' || data?.status === 'CONFIRMED' || data?.invoiceUrl) {
          toast.success('Assinatura ativada com sucesso!');
          onSuccess();
          onOpenChange(false);
        } else {
          if (data?.invoiceUrl) {
             window.open(data.invoiceUrl, '_blank');
             onSuccess();
             onOpenChange(false);
          } else {
             throw new Error('Pagamento não foi autorizado. Tente outro cartão.');
          }
        }
      } else if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Erro ao gerar cobrança. Tente novamente.');
      }

    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao processar.');
    } finally {
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
    setVerifyingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('asaas_subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (data?.status === 'ACTIVE') {
          toast.success('Pagamento confirmado!');
          onSuccess();
          onOpenChange(false);
          return;
        }
      }
      toast('Pagamento ainda não confirmado. Aguarde alguns segundos e tente novamente.', { icon: '⏳' });
    } catch {
      toast.error('Erro ao verificar pagamento.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getPlanInfo = () => {
    if (plan === 'mensal') return { title: 'Mensal', price: 'R$ 29,90', sub: '/ mês' };
    if (plan === 'anual') return { title: 'Anual', price: 'R$ 199,90', sub: '/ ano' };
    if (plan === 'anual_pix') return { title: 'Promoção', price: 'R$ 149,90', sub: '/ ano' };
    return { title: '', price: '', sub: '' };
  };

  const planInfo = getPlanInfo();

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent 
        className="max-w-none w-screen min-h-[100vh] h-[100dvh] m-0 p-0 rounded-none border-none flex flex-col bg-background/95 overflow-hidden shadow-none [&>button]:hidden"
      >
        <DialogDescription className="sr-only">Checkout e pagamento do Direito Prime.</DialogDescription>

        {/* Background Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-cover bg-center" 
          style={{ backgroundImage: "url('/images/checkout_bg.jpg')" }}
        />
        
        {/* Top Header with Custom Close/Back Button */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-background/60 backdrop-blur-xl border-b border-white/5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step === 1 ? onOpenChange(false) : setStep(1)}
            disabled={loading}
            className="rounded-full hover:bg-white/10"
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
          <div className="max-w-md mx-auto w-full p-6 flex flex-col pb-[calc(5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            
            {/* Plan Info Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 mb-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                VOCÊ ESTÁ ASSINANDO:
              </p>
              <h3 className="font-display text-lg font-black text-foreground/90 mb-2">
                Estudos Jurídicos {planInfo.title}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-black text-foreground">{planInfo.price}</span>
                <span className="text-sm font-semibold text-muted-foreground">{planInfo.sub}</span>
              </div>
              {plan === 'anual_pix' && (
                <span className="absolute top-0 right-0 bg-emerald-500/80 backdrop-blur-md text-white font-black text-[9px] px-2 py-0.5 rounded-bl-lg tracking-wider">
                  DESCONTO APLICADO
                </span>
              )}
            </div>

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
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> Nome Completo
                      </Label>
                      <Input 
                        value={formData.name} 
                        onChange={handleChange('name')}
                        placeholder="Nome Completo"
                        className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-base backdrop-blur-md transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> E-mail
                      </Label>
                      <Input 
                        value={userEmail || ''} 
                        disabled
                        className="h-12 rounded-2xl bg-black/20 border-white/10 font-medium opacity-50 backdrop-blur-md cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5"/> CPF (Obrigatório)
                      </Label>
                      <Input 
                        value={formData.cpf} 
                        onChange={handleChange('cpf', maskCPF)}
                        placeholder="000.000.000-00" 
                        className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-base backdrop-blur-md transition-all"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <Smartphone className="w-3.5 h-3.5"/> Telefone
                      </Label>
                      <Input 
                        value={formData.phone} 
                        onChange={handleChange('phone', maskPhone)}
                        placeholder="(00) 00000-0000" 
                        className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-base backdrop-blur-md transition-all"
                        inputMode="numeric"
                      />
                    </div>

                    {!isPix && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5"/> CEP
                        </Label>
                        <Input 
                          value={formData.cep} 
                          onChange={handleChange('cep', maskCEP)}
                          placeholder="00000-000" 
                          className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium text-base backdrop-blur-md transition-all"
                          inputMode="numeric"
                        />
                        <AnimatePresence>
                          {addressInfo && (
                            <motion.p 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs font-medium text-emerald-400 mt-1 pl-2"
                            >
                              {addressInfo}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <div className="pt-6">
                      <Button 
                        onClick={handleNextStep}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white text-base transition-all active:scale-95 shadow-[0_8px_30px_rgba(224,31,71,0.3)]"
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
                    className="space-y-4"
                  >
                    <CreditCardPreview 
                       name={formData.cardName}
                       number={formData.cardNumber}
                       expiry={formData.cardExpiry}
                       cvc={formData.cardCvc}
                       isFlipped={isFlipped}
                    />

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <CreditCard className="w-3.5 h-3.5"/> Número do Cartão
                      </Label>
                      <Input 
                        value={formData.cardNumber} 
                        onChange={handleChange('cardNumber', maskCard)}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="0000 0000 0000 0000" 
                        className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-base backdrop-blur-md transition-all"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Impresso no Cartão</Label>
                      <Input 
                        value={formData.cardName} 
                        onChange={handleChange('cardName')}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="JOAO S SILVA" 
                        className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium uppercase text-base backdrop-blur-md transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Validade</Label>
                        <Input 
                          value={formData.cardExpiry} 
                          onChange={handleChange('cardExpiry', maskExpiry)}
                          onFocus={() => setIsFlipped(false)}
                          placeholder="MM/AA" 
                          className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-base backdrop-blur-md transition-all"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CVV</Label>
                        <Input 
                          value={formData.cardCvc} 
                          onChange={handleChange('cardCvc', maskCVC)}
                          onFocus={() => setIsFlipped(true)}
                          onBlur={() => setIsFlipped(false)}
                          placeholder="123" 
                          className="h-12 rounded-2xl bg-black/40 border-white/10 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary font-medium font-mono text-base backdrop-blur-md transition-all"
                          inputMode="numeric"
                          type="password"
                        />
                      </div>
                    </div>

                    {plan === 'anual' && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parcelamento</Label>
                        <select 
                          value={installmentCount}
                          onChange={(e) => setInstallmentCount(Number(e.target.value))}
                          onFocus={() => setIsFlipped(false)}
                          className="w-full h-12 rounded-2xl bg-black/40 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary font-medium px-4 text-sm appearance-none outline-none backdrop-blur-md transition-all text-white"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
                            // Cálculo de repasse padrão do Asaas para cartão de crédito
                            let taxRate = 0;
                            if (num === 1) taxRate = 0.0339;
                            else if (num <= 6) taxRate = 0.0389;
                            else taxRate = 0.0439;
                            
                            const totalWithTax = (199.90 + 0.29) / (1 - taxRate);
                            const installmentValue = totalWithTax / num;

                            return (
                              <option key={num} value={num} className="bg-background text-foreground">
                                {num}x de R$ {installmentValue.toFixed(2).replace('.', ',')} {num === 1 ? ' (à vista)' : ` (Total: R$ ${totalWithTax.toFixed(2).replace('.', ',')})`}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="pt-6">
                      <Button 
                        onClick={processCheckout}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white text-base transition-all active:scale-95 shadow-[0_8px_30px_rgba(224,31,71,0.4)]"
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
                    <div className="w-64 h-64 bg-white p-3 rounded-[2rem] border-4 border-emerald-500/20 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay"></div>
                      <img src={`data:image/jpeg;base64,${pixData.qrCode}`} alt="QR Code PIX" className="w-full h-full object-contain relative z-10" />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h4 className="font-display font-black text-2xl text-emerald-500 tracking-tight">
                        PIX Gerado com Sucesso
                      </h4>
                      <p className="text-sm font-medium text-muted-foreground px-4">
                        Escaneie o QR code ou copie a chave abaixo para finalizar sua assinatura em poucos segundos.
                      </p>
                      <div className="inline-flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-lg px-4 py-1.5 rounded-full mt-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        ⏱ Expira em {formatTime(pixTimeLeft)}
                      </div>
                    </div>

                    <Button onClick={copyPix} variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 border-white/10 bg-black/30 backdrop-blur-md hover:bg-black/50 flex items-center gap-2 text-base shadow-xl">
                      <Copy className="w-5 h-5" />
                      Copiar Código PIX
                    </Button>
                    
                    <div className="pt-4 w-full">
                       <Button 
                         onClick={handleVerifyPayment}
                         disabled={verifyingPayment}
                         className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-14 rounded-2xl text-base transition-transform active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                       >
                         {verifyingPayment ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                         {verifyingPayment ? 'Verificando...' : 'Já realizei o pagamento'}
                       </Button>
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
