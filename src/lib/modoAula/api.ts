/** Modo Aula — acesso a dados (Supabase) e pipeline de transcrição. */
import { supabase } from '@/integrations/supabase/client';
import type {
  Aula, AulaMarcador, AulaMidia, AulaTranscricao, Disciplina, TipoMarcador,
} from './types';
import type { SegmentoGravado } from './gravacao';

const BUCKET = 'modo-aula';

/**
 * As tabelas do Modo Aula foram criadas depois do último gerador de tipos, então
 * usamos um cliente sem tipagem de schema aqui. As funções abaixo expõem tipos
 * explícitos (`Aula`, `Disciplina`, …), mantendo o resto do app tipado.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function extDoMime(mime: string): string {
  const m = (mime || '').toLowerCase();
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  if (m.includes('aac')) return 'aac';
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  return 'm4a';
}

function base64ParaBlob(base64: string, mime: string): Blob {
  const limpo = base64.includes(',') ? base64.split(',')[1] : base64;
  const bin = atob(limpo);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Sessão expirada. Entre novamente.');
  return id;
}

// ── Disciplinas ────────────────────────────────────────────────

export async function listarDisciplinas(): Promise<Disciplina[]> {
  const { data, error } = await db
    .from('disciplinas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Disciplina[];
}

export async function criarDisciplina(
  nome: string,
  professor?: string,
  cor?: string,
): Promise<Disciplina> {
  const uid = await userId();
  const { data, error } = await db
    .from('disciplinas')
    .insert({ user_id: uid, nome: nome.trim(), professor: professor?.trim() || null, cor: cor || '#7B1E28' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Disciplina;
}

export async function excluirDisciplina(id: string): Promise<void> {
  const { error } = await db.from('disciplinas').delete().eq('id', id);
  if (error) throw error;
}

// ── Aulas ──────────────────────────────────────────────────────

export async function listarAulas(disciplinaId?: string): Promise<Aula[]> {
  let q = db.from('aulas').select('*').order('created_at', { ascending: false });
  if (disciplinaId) q = q.eq('disciplina_id', disciplinaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Aula[];
}

export async function contarAulas(): Promise<number> {
  const { count, error } = await db
    .from('aulas')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function criarAula(params: {
  titulo: string;
  disciplinaId?: string | null;
  professor?: string | null;
  gratuita?: boolean;
}): Promise<Aula> {
  const uid = await userId();
  const { data, error } = await db
    .from('aulas')
    .insert({
      user_id: uid,
      titulo: params.titulo.trim(),
      disciplina_id: params.disciplinaId ?? null,
      professor: params.professor?.trim() || null,
      gratuita: params.gratuita ?? false,
      status: 'gravando',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Aula;
}

export async function obterAula(id: string): Promise<Aula | null> {
  const { data, error } = await db.from('aulas').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Aula) ?? null;
}

export async function atualizarAula(id: string, campos: Partial<Aula>): Promise<void> {
  const { error } = await db
    .from('aulas')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function excluirAula(id: string): Promise<void> {
  const { error } = await db.from('aulas').delete().eq('id', id);
  if (error) throw error;
}

// ── Mídias / áudio ─────────────────────────────────────────────

export async function listarMidias(aulaId: string, tipo?: string): Promise<AulaMidia[]> {
  let q = db.from('aula_midias').select('*').eq('aula_id', aulaId).order('ordem');
  if (tipo) q = q.eq('tipo', tipo);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AulaMidia[];
}

/** Envia um bloco gravado para o bucket privado e registra a mídia. */
export async function enviarSegmento(aulaId: string, segmento: SegmentoGravado): Promise<AulaMidia> {
  const uid = await userId();
  const blob = segmento.blob ?? base64ParaBlob(segmento.base64 ?? '', segmento.mimeType);
  const ext = extDoMime(segmento.mimeType);
  const path = `${uid}/${aulaId}/audio-${String(segmento.ordem).padStart(3, '0')}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: segmento.mimeType, upsert: true });
  if (upErr) throw upErr;

  const { data, error } = await db
    .from('aula_midias')
    .insert({
      user_id: uid,
      aula_id: aulaId,
      tipo: 'audio',
      storage_path: path,
      mime: segmento.mimeType,
      bytes: blob.size,
      duracao_seg: segmento.duracaoSeg,
      ordem: segmento.ordem,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AulaMidia;
}

/** Importa um áudio já existente (WhatsApp, gravador do celular) como aula. */
export async function importarAudio(aulaId: string, arquivo: File): Promise<AulaMidia> {
  const uid = await userId();
  const mime = arquivo.type || 'audio/m4a';
  const ext = extDoMime(mime);
  const path = `${uid}/${aulaId}/audio-000.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, arquivo, { contentType: mime, upsert: true });
  if (upErr) throw upErr;

  const duracao = await duracaoDoArquivo(arquivo);

  const { data, error } = await db
    .from('aula_midias')
    .insert({
      user_id: uid,
      aula_id: aulaId,
      tipo: 'audio',
      storage_path: path,
      mime,
      bytes: arquivo.size,
      duracao_seg: duracao,
      ordem: 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AulaMidia;
}

function duracaoDoArquivo(arquivo: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(arquivo);
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    } catch {
      resolve(0);
    }
  });
}

/** URL assinada para tocar um bloco de áudio (bucket é privado). */
export async function urlAssinada(path: string, segundos = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, segundos);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// ── Marcadores ─────────────────────────────────────────────────

export async function listarMarcadores(aulaId: string): Promise<AulaMarcador[]> {
  const { data, error } = await db
    .from('aula_marcadores')
    .select('*')
    .eq('aula_id', aulaId)
    .order('segundo');
  if (error) throw error;
  return (data ?? []) as AulaMarcador[];
}

export async function criarMarcador(
  aulaId: string,
  segundo: number,
  tipo: TipoMarcador = 'manual',
  texto?: string,
): Promise<AulaMarcador> {
  const uid = await userId();
  const { data, error } = await db
    .from('aula_marcadores')
    .insert({ user_id: uid, aula_id: aulaId, segundo: Math.max(0, Math.round(segundo)), tipo, texto: texto ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as AulaMarcador;
}

export async function excluirMarcador(id: string): Promise<void> {
  const { error } = await db.from('aula_marcadores').delete().eq('id', id);
  if (error) throw error;
}

// ── Transcrição ────────────────────────────────────────────────

export async function obterTranscricao(aulaId: string): Promise<AulaTranscricao | null> {
  const { data, error } = await db
    .from('aula_transcricoes')
    .select('*')
    .eq('aula_id', aulaId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const seg = Array.isArray(data.segmentos) ? data.segmentos : [];
  return { ...(data as unknown as AulaTranscricao), segmentos: seg as AulaTranscricao['segmentos'] };
}

async function erroDaFuncao(error: unknown): Promise<string> {
  const ctx = (error as { context?: { text?: () => Promise<string> } })?.context;
  if (ctx?.text) {
    try {
      const corpo = await ctx.text();
      try {
        const j = JSON.parse(corpo);
        return String(j.error ?? j.detalhe ?? corpo);
      } catch {
        return corpo;
      }
    } catch { /* noop */ }
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Transcreve a aula bloco por bloco (mostrando progresso) e monta a transcrição
 * final com timestamps.
 */
export async function transcreverAula(
  aulaId: string,
  onProgresso?: (feitos: number, total: number) => void,
): Promise<AulaTranscricao> {
  await atualizarAula(aulaId, { status: 'processando', erro: null });

  const midias = await listarMidias(aulaId, 'audio');
  if (midias.length === 0) throw new Error('Esta aula não tem áudio gravado.');

  let feitos = 0;
  onProgresso?.(0, midias.length);

  for (const midia of midias) {
    if (!midia.texto) {
      const { error } = await supabase.functions.invoke('aula-transcrever', {
        body: { aulaId, midiaId: midia.id },
      });
      if (error) {
        const detalhe = await erroDaFuncao(error);
        await atualizarAula(aulaId, { status: 'erro', erro: detalhe });
        throw new Error(detalhe);
      }
    }
    feitos += 1;
    onProgresso?.(feitos, midias.length);
  }

  const { error: finErr } = await supabase.functions.invoke('aula-finalizar-transcricao', {
    body: { aulaId },
  });
  if (finErr) {
    const detalhe = await erroDaFuncao(finErr);
    await atualizarAula(aulaId, { status: 'erro', erro: detalhe });
    throw new Error(detalhe);
  }

  const transcricao = await obterTranscricao(aulaId);
  if (!transcricao) throw new Error('Não foi possível montar a transcrição.');
  return transcricao;
}
