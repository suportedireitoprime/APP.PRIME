import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { agendarAvisoLocal, cancelarAvisoLocal } from '@/lib/lembretes/agendar';
import {
  TIPOS,
  fmtDias,
  fmtDataHora,
  fmtRecorrencia,
  lerTipo,
  limparMensagem,
  type LembreteTipo,
} from '@/lib/lembretes/tipos';

export type LembreteItem = {
  id: string;
  raw: string;
  tipo: LembreteTipo;
  titulo: string;
  detalhe: string;
  horario?: string;
  ativo: boolean;
  rota: string;
  /** só lembretes da tabela avisos podem ser alternados/removidos daqui */
  editavel: boolean;
  quando?: string;
};

export function useLembretes() {
  const { user } = useAuth();
  const [itens, setItens] = useState<LembreteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setItens([]);
      setLoading(false);
      return;
    }
    const uid = user.id;
    const [est, loc, lei, que, ls, av] = await Promise.all([
      supabase.from('user_reminders').select('id, dias, horario, ativo').eq('user_id', uid),
      supabase.from('location_reminders').select('id, label, address, radius_m, active').eq('user_id', uid),
      supabase.from('reading_reminders').select('id, title, livro_titulo, days_of_week, time_of_day, enabled').eq('user_id', uid),
      supabase.from('questoes_lembretes').select('id, meta_questoes, dias, horario, ativo').eq('user_id', uid),
      supabase.from('lei_seca_lembretes').select('diario_ativo, diario_hora, retomada_ativa, ultima_trilha').eq('user_id', uid).maybeSingle(),
      supabase.from('avisos').select('id, titulo, mensagem, avisar_em, recorrencia, ativo').eq('user_id', uid).order('avisar_em', { ascending: true }),
    ]);

    const out: LembreteItem[] = [];

    (est.data ?? []).forEach((r: any) =>
      out.push({
        id: `est-${r.id}`,
        raw: r.id,
        tipo: 'estudo',
        titulo: 'Lembrete de estudo',
        detalhe: fmtDias(r.dias),
        horario: (r.horario ?? '').slice(0, 5),
        ativo: !!r.ativo,
        rota: TIPOS.estudo.rota,
        editavel: false,
      }),
    );

    (loc.data ?? []).forEach((r: any) =>
      out.push({
        id: `loc-${r.id}`,
        raw: r.id,
        tipo: 'local',
        titulo: r.label || 'Lembrete por local',
        detalhe:
          [r.address, r.radius_m ? `raio ${r.radius_m}m` : null].filter(Boolean).join(' · ') ||
          'Sem endereço',
        ativo: !!r.active,
        rota: TIPOS.local.rota,
        editavel: false,
      }),
    );

    (lei.data ?? []).forEach((r: any) =>
      out.push({
        id: `lei-${r.id}`,
        raw: r.id,
        tipo: 'leitura',
        titulo: r.title || r.livro_titulo || 'Lembrete de leitura',
        detalhe: fmtDias(r.days_of_week),
        horario: (r.time_of_day ?? '').slice(0, 5),
        ativo: !!r.enabled,
        rota: TIPOS.leitura.rota,
        editavel: false,
      }),
    );

    (que.data ?? []).forEach((r: any) =>
      out.push({
        id: `que-${r.id}`,
        raw: r.id,
        tipo: 'questoes',
        titulo: `Meta de ${r.meta_questoes ?? 10} questões`,
        detalhe: fmtDias(r.dias),
        horario: (r.horario ?? '').slice(0, 5),
        ativo: !!r.ativo,
        rota: TIPOS.questoes.rota,
        editavel: false,
      }),
    );

    const d: any = ls.data;
    if (d) {
      if (d.diario_ativo !== null && d.diario_ativo !== undefined) {
        out.push({
          id: 'ls-diario',
          raw: 'ls-diario',
          tipo: 'leiseca',
          titulo: 'Prática diária da Lei Seca',
          detalhe: 'Lembrete diário',
          horario: (d.diario_hora ?? '').slice(0, 5),
          ativo: !!d.diario_ativo,
          rota: TIPOS.leiseca.rota,
          editavel: false,
        });
      }
      if (d.retomada_ativa) {
        out.push({
          id: 'ls-retomada',
          raw: 'ls-retomada',
          tipo: 'leiseca',
          titulo: 'Retomar de onde parei',
          detalhe: d.ultima_trilha ? `Última lei: ${d.ultima_trilha}` : 'Lei Seca',
          ativo: true,
          rota: TIPOS.leiseca.rota,
          editavel: false,
        });
      }
    }

    (av.data ?? []).forEach((r: any) => {
      const tipo = lerTipo(r.mensagem);
      const msg = limparMensagem(r.mensagem);
      out.push({
        id: `av-${r.id}`,
        raw: r.id,
        tipo,
        titulo: r.titulo,
        detalhe: [msg, fmtRecorrencia(r.recorrencia)].filter(Boolean).join(' · '),
        horario: new Date(r.avisar_em).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        quando: fmtDataHora(r.avisar_em),
        ativo: !!r.ativo,
        rota: TIPOS[tipo].rota,
        editavel: true,
      });
    });

    setItens(out);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    carregar();
  }, [carregar]);

  const alternar = useCallback(
    async (item: LembreteItem) => {
      if (!item.editavel) return;
      const novo = !item.ativo;
      setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ativo: novo } : i)));
      await supabase.from('avisos').update({ ativo: novo }).eq('id', item.raw);
      if (novo) {
        const { data } = await supabase.from('avisos').select('*').eq('id', item.raw).maybeSingle();
        if (data) await agendarAvisoLocal(data as any);
      } else {
        await cancelarAvisoLocal(item.raw);
      }
    },
    [],
  );

  const remover = useCallback(async (item: LembreteItem) => {
    if (!item.editavel) return;
    setItens((prev) => prev.filter((i) => i.id !== item.id));
    await supabase.from('avisos').delete().eq('id', item.raw);
    await cancelarAvisoLocal(item.raw);
  }, []);

  const totais = useMemo(
    () => ({ total: itens.length, ativos: itens.filter((i) => i.ativo).length }),
    [itens],
  );

  const proximo = useMemo(() => {
    const comHora = itens.filter((i) => i.ativo && i.horario);
    if (!comHora.length) return null;
    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const comDelta = comHora.map((i) => {
      const [h, m] = (i.horario as string).split(':').map(Number);
      let delta = h * 60 + m - minutosAgora;
      if (delta < 0) delta += 24 * 60;
      return { item: i, delta };
    });
    comDelta.sort((a, b) => a.delta - b.delta);
    return comDelta[0].item;
  }, [itens]);

  return { itens, loading, totais, proximo, recarregar: carregar, alternar, remover };
}
