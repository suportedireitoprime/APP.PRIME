import { useEffect, useMemo, useState, useCallback } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Headphones, Loader2, Sparkles, Copy, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Link2, Eye, EyeOff, RefreshCcw, Table2, Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LivroRow {
  id: number;
  tema: string | null;
  area: string | null;
  capa_livro: string | null;
}
interface CursoRow {
  id: string;
  area: string;
  livro_id: string;
  livro_tabela: string;
  titulo: string;
  publicado: boolean;
  total_aulas: number;
}
interface ItemRow {
  id: string;
  curso_id: string;
  numero: number;
  titulo: string;
  resumo: string | null;
  prompt: string | null;
  conteudo: string | null;
  audio_url: string | null;
  publicado: boolean;
}

const copiar = async (texto: string, label: string) => {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('Não foi possível copiar');
  }
};

const AdminAudioaulas = () => {
  const [livros, setLivros] = useState<LivroRow[]>([]);
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [prontos, setProntos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [gerando, setGerando] = useState<string | null>(null);
  const [cursoAberto, setCursoAberto] = useState<CursoRow | null>(null);
  const [itens, setItens] = useState<ItemRow[]>([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [sheets, setSheets] = useState<'sync' | 'links' | null>(null);

  async function sincronizar(cursoId?: string) {
    setSheets('sync');
    try {
      const { data, error } = await supabase.functions.invoke('audioaulas-sheets-sync', {
        body: cursoId ? { curso_id: cursoId } : {},
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${(data as any).aulas ?? 0} aulas enviadas à planilha`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao sincronizar planilha');
    } finally {
      setSheets(null);
    }
  }

  async function buscarLinks() {
    setSheets('links');
    try {
      const { data, error } = await supabase.functions.invoke('audioaulas-sheets-links', { body: {} });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const n = (data as any).importados ?? 0;
      toast.success(n ? `${n} links importados` : 'Nenhum link novo na planilha');
      if (cursoAberto) await abrirCurso(cursoAberto);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao buscar links');
    } finally {
      setSheets(null);
    }
  }

  const carregar = useCallback(async () => {
    setLoading(true);
    const [{ data: livrosData }, { data: cursosData }, { data: nativaData }] = await Promise.all([
      supabase.from('biblioteca_estudos').select('id, tema, area, capa_livro').order('ordem', { ascending: true }),
      supabase.from('audioaulas_cursos').select('id, area, livro_id, livro_tabela, titulo, publicado, total_aulas'),
      supabase.from('biblioteca_leitura_nativa').select('livro_id, livro_tabela, status, refino_status').eq('livro_tabela', 'biblioteca_estudos'),
    ]);
    setLivros((livrosData ?? []) as LivroRow[]);
    setCursos((cursosData ?? []) as CursoRow[]);
    setProntos(new Set(
      (nativaData ?? [])
        .filter((n: any) => n.status === 'pronto' || n.refino_status === 'pronto')
        .map((n: any) => String(n.livro_id)),
    ));
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const map = new Map<string, LivroRow[]>();
    for (const l of livros) {
      const area = (l.area || 'Sem área').trim();
      if (q && !`${l.tema ?? ''} ${area}`.toLowerCase().includes(q)) continue;
      const arr = map.get(area) ?? [];
      arr.push(l);
      map.set(area, arr);
    }
    return Array.from(map.entries())
      .map(([area, itens]) => ({ area, itens }))
      .sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  }, [livros, busca]);

  const cursoDoLivro = (id: number) => cursos.find((c) => c.livro_id === String(id));

  async function gerar(livro: LivroRow) {
    setGerando(String(livro.id));
    try {
      const { data, error } = await supabase.functions.invoke('audioaulas-gerar', {
        body: { livro_id: String(livro.id), livro_tabela: 'biblioteca_estudos' },
      });
      if (error) {
        // supabase-js esconde o corpo do erro; lemos a resposta real da função
        let detalhe = error.message;
        const ctx: any = (error as any)?.context;
        try {
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.clone().json();
            if (body?.error) detalhe = String(body.error);
          }
        } catch { /* ignora */ }
        throw new Error(detalhe);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${(data as any).total} audioaulas geradas`);
      await carregar();
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao gerar audioaulas', { duration: 8000 });
    } finally {
      setGerando(null);
    }
  }


  async function abrirCurso(curso: CursoRow) {
    setCursoAberto(curso);
    setCarregandoItens(true);
    const { data } = await supabase
      .from('audioaulas_itens')
      .select('id, curso_id, numero, titulo, resumo, prompt, conteudo, audio_url, publicado')
      .eq('curso_id', curso.id)
      .order('ordem', { ascending: true });
    setItens((data ?? []) as ItemRow[]);
    setCarregandoItens(false);
  }

  async function salvarItem(item: ItemRow, patch: Partial<ItemRow>) {
    const { error } = await supabase.from('audioaulas_itens').update(patch).eq('id', item.id);
    if (error) { toast.error(error.message); return; }
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    toast.success('Salvo');
  }

  async function togglePublicarCurso(curso: CursoRow) {
    const novo = !curso.publicado;
    const { error } = await supabase.from('audioaulas_cursos').update({ publicado: novo }).eq('id', curso.id);
    if (error) { toast.error(error.message); return; }
    setCursos((prev) => prev.map((c) => (c.id === curso.id ? { ...c, publicado: novo } : c)));
    setCursoAberto((c) => (c && c.id === curso.id ? { ...c, publicado: novo } : c));
  }

  if (cursoAberto) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <PageHeader title="Audioaulas" subtitle={cursoAberto.titulo} onBack={() => setCursoAberto(null)} />
        <div className="px-4 pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={cursoAberto.publicado ? 'default' : 'outline'} size="sm" onClick={() => togglePublicarCurso(cursoAberto)}>
              {cursoAberto.publicado ? <Eye className="w-4 h-4 mr-1.5" /> : <EyeOff className="w-4 h-4 mr-1.5" />}
              {cursoAberto.publicado ? 'Publicado' : 'Rascunho'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => abrirCurso(cursoAberto)}>
              <RefreshCcw className="w-4 h-4 mr-1.5" /> Recarregar
            </Button>
            <Button variant="outline" size="sm" disabled={sheets !== null} onClick={() => sincronizar(cursoAberto.id)}>
              {sheets === 'sync'
                ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                : <Table2 className="w-4 h-4 mr-1.5" />}
              Enviar à planilha
            </Button>
            <Button variant="outline" size="sm" disabled={sheets !== null} onClick={buscarLinks}>
              {sheets === 'links'
                ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                : <Download className="w-4 h-4 mr-1.5" />}
              Buscar links
            </Button>
          </div>

          {carregandoItens ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 pl-5 space-y-3"
                >
                  <span className="absolute left-0 top-0 h-full w-1 bg-primary/70" aria-hidden />

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary border border-border/70 text-foreground flex items-center justify-center text-sm font-bold tabular-nums shrink-0">
                      {item.numero}
                    </div>
                    <Input
                      value={item.titulo}
                      onChange={(e) => setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, titulo: e.target.value } : i)))}
                      onBlur={() => salvarItem(item, { titulo: item.titulo })}
                      className="font-semibold bg-background"
                    />
                  </div>

                  {item.resumo && <p className="text-sm leading-relaxed text-muted-foreground">{item.resumo}</p>}

                  <details className="rounded-xl bg-muted/40 border border-border/50">
                    <summary className="px-3 py-2 text-sm font-medium text-muted-foreground cursor-pointer">Ver prompt</summary>
                    <Textarea readOnly value={item.prompt ?? ''} className="min-h-[220px] text-xs font-mono border-0 bg-transparent" />
                  </details>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground border border-border/60" onClick={() => copiar(item.titulo, 'Título')}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Título
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground border border-border/60" onClick={() => copiar(item.prompt ?? '', 'Prompt')}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Prompt
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground border border-border/60" onClick={() => copiar(item.conteudo ?? '', 'Conteúdo')}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Conteúdo
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copiar(
                        `TÍTULO: ${item.titulo}\n\n=== PROMPT ===\n${item.prompt ?? ''}\n\n=== CONTEÚDO ===\n${item.conteudo ?? ''}`,
                        'Tudo',
                      )}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar tudo
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Cole aqui o link do áudio (mp3)"
                      value={item.audio_url ?? ''}
                      onChange={(e) => setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, audio_url: e.target.value } : i)))}
                      className="bg-background"
                    />
                    <Button size="sm" variant="secondary" onClick={() => salvarItem(item, { audio_url: item.audio_url || null, publicado: Boolean(item.audio_url) })}>
                      Salvar
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {item.publicado
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-1"><CheckCircle2 className="w-3.5 h-3.5" /> Publicada</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-500 px-2 py-1"><Clock className="w-3.5 h-3.5" /> Não publicada</span>}
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => salvarItem(item, { publicado: !item.publicado })}>
                      {item.publicado ? 'Despublicar' : 'Publicar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Audioaulas" subtitle="Gerar títulos e prompts a partir da leitura nativa" />
      <div className="px-4 pt-4 space-y-4">
        <Input placeholder="Buscar livro ou área..." value={busca} onChange={(e) => setBusca(e.target.value)} />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={sheets !== null} onClick={() => sincronizar()}>
            {sheets === 'sync' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Table2 className="w-4 h-4 mr-1.5" />}
            Enviar tudo à planilha
          </Button>
          <Button variant="outline" size="sm" disabled={sheets !== null} onClick={buscarLinks}>
            {sheets === 'links' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
            Buscar links dos áudios
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          grupos.map((g) => {
            const aberto = areaAberta === g.area;
            return (
              <div key={g.area} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setAreaAberta(aberto ? null : g.area)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <Headphones className="w-5 h-5 text-primary shrink-0" />
                  <span className="flex-1 font-semibold text-foreground">{g.area}</span>
                  <span className="text-xs text-muted-foreground">{g.itens.length}</span>
                  {aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {aberto && (
                  <div className="divide-y divide-border/60">
                    {g.itens.map((l) => {
                      const curso = cursoDoLivro(l.id);
                      const temOcr = prontos.has(String(l.id));
                      return (
                        <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{l.tema}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {curso ? `${curso.total_aulas} aulas${curso.publicado ? ' • publicado' : ''}` : temOcr ? 'Texto pronto' : 'Sem leitura nativa'}
                            </div>
                          </div>
                          {curso && (
                            <Button size="sm" variant="outline" onClick={() => abrirCurso(curso)}>Abrir</Button>
                          )}
                          <Button
                            size="sm"
                            disabled={!temOcr || gerando === String(l.id)}
                            onClick={() => gerar(l)}
                          >
                            {gerando === String(l.id)
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />{curso ? 'Regerar' : 'Gerar'}</>}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminAudioaulas;
