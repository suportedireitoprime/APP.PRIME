import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Quote, Library, GraduationCap } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { FlashcardsTermosFiltro, TermoTipo } from '@/components/flashcards/FlashcardsTermosFiltro';

const TERMOS_TIPOS: TermoTipo[] = [
  { id: 'principios', label: 'Princípios Jurídicos', desc: 'Princípios fundamentais de cada matéria', icon: Library, color: 'text-amber-500', keywords: ['princípio', 'principios', 'principio'] },
  { id: 'conceitos', label: 'Conceitos e Teorias', desc: 'Definições, conceitos e teorias doutrinárias', icon: GraduationCap, color: 'text-blue-500', keywords: ['conceito', 'teoria', 'definição'] },
  { id: 'latim', label: 'Termos em Latim', desc: 'Expressões e brocardos jurídicos em latim', icon: Quote, color: 'text-purple-500', keywords: ['latim', 'brocardo', 'expressão'] }
];

export default function FlashcardsTermos() {
  const navigate = useNavigate();
  const [tipoSelecionado, setTipoSelecionado] = useState<TermoTipo | null>(null);

  useEffect(() => {
    document.title = 'Flashcards Termos | Vade Mecum PRIME';
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader 
        title="Termos e Conceitos" 
        onBack={() => {
          navigate('/flashcards');
        }} 
      />
      
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl px-3 sm:px-6 lg:px-8 mt-4">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Quote className="w-6 h-6 text-[#36AF85]" />
            Termos e Teorias
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione qual formato de teoria ou conceito você deseja estudar agora.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {TERMOS_TIPOS.map(tipo => (
            <button
              key={tipo.id}
              onClick={() => {
                haptic.selection?.();
                setTipoSelecionado(tipo);
              }}
              className="flex flex-col items-center justify-center p-5 sm:p-6 bg-card border border-border/80 rounded-3xl hover:border-[#36AF85]/50 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground group-hover:text-[#36AF85] group-hover:bg-[#36AF85]/10 transition-colors">
                <tipo.icon className={`w-7 h-7 ${tipo.color}`} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground text-center line-clamp-2">{tipo.label}</h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 text-center line-clamp-1">{tipo.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <FlashcardsTermosFiltro 
        open={!!tipoSelecionado} 
        onOpenChange={(v) => !v && setTipoSelecionado(null)} 
        tipo={tipoSelecionado} 
      />
    </div>
  );
}
