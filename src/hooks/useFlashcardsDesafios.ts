import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type FlashcardDesafio = {
  desafio_id: string;
  trilha: string;
  trilha_label: string;
  titulo: string;
  subtitulo: string | null;
  area: string | null;
  tema: string | null;
  meta_diaria: number;
  dias: number;
  nivel: string;
  cor: string;
  premium: boolean;
  ordem: number;
  respondidas_hoje: number;
  dias_concluidos: number;
  status: string;
  desbloqueado: boolean;
  /** Posição na sequência única de desafios (1, 2, 3, ...). */
  numero: number;
  /** Descrição gerada: "5 cards de Direito Penal por dia · 3 dias". */
  descricao: string;
};

const db = supabase as any;

const plural = (n: number, s: string) => `${n} ${s}${n > 1 ? 's' : ''}`;

/** Esforço total do desafio: usado para ordenar do mais leve ao mais pesado. */
const peso = (d: { meta_diaria: number; dias: number }) => d.meta_diaria * d.dias;

function descrever(d: { meta_diaria: number; dias: number; area: string | null }) {
  const alvo = d.area ? `cards de ${d.area}` : 'cards';
  return d.dias > 1
    ? `${d.meta_diaria} ${alvo} por dia · ${plural(d.dias, 'dia')} seguidos`
    : `${d.meta_diaria} ${alvo} hoje`;
}

/**
 * Desafios de flashcards em sequência única (Desafio 1, 2, 3, ...).
 * A ordem segue a quantidade de cards (mais leve primeiro) e os desafios
 * gerais vêm antes dos de área quando o esforço é o mesmo. O desbloqueio é
 * sequencial: só libera o próximo quando o anterior é concluído.
 */
export function useFlashcardsDesafios() {
  const { user } = useAuth();
  const [brutos, setBrutos] = useState<FlashcardDesafio[]>([]);
  const [loading, setLoading] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) { setBrutos([]); setLoading(false); return; }
    setLoading(true);

    const { data, error } = await db.rpc('flashcards_desafio_status');
    if (error) {
      console.error('[flashcards-desafios] status', error);
      setIndisponivel(true);
      setBrutos([]);
      setLoading(false);
      return;
    }
    setIndisponivel(false);
    const lista = (data ?? []) as FlashcardDesafio[];

    // Fecha o dia do desafio atual (primeiro da sequência ainda não concluído).
    const ordenada = [...lista].sort(comparar);
    let anteriorConcluido = true;
    const atual = ordenada.find((d) => {
      const liberado = anteriorConcluido;
      anteriorConcluido = d.status === 'concluido';
      return liberado && d.status !== 'concluido';
    });

    let mudou = false;
    if (atual && atual.respondidas_hoje >= atual.meta_diaria) {
      const hojeISO = new Date().toISOString().slice(0, 10);
      const { data: prog } = await db
        .from('flashcards_desafios_progresso')
        .select('*')
        .eq('desafio_id', atual.desafio_id)
        .maybeSingle();

      if (!prog || prog.ultimo_dia_contado !== hojeISO) {
        const novosDias = Math.min((prog?.dias_concluidos ?? 0) + 1, atual.dias);
        await db.from('flashcards_desafios_progresso').upsert({
          id: prog?.id,
          user_id: user.id,
          desafio_id: atual.desafio_id,
          dias_concluidos: novosDias,
          ultimo_dia_contado: hojeISO,
          status: novosDias >= atual.dias ? 'concluido' : 'ativo',
          concluido_em: novosDias >= atual.dias ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,desafio_id' });
        mudou = true;
      }
    }

    if (mudou) {
      const { data: atualizado } = await db.rpc('flashcards_desafio_status');
      setBrutos((atualizado ?? lista) as FlashcardDesafio[]);
    } else {
      setBrutos(lista);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const desafios = useMemo<FlashcardDesafio[]>(() => {
    const ordenada = [...brutos].sort(comparar);
    let anteriorConcluido = true;
    return ordenada.map((d, i) => {
      const desbloqueado = anteriorConcluido;
      anteriorConcluido = d.status === 'concluido';
      return {
        ...d,
        numero: i + 1,
        descricao: descrever(d),
        desbloqueado,
      };
    });
  }, [brutos]);

  const ativo = desafios.find((d) => d.desbloqueado && d.status !== 'concluido') ?? null;
  const concluidos = desafios.filter((d) => d.status === 'concluido').length;

  return { desafios, ativo, concluidos, loading, indisponivel, recarregar: carregar };
}

function comparar(a: FlashcardDesafio, b: FlashcardDesafio) {
  if (peso(a) !== peso(b)) return peso(a) - peso(b);
  if (a.meta_diaria !== b.meta_diaria) return a.meta_diaria - b.meta_diaria;
  if (a.dias !== b.dias) return a.dias - b.dias;
  // desafios gerais antes dos de área
  const areaA = a.area ?? '';
  const areaB = b.area ?? '';
  if (!areaA !== !areaB) return areaA ? 1 : -1;
  if (areaA !== areaB) return areaA.localeCompare(areaB);
  return a.titulo.localeCompare(b.titulo);
}
