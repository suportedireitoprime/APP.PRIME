import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HardDrive, BookMarked, Heart, Route as RouteIcon, FileUp } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';

// Filósofos — mesmas imagens do FilosofosPanel
import cicero from '@/assets/filosofos/cicero.webp';
import aquino from '@/assets/filosofos/aquino.webp';
import montesquieu from '@/assets/filosofos/montesquieu.webp';
import kant from '@/assets/filosofos/kant.webp';
import kelsen from '@/assets/filosofos/kelsen.webp';
import platao from '@/assets/filosofos/platao.webp';
import aristoteles from '@/assets/filosofos/aristoteles.webp';
import rousseau from '@/assets/filosofos/rousseau.webp';
import locke from '@/assets/filosofos/locke.webp';
import beccaria from '@/assets/filosofos/beccaria.webp';
import ruibarbosa from '@/assets/filosofos/ruibarbosa.webp';
import hegel from '@/assets/filosofos/hegel.webp';

type Filosofo = { nome: string; epoca: string; frase: string; img: string };

const FILOSOFOS: Filosofo[] = [
  { nome: 'Platão', epoca: 'Grécia Antiga · séc. IV a.C.', frase: 'A justiça consiste em cada um cumprir o que lhe é próprio.', img: platao },
  { nome: 'Aristóteles', epoca: 'Grécia Antiga · séc. IV a.C.', frase: 'A lei é a razão desprovida de paixão.', img: aristoteles },
  { nome: 'Cícero', epoca: 'Roma Antiga · séc. I a.C.', frase: 'A justiça é a rainha das virtudes.', img: cicero },
  { nome: 'Tomás de Aquino', epoca: 'Idade Média · séc. XIII', frase: 'A lei é uma ordenação da razão para o bem comum.', img: aquino },
  { nome: 'John Locke', epoca: 'Iluminismo · séc. XVII', frase: 'Onde não há lei, não há liberdade.', img: locke },
  { nome: 'Montesquieu', epoca: 'Iluminismo · séc. XVIII', frase: 'Para não abusar do poder, é necessário que o poder detenha o poder.', img: montesquieu },
  { nome: 'Cesare Beccaria', epoca: 'Iluminismo · séc. XVIII', frase: 'É melhor prevenir os delitos do que puni-los.', img: beccaria },
  { nome: 'Jean-Jacques Rousseau', epoca: 'Iluminismo · séc. XVIII', frase: 'A lei é a expressão da vontade geral.', img: rousseau },
  { nome: 'Immanuel Kant', epoca: 'Modernidade · séc. XVIII–XIX', frase: 'Age de tal modo que a máxima da tua ação possa ser uma lei universal.', img: kant },
  { nome: 'Georg Hegel', epoca: 'Idealismo · séc. XIX', frase: 'O direito é a existência da vontade livre.', img: hegel },
  { nome: 'Rui Barbosa', epoca: 'Brasil · séc. XIX–XX', frase: 'A justiça atrasada não é justiça; é injustiça qualificada e manifesta.', img: ruibarbosa },
  { nome: 'Hans Kelsen', epoca: 'Contemporâneo · séc. XX', frase: 'A norma fundamental é o pressuposto lógico de toda ordem jurídica.', img: kelsen },
];

import { App } from '@capacitor/app';

interface Props {
  onBuscar?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero = ({ children }: Props) => {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    let isAppActive = true;

    const startTimer = () => {
      clearInterval(id);
      id = setInterval(() => {
        if (isAppActive) {
          setIdx((i) => {
            const next = (i + 1) % FILOSOFOS.length;
            const nextImg = new Image();
            nextImg.src = FILOSOFOS[(next + 1) % FILOSOFOS.length].img;
            return next;
          });
        }
      }, 5000);
    };

    startTimer();

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      isAppActive = isActive;
    });

    return () => {
      clearInterval(id);
      listener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  const atual = FILOSOFOS[idx];

  const ACTIONS = [
    { id: 'leitura' as const, label: 'Leitura', icon: BookMarked, color: '#818cf8' },
    { id: 'trilhas' as const, label: 'Trilhas', icon: RouteIcon, color: '#34d399' },
    { id: 'favoritos' as const, label: 'Favoritos', icon: Heart, color: '#fb7185' },
    { id: 'personalizado' as const, label: 'Meus PDFs', icon: FileUp, color: '#fbbf24' },
  ];

  const handleAction = (id: typeof ACTIONS[number]['id']) => {
    haptic.selection();
    if (id === 'trilhas') {
      navigate('/bibliotecas/trilhas');
      return;
    }
    abrirAtalhoBiblioteca(id);
  };

  return (
    <div
      className="relative overflow-hidden rounded-b-[36px] border-b border-amber-900/50 shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20 bg-[#2b160a]"
      style={{
        transform: 'translateZ(0)',
        isolation: 'isolate',
        contain: 'paint',
      }}
    >
      {/* Base Dark/Brown for the right side behind the image */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1f1007] to-[#3a1d0d]" />

      {/* Imagem do filósofo na direita redimensionada */}
      <div className="pointer-events-none absolute inset-0 flex justify-end z-0">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={atual.nome}
            src={atual.img}
            alt=""
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 0.92, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute bottom-0 right-[-5%] h-[85%] w-auto object-contain object-bottom opacity-90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          />
        </AnimatePresence>
      </div>

      {/* Overlay marrom com corte diagonal estilo Home */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div 
          className="absolute inset-0 overflow-hidden bg-[#3b1d0d]"
          style={{ clipPath: 'polygon(0 0, 58% 0, 44% 100%, 0% 100%)' }}
        >
          {/* Texturas internas do corte diagonal ajustadas para marrom */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />

          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          {/* Ornamentos SVG */}
          <svg
            aria-hidden
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -left-3 -top-2 w-16 h-16 text-amber-400/20"
          >
            <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="30" y="140" width="140" height="24" rx="3" />
              <rect x="45" y="112" width="120" height="24" rx="3" />
              <rect x="35" y="84" width="130" height="24" rx="3" />
              <line x1="55" y1="152" x2="55" y2="158" />
              <line x1="70" y1="124" x2="70" y2="130" />
              <line x1="60" y1="96" x2="60" y2="102" />
            </g>
          </svg>

          <svg
            aria-hidden
            viewBox="0 0 200 200"
            className="pointer-events-none absolute right-[45%] top-3 w-14 h-14 text-amber-400/15"
          >
            <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="30" y="40" width="90" height="30" rx="4" transform="rotate(-25 75 55)" />
              <line x1="95" y1="95" x2="160" y2="160" />
              <rect x="120" y="150" width="60" height="14" rx="3" />
            </g>
          </svg>

          <svg
            aria-hidden
            viewBox="0 0 200 200"
            className="pointer-events-none absolute left-4 bottom-24 w-10 h-10 text-amber-400/10"
          >
            <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 60 L100 80 L180 60 L180 160 L100 180 L20 160 Z" />
              <line x1="100" y1="80" x2="100" y2="180" />
            </g>
          </svg>
        </div>
      </div>

      {/* Header Buttons absoluto no topo para poupar altura */}
      <header className="absolute top-0 right-0 left-0 z-30 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate('/'); }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <button
            onClick={() => { haptic.selection(); navigate('/biblioteca-offline'); }}
            aria-label="Armazenamento Offline"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <HardDrive className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="relative z-20 px-4 pt-16 sm:pt-20 pb-5 flex flex-col gap-4">
        <div className="max-w-[58%] xs:max-w-[62%] flex flex-col">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-300/90 font-bold">
            Pensadores do Direito
          </p>
          <div className="relative min-h-[52px] mt-1.5">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={atual.nome}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0"
              >
                <h2 className="text-2xl font-bold text-amber-50 leading-tight drop-shadow">
                  {atual.nome}
                </h2>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-amber-200/75 font-semibold">
                  {atual.epoca}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative mt-3 min-h-[60px]">
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={atual.frase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="absolute inset-0 text-[13px] leading-snug text-amber-50/95 italic font-serif"
              >
                "{atual.frase}"
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {FILOSOFOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ver ${FILOSOFOS[i].nome}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-amber-300' : 'w-1.5 bg-amber-100/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.id)}
                className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center"
              >
                <Icon className="w-5 h-5 group-hover:scale-110 transition-all" style={{ color: a.color }} strokeWidth={2} />
                <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">{a.label}</span>
              </button>
            );
          })}
        </div>

        {children && <div className="relative mt-2">{children}</div>}
      </div>
    </div>
  );
};

export default BibliotecaHero;
