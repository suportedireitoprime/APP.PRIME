import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExternalLink, FolderTree, Loader2, Play, RefreshCw, Trash2 } from 'lucide-react';

type Tipo = 'apresentacao' | 'audioaula' | 'lei_cantada';

const TIPOS: { id: Tipo; label: string }[] = [
  { id: 'apresentacao', label: 'Apresentações' },
  { id: 'audioaula', label: 'Audioaulas' },
  { id: 'lei_cantada', label: 'Leis Cantadas' },
];

const LIMITE_DIA = 2;
const PASTA_DRIVE = 'https://drive.google.com/drive/folders/1SE_BqJwQpOuVh-tSZoEspWME4afKlVxg';

interface ItemFila {
  id: string;
  tipo: Tipo;
  titulo: string | null;
  link_origem: string;
  arquivo_url: string | null;
  status: string;
  erro: string | null;
  meta: Record<string, unknown> | null;
  criado_em: string;
  publicado_em: string | null;
}

interface Pdf {
  id: string;
  categoria: string;
  titulo: string;
  drive_link: string | null;
  criado_em: string;
}

const AdminConteudoFila = () => {
  const [tipo, setTipo] = useState<Tipo>('apresentacao');
  const [itens, setItens] = useState<ItemFila[]>([]);
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [form, setForm] = useState({ titulo: '', link: '', meta: '' });

  const carregar = async () => {
    setLoading(true);
    const [fila, arquivos] = await Promise.all([
      supabase.from('conteudo_fila' as any).select('*').order('criado_em', { ascending: true }),
      supabase.from('pdfs_gerados' as any).select('id, categoria, titulo, drive_link, criado_em')
        .order('criado_em', { ascending: false }).limit(30),
    ]);
    setItens(((fila.data ?? []) as any[]) as ItemFila[]);
    setPdfs(((arquivos.data ?? []) as any[]) as Pdf[]);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const doTipo = useMemo(() => itens.filter((i) => i.tipo === tipo), [itens, tipo]);

  const publicadosHoje = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return doTipo.filter((i) =>
      i.status === 'publicado' && i.publicado_em &&
      new Date(i.publicado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === hoje,
    ).length;
  }, [doTipo]);

  const adicionar = async () => {
    if (!form.link.trim()) { toast.error('Cole o link do arquivo no Drive.'); return; }
    let meta: Record<string, unknown> = {};
    if (form.meta.trim()) {
      try { meta = JSON.parse(form.meta); } catch { toast.error('Campo de dados extras não é um JSON válido.'); return; }
    }
    setSalvando(true);
    const { error } = await supabase.from('conteudo_fila' as any).insert({
      tipo,
      titulo: form.titulo.trim() || null,
      link_origem: form.link.trim(),
      ref_id: crypto.randomUUID(),
      meta,
      status: 'na_fila',
    } as any);
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Item adicionado à fila.');
    setForm({ titulo: '', link: '', meta: '' });
    carregar();
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from('conteudo_fila' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const rodarAgora = async () => {
    setRodando(true);
    const { data, error } = await supabase.functions.invoke('conteudo-fila-runner', { body: { tipo } });
    setRodando(false);
    if (error) { toast.error(error.message); return; }
    const r = (data as any)?.resultado?.[tipo];
    toast.success(`Publicados agora: ${r?.agora ?? 0} • hoje: ${r?.publicados_hoje ?? 0}/${LIMITE_DIA}`);
    carregar();
  };

  const criarPastas = async () => {
    const { error } = await supabase.functions.invoke('drive-bootstrap', { body: {} });
    if (error) { toast.error(error.message); return; }
    toast.success('Pastas e prompts criados no Drive.');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Fila de conteúdo" />

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={PASTA_DRIVE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" /> Abrir pasta no Drive
          </a>
          <button onClick={criarPastas} className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium">
            <FolderTree className="h-4 w-4" /> Criar pastas e prompts
          </button>
          <button onClick={carregar} className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>

        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                tipo === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Publicados hoje: <span className="font-semibold text-foreground">{publicadosHoje}/{LIMITE_DIA}</span> · o
            restante da fila entra automaticamente nos próximos dias (verificação a cada hora).
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <input
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            placeholder="Título (opcional)"
            className="h-12 w-full rounded-xl bg-muted px-4 text-sm outline-none"
          />
          <input
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            placeholder="Link do arquivo no Google Drive"
            className="h-12 w-full rounded-xl bg-muted px-4 text-sm outline-none"
          />
          <textarea
            value={form.meta}
            onChange={(e) => setForm((f) => ({ ...f, meta: e.target.value }))}
            placeholder={
              tipo === 'audioaula'
                ? '{"item_id":"uuid-da-aula"}'
                : tipo === 'apresentacao'
                  ? '{"apresentacao_id":"uuid-da-apresentacao"}'
                  : '{"tabela_codigo":"codigo_penal","numero_artigo":"121"}'
            }
            rows={3}
            className="w-full rounded-xl bg-muted px-4 py-3 font-mono text-xs outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={adicionar}
              disabled={salvando}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {salvando ? 'Adicionando…' : 'Adicionar à fila'}
            </button>
            <button
              onClick={rodarAgora}
              disabled={rodando}
              className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Rodar agora
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && doTipo.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada na fila deste tipo.</p>
          )}
          {doTipo.map((i) => (
            <div key={i.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.titulo || 'Sem título'}</p>
                <p className="truncate text-xs text-muted-foreground">{i.link_origem}</p>
                <p className="mt-1 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      i.status === 'publicado'
                        ? 'bg-primary/10 text-primary'
                        : i.status === 'erro'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i.status}
                  </span>
                  {i.erro && <span className="ml-2 text-destructive">{i.erro}</span>}
                </p>
              </div>
              <button onClick={() => remover(i.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">PDFs enviados ao Drive</h2>
          {pdfs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum PDF enviado ainda.</p>}
          {pdfs.map((p) => (
            <a
              key={p.id}
              href={p.drive_link ?? PASTA_DRIVE}
              target="_blank"
              rel="noreferrer"
              className="block truncate rounded-xl bg-muted px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{p.categoria}</span> · {p.titulo}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminConteudoFila;
