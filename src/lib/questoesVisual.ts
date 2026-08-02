import {
  Scale, Gavel, Landmark, Users, Briefcase, Building2, Leaf, Globe2,
  FileText, Coins, ShieldCheck, HeartHandshake, BookOpen, Baby, Truck,
} from 'lucide-react';

export type AreaVisual = { icon: typeof Scale; color: string };

const REGRAS: { test: RegExp; visual: AreaVisual }[] = [
  { test: /constitucional/i, visual: { icon: Scale, color: '#A78BFA' } },
  { test: /penal|criminal/i, visual: { icon: Gavel, color: '#F87171' } },
  { test: /administrativ/i, visual: { icon: Landmark, color: '#F97316' } },
  { test: /civil/i, visual: { icon: Users, color: '#60A5FA' } },
  { test: /trabalh/i, visual: { icon: Briefcase, color: '#34D399' } },
  { test: /tribut|fiscal/i, visual: { icon: Coins, color: '#FBBF24' } },
  { test: /empresarial|comercial/i, visual: { icon: Building2, color: '#38BDF8' } },
  { test: /ambient/i, visual: { icon: Leaf, color: '#4ADE80' } },
  { test: /internacional/i, visual: { icon: Globe2, color: '#22D3EE' } },
  { test: /processual|processo/i, visual: { icon: FileText, color: '#C084FC' } },
  { test: /previdenci/i, visual: { icon: ShieldCheck, color: '#2DD4BF' } },
  { test: /consumidor/i, visual: { icon: HeartHandshake, color: '#FB7185' } },
  { test: /crian|adolesc|estatuto/i, visual: { icon: Baby, color: '#F472B6' } },
  { test: /transit|trânsit/i, visual: { icon: Truck, color: '#FCD34D' } },
  { test: /portugu|redaç/i, visual: { icon: BookOpen, color: '#93C5FD' } },
];

const PALETA = ['#8B5CF6', '#A78BFA', '#C084FC', '#818CF8', '#7C3AED', '#9333EA'];

export function visualDaArea(nome?: string | null): AreaVisual {
  const n = nome ?? '';
  for (const r of REGRAS) if (r.test.test(n)) return r.visual;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { icon: Scale, color: PALETA[h % PALETA.length] };
}

/** Letra da alternativa a partir do gabarito (aceita "A", "a)", "Letra B", etc.). */
export function letraGabarito(g?: string | null): string | null {
  if (!g) return null;
  const m = String(g).trim().toUpperCase().match(/\b([A-E])\b/);
  return m ? m[1] : null;
}
