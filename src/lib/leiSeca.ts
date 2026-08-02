import { supabase } from "@/integrations/supabase/client";

export interface LeiSecaTrilha {
  id: string;
  slug: string;
  nome: string;
  sigla: string | null;
  lei_slug: string;
  ordem: number;
  cor: string;
  icone: string;
  partes: Array<{ slug: string; nome: string; filtro: any }>;
  ativa: boolean;
}

export interface LeiSecaLicao {
  id: string;
  trilha_slug: string;
  parte: string;
  titulo_pai: string | null;
  titulo: string;
  ordem: number;
  artigos: string[];
  exercicios: Exercicio[] | null;
  status: "pendente" | "pronto" | "erro" | "processando";
  erro: string | null;
}

export type Exercicio =
  | { tipo: "completar"; artigo: string; enunciado: string; alternativas: string[]; correta: number; explicacao?: string }
  | { tipo: "sim_nao"; artigo: string; afirmacao: string; correta: boolean; explicacao?: string }
  | { tipo: "ligar"; artigo: string; pares: { a: string; b: string }[] }
  | { tipo: "organizar"; artigo: string; frase_correta: string; palavras: string[] }
  | { tipo: "alternativas"; artigo: string; enunciado: string; alternativas: string[]; correta: number; explicacao?: string }
  | { tipo: "erro"; artigo: string; texto_correto: string; texto_alterado: string; indice_erradas: number[]; explicacao?: string }
  | { tipo: "qual_artigo"; artigo: string; trecho: string; opcoes: string[]; correta: number; explicacao?: string }
  | { tipo: "qual_inciso"; artigo: string; trecho: string; opcoes: string[]; correta: number; explicacao?: string }
  | { tipo: "classificar"; artigo: string; categoria_a: string; categoria_b: string; itens: { texto: string; grupo: "a" | "b" }[]; explicacao?: string }
  | { tipo: "caca_palavra"; artigo: string; texto_alterado: string; palavra_errada: string; palavra_correta: string; explicacao?: string }
  | { tipo: "prazo_numero"; artigo: string; enunciado: string; opcoes: string[]; correta: number; explicacao?: string }
  | { tipo: "pena"; artigo: string; conduta: string; opcoes: string[]; correta: number; explicacao?: string };

export interface LeiSecaProgresso {
  licao_id: string;
  estrelas: number;
  concluida: boolean;
  tentativas: number;
  melhor_pontuacao: number;
}

export async function listarTrilhas(): Promise<LeiSecaTrilha[]> {
  const { data, error } = await supabase
    .from("lei_seca_trilhas")
    .select("*")
    .eq("ativa", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function getTrilha(slug: string): Promise<LeiSecaTrilha | null> {
  const { data, error } = await supabase
    .from("lei_seca_trilhas")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listarLicoes(trilhaSlug: string, parte: string): Promise<LeiSecaLicao[]> {
  const { data, error } = await supabase
    .from("lei_seca_licoes")
    .select("*")
    .eq("trilha_slug", trilhaSlug)
    .eq("parte", parte)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function getLicao(id: string): Promise<LeiSecaLicao | null> {
  const { data, error } = await supabase
    .from("lei_seca_licoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function estruturarTrilha(
  trilhaSlug: string,
  parteSlug?: string,
  force = false,
): Promise<{ criadas: number; preservadas?: number }> {
  const { data, error } = await supabase.functions.invoke("lei-seca-estruturar", {
    body: { trilha_slug: trilhaSlug, parte_slug: parteSlug, force },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

export async function gerarLicao(licaoId: string): Promise<Exercicio[]> {
  const { data, error } = await supabase.functions.invoke("lei-seca-gerar", {
    body: { licao_id: licaoId },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).exercicios;
}

export async function listarProgresso(userId: string, licaoIds: string[]): Promise<Map<string, LeiSecaProgresso>> {
  if (!licaoIds.length) return new Map();
  const { data } = await supabase
    .from("lei_seca_progresso")
    .select("licao_id,estrelas,concluida,tentativas,melhor_pontuacao")
    .eq("user_id", userId)
    .in("licao_id", licaoIds);
  const m = new Map<string, LeiSecaProgresso>();
  (data ?? []).forEach((r: any) => m.set(r.licao_id, r));
  return m;
}

export async function salvarProgresso(userId: string, licaoId: string, dados: { estrelas: number; pontuacao: number; concluida: boolean }) {
  const existing = await supabase
    .from("lei_seca_progresso")
    .select("id,tentativas,melhor_pontuacao,estrelas")
    .eq("user_id", userId)
    .eq("licao_id", licaoId)
    .maybeSingle();
  const prev = existing.data as any;
  const payload: any = {
    user_id: userId,
    licao_id: licaoId,
    estrelas: Math.max(prev?.estrelas ?? 0, dados.estrelas),
    melhor_pontuacao: Math.max(prev?.melhor_pontuacao ?? 0, dados.pontuacao),
    tentativas: (prev?.tentativas ?? 0) + 1,
    concluida: dados.concluida || !!prev?.concluida,
    concluida_em: dados.concluida ? new Date().toISOString() : null,
  };
  await supabase.from("lei_seca_progresso").upsert(payload, { onConflict: "user_id,licao_id" });
}

/** Texto literal de uma lista de artigos do Vade Mecum (por slug da lei). */
export async function carregarArtigos(leiSlug: string, nums: string[]): Promise<Array<{ num: string; texto: string }>> {
  if (!nums.length) return [];
  const { data: lei } = await supabase
    .from("vade_mecum_leis")
    .select("id")
    .eq("slug", leiSlug)
    .maybeSingle();
  if (!lei?.id) return nums.map((n) => ({ num: n, texto: "" }));
  const { data } = await supabase
    .from("vade_mecum_artigos")
    .select("numero,texto")
    .eq("lei_id", lei.id)
    .in("numero", nums);
  const map = new Map<string, string>();
  (data ?? []).forEach((r: any) => map.set(String(r.numero), String(r.texto ?? "")));
  return nums.map((n) => ({ num: n, texto: map.get(n) ?? "" }));
}
