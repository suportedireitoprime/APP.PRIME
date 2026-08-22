import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen, FileText, Sparkles, RefreshCcw, Play, Loader2,
  CheckCircle2, AlertCircle, Clock, ListChecks, ChevronDown, ChevronRight, Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBibliotecaLeituraStatus, type LivroLeituraItem } from '@/hooks/useBibliotecaLeituraStatus';
import LeitorNativo from '@/components/biblioteca/LeitorNativo';
import FilaLeituraNativaPanel from '@/components/admin/FilaLeituraNativaPanel';

type Filtro = 'todos' | 'pendente' | 'processando' | 'pronto' | 'erro' | 'refino-pendente';

const badgeFor = (it: LivroLeituraItem) => {
  const s = it.leitura?.status;
  const r = it.leitura?.refino_status;
  if (s === 'processando') return { label: 'OCR rodando', tone: 'bg-amber-500/20 text-amber-200 border-amber-500/30', Icon: Loader2, spin: true };
  if (s === 'erro') return { label: 'Erro OCR', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (r === 'processando') return { label: 'Refino rodando', tone: 'bg-blue-500/20 text-blue-200 border-blue-500/30', Icon: Loader2, spin: true };
  if (r === 'erro') return { label: 'Erro refino', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (s === 'pronto' && r === 'pronto') return { label: 'Pronto (com capítulos)', tone: 'bg-emerald-500 text-primary-foreground font-semibold border-emerald-400', Icon: CheckCircle2 };
  if (s === 'pronto') return { label: 'OCR ok', tone: 'bg-emerald-600 text-white font-semibold border-emerald-400', Icon: CheckCircle2 };
  return { label: 'Pendente', tone: 'bg-white/5 text-white/60 border-white/10', Icon: Clock };
};

const AdminLeituraNativa = () => {
  const navigate = useNavigate();
  const { items, loading, reload } = useBibliotecaLeituraStatus();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [openColecao, setOpenColecao] = useState<string | null>(null);
  const [preview, setPreview] = useState<LivroLeituraItem | null>(null);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter((it) => {
      if (!it.download && !it.link) return false;
      const s = it.leitura?.status; const r = it.leitura?.refino_status;
      if (filtro === 'pendente' && s) return false;
      if (filtro === 'processando' && s !== 'processando' && r !== 'processando') return false;
      if (filtro === 'pronto' && !(s === 'pronto' && r === 'pronto')) return false;
      if (filtro === 'erro' && s !== 'erro' && r !== 'erro') return false;
      if (filtro === 'refino-pendente' && !(s === 'pronto' && r !== 'pronto')) return false;
      if (q) {
        const hay = `${it.titulo} ${it.autor ?? ''} ${it.colecao.label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, busca, filtro]);

  // Agrupa por coleção
  const grupos = useMemo(() => {
    const map = new Map<string, { id: string; label: string; itens: LivroLeituraItem[] }>();
    for (const it of filtered) {
      const g = map.get(it.colecao.id) ?? { id: it.colecao.id, label: it.colecao.label, itens: [] };
      g.itens.push(it);
      map.set(it.colecao.id, g);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aPendentes = a.itens.filter(i => (i.download || i.link) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto')).length;
      const bPendentes = b.itens.filter(i => (i.download || i.link) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto')).length;
      if (aPendentes > 0 && bPendentes === 0) return -1;
      if (aPendentes === 0 && bPendentes > 0) return 1;
      return a.label.localeCompare(b.label, 'pt-BR');
    });
  }, [filtered]);

  const keyOf = (it: LivroLeituraItem) => `${it.colecao.table}::${it.id}`;

  const toggle = (it: LivroLeituraItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(it);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const toggleGrupo = (grp: { itens: LivroLeituraItem[] }) => {
    setSelected((prev) => {
      const ks = grp.itens.map(keyOf);
      const all = ks.every((k) => prev.has(k));
      const next = new Set(prev);
      if (all) ks.forEach((k) => next.delete(k));
      else ks.forEach((k) => next.add(k));
      return next;
    });
  };

  async function invokeFn(name: string, body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  }

  async function processar(it: LivroLeituraItem, tipo: 'ocr' | 'refino' | 'completo') {
    const pdf_url = it.download || it.link || '';
    if ((tipo === 'ocr' || tipo === 'completo') && !pdf_url) {
      toast.error('Livro sem PDF'); return;
    }
    try {
      if (tipo === 'ocr' || tipo === 'completo') {
        await invokeFn('biblioteca-ocr-mistral', {
          livro_id: String(it.id), livro_tabela: it.colecao.table,
          pdf_url, titulo: it.titulo, force: true,
        });
      }
      if (tipo === 'refino' || tipo === 'completo') {
        const rodarOcr = async () => {
          if (!pdf_url) { toast.error('Livro sem OCR e sem PDF disponível'); return false; }
          toast.message('OCR ainda não rodou — disparando OCR + refino…');
          await invokeFn('biblioteca-ocr-mistral', {
            livro_id: String(it.id), livro_tabela: it.colecao.table,
            pdf_url, titulo: it.titulo, force: true,
          });
          return true;
        };
        try {
          const res: any = await invokeFn('biblioteca-ocr-mistral', {
            action: 'refino',
            livro_id: String(it.id), livro_tabela: it.colecao.table, force: true,
          });
          if (res?.status === 'sem_ocr') {
            if (!(await rodarOcr())) return;
          }
        } catch (err: any) {
          const msg = String(err?.message || '');
          const semConteudo = /conteudo_md vazio|Rode o OCR|Sem conte[úu]do para refinar|Leitura nativa n[ãa]o encontrada/i.test(msg);
          if (semConteudo) {
            if (!(await rodarOcr())) return;
          } else {
            throw err;
          }
        }
      }
      toast.success('Processamento disparado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao disparar');
    }
  }

  async function enfileirar(alvos: LivroLeituraItem[]) {
    const comPdf = alvos.filter((it) => it.download || it.link);
    if (!comPdf.length) { toast.error('Nenhum livro com PDF disponível'); return false; }
    const rows = comPdf.map((it, idx) => ({
      livro_tabela: it.colecao.table,
      livro_id: String(it.id),
      pdf_url: it.download || it.link || null,
      titulo: it.titulo,
      tipo: 'completo',
      scheduled_for: new Date(Date.now() + idx * 1000).toISOString(),
    }));
    const { error } = await supabase.from('biblioteca_leitura_jobs' as any).insert(rows);
    if (error) { toast.error(error.message); return false; }
    toast.success(`${rows.length} livro(s) enfileirados`);
    setSelected(new Set());
    return true;
  }


  async function dispararWorker() {
    setBatchRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('biblioteca-ocr-mistral', { body: { action: 'worker' } });
      if (error) throw error;
      toast.success(`Worker: ${data?.processed ?? 0} job(s) processados`);
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha no worker');
    } finally {
      setBatchRunning(false);
    }
  }

  const stats = useMemo(() => {
    const total = filtered.length;
    const pronto = filtered.filter((i) => i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto').length;
    const proc = filtered.filter((i) => i.leitura?.status === 'processando' || i.leitura?.refino_status === 'processando').length;
    const erro = filtered.filter((i) => i.leitura?.status === 'erro' || i.leitura?.refino_status === 'erro').length;
    return { total, pronto, proc, erro };
  }, [filtered]);

  return (
    <div className="min-h-dvh bg-black text-white">
      <PageHeader title="Leitura Nativa (OCR + Gemini)" onBack={() => navigate('/admin-funcoes')} />

      <div className="px-4 py-4 space-y-4 pb-32">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total de livros" value={stats.total} tone="text-white" />
          <StatCard label="Prontos" value={stats.pronto} tone="text-emerald-400" />
        </div>
        <div className="flex gap-3 text-[11px] text-white/50">
          <span className="text-amber-300">{stats.proc} rodando</span>
          <span className="text-red-300">{stats.erro} com erro</span>
          <span>{stats.total - stats.pronto} pendentes</span>
        </div>


        <div className="flex gap-2">
          <Input
            placeholder="Buscar título ou autor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
          <Button variant="outline" size="icon" onClick={reload} className="shrink-0">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-white/60 text-xs">Status:</div>
          {(['todos','pendente','processando','pronto','erro','refino-pendente'] as Filtro[]).map((f) => (
            <Chip key={f} active={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
          ))}
        </div>

        <div className="text-[11px] text-white/40">
          Abra uma categoria para ver e rodar a fila de processamento dela.
        </div>



        {loading ? (
          <div className="text-center text-white/60 py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : grupos.length === 0 ? (
          <div className="text-center text-white/50 py-10">Nenhum livro nos filtros atuais.</div>
        ) : (
          <div className="space-y-2">
            {grupos.map((g) => {
              const isOpen = openColecao === g.id;
              
              // Calculate stats for the group
              const prontos = g.itens.filter((i) => i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto').length;
              const rodando = g.itens.filter((i) => i.leitura?.status === 'processando' || i.leitura?.refino_status === 'processando').length;
              const erros = g.itens.filter((i) => i.leitura?.status === 'erro' || i.leitura?.refino_status === 'erro').length;
              const pendentesGrupo = g.itens.filter(
                (i) => (i.download || i.link) && !(i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto'),
              );
              const selecionadosGrupo = g.itens.filter((i) => selected.has(keyOf(i)));
              
              return (
                <div key={g.id} className={`rounded-2xl border ${pendentesGrupo.length > 0 ? 'border-yellow-500/30 bg-yellow-500/[0.02]' : 'border-white/10 bg-white/[0.03]'} overflow-hidden transition-colors`}>
                  <button
                    onClick={() => setOpenColecao(isOpen ? null : g.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.04] transition text-left"
                  >
                    {isOpen ? <ChevronDown className="h-5 w-5 text-white/60 shrink-0" /> : <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold break-words flex items-center gap-2">
                        {g.label}
                        {pendentesGrupo.length > 0 && !isOpen && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            {pendentesGrupo.length} pendentes
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/50 flex flex-wrap gap-2 mt-1">
                        <span>{g.itens.length} livro(s)</span>
                        <span className="text-emerald-400">• {prontos} prontos</span>
                        {pendentesGrupo.length > 0 && <span className="text-yellow-300">• {pendentesGrupo.length} pendentes</span>}
                        {rodando > 0 && <span className="text-amber-300">• {rodando} rodando</span>}
                        {erros > 0 && <span className="text-red-300">• {erros} erros</span>}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 p-3 space-y-3">
                      <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-4">
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <MiniStat label="Total" value={g.itens.length} tone="text-white" />
                          <MiniStat label="Prontos" value={prontos} tone="text-emerald-400" />
                          <MiniStat label="Pendentes" value={pendentesGrupo.length} tone="text-yellow-300" />
                          <MiniStat label="Erros" value={erros} tone="text-red-300" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-yellow-400 text-primary-foreground hover:bg-yellow-300"
                            disabled={!pendentesGrupo.length}
                            onClick={async () => {
                              const ok = await enfileirar(pendentesGrupo);
                              if (ok) toast.info('Livros enfileirados. Role para baixo e clique em "Rodar fila".');
                            }}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Enfileirar todos ({pendentesGrupo.length})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!selecionadosGrupo.length}
                            onClick={async () => {
                              const ok = await enfileirar(selecionadosGrupo);
                              if (ok) toast.info('Livros enfileirados. Role para baixo e clique em "Rodar fila".');
                            }}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Enfileirar selecionados ({selecionadosGrupo.length})
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleGrupo(g)}>
                            <ListChecks className="h-3 w-3 mr-1" /> Selecionar todos
                          </Button>
                          {selecionadosGrupo.length > 0 && (
                            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
                          )}
                        </div>
                      </div>

                      <FilaLeituraNativaPanel
                        key={g.id}
                        onRefresh={reload}
                        livroTabela={g.itens[0]?.colecao.table}
                        titulo={g.label}
                        onAutoEnqueue={pendentesGrupo.length > 0 ? () => enfileirar(pendentesGrupo) : undefined}
                      />

                      {(() => {
                        const sortedItens = [...g.itens].sort((a, b) => {
                          const aPend = (a.download || a.link) && !(a.leitura?.status === 'pronto' && a.leitura?.refino_status === 'pronto') ? 1 : 0;
                          const bPend = (b.download || b.link) && !(b.leitura?.status === 'pronto' && b.leitura?.refino_status === 'pronto') ? 1 : 0;
                          if (aPend > bPend) return -1;
                          if (aPend < bPend) return 1;
                          return a.titulo.localeCompare(b.titulo, 'pt-BR');
                        });
                        return sortedItens.map((it) => {
                        const k = keyOf(it);
                        const b = badgeFor(it);
                        const B = b.Icon;
                        const upd = it.leitura?.refino_updated_at ?? it.leitura?.updated_at;
                        const podePrev = it.leitura?.status === 'pronto';
                        const finalizado = it.leitura?.status === 'pronto' && it.leitura?.refino_status === 'pronto';
                        return (
                          <div key={k} className="rounded-xl border border-white/10 bg-black/40 p-3 flex gap-3 items-start">
                            <input type="checkbox" className="mt-1 accent-yellow-400"
                              checked={selected.has(k)} onChange={() => toggle(it)} />
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                              {it.capa ? (
                                <img src={it.capa} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : <BookOpen className="h-4 w-4 text-white/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold break-words">{it.titulo}</div>
                              {it.autor && (
                                <div className="text-xs text-white/50 break-words">{it.autor}</div>
                              )}
                              <div className="flex flex-wrap gap-2 items-center mt-1">
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${b.tone}`}>
                                  <B className={`h-3 w-3 ${b.spin ? 'animate-spin' : ''}`} />
                                  {b.label}
                                </span>
                                {it.leitura?.total_paginas ? (
                                  <span className="text-[10px] text-white/40">{it.leitura.total_paginas} pág.</span>
                                ) : null}
                                {upd ? (
                                  <span className="text-[10px] text-white/40">{new Date(upd).toLocaleString('pt-BR')}</span>
                                ) : null}
                              </div>
                              {it.leitura?.etapa && (it.leitura.status === 'processando' || it.leitura.refino_status === 'processando') && (
                                <div className="text-[10px] text-white/50 mt-1 truncate">{it.leitura.etapa}</div>
                              )}
                              {(it.leitura?.erro_detalhe || it.leitura?.refino_erro) && (
                                <div className="text-[10px] text-red-300 mt-1 truncate">{it.leitura.erro_detalhe || it.leitura.refino_erro}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button size="sm" className={`h-7 ${finalizado ? 'bg-emerald-500 text-primary-foreground hover:bg-emerald-400' : 'bg-yellow-400 text-primary-foreground hover:bg-yellow-300'}`}
                                onClick={() => processar(it, 'completo')}>
                                <Sparkles className="h-3 w-3 mr-1" /> {finalizado ? 'Reextrair' : 'Extrair'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2 disabled:opacity-40"
                                disabled={!podePrev}
                                onClick={() => setPreview(it)}
                                title={podePrev ? 'Prévia nativa' : 'Extraia o livro antes de pré-visualizar'}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Prévia
                              </Button>
                            </div>
                          </div>
                        );
                      })})}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {preview && (
        <LeitorNativo
          livroId={String(preview.id)}
          livroTabela={preview.colecao.table}
          pdfUrl={preview.download || preview.link || ''}
          titulo={preview.titulo}
          autor={preview.autor ?? undefined}
          capa={preview.capa ?? undefined}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-xs border transition ${
      active ? 'bg-yellow-400 text-primary-foreground border-yellow-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const MiniStat = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-lg bg-white/5 border border-white/10 py-1.5">
    <div className={`text-base font-bold ${tone}`}>{value}</div>
    <div className="text-[10px] text-white/50">{label}</div>
  </div>
);

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="text-xs text-white/50">{label}</div>
    <div className={`text-2xl font-bold ${tone}`}>{value}</div>
  </div>
);

export default AdminLeituraNativa;
