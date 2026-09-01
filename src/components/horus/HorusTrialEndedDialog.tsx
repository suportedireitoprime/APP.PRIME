import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import horusOwlAsset from '@/assets/horus/horus-owl.webp';
import { useTrialEndedNotice } from '@/hooks/useTrialEndedNotice';

function useTypewriter(text: string, enabled: boolean, speed = 28, startDelay = 650) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!enabled) { setOut(''); return; }
    setOut('');
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    
    const audio = new Audio('/sounds/teclado.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    
    const start = setTimeout(() => {
      audio.play().catch(() => {});
      
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

export default function HorusTrialEndedDialog() {
  const { show, acknowledge } = useTrialEndedNotice();
  const [landed, setLanded] = useState(false);
  const { user } = useAuth();
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0];
  const greeting = firstName ? `Ei ${firstName}!` : 'Ei!';
  const speechText = `${greeting} Vi que seu período Premium acabou e você voltou para a versão gratuita. Não se preocupe, estarei aqui para te ajudar nos estudos básicos. Quando quiser liberar todo o meu poder novamente, é só assinar!`;
  
  const typed = useTypewriter(speechText, show && landed);

  useEffect(() => {
    if (!show) setLanded(false);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="backdrop-trial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          {/* Horus stomp shockwave */}
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.2, 2.4, 3] }}
            transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
            className="pointer-events-none absolute w-56 h-56 rounded-full border-2 border-primary/60"
            style={{ top: '38%' }}
          />

          <div className="relative w-full max-w-md">
            {/* Horus mascote */}
            <motion.div
              initial={{ y: -260, rotate: -8, scale: 0.9 }}
              animate={{
                y: [ -260, 0, -14, 0 ],
                rotate: [ -8, 2, -1, 0 ],
                scale: [ 0.9, 1.08, 0.98, 1 ],
              }}
              transition={{ duration: 0.7, times: [0, 0.55, 0.8, 1], ease: ['easeIn','easeOut','easeOut','easeOut'] }}
              onAnimationComplete={() => setLanded(true)}
              className="absolute -top-28 -left-4 z-30 w-40 h-40 drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)]"
            >
              <img src={horusOwlAsset} alt="Horus" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            </motion.div>

            {/* Balão de fala */}
            <AnimatePresence>
              {landed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="relative z-40 ml-28 mt-4"
                >
                  <div className="relative bg-zinc-100 text-zinc-900 p-4 rounded-2xl rounded-tl-sm shadow-xl border border-white/50 max-w-[260px]">
                    <div className="absolute -left-3 top-0 w-4 h-4 bg-zinc-100 transform -skew-x-[30deg] border-l border-t border-white/50" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                    <p className="font-body text-[15px] leading-relaxed relative z-10 font-medium">
                      {typed}
                      {typed.length < speechText.length && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse align-middle" />
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: landed ? 1 : 0, y: landed ? 0 : 20 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative z-20 mx-auto pt-8"
            >
              <div className="text-center mb-6">
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Você voltou para a versão Gratuita
                </h3>
                <p className="text-sm text-zinc-400 font-body leading-relaxed">
                  Sem problemas! Algumas funcionalidades Premium foram bloqueadas, mas você continua tendo acesso a parte do conteúdo.
                </p>
              </div>

              <button
                onClick={acknowledge}
                className="w-full h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold font-display active:scale-[0.98] transition-transform"
              >
                Entendi, continuar
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
