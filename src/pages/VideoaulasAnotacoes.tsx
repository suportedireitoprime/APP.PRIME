import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { motion } from 'framer-motion';
import { BookOpenText } from 'lucide-react';

const VideoaulasAnotacoes = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Anotações"
        subtitle="Seu caderno virtual"
        onBack={() => navigate('/videoaulas/categorias')}
      />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full pb-32 pt-16 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      >
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <BookOpenText className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Caderno de Estudos
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Suas anotações das aulas ficarão organizadas aqui para rápida revisão.
        </p>
      </motion.div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasAnotacoes;
