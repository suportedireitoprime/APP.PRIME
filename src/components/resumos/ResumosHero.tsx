import { memo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, NotebookPen } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  totalResumos?: number;
  totalAreas?: number;
  totalTemas?: number;
}

const METODO_INFO: Record<string, { badge: string; title: string; subtitle: string; desc: string }> = {
  conceitos: {
    badge: 'RESUMO CONCEITUAL',
    title: 'CONCEITUAL',
    subtitle: 'Sínteses diretas',
    desc: 'Conceitos essenciais organizados por tópicos para revisão ágil.',
  },
  cornell: {
    badge: 'MÉTODO CORNELL',
    title: 'CORNELL',
    subtitle: 'Notas & Palavras-chave',
    desc: 'Coluna de pistas, anotações estruturadas e síntese final.',
  },
  feynman: {
    badge: 'MÉTODO FEYNMAN',
    title: 'FEYNMAN',
    subtitle: 'Explicação simples',
    desc: 'Aprenda qualquer instituto jurídico como se explicasse a um iniciante.',
  },
};

const ResumosHero = ({
  totalResumos = 4694,
  totalAreas = 30,
  totalTemas = 531,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const metodo = searchParams.get('metodo') || '';
  const isMapas =
    location.pathname.startsWith('/mapas-mentais') ||
    location.pathname.startsWith('/visuais') ||
    location.pathname.startsWith('/mapas');

  const info = METODO_INFO[metodo];

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* Cabeçalho Nativo Minimalista (estilo QuestoesHero) */}
      <div className="bg-zinc-950 px-4 pb-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex items-center justify-between border-b border-white/5">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            navigate('/');
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar para o início"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h1 className="font-display text-[17px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11 truncate">
          {isMapas ? 'MAPAS MENTAIS' : info ? info.badge : 'RESUMOS'}
        </h1>
      </div>

      {/* Painel Principal Minimalista (estilo QuestoesHero) */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Resumos"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-zinc-900 to-zinc-950 -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.45),transparent_65%)]" />

        <NotebookPen
          className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.06] pointer-events-none"
          strokeWidth={1.2}
        />

        <div className="relative z-10 px-5 pt-5 pb-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-[62px] h-[62px] rounded-2xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0 shadow-lg backdrop-blur-sm">
              <BookOpen className="w-7 h-7 text-emerald-300" strokeWidth={1.9} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {isMapas ? 'ESQUEMAS VISUAIS' : info ? info.badge : 'REVISÃO ATIVA'}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide mt-1 leading-tight">
                {isMapas ? 'MAPAS' : 'RESUMOS'}{' '}
                <span className="font-light text-emerald-300">
                  {isMapas ? 'MENTAIS' : info ? info.title : 'JURÍDICOS'}
                </span>
              </h2>
              <p className="text-xs text-white/75 line-clamp-1 mt-0.5">
                {info ? info.desc : 'Sínteses conceituais, Cornell e Feynman organizados por matéria.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Métricas na Barra Inferior */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="py-3 px-2 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-white/60">
              RESUMOS
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalResumos.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="py-3 px-2 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-white/60">
              MATÉRIAS
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalAreas.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="py-3 px-2 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-white/60">
              TEMAS
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalTemas.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(ResumosHero);
