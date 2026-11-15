import fs from 'fs';

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
}

const csvPath = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/scratch/trilhas.csv';
const mappingPath = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/scratch/drive_mapping.json';

const csvText = fs.readFileSync(csvPath, 'utf8');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Mapa de capas R2 por número de módulo
const coversByModNum = new Map();
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/trilhas-modulos/capas';

for (const item of mapping) {
  const m = item.name.match(/capa-modulo-(\d+)/);
  if (m) {
    const num = parseInt(m[1], 10);
    coversByModNum.set(num, `${R2_DOMAIN}/${item.name}`);
  }
}

const AREA_TO_DISCIPLINA = {
  'Teoria e Filosofia do Direito': 'filosofia',
  'Direito Constitucional': 'constitucional',
  'Direito Civil': 'civil',
  'Direito do Trabalho': 'trabalho',
  'Direito Penal': 'penal',
  'Direitos Humanos': 'direitos-humanos',
  'Políticas Públicas': 'politicas-publicas',
  'Direito Previdenciário': 'previdenciario',
  'Direito Administrativo': 'administrativo',
  'Direito Empresarial': 'empresarial',
  'Direito Processual Civil': 'processual-civil',
  'Direito Processual do Trabalho': 'processual-trabalho',
  'Direito Processual Penal': 'processual-penal',
  'Direito Tributário': 'tributario',
  'Direito Financeiro': 'financeiro',
  'Lei Penal Especial': 'lei-penal-especial',
  'Direito Ambiental': 'ambiental',
  'Direito Urbanístico': 'urbanistico',
  'Direito Desportivo': 'desportivo',
  'Direito Internacional Privado': 'internacional-privado'
};

const rows = parseCSV(csvText);

const THEME_PALETTES = [
  { accent: '#38bdf8', highlight: '#bae6fd', bg: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)', icon: 'BookOpen' },
  { accent: '#818cf8', highlight: '#c7d2fe', bg: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)', icon: 'Shield' },
  { accent: '#c084fc', highlight: '#f3e8ff', bg: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #7e22ce 100%)', icon: 'Scale' },
  { accent: '#fb7185', highlight: '#fecdd3', bg: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)', icon: 'Building2' },
  { accent: '#f43f5e', highlight: '#ffe4e6', bg: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #e11d48 100%)', icon: 'Sparkles' },
  { accent: '#fb923c', highlight: '#ffedd5', bg: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #c2410c 100%)', icon: 'BookOpen' },
  { accent: '#facc15', highlight: '#fef9c3', bg: 'linear-gradient(135deg, #422006 0%, #854d0e 50%, #a16207 100%)', icon: 'Scale' },
  { accent: '#4ade80', highlight: '#dcfce7', bg: 'linear-gradient(135deg, #052e16 0%, #15803d 50%, #16a34a 100%)', icon: 'Shield' },
  { accent: '#2dd4bf', highlight: '#ccfbf1', bg: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0d9488 100%)', icon: 'Building2' },
  { accent: '#22d3ee', highlight: '#cffafe', bg: 'linear-gradient(135deg, #083344 0%, #0e7490 50%, #0891b2 100%)', icon: 'Sparkles' },
];

const modulesMap = new Map();

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length < 2 || !row[0]) continue;

  const modNum = parseInt(row[0], 10);
  if (isNaN(modNum)) continue;

  const modNome = row[1];
  const modSobre = row[2] || '';
  const area = row[3] || '';
  const tema = row[4] || '';
  const aulaNome = row[5] || '';
  const aulaSobre = row[6] || '';

  if (!modulesMap.has(modNum)) {
    const palette = THEME_PALETTES[(modNum - 1) % THEME_PALETTES.length];
    const capaUrl = coversByModNum.get(modNum) || '';

    modulesMap.set(modNum, {
      id: `modulo-${modNum}`,
      moduloNumero: modNum,
      nome: modNome,
      sobre: modSobre,
      areasSet: new Set(),
      temasSet: new Set(),
      disciplinasSet: new Set(),
      capaUrl,
      accentColor: palette.accent,
      highlightColor: palette.highlight,
      gradientBg: palette.bg,
      iconName: palette.icon,
      aulas: []
    });
  }

  const mod = modulesMap.get(modNum);
  if (area) {
    mod.areasSet.add(area);
    const discId = AREA_TO_DISCIPLINA[area];
    if (discId) mod.disciplinasSet.add(discId);
  }
  if (tema) mod.temasSet.add(tema);

  const aulaId = `mod-${String(modNum).padStart(2, '0')}-aula-${String(mod.aulas.length + 1).padStart(2, '0')}`;
  mod.aulas.push({
    id: aulaId,
    moduloNumero: modNum,
    area,
    tema,
    aulaNumeroOuTitulo: aulaNome,
    sobre: aulaSobre
  });
}

const modulosList = Array.from(modulesMap.values()).map(m => ({
  id: m.id,
  moduloNumero: m.moduloNumero,
  nome: m.nome,
  sobre: m.sobre,
  areas: Array.from(m.areasSet),
  disciplinasIds: Array.from(m.disciplinasSet),
  temas: Array.from(m.temasSet),
  totalAulas: m.aulas.length,
  capaUrl: m.capaUrl,
  accentColor: m.accentColor,
  highlightColor: m.highlightColor,
  gradientBg: m.gradientBg,
  iconName: m.iconName,
  aulas: m.aulas
}));

console.log(`Total de módulos: ${modulosList.length}`);
console.log(`Total de aulas: ${modulosList.reduce((acc, m) => acc + m.totalAulas, 0)}`);

const code = `// Catálogo Oficial de Módulos e Trilhas Cronológicas
// Dados extraídos diretamente da grade oficial de estudos (106 Módulos • 3.192 Aulas)
// Capas sincronizadas no Cloudflare R2: https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/trilhas-modulos/capas/

import { DisciplinaItem } from './disciplinasAulasCatalogo';
import { AulaItem } from './aulasInterativasCatalogoCompleto';

export interface TrilhaModuloAula {
  id: string;
  moduloNumero: number;
  area: string;
  tema: string;
  aulaNumeroOuTitulo: string;
  sobre: string;
}

export interface TrilhaModuloOficial {
  id: string;
  moduloNumero: number;
  nome: string;
  sobre: string;
  areas: string[];
  disciplinasIds: string[];
  temas: string[];
  totalAulas: number;
  capaUrl: string;
  accentColor: string;
  highlightColor: string;
  gradientBg: string;
  iconName: string;
  aulas: TrilhaModuloAula[];
}

export const TRILHAS_MODULOS_OFICIAIS: TrilhaModuloOficial[] = ${JSON.stringify(modulosList, null, 2)};

export function getModuloPorNumero(num: number): TrilhaModuloOficial | undefined {
  return TRILHAS_MODULOS_OFICIAIS.find((m) => m.moduloNumero === num);
}

export function getModuloPorId(id: string): TrilhaModuloOficial | undefined {
  return TRILHAS_MODULOS_OFICIAIS.find((m) => m.id === id);
}

export function getModulosPorArea(areaNome: string): TrilhaModuloOficial[] {
  const norm = areaNome.toLowerCase().trim();
  return TRILHAS_MODULOS_OFICIAIS.filter((m) => 
    m.areas.some(a => a.toLowerCase().includes(norm))
  );
}

export function getDisciplinasDoModulo(modulo: TrilhaModuloOficial, disciplinas: DisciplinaItem[]): DisciplinaItem[] {
  if (!modulo.disciplinasIds || modulo.disciplinasIds.length === 0) return disciplinas;
  const filtered = disciplinas.filter((d) => modulo.disciplinasIds.includes(d.id));
  return filtered.length > 0 ? filtered : disciplinas;
}

export function calcularMetricasModulo(
  modulo: TrilhaModuloOficial,
  aulasCatalogo: AulaItem[],
  calcularProgressoCiclo?: (aula: AulaItem) => {
    aulaTerminada: boolean;
    porcentagemTotal: number;
  }
) {
  const aulasDoMod = aulasCatalogo.filter((a) => modulo.disciplinasIds.includes(a.disciplinaId));
  let concluidas = 0;
  if (calcularProgressoCiclo && aulasDoMod.length > 0) {
    concluidas = aulasDoMod.filter((a) => {
      const p = calcularProgressoCiclo(a);
      return p.aulaTerminada || p.porcentagemTotal >= 100;
    }).length;
  }
  const pct = aulasDoMod.length > 0 ? Math.round((concluidas / aulasDoMod.length) * 100) : 0;
  return {
    totalAulas: modulo.totalAulas,
    totalAulasDisponiveis: aulasDoMod.length,
    concluidas,
    pct
  };
}
`;

const outputPath = 'C:/Users/ext_wpereira/.gemini/antigravity/worktrees/ESTUDOS JURIDICOSs/start_vite_server/src/data/aulasTrilhasModulosOficiais.ts';
fs.writeFileSync(outputPath, code, 'utf8');
console.log(`Arquivo salvo com sucesso em: ${outputPath} (${(code.length / 1024).toFixed(1)} KB)`);
