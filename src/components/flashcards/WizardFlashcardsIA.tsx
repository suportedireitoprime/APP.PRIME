import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Image as ImageIcon, Youtube, Mic, ArrowLeft, ArrowRight, Loader2, Sparkles, Check, X, SlidersHorizontal, UploadCloud } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface WizardFlashcardsIAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SourceType = 'pdf' | 'image' | 'youtube' | 'audio' | null;

export default function WizardFlashcardsIA({ open, onOpenChange }: WizardFlashcardsIAProps) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceType>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Step 3 results
  const [tema, setTema] = useState('');
  const [resumo, setResumo] = useState('');
  
  // Step 4
  const [qtdCards, setQtdCards] = useState(45);

  // Step 5
  const [deckName, setDeckName] = useState('');

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSource(null);
        setTema('');
        setResumo('');
        setDeckName('');
        setQtdCards(45);
      }, 300);
    }
  }, [open]);

  const handleSourceSelect = (s: SourceType) => {
    haptic.selection();
    setSource(s);
    setStep(2);
  };

  const handleSimulateAI = () => {
    haptic.selection();
    setStep(3);
    setLoadingAI(true);
    // Simulate AI processing
    setTimeout(() => {
      setTema('Direito Penal - Teoria do Crime');
      setResumo('O material aborda os elementos do fato típico, ilicitude e culpabilidade. Discute dolo, culpa, erro de tipo e excludentes de ilicitude segundo a jurisprudência dominante.');
      setQtdCards(38); // AI Suggestion
      setLoadingAI(false);
      haptic.notification('SUCCESS');
    }, 3500);
  };

  const handleSave = () => {
    haptic.notification('SUCCESS');
    onOpenChange(false);
    // Real implementation would save to DB here
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-border/80">
        <DialogTitle className="sr-only">Criar Flashcards com IA</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => { haptic.selection(); setStep(step - 1); }} className="p-1.5 hover:bg-muted rounded-full">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="font-bold text-foreground">
              {step === 1 && 'Escolha a Fonte'}
              {step === 2 && 'Envie o Material'}
              {step === 3 && 'Análise da IA'}
              {step === 4 && 'Plano de Estudo'}
              {step === 5 && 'Salvar Deck'}
            </h2>
          </div>
          {/* Default Dialog close button will be used instead of manual one */}
        </div>

        <div className="p-5 min-h-[350px] relative">
          <AnimatePresence mode="wait">
            {/* ETAPA 1: FONTE */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 gap-3"
              >
                <SourceCard icon={<FileText strokeWidth={1.2} className="w-7 h-7" />} title="Documento PDF" desc="Apostilas ou Leis" onClick={() => handleSourceSelect('pdf')} color="text-zinc-200" />
                <SourceCard icon={<Youtube strokeWidth={1.2} className="w-7 h-7" />} title="Vídeo YouTube" desc="Aulas e revisões" onClick={() => handleSourceSelect('youtube')} color="text-red-500" />
                <SourceCard icon={<Mic strokeWidth={1.2} className="w-7 h-7" />} title="Áudio" desc="Máx 1 hora" onClick={() => handleSourceSelect('audio')} color="text-purple-400" />
                <SourceCard icon={<ImageIcon strokeWidth={1.2} className="w-7 h-7" />} title="Imagens" desc="Fotos de resumos" onClick={() => handleSourceSelect('image')} color="text-emerald-400" />
              </motion.div>
            )}

            {/* ETAPA 2: UPLOAD */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full justify-center"
              >
                {source === 'youtube' ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Youtube className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Cole o link da videoaula. Nossa IA vai transcrever e gerar os cards.</p>
                    </div>
                    <Input placeholder="https://youtube.com/watch?v=..." className="bg-muted border-border/50 h-12" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="font-bold text-foreground">Toque para escolher o arquivo</p>
                    {source === 'audio' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: MP3, M4A, WAV (Max: 1h)</p>}
                    {source === 'pdf' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: PDF</p>}
                    {source === 'image' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: JPG, PNG</p>}
                  </div>
                )}
                
                <Button onClick={handleSimulateAI} className="mt-8 bg-[#36AF85] hover:bg-[#2b8c6a] text-white w-full rounded-full font-bold h-12 shadow-lg shadow-[#36AF85]/20">
                  <Sparkles className="w-4 h-4 mr-2" /> Extrair Conteúdo
                </Button>
              </motion.div>
            )}

            {/* ETAPA 3: PROCESSAMENTO IA E PRÉVIA */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center justify-center h-full text-center py-4"
              >
                {loadingAI ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-12 h-12 text-[#36AF85] animate-spin" />
                    <div>
                      <p className="font-bold text-lg">Analisando Material...</p>
                      <p className="text-xs text-muted-foreground mt-1">A IA está lendo e categorizando o conteúdo.</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-left space-y-4">
                    <div className="bg-[#36AF85]/10 border border-[#36AF85]/30 rounded-2xl p-4 flex gap-3">
                      <Sparkles className="w-5 h-5 text-[#36AF85] shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-[#36AF85] text-sm uppercase tracking-wider">Conteúdo Detectado</h3>
                        <p className="font-bold text-foreground mt-1 text-lg">{tema}</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{resumo}</p>
                      </div>
                    </div>
                    <Button onClick={() => { haptic.selection(); setStep(4); }} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12">
                      Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ETAPA 4: PLANO DE CARDS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#36AF85]/10 rounded-full flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8 text-[#36AF85]" />
                  </div>
                  <h3 className="font-bold text-xl">Plano de Geração</h3>
                  <p className="text-sm text-muted-foreground">Para cobrir 100% dos tópicos abordados no material, a IA sugere a criação de:</p>
                </div>
                
                <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col items-center">
                  <span className="text-5xl font-black text-foreground">{qtdCards}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Flashcards</span>
                  
                  <div className="flex items-center gap-4 mt-6 w-full">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => setQtdCards(Math.max(5, qtdCards - 5))}>-</Button>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#36AF85]" style={{ width: `${Math.min(100, (qtdCards/100)*100)}%` }} />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => setQtdCards(qtdCards + 5)}>+</Button>
                  </div>
                </div>

                <Button onClick={() => { haptic.selection(); setStep(5); }} className="w-full bg-primary text-white rounded-full font-bold h-12">
                  Aprovar Plano
                </Button>
              </motion.div>
            )}

            {/* ETAPA 5: FINALIZAR */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Nome do Deck</label>
                    <Input 
                      placeholder="Ex: Resumo de Direito Penal..." 
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="bg-muted border-border/50 h-12 font-medium" 
                    />
                  </div>
                </div>

                <div className="bg-[#36AF85]/10 border border-[#36AF85]/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#36AF85]" />
                    <span className="font-bold text-sm text-[#36AF85]">Geração Automática</span>
                  </div>
                  <span className="text-xs font-bold bg-[#36AF85] text-white px-2 py-0.5 rounded-md">{qtdCards} Cards</span>
                </div>

                <Button onClick={handleSave} disabled={!deckName.trim()} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12 shadow-lg shadow-[#36AF85]/20">
                  <Check className="w-4 h-4 mr-2" /> Gerar Deck
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SourceCard({ icon, title, desc, onClick, color }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string }) {
  return (
    <div 
      onClick={() => { haptic.selection(); onClick(); }}
      className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95"
    >
      <div className={`mb-1 ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
