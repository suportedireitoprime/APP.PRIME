import { useState, useEffect } from 'react';
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
    title: 'Acesse pelo computador',
    text: (
      <>
        No navegador do computador, abra{' '}
        <span className="text-primary font-semibold">{SITE_URL}</span>.
      </>
    ),
  },
  {
    icon: QrCode,
    title: 'Um QR-code vai aparecer na tela',
    text: 'A tela de login do desktop já mostra um QR-code grande, pronto pra ser lido.',
  },
  {
    icon: ScanLine,
    title: 'Escaneie com o botão acima',
    text: 'Aponte a câmera do celular pro QR na tela do computador. Você entra na hora, sem digitar senha.',
  },
];

const benefits = [
  'Estude de forma mais confortável na tela grande',
  'Visualize artigos e anotações lado a lado',
  'Mapas mentais e resumos em tela expandida',
  'Navegação rápida com atalhos de teclado',
  'Radar legislativo com dashboard completo',
  'Biblioteca de livros com leitura imersiva',
];

const DesktopPromo = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
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
      setTimeout(() => setCopied(false), 1800);
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

      <div className="p-4 space-y-6 max-w-lg mx-auto pb-[calc(7rem+var(--sai-bottom))]">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img src={desktopImg} alt="Direito Prime no Desktop" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
            <img
              src={primeLogo}
              alt="Direito Prime"
              className="w-9 h-9 rounded-lg border border-primary/40"
            />
            <div>
              <p className="font-display text-sm font-bold text-foreground">Direito Prime Desktop</p>
              <p className="text-[10px] text-muted-foreground">{SITE_URL}</p>
            </div>
          </div>
        </div>

        {/* Explicação principal */}
        <section className="rounded-2xl p-5 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-primary">
              Como entrar no desktop
            </span>
          </div>
          <h2 className="font-display text-xl font-black text-foreground leading-tight">
            Entre no computador escaneando um QR-code.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground font-body leading-relaxed">
            Sem digitar senha, sem esquecer login. Você abre o site no computador, aparece um
            QR-code, e escaneia aqui pelo celular pra entrar direto.
          </p>

          {/* Endereço do site — destaque */}
          <button
            onClick={copySite}
            className="mt-4 w-full flex items-center gap-3 p-3 rounded-xl bg-background/70 border border-primary/30 text-left hover:bg-background transition-colors"
          >
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">
                Abra no computador
              </p>
              <p className="font-display text-base font-bold text-foreground truncate">
                {SITE_URL}
              </p>
            </div>
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Seleção de tempo */}
          <div className="mt-5 space-y-2">
            <label className="text-[11px] font-body font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Tempo de acesso liberado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'session', label: 'Até fechar' },
                { id: '6h', label: '6 horas' },
                { id: '24h', label: '24 horas' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold font-body transition-all ${
                    selectedDuration === opt.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA principal — escanear */}
          <motion.button
            onClick={handleScan}
            disabled={scanning}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full flex items-center justify-center gap-3 py-4 rounded-full bg-primary text-primary-foreground font-display font-black text-base shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {scanning ? (
              <>
                <Camera className="w-5 h-5 animate-pulse" />
                Abrindo a câmera…
              </>
            ) : (
              <>
                <ScanLine className="w-5 h-5" />
                Escanear acesso
              </>
            )}
          </motion.button>

          <div className="mt-3 flex items-center gap-2 justify-center text-[11px] text-muted-foreground font-body">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Código válido por 3 minutos e único por acesso
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
        </section>

        {/* Passo a passo */}
        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold text-foreground px-1">Passo a passo</h3>
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 p-4 rounded-2xl bg-card border border-border"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-display font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">
                  {s.text}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Benefícios */}
        <section className="space-y-2">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Por que usar no desktop
          </h3>
          {benefits.map((b) => (
            <div
              key={b}
              className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground font-body">{b}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default DesktopPromo;
