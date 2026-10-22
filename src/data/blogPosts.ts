export type BlogTema =
  | "Leis"
  | "Conceitos Fundamentais"
  | "Iniciantes"
  | "Filosofia"
  | "Filosofia do Direito"
  | "STF"
  | "Curiosidades"
  | "Clássicos"
  | "Direito Penal"
  | "Direito Civil"
  | "Direito Constitucional"
  | "Direito Administrativo"
  | "Direito do Trabalho"
  | "Direito Processual"
  | "Direito Tributário"
  | "Leis - Conceitos Fundamentais"
  | "Estrutura de Leis"
  | "Processo Legislativo"
  | "Senado Federal"
  | "Câmara dos Deputados"
  | "Carreiras Jurídicas"
  | "Atualidades Jurídicas"
  | "Jurisprudência";

export interface BlogPost {
  id: string;
  titulo: string;
  resumo: string;
  conteudo_md: string;
  imagem_url: string;
  tema: BlogTema;
  autor: string;
  data_publicacao: string; // ISO
  tempo_leitura_min: number;
}

/**
 * Artigos do Blog servidos 100% via Supabase (`blog_edicao_posts`),
 * com imagens integradas via CDN Cloudflare R2.
 */
export const BLOG_POSTS: BlogPost[] = [];

export const TEMAS: BlogTema[] = [
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Civil",
  "Direito Penal",
  "Direito do Trabalho",
  "Direito Processual",
  "Direito Tributário",
  "Filosofia do Direito",
  "Leis - Conceitos Fundamentais",
  "Estrutura de Leis",
  "Processo Legislativo",
  "Senado Federal",
  "Câmara dos Deputados",
  "STF",
  "Leis",
  "Conceitos Fundamentais",
  "Iniciantes",
  "Curiosidades",
  "Clássicos",
  "Carreiras Jurídicas",
  "Atualidades Jurídicas",
  "Jurisprudência",
];

// Cada tema tem sua própria paleta visual refinada
export const TEMA_COLORS: Record<
  BlogTema,
  { bg: string; chip: string; chipText: string; accent: string }
> = {
  "Direito Constitucional": {
    bg: "linear-gradient(135deg, #0a1a3d 0%, #12295c 60%, #1e3a8a 100%)",
    chip: "#93c5fd",
    chipText: "#0a1a3d",
    accent: "#bfdbfe",
  },
  "Direito Administrativo": {
    bg: "linear-gradient(135deg, #1a1a1a 0%, #2f2f2f 60%, #52525b 100%)",
    chip: "#d4d4d8",
    chipText: "#1a1a1a",
    accent: "#e4e4e7",
  },
  "Direito Civil": {
    bg: "linear-gradient(135deg, #0f1e3a 0%, #1e3a5f 60%, #1d4ed8 100%)",
    chip: "#93c5fd",
    chipText: "#0f1e3a",
    accent: "#c7d2fe",
  },
  "Direito Penal": {
    bg: "linear-gradient(135deg, #2b0a0a 0%, #5c1616 60%, #6b1428 100%)",
    chip: "#f87171",
    chipText: "#2b0a0a",
    accent: "#fecaca",
  },
  "Direito do Trabalho": {
    bg: "linear-gradient(135deg, #2a1a05 0%, #57370e 60%, #b45309 100%)",
    chip: "#f59e0b",
    chipText: "#2a1a05",
    accent: "#fde68a",
  },
  "Direito Processual": {
    bg: "linear-gradient(135deg, #1a0e2e 0%, #3b1e5c 60%, #6d28d9 100%)",
    chip: "#c4b5fd",
    chipText: "#1a0e2e",
    accent: "#ddd6fe",
  },
  "Direito Tributário": {
    bg: "linear-gradient(135deg, #0e2a1f 0%, #1c5c42 60%, #059669 100%)",
    chip: "#6ee7b7",
    chipText: "#0e2a1f",
    accent: "#a7f3d0",
  },
  "Filosofia do Direito": {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
    chip: "#a78bfa",
    chipText: "#1e1b4b",
    accent: "#c4b5fd",
  },
  Filosofia: {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
    chip: "#a78bfa",
    chipText: "#1e1b4b",
    accent: "#c4b5fd",
  },
  "Leis - Conceitos Fundamentais": {
    bg: "linear-gradient(135deg, #1c2e14 0%, #2f4a1f 60%, #4a6741 100%)",
    chip: "#a3b18a",
    chipText: "#1c2e14",
    accent: "#c9d5b8",
  },
  "Estrutura de Leis": {
    bg: "linear-gradient(135deg, #134e48 0%, #0f766e 60%, #0d9488 100%)",
    chip: "#5eead4",
    chipText: "#134e48",
    accent: "#99f6e4",
  },
  "Processo Legislativo": {
    bg: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
    chip: "#93c5fd",
    chipText: "#1e3a8a",
    accent: "#bfdbfe",
  },
  "Senado Federal": {
    bg: "linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)",
    chip: "#cbd5e1",
    chipText: "#0f172a",
    accent: "#f1f5f9",
  },
  "Câmara dos Deputados": {
    bg: "linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%)",
    chip: "#6ee7b7",
    chipText: "#064e3b",
    accent: "#a7f3d0",
  },
  STF: {
    bg: "linear-gradient(135deg, #0c1e3d 0%, #14315e 60%, #1e40af 100%)",
    chip: "#60a5fa",
    chipText: "#0c1e3d",
    accent: "#93c5fd",
  },
  Leis: {
    bg: "linear-gradient(135deg, #1c2e14 0%, #2f4a1f 60%, #4a6741 100%)",
    chip: "#a3b18a",
    chipText: "#1c2e14",
    accent: "#c9d5b8",
  },
  "Conceitos Fundamentais": {
    bg: "linear-gradient(135deg, #162a1b 0%, #22432b 60%, #3d6a47 100%)",
    chip: "#86efac",
    chipText: "#14331b",
    accent: "#bbf7d0",
  },
  Curiosidades: {
    bg: "linear-gradient(135deg, #0f2e2a 0%, #134e48 60%, #0d9488 100%)",
    chip: "#5eead4",
    chipText: "#0f2e2a",
    accent: "#99f6e4",
  },
  Clássicos: {
    bg: "linear-gradient(135deg, #2b0a0e 0%, #5c1a20 60%, #7f1d1d 100%)",
    chip: "#fca5a5",
    chipText: "#2b0a0e",
    accent: "#fecaca",
  },
  Iniciantes: {
    bg: "linear-gradient(135deg, #1a1408 0%, #3b2a12 60%, #6b3f1d 100%)",
    chip: "#f5c76a",
    chipText: "#1a1408",
    accent: "#efe0c4",
  },
  "Carreiras Jurídicas": {
    bg: "linear-gradient(135deg, #2a1a0a 0%, #5c3a1a 60%, #92400e 100%)",
    chip: "#f87171",
    chipText: "#2a1a0a",
    accent: "#fde68a",
  },
  "Atualidades Jurídicas": {
    bg: "linear-gradient(135deg, #0e1e2a 0%, #1e3a52 60%, #0369a1 100%)",
    chip: "#7dd3fc",
    chipText: "#0e1e2a",
    accent: "#bae6fd",
  },
  Jurisprudência: {
    bg: "linear-gradient(135deg, #052e2b 0%, #064e3b 55%, #047857 100%)",
    chip: "#6ee7b7",
    chipText: "#052e2b",
    accent: "#a7f3d0",
  },
};
