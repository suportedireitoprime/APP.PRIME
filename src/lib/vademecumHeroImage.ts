import vademecumHeroImg from '@/assets/covers/vademecum-judge.webp';
import vademecumAdvogadosImg from '@/assets/covers/hero-advogados-tribunal.webp';

/**
 * Retorna a capa dinâmica do painel vermelho do Vade Mecum alternando por metade do dia:
 * - 06:00 às 17:59 (12 horas): Professor e Aluna (vademecum-judge.webp)
 * - 18:00 às 05:59 (12 horas): Dois Advogados no Tribunal (hero-advogados-tribunal.webp)
 */
export const getVadeMecumHeroImage = (): string => {
  const hora = new Date().getHours();
  const isPeriodoDiurno = hora >= 6 && hora < 18;
  return isPeriodoDiurno ? vademecumHeroImg : vademecumAdvogadosImg;
};

// Pré-aquecimento de cache em memória (Padrão 0ms - image-optimization)
if (typeof window !== 'undefined') {
  try {
    const img1 = new Image();
    img1.src = vademecumHeroImg;
    const img2 = new Image();
    img2.src = vademecumAdvogadosImg;
  } catch {}
}

export { vademecumHeroImg, vademecumAdvogadosImg };
