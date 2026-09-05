import { Mic, Library, Sparkles, Smartphone, MessageCircle, LucideIcon } from 'lucide-react';

export interface Recording {
  id: string;
  title: string;
  duration_ms: number;
  local_path: string | null;
  file_path: string | null;
  transcript: string | null;
  summary: any;
  status: string;
  mode: string;
  source: string;
  tags: string[];
  created_at: string;
}

export type View = 'hub' | 'gravar' | 'lista' | 'resumo' | 'celular' | 'whatsapp';

export const TAG_SUGESTOES = [
  'Direito Penal',
  'Direito Civil',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Tributário',
  'Direito do Trabalho',
  'Direito Processual Civil',
  'Direito Processual Penal',
  'Direito Empresarial',
  'Direito Previdenciário',
  'OAB',
  'Concurso',
];

export const WHATSAPP_FILE_HINT = /^(PTT|AUD)-\d{8}-WA/i;

export const TITLE_FOR_VIEW: Record<View, string> = {
  hub: 'Gravar aula',
  gravar: 'Gravar aula',
  lista: 'Minhas gravações',
  resumo: 'Gerar resumo',
  celular: 'Áudio do celular',
  whatsapp: 'Áudio do WhatsApp',
};

export interface HubItem {
  id: View;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export const HUB_ITENS: HubItem[] = [
  { id: 'gravar', label: 'Gravar aula', desc: 'Comece uma nova gravação com pausa e retomada', icon: Mic },
  { id: 'lista', label: 'Minhas gravações', desc: 'Ver, ouvir e gerenciar gravações salvas', icon: Library },
  { id: 'resumo', label: 'Gerar resumo da gravação', desc: 'Escolha uma gravação e gere resumo estruturado com IA', icon: Sparkles },
  { id: 'celular', label: 'Trazer áudio do celular', desc: 'Envie um arquivo de áudio salvo no seu aparelho', icon: Smartphone },
  { id: 'whatsapp', label: 'Trazer áudio do WhatsApp', desc: 'Compartilhe áudios de conversas direto pra cá', icon: MessageCircle },
];
