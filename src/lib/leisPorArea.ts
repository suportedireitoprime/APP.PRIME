import { LEIS_CATALOG, LeiCatalogItem } from "@/data/leisCatalog";

export interface AreaLeis {
  id: string;
  nome: string;
  color: string;
  ids: string[];
}

/** Agrupamento das leis do catálogo por área do Direito. */
export const AREAS_LEIS: AreaLeis[] = [
  { id: "constitucional", nome: "Direito Constitucional", color: "#c2274a", ids: ["cf88", "lms", "lhd", "lmi", "lap", "lai", "eir", "eind"] },
  { id: "administrativo", nome: "Direito Administrativo", color: "#38bdf8", ids: ["l8112", "lia", "nll", "lpaf", "lrf", "lcon", "lppp", "lace", "lotcu", "ces", "lomp", "loman"] },
  { id: "civil", nome: "Direito Civil", color: "#60a5fa", ids: ["cc", "lindb", "li", "lrp", "la", "lda", "lalim", "lalp"] },
  { id: "processo-civil", nome: "Direito Processual Civil", color: "#818cf8", ids: ["cpc", "lje", "lacp"] },
  { id: "penal", nome: "Direito Penal", color: "#f87171", ids: ["cp", "lep", "lmp", "ld", "loc", "laa", "lch", "ltort", "lrac", "llav", "lcp", "lat", "lcsf", "lci", "ed"] },
  { id: "processo-penal", nome: "Direito Processual Penal", color: "#ec4899", ids: ["cpp", "lit", "lpt"] },
  { id: "trabalho", nome: "Direito do Trabalho", color: "#fb7185", ids: ["clt"] },
  { id: "tributario", nome: "Direito Tributário", color: "#a3e635", ids: ["ctn", "lrt"] },
  { id: "empresarial", nome: "Direito Empresarial", color: "#e879f9", ids: ["ccom", "lf", "lsa", "lpi", "eme", "lmls", "lle", "lcade"] },
  { id: "consumidor", nome: "Direito do Consumidor", color: "#f472b6", ids: ["cdc"] },
  { id: "ambiental", nome: "Direito Ambiental", color: "#34d399", ids: ["cflor", "lca", "cagua", "cmin", "lbio"] },
  { id: "eleitoral", nome: "Direito Eleitoral", color: "#a78bfa", ids: ["ce", "lpp", "lele", "lfl", "line"] },
  { id: "previdenciario", nome: "Direito Previdenciário", color: "#fbbf24", ids: ["lbps", "lcss", "lpc", "loas"] },
  { id: "familia", nome: "Família e Infância", color: "#f9a8d4", ids: ["eca", "ej", "epd", "ei", "epc"] },
  { id: "digital", nome: "Direito Digital", color: "#22d3ee", ids: ["lgpd", "mci", "ctel"] },
  { id: "urbanistico", nome: "Urbanístico e Imobiliário", color: "#fb923c", ids: ["ec", "emet", "lpsu", "eterra"] },
  { id: "militar", nome: "Direito Militar", color: "#a81f40", ids: ["cpm", "cppm", "em"] },
  { id: "internacional", nome: "Internacional e Migração", color: "#2dd4bf", ids: ["emig", "eref"] },
  { id: "saude-educacao", nome: "Saúde e Educação", color: "#4ade80", ids: ["lsus", "ldb", "emus"] },
  { id: "transito", nome: "Trânsito e Transportes", color: "#0ea5e9", ids: ["ctb", "cba"] },
  { id: "profissional", nome: "Advocacia e Esporte", color: "#93c5fd", ids: ["eoab", "et"] },
];

export function leisDaArea(area: AreaLeis): LeiCatalogItem[] {
  return area.ids
    .map((id) => LEIS_CATALOG.find((l) => l.id === id))
    .filter(Boolean) as LeiCatalogItem[];
}
