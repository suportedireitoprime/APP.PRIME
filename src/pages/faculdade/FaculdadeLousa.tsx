import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Camera as CameraIcon, Upload, ScanText, RefreshCcw, Sparkles, Plus, X, BookOpen, Calendar, User, ArrowRight, Loader2, CheckCircle2, CropIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

type FlowStep = 'METADATA' | 'CAPTURE' | 'CROP' | 'PROCESSING' | 'RESULT';

const PROCESSING_STEPS = [
  "Enviando imagens em alta resolução...",
  "Analisando caligrafia e estruturando...",
  "Limpando ruídos visuais...",
  "Gerando resumo inteligente...",
  "Finalizando documento..."
];

export default function FaculdadeLousa() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('METADATA');
  
  // Metadados
  const [materia, setMateria] = useState('');
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [professor, setProfessor] = useState('');
  
  // Imagens
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Crop UI
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const imgRef = useRef<HTMLImageElement>(null);

  // Processamento
  const [procIndex, setProcIndex] = useState(0);

  const captureImage = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        quality: 100, // Máxima qualidade
        allowEditing: false, 
        resultType: CameraResultType.Uri,
        source: source,
      });

      let newPhoto = '';
      if (image.webPath) {
        newPhoto = image.webPath;
      } else if (image.path) {
        newPhoto = Capacitor.convertFileSrc(image.path);
      }
      
      if (newPhoto) {
        setTempPhotoUrl(newPhoto);
        setStep('CROP');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('User cancelled')) return;
      toast({
        title: "Erro na Câmera",
        description: "Não foi possível acessar a câmera ou galeria.",
        variant: "destructive"
      });
    }
  };

  const applyCrop = () => {
    if (!imgRef.current || !crop.width || !crop.height) {
      setPhotos(prev => [...prev, tempPhotoUrl]);
      setStep('CAPTURE');
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );
      
      const croppedBase64 = canvas.toDataURL('image/jpeg');
      setPhotos(prev => [...prev, croppedBase64]);
    } else {
      setPhotos(prev => [...prev, tempPhotoUrl]);
    }
    setStep('CAPTURE');
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = async () => {
    if (photos.length === 0) {
      toast({ title: "Atenção", description: "Adicione ao menos uma foto do quadro." });
      return;
    }
    
    setStep('PROCESSING');
    setProcIndex(0);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Faça login para salvar lousas.");

      const { mediaSyncQueue } = await import('@/services/mediaSyncQueue');
      const { syncQueue } = await import('@/services/syncQueue');
      
      const aulaId = crypto.randomUUID();
      const dataIso = new Date().toISOString();
      const finalTitle = materia.trim() || `Lousa ${new Date().toLocaleDateString('pt-BR')}`;
      
      // 1. Queue the main Aula row
      await syncQueue.enqueue({
        kind: 'table.insert',
        table: 'aulas',
        values: {
          id: aulaId,
          user_id: user.id,
          titulo: finalTitle,
          professor: professor.trim() || null,
          data: dataIso,
          duracao_seg: 0,
          status: 'processando',
          gratuita: false
        }
      });

      // 2. Queue each photo
      for (let i = 0; i < photos.length; i++) {
        const url = photos[i];
        
        // Fetch the blob from the local blob URL or convert capacitor file src
        let blob: Blob;
        if (url.startsWith('blob:') || url.startsWith('http')) {
          const res = await fetch(url);
          blob = await res.blob();
        } else {
          // If it's a native path, we must read it. Capacitior Filesystem.
          // But webPath should be a local blob anyway since CameraResultType.Uri gives webPath.
          const res = await fetch(url);
          blob = await res.blob();
        }

        const ext = blob.type.split('/')[1] || 'jpeg';
        const filePath = `${user.id}/${aulaId}/${i}.${ext}`;
        const midiaId = crypto.randomUUID();

        const payload = {
          id: midiaId,
          user_id: user.id,
          aula_id: aulaId,
          tipo: 'imagem_lousa',
          ordem: i,
          storage_path: filePath,
          mime: blob.type,
          bytes: blob.size,
          created_at: dataIso
        };

        await mediaSyncQueue.enqueue(
          blob,
          'aulas-lousas', // The bucket must exist, or we use an existing one
          filePath,
          'aula_midias',
          payload
        );
      }
      
      // Animate progress then show result
      const interval = setInterval(() => {
        setProcIndex(prev => {
          if (prev >= PROCESSING_STEPS.length - 1) {
            clearInterval(interval);
            setTimeout(() => setStep('RESULT'), 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 500);

    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      setStep('METADATA');
    }
  };

  useEffect(() => {
    // Only cleanup intervals if unmounted
  }, []);

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Lousa Scanner" 
        subtitle={step === 'METADATA' ? 'Nova captura' : step === 'CAPTURE' ? 'Fotos da Lousa' : step === 'PROCESSING' ? 'Processando' : 'Sucesso'} 
        onBack={() => step === 'METADATA' ? navigate('/') : step === 'RESULT' ? navigate('/') : setStep(step === 'CAPTURE' ? 'METADATA' : 'CAPTURE')} 
      />
      
      <div className="flex-1 p-6 flex flex-col w-full max-w-md mx-auto relative">
        <AnimatePresence mode="wait">
          
          {step === 'METADATA' && (
            <motion.div 
              key="metadata"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 self-center shadow-sm border border-blue-500/20">
                <ScanText className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground text-center mb-2">
                Sobre a Aula
              </h2>
              <p className="font-body text-sm text-muted-foreground text-center mb-8 px-4 leading-relaxed">
                Preencha os dados abaixo para a IA organizar seu resumo automaticamente.
              </p>

              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Matéria / Assunto</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      value={materia}
                      onChange={e => setMateria(e.target.value)}
                      placeholder="Ex: Direito Penal - Recursos"
                      className="w-full pl-11 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-2xl font-body text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Data da Aula</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="date"
                      value={dataAula}
                      onChange={e => setDataAula(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-2xl font-body text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">Professor(a) <span className="text-muted-foreground/50 lowercase font-normal">(Opcional)</span></label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      value={professor}
                      onChange={e => setProfessor(e.target.value)}
                      placeholder="Nome do professor"
                      className="w-full pl-11 pr-4 py-3.5 bg-secondary/50 border border-border/50 rounded-2xl font-body text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!materia.trim() || !dataAula}
                onClick={() => setStep('CAPTURE')}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                Avançar para Fotos
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {step === 'CROP' && tempPhotoUrl && (
            <motion.div 
              key="crop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full items-center"
            >
              <h3 className="font-display font-bold text-xl mb-2">Ajuste o Quadro</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Recorte as bordas da lousa para melhorar a precisão da IA.
              </p>
              
              <div className="flex-1 w-full bg-black/5 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                  <img 
                    ref={imgRef}
                    src={tempPhotoUrl} 
                    alt="Cortar" 
                    className="max-h-[50vh] object-contain"
                  />
                </ReactCrop>
              </div>

              <div className="flex gap-3 w-full mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('CAPTURE')}
                  className="flex-1 py-4 rounded-2xl bg-secondary text-secondary-foreground font-display font-bold"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={applyCrop}
                  className="flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/25"
                >
                  <CropIcon className="w-5 h-5" /> Confirmar
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'CAPTURE' && (
            <motion.div 
              key="capture"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="flex-1 flex flex-col">
                <h3 className="font-display font-bold text-xl mb-4">Fotos do Quadro</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => captureImage(CameraSource.Camera)}
                    className="flex flex-col items-center justify-center gap-2 aspect-square rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <CameraIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-display font-bold text-sm text-primary">Tirar Foto</span>
                  </motion.button>
                  
                  {photos.map((url, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-3xl border border-border/50 overflow-hidden shadow-sm"
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-white tracking-widest">{i + 1}/{photos.length}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {photos.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => captureImage(CameraSource.Photos)}
                    className="w-full py-3 mb-6 flex items-center justify-center gap-2 rounded-xl bg-secondary/80 text-sm font-bold text-foreground border border-border/50"
                  >
                    <Upload className="w-4 h-4" /> Importar mais da galeria
                  </motion.button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={photos.length === 0}
                onClick={startProcessing}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none mt-auto"
              >
                <Sparkles className="w-5 h-5" />
                Transcrever {photos.length} foto{photos.length !== 1 ? 's' : ''}
              </motion.button>
            </motion.div>
          )}

          {step === 'PROCESSING' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-20"
            >
              <div className="relative mb-12">
                <div className="w-32 h-32 rounded-full border-4 border-secondary/50 flex items-center justify-center relative z-10 bg-background">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <motion.div 
                  className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Decorative floating pulses */}
                <motion.div 
                  className="absolute -inset-4 bg-primary/20 rounded-full z-0 blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <motion.h3 
                key={procIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-bold text-xl text-foreground mb-3"
              >
                {PROCESSING_STEPS[procIndex]}
              </motion.h3>
              
              <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((procIndex + 1) / PROCESSING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {step === 'RESULT' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-10"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              
              <h2 className="font-display font-bold text-2xl mb-2 text-foreground">Transcrição Concluída!</h2>
              <p className="font-body text-muted-foreground mb-8 px-4">
                O resumo inteligente de <strong>{materia}</strong> foi gerado e salvo nos seus Resumos da Faculdade.
              </p>

              <div className="space-y-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/faculdade/resumos')}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25"
                >
                  <BookOpen className="w-5 h-5" />
                  Ver Resumo
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setPhotos([]);
                    setStep('METADATA');
                  }}
                  className="w-full flex items-center justify-center py-4 rounded-2xl font-display font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Capturar nova lousa
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
