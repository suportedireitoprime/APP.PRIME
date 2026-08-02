/**
 * Templates prontos de maratona da Temática Jurídica.
 * As obras são resolvidas em tempo de execução a partir do acervo,
 * por habilidade, categoria jurídica, tipo e nota.
 */
import type { HabilidadeId } from "@/lib/tematicaHabilidades";

export interface MaratonaTemplate {
  slug: string;
  nome: string;
  descricao: string;
  emoji: string;
  /** Quantidade alvo de obras */
  alvo: number;
  filtro: {
    habilidades?: HabilidadeId[];
    categorias?: string[];
    tipo?: "movie" | "tv";
    documentario?: boolean;
  };
}

export const MARATONA_TEMPLATES: MaratonaTemplate[] = [
  {
    slug: "classicos-tribunal",
    nome: "Clássicos do Tribunal",
    descricao: "Júri, grandes julgamentos e salas de audiência inesquecíveis.",
    emoji: "⚖️",
    alvo: 6,
    filtro: { habilidades: ["argumentacao", "etica"], tipo: "movie" },
  },
  {
    slug: "fim-de-semana-oratoria",
    nome: "Fim de semana Oratória",
    descricao: "Discursos memoráveis para treinar presença e dicção.",
    emoji: "🎤",
    alvo: 5,
    filtro: { habilidades: ["oratoria", "persuasao"] },
  },
  {
    slug: "criminal-5-noites",
    nome: "Advocacia Criminal em 5 noites",
    descricao: "Cinco noites de defesa, acusação e dilemas do crime.",
    emoji: "🕵️",
    alvo: 5,
    filtro: { categorias: ["Direito Penal", "Direito Processual Penal"] },
  },
  {
    slug: "series-do-zero",
    nome: "Séries para maratonar do zero",
    descricao: "As melhores séries jurídicas para começar hoje.",
    emoji: "📺",
    alvo: 6,
    filtro: { tipo: "tv" },
  },
  {
    slug: "casos-reais",
    nome: "Documentários de casos reais",
    descricao: "Histórias verdadeiras que mudaram a Justiça.",
    emoji: "🎬",
    alvo: 6,
    filtro: { documentario: true },
  },
  {
    slug: "etica-dilemas",
    nome: "Ética e dilemas morais",
    descricao: "Quando o certo e o legal não são a mesma coisa.",
    emoji: "🧭",
    alvo: 5,
    filtro: { habilidades: ["etica", "resiliencia"] },
  },
];

type ObraLike = {
  id: string;
  tipo?: string;
  nota?: number | null;
  habilidades?: string[] | null;
  categorias_juridicas?: string[] | null;
};

const isDoc = (o: ObraLike) => (o.categorias_juridicas ?? []).includes("Documentário");

export function resolverTemplate<T extends ObraLike>(template: MaratonaTemplate, obras: T[]): T[] {
  const { habilidades, categorias, tipo, documentario } = template.filtro;

  const candidatas = obras.filter((o) => {
    if (documentario && !isDoc(o)) return false;
    if (!documentario && isDoc(o) && !categorias) return false;
    if (tipo && o.tipo !== tipo) return false;
    if (habilidades?.length) {
      const hs = (o.habilidades ?? []) as string[];
      if (!habilidades.some((h) => hs.includes(h))) return false;
    }
    if (categorias?.length) {
      const cs = (o.categorias_juridicas ?? []) as string[];
      if (!categorias.some((c) => cs.includes(c))) return false;
    }
    return true;
  });

  const ordenadas = [...candidatas].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
  return ordenadas.slice(0, template.alvo);
}
