export const STORAGE_KEYS = {
  BASE_URL: 'omniroute_test_base_url',
  API_KEY: 'omniroute_test_api_key',
  LAST_MODEL: 'omniroute_test_model',
};

export const DEFAULT_BASE_URL = 'http://147.224.236.150:20128/v1';
export const DEFAULT_API_KEY = 'sk-9d114c31bbf54179-6947cb-36742343';

export const normalizeEndpointUrl = (url: string) => {
  let u = (url || '').trim().replace(/\/+$/, '');
  if (!u) return DEFAULT_BASE_URL;
  if (!u.endsWith('/v1')) u += '/v1';
  return u;
};

export interface AntigravityModelInfo {
  id: string;
  name: string;
  group: 'Google Gemini' | 'Anthropic Claude' | 'OpenAI GPT' | 'Auto Roteado';
}

export const ANTIGRAVITY_TEXT_MODELS: AntigravityModelInfo[] = [
  { id: 'antigravity/gemini-3.8-flash-tiered', name: 'Gemini 3.8 Flash Tiered', group: 'Google Gemini' },
];

export const POPULAR_IMAGE_MODELS = ['antigravity/gemini-3.1-flash-image'];
export const POPULAR_VISION_MODELS = ['antigravity/gemini-3.8-flash-tiered'];
export const POPULAR_AUDIO_MODELS = ['antigravity/gemini-3.8-flash-tiered', 'whisper-1'];

export interface FeatureStyle {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentHex: string;
}

export const FEATURE_STYLES: Record<string, FeatureStyle> = {
  chat_juridico: {
    iconBg: 'bg-[#3B82F6]/15',
    iconBorder: 'border-[#3B82F6]/35',
    iconColor: 'text-[#60A5FA]',
    badgeBg: 'bg-[#3B82F6]/15',
    badgeBorder: 'border-[#3B82F6]/30',
    badgeText: 'text-[#93C5FD]',
    accentHex: '#3B82F6',
  },
  resumo_inteligente: {
    iconBg: 'bg-[#F97316]/15',
    iconBorder: 'border-[#F97316]/35',
    iconColor: 'text-[#FB923C]',
    badgeBg: 'bg-[#F97316]/15',
    badgeBorder: 'border-[#F97316]/30',
    badgeText: 'text-[#FDBA74]',
    accentHex: '#F97316',
  },
  visao_documentos: {
    iconBg: 'bg-[#8B5CF6]/15',
    iconBorder: 'border-[#8B5CF6]/35',
    iconColor: 'text-[#A78BFA]',
    badgeBg: 'bg-[#8B5CF6]/15',
    badgeBorder: 'border-[#8B5CF6]/30',
    badgeText: 'text-[#C4B5FD]',
    accentHex: '#8B5CF6',
  },
  transcricao_audio: {
    iconBg: 'bg-[#10B981]/15',
    iconBorder: 'border-[#10B981]/35',
    iconColor: 'text-[#34D399]',
    badgeBg: 'bg-[#10B981]/15',
    badgeBorder: 'border-[#10B981]/30',
    badgeText: 'text-[#6EE7B7]',
    accentHex: '#10B981',
  },
  geracao_imagens: {
    iconBg: 'bg-[#EC4899]/15',
    iconBorder: 'border-[#EC4899]/35',
    iconColor: 'text-[#F472B6]',
    badgeBg: 'bg-[#EC4899]/15',
    badgeBorder: 'border-[#EC4899]/30',
    badgeText: 'text-[#F9A8D4]',
    accentHex: '#EC4899',
  },
  narracao_vademecum: {
    iconBg: 'bg-[#06B6D4]/15',
    iconBorder: 'border-[#06B6D4]/35',
    iconColor: 'text-[#22D3EE]',
    badgeBg: 'bg-[#06B6D4]/15',
    badgeBorder: 'border-[#06B6D4]/30',
    badgeText: 'text-[#67E8F9]',
    accentHex: '#06B6D4',
  },
  horus_whatsapp: {
    iconBg: 'bg-[#22C55E]/15',
    iconBorder: 'border-[#22C55E]/35',
    iconColor: 'text-[#4ADE80]',
    badgeBg: 'bg-[#22C55E]/15',
    badgeBorder: 'border-[#22C55E]/30',
    badgeText: 'text-[#86EFAC]',
    accentHex: '#22C55E',
  },
  ligacao_live: {
    iconBg: 'bg-[#F43F5E]/15',
    iconBorder: 'border-[#F43F5E]/35',
    iconColor: 'text-[#FB7185]',
    badgeBg: 'bg-[#F43F5E]/15',
    badgeBorder: 'border-[#F43F5E]/30',
    badgeText: 'text-[#FDA4AF]',
    accentHex: '#F43F5E',
  },
};
