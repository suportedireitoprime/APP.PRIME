import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, FileText, Layers, Play } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import WizardFlashcardsIA from '@/components/flashcards/WizardFlashcardsIA';

// Placeholder for custom decks until backend is ready
const MOCK_DECKS = [
  { id: '1', nome: 'Resumo PDF Penal', data: 'Hoje', cards: 45, tipo: 'pdf' },
  { id: '2', nome: 'Aula Youtube - Direitos Políticos', data: 'Ontem', cards: 112, tipo: 'youtube' },
];

export default function FlashcardsPersonalizado() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    document.title = 'Personalizado | Flashcards';
  }, []);

  return (
    <div className="min-h-dvh bg-background pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(3rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader
          title="Decks Personalizados"
          subtitle="Gere flashcards a partir dos seus PDFs, áudios e vídeos"
          onBack={() => navigate('/flashcards')}
        />

        {/* Hero Section */}
        <div className="mt-4 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0f12] to-[#1a1d24] border border-white/10 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
            <Sparkles className="w-48 h-48 text-[#36AF85]" />
          </div>
          
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="bg-[#36AF85]/20 p-3 rounded-2xl">
              <Sparkles className="w-6 h-6 text-[#36AF85]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Estude com o seu <br />
                <span className="text-[#36AF85]">Próprio Material</span>
              </h2>
              <p className="text-sm text-white/60 mt-2 max-w-[280px] sm:max-w-md font-medium leading-relaxed">
                Nossa IA lê seus PDFs, assiste vídeos do YouTube e escuta seus áudios para criar Decks perfeitos para você.
              </p>
            </div>
            <Button
              onClick={() => { haptic.selection(); setWizardOpen(true); }}
              className="mt-2 bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold px-8 shadow-lg shadow-[#36AF85]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Deck com IA
            </Button>
          </div>
        </div>

        {/* List of Custom Decks */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Meus Decks</h3>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_DECKS.map((deck) => (
              <div 
                key={deck.id}
                className="group p-4 bg-card/60 border border-border/80 rounded-2xl hover:border-[#36AF85]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-muted rounded-xl">
                    {deck.tipo === 'pdf' ? <FileText className="w-5 h-5 text-muted-foreground" /> : <Play className="w-5 h-5 text-red-500" />}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-md">
                    {deck.data}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-base leading-tight mb-1">{deck.nome}</h4>
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {deck.cards} flashcards gerados
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <FlashcardsBottomNav />
      {wizardOpen && <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} />}
    </div>
  );
}
