import React from "react";

export type Section = "enviar" | "programadas" | "dashboard" | "diagnostico" | "historico";

export const SECTION_META: Record<Section, { title: string; subtitle?: string }> = {
  enviar: { title: "Enviar Push Manual", subtitle: "Compor e disparar uma notificação" },
  programadas: { title: "Notificações Programadas", subtitle: "Automações e campanhas agendadas" },
  dashboard: { title: "Dashboard de Push", subtitle: "Métricas detalhadas de envio e abertura" },
  diagnostico: { title: "Diagnóstico", subtitle: "Testar tokens e canais" },
  historico: { title: "Histórico Completo", subtitle: "Todas as campanhas já enviadas" },
};

export type Platform = "android" | "ios" | "web";
export type PremiumFilter = "all" | "premium" | "free";
export type SendMode = "now" | "scheduled";
export type Recurrence = "none" | "daily" | "weekly";
export type Channel = "app" | "horus" | "both";

export const TITULO_TEMPLATES: { label: string; value: string }[] = [
  { label: "Boletim jurídico do dia", value: "📰 Boletim jurídico do dia" },
  { label: "Novo artigo no blog", value: "✍️ Novo artigo no blog" },
  { label: "Radar de leis", value: "⚖️ Radar de leis" },
  { label: "Novidade no OAB na Risca", value: "🎯 Novidade no OAB na Risca" },
  { label: "Nova aula disponível", value: "🎓 Nova aula disponível" },
  { label: "Lembrete de estudo", value: "⏰ Hora de estudar!" },
  { label: "Atualização importante", value: "🔔 Atualização importante" },
];

export const MENSAGEM_TEMPLATES: { label: string; value: string }[] = [
  { label: "Boletim pronto", value: "Seu boletim jurídico de hoje já está disponível. Ouça agora e fique por dentro das principais novidades." },
  { label: "Novo artigo no blog", value: "Acabou de sair um novo artigo no blog. Toque para ler agora." },
  { label: "Radar de leis", value: "Novas leis e projetos foram monitorados. Confira os impactos no Radar 360." },
  { label: "Lembrete de estudo", value: "Que tal 10 minutos de estudo agora? Continue de onde parou." },
  { label: "Novidade OAB", value: "Nova questão comentada disponível. Reforce seu preparo para a OAB." },
  { label: "Atualização do app", value: "Trouxemos melhorias importantes. Abra o app para conferir." },
];

export interface Campaign {
  id: string;
  title: string;
  body: string;
  url: string | null;
  status: string;
  audience: any;
  scheduled_at: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  recurrence: any;
  tipo: string | null;
  sent_count: number;
  failed_count: number;
  delivered_count: number;
  opened_count: number;
  converted_count: number;
  created_at: string;
}

export interface TokenStats {
  total: number;
  android: number;
  ios: number;
  web: number;
}

export const PLATFORM_LABEL: Record<Platform, string> = { android: "Android", ios: "iOS", web: "Web" };

export const DESTINOS: { group: string; items: { label: string; path: string }[] }[] = [
  {
    group: "Principais",
    items: [
      { label: "Início", path: "/" },
      { label: "Novidades", path: "/novidades" },
      { label: "Notícias", path: "/noticias" },
      { label: "Radar 360", path: "/radar-360" },
      { label: "Aprender", path: "/aprender" },
      { label: "Estudar", path: "/estudos" },
      { label: "Ferramentas", path: "/ferramentas" },
      { label: "Biblioteca", path: "/biblioteca" },
      { label: "Resumos", path: "/resumos" },
      { label: "Narração", path: "/narracao" },
      { label: "Grafo de Artigos", path: "/grafo-artigos" },
    ],
  },
  {
    group: "Radar",
    items: [
      { label: "Deputados", path: "/radar/deputados" },
      { label: "Proposições", path: "/radar/proposicoes" },
      { label: "Rankings", path: "/radar/rankings" },
      { label: "Votações", path: "/radar/votacoes" },
    ],
  },
  {
    group: "Conta",
    items: [
      { label: "Perfil", path: "/perfil" },
      { label: "Assinatura", path: "/assinatura" },
      { label: "Planos", path: "/assinatura" },
      { label: "Configurações", path: "/configuracoes" },
      { label: "Lembretes", path: "/ajustes/lembretes" },
      { label: "Segurança", path: "/ajustes/seguranca" },
      { label: "Newsletter", path: "/newsletter" },
    ],
  },
  {
    group: "Institucional",
    items: [
      { label: "Sobre", path: "/sobre" },
      { label: "Termos", path: "/termos" },
      { label: "Privacidade", path: "/privacidade" },
      { label: "Landing", path: "/landing" },
    ],
  },
];

export type OpenRow = {
  event_id: string;
  campaign_id: string;
  campaign_title: string | null;
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  platform: string | null;
  install_id: string | null;
  opened_at: string;
};

export type JourneyStep = { step: number; route: string; title: string | null; at: string };

export function initialsFrom(name: string | null, email: string | null): string {
  const src = (name && name !== "—" ? name : email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : src.slice(0, 2);
  return letters.toUpperCase();
}

export function colorFromId(id: string | null): string {
  if (!id) return "hsl(210 15% 40%)";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(hash) % 360} 55% 45%)`;
}

export function normalizePlatform(p: string | null | undefined): "android" | "ios" | "web" | null {
  if (!p) return null;
  const v = String(p).toLowerCase();
  if (v.includes("android")) return "android";
  if (v.includes("ios") || v.includes("iphone") || v.includes("ipad") || v === "apple") return "ios";
  if (v.includes("web") || v.includes("browser") || v.includes("chrome") || v.includes("firefox") || v.includes("safari") || v.includes("edge")) return "web";
  return null;
}
