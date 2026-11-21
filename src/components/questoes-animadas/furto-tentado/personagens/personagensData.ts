export interface CharacterConfig {
  name: string;
  role: string;
  skin: string;
  hair: string;
  hairStyle: 'cacheado' | 'curto' | 'careca' | 'black' | 'coque' | 'rabo';
  top: string;
  bottom: string;
  leg: string;
  h: number;
  skirt?: boolean;
  skirtLen?: number;
  earring?: boolean;
  blush?: boolean;
  lip?: string;
  cap?: string;
  uniform?: boolean;
  badge?: boolean;
  headset?: boolean;
}

export const CHARS: Record<string, CharacterConfig> = {
  amanda: {
    name: 'Amanda',
    role: 'agente',
    skin: '#7a4a21',
    hair: '#17110c',
    hairStyle: 'cacheado',
    top: '#b3372f',
    bottom: '#5b2333',
    leg: '#e8b98a',
    skirt: true,
    skirtLen: 13,
    h: 1.65,
    earring: true,
    blush: true,
    lip: '#a12633',
  },
  fernando: {
    name: 'Fernando',
    role: 'agente',
    skin: '#f0c08a',
    hair: '#3a2413',
    hairStyle: 'curto',
    top: '#2e5f8a',
    bottom: '#33415c',
    leg: '#33415c',
    h: 1.78,
    cap: '#22304d',
  },
  chefe: {
    name: 'Seg. Carlos',
    role: 'chefe de segurança',
    skin: '#5b3a1e',
    hair: '#111',
    hairStyle: 'careca',
    top: '#26355c',
    bottom: '#1d2742',
    leg: '#1d2742',
    h: 1.82,
    uniform: true,
    badge: true,
  },
  operador: {
    name: 'Oper. Rafa',
    role: 'operador de câmeras',
    skin: '#c68850',
    hair: '#0f0f0f',
    hairStyle: 'black',
    top: '#6b7280',
    bottom: '#2f3542',
    leg: '#2f3542',
    h: 1.75,
    headset: true,
  },
  seguranca2: {
    name: 'Seg. Paula',
    role: 'segurança',
    skin: '#8a5a2b',
    hair: '#241408',
    hairStyle: 'coque',
    top: '#26355c',
    bottom: '#1d2742',
    leg: '#1d2742',
    h: 1.7,
    uniform: true,
    earring: true,
  },
  advogada: {
    name: 'Dra. Luísa',
    role: 'advogada de defesa',
    skin: '#f4cf9f',
    hair: '#c9a227',
    hairStyle: 'rabo',
    top: '#5e2436',
    bottom: '#33272e',
    leg: '#e8c39a',
    skirt: true,
    skirtLen: 22,
    h: 1.7,
    lip: '#8e2434',
    blush: true,
  },
  cliente1: {
    name: 'Cliente',
    role: 'cliente',
    skin: '#e8b98a',
    hair: '#4a2c14',
    hairStyle: 'curto',
    top: '#3e7d4e',
    bottom: '#4a3b2a',
    leg: '#4a3b2a',
    h: 1.72,
  },
  cliente2: {
    name: 'Cliente',
    role: 'cliente',
    skin: '#6b4226',
    hair: '#0f0f0f',
    hairStyle: 'coque',
    top: '#e0a51f',
    bottom: '#5b2333',
    leg: '#c98d54',
    skirt: true,
    skirtLen: 22,
    h: 1.66,
    earring: true,
  },
};
