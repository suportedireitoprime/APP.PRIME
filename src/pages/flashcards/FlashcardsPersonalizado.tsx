import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Plus, FileText, Layers, Play } from 'lucide-react';
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
    <div className="min-h-dvh bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader
          title="Decks Personalizados"
          subtitle="Gere flashcards a partir dos seus PDFs, áudios e vídeos"
          onBack={() => navigate('/flashcards')}
        />

        {/* List of Custom Decks */}
        <div className="mt-6">
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

      {/* Botão Flutuante (FAB) */}
      <button
        onClick={() => { haptic.selection(); setWizardOpen(true); }}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-6 z-50 w-14 h-14 bg-[#36AF85] hover:bg-[#2b8c6a] rounded-full flex items-center justify-center shadow-lg shadow-[#36AF85]/30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {wizardOpen && <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} />}
    </div>
  );
}
