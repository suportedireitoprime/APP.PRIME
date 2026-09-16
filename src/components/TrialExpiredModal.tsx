import { motion } from "framer-motion";
import { ShieldAlert, Sparkles, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TrialExpiredModal() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0D0D0D]/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl relative overflow-hidden text-center"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-full bg-amber-500/15 ring-4 ring-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
          </div>
          
          <h2 className="font-display text-2xl font-black text-foreground uppercase tracking-wider">
            Seu tempo acabou
          </h2>
          
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            Olá! Sou o Hórus. Notei que seus <strong className="text-foreground">3 dias de teste gratuito</strong> chegaram ao fim. 
            Para continuar acessando o Vade Mecum, a IA Jurídica e todas as nossas ferramentas, escolha um de nossos planos.
          </p>
          
          <div className="flex flex-col w-full gap-3 mt-2">
            <button
              onClick={() => navigate('/assinatura')}
              className="w-full h-14 rounded-2xl font-display font-black text-base bg-primary text-primary-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <Sparkles className="w-5 h-5" />
              VER PLANOS
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-xl font-display font-bold text-sm bg-muted text-muted-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
