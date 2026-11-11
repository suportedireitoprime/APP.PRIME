import direitoPenalFundo from '@/assets/direito-penal-fundo.webp';
import direitoAdministrativoFundo from '@/assets/direito-administrativo-fundo.webp';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';

export interface DisciplinaVisualTheme {
  id: string;
  nome: string;
  primary: string;
  accent: string;
  highlight: string;
  glow: string;
  glowSoft: string;
  border: string;
  borderSubtle: string;
  bgDark: string;
  bgCard: string;
  bgActive: string;
  textActive: string;
  textAccent: string;
  textLight: string;
  roadGradient: string;
  roadShadow: string;
  modalBg: string;
  medalActive: string;
  medalBorder: string;
  progressGradient: string;
  progressShadow: string;
  fundoAssetUrl: string;
  isCustomFundo: boolean;
}

const TEMAS_DISCIPLINAS: Record<string, DisciplinaVisualTheme> = {
  penal: {
    id: 'penal',
    nome: 'Direito Penal',
    primary: '#e11d48',
    accent: '#ff8296',
    highlight: '#ffe4e6',
    glow: 'rgba(225, 29, 72, 0.75)',
    glowSoft: 'rgba(225, 29, 72, 0.35)',
    border: 'rgba(244, 63, 94, 0.55)',
    borderSubtle: 'rgba(159, 18, 57, 0.45)',
    bgDark: '#0e0406',
    bgCard: 'linear-gradient(135deg, rgba(46, 18, 25, 0.94) 0%, rgba(32, 10, 17, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 45%, #fecdd3 100%)',
    textActive: '#4c0519',
    textAccent: '#ff8296',
    textLight: '#ffe4e6',
    roadGradient: 'linear-gradient(180deg, #ff8296 0%, #e11d48 50%, #9f1239 100%)',
    roadShadow: '0 0 14px rgba(225, 29, 72, 0.85)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #2a0e14 0%, #130608 55%, #060203 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #ffe4e6 35%, #f43f5e 80%, #9f1239 100%)',
    medalBorder: '#ff8296',
    progressGradient: 'linear-gradient(90deg, #9f1239 0%, #e11d48 50%, #ff8296 100%)',
    progressShadow: '0 0 12px rgba(225, 29, 72, 0.7)',
    fundoAssetUrl: direitoPenalFundo,
    isCustomFundo: true,
  },
  administrativo: {
    id: 'administrativo',
    nome: 'Direito Administrativo',
    primary: '#d97706',
    accent: '#f59e0b',
    highlight: '#fef3c7',
    glow: 'rgba(245, 158, 11, 0.65)',
    glowSoft: 'rgba(245, 158, 11, 0.25)',
    border: 'rgba(217, 119, 6, 0.55)',
    borderSubtle: 'rgba(120, 53, 15, 0.35)',
    bgDark: '#0a0705',
    bgCard: 'linear-gradient(135deg, rgba(32, 22, 14, 0.92) 0%, rgba(48, 33, 20, 0.92) 100%)',
    bgActive: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fde68a 100%)',
    textActive: '#451a03',
    textAccent: '#f59e0b',
    textLight: '#fef3c7',
    roadGradient: 'linear-gradient(180deg, #fde047 0%, #f59e0b 50%, #b45309 100%)',
    roadShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #1c1108 0%, #0c0805 50%, #050302 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #fef08a 35%, #f59e0b 80%, #b45309 100%)',
    medalBorder: '#fef08a',
    progressGradient: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fde047 100%)',
    progressShadow: '0 0 10px rgba(245, 158, 11, 0.7)',
    fundoAssetUrl: direitoAdministrativoFundo,
    isCustomFundo: true,
  },
  constitucional: {
    id: 'constitucional',
    nome: 'Direito Constitucional',
    primary: '#16a34a',
    accent: '#22c55e',
    highlight: '#dcfce7',
    glow: 'rgba(34, 197, 94, 0.65)',
    glowSoft: 'rgba(34, 197, 94, 0.25)',
    border: 'rgba(22, 163, 74, 0.55)',
    borderSubtle: 'rgba(20, 83, 45, 0.35)',
    bgDark: '#040d07',
    bgCard: 'linear-gradient(135deg, rgba(14, 41, 22, 0.94) 0%, rgba(8, 23, 12, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 50%, #bbf7d0 100%)',
    textActive: '#052e16',
    textAccent: '#4ade80',
    textLight: '#dcfce7',
    roadGradient: 'linear-gradient(180deg, #86efac 0%, #22c55e 50%, #15803d 100%)',
    roadShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #0c2b14 0%, #051409 50%, #020804 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #dcfce7 35%, #22c55e 80%, #15803d 100%)',
    medalBorder: '#86efac',
    progressGradient: 'linear-gradient(90deg, #15803d 0%, #22c55e 50%, #86efac 100%)',
    progressShadow: '0 0 10px rgba(34, 197, 94, 0.7)',
    fundoAssetUrl: greciaFilosofosFundo,
    isCustomFundo: false,
  },
  civil: {
    id: 'civil',
    nome: 'Direito Civil',
    primary: '#2563eb',
    accent: '#3b82f6',
    highlight: '#dbeafe',
    glow: 'rgba(59, 130, 246, 0.65)',
    glowSoft: 'rgba(59, 130, 246, 0.25)',
    border: 'rgba(37, 99, 235, 0.55)',
    borderSubtle: 'rgba(30, 58, 138, 0.35)',
    bgDark: '#040914',
    bgCard: 'linear-gradient(135deg, rgba(15, 35, 71, 0.94) 0%, rgba(8, 19, 38, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #bfdbfe 100%)',
    textActive: '#172554',
    textAccent: '#60a5fa',
    textLight: '#dbeafe',
    roadGradient: 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%)',
    roadShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #0d2244 0%, #061122 50%, #02060d 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #dbeafe 35%, #3b82f6 80%, #1d4ed8 100%)',
    medalBorder: '#93c5fd',
    progressGradient: 'linear-gradient(90deg, #1d4ed8 0%, #3b82f6 50%, #93c5fd 100%)',
    progressShadow: '0 0 10px rgba(59, 130, 246, 0.7)',
    fundoAssetUrl: greciaFilosofosFundo,
    isCustomFundo: false,
  },
  trabalho: {
    id: 'trabalho',
    nome: 'Direito do Trabalho',
    primary: '#9333ea',
    accent: '#a855f7',
    highlight: '#f3e8ff',
    glow: 'rgba(168, 85, 247, 0.65)',
    glowSoft: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(147, 51, 234, 0.55)',
    borderSubtle: 'rgba(88, 28, 135, 0.35)',
    bgDark: '#09040e',
    bgCard: 'linear-gradient(135deg, rgba(37, 18, 61, 0.94) 0%, rgba(21, 9, 36, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 50%, #e9d5ff 100%)',
    textActive: '#3b0764',
    textAccent: '#c084fc',
    textLight: '#f3e8ff',
    roadGradient: 'linear-gradient(180deg, #d8b4fe 0%, #a855f7 50%, #7e22ce 100%)',
    roadShadow: '0 0 10px rgba(168, 85, 247, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #231039 0%, #10061a 50%, #050208 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #f3e8ff 35%, #a855f7 80%, #7e22ce 100%)',
    medalBorder: '#d8b4fe',
    progressGradient: 'linear-gradient(90deg, #7e22ce 0%, #a855f7 50%, #d8b4fe 100%)',
    progressShadow: '0 0 10px rgba(168, 85, 247, 0.7)',
    fundoAssetUrl: greciaFilosofosFundo,
    isCustomFundo: false,
  },
  'processual-civil': {
    id: 'processual-civil',
    nome: 'Processo Civil',
    primary: '#0891b2',
    accent: '#06b6d4',
    highlight: '#cffafe',
    glow: 'rgba(6, 182, 212, 0.65)',
    glowSoft: 'rgba(6, 182, 212, 0.25)',
    border: 'rgba(8, 145, 178, 0.55)',
    borderSubtle: 'rgba(14, 116, 144, 0.35)',
    bgDark: '#030d10',
    bgCard: 'linear-gradient(135deg, rgba(12, 43, 51, 0.94) 0%, rgba(6, 23, 28, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #cffafe 0%, #ecfeff 50%, #a5f3fc 100%)',
    textActive: '#083344',
    textAccent: '#22d3ee',
    textLight: '#cffafe',
    roadGradient: 'linear-gradient(180deg, #67e8f9 0%, #06b6d4 50%, #0e7490 100%)',
    roadShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #0b2930 0%, #051417 50%, #020708 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #cffafe 35%, #06b6d4 80%, #0e7490 100%)',
    medalBorder: '#67e8f9',
    progressGradient: 'linear-gradient(90deg, #0e7490 0%, #06b6d4 50%, #67e8f9 100%)',
    progressShadow: '0 0 10px rgba(6, 182, 212, 0.7)',
    fundoAssetUrl: greciaFilosofosFundo,
    isCustomFundo: false,
  },
  'processual-penal': {
    id: 'processual-penal',
    nome: 'Processo Penal',
    primary: '#e11d48',
    accent: '#f43f5e',
    highlight: '#ffe4e6',
    glow: 'rgba(244, 63, 94, 0.75)',
    glowSoft: 'rgba(244, 63, 94, 0.35)',
    border: 'rgba(244, 63, 94, 0.55)',
    borderSubtle: 'rgba(159, 18, 57, 0.45)',
    bgDark: '#0e0406',
    bgCard: 'linear-gradient(135deg, rgba(51, 15, 24, 0.94) 0%, rgba(28, 8, 13, 0.94) 100%)',
    bgActive: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 45%, #fecdd3 100%)',
    textActive: '#4c0519',
    textAccent: '#fb7185',
    textLight: '#ffe4e6',
    roadGradient: 'linear-gradient(180deg, #fb7185 0%, #f43f5e 50%, #9f1239 100%)',
    roadShadow: '0 0 12px rgba(244, 63, 94, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #2d0d15 0%, #16060a 50%, #070204 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #ffe4e6 35%, #f43f5e 80%, #9f1239 100%)',
    medalBorder: '#fb7185',
    progressGradient: 'linear-gradient(90deg, #9f1239 0%, #e11d48 50%, #fb7185 100%)',
    progressShadow: '0 0 10px rgba(244, 63, 94, 0.7)',
    fundoAssetUrl: direitoPenalFundo,
    isCustomFundo: true,
  },
  tributario: {
    id: 'tributario',
    nome: 'Direito Tributário',
    primary: '#d97706',
    accent: '#f59e0b',
    highlight: '#fef3c7',
    glow: 'rgba(245, 158, 11, 0.65)',
    glowSoft: 'rgba(245, 158, 11, 0.25)',
    border: 'rgba(217, 119, 6, 0.55)',
    borderSubtle: 'rgba(120, 53, 15, 0.35)',
    bgDark: '#0a0705',
    bgCard: 'linear-gradient(135deg, rgba(32, 22, 14, 0.92) 0%, rgba(48, 33, 20, 0.92) 100%)',
    bgActive: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fde68a 100%)',
    textActive: '#451a03',
    textAccent: '#f59e0b',
    textLight: '#fef3c7',
    roadGradient: 'linear-gradient(180deg, #fde047 0%, #f59e0b 50%, #b45309 100%)',
    roadShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
    modalBg: 'radial-gradient(ellipse at 50% 15%, #1c1108 0%, #0c0805 50%, #050302 100%)',
    medalActive: 'radial-gradient(circle at 32% 30%, #ffffff 0%, #fef08a 35%, #f59e0b 80%, #b45309 100%)',
    medalBorder: '#fef08a',
    progressGradient: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fde047 100%)',
    progressShadow: '0 0 10px rgba(245, 158, 11, 0.7)',
    fundoAssetUrl: greciaFilosofosFundo,
    isCustomFundo: false,
  },
};

export function getDisciplinaVisualTheme(disciplinaOuSlug?: string | null): DisciplinaVisualTheme {
  if (!disciplinaOuSlug) return TEMAS_DISCIPLINAS.administrativo;
  const s = String(disciplinaOuSlug).toLowerCase().replace(/[^a-z0-9-]/g, '-');

  if (s.includes('process') && s.includes('penal')) return TEMAS_DISCIPLINAS['processual-penal'];
  if (s.includes('penal')) return TEMAS_DISCIPLINAS.penal;
  if (s.includes('admin')) return TEMAS_DISCIPLINAS.administrativo;
  if (s.includes('const')) return TEMAS_DISCIPLINAS.constitucional;
  if (s.includes('trab')) return TEMAS_DISCIPLINAS.trabalho;
  if (s.includes('process') && s.includes('civil')) return TEMAS_DISCIPLINAS['processual-civil'];
  if (s.includes('civil')) return TEMAS_DISCIPLINAS.civil;
  if (s.includes('tribut')) return TEMAS_DISCIPLINAS.tributario;

  return TEMAS_DISCIPLINAS.administrativo;
}
