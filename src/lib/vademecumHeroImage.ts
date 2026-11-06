import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.webp';
import heroAdvogadosImg from '@/assets/covers/hero-advogados-tribunal.webp';

/**
 * Capas Oficiais Fixas:
 * - Início: Advogados no Tribunal (heroAdvogadosImg)
 * - Vade Mecum: Estudante (heroEstudanteImg)
 * Sem alternância por horários.
 */
export const isPeriodoDiurno = (): boolean => true;

export interface HeroImageConfig {
  src: string;
  className: string;
}

const ESTUDANTE_CLASS =
  "absolute inset-0 w-full h-full object-cover object-[36%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform";
const ADVOGADOS_CLASS =
  "absolute inset-0 w-full h-full object-cover object-[55%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform";

/** Capa oficial definitiva para o Início do App (Advogados no Tribunal) */
export const getHomeHeroImage = (): string => {
  return heroAdvogadosImg;
};

export const getHomeHeroConfig = (): HeroImageConfig => {
  return {
    src: heroAdvogadosImg,
    className: ADVOGADOS_CLASS,
  };
};

/** Capa oficial definitiva para o Vade Mecum (Estudante) */
export const getVadeMecumHeroImage = (): string => {
  return heroEstudanteImg;
};

export const getVadeMecumHeroConfig = (): HeroImageConfig => {
  return {
    src: heroEstudanteImg,
    className: ESTUDANTE_CLASS,
  };
};

// Pré-aquecimento de cache em memória (Padrão 0ms - image-optimization)
if (typeof window !== 'undefined') {
  try {
    const img1 = new Image();
    img1.src = heroEstudanteImg;
    const img2 = new Image();
    img2.src = heroAdvogadosImg;
  } catch {}
}

export { heroEstudanteImg, heroAdvogadosImg };
// Retrocompatibilidade
export const vademecumHeroImg = heroEstudanteImg;
export const vademecumAdvogadosImg = heroAdvogadosImg;
