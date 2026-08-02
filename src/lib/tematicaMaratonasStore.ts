/**
 * Maratonas do usuário — Supabase + cache em memória para render instantâneo.
 */
import { supabase } from '@/integrations/supabase/client';

export interface MaratonaItem {
  obra_id: string;
  assistido?: boolean;
}

export interface Maratona {
  id: string;
  user_id: string;
  nome: string;
  template_slug: string | null;
  itens: MaratonaItem[];
  created_at: string;
  updated_at: string;
}

let mem: Maratona[] | null = null;
let memAt = 0;
const TTL = 60 * 1000;

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeMaratonas(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notificar() {
  listeners.forEach((l) => {
    try { l(); } catch { /* noop */ }
  });
}

export function getCachedMaratonas(): Maratona[] | null {
  return mem;
}

function normalizar(row: any): Maratona {
  const itens = Array.isArray(row.itens) ? row.itens : [];
  return { ...row, itens: itens as MaratonaItem[] } as Maratona;
}

export async function loadMaratonas(force = false): Promise<Maratona[]> {
  if (!force && mem && Date.now() - memAt < TTL) return mem;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    mem = [];
    memAt = Date.now();
    return mem;
  }
  const { data, error } = await supabase
    .from('tematica_maratonas')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  mem = (data ?? []).map(normalizar);
  memAt = Date.now();
  notificar();
  return mem;
}

export async function criarMaratona(
  nome: string,
  itens: MaratonaItem[],
  templateSlug?: string | null,
): Promise<Maratona | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from('tematica_maratonas')
    .insert({
      user_id: auth.user.id,
      nome,
      template_slug: templateSlug ?? null,
      itens: itens as any,
    })
    .select('*')
    .single();
  if (error) throw error;
  const nova = normalizar(data);
  mem = [nova, ...(mem ?? [])];
  memAt = Date.now();
  notificar();
  return nova;
}

export async function atualizarMaratona(
  id: string,
  patch: { nome?: string; itens?: MaratonaItem[] },
): Promise<void> {
  const payload: any = {};
  if (patch.nome !== undefined) payload.nome = patch.nome;
  if (patch.itens !== undefined) payload.itens = patch.itens;
  mem = (mem ?? []).map((m) => (m.id === id ? { ...m, ...patch } as Maratona : m));
  notificar();
  const { error } = await supabase.from('tematica_maratonas').update(payload).eq('id', id);
  if (error) throw error;
}

export async function excluirMaratona(id: string): Promise<void> {
  mem = (mem ?? []).filter((m) => m.id !== id);
  notificar();
  const { error } = await supabase.from('tematica_maratonas').delete().eq('id', id);
  if (error) throw error;
}
