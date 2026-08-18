import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { readLeituraProgress } from '@/lib/leituraProgress';
import { pullLeituraProgress } from '@/lib/leituraProgressSync';
import { subscribeTracking, pullBibliotecaTracking } from '@/lib/bibliotecaTracking';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

export default function ContinueLendoCard() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeTracking(() => setTick((t) => t + 1));
    void pullBibliotecaTracking().then(() => setTick((t) => t + 1));
    void pullLeituraProgress().then(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const ultimoLido = useMemo(() => {
    const lendo = readLeituraProgress(tick);
    return lendo.length > 0 ? lendo[0] : null;
  }, [tick]);

  if (!ultimoLido) return null;

  const { snap, percent, index, total } = ultimoLido;

  const handleAbrir = () => {
    if (snap.colecaoId === 'vade-mecum' || snap.area) {
      // Normal legislation
      const slug = leiToSlug({ id: snap.id, nome: snap.titulo });
      navigate(`/legislacao/${tipoToSlug(snap.area || 'lei-ordinaria')}/${slug}`);
    } else {
      // Fallback or custom logic, probably PDF
      if (snap.download || snap.link) {
        // Not a standard vade-mecum law, could be PDF, but we don't have direct PDF routing here.
        // Usually, the app handles this with a modal, but let's navigate to the library if needed.
        // For now, assume it's a generic law or we dispatch an event.
        // A simple fallback is to just navigate to the category
        navigate(`/legislacao/${tipoToSlug(snap.area || 'cat-federais')}`);
      }
    }
  };

  const isPdf = snap.download?.endsWith('.pdf');

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Continue de onde parou
        </h3>
      </div>
      <button
        onClick={handleAbrir}
        className="w-full relative overflow-hidden group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/50 shadow-sm transition-all active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50 flex items-center justify-center relative z-10">
          {snap.capa ? (
            <img src={snap.capa} alt={snap.titulo} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 text-left relative z-10">
          <p className="font-display text-[15px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
            {snap.titulo}
          </p>
          <p className="font-body text-[12px] text-muted-foreground mt-0.5 truncate">
            {snap.autor || (isPdf ? 'Material de Estudo' : 'Legislação')}
          </p>
          
          {typeof percent === 'number' && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${Math.max(2, Math.min(100, percent))}%` }} 
                />
              </div>
              <span className="text-[10px] font-bold text-primary shrink-0 w-8 text-right">
                {Math.round(percent)}%
              </span>
            </div>
          )}
        </div>
        
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 relative z-10" />
      </button>
    </div>
  );
}
