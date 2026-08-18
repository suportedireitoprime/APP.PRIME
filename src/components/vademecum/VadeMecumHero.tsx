import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing, Scale, BookOpen, Layers } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import brasaoImg from '@/assets/brasao-republica.webp';

interface Props {
  onBuscar: () => void;
}

const VadeMecumHero = ({ onBuscar }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl z-20 relative">
      {/* ── Cabeçalho Vade Mecum ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between">
        <button 
          onClick={() => { haptic.selection(); navigate('/'); }} 
          aria-label="Voltar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1">
          Vade Mecum
        </h1>

        <button 
          onClick={() => { haptic.selection(); navigate('/meus-lembretes'); }} 
          aria-label="Lembretes"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <BellRing className="h-5 w-5" />
        </button>
      </div>

      <section
        className="relative isolate overflow-hidden bg-hero-panel pb-1"
        aria-label="Painel Principal do Vade Mecum"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 w-[72px] h-[72px] rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.45)] logo-shine">
              <img
                src={brasaoImg}
                alt="Brasão da República"
                loading="eager"
                decoding="sync"
                className="w-[74%] h-[74%] object-contain drop-shadow-md"
              />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Busca Rápida</p>
              <h2 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px]">
                VADE MECUM
              </h2>
              <p className="mt-0.5 text-[12px] font-medium italic leading-snug text-white/80 sm:text-[13px]">
                Legislação Completa
              </p>
            </div>
          </div>

          {/* ── 3 Caixas de Métricas ────────────────── */}
          <div className="relative mt-4 rounded-2xl bg-black/85 text-white shadow-xl ring-1 ring-black/20 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {/* Box 1: Leis Totais */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <BookOpen className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Leis Totais</span>
                </div>
                <span className="mt-1 font-display text-base font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  25.000+
                </span>
              </div>

              {/* Box 2: Áreas */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <Layers className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Áreas</span>
                </div>
                <span className="mt-1 font-display text-base font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  40+
                </span>
              </div>

              {/* Box 3: Atualização */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <Scale className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Atualização</span>
                </div>
                <span className="mt-1 font-display text-[15px] font-black leading-none text-emerald-400 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  HOJE
                </span>
              </div>
            </div>
          </div>
        </div>

        <Scale className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 text-white/15" />
      </section>
    </div>
  );
};

export default VadeMecumHero;
