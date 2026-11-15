import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.webp';
import heroAdvogadosImg from '@/assets/covers/hero-advogados-tribunal.webp';
import heroConstituicaoImg from '@/assets/covers/hero-vademecum-constituicao.webp';

/**
 * Capas Oficiais Fixas:
 * - Início: Advogados no Tribunal (heroAdvogadosImg)
 * - Vade Mecum: Constituição & Brasília (heroConstituicaoImg)
 * Sem alternância por horários.
 */
export const isPeriodoDiurno = (): boolean => true;

export interface HeroImageConfig {
  src: string;
  className: string;
}

const CONSTITUICAO_CLASS =
  "absolute inset-0 w-full h-full object-cover object-[72%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform";
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

/** Capa oficial definitiva para o Vade Mecum (Constituição & Congresso Nacional) */
export const getVadeMecumHeroImage = (): string => {
  return heroConstituicaoImg;
};

export const getVadeMecumHeroConfig = (): HeroImageConfig => {
  return {
    src: heroConstituicaoImg,
    className: CONSTITUICAO_CLASS,
  };
};

// Pré-aquecimento de cache em memória (Padrão 0ms - image-optimization)
if (typeof window !== 'undefined') {
  try {
    const img1 = new Image();
    img1.src = heroConstituicaoImg;
    const img2 = new Image();
    img2.src = heroAdvogadosImg;
  } catch {}
}

export { heroConstituicaoImg, heroEstudanteImg, heroAdvogadosImg };
// Retrocompatibilidade
export const vademecumHeroImg = heroConstituicaoImg;
export const vademecumAdvogadosImg = heroAdvogadosImg;
