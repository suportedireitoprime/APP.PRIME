import React from 'react';
import { Headphones, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { capaDaArea } from '@/lib/audioaulasHelper';
import { CapaOtimizada } from './CapaOtimizada';

interface AudioaulasGridAreasProps {
  areas: [string, number][];
}

export const AudioaulasGridAreas = React.memo(function AudioaulasGridAreas({ areas }: AudioaulasGridAreasProps) {
  const navigate = useNavigate();

  if (areas.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 space-y-8 mt-4 lg:px-10 2xl:max-w-[1600px]">
        <div className="rounded-2xl bg-white/[0.04] p-10 text-center border border-white/10">
          <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 space-y-8 mt-4 lg:px-10 2xl:max-w-[1600px]">
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Áreas do Direito</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {areas.map(([nome, total]) => (
            <button
              key={nome}
              onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
              className="group relative aspect-square rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/20 border border-white/10 active:scale-95"
            >
              <CapaOtimizada
                src={capaDaArea(nome)}
                alt={nome}
                animacaoEntrada
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                <span className="self-start h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/40">
                  <Headphones className="h-5 w-5" />
                </span>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold leading-tight text-white text-sm sm:text-base truncate">
                      {nome}
                    </p>
                    <p className="text-[11px] text-zinc-300">{total} aula(s)</p>
                  </div>
                  <span className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/20 text-white backdrop-blur group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
});
