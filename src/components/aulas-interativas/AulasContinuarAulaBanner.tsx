import React from 'react';
import { BookOpen, Play } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { haptic } from '@/lib/nativeHaptics';

interface AulasContinuarAulaBannerProps {
  aula: AulaItem;
  onIniciarAula: (aula: AulaItem) => void;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
}

export const AulasContinuarAulaBanner: React.FC<AulasContinuarAulaBannerProps> = React.memo(
  function AulasContinuarAulaBanner({ aula, onIniciarAula, calcularProgressoCiclo }) {
    const disc = DISCIPLINAS_CATALOGO.find((d) => d.id === aula.disciplinaId);
    const discTheme = getDisciplinaVisualTheme(aula.disciplinaId);
    const capaUrl = discTheme?.fundoAssetUrl || disc?.capaHeroUrl;

    const prog = calcularProgressoCiclo
      ? calcularProgressoCiclo(aula)
      : { etapaAtual: 1, totalEtapas: 4, porcentagemTotal: 25, aulaTerminada: false };

    const percent = Math.min(100, Math.max(1, prog.porcentagemTotal || 25));
    const discNome = disc?.nome?.replace(/^DIREITO\s+/i, '') || 'Direito';

    const handleClick = () => {
      try { haptic.selection(); } catch {}
      onIniciarAula(aula);
    };

    return (
      <div className="w-full select-none">
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/45">
            Continuar
          </span>
          <span className="text-[11px] font-mono text-white/45">
            Etapa {prog.etapaAtual} de {prog.totalEtapas}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[68px] flex items-center gap-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-white/20 p-3 text-left active:scale-[0.99] transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-white/10">
            {capaUrl ? (
              <img
                src={capaUrl}
                alt={aula.titulo}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white/50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-sans font-semibold text-sm text-white tracking-tight truncate">
              {aula.titulo}
            </h3>
            <p className="text-xs text-white/50 truncate mt-0.5">
              {discNome} · {percent}% concluído
            </p>
            <div className="w-full mt-2 bg-white/10 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </button>
      </div>
    );
  }
);

export default AulasContinuarAulaBanner;
