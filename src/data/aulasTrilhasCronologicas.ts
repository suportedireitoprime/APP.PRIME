import { DisciplinaItem } from './disciplinasAulasCatalogo';
import { AulaItem } from './aulasInterativasCatalogoCompleto';

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
}

export const TRILHAS_CRONOLOGICAS: TrilhaFaseItem[] = [
  {
    id: 'fase-1',
    faseNumero: 1,
    nome: 'Fundamentos Jurídicos',
    subtitulo: 'A Base Conceitual & Linguagem',
    descricao: 'Inicie sua jornada pela propedêutica, história do pensamento, garantias universais e redação jurídica.',
    disciplinasIds: ['filosofia', 'direitos-humanos', 'portugues', 'formacao-complementar'],
    gradientBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    accentColor: '#818cf8',
    highlightColor: '#c7d2fe',
    badgeBg: 'rgba(129, 140, 248, 0.2)',
    iconName: 'BookOpen',
  },
  {
    id: 'fase-2',
    faseNumero: 2,
    nome: 'Pilares Dogmáticos',
    subtitulo: 'Constituição, Sociedade & Crime',
    descricao: 'As três colunas mestras do ordenamento: a norma suprema, as relações privadas e a teoria do crime.',
    disciplinasIds: ['constitucional', 'civil', 'penal'],
    gradientBg: 'linear-gradient(135deg, #4c0519 0%, #881337 50%, #be123c 100%)',
    accentColor: '#fb7185',
    highlightColor: '#fecdd3',
    badgeBg: 'rgba(251, 113, 133, 0.2)',
    iconName: 'Shield',
  },
  {
    id: 'fase-3',
    faseNumero: 3,
    nome: 'Instrumental & Trabalho',
    subtitulo: 'Processos & Relações Laborais',
    descricao: 'A dinâmica da jurisdição, as garantias processuais do cidadão em juízo e a tutela do trabalhador.',
    disciplinasIds: ['processual-civil', 'processual-penal', 'trabalho', 'processual-trabalho'],
    gradientBg: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)',
    accentColor: '#34d399',
    highlightColor: '#a7f3d0',
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    iconName: 'Scale',
  },
  {
    id: 'fase-4',
    faseNumero: 4,
    nome: 'Estado, Mercado & Fisco',
    subtitulo: 'Administração, Empresa & Tributos',
    descricao: 'A máquina pública, a sustentabilidade fiscal, o orçamento da União e a atividade mercantil moderna.',
    disciplinasIds: ['administrativo', 'tributario', 'empresarial', 'financeiro'],
    gradientBg: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)',
    accentColor: '#c084fc',
    highlightColor: '#f3e8ff',
    badgeBg: 'rgba(192, 132, 252, 0.2)',
    iconName: 'Building2',
  },
  {
    id: 'fase-5',
    faseNumero: 5,
    nome: 'Ramos Especiais & Prática',
    subtitulo: 'Especialidades & Fronteiras',
    descricao: 'Sustentabilidade, legislação penal especial, previdência social, cidade e relações internacionais.',
    disciplinasIds: [
      'lei-penal-especial',
      'ambiental',
      'previdenciario',
      'urbanistico',
      'internacional-privado',
      'politicas-publicas',
      'desportivo',
    ],
    gradientBg: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)',
    accentColor: '#fbbf24',
    highlightColor: '#fef3c7',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    iconName: 'Sparkles',
  },
];

export function getFasePorDisciplina(disciplinaId: string): TrilhaFaseItem | undefined {
  return TRILHAS_CRONOLOGICAS.find((t) => t.disciplinasIds.includes(disciplinaId));
}

export function getDisciplinasDaFase(faseId: string, disciplinas: DisciplinaItem[]): DisciplinaItem[] {
  const fase = TRILHAS_CRONOLOGICAS.find((t) => t.id === faseId);
  if (!fase) return disciplinas;
  return disciplinas.filter((d) => fase.disciplinasIds.includes(d.id));
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
    totalDisciplinas: discs.length,
    totalAulas: aulasFase.length,
    concluidas,
    pct,
  };
}
