import React from 'react';
import { motion } from 'framer-motion';
import DesktopEmailLogin from '@/components/auth/DesktopEmailLogin';
import heroLeisecaEstudante from '@/assets/covers/hero-leiseca-estudante.webp';
import logoCoruja from '@/assets/logo-coruja.webp';

export const AuthDesktopHero: React.FC = () => {
  return (
    <>
      {/* Background Image: Foto oficial da menina segurando a Constituição */}
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-[#0d0f12] overflow-hidden">
        <img
          src={heroLeisecaEstudante}
          alt="Estudante de Direito com a Constituição"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_25%] filter brightness-[0.70] saturate-[1.05] transform-gpu"
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
            src={logoCoruja}
            alt="Estudos Jurídicos"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-24 h-24 xl:w-32 xl:h-32 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_0_24px_rgba(230,25,66,0.35)] mb-6"
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

        {/* Lado Direito: Login com E-mail */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="w-[450px] shrink-0 flex flex-col items-center justify-center p-8 bg-black/35 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl"
        >
          <DesktopEmailLogin />
        </motion.div>
      </div>
    </>
  );
};
