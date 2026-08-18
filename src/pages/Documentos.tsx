import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Documentos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Documentos" 
        subtitle="Modelos prontos para uso" 
        onBack={() => navigate('/ferramentas')} 
      />
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-[#F59E0B]/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#F59E0B]/20">
          <FolderOpen className="w-10 h-10 text-[#F59E0B]" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-3">
          Documentos
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-10">
          Esta área foi migrada. Em breve, a listagem completa de petições, contratos e modelos estará disponível de forma independente aqui.
        </p>
      </div>
    </div>
  );
}
