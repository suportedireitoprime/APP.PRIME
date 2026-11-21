export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function visemeFor(ch?: string): string {
  if (!ch) return 'X';
  ch = ch.toUpperCase();
  if ('MBP'.includes(ch)) return 'A';
  if ('FV'.includes(ch)) return 'F';
  if ('OUWQ'.includes(ch)) return 'E';
  if ('AEÁÉÊ'.includes(ch)) return 'D';
  if ('IÍJY'.includes(ch)) return 'B';
  if ('LRNSTDZCKG'.includes(ch)) return 'C';
  return 'X';
}

export function estDur(text: string): number {
  return clamp(text.split(' ').length * 0.44, 2.1, 8.5);
}

export const SPEAK2CHAR: Record<string, string> = {
  AMANDA: 'amanda',
  FERNANDO: 'fernando',
  'SEG. CARLOS': 'chefe',
  OPERADOR: 'operador',
  'DRA. LUÍSA': 'advogada',
};

export interface VoiceProfile {
  pitch: number;
  rate: number;
  gender: 'female' | 'male';
}

export const CHARACTER_VOICE_CONFIGS: Record<string, VoiceProfile> = {
  NARRADORA: { pitch: 1.05, rate: 1.02, gender: 'female' },
  AMANDA: { pitch: 1.25, rate: 1.04, gender: 'female' },
  FERNANDO: { pitch: 0.95, rate: 0.98, gender: 'male' },
  'SEG. CARLOS': { pitch: 0.78, rate: 0.92, gender: 'male' },
  OPERADOR: { pitch: 1.15, rate: 1.08, gender: 'male' },
  'DRA. LUÍSA': { pitch: 1.12, rate: 1.0, gender: 'female' },
};
