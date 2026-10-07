import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import img1 from '@/assets/paywall/01_justiça_em_cena_no_tribunal.webp';
import img2 from '@/assets/paywall/02_justiça_e_constituição_do_brasil.webp';
import img3 from '@/assets/paywall/03_justiça_para_todos_os_trabalhadores.webp';
import img4 from '@/assets/paywall/04_justiça_tributária_em_verde_e_ouro.webp';
import img5 from '@/assets/paywall/05_contemplação_diante_do_palácio_governamental.webp';
import img6 from '@/assets/paywall/06_consulta_jurídica_em_família.webp';
import img7 from '@/assets/paywall/07_proteção_e_justiça_na_aposentadoria.webp';
import img8 from '@/assets/paywall/08_estratégia_jurídica_sob_as_luzes_da_cidade.webp';
import img9 from '@/assets/paywall/09_justiça_do_consumidor_em_destaque.webp';
import img10 from '@/assets/paywall/10_guardião_da_justiça_ambiental.webp';

const IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

/** Posição visual de cada card conforme a distância até o card da frente. */
const SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 60 },
  { x: 64, y: 8, rotate: 9, scale: 0.88, opacity: 0.85, z: 50 },
  { x: 104, y: 16, rotate: 15, scale: 0.76, opacity: 0.5, z: 40 },
  { x: 120, y: 24, rotate: 20, scale: 0.64, opacity: 0.2, z: 30 },
  { x: 60, y: 28, rotate: 10, scale: 0.5, opacity: 0, z: 20 },
  { x: 0, y: 30, rotate: 0, scale: 0.5, opacity: 0, z: 10 },
  { x: -60, y: 28, rotate: -10, scale: 0.5, opacity: 0, z: 20 },
  { x: -120, y: 24, rotate: -20, scale: 0.64, opacity: 0.2, z: 30 },
  { x: -104, y: 16, rotate: -15, scale: 0.76, opacity: 0.5, z: 40 },
  { x: -64, y: 8, rotate: -9, scale: 0.88, opacity: 0.85, z: 50 },
];

export default function PaywallImageStack() {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduz) return;
    const id = window.setInterval(() => setAtivo((i) => (i + 1) % IMAGES.length), 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center pt-2 pb-6 px-4 overflow-hidden">
      <div className="relative flex items-center justify-center w-full max-w-[340px] h-[200px]">
        {IMAGES.map((src, i) => {
          const pos = (i - ativo + IMAGES.length) % IMAGES.length;
          const slot = SLOTS[pos];
          const frente = pos === 0;
          return (
            <motion.div
              key={src}
              animate={{ x: slot.x, y: slot.y, rotate: slot.rotate, scale: slot.scale, opacity: slot.opacity }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: slot.z }}
              className={`absolute w-[150px] h-[180px] rounded-2xl overflow-hidden shadow-2xl shrink-0 ${
                frente
                  ? 'border-2 border-primary shadow-[0_15px_40px_rgba(224,31,71,0.45)]'
                  : 'border-2 border-white/20'
              }`}
            >
              <img
                src={src}
                alt=""
                width={768}
                height={1024}
                className="w-full h-full object-cover"
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}