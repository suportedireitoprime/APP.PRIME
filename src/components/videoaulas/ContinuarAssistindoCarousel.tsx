import { useEffect, useMemo, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, PlayCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import {
  getCachedProgresso,
  getCachedAula,
  loadProgresso,
  subscribeVideoaulas,
} from '@/lib/videoaulasStore';
import { CATALOGOS, ytThumb, limparTitulo } from '@/lib/videoaulasCatalogos';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UltimaAula {
  video_id: string;
  tabela: string;
  percentual: number;
  concluida: boolean;
  titulo: string;
  area: string;
  thumb: string;
  catalogoId: string;
  slug: string;
}

export const ContinuarAssistindoCarousel = memo(function ContinuarAssistindoCarousel() {
  const navigate = useNavigate();
  const [ultimaAula, setUltimaAula] = useState<UltimaAula | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    
    const atualizarUltimaAula = () => {
      const progresso = getCachedProgresso();
      if (!progresso || progresso.length === 0) {
        if (alive) {
          setUltimaAula(null);
          setLoading(false);
        }
        return;
      }

      // Procura a aula mais recente não concluída, ou a última se todas estiverem concluídas
      let alvo = progresso.find((p) => !p.concluida) || progresso[0];
      
      let detalhesAula = null;
      let catalogoRef = null;

      // Buscar os detalhes no cache
      for (const cat of CATALOGOS) {
        if (cat.tabela === alvo.tabela) {
          const aulaCache = getCachedAula(cat.id, alvo.video_id);
          if (aulaCache) {
            detalhesAula = aulaCache;
            catalogoRef = cat;
            break;
          }
        }
      }

      if (detalhesAula && catalogoRef && alive) {
        setUltimaAula({
          video_id: alvo.video_id,
          tabela: alvo.tabela,
          percentual: alvo.percentual ?? 0,
          concluida: !!alvo.concluida,
          titulo: limparTitulo(detalhesAula.titulo),
          area: detalhesAula.area || catalogoRef.titulo,
          thumb: detalhesAula.thumb || detalhesAula.thumbnail || ytThumb(alvo.video_id, 'hq'),
          catalogoId: catalogoRef.id,
          slug: detalhesAula.area ? detalhesAula.area.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'todas',
        });
      }
      if (alive) setLoading(false);
    };

    // Tentar ler cache local primeiro
    atualizarUltimaAula();

    // Buscar banco de dados
    loadProgresso().then(() => {
      if (alive) atualizarUltimaAula();
    });

    const off = subscribeVideoaulas(() => {
      if (alive) atualizarUltimaAula();
    });

    return () => {
      alive = false;
      off();
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[180px] lg:h-[220px] bg-card/40 border border-border/50 rounded-3xl flex items-center justify-center animate-pulse mt-4 mb-8">
         <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!ultimaAula) {
    return null; // Nada recente para assistir
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative mt-4 mb-6 lg:mb-8"
    >
      <div className="flex items-center gap-2 mb-3 px-2 lg:px-0">
        <PlayCircle className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Continuar Assistindo</h2>
      </div>

      <div 
        onClick={() => {
          haptic.selection();
          navigate(`/videoaulas/${ultimaAula.catalogoId}/${ultimaAula.slug}/${ultimaAula.video_id}`);
        }}
        className="group relative w-full h-[180px] lg:h-[240px] rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer shadow-lg border border-white/10 isolate"
      >
        <img 
          src={ultimaAula.thumb} 
          alt={ultimaAula.titulo}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Gradiente escuro para garantir legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Gradiente hover */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />

        {/* Botão Play Flutuante - Centro */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 backdrop-blur-md transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
             <Play className="w-6 h-6 ml-1" fill="currentColor" />
           </div>
        </div>

        {/* Barra de Progresso Visível */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/60 backdrop-blur-sm z-20">
           <div 
             className={cn("h-full bg-primary transition-all duration-500", ultimaAula.concluida && "bg-emerald-500")}
             style={{ width: `${Math.max(2, Math.min(100, ultimaAula.percentual))}%` }}
           />
        </div>

        {/* Informações Inferiores */}
        <div className="absolute bottom-0 left-0 w-full p-4 lg:p-6 pb-6 z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-primary">
              {ultimaAula.area}
            </span>
            <h3 className="text-white font-bold text-sm lg:text-lg leading-snug line-clamp-2">
              {ultimaAula.titulo}
            </h3>
            {ultimaAula.concluida ? (
               <span className="text-[11px] font-medium text-emerald-400 mt-1">Concluída — Revisar</span>
            ) : (
               <span className="text-[11px] font-medium text-white/70 mt-1">{ultimaAula.percentual}% concluído</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ContinuarAssistindoCarousel;
