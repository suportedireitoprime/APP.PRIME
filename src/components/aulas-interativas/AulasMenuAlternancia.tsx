import React from 'react';
import { Compass, CheckCircle2, Star, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AbaAulas = 'trilhas' | 'progresso' | 'favoritos' | 'estatisticas';

interface AulasMenuAlternanciaProps {
  abaAtiva: AbaAulas;
  onSelecionarAba: (aba: AbaAulas) => void;
  corDestaque?: string;
  totalFavoritos?: number;
  porcentagemGeral?: number;
}

export const AulasMenuAlternancia: React.FC<AulasMenuAlternanciaProps> = ({
  abaAtiva,
  onSelecionarAba,
  corDestaque = '#fbbf24',
  totalFavoritos = 0,
  porcentagemGeral = 0
}) => {
  const abas: { id: AbaAulas; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'trilhas', label: 'Trilhas', icon: Compass },
    { id: 'progresso', label: 'Progresso', icon: CheckCircle2, badge: porcentagemGeral > 0 ? `${porcentagemGeral}%` : undefined },
    { id: 'favoritos', label: 'Favoritos', icon: Star, badge: totalFavoritos > 0 ? totalFavoritos : undefined },
    { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <nav 
        className="relative grid grid-cols-4 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg"
        aria-label="Navegação de abas das aulas"
      >
        {abas.map((aba) => {
          const isActive = abaAtiva === aba.id;
          const Icon = aba.icon;

          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => onSelecionarAba(aba.id)}
              className={cn(
                "relative min-h-[46px] sm:min-h-[48px] px-1.5 sm:px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all duration-300 select-none",
                isActive 
                  ? "text-white shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `${corDestaque}20`,
                      borderColor: `${corDestaque}60`,
                      borderWidth: '1px'
                    }
                  : undefined
              }
            >
              <Icon 
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300",
                  isActive ? "scale-110" : "opacity-75"
                )}
                style={isActive ? { color: corDestaque } : undefined}
              />
              <span className="truncate">{aba.label}</span>

              {aba.badge !== undefined && (
                <span 
                  className={cn(
                    "hidden xs:inline-flex text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
                  )}
                  style={isActive ? { color: corDestaque } : undefined}
                >
                  {aba.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
