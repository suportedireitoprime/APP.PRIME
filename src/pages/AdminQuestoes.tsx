import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, RefreshCw, Download, Gavel, Sparkles, Database, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

type PlanilhaDesc = {
  spreadsheetId: string; nome: string; sheetName: string; cargo: string;
  totalLinhas: number; jaImportadas: number; novas: number; conhecida: boolean; erro?: string;
};
type Descoberta = {
  planilhas: PlanilhaDesc[];
  novosCargos: string[];
  totalNovas: number;
};

const AdminQuestoes = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ total: number; cargos: number; iniciante: number; comIA: number } | null>(null);
  const [descoberta, setDescoberta] = useState<Descoberta | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  async function carregar() {
    const [{ count: total }, { count: cargos }, { count: iniciante }, { count: comIA }, { data: log }] = await Promise.all([
      db.from('questoes').select('id', { count: 'exact', head: true }),
      db.from('questoes_cargos').select('id', { count: 'exact', head: true }),
      db.from('questoes').select('id', { count: 'exact', head: true }).eq('nivel', 'iniciante'),
      db.from('questoes').select('id', { count: 'exact', head: true }).not('comentario_ia', 'is', null),
      db.from('questoes_sync_log').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    setStats({ total: total ?? 0, cargos: cargos ?? 0, iniciante: iniciante ?? 0, comIA: comIA ?? 0 });
    setLogs(log ?? []);
  }
  useEffect(() => { carregar(); }, []);

  async function invocar(fn: string, body: any, label: string) {
    setBusy(label);
    const { data, error } = await supabase.functions.invoke(fn, { body });
    setBusy(null);
    if (error) { toast.error(`Falha: ${error.message}`); return null; }
    if ((data as any)?.error) { toast.error(String((data as any).error)); return null; }
    return data as any;
  }

  async function buscarMais() {
    const d = await invocar('questoes-sheets-descobrir', {}, 'descobrir');
    if (!d) return;
    setDescoberta(d);
    toast.success(`${d.totalNovas ?? 0} questão(ões) nova(s) em ${(d.planilhas ?? []).length} planilha(s)`);
  }

  async function buscarCargos() {
    const d = await invocar('questoes-sheets-descobrir', { cadastrar: true }, 'cargos');
    if (!d) return;
    setDescoberta(d);
    carregar();
    if (!d.novosCargos?.length) toast.info('Nenhum cargo novo na pasta do Drive');
    else toast.success(`${d.novosCargos.length} cargo(s) cadastrado(s): ${d.novosCargos.join(', ')}`);
  }

  /** Importa uma planilha inteira (em lotes até concluir). */
  async function importarPlanilha(p: PlanilhaDesc) {
    let offset = 0;
    let inseridas = 0;
    let ignoradas = 0;
    let totalAtual = p.jaImportadas;
    let concluido = false;
    setBusy(`import-${p.spreadsheetId}`);
    for (let i = 0; i < 100; i++) {
      const { data, error } = await supabase.functions.invoke('questoes-sheets-importar', {
        body: { spreadsheetId: p.spreadsheetId, sheetName: p.sheetName, nome: p.cargo, offset, limite: 2000 },
      });
      if (error || (data as any)?.error) {
        toast.error(`Falha: ${(data as any)?.error ?? error?.message}`);
        break;
      }
      const r = data as any;
      inseridas += r.inseridas ?? 0;
      ignoradas += r.ignoradas ?? 0;
      totalAtual = r.total ?? totalAtual;
      if (r.concluido || r.proximoOffset == null) {
        concluido = true;
        break;
      }
      offset = r.proximoOffset;
      // pausa entre lotes para não estourar a cota por minuto do Google Sheets
      await new Promise((res) => setTimeout(res, 1500));
    }
    setBusy(null);
    toast.success(`${p.cargo}: ${inseridas} importada(s), ${ignoradas} ignorada(s)`);
    if (concluido) {
      setDescoberta((atual) => {
        if (!atual) return atual;
        const planilhas = atual.planilhas.map((item) =>
          item.spreadsheetId === p.spreadsheetId && item.sheetName === p.sheetName
            ? { ...item, jaImportadas: totalAtual, novas: 0, conhecida: true }
            : item,
        );
        return {
          ...atual,
          planilhas,
          totalNovas: planilhas.reduce((soma, item) => soma + item.novas, 0),
        };
      });
    }
    carregar();
    return concluido;
  }

  async function importarTudo() {
    const alvos = (descoberta?.planilhas ?? []).filter((p) => p.novas > 0 && p.sheetName);
    for (const p of alvos) await importarPlanilha(p);
  }


  async function importarIniciante() {
    const r = await invocar('questoes-importar-iniciante', { limite: 5000 }, 'iniciante');
    if (!r) return;
    toast.success(`${r.inseridas} questão(ões) iniciante importada(s)`);
    carregar();
  }

  const CARDS = [
    { label: 'Questões', valor: stats?.total, icon: Database },
    { label: 'Cargos', valor: stats?.cargos, icon: Gavel },
    { label: 'Iniciante', valor: stats?.iniciante, icon: Sparkles },
    { label: 'Com IA', valor: stats?.comIA, icon: CheckCircle2 },
  ];

  return (
    <div className="theme-questoes min-h-screen bg-background pb-24">
      <PageHeader title="Questões — Editar" subtitle="Importação e sincronização" onBack={() => navigate('/admin-funcoes')} />

      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {c.valor == null ? '—' : c.valor.toLocaleString('pt-BR')}
                </p>
                <p className="text-[12px] text-muted-foreground">{c.label}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={buscarMais} disabled={!!busy}>
            {busy === 'descobrir' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Buscar mais questões
          </Button>
          <Button variant="secondary" className="w-full" onClick={buscarCargos} disabled={!!busy}>
            {busy === 'cargos' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
            Buscar novo cargo
          </Button>
          <Button variant="outline" className="w-full" onClick={importarIniciante} disabled={!!busy}>
            {busy === 'iniciante' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Importar questões iniciante (projeto antigo)
          </Button>
        </div>

        {descoberta && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-bold text-foreground">Planilhas encontradas</p>
              {descoberta.totalNovas > 0 && (
                <Button size="sm" onClick={importarTudo} disabled={!!busy}>
                  {busy === 'import-all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Importar tudo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {(descoberta.planilhas ?? []).map((p) => (
                <div key={`${p.spreadsheetId}-${p.sheetName}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-foreground">{p.nome}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {p.cargo} • {p.jaImportadas}/{p.totalLinhas} importadas
                      {!p.conhecida && <span className="ml-1 text-primary">• cargo novo</span>}
                      {p.erro && <span className="ml-1 text-destructive">• {p.erro}</span>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={p.novas > 0 ? 'default' : 'ghost'}
                    disabled={p.novas === 0 || !!busy}
                    onClick={() => importarPlanilha(p)}
                  >
                    {busy === `import-${p.spreadsheetId}`
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : p.novas > 0 ? `+${p.novas}` : 'Importado'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-[15px] font-bold text-foreground">Últimas sincronizações</p>
          {logs.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nenhuma importação registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2 text-[12px]">
                  {l.ok === false
                    ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />}
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{l.mensagem ?? l.origem}</strong> — {l.inseridas ?? 0} novas, {l.ignoradas ?? 0} ignoradas
                    {' '}• {new Date(l.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestoes;
