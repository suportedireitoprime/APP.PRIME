import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Camera, Upload, ScanText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaculdadeLousa() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Lousa" 
        subtitle="Digitalize anotações do quadro" 
        onBack={() => navigate('/')} 
      />
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
          <ScanText className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-3">
          Transcreva a lousa com IA
        </h2>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-10">
          Tire uma foto do quadro da sala de aula e nossa inteligência artificial transcreverá o conteúdo exatamente como está, para você organizar seu caderno digital.
        </p>
        
        <div className="space-y-4 w-full">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25"
          >
            <Camera className="w-5 h-5" />
            Tirar Foto do Quadro
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 bg-secondary/80 text-foreground py-4 rounded-2xl font-display font-bold border border-border/50"
          >
            <Upload className="w-5 h-5" />
            Enviar da Galeria
          </motion.button>
        </div>
      </div>
    </div>
  );
}
