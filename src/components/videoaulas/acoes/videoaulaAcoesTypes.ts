import type { LucideIcon } from "lucide-react";
import {
  Layers, NotebookPen, Lightbulb, Workflow, ListTree, FileText,
  Bookmark, Table as TableIcon, Brackets, KeyRound,
} from "lucide-react";
import type { AulaAcaoTipo } from "@/hooks/useVideoaulaAcao";

export const TITULOS: Record<AulaAcaoTipo, string> = {
  flashcards: "Flashcards",
  lacunas: "Flashcards — Lacunas",
  conceito: "Flashcards — Conceitos",
  pegadinhas: "Pegadinhas",
  mapa: "Mapa mental",
  cornell: "Resumo Cornell",
  feynman: "Resumo Feynman",
  topicos: "Resumo por tópicos",
  tradicional: "Resumo tradicional",
  fichamento: "Fichamento",
  comparativa: "Tabela comparativa",
  lei: "Lei seca",
  questoes: "Questões",
  termos: "Termos da aula",
};

export type MetodoResumo = {
  id: Extract<AulaAcaoTipo, "cornell" | "feynman" | "mapa" | "topicos" | "tradicional" | "fichamento" | "comparativa">;
  label: string;
  desc: string;
  icon: LucideIcon;
};

export const METODOS_RESUMO: MetodoResumo[] = [
  { id: "cornell", label: "Cornell", desc: "Notas + perguntas-chave + síntese", icon: NotebookPen },
  { id: "feynman", label: "Feynman", desc: "Explica como se fosse um leigo", icon: Lightbulb },
  { id: "mapa", label: "Mapa Mental", desc: "Hierarquia visual de conceitos", icon: Workflow },
  { id: "topicos", label: "Por tópicos", desc: "Estrutura em tópicos organizados", icon: ListTree },
  { id: "tradicional", label: "Resumo tradicional", desc: "Texto corrido e fluido", icon: FileText },
  { id: "fichamento", label: "Fichamento", desc: "Referências, citações e análise", icon: Bookmark },
  { id: "comparativa", label: "Tabela comparativa", desc: "Elementos lado a lado", icon: TableIcon },
];

export type TipoFlash = Extract<AulaAcaoTipo, "flashcards" | "lacunas" | "conceito">;

export const TIPOS_FLASH: Array<{ id: TipoFlash; label: string; desc: string; icon: LucideIcon }> = [
  { id: "flashcards", label: "Tradicional", desc: "Pergunta → resposta", icon: Layers },
  { id: "lacunas", label: "Lacunas", desc: "Frase com palavra-chave oculta", icon: Brackets },
  { id: "conceito", label: "Conceito-chave", desc: "Termo → definição curta", icon: KeyRound },
];

export type LeiCitada = {
  lei?: string;
  codigo?: string;
  artigo?: string;
  texto?: string;
  trecho_relevante?: string;
};

export type QuestaoIA = {
  enunciado: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  gabarito?: string;
  comentario?: string;
};
