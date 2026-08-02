/**
 * Mapeia matérias do Direito para os slugs de trilha da Lei Seca.
 * Ordem do array = ordem dos cards. Estatutos primeiro (pedido do usuário).
 */
import {
  Users, Landmark, BookOpen, Gavel, Search, FileText, HardHat, CircleDollarSign,
  Building2, Vote, Store, Shield, Car, Lock, Plane, BookMarked,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LeiSecaMateria {
  slug: string;
  nome: string;
  descricao: string;
  trilhas: string[]; // slugs de lei_seca_trilhas
  cor: string; // cor viva (hex) do ícone
  icone: LucideIcon;
}

/** Cor viva sólida do ícone (sem fundo), no padrão do Vade Mecum. */
export function corIcone(cor?: string) {
  return cor || "#A855F7";
}


export const LEI_SECA_MATERIAS: LeiSecaMateria[] = [
  {
    slug: "estatutos",
    nome: "Estatutos",
    descricao: "ECA, Idoso, OAB, PCD e mais",
    trilhas: ["eca", "idoso", "desarmamento", "cidade", "oab", "igualdade-racial", "pcd", "torcedor", "juventude", "migracao"],
    cor: "#D946EF",
    icone: Users,
  },
  {
    slug: "constitucional",
    nome: "Direito Constitucional",
    descricao: "Constituição Federal",
    trilhas: ["cf"],
    cor: "#FFD400",
    icone: Landmark,
  },
  {
    slug: "civil",
    nome: "Direito Civil",
    descricao: "Código Civil, CDC e correlatas",
    trilhas: ["cc", "cdc", "inquilinato"],
    cor: "#3B82F6",
    icone: BookOpen,
  },
  {
    slug: "penal",
    nome: "Direito Penal",
    descricao: "Código Penal e leis especiais",
    trilhas: ["cp", "hediondos", "drogas", "maria-penha", "anticrime", "abuso-autoridade", "org-criminosas", "lep"],
    cor: "#DC2626",
    icone: Gavel,
  },
  {
    slug: "processo-penal",
    nome: "Processo Penal",
    descricao: "CPP e Juizados Especiais",
    trilhas: ["cpp", "juizados"],
    cor: "#F97316",
    icone: Search,
  },
  {
    slug: "processo-civil",
    nome: "Processo Civil",
    descricao: "CPC e Mandado de Segurança",
    trilhas: ["cpc", "mandado-seguranca"],
    cor: "#22D3EE",
    icone: FileText,
  },
  {
    slug: "trabalho",
    nome: "Direito do Trabalho",
    descricao: "CLT",
    trilhas: ["clt"],
    cor: "#FB923C",
    icone: HardHat,
  },
  {
    slug: "tributario",
    nome: "Direito Tributário",
    descricao: "Código Tributário Nacional",
    trilhas: ["ctn"],
    cor: "#10B981",
    icone: CircleDollarSign,
  },
  {
    slug: "administrativo",
    nome: "Direito Administrativo",
    descricao: "8.112, Licitações, Improbidade e mais",
    trilhas: ["lei8112", "licitacoes", "improbidade", "anticorrupcao", "acesso-info"],
    cor: "#06B6D4",
    icone: Building2,
  },
  {
    slug: "eleitoral",
    nome: "Direito Eleitoral",
    descricao: "Código Eleitoral",
    trilhas: ["ce"],
    cor: "#84CC16",
    icone: Vote,
  },
  {
    slug: "empresarial",
    nome: "Direito Empresarial",
    descricao: "Código Comercial",
    trilhas: ["ccom"],
    cor: "#A855F7",
    icone: Store,
  },
  {
    slug: "militar",
    nome: "Direito Militar",
    descricao: "CPM e CPPM",
    trilhas: ["cpm", "cppm"],
    cor: "#64748B",
    icone: Shield,
  },
  {
    slug: "transito",
    nome: "Direito de Trânsito",
    descricao: "Código de Trânsito Brasileiro",
    trilhas: ["ctb"],
    cor: "#38BDF8",
    icone: Car,
  },
  {
    slug: "digital",
    nome: "Direito Digital e Dados",
    descricao: "LGPD e Marco Civil",
    trilhas: ["lgpd", "marco-civil"],
    cor: "#14B8A6",
    icone: Lock,
  },
  {
    slug: "aeronautico",
    nome: "Direito Aeronáutico",
    descricao: "Código Brasileiro de Aeronáutica",
    trilhas: ["cba"],
    cor: "#0EA5E9",
    icone: Plane,
  },
  {
    slug: "introducao",
    nome: "Introdução ao Direito",
    descricao: "LINDB",
    trilhas: ["lindb"],
    cor: "#EC4899",
    icone: BookMarked,
  },
];

export function getMateriaByTrilha(trilhaSlug: string): LeiSecaMateria | undefined {
  return LEI_SECA_MATERIAS.find((m) => m.trilhas.includes(trilhaSlug));
}
