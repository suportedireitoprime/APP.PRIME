import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { MELODIAS, montarPrompt, type TipoPrompt } from '@/lib/leisCantadasPrompt';
import { toast } from 'sonner';
import { Copy, Loader2, RefreshCw, Save, Trash2, Wand2 } from 'lucide-react';

type Aba = 'gerar' | 'leis' | 'resumos';

interface Registro {
  id: string;
  titulo: string;
  subtitulo: string | null;
  audio_url: string | null;
}

const AdminLeisCantadas = () => {
  const [aba, setAba] = useState<Aba>('gerar');

  // Gerador de prompt
  const [tipo, setTipo] = useState<TipoPrompt>('lei-seca');
  const [melodiaId, setMelodiaId] = useState<string>(MELODIAS[0].id);
  const [area, setArea] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [seed, setSeed] = useState(0);
  const prompt = montarPrompt({ tipo, melodiaId, area, conteudo, seed });

  // Cadastro
  const [form, setForm] = useState({
    destino: 'leis' as 'leis' | 'resumos',
    titulo: '', leiNome: '', numeroArtigo: '', areaCad: '', materia: '', letra: '', audioUrl: '', duracao: '',
  });
  const [salvando, setSalvando] = useState(false);

  const [leis, setLeis] = useState<Registro[]>([]);
  const [resumos, setResumos] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const [lc, rc] = await Promise.all([
      supabase.from('leis_cantadas').select('id, titulo, lei_nome, numero_artigo, audio_url').order('created_at', { ascending: false }),
      supabase.from('resumos_cantados').select('id, tema, area, materia, audio_url').order('created_at', { ascending: false }),
    ]);
    setLeis(((lc.data ?? []) as any[]).map((r) => ({
      id: r.id, titulo: r.titulo || r.numero_artigo || 'Sem título',
      subtitulo: [r.lei_nome, r.numero_artigo].filter(Boolean).join(' • ') || null, audio_url: r.audio_url,
    })));
    setResumos(((rc.data ?? []) as any[]).map((r) => ({
      id: r.id, titulo: r.tema || 'Sem tema',
      subtitulo: [r.area, r.materia].filter(Boolean).join(' • ') || null, audio_url: r.audio_url,
    })));
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.letra.trim() && !form.audioUrl.trim()) {
      toast.error('Informe a letra ou o link do áudio.');
      return;
    }
    setSalvando(true);
    const duracao = form.duracao ? Number(form.duracao) : null;
    const erro = form.destino === 'leis'
      ? (await supabase.from('leis_cantadas').insert({
          titulo: form.titulo || null, lei_nome: form.leiNome || null, numero_artigo: form.numeroArtigo || null,
          letra: form.letra || null, audio_url: form.audioUrl || null, duracao_seg: duracao,
        } as any)).error
      : (await supabase.from('resumos_cantados').insert({
          tema: form.titulo || null, area: form.areaCad || null, materia: form.materia || null,
          letra: form.letra || null, audio_url: form.audioUrl || null, duracao_seg: duracao,
        } as any)).error;
    setSalvando(false);
    if (erro) { toast.error(erro.message); return; }
    toast.success('Salvo com sucesso!');
    setForm({ ...form, titulo: '', leiNome: '', numeroArtigo: '', materia: '', letra: '', audioUrl: '', duracao: '' });
    carregar();
  };

  const excluir = async (tabela: 'leis_cantadas' | 'resumos_cantados', id: string) => {
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Removido.');
    carregar();
  };

  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm';

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(7rem + var(--sai-bottom, 0px))' }}>
      <PageHeader title="Leis Cantadas — Editar" subtitle="Gere prompts e publique faixas" />

      <div className="px-4 pt-4">
        <div className="flex gap-2 rounded-xl bg-secondary/50 p-1">
          {([['gerar', 'Gerar prompt'], ['leis', `Leis (${leis.length})`], ['resumos', `Resumos (${resumos.length})`]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setAba(k as Aba)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                aba === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {aba === 'gerar' && (
        <div className="px-4 pt-4 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-display font-bold text-foreground inline-flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" /> Gerador de prompt
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Tipo
                <select className={`${input} mt-1`} value={tipo} onChange={(e) => setTipo(e.target.value as TipoPrompt)}>
                  <option value="lei-seca">Lei Seca (artigo literal)</option>
                  <option value="compacto">Resumo storytelling (compacto)</option>
                  <option value="resumo-tema">Resumo de tema</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Melodia / estilo
                <select className={`${input} mt-1`} value={melodiaId} onChange={(e) => setMelodiaId(e.target.value)}>
                  {MELODIAS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-xs font-semibold text-muted-foreground">
              Área / matéria (usada na intro)
              <input className={`${input} mt-1`} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Direito Penal" />
            </label>

            <label className="block text-xs font-semibold text-muted-foreground">
              Conteúdo (texto do artigo ou resumo)
              <textarea className={`${input} mt-1 min-h-[140px]`} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Nova intro
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copiado!'); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar prompt
              </button>
            </div>

            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary/40 p-3 text-[11px] leading-relaxed text-foreground/90">
              {prompt}
            </pre>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-display font-bold text-foreground">Publicar faixa</h2>
            <label className="block text-xs font-semibold text-muted-foreground">
              Destino
              <select className={`${input} mt-1`} value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value as 'leis' | 'resumos' })}>
                <option value="leis">Leis Cantadas</option>
                <option value="resumos">Resumos Cantados</option>
              </select>
            </label>
            <input className={input} placeholder={form.destino === 'leis' ? 'Título' : 'Tema'} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            {form.destino === 'leis' ? (
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Lei / código" value={form.leiNome} onChange={(e) => setForm({ ...form, leiNome: e.target.value })} />
                <input className={input} placeholder="Artigo" value={form.numeroArtigo} onChange={(e) => setForm({ ...form, numeroArtigo: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Área" value={form.areaCad} onChange={(e) => setForm({ ...form, areaCad: e.target.value })} />
                <input className={input} placeholder="Matéria" value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} />
              </div>
            )}
            <textarea className={`${input} min-h-[120px]`} placeholder="Letra da música" value={form.letra} onChange={(e) => setForm({ ...form, letra: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <input className={`${input} col-span-2`} placeholder="URL do áudio (mp3)" value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />
              <input className={input} placeholder="Duração (s)" inputMode="numeric" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
            </div>
            <button
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
            </button>
          </section>
        </div>
      )}

      {aba !== 'gerar' && (
        <div className="px-4 pt-4 space-y-3">
          {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          {!loading && (aba === 'leis' ? leis : resumos).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">{r.titulo}</div>
                {r.subtitulo && <div className="text-[11px] text-muted-foreground truncate">{r.subtitulo}</div>}
                {!r.audio_url && <div className="text-[11px] text-destructive">sem áudio</div>}
              </div>
              <button
                onClick={() => excluir(aba === 'leis' ? 'leis_cantadas' : 'resumos_cantados', r.id)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                aria-label="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeisCantadas;
