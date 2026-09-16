import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import horusAsset from '@/assets/horus/horus-star.webp';
import bgImage from '@/assets/auth-judge-scene.webp';
import { useAuth } from "@/hooks/useAuth";

export function TrialExpiredModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Advogado(a)';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-4">
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
          style={{ willChange: 'transform, opacity' }}
        >
          <img src={horusAsset} alt="Horus" draggable={false} className="w-full h-full object-contain pointer-events-none" />
        </motion.div>

        {/* Balão de fala */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.6 }}
            className="absolute top-[-20px] left-32 z-20 max-w-[240px] bg-white text-neutral-900 rounded-2xl px-4 py-3 shadow-xl border-2 border-neutral-900"
            style={{ transformOrigin: 'bottom left', willChange: 'transform, opacity' }}
            aria-live="polite"
          >
            <p className="text-[15px] font-semibold leading-snug">
              Seu passe livre terminou! A jornada continua? 🚀
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
          className="relative z-10 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/20 text-center overflow-hidden"
        >
          {/* Imagem de Fundo Vazada */}
          <div 
            className="absolute inset-0 z-0 opacity-15 pointer-events-none mix-blend-screen"
            style={{ 
              backgroundImage: `url(${bgImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center 20%',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)'
            }}
          />

          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 ring-4 ring-amber-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            
            <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">
              SEU TEMPO ACABOU
            </h2>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{firstName}</strong>, sua degustação de <strong className="text-foreground">3 dias</strong> chegou ao fim, mas sua evolução não pode parar agora. 
              Assine e destrave acesso <strong className="text-foreground">ilimitado</strong> a todas as ferramentas premium.
            </p>
            
            <div className="w-full mt-2">
              <button
                onClick={() => navigate('/assinatura')}
                className="w-full h-14 rounded-2xl font-display font-black text-base bg-primary text-primary-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                DESTRAVAR MEU ACESSO
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
