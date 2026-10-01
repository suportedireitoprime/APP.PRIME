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

export const EVENTOS_FIXOS: EventoBase[] = [
  {
    hora: 6, minuto: 0, automation_key: "boletim_juridico_diario",
    nome: "Boletim Jurídico Matinal", emoji: "📰", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "Boletim matinal consolidando as principais notícias e movimentações jurídicas.",
    publico: "Todos com push habilitado",
    regra: "Envia o boletim diário.",
    titulo_exemplo: "📰 Boletim do Dia: O que você precisa saber hoje",
    corpo_exemplo: "☕ Leitura rápida para não ficar desatualizado na prática.",
    capa_default: "/assets/push/capa-noticias-juridicas.webp",
    tags_persuasao: ["Autoridade", "Prática Forense", "Micro-leitura"],
    gatilho_mental: "Prova Social & Conhecimento Estratégico",
  },
  {
    hora: 8, minuto: 0, automation_key: "push-aleatorio-audio-1",
    nome: "Audioaula Matinal", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Início do dia com uma audioaula para ouvir no trânsito ou café.",
    publico: "Todos os usuários",
    regra: "Puxa uma audioaula aleatória para revisão passiva.",
    titulo_exemplo: "🎧 Audioaula do Dia: Dê o play a caminho do trabalho",
    corpo_exemplo: "Comece o dia já revisando um conteúdo importante enquanto se desloca.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Áudio Rápido", "Multitarefa", "Início de Dia"],
    gatilho_mental: "Facilidade & Produtividade Inicial",
  },
  {
    hora: 10, minuto: 0, automation_key: "push-aleatorio-video-1",
    nome: "Videoaula Matinal", emoji: "📺", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Videoaula aleatória matinal para iniciar os estudos ativos.",
    publico: "Todos os usuários",
    regra: "Puxa uma videoaula aleatória do acervo.",
    titulo_exemplo: "📺 Primeira Meta do Dia: Videoaula Estratégica",
    corpo_exemplo: "Aproveite a manhã para assistir essa aula com foco total.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Estudo Ativo", "Foco", "Consistência"],
    gatilho_mental: "Conclusão de Meta & Reforço Positivo",
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
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Conteúdo Exclusivo", "Leitura de Pausa", "Atualização"],
    gatilho_mental: "Curiosidade & Recompensa Imprevisível",
  },
  {
    hora: 14, minuto: 0, automation_key: "push-aleatorio-livro",
    nome: "Livro da Biblioteca", emoji: "📚", canal: "app",
    papel: "unico", deep_link: "/biblioteca",
    descricao: "Recomendação de um livro ou trecho doutrinário.",
    publico: "Todos os usuários",
    regra: "Puxa um livro aleatório da biblioteca.",
    titulo_exemplo: "📚 Indicação da Biblioteca: Um livro essencial",
    corpo_exemplo: "Adicione esse clássico à sua fila de leitura e amplie sua base teórica.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Doutrina Clássica", "Leitura Profunda", "Autoridade"],
    gatilho_mental: "Escassez de Conhecimento & Curiosidade",
  },
  {
    hora: 16, minuto: 0, automation_key: "push-aleatorio-audio-2",
    nome: "Audioaula da Tarde", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Audioaula no meio da tarde para estudo multitarefa.",
    publico: "Todos os usuários",
    regra: "Puxa uma audioaula aleatória para revisão passiva.",
    titulo_exemplo: "🎧 Coloque o fone de ouvido: Uma audioaula surpresa para sua tarde",
    corpo_exemplo: "Aproveite para revisar um conteúdo importante enquanto faz outras atividades.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Áudio Rápido", "Multitarefa", "Revisão Passiva"],
    gatilho_mental: "Facilidade & Aproveitamento de Tempo Ocioso",
  },
  {
    hora: 18, minuto: 0, automation_key: "push-aleatorio-video-2",
    nome: "Videoaula da Noite", emoji: "📺", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Segunda videoaula recomendada no início da noite.",
    publico: "Todos os usuários",
    regra: "Puxa uma videoaula aleatória do acervo.",
    titulo_exemplo: "📺 Fim de Tarde de Foco: Sua segunda videoaula do dia",
    corpo_exemplo: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Estudo Ativo", "Foco", "Consistência"],
    gatilho_mental: "Conclusão de Meta & Reforço Positivo",
  },
  {
    hora: 20, minuto: 0, automation_key: "push-aleatorio-audio-3",
    nome: "Audioaula Noturna", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Terceira audioaula diária para ouvir antes de relaxar.",
    publico: "Todos os usuários",
    regra: "Puxa uma audioaula aleatória para revisão noturna.",
    titulo_exemplo: "🎧 Última Audioaula de Hoje: Revisão de deitar",
    corpo_exemplo: "Dê o play e revise esse conteúdo rapidinho enquanto se prepara para relaxar.",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Revisão Final", "Fixação Noturna", "Estudo Passivo"],
    gatilho_mental: "Fechamento de Ciclo & Recompensa Imprevisível",
  },
  {
    hora: 22, minuto: 0, automation_key: "boletim_noticias_diario",
    nome: "Notícias de Boletins", emoji: "🌙", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "O giro final com o fechamento do dia nos tribunais e noticiários.",
    publico: "Todos os usuários",
    regra: "Resumo final das notícias mais lidas.",
    titulo_exemplo: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
    corpo_exemplo: "Confira as manchetes antes de finalizar o dia e vá dormir atualizado.",
    capa_default: "/assets/push/capa-noticias-juridicas.webp",
    tags_persuasao: ["Fechamento", "Giro Final", "Notícias Relevantes"],
    gatilho_mental: "Aversão à Perda & Informação Completa",
  },
  {
    hora: 0, minuto: 0, automation_key: "push-estudo-madrugada",
    nome: "Hórus Coruja", emoji: "🦉", canal: "app",
    papel: "unico", deep_link: "/horus",
    descricao: "Mensagem motivacional de madrugada para os estudantes noturnos.",
    publico: "Estudantes ativos na madrugada",
    regra: "Mensagem encorajadora com o Hórus.",
    titulo_exemplo: "🦉 Na Madrugada de Estudos? O Hórus tá com você",
    corpo_exemplo: "Todo esse esforço no silêncio da noite vai valer a pena. Foco total!",
    capa_default: "/assets/push/capa-estudo-horus.webp",
    tags_persuasao: ["Motivação Extrema", "Apoio Emocional", "Acompanhamento"],
    gatilho_mental: "Empatia & Pertencimento",
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

