import { StyleSheet } from '@react-pdf/renderer';
import type { ChatSource } from '@/components/chat/ChatSources';

export type ArtifactKind = 'flashcards' | 'questoes' | 'mapa' | 'termos';

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  data: any;
  sourceId: string;
  createdAt: number;
  title: string;
}

export interface Attachment {
  mime: string;
  data: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: Attachment;
  createdAt: number;
  sources?: ChatSource[];
  webSearch?: boolean;
  thoughtTime?: number;
}

export interface Session {
  id: string;
  date: string;
  title: string;
  messages: Message[];
  artifacts?: Artifact[];
  updatedAt: number;
}

export const HIST_KEY = 'chat_juridico_hist_v2';

export const ANALYZE_STEPS = [
  'Interpretando sua pergunta',
  'Consultando fontes jurídicas',
  'Analisando artigos e súmulas',
  'Estruturando resposta',
];

export const SUGGESTIONS_POOL = [
  'O que é habeas corpus?',
  'Explique o Art. 5º da CF',
  'Diferença entre dolo e culpa',
  'O que é usucapião?',
  'Como funciona a legítima defesa?',
  'Princípios do direito administrativo',
  'O que é súmula vinculante?',
  'Prescrição no direito penal',
  'Diferença entre furto e roubo',
  'Responsabilidade civil objetiva',
  'Como funciona o mandado de segurança?',
  'O que são cláusulas pétreas?',
  'Princípio da anterioridade tributária',
  'O que é boa-fé objetiva?',
  'Diferença entre STF e STJ',
  'O que é improbidade administrativa?',
  'Explique o devido processo legal',
  'O que é coisa julgada?',
];

export function pickSuggestions(n = 4): string[] {
  const arr = [...SUGGESTIONS_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  h: { fontSize: 14, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  p: { fontSize: 11, lineHeight: 1.55, marginBottom: 8 },
});

export function stripMd(t: string) {
  return t.replace(/[*_`#>[\]()]/g, '').replace(/\n{3,}/g, '\n\n');
}

export function loadSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSessions(s: Session[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(s.slice(0, 100)));
}
