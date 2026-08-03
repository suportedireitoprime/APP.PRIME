import {
  FileText,
  Shield,
  Gavel,
  FileSignature,
  Stamp,
  Mail,
  Scale,
  Briefcase,
  ClipboardList,
  BookOpenCheck,
  Files,
  ScrollText,
  Table2,
  Users,
  Microscope,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

export interface EstiloPasta {
  label: string;
  icon: LucideIcon;
  color: string;
}

const REGRAS: Array<{ re: RegExp; icon: LucideIcon; color: string }> = [
  { re: /peti[cç]|inicia|a[cç][õo]es/i, icon: FileText, color: '#D4A62A' },
  { re: /recurso|defesa|incidente|contesta/i, icon: Shield, color: '#5EA9E6' },
  { re: /jurisprud/i, icon: Gavel, color: '#C97BD6' },
  { re: /contrato/i, icon: FileSignature, color: '#63C98F' },
  { re: /procura|declara/i, icon: Stamp, color: '#E8874B' },
  { re: /carta|comunicad|notifica/i, icon: Mail, color: '#7C9CF0' },
  { re: /ata|escritura|of[ií]cio/i, icon: ScrollText, color: '#B9A05B' },
  { re: /planilha|c[aá]lculo/i, icon: Table2, color: '#54C4C4' },
  { re: /curr[ií]culo|rh|pessoa/i, icon: Users, color: '#9C86E0' },
  { re: /per[ií]cia|quesito/i, icon: Microscope, color: '#E86A6A' },
  { re: /doutrina|guia|apoio|material/i, icon: BookOpenCheck, color: '#9AA4B2' },
  { re: /modelo|formul[aá]rio/i, icon: ClipboardList, color: '#D9A24E' },
  { re: /administrativ|tribut|fiscal/i, icon: Landmark, color: '#6FB1D6' },
];

/** Nome da pasta do Drive ("01 - Petições Iniciais") -> rótulo + ícone + cor. */
export function estiloPasta(nome: string): EstiloPasta {
  const label = nome.replace(/^\s*\d+\s*[-–.]\s*/, '').trim() || nome;
  const regra = REGRAS.find((r) => r.re.test(label));
  return { label, icon: regra?.icon ?? Files, color: regra?.color ?? '#9AA4B2' };
}

export function formatarTamanho(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extensaoDe(nome: string, mime: string): string {
  const m = nome.match(/\.([a-z0-9]{2,5})$/i);
  if (m) return m[1].toUpperCase();
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLS';
  return 'ARQ';
}
