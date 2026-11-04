import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.webp';
import heroAdvogadosImg from '@/assets/covers/hero-advogados-tribunal.webp';

/**
 * Retorna se o horário atual está no período diurno (06:00 às 17:59, 12 horas).
 * A capa do Início e a capa do Vade Mecum invertem entre si a cada 12 horas:
 * - 06:00 às 17:59 (12h): Início = Estudante, Vade Mecum = Advogados no Tribunal
 * - 18:00 às 05:59 (12h): Início = Advogados no Tribunal, Vade Mecum = Estudante
 */
export const isPeriodoDiurno = (): boolean => {
  const hora = new Date().getHours();
  return hora >= 6 && hora < 18;
};

export interface HeroImageConfig {
  src: string;
  className: string;
}

const ESTUDANTE_CLASS =
  "absolute inset-0 w-full h-full object-cover object-[36%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform";
const ADVOGADOS_CLASS =
  "absolute inset-0 w-full h-full object-cover object-[55%_center] md:object-center z-0 pointer-events-none transform-gpu will-change-transform";

/** Capa dinâmica para o Início do App */
export const getHomeHeroImage = (): string => {
  return isPeriodoDiurno() ? heroEstudanteImg : heroAdvogadosImg;
};

export const getHomeHeroConfig = (): HeroImageConfig => {
  const diurno = isPeriodoDiurno();
  return {
    src: diurno ? heroEstudanteImg : heroAdvogadosImg,
    className: diurno ? ESTUDANTE_CLASS : ADVOGADOS_CLASS,
  };
};

/** Capa dinâmica para o Vade Mecum (inverte a cada 12h com o Início) */
export const getVadeMecumHeroImage = (): string => {
  return isPeriodoDiurno() ? heroAdvogadosImg : heroEstudanteImg;
};

export const getVadeMecumHeroConfig = (): HeroImageConfig => {
  const diurno = isPeriodoDiurno();
  return {
    src: diurno ? heroAdvogadosImg : heroEstudanteImg,
    className: diurno ? ADVOGADOS_CLASS : ESTUDANTE_CLASS,
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
