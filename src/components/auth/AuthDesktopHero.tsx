import React from 'react';
import { motion } from 'framer-motion';
import DesktopQrLogin from '@/components/auth/DesktopQrLogin';
import authJudgeScene from '@/assets/auth-judge-scene.jpeg';
import themisAuthYellow from '@/assets/themis-auth-yellow.webp';

export const AuthDesktopHero: React.FC = () => {
  return (
    <>
      {/* Background Images com máscaras de gradiente elegantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-[#0d0f12]">
        <img
          src={authJudgeScene}
          alt="Tribunal de Justiça"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-y-0 left-0 w-[55%] h-full object-cover object-center"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
          }}
        />
        <img
          src={themisAuthYellow}
          alt="Themis e a advocacia"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-y-0 right-0 w-[55%] h-full object-cover object-center"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, black 70%, transparent 100%)',
            maskImage: 'linear-gradient(to left, black 70%, transparent 100%)',
          }}
        />
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
            src="/logo-prime.png"
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
