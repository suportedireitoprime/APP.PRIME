import { useEffect, useState } from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import imgCorrida from '@/assets/audioleis/ouvindo-corrida.jpg';
import imgCarro from '@/assets/audioleis/ouvindo-carro.jpg';
import imgCozinha from '@/assets/audioleis/ouvindo-cozinha.jpg';
import imgMetro from '@/assets/audioleis/ouvindo-metro.jpg';
import imgCaminhada from '@/assets/audioleis/ouvindo-caminhada.jpg';
import imgAcademia from '@/assets/audioleis/ouvindo-academia.jpg';

const IMAGENS = [imgCorrida, imgMetro, imgCozinha, imgCarro, imgCaminhada, imgAcademia];

interface Props {
  onBack: () => void;
  totalCount?: number;
}

/** Painel do topo das Audioleis — mesmo formato do painel do início, em azul. */
export default function AudioleisHero({ onBack, totalCount }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % IMAGENS.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] z-20 bg-[#050a18]">
      <div className="relative h-[260px] sm:h-[300px]">
        {/* Capa rotativa à direita */}
        {IMAGENS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            width={1024}
            height={768}
            loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover object-[70%_center] translate-x-[18%] transition-opacity duration-[1400ms] ease-in-out"
            style={{ opacity: i === idx ? 1 : 0 }}
          />
        ))}

        {/* Painel azul diagonal */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 52% 0, 40% 100%, 0% 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0b1433]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.28),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
          </div>
        </div>

        <button
          onClick={onBack}
          aria-label="Voltar"
          className="absolute z-20 top-4 left-4 grid w-11 h-11 place-items-center rounded-full bg-black/40 border border-white/15 text-white backdrop-blur-md active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>

        {/* Marca */}
        <div className="absolute z-10 inset-y-0 left-0 w-[46%] max-w-[220px] flex flex-col items-center justify-center text-center pl-3 pt-6">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-white/10 border border-white/25 shadow-[0_10px_25px_rgba(0,0,0,0.5)] mb-2">
            <Headphones className="w-8 h-8 text-blue-100" strokeWidth={1.8} />
          </div>
          <h1
            className="text-white text-[30px] sm:text-[36px] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
            style={{ fontFamily: '"Playfair Display", "Literata", Georgia, serif', fontStyle: 'italic', fontWeight: 600 }}
          >
            Audioleis
          </h1>
          <p className="text-blue-100/95 text-[9px] sm:text-[10px] font-bold tracking-[0.28em] uppercase mt-2">
            Narrações oficiais
          </p>
          <div className="mt-3 flex items-center text-left gap-2">
            <div className="w-[2px] h-7 bg-white/40 rounded-full" />
            <p className="italic text-white/80 text-[11px] leading-tight" style={{ fontFamily: '"Literata", Georgia, serif' }}>
              A lei no seu ouvido,<br />onde você estiver.
            </p>
          </div>
          {totalCount ? (
            <p className="mt-2 text-[10px] text-blue-100/70">{totalCount} artigos narrados</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
