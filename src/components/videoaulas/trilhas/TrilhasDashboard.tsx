import { useNavigate } from 'react-router-dom';
import { Plus, Target, Trash2, Route as RouteIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { getCapaDaArea } from '@/lib/videoaulasCatalogos';
import { useTrilhaStore } from '@/lib/trilhasStore';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';
import { toast } from '@/hooks/use-toast';
import type { ConcursoRow } from '@/lib/videoaulasStore';

interface TrilhasDashboardProps {
  concursos: ConcursoRow[];
  onCreateNova: () => void;
  onOpenEdital: () => void;
}

export const TrilhasDashboard = ({
  concursos,
  onCreateNova,
  onOpenEdital,
}: TrilhasDashboardProps) => {
  const navigate = useNavigate();
  const { trilhaAtiva, limparTrilha } = useTrilhaStore();
  const { trilhasAtivas, limparAreaTrilha } = useAreaTrilhaStore();

  const areasArray = Object.values(trilhasAtivas);
  const editalConcurso = trilhaAtiva ? concursos.find((c) => c.id === trilhaAtiva.editalId) : null;
  const editalCapa = editalConcurso?.capa;

  const handleDeleteTrilha = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.medium();
    limparTrilha();
    toast({ title: 'Trilha apagada', description: 'Seu cronograma de edital foi removido.' });
  };

  const handleDeleteAreaTrilha = (e: React.MouseEvent | React.PointerEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.medium();
    limparAreaTrilha(slug);
    toast({ title: 'Trilha apagada', description: 'A trilha de disciplina foi removida.' });
  };

  return (
    <div className="w-full flex flex-col pt-6 px-4 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground">Suas Trilhas</h2>
          <p className="text-sm text-muted-foreground">Continue de onde parou</p>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            onCreateNova();
          }}
          aria-label="Criar nova trilha"
          className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors p-3 rounded-full"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Cartão da Trilha de Edital (Global) */}
        {trilhaAtiva && (
          <div className="relative w-full overflow-hidden rounded-3xl shadow-lg border border-primary/20 bg-primary/5 hover:border-primary/50 transition-all active:scale-[0.98]">
            {editalCapa && (
              <img
                src={editalCapa}
                alt=""
                aria-hidden
                className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 mix-blend-screen pointer-events-none"
              />
            )}
            <div className="w-full flex items-stretch">
              <div
                onClick={() => {
                  haptic.light();
                  onOpenEdital();
                }}
                className="flex-1 cursor-pointer flex flex-col text-left p-4 relative z-10 pr-2"
              >
                <div className="flex items-start justify-between mb-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Edital Completo</p>
                      <p className="text-[13px] leading-snug font-bold text-foreground line-clamp-2">
                        {editalConcurso?.titulo || 'Edital'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {trilhaAtiva.diasMeta * 2} aulas • {trilhaAtiva.diasMeta} dias
                    </p>
                    <p className="text-[10px] font-bold text-primary">
                      {Math.round((trilhaAtiva.diasConcluidos.length / trilhaAtiva.diasMeta) * 100)}%
                    </p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((trilhaAtiva.diasConcluidos.length / trilhaAtiva.diasMeta) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-start justify-end p-4 relative z-30">
                <button
                  type="button"
                  onClick={handleDeleteTrilha}
                  aria-label="Apagar trilha de edital"
                  className="p-2.5 bg-black/50 text-white/70 hover:bg-red-500/30 hover:text-red-400 active:bg-red-600/40 active:text-red-300 rounded-full transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cartões das Trilhas de Disciplina (Área) */}
        {areasArray.map((areaTrilha) => {
          const capaArea = getCapaDaArea(areaTrilha.areaName);
          return (
            <div
              key={areaTrilha.areaSlug}
              className="relative w-full overflow-hidden rounded-3xl shadow-lg border border-border/40 bg-card hover:border-white/20 transition-all active:scale-[0.98]"
            >
              <div className="w-full flex items-stretch">
                <div
                  onClick={() => {
                    haptic.light();
                    navigate(`/videoaulas/${areaTrilha.catalogoId}/${areaTrilha.areaSlug}`, { state: { tab: 'trilhas' } });
                  }}
                  className="flex-1 cursor-pointer flex flex-col text-left p-4 relative z-10 pr-2"
                >
                  <div className="flex items-start justify-between mb-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {capaArea ? (
                          <img src={capaArea} alt={areaTrilha.areaName} className="w-full h-full object-cover" />
                        ) : (
                          <RouteIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Disciplina</p>
                        <p className="text-[13px] leading-snug font-bold text-foreground line-clamp-2">
                          {areaTrilha.areaName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {areaTrilha.diasMeta * 2} aulas • {areaTrilha.diasMeta} dias
                      </p>
                      <p className="text-[10px] font-bold text-primary">
                        {Math.round((areaTrilha.diasConcluidos.length / areaTrilha.diasMeta) * 100)}%
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.round((areaTrilha.diasConcluidos.length / areaTrilha.diasMeta) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-start justify-end p-4 relative z-30">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteAreaTrilha(e, areaTrilha.areaSlug)}
                    aria-label={`Apagar trilha de ${areaTrilha.areaName}`}
                    className="p-2.5 bg-black/50 text-white/70 hover:bg-red-500/30 hover:text-red-400 active:bg-red-600/40 active:text-red-300 rounded-full transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
