import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { getFasePorDisciplina } from '@/data/aulasTrilhasCronologicas';
import { haptic } from '@/lib/nativeHaptics';

interface AulasMateriaCardProps {
  disciplina: DisciplinaItem;
  totalAulas: number;
  concluidas?: number;
  pct?: number;
  index: number;
  onClick: () => void;
}

export const AulasMateriaCard: React.FC<AulasMateriaCardProps> = React.memo(function AulasMateriaCard({
  disciplina,
  totalAulas,
  concluidas = 0,
  pct = 0,
  index,
  onClick,
}) {
  const visualTheme = getDisciplinaVisualTheme(disciplina.id);
  const capaUrl = visualTheme?.fundoAssetUrl || disciplina.capaHeroUrl;
  const corTema = visualTheme?.primary || disciplina.corDestaque || '#0d9488';
  const fase = getFasePorDisciplina(disciplina.id);

  const pctReal = Math.min(100, Math.max(0, pct));
  const numeroIndice = (index + 1).toString().padStart(2, '0');

  return (
    <div
      onClick={() => {
        try { haptic.selection(); } catch {}
        onClick();
      }}
      className="group rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-emerald-500/40 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-md p-3.5 sm:p-4 flex items-center justify-between gap-3.5 cursor-pointer active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Capa com Índice da Matéria igual ao modelo minimalista de Áudio Aulas */}
        <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-zinc-950">
          <img
            src={capaUrl}
            alt={disciplina.nome}
            loading={index < 8 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
          <span 
            className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8.5px] font-black leading-none shadow font-sans"
            style={{ color: corTema }}
          >
            {numeroIndice}
          </span>
        </div>

        {/* Informações da Matéria */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="font-sans font-bold text-[15px] sm:text-base text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-normal leading-snug truncate">
              {disciplina.nome}
            </h3>
            {fase && (
              <span 
                className="px-2 py-0.5 rounded-full text-[9.5px] font-semibold border hidden xs:inline-flex items-center"
                style={{
                  color: fase.accentColor,
                  backgroundColor: fase.badgeBg,
                  borderColor: `${fase.accentColor}35`,
                }}
              >
                Fase {fase.faseNumero}
              </span>
            )}
          </div>

          <p className="text-[11.5px] text-zinc-400 font-sans flex items-center gap-2">
            <span>{totalAulas} {totalAulas === 1 ? 'aula interativa' : 'aulas interativas'}</span>
            {disciplina.subtitulo && (
              <span className="text-zinc-500 hidden sm:inline">• {disciplina.subtitulo}</span>
            )}
          </p>

          {/* Barra de Progresso Minimalista da Matéria */}
          <div className="mt-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-1 font-sans">
              <span>
                {concluidas > 0 ? `${concluidas} de ${totalAulas} concluídas` : 'Disponível na trilha'}
              </span>
              <span className="font-bold font-mono" style={{ color: corTema }}>{pctReal}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-400"
                style={{ 
                  width: `${Math.max(pctReal === 0 ? 0 : 5, pctReal)}%`,
                  background: `linear-gradient(90deg, ${corTema} 0%, #2dd4bf 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seta de Acesso */}
      <div className="shrink-0 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all pl-1">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
});
