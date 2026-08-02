/**
 * Recomendação semanal (sexta-feira) da Temática Jurídica.
 * Escolha determinística a partir do acervo: mesma semana = mesmo filme para todos.
 */

export interface CategoriaRecomendacao {
  id: string;
  label: string;
  emoji: string;
  descricao: string;
  /** habilidades / gêneros que combinam com o contexto */
  habilidades?: string[];
  generos?: string[];
  comidas: string[];
  clima: string;
}

export const CATEGORIAS_RECOMENDACAO: CategoriaRecomendacao[] = [
  {
    id: "sozinho",
    label: "Sozinho",
    emoji: "🧘",
    descricao: "Uma noite só sua, para pensar com calma.",
    habilidades: ["etica", "resiliencia", "estrategia"],
    comidas: ["Pipoca com manteiga temperada", "Chocolate amargo 70%", "Chá gelado de limão"],
    clima: "Luz baixa, celular no silencioso e legenda ligada.",
  },
  {
    id: "a-dois",
    label: "A dois",
    emoji: "❤️",
    descricao: "Para assistir com quem você ama e discutir depois.",
    habilidades: ["persuasao", "negociacao"],
    comidas: ["Tábua de queijos e uvas", "Vinho tinto leve", "Brownie quente com sorvete"],
    clima: "Manta, sofá e pausa no meio para comentar as cenas.",
  },
  {
    id: "amigos",
    label: "Com amigos",
    emoji: "🍿",
    descricao: "Turma reunida, debate garantido no final.",
    habilidades: ["argumentacao", "oratoria"],
    comidas: ["Pizza fatiada", "Batata rústica", "Refrigerante gelado"],
    clima: "Combine um mini-júri: metade defende, metade acusa.",
  },
  {
    id: "juridico",
    label: "Jurídico puro",
    emoji: "⚖️",
    descricao: "Direito do começo ao fim, sem rodeios.",
    habilidades: ["argumentacao", "etica", "investigacao"],
    comidas: ["Café coado forte", "Castanhas", "Água com gás e limão"],
    clima: "Caderno do lado: anote as teses que aparecerem.",
  },
  {
    id: "leve",
    label: "Leve",
    emoji: "😄",
    descricao: "Descontraído, para descansar a cabeça.",
    generos: ["Comédia", "Comedy", "Drama"],
    comidas: ["Pipoca doce", "Sorvete de casquinha", "Suco natural"],
    clima: "Sem cobrança: hoje é só diversão.",
  },
  {
    id: "impacto",
    label: "Impacto real",
    emoji: "🔥",
    descricao: "Casos verdadeiros que marcaram a Justiça.",
    habilidades: ["investigacao", "lideranca"],
    comidas: ["Sanduíche natural", "Suco de uva integral", "Amendoim torrado"],
    clima: "Depois procure o caso real: a história continua fora da tela.",
  },
];

export const CATEGORIAS_MAP = Object.fromEntries(
  CATEGORIAS_RECOMENDACAO.map((c) => [c.id, c]),
) as Record<string, CategoriaRecomendacao>;

type ObraLike = {
  id: string;
  titulo: string;
  nota?: number | null;
  habilidades?: string[] | null;
  generos?: string[] | null;
  categorias_juridicas?: string[] | null;
};

/** Próxima sexta-feira (ou a de hoje, se hoje for sexta) a partir de uma data. */
export function proximaSexta(base = new Date()): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const delta = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export function listarSextas(qtd = 8, base = new Date()): Date[] {
  const primeira = proximaSexta(base);
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(primeira);
    d.setDate(d.getDate() + i * 7);
    return d;
  });
}

function chaveSemana(d: Date): number {
  const ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

/** Hash determinístico simples. */
function hash(n: number): number {
  let x = n * 2654435761;
  x = (x ^ (x >>> 13)) >>> 0;
  x = (x * 1597334677) >>> 0;
  return x >>> 0;
}

export function categoriaDaSexta(data: Date): CategoriaRecomendacao {
  const idx = hash(chaveSemana(data) + 17) % CATEGORIAS_RECOMENDACAO.length;
  return CATEGORIAS_RECOMENDACAO[idx];
}

export function obrasDaCategoria<T extends ObraLike>(
  categoria: CategoriaRecomendacao,
  obras: T[],
): T[] {
  const casa = obras.filter((o) => {
    const hs = (o.habilidades ?? []) as string[];
    const gs = (o.generos ?? []) as string[];
    const porHab = categoria.habilidades?.some((h) => hs.includes(h)) ?? false;
    const porGen = categoria.generos?.some((g) => gs.includes(g)) ?? false;
    return porHab || porGen;
  });
  const base = casa.length >= 4 ? casa : obras;
  return [...base].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0)).slice(0, 12);
}

export interface SextaRecomendada<T> {
  data: Date;
  categoria: CategoriaRecomendacao;
  obra: T | null;
}

/** Monta a agenda das próximas sextas, sem repetir obras entre elas. */
export function montarAgenda<T extends ObraLike>(
  obras: T[],
  qtd = 8,
  base = new Date(),
): SextaRecomendada<T>[] {
  const usadas = new Set<string>();
  return listarSextas(qtd, base).map((data) => {
    const categoria = categoriaDaSexta(data);
    const pool = obrasDaCategoria(categoria, obras).filter((o) => !usadas.has(o.id));
    const fonte = pool.length ? pool : obras.filter((o) => !usadas.has(o.id));
    let obra: T | null = null;
    if (fonte.length) {
      obra = fonte[hash(chaveSemana(data)) % fonte.length];
      usadas.add(obra.id);
    }
    return { data, categoria, obra };
  });
}

export function formatarSexta(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}
