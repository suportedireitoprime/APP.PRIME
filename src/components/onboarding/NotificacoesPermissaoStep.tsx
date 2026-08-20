import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Gavel, CalendarClock, Newspaper, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebPush } from '@/hooks/useWebPush';
import { marcarPedido, marcarResultado } from '@/lib/pushPermission';
import { supabase } from '@/integrations/supabase/client';
import horusBellAsset from '@/assets/horus/horus-bell.webp';
import { useAuth } from '@/hooks/useAuth';

function setBottomNavHidden(hidden: boolean) {
  try {
    window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden } }));
  } catch {}
}

const BENEFICIOS = [
  { icon: Gavel, titulo: 'Mudou a lei, você sabe na hora', desc: 'Alterações em leis, súmulas e teses da sua área.' },
  { icon: Newspaper, titulo: 'As notícias que importam', desc: 'Um resumo curto por dia — nada de spam.' },
  { icon: CalendarClock, titulo: 'Seus estudos em dia', desc: 'Lembretes de revisão, prazos e metas.' },
];

/**
 * Passo contextualizado de permissão de notificações, exibido no fim da triagem
 * de cadastro. Explica o porquê antes de disparar o prompt do sistema.
 */
export default function NotificacoesPermissaoStep({
  onDone,
}: {
  onDone: (granted: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { supported: webSupported, subscribe } = useWebPush();
  const { user } = useAuth();
  
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isNative = Capacitor.isNativePlatform();
  const platformText = isNative ? 'no celular' : isDesktop ? 'no seu computador' : 'aqui';

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '';
  const rawText = `Ei [Nome]! Ativa as notificações ${platformText} pra eu te avisar rapidão quando sair lei nova ou tiver novidade importante. Bora?`;
  const personalizedGuideText = rawText.replace('[Nome]!', firstName ? `${firstName}!` : '!');

  const [out, setOut] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    marcarPedido();
    setBottomNavHidden(true);
    
    // Typewriter effect
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const audio = new Audio('/sounds/teclado.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    
    const start = setTimeout(() => {
      audio.play().catch(() => {});
      const tick = () => {
        i++;
        setOut(personalizedGuideText.slice(0, i));
        if (i < personalizedGuideText.length) {
          timer = setTimeout(tick, 28);
        } else {
          audio.pause();
          setIsComplete(true);
        }
      };
      tick();
    }, 650);

    return () => { 
      setBottomNavHidden(false); 
      clearTimeout(start);
      clearTimeout(timer!);
      audio.pause();
    };
  }, [personalizedGuideText]);

  /** Push de boas-vindas: confirma na hora que está funcionando de verdade. */
  const enviarBoasVindas = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await supabase.functions.invoke('send-push', {
        body: {
          title: 'Tudo certo! 🔔',
          body: 'A partir de agora você recebe as novidades jurídicas da sua área por aqui.',
          url: '/',
          audience: { user_ids: [userId] },
          mirror_canal: false,
          personalize: true,
          data: { automation_key: 'boas_vindas_push' },
        },
      });
    } catch (e) { console.warn('push de boas-vindas falhou', e); }
  };

  const ativar = async () => {
    setLoading(true);
    let granted = false;
    try {
      if (Capacitor.isNativePlatform()) {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        let permStatus = await FirebaseMessaging.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await FirebaseMessaging.requestPermissions();
        }
        granted = permStatus.receive === 'granted';
        if (granted) {
          try {
            const { registerNativePushToken } = await import('@/lib/nativePush');
            await registerNativePushToken();
          } catch {}
        }
      } else if (webSupported) {
        granted = await subscribe();
      }
    } catch (e) {
      console.warn('[NotificacoesPermissaoStep]', e);
    } finally {
      setLoading(false);
      marcarResultado(granted);
      if (granted) {
        // Aguarda o token chegar ao banco antes de disparar o teste.
        window.setTimeout(() => { enviarBoasVindas(); }, 2500);
      }
      onDone(granted);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center overflow-y-auto bg-background/95 backdrop-blur-sm p-4">
      <div className="relative mx-auto w-full max-w-md pt-28">
        
        {/* Horus mascote animado */}
        <motion.div
          initial={{ y: -160, rotate: -8, opacity: 0, scale: 0.8 }}
          animate={{
            y: [ -160, 0, -14, 0 ],
            rotate: [ -8, 2, -1, 0 ],
            scale: [ 0.8, 1.08, 0.98, 1 ],
            opacity: 1
          }}
          transition={{ duration: 0.7, times: [0, 0.55, 0.8, 1], ease: ['easeIn','easeOut','easeOut','easeOut'] }}
          className="absolute top-0 -left-4 z-20 w-40 h-40 drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)] pointer-events-none"
        >
          <img src={horusBellAsset} alt="Horus" className="w-full h-full object-contain" />
        </motion.div>

        {/* Balão de fala */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.6 }}
            className="absolute top-[-20px] left-32 z-20 max-w-[240px] bg-white text-neutral-900 rounded-2xl px-4 py-3 shadow-xl border-2 border-neutral-900"
            style={{ transformOrigin: 'bottom left' }}
          >
            <p className="text-[15px] font-semibold leading-snug">
              {out}
              {!isComplete && <span className="inline-block w-[2px] h-4 align-[-2px] ml-0.5 bg-neutral-900 animate-pulse" />}
            </p>
            <span
              className="absolute -bottom-2 left-6 w-0 h-0 pointer-events-none"
              style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '12px solid #171717' }}
            />
            <span
              className="absolute -bottom-[6px] left-[21px] w-0 h-0 pointer-events-none"
              style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #ffffff' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Card Principal */}
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative z-10 space-y-5 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/20"
        >
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Não perca nada do Direito
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ative os avisos e receba só o essencial: o que mudou na lei, a notícia
              do dia e os seus lembretes de estudo.
            </p>
          </div>

          <ul className="space-y-3">
            {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
              <li key={titulo} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{titulo}</span>
                  <span className="block text-xs text-muted-foreground">{desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Você pode desativar quando quiser nas configurações.
          </p>

          <div className="space-y-2">
            <Button className="w-full h-14 text-base font-semibold" size="lg" onClick={ativar} disabled={loading}>
              {loading ? 'Ativando…' : 'Quero ser avisado'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => { marcarResultado(false); onDone(false); }}
              disabled={loading}
            >
              Agora não
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
