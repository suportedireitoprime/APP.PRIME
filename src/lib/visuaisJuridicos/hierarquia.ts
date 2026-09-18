import type { VisualRecord } from './types';

export interface HierarquiaVisual {
  materia: string;
  topico: string;
  tema: string;
}

/**
 * Extrai a hierarquia do visual: Matéria -> Tópico -> Tema
 * Exemplo: "Direito Penal — Noções Gerais de Direito Penal · Teoria da Norma"
 * Matéria: "Direito Penal"
 * Tópico: "Noções Gerais de Direito Penal"
 * Tema: "Teoria da Norma"
 */
export function extrairHierarquiaVisual(visual: VisualRecord): HierarquiaVisual {
  const rotulo = visual.item_label || visual.titulo || 'Geral';
  let materia = rotulo;
  let topico = '';
  let tema = visual.titulo || '';

  if (rotulo.includes('—')) {
    const partes = rotulo.split('—').map((s) => s.trim());
    materia = partes[0] || 'Geral';
    const resto = partes.slice(1).join('—').trim();

    if (resto.includes('·')) {
      const subpartes = resto.split('·').map((s) => s.trim());
      topico = subpartes[0] || 'Geral';
      if (!tema || tema === rotulo) {
        tema = subpartes.slice(1).join('·').trim();
      }
    } else {
      topico = resto || 'Geral';
    }
  }

  return {
    materia: materia.trim(),
    topico: (topico || 'Geral').trim(),
    tema: (tema || visual.titulo || 'Visual').trim(),
  };
}
