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
    url: "/assets/push/capa-radar-leis.webp",
    descricao: "Balança dourada, decretos e estética editorial clássica",
    tag: "Legislação & Radar",
  },
  {
    id: "estudo_horus",
    nome: "Hórus & Metas de Estudo",
    url: "/assets/push/capa-estudo-horus.webp",
    descricao: "Coruja sábia, neon âmbar/roxo e hologramas de aprendizado",
    tag: "Gamificação & Foco",
  },
  {
    id: "noticias_juridicas",
    nome: "Plenário & Notícias STF",
    url: "/assets/push/capa-noticias-juridicas.webp",
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

export const SLOT_FUNCTION_MAP: Record<string, { edgeFunction: string; defaultUrl: string; label: string }> = {
  boletim_leis_matinal: { edgeFunction: "radar-leis-notify", defaultUrl: "/radar-360", label: "Radar de Leis" },
  boletim_juridico_diario: { edgeFunction: "notif-noticias-dia", defaultUrl: "/noticias", label: "Boletim Jurídico" },
  "push-aleatorio-blog": { edgeFunction: "push-aleatorio-blog", defaultUrl: "/blog", label: "Artigo do Blog" },
  "push-aleatorio-audio": { edgeFunction: "push-aleatorio-audio", defaultUrl: "/aprender", label: "Audioaula" },
  "push-aleatorio-video": { edgeFunction: "push-aleatorio-video", defaultUrl: "/aprender", label: "Videoaula" },
  "push-simulado-desafio": { edgeFunction: "send-push", defaultUrl: "/simulados", label: "Simulado & Fixação" },
  boletim_noticias_diario: { edgeFunction: "notif-noticias-dia", defaultUrl: "/noticias", label: "Síntese Noturna" },
};

export const EVENTOS_FIXOS: EventoBase[] = [
  {
    hora: 7, minuto: 0, automation_key: "boletim_leis_matinal",
    nome: "Radar de Leis & DOU", emoji: "📜", canal: "app",
    papel: "unico", deep_link: "/radar-360",
    descricao: "Push matinal oficial com os novos atos normativos e leis publicadas nas últimas 24h.",
    publico: "Todos com opt-in de push",
    regra: "Dispara pontualmente às 07:00 caso haja novas leis ou atos normativos monitorados.",
    titulo_exemplo: "📜 Novas leis publicadas no Diário Oficial hoje!",
    corpo_exemplo: "⚖️ Atos normativos de alto impacto acabam de entrar em vigor. Toque para ler o resumo.",
    capa_default: "/assets/push/capa-radar-leis.webp",
    tags_persuasao: ["Urgência Real", "Curadoria Oficial", "Alta Prioridade"],
    gatilho_mental: "Antecipação & Primazia da Informação",
  },
  {
    hora: 9, minuto: 30, automation_key: "boletim_juridico_diario",
    nome: "Boletim Jurídico & Tribunais", emoji: "📰", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "Boletim matinal consolidando as principais notícias e movimentações jurídicas do STF e STJ.",
    publico: "Todos com push habilitado",
    regra: "Dispara pontualmente às 09:30 (+2h30 do anterior) consolidando as manchetes jurídicas.",
    titulo_exemplo: "📰 Boletim do Dia: O que você precisa saber hoje",
    corpo_exemplo: "☕ Leitura rápida para não ficar desatualizado na prática forense.",
    capa_default: "/assets/push/capa-noticias-juridicas.webp",
    tags_persuasao: ["Autoridade", "Prática Forense", "Micro-leitura"],
    gatilho_mental: "Prova Social & Conhecimento Estratégico",
  },
  {
    hora: 12, minuto: 0, automation_key: "push-aleatorio-blog",
    nome: "Artigo Doutrinário & Blog", emoji: "✍️", canal: "app",
    papel: "unico", deep_link: "/blog",
    descricao: "Destaque do meio-dia: seleciona um artigo de doutrina ou jurisprudência aleatoriamente.",
    publico: "Todos os usuários",
    regra: "Dispara pontualmente às 12:00 (+2h30 do anterior) para a pausa de almoço e estudo.",
    titulo_exemplo: "✍️ Leitura de Meio-Dia: Recomendação Especial para você",
    corpo_exemplo: "Aprofunde-se neste artigo selecionado para a sua pausa de descanso.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Conteúdo Exclusivo", "Leitura de Pausa", "Atualização"],
    gatilho_mental: "Curiosidade & Recompensa Imprevisível",
  },
  {
    hora: 14, minuto: 30, automation_key: "push-aleatorio-audio",
    nome: "Audioaula Estratégica", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Notificação à tarde incentivando o estudo multitarefa com uma audioaula do acervo.",
    publico: "Todos os usuários",
    regra: "Dispara pontualmente às 14:30 (+2h30 do anterior) para revisão passiva no fone de ouvido.",
    titulo_exemplo: "🎧 Coloque o fone de ouvido: Uma audioaula surpresa para sua tarde",
    corpo_exemplo: "Aproveite para revisar um conteúdo importante enquanto faz outras atividades.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Áudio Rápido", "Multitarefa", "Revisão Passiva"],
    gatilho_mental: "Facilidade & Aproveitamento de Tempo Ocioso",
  },
  {
    hora: 17, minuto: 0, automation_key: "push-aleatorio-video",
    nome: "Videoaula do Dia", emoji: "📺", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Convite visual no início da noite para assistir a uma videoaula estratégica.",
    publico: "Todos os usuários",
    regra: "Dispara pontualmente às 17:00 (+2h30 do anterior) com uma videoaula recomendada.",
    titulo_exemplo: "📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje",
    corpo_exemplo: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Estudo Ativo", "Foco", "Consistência"],
    gatilho_mental: "Conclusão de Meta & Reforço Positivo",
  },
  {
    hora: 19, minuto: 30, automation_key: "push-simulado-desafio",
    nome: "Fixação & Questão do Dia", emoji: "🎯", canal: "app",
    papel: "unico", deep_link: "/simulados",
    descricao: "Desafio prático noturno para treinar resolução de questões de concurso e OAB.",
    publico: "Todos os usuários",
    regra: "Dispara pontualmente às 19:30 (+2h30 do anterior) com uma questão comentada rápida.",
    titulo_exemplo: "🎯 Desafio Noturno: Teste seus conhecimentos agora!",
    corpo_exemplo: "Uma questão comentada selecionada para testar seu raciocínio jurídico hoje.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Prática Ativa", "Desafio Rápido", "Preparação OAB"],
    gatilho_mental: "Gamificação & Fixação Diária",
  },
  {
    hora: 22, minuto: 0, automation_key: "boletim_noticias_diario",
    nome: "Síntese Noturna dos Tribunais", emoji: "🌙", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "O giro final com o fechamento do dia nos tribunais e noticiários jurídicos.",
    publico: "Todos os usuários",
    regra: "Dispara pontualmente às 22:00 (+2h30 do anterior) fechando o expediente.",
    titulo_exemplo: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
    corpo_exemplo: "Confira as decisões de destaque antes de finalizar o expediente.",
    capa_default: "/assets/push/capa-noticias-juridicas.webp",
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
  payload: Record<string, unknown> | null;
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

