import { useState, useEffect, useRef } from 'react';
import {pickAsset, srcOf } from '@/lib/assetUrl';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  Monitor,
  QrCode,
  Globe,
  ScanLine,
  Camera,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Clock,
  History,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { scanOnce } from '@/lib/qrScanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { callDesktopLink } from '@/lib/desktopLinkApi';
import desktopImgAsset from '@/assets/desktop-promo-laptop.webp';
const desktopImg = desktopImgAsset;
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { useGoBack } from '@/hooks/useGoBack';
import { copiarTexto } from '@/lib/nativo/copiar';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

const SITE_URL = 'www.direitoprime.com.br';

const steps = [
  {
    icon: Globe,
    title: 'Acesse o site pelo computador',
    text: (
      <>
        Abra <span className="text-primary font-semibold">{SITE_URL}</span>.
      </>
    ),
  },
  {
    icon: QrCode,
    title: 'Aparecerá um QR Code',
    text: 'A tela de login exibirá um código.',
  },
  {
    icon: ScanLine,
    title: 'Escaneie aqui',
    text: 'Aponte a câmera para entrar direto.',
  },
];

const DesktopPromo = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);
  const [selectedDuration, setSelectedDuration] = useState('session');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('desktop_sessions')
        .select('created_at, user_agent, revoked_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setHistory(data);
    })();
  }, [user]);

  function parseUserAgent(ua: string | null) {
    if (!ua) return 'Dispositivo desconhecido';
    let browser = 'Navegador';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'Desktop';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Linux')) os = 'Linux';
    
    return `${browser} em ${os}`;
  }

  const copySite = async () => {
    try {
      await copiarTexto(`https://${SITE_URL}`);
      setCopied(true);
      toast.success('Endereço copiado');
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Não consegui copiar');
    }
  };

  const handleScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info('A leitura do QR só funciona no app do celular.');
      return;
    }
    setScanning(true);
    try {
      const raw = await scanOnce();
      if (!raw) {
        toast.error('Nenhum QR-code detectado');
        return;
      }
      // Aceita URL absoluta contendo /desktop-link/<uuid> ou o próprio uuid.
      const match =
        raw.match(/\/desktop-link\/([0-9a-f-]{36})/i) ||
        raw.match(/^([0-9a-f-]{36})$/i);
      if (!match) {
        toast.error('QR-code inválido. Escaneie o código exibido no computador.');
        return;
      }
      
      const toastId = toast.loading('Liberando acesso...');
      const j = await callDesktopLink<any>({ action: 'claim', token: match[1], expires_in: selectedDuration });
      if (j?.ok) {
        toast.success('Acesso liberado no computador!', { id: toastId });
        setHistory(prev => [{ created_at: new Date().toISOString(), user_agent: navigator.userAgent }, ...prev].slice(0, 3));
      } else {
        toast.error(j?.error || 'Erro ao liberar acesso.', { id: toastId });
      }
    } catch (e) {
      toast.error((e as Error)?.message || 'Não foi possível escanear');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-30">
        <PageHeader
          title="Versão Desktop"
          onBack={() => goBack()}
          leading={
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
          }
        />
      </div>

      <div className="p-4 space-y-5 max-w-sm mx-auto pb-[calc(7rem+var(--sai-bottom))] mt-6">
        {/* Explicação principal */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-black text-foreground leading-tight">
            Acesso ao Computador
          </h2>
          <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-[260px] mx-auto">
            Acesse <span className="font-bold text-foreground">www.direitoprime.com.br</span> no computador e escaneie o código na tela para entrar sem senha.
          </p>
        </div>

        <section className="rounded-3xl p-5 bg-card border border-border shadow-sm">
          {/* CTA principal — escanear */}
          <motion.button
            onClick={handleScan}
            disabled={scanning}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-black text-base shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {scanning ? (
              <>
                <Camera className="w-5 h-5 animate-pulse" />
                Abrindo a câmera…
              </>
            ) : (
              <>
                <ScanLine className="w-5 h-5" />
                Escanear Código
              </>
            )}
          </motion.button>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={copySite}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:bg-muted transition-colors w-full justify-center"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-display text-sm font-bold text-foreground truncate">
                {SITE_URL}
              </span>
            </button>
          </div>

          {/* Seleção de tempo */}
          <div className="mt-5 pt-5 border-t border-border/50">
            <label className="text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground block mb-2 text-center">
              Duração da Sessão
            </label>
            <div className="flex gap-2 justify-center">
              {[
                { id: 'session', label: 'Até fechar' },
                { id: '6h', label: '6 horas' },
                { id: '24h', label: '24 horas' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold font-body transition-all ${
                    selectedDuration === opt.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

          <div className="mt-4 flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-body">
            <ShieldCheck className="w-3 h-3 text-primary" />
            Código válido por 3 minutos e único
          </div>

          {/* Histórico */}
          {history.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-[11px] font-body font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <History className="w-3.5 h-3.5" />
                Últimos acessos
              </h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/50 border border-border/50">
                    <Laptop className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{parseUserAgent(h.user_agent)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {h.revoked_at ? ' • Revogado' : ' • Válido'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Passo a passo minimalista */}
        <section className="space-y-2 mt-6">
          <h3 className="font-display text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider text-center mb-4">Passo a passo</h3>
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-card border border-border"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground font-body leading-tight">
                  {s.text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesktopPromo;
