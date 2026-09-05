import { motion } from 'framer-motion';
import { Headphones, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import type { LeiConfig } from '../data/leiSecaConfig';

export interface ArtigoLeiSeca {
  id: string;
  numero: string;
  texto: string;
  audio_pilula_url: string | null;
  ordem?: number;
}

interface PilulaLeiSecaItemProps {
  artigo: ArtigoLeiSeca;
  navigate: (path: string) => void;
  config: LeiConfig;
}

export function PilulaLeiSecaItem({ artigo, navigate, config }: PilulaLeiSecaItemProps) {
  const temAudio = Boolean(artigo.audio_pilula_url);
  
  const wordCount = (artigo.texto || '').split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 130));
  const savedProgress = localStorage.getItem(`pilula_progress_${artigo.id}`);
  const progressRatio = savedProgress ? parseFloat(savedProgress) : 0;
  
  const displayTime = `~${estimatedMinutes} min`;

  return (
    <motion.button
      whileHover={temAudio ? { scale: 1.01 } : {}}
      whileTap={temAudio ? { scale: 0.98 } : {}}
      onClick={() => {
        haptic.selection();
        if (!temAudio) {
          toast('Pílula em produção', {
            description: 'O áudio para este artigo estará disponível em breve.',
            icon: <AlertCircle className="w-4 h-4 text-amber-500" />
          });
          return;
        }
        navigate(`/pilulas/${artigo.id}?type=${config.slug}`);
      }}
      className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border text-left overflow-hidden transition-all ${
        temAudio
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed grayscale-[0.5]'
      }`}
    >
      {/* Capa */}
      <div className="w-16 h-24 rounded-lg bg-white/5 shrink-0 overflow-hidden shadow-md">
        <img 
          src={config.cover} 
          alt={config.title} 
          className="w-full h-full object-cover" 
          loading="eager" 
          fetchPriority="high"
          decoding="async"
          onError={(e) => { 
            e.currentTarget.src = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop'; 
          }} 
        />
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-1">
        <h3 className={`font-semibold text-base leading-tight truncate ${temAudio ? 'text-white' : 'text-white/60'}`}>
          Artigo {artigo.numero}
        </h3>
        <p className="text-xs text-white/50 mt-1 truncate">{config.title}</p>

        <div className="mt-auto pt-3">
          {temAudio ? (
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${config.colorClasses} group-hover:bg-white/10`}>
                  <Headphones className="w-3 h-3" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${config.textColorClass}`}>
                  {progressRatio > 0.95 ? 'Concluída' : progressRatio > 0 ? 'Continuar' : 'Ouvir Pílula'}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-medium text-white/40">
                  {displayTime}
                </span>
                {progressRatio > 0 && (
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${config.progressColorClass} rounded-full`} 
                      style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }} 
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                Em breve
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
