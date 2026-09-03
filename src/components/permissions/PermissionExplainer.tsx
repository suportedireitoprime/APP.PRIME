import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Bell, FileText, X, LucideIcon } from 'lucide-react';
import horusBellAsset from '@/assets/horus/horus-bell.webp';
import { useAuth } from '@/hooks/useAuth';

export type PermissionKind = 'microphone' | 'camera' | 'notifications' | 'files';

const CONFIG: Record<PermissionKind, { icon: LucideIcon; title: string; body: string }> = {
  microphone: {
    icon: Mic,
    title: 'Precisamos do microfone',
    body: 'Pra você poder gravar anotações em áudio e conversar com a IA Jurídica por voz. Nada é enviado sem sua ação.',
  },
  camera: {
    icon: Camera,
    title: 'Precisamos da câmera',
    body: 'Pra escanear QR Codes de leis ou digitalizar páginas de livros pra biblioteca.',
  },
  notifications: {
    icon: Bell,
    title: 'Ativar notificações',
    body: 'Pra te avisar de novas leis, alterações que você acompanha e lembretes de estudo.',
  },
  files: {
    icon: FileText,
    title: 'Acesso a arquivos',
    body: 'Pra importar PDFs de livros e provas pra sua biblioteca pessoal.',
  },
};

interface Props {
  open: boolean;
  kind: PermissionKind;
  onAllow: () => void | Promise<void>;
  onDeny: () => void;
}

function useTypewriter(text: string, enabled: boolean, speed = 28, startDelay = 650) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!enabled) { setOut(''); return; }
    setOut('');
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    
    const audio = new Audio('/sounds/teclado.mp3');
    audio.loop = true;
    audio.volume = 0.35; // Volume confortável
    
    const start = setTimeout(() => {
      audio.play().catch(() => {}); // catch para ignorar bloqueios de autoplay do navegador
      
      const tick = () => {
        i++;
        setOut(text.slice(0, i));
        if (i < text.length) {
          timer = setTimeout(tick, speed);
        } else {
          audio.pause();
        }
      };
      tick();
    }, startDelay);
    
    return () => { 
      clearTimeout(start); 
      clearTimeout(timer!); 
      audio.pause();
    };
  }, [text, enabled, speed, startDelay]);
  return out;
}

export function PermissionExplainer({ open, kind, onAllow, onDeny }: Props) {
  const cfg = CONFIG[kind];
  const Icon = cfg.icon;
  const [landed, setLanded] = useState(false);
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0];
  const greeting = firstName ? `Ei ${firstName}!` : 'Ei!';
  const speechText = `${greeting} Ativa as notificações aí pra eu te avisar rapidão quando sair lei nova ou tiver novidade importante. Bora?`;
  const typed = useTypewriter(speechText, open && landed && kind === 'notifications');

  // Reset landed state when closing
  useEffect(() => {
    if (!open) setLanded(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {kind === 'notifications' ? (
            <motion.div
              key="backdrop-notif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={onDeny}
            >
              {/* Horus stomp shockwave */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.2, 2.4, 3] }}
                transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
                className="pointer-events-none absolute w-56 h-56 rounded-full border-2 border-primary/60"
                style={{ top: '38%' }}
              />

              <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                {/* Horus mascote — cai de cima com pisada */}
                <motion.div
                  initial={{ y: -260, rotate: -8, scale: 0.9 }}
                  animate={{
                    y: [ -260, 0, -14, 0 ],
                    rotate: [ -8, 2, -1, 0 ],
                    scale: [ 0.9, 1.08, 0.98, 1 ],
                  }}
                  transition={{ duration: 0.7, times: [0, 0.55, 0.8, 1], ease: ['easeIn','easeOut','easeOut','easeOut'] }}
                  onAnimationComplete={() => setLanded(true)}
                  className="absolute -top-28 -left-4 z-20 w-40 h-40 drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)]"
                >
                  <img src={horusBellAsset} alt="Horus Notificações" className="w-full h-full object-contain" />
                </motion.div>

                {/* Balão de fala estilo gibi */}
                <AnimatePresence>
                  {landed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      className="absolute -top-32 left-32 z-20 max-w-[240px] bg-white text-neutral-900 rounded-2xl px-4 py-3 shadow-xl border-2 border-neutral-900"
                      style={{ transformOrigin: 'bottom left' }}
                    >
                      <p className="text-[15px] font-semibold leading-snug">
                        {typed}
                        <span className="inline-block w-[2px] h-4 align-[-2px] ml-0.5 bg-neutral-900 animate-pulse" />
                      </p>
                      {/* Rabinho do balão */}
                      <span
                        className="absolute -bottom-2 left-6 w-0 h-0"
                        style={{
                          borderLeft: '10px solid transparent',
                          borderRight: '10px solid transparent',
                          borderTop: '12px solid #171717',
                        }}
                      />
                      <span
                        className="absolute -bottom-[6px] left-[21px] w-0 h-0"
                        style={{
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderTop: '9px solid #ffffff',
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="relative z-10 w-full mt-24 bg-card border-2 border-border rounded-3xl p-6 shadow-2xl"
                >
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">{cfg.title}</h3>
                  {kind === 'notifications' ? (
                    <ul className="space-y-3 text-sm text-muted-foreground font-body mb-6">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Novas leis e alterações nas legislações que você acompanha.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Novidades do aplicativo e novas aulas liberadas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Lembretes e acompanhamento do seu plano de estudos.</span>
                      </li>
                    </ul>
                  ) : (
                    <p className="font-body text-base text-muted-foreground leading-relaxed mb-6">{cfg.body}</p>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={onAllow}
                      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Bell className="w-5 h-5" />
                      Receber notificações
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                key="backdrop-normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
                onClick={onDeny}
              />
              <motion.div
                key="modal-normal"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                className="fixed inset-x-4 bottom-6 z-[81] max-w-md mx-auto rounded-2xl bg-card border border-border shadow-2xl p-6"
              >
                <button
                  onClick={onDeny}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="font-display text-lg font-bold text-foreground mb-2">{cfg.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">{cfg.body}</p>

                <div className="flex gap-2">
                  <button
                    onClick={onDeny}
                    className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-body font-medium text-sm hover:bg-secondary/70 transition-colors"
                  >
                    Agora não
                  </button>
                  <button
                    onClick={onAllow}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Permitir
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
