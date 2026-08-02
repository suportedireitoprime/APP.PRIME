// Ícone + cor por área do Direito — MESMOS ícones/cores do módulo Aprender,
// para manter o padrão visual entre Aprender e Flashcards.
import {
  Home, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2,
  AlertTriangle, GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb,
  ShoppingCart, Vote, Baby, Truck, Layers, type LucideIcon,
} from 'lucide-react';

type Visual = { icon: LucideIcon; color: string };

const RULES: Array<{ test: RegExp; visual: Visual }> = [
  { test: /administrativ/i,                    visual: { icon: Landmark,      color: '#f97316' } },
  { test: /processual civil|processo civil/i,  visual: { icon: FileText,      color: '#38bdf8' } },
  { test: /processual penal|processo penal/i,  visual: { icon: ShieldCheck,   color: '#a78bfa' } },
  { test: /processual do trabalho/i,           visual: { icon: Hammer,        color: '#60a5fa' } },
  { test: /penal especial/i,                   visual: { icon: AlertTriangle, color: '#f87171' } },
  { test: /penal|criminal/i,                   visual: { icon: Gavel,         color: '#c2274a' } },
  { test: /constitucional/i,                   visual: { icon: Scale,         color: '#3b82f6' } },
  { test: /tribut/i,                           visual: { icon: DollarSign,    color: '#22c55e' } },
  { test: /trabalho/i,                         visual: { icon: Briefcase,     color: '#a81f40' } },
  { test: /empresarial|comercial/i,            visual: { icon: Building2,     color: '#94a3b8' } },
  { test: /ambiental/i,                        visual: { icon: Leaf,          color: '#10b981' } },
  { test: /urban/i,                            visual: { icon: Building,      color: '#fb923c' } },
  { test: /human/i,                            visual: { icon: Users,         color: '#f472b6' } },
  { test: /internacional privado/i,            visual: { icon: Globe2,        color: '#2dd4bf' } },
  { test: /internacional/i,                    visual: { icon: Globe,         color: '#0ea5e9' } },
  { test: /previdenc|seguridade/i,             visual: { icon: HeartPulse,    color: '#ec4899' } },
  { test: /desportiv/i,                        visual: { icon: Trophy,        color: '#c2274a' } },
  { test: /financeiro/i,                       visual: { icon: Coins,         color: '#c2274a' } },
  { test: /concorrenc/i,                       visual: { icon: Swords,        color: '#c084fc' } },
  { test: /consumidor/i,                       visual: { icon: ShoppingCart,  color: '#ec4899' } },
  { test: /eleitoral/i,                        visual: { icon: Vote,          color: '#8b5cf6' } },
  { test: /criança|adolescente|infan/i,        visual: { icon: Baby,          color: '#fb923c' } },
  { test: /trânsito|transito|transporte/i,     visual: { icon: Truck,         color: '#84cc16' } },
  { test: /formação complementar|formacao/i,   visual: { icon: GraduationCap, color: '#fb923c' } },
  { test: /pesquisa cient/i,                   visual: { icon: Microscope,    color: '#22d3ee' } },
  { test: /políticas públicas|politicas/i,     visual: { icon: Users,         color: '#818cf8' } },
  { test: /portugu/i,                          visual: { icon: BookText,      color: '#fb923c' } },
  { test: /prática|pratica profissional/i,     visual: { icon: ClipboardList, color: '#a8a29e' } },
  { test: /oab|revis[ãa]o/i,                   visual: { icon: Award,         color: '#f87171' } },
  { test: /teoria|filosofia/i,                 visual: { icon: Lightbulb,     color: '#a5b4fc' } },
  { test: /civil/i,                            visual: { icon: Home,          color: '#a81f40' } },
];

const FALLBACK: Visual = { icon: Layers, color: '#94a3b8' };

export function getAreaVisual(nome: string): Visual {
  return RULES.find((r) => r.test.test(nome))?.visual ?? FALLBACK;
}
