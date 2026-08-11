import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import q1 from '@/assets/questoes-hero/q-1.png';
import q2 from '@/assets/questoes-hero/q-2.png';
import q3 from '@/assets/questoes-hero/q-3.png';

const FIGURAS = [q1, q2, q3];

interface Props {
  /** % de retenção ou progresso na meta */
  pct?: number;
  /** cards revisados no total */
  total?: number;
  /** cards hoje */
  hoje?: number;
  /** total na meta */
  meta?: number;
  /** cards para hoje */
  disponiveis?: number;
}

/** Painel de Flashcards no topo da tela de Cargos (Prática Livre) */
const FlashcardsCargoHero = ({ pct = 0, total = 0, hoje = 0, meta = 100, disponiveis = 0 }: Props) => {
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setHeroIdx((i) => (i + 1) % FIGURAS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;

  return (
    <section
      className="relative isolate overflow-hidden border-b border-black/20"
      style={{ background: 'linear-gradient(135deg, hsl(350 68% 32%) 0%, hsl(350 74% 42%) 50%, hsl(348 80% 50%) 100%)' }}
      aria-label="Seu progresso em flashcards"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden sm:w-[34%]" aria-hidden="true">
        {FIGURAS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
            style={{ opacity: i === heroIdx ? 1 : 0, filter: 'brightness(0) invert(1)', mixBlendMode: 'soft-light' }}
          />
        ))}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#881427] via-[#881427]/60 to-transparent" />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.22)" strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="#fff"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-base font-black leading-none text-white">{pct}%</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">Retenção</span>
            </div>
          </div>

          <div className="min-w-0 max-w-[58%]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Hora de revisar</p>
            <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px]">
              Flashcards
              <span className="ml-2 font-display text-[15px] font-semibold italic text-white/75 sm:text-[20px]">
                inteligentes
              </span>
            </h1>
            <p
              className="mt-0.5 text-[12px] leading-snug text-white/80 sm:text-[13px]"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              Repetição espaçada com IA focada no seu edital.
            </p>
          </div>
        </div>

        <div className="relative mt-3 rounded-xl bg-black/85 text-white shadow-lg ring-1 ring-black/20">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            <Metric label="Hoje" value={hoje.toLocaleString('pt-BR')} sufixo=" cards" />
            <Metric label="Revisados" value={total.toLocaleString('pt-BR')} />
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Sua Meta</span>
              <span className="mt-0.5 font-display text-base font-black leading-none text-primary">
                {hoje.toLocaleString('pt-BR')}
                <span className="text-white/50">/{meta.toLocaleString('pt-BR')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <Layers className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 text-white/15" />
    </section>
  );
};

function Metric({ label, value, sufixo }: { label: string; value: string; sufixo?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">{label}</span>
      <span className="mt-0.5 font-display text-base font-black leading-none text-white">
        {value}
        {sufixo && <span className="text-[10px] font-bold text-white/60">{sufixo}</span>}
      </span>
    </div>
  );
}

export default FlashcardsCargoHero;
