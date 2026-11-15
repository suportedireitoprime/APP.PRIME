import { DisciplinaItem } from './disciplinasAulasCatalogo';
import { AulaItem } from './aulasInterativasCatalogoCompleto';
import { 
  TRILHAS_MODULOS_OFICIAIS, 
  TrilhaModuloOficial, 
  getModuloPorNumero, 
  getModuloPorId, 
  getModulosPorArea,
  getDisciplinasDoModulo
} from './aulasTrilhasModulosOficiais';

export { 
  TRILHAS_MODULOS_OFICIAIS, 
  type TrilhaModuloOficial, 
  type TrilhaModuloAula,
  getModuloPorNumero, 
  getModuloPorId, 
  getModulosPorArea,
  getDisciplinasDoModulo
} from './aulasTrilhasModulosOficiais';

export interface TrilhaFaseItem {
  id: string;
  faseNumero: number;
  nome: string;
  subtitulo: string;
  descricao: string;
  disciplinasIds: string[];
  gradientBg: string;
  accentColor: string;
  highlightColor: string;
  badgeBg: string;
  iconName: string;
  capaUrl?: string;
  totalAulas?: number;
  temas?: string[];
  areas?: string[];
}

/**
 * 106 Módulos Oficiais da Trilha Cronológica
 * Derivados diretamente da grade curricular oficial (3.192 aulas)
 */
export const TRILHAS_CRONOLOGICAS: TrilhaFaseItem[] = TRILHAS_MODULOS_OFICIAIS.map((m) => ({
  id: m.id,
  faseNumero: m.moduloNumero,
  nome: m.nome,
  subtitulo: m.areas.join(' • ') || 'Formação Jurídica',
  descricao: m.sobre,
  disciplinasIds: m.disciplinasIds,
  gradientBg: m.gradientBg,
  accentColor: m.accentColor,
  highlightColor: m.highlightColor,
  badgeBg: `${m.accentColor}33`,
  iconName: m.iconName,
  capaUrl: m.capaUrl,
  totalAulas: m.totalAulas,
  temas: m.temas,
  areas: m.areas,
}));

export function getFasePorDisciplina(disciplinaId: string): TrilhaFaseItem | undefined {
  return TRILHAS_CRONOLOGICAS.find((t) => t.disciplinasIds.includes(disciplinaId));
}

export function getDisciplinasDaFase(faseId: string, disciplinas: DisciplinaItem[]): DisciplinaItem[] {
  const fase = TRILHAS_CRONOLOGICAS.find((t) => t.id === faseId);
  if (!fase) return disciplinas;
  if (!fase.disciplinasIds || fase.disciplinasIds.length === 0) return disciplinas;
  const filtered = disciplinas.filter((d) => fase.disciplinasIds.includes(d.id));
  return filtered.length > 0 ? filtered : disciplinas;
}

export function calcularMetricasFase(
  fase: TrilhaFaseItem,
  disciplinas: DisciplinaItem[],
  aulas: AulaItem[],
  calcularProgressoCiclo?: (aula: AulaItem) => {
    aulaTerminada: boolean;
    porcentagemTotal: number;
  }
) {
  const discs = disciplinas.filter((d) => fase.disciplinasIds.includes(d.id));
  const aulasFase = aulas.filter((a) => fase.disciplinasIds.includes(a.disciplinaId));

  let concluidas = 0;
  if (calcularProgressoCiclo && aulasFase.length > 0) {
    concluidas = aulasFase.filter((a) => {
      const p = calcularProgressoCiclo(a);
      return p.aulaTerminada || p.porcentagemTotal >= 100;
    }).length;
  }

  const pct = aulasFase.length > 0 ? Math.round((concluidas / aulasFase.length) * 100) : 0;

  return {
    totalDisciplinas: discs.length > 0 ? discs.length : (fase.areas?.length || 1),
    totalAulas: fase.totalAulas || aulasFase.length,
    concluidas,
    pct,
  };
}
