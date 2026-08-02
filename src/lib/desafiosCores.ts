// Paleta por trilha de desafios — cada trilha tem uma cor própria
const PALETA: Record<string, string> = {
  geral: '#8B5CF6',
  constitucional: '#3B82F6',
  penal: '#EF4444',
  civil: '#22C55E',
  processual_civil: '#14B8A6',
  processual_penal: '#F97316',
  administrativo: '#EAB308',
  trabalho: '#EC4899',
  tributario: '#06B6D4',
  empresarial: '#A855F7',
  consumidor: '#84CC16',
  ambiental: '#10B981',
  previdenciario: '#F59E0B',
  eleitoral: '#6366F1',
  internacional: '#0EA5E9',
};

const FALLBACK = ['#8B5CF6', '#3B82F6', '#EF4444', '#22C55E', '#F97316', '#EC4899', '#14B8A6', '#EAB308'];

export const corTrilha = (slug?: string | null) => {
  if (!slug) return PALETA.geral;
  const key = slug.toLowerCase().replace(/[\s-]/g, '_');
  if (PALETA[key]) return PALETA[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
};
