import React from "react";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MessageCircle, Sparkles } from "lucide-react";

// Canal de disparo
export type Canal = "app" | "horus" | "ambos" | "sistema";

export interface PushPresetCover {
  id: string;
  nome: string;
  url: string;
  descricao: string;
  tag: string;
}

export const PUSH_DEFAULT_COVERS: PushPresetCover[] = [
  {
    id: "radar_leis",
    nome: "Diário Oficial & Leis",
    url: "/assets/push/capa-radar-leis.jpg",
    descricao: "Balança dourada, decretos e estética editorial clássica",
    tag: "Legislação & Radar",
  },
  {
    id: "estudo_horus",
    nome: "Hórus & Metas de Estudo",
    url: "/assets/push/capa-estudo-horus.jpg",
    descricao: "Coruja sábia, neon âmbar/roxo e hologramas de aprendizado",
    tag: "Gamificação & Foco",
  },
  {
    id: "noticias_juridicas",
    nome: "Plenário & Notícias STF",
    url: "/assets/push/capa-noticias-juridicas.jpg",
    descricao: "Tribunais superiores com dados ao vivo e transmissão jurídica",
    tag: "Notícias & Juris",
  },
];

export interface EventoBase {
  hora: number;
  minuto: number;
  automation_key: string;
  nome: string;
  descricao: string;
  emoji: string;
  canal: Canal;
  publico: string;
  regra: string;
  titulo_exemplo: string;
  corpo_exemplo: string;
  capa_default: string;
  tags_persuasao: string[];
  gatilho_mental: string;
  papel?: "principal" | "complemento" | "unico";
  complemento?: Exclude<Canal, "sistema">;
  deep_link?: string;
}

export const EVENTOS_FIXOS: EventoBase[] = [
  {
    hora: 7, minuto: 0, automation_key: "boletim_leis_matinal",
    nome: "Leis Publicadas", emoji: "📜", canal: "app",
    papel: "unico", deep_link: "/radar-360",
    descricao: "Push oficial com os novos atos normativos e leis publicadas nas últimas 24h.",
    publico: "Todos com opt-in de push",
    regra: "Dispara automaticamente às 07:00 caso haja ao menos 1 nova lei no Radar.",
    titulo_exemplo: "📜 [URGENTE] Novas leis publicadas no Diário Oficial hoje!",
    corpo_exemplo: "⚖️ Atos normativos de alto impacto acabam de entrar em vigor. Toque para ler o resumo.",
    capa_default: "/assets/push/capa-radar-leis.jpg",
    tags_persuasao: ["Urgência Real", "Curadoria Oficial", "Alta Prioridade"],
    gatilho_mental: "Antecipação & Primazia da Informação",
  },
  {
    hora: 9, minuto: 0, automation_key: "boletim_juridico_diario",
    nome: "Boletim Jurídico", emoji: "📰", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "Boletim matinal consolidando as principais notícias e movimentações jurídicas.",
    publico: "Todos com push habilitado",
    regra: "Envia o boletim diário.",
    titulo_exemplo: "📰 Boletim do Dia: O que você precisa saber hoje",
    corpo_exemplo: "☕ Leitura rápida para não ficar desatualizado na prática.",
    capa_default: "/assets/push/capa-noticias-juridicas.jpg",
    tags_persuasao: ["Autoridade", "Prática Forense", "Micro-leitura"],
    gatilho_mental: "Prova Social & Conhecimento Estratégico",
  },
  {
    hora: 12, minuto: 0, automation_key: "push-aleatorio-blog",
    nome: "Artigo de Blog Aleatório", emoji: "✍️", canal: "app",
    papel: "unico", deep_link: "/blog",
    descricao: "Destaque do meio-dia: seleciona um artigo de doutrina ou jurisprudência aleatoriamente.",
    publico: "Todos os usuários",
    regra: "Puxa um artigo aleatório do blog para manter a leitura em dia.",
    titulo_exemplo: "✍️ Leitura de Meio-Dia: Recomendação Especial para você",
    corpo_exemplo: "Aprofunde-se neste artigo selecionado para a sua pausa de descanso.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Conteúdo Exclusivo", "Leitura de Pausa", "Atualização"],
    gatilho_mental: "Curiosidade & Recompensa Imprevisível",
  },
  {
    hora: 15, minuto: 0, automation_key: "push-aleatorio-audio",
    nome: "Audioaula Aleatória", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Notificação à tarde incentivando o estudo multitarefa com uma audioaula.",
    publico: "Todos os usuários",
    regra: "Puxa uma audioaula aleatória para revisão passiva.",
    titulo_exemplo: "🎧 Coloque o fone de ouvido: Uma audioaula surpresa para sua tarde",
    corpo_exemplo: "Aproveite para revisar um conteúdo importante enquanto faz outras atividades.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Áudio Rápido", "Multitarefa", "Revisão Passiva"],
    gatilho_mental: "Facilidade & Aproveitamento de Tempo Ocioso",
  },
  {
    hora: 18, minuto: 0, automation_key: "push-aleatorio-video",
    nome: "Videoaula Aleatória", emoji: "📺", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Convite visual no início da noite para assistir a uma videoaula estratégica.",
    publico: "Todos os usuários",
    regra: "Puxa uma videoaula aleatória do acervo.",
    titulo_exemplo: "📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje",
    corpo_exemplo: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Estudo Ativo", "Foco", "Consistência"],
    gatilho_mental: "Conclusão de Meta & Reforço Positivo",
  },
  {
    hora: 21, minuto: 0, automation_key: "boletim_noticias_diario",
    nome: "Notícias de Boletins", emoji: "🌙", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "O giro final com o fechamento do dia nos tribunais e noticiários.",
    publico: "Todos os usuários",
    regra: "Resumo final das notícias mais lidas.",
    titulo_exemplo: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
    corpo_exemplo: "Confira as manchetes antes de finalizar o expediente.",
    capa_default: "/assets/push/capa-noticias-juridicas.jpg",
    tags_persuasao: ["Fechamento", "Giro Final", "Notícias Relevantes"],
    gatilho_mental: "Aversão à Perda & Informação Completa",
  },
];

export interface CampaignRow {
  id: string;
  title: string;
  body: string;
  status: string;
  automation_key: string | null;
  scheduled_at: string | null;
  next_run_at: string | null;
  created_at: string;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  delivered_count: number;
  image_url?: string | null;
  emoji?: string | null;
}

export interface LogRow {
  id: string;
  kind: string;
  tipo: string;
  status: string;
  created_at: string;
  payload: any;
}

export type EventoView = EventoBase & {
  label: string;
  status: "enviado" | "erro" | "agendado" | "previsto" | "nao_enviado";
  badge?: string;
  sent_count?: number;
  failed_count?: number;
  opened_count?: number;
  realTitle?: string;
  realBody?: string;
  realImage?: string;
  campaignId?: string;
  errorMsg?: string;
};

export function padHora(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export { CanalBadge } from "./CanalBadge";

