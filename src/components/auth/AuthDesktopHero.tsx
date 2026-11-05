// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DesktopQrLogin from '@/components/auth/DesktopQrLogin';
import authJudgeScene from '@/assets/auth-judge-scene.webp';
import authCourtroomScene from '@/assets/auth-courtroom-scene.webp';
import authThemisImpact from '@/assets/auth-themis-impact.webp';
import themisAuthYellow from '@/assets/themis-auth-yellow.webp';
import capa1 from '@/assets/capas/capa-1.webp';
import capa2 from '@/assets/capas/capa-2.webp';
import capa3 from '@/assets/capas/capa-3.webp';
import capa4 from '@/assets/capas/capa-4.webp';
import capa5 from '@/assets/capas/capa-5.webp';
import capa6 from '@/assets/capas/capa-6.webp';
import capa7 from '@/assets/capas/capa-7.webp';
import capa8 from '@/assets/capas/capa-8.webp';
import capa9 from '@/assets/capas/capa-9.webp';
import logoImg from '@/assets/bundled/logo-direitoprime-v2.webp';

const AUTH_BACKGROUNDS = [
  authJudgeScene,
  authCourtroomScene,
  authThemisImpact,
  themisAuthYellow,
  capa1,
  capa2,
  capa3,
  capa4,
  capa5,
  capa6,
  capa7,
  capa8,
  capa9,
];

export const AuthDesktopHero: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Pré-carrega imagens para transição instantânea
  useEffect(() => {
    AUTH_BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Alternância a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % AUTH_BACKGROUNDS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Background Images com alternância a cada 4 segundos e máscaras elegantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-[#0d0f12] overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={`desktop-auth-bg-${currentIdx}`}
            src={AUTH_BACKGROUNDS[currentIdx]}
            alt="Ambiente Jurídico"
            loading="eager"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.70] saturate-[1.05] transform-gpu"
          />
        </AnimatePresence>
      </div>

      {/* Gradientes laterais para leitura impecável */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#0d0f12]/95 via-[#0d0f12]/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#0d0f12]/95 via-[#0d0f12]/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-transparent to-transparent h-1/4 mt-auto z-10 pointer-events-none" />

      {/* Conteúdo Desktop 2 Colunas */}
      <div className="relative z-20 w-full h-full flex items-center justify-between px-10 xl:px-24 flex-1">
        {/* Lado Esquerdo: Marca e Apresentação */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-start text-left max-w-lg"
        >
          <img
            src={logoImg}
            alt="Logo Direito Prime"
            className="w-24 h-24 xl:w-32 xl:h-32 object-contain drop-shadow-2xl mb-6"
          />

          <h1 className="font-serif italic font-bold text-5xl xl:text-6xl text-white tracking-tight leading-none drop-shadow-2xl whitespace-nowrap">
            Estudos Jurídicos
          </h1>
          <span className="font-sans font-bold text-primary text-sm xl:text-base tracking-[0.2em] uppercase drop-shadow-lg mt-3">
            Estudo Profissional
          </span>

          <p className="font-body text-white/95 text-lg xl:text-xl leading-relaxed mt-6 drop-shadow-xl bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
            Todo o conhecimento jurídico que você precisa reunido em{' '}
            <span className="text-primary font-bold">uma única plataforma.</span>
          </p>
        </motion.div>

        {/* Lado Direito: QR Code Login */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="w-[450px] shrink-0 flex flex-col items-center justify-center p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl"
        >
          <DesktopQrLogin />
        </motion.div>
      </div>
    </>
  );
};
