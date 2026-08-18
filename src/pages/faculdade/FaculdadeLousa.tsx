import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Camera as CameraIcon, Upload, ScanText, RefreshCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

export default function FaculdadeLousa() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const captureImage = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        quality: 100, // Highest possible quality
        allowEditing: false, // Keep original aspect ratio and full resolution
        resultType: CameraResultType.Uri,
        source: source,
        preserveAspectRatio: true,
      });

      if (image.webPath) {
        setPhotoUrl(image.webPath);
      } else if (image.path) {
        setPhotoUrl(Capacitor.convertFileSrc(image.path));
      }
    } catch (e: any) {
      if (e.message && e.message.includes('User cancelled')) {
        return; // User just closed the camera
      }
      toast({
        title: "Erro na Câmera",
        description: "Não foi possível acessar a câmera ou galeria. Verifique as permissões.",
        variant: "destructive"
      });
      console.error('Camera error', e);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Lousa" 
        subtitle="Digitalize anotações do quadro" 
        onBack={() => navigate('/')} 
      />
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        
        <AnimatePresence mode="wait">
          {!photoUrl ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
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
                  onClick={() => captureImage(CameraSource.Camera)}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25"
                >
                  <CameraIcon className="w-5 h-5" />
                  Tirar Foto do Quadro
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => captureImage(CameraSource.Photos)}
                  className="w-full flex items-center justify-center gap-3 bg-secondary/80 text-foreground py-4 rounded-2xl font-display font-bold border border-border/50"
                >
                  <Upload className="w-5 h-5" />
                  Enviar da Galeria
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full aspect-[3/4] sm:aspect-square bg-muted rounded-3xl overflow-hidden shadow-md border border-border mb-6 relative">
                <img 
                  src={photoUrl} 
                  alt="Lousa digitalizada" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toast({ title: "Em breve", description: "O processamento por IA será ativado nos próximos passos!" })}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25"
                >
                  <Sparkles className="w-5 h-5" />
                  Transcrever com IA
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPhotoUrl(null)}
                  className="w-full flex items-center justify-center gap-3 bg-secondary text-foreground py-4 rounded-2xl font-display font-bold"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Tirar outra foto
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}
