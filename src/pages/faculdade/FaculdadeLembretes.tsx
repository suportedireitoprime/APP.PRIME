import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { BellRing, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaculdadeLembretes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Lembretes" 
        subtitle="Provas, Trabalhos e Prazos" 
        onBack={() => navigate('/')} 
      />
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-[#0EA5E9]/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#0EA5E9]/20">
          <BellRing className="w-10 h-10 text-[#0EA5E9]" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-3">
          Nenhum lembrete ainda
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-10">
          Adicione datas de provas, entregas de trabalhos e prazos importantes. Nós avisaremos você para que nada fique para trás.
        </p>
        
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 bg-[#0EA5E9] text-white py-4 rounded-2xl font-display font-bold shadow-lg shadow-[#0EA5E9]/25"
        >
          <Plus className="w-5 h-5" />
          Novo Lembrete
        </motion.button>
      </div>
    </div>
  );
}
