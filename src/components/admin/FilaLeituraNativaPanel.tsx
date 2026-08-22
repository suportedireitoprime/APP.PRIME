import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, Square, Loader2, ListChecks, Terminal, RefreshCcw, Radio } from 'lucide-react';

type JobRow = {
  id: string;
  livro_id: string;
  livro_tabela: string;
  titulo: string | null;
  tipo: string | null;
  status: string | null;
  erro: string | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string | null;
};

type LeituraRow = {
  livro_id: string;
  livro_tabela: string;
  status: string | null;
  refino_status: string | null;
  etapa: string | null;
  progresso: number | null;
  total_etapas: number | null;
  total_paginas: number | null;
  erro_detalhe: string | null;
  refino_erro: string | null;
  updated_at: string | null;
  refino_updated_at: string | null;
};

type Counts = { agendado: number; rodando: number; ok: number; erro: number };
type Sessao = { ciclos: number; iniciados: number; ok: number; erro: number; faltam: number; atual?: string; etapa?: string };

const ZERO: Counts = { agendado: 0, rodando: 0, ok: 0, erro: 0 };

interface Props {
  onRefresh: () => void;
  /** Restringe a fila a uma coleção/categoria (tabela do livro). */
  livroTabela?: string;
  titulo?: string;
  /** Se a fila estiver vazia ao rodar, tenta enfileirar os pendentes automaticamente. */
  onAutoEnqueue?: () => Promise<boolean>;
}

export default function FilaLeituraNativaPanel(props: Props) {
  const { onRefresh, livroTabela, titulo } = props;
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [recentes, setRecentes] = useState<JobRow[]>([]);
  const logStorageKey = `fila-leitura-nativa-logs:${livroTabela ?? 'todas'}`;
  const [logs, setLogs] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem(logStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-200) : [];
    } catch {
      return [];
    }
  });
  const [rodando, setRodando] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const titleByLivroRef = useRef(new Map<string, string>());
  const jobStatusRef = useRef(new Map<string, string>());
  const etapaRef = useRef(new Map<string, string>());

  const addLog = useCallback((msg: string) => {
    const hora = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => {
      const next = [...prev.slice(-199), `[${hora}] ${msg}`];
      try { sessionStorage.setItem(logStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [logStorageKey]);

  const nomeJob = useCallback((job?: Pick<JobRow, 'id' | 'livro_id' | 'livro_tabela' | 'titulo'> | null) => {
    if (!job) return 'livro';
    const key = `${job.livro_tabela}::${job.livro_id}`;
    return job.titulo || titleByLivroRef.current.get(key) || `job ${job.id.slice(0, 8)}`;
  }, []);

  const lembrarJob = useCallback((job: JobRow) => {
    const key = `${job.livro_tabela}::${job.livro_id}`;
    if (job.titulo) titleByLivroRef.current.set(key, job.titulo);
    if (job.status) jobStatusRef.current.set(job.id, job.status);
  }, []);

  const contarStatus = useCallback(async (status: keyof Counts) => {
    let q = supabase
      .from('biblioteca_leitura_jobs' as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', status);
    if (livroTabela) q = q.eq('livro_tabela', livroTabela);
    const { count } = await q;
    return count ?? 0;
  }, [livroTabela]);

  const carregarFila = useCallback(async () => {
    const [agendado, rodandoCount, ok, erro] = await Promise.all([
      contarStatus('agendado'),
      contarStatus('rodando'),
      contarStatus('ok'),
      contarStatus('erro'),
    ]);
    const c = { agendado, rodando: rodandoCount, ok, erro };
    setCounts(c);

    let q = supabase
      .from('biblioteca_leitura_jobs' as any)
      .select('id,livro_id,livro_tabela,titulo,tipo,status,erro,started_at,finished_at,updated_at')
      .in('status', ['rodando', 'agendado']);
    if (livroTabela) q = q.eq('livro_tabela', livroTabela);
    const { data, error } = await q.order('status', { ascending: false }).order('scheduled_for', { ascending: true }).limit(12);
    if (!error) {
      const rows = ((data ?? []) as unknown as JobRow[]);
      rows.forEach(lembrarJob);
      setRecentes(rows);
    }
    return c;
  }, [contarStatus, livroTabela, lembrarJob]);

  useEffect(() => {
    carregarFila();
    const t = setInterval(carregarFila, rodando ? 1500 : 4000);
    return () => clearInterval(t);
  }, [carregarFila, rodando]);

  useEffect(() => {
    const matches = (row: any) => !livroTabela || row?.livro_tabela === livroTabela;
    const channel = supabase
      .channel(`fila-leitura-nativa:${livroTabela ?? 'todas'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biblioteca_leitura_jobs' }, (payload: any) => {
        const row = payload.new ?? payload.old;
        if (!matches(row)) return;
        const job = row as JobRow;
        const anterior = jobStatusRef.current.get(job.id);
        if (job.titulo) titleByLivroRef.current.set(`${job.livro_tabela}::${job.livro_id}`, job.titulo);
        if (job.status && anterior !== job.status) {
          jobStatusRef.current.set(job.id, job.status);
          if (job.status === 'rodando') addLog(`Girou: ${nomeJob(job)}`);
          if (job.status === 'ok') addLog(`Concluiu: ${nomeJob(job)}`);
          if (job.status === 'erro') addLog(`Erro em ${nomeJob(job)}: ${job.erro ?? 'falha no processamento'}`);
          if (job.status === 'agendado' && anterior === 'rodando') addLog(`Tentará novamente: ${nomeJob(job)}`);
        }
        carregarFila();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biblioteca_leitura_nativa' }, (payload: any) => {
        const row = payload.new;
        if (!matches(row)) return;
        const leitura = row as LeituraRow;
        const key = `${leitura.livro_tabela}::${leitura.livro_id}`;
        const processando = leitura.status === 'processando' || leitura.refino_status === 'processando';
        if (!processando) return;
        const etapa = leitura.etapa || 'processando';
        const etapaKey = `${etapa}|${leitura.progresso ?? ''}|${leitura.total_paginas ?? ''}`;
        if (etapaRef.current.get(key) === etapaKey) return;
        etapaRef.current.set(key, etapaKey);
        const tituloLivro = titleByLivroRef.current.get(key) || `livro ${leitura.livro_id}`;
        const progresso = leitura.progresso && leitura.total_etapas ? ` (${leitura.progresso}/${leitura.total_etapas})` : '';
        addLog(`Agora em ${tituloLivro}: ${etapa}${progresso}`);
        setSessao((prev) => prev ? { ...prev, atual: tituloLivro, etapa } : prev);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biblioteca_leitura_fila_estado' }, (payload: any) => {
        const row = payload.new;
        if (!row || row.escopo !== (livroTabela ?? 'todas')) return;
        setRodando(row.rodando === true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [addLog, carregarFila, livroTabela, lembrarJob, nomeJob]);


  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  // ---- Estado persistido da fila (roda no servidor, mesmo com o app fechado) ----
  const escopo = livroTabela ?? 'todas';

  const lerEstado = useCallback(async () => {
    const { data } = await supabase
      .from('biblioteca_leitura_fila_estado' as any)
      .select('rodando')
      .eq('escopo', escopo)
      .maybeSingle();
    const ligada = (data as any)?.rodando === true;
    setRodando(ligada);
    return ligada;
  }, [escopo]);

  const gravarEstado = useCallback(async (valor: boolean) => {
    await supabase
      .from('biblioteca_leitura_fila_estado' as any)
      .upsert({ escopo, rodando: valor, atualizado_em: new Date().toISOString() } as any, { onConflict: 'escopo' });
    setRodando(valor);
  }, [escopo]);

  const chutarWorker = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('biblioteca-ocr-mistral', {
      body: { action: 'worker', imediato: true, background: true, ...(livroTabela ? { livro_tabela: livroTabela } : {}) },
    });
    if (error) { addLog(`Erro ao iniciar worker: ${error.message}`); return null; }
    const results: JobRow[] = data?.results ?? [];
    const job = results.find((r) => r.status === 'rodando') ?? results[0] ?? null;
    if (job) { lembrarJob(job); addLog(`Girou: ${nomeJob(job)}`); }
    else addLog('Nenhum livro elegível na fila agora.');
    return job;
  }, [addLog, lembrarJob, livroTabela, nomeJob]);

  useEffect(() => { lerEstado(); }, [lerEstado]);

  // Vigia: se a fila está ligada mas nada está rodando (isolate caiu / fila parada),
  // reacende o worker no servidor.
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(async () => {
      const ligada = await lerEstado();
      if (!ligada) return;
      const c = await carregarFila();
      if (c.rodando === 0 && c.agendado > 0) {
        addLog('Retomando fila no servidor…');
        chutarWorker();
      }
      if (c.rodando === 0 && c.agendado === 0) {
        addLog('Fila vazia — processamento concluído.');
        gravarEstado(false);
      }
    }, 20000);
    return () => clearInterval(t);
  }, [rodando, lerEstado, carregarFila, chutarWorker, addLog, gravarEstado]);

  async function rodarFila() {
    if (rodando) {
      await gravarEstado(false);
      addLog('Fila pausada — o livro atual termina e nada mais será iniciado.');
      toast.info('Fila pausada');
      return;
    }

    let agendadosAgora = counts.agendado;
    if (agendadosAgora === 0 && typeof props.onAutoEnqueue === 'function') {
      const ok = await props.onAutoEnqueue();
      if (!ok) return; // falhou ao enfileirar ou n tinha nada
      const c = await carregarFila();
      agendadosAgora = c.agendado;
    }

    if (agendadosAgora === 0) {
      toast.warning('Nenhum livro agendado na fila.');
      return;
    }

    setSessao({ ciclos: 0, iniciados: 0, ok: 0, erro: 0, faltam: agendadosAgora, etapa: 'iniciando' });
    addLog(`Iniciando processamento${props.titulo ? ` de ${props.titulo}` : ''}… (continua rodando no servidor)`);
    await gravarEstado(true);
    const job = await chutarWorker();
    if (!job) { await gravarEstado(false); return; }
    toast.success('Fila rodando no servidor — pode sair da página');
    carregarFila();
    onRefresh();
  }


  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-semibold">
          Fila de processamento{titulo ? ` — ${titulo}` : ''}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={carregarFila} title="Atualizar fila">
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <FilaStat label="Na fila" value={counts.agendado} tone="text-yellow-300" />
        <FilaStat label="Rodando" value={counts.rodando} tone="text-amber-300" />
        <FilaStat label="Concluídos" value={counts.ok} tone="text-emerald-300" />
        <FilaStat label="Erros" value={counts.erro} tone="text-red-300" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className={rodando ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-yellow-400 text-primary-foreground hover:bg-yellow-300'}
          onClick={rodarFila}
        >
          {rodando ? <Square className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {rodando ? 'Pausar fila' : 'Rodar fila agora'}
        </Button>
      </div>

      {(rodando || sessao) && (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-2.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-100">
            {rodando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
            {rodando ? 'Fila em execução' : 'Última execução'}
          </div>
          <div className="text-[11px] text-white/75 break-words">
            {sessao?.atual ? <>Agora: <span className="text-white">{sessao.atual}</span></> : 'Aguardando próximo livro…'}
          </div>
          {sessao?.etapa && <div className="text-[11px] text-yellow-100/80 break-words">{sessao.etapa}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/45">
            <span>{sessao?.iniciados ?? 0} iniciado(s)</span>
            <span>{sessao?.ok ?? 0} concluído(s)</span>
            <span>{sessao?.erro ?? 0} erro(s)</span>
            <span>{counts.agendado} na fila</span>
          </div>
        </div>
      )}

      {recentes.length > 0 && (
        <div className="space-y-1">
          {recentes.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-[11px] text-white/70">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${r.status === 'rodando' ? 'bg-amber-400 animate-pulse' : 'bg-white/30'}`}
              />
              <span className="truncate">{r.titulo ?? r.id}</span>
              <span className="ml-auto shrink-0 text-white/40">{r.status}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-1 text-[11px] text-white/50 mb-1">
          <Terminal className="h-3 w-3" /> Logs em tempo real
        </div>
        <div
          ref={logRef}
          className="h-40 overflow-y-auto rounded-lg bg-black/60 border border-white/10 p-2 font-mono text-[10px] leading-relaxed text-emerald-200/90 whitespace-pre-wrap"
        >
          {logs.length === 0 ? <span className="text-white/30">Sem atividade ainda.</span> : logs.join('\n')}
        </div>
      </div>
    </div>
  );
}

function FilaStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 py-1.5">
      <div className={`text-base font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
    </div>
  );
}
