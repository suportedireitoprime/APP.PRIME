import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { FileText, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaculdadeResumos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Gerar Resumos" 
        subtitle="Sintetize textos longos com IA" 
        onBack={() => navigate('/')} 
      />
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-[#F59E0B]/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#F59E0B]/20">
          <FileText className="w-10 h-10 text-[#F59E0B]" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-3">
          Resumos Inteligentes
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-10">
          Faça upload de PDFs ou cole textos longos. Nossa IA criará um resumo direto ao ponto, destacando as partes mais importantes para você não perder tempo.
        </p>
        
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-3 bg-[#F59E0B] text-white py-4 rounded-2xl font-display font-bold shadow-lg shadow-[#F59E0B]/25"
        >
          <Wand2 className="w-5 h-5" />
          Gerar Novo Resumo
        </motion.button>
      </div>
    </div>
  );
}
