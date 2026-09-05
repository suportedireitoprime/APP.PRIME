import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, CalendarClock, CheckCircle2, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useGoBack';
import {
  Tema,
  BancoPost,
  Config,
  Voz,
  PREVIEW_TEXTO_PADRAO,
  hojeStr,
} from '@/components/admin/blog/blogEdicaoTypes';
import { BlogEdicaoHero, TimelineSlot } from '@/components/admin/blog/BlogEdicaoHero';
import { BlogEdicaoDrawer } from '@/components/admin/blog/BlogEdicaoDrawer';
import { BlogEdicaoConfigSheet, ConfigSectionType } from '@/components/admin/blog/BlogEdicaoConfigSheet';
import { BlogEdicaoPostDialog } from '@/components/admin/blog/BlogEdicaoPostDialog';
import { BlogEdicaoTemaDialog } from '@/components/admin/blog/BlogEdicaoTemaDialog';

const PREVIEW_CACHE_KEY = 'blog_edicao_preview_cache_v1';
const USD_BRL = 5.50;

export default function AdminBlogEdicao() {
  const goBack = useGoBack();
  const [tab, setTab] = useState<'em_fila' | 'gerados'>('em_fila');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bancoPosts, setBancoPosts] = useState<BancoPost[]>([]);
  const [editingPost, setEditingPost] = useState<BancoPost | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);
  const [configSection, setConfigSection] = useState<ConfigSectionType>(null);
  const [running, setRunning] = useState(false);
  const [vozes, setVozes] = useState<Voz[]>([]);
  const [previewTexto, setPreviewTexto] = useState<string>(PREVIEW_TEXTO_PADRAO);
  const [previewVoz, setPreviewVoz] = useState<string>('Puck');
  const [previewGerando, setPreviewGerando] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(PREVIEW_CACHE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const [narrandoPostId, setNarrandoPostId] = useState<string | null>(null);
  const [narracaoProgresso, setNarracaoProgresso] = useState<Record<string, { done: number; total: number }>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // SEO & Título dinâmico do painel administrativo
  useEffect(() => {
    document.title = 'Gestão do Blog Edição | Vade Mecum PRIME Admin';
  }, []);

  const cacheKey = (voz: string) =>
    `${voz}::${(config?.narracao_estilo || '').slice(0, 40)}::${previewTexto.slice(0, 80)}`;

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('blog_edicao_temas').select('*').order('ordem', { ascending: true }),
      supabase.from('blog_edicao_config').select('*').limit(1).single(),
    ]);
    const temasRaw = (t as Tema[]) || [];
    const postIds = temasRaw.map((x) => x.post_id).filter(Boolean) as string[];
    let audiosByPost: Record<string, Partial<Tema>> = {};
    if (postIds.length) {
      const { data: posts } = await supabase
        .from('blog_edicao_posts')
        .select('id, audio_url, audio_voice, audio_duration_seconds, audio_cost_credits, imagem_url')
        .in('id', postIds);
      audiosByPost = Object.fromEntries((posts || []).map((p: any) => [p.id, p]));
    }
    setTemas(
      temasRaw.map((x) => (x.post_id && audiosByPost[x.post_id] ? { ...x, ...audiosByPost[x.post_id] } : x))
    );
    setConfig((c as unknown as Config) || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadBanco = async () => {
    setLoading(true);
    const { data } = await supabase.from('blog_edicao_posts').select('*').order('created_at', { ascending: false });
    if (data) setBancoPosts(data as BancoPost[]);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
        const base = env?.VITE_SUPABASE_URL;
        if (!base) throw new Error('VITE_SUPABASE_URL ausente');
        const anon = env?.VITE_SUPABASE_PUBLISHABLE_KEY;
        const r = await fetch(`${base}/functions/v1/narracao?fn=blog_preview&acao=vozes`, {
          headers: anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : undefined,
        });
        const j = await r.json();
        if (!cancelled && Array.isArray(j?.vozes)) setVozes(j.vozes as Voz[]);
      } catch (e) {
        console.warn('falha ao carregar vozes', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (config?.narracao_voz) setPreviewVoz(config.narracao_voz);
  }, [config?.narracao_voz]);

  const pendentes = useMemo(
    () => temas.filter((t) => ['pendente', 'agendado', 'gerando'].includes(t.status)),
    [temas]
  );

  const concluidos = useMemo(
    () =>
      temas
        .filter((t) => t.status === 'concluido')
        .sort((a, b) => new Date(b.concluido_em || 0).getTime() - new Date(a.concluido_em || 0).getTime()),
    [temas]
  );

  const filaHoje = useMemo(() => {
    if (!config) return [] as Array<Tema & { horario?: string }>;
    const n = config.posts_por_dia || 3;

    const buckets = new Map<string, Tema[]>();
    for (const p of pendentes) {
      if (!buckets.has(p.categoria)) buckets.set(p.categoria, []);
      buckets.get(p.categoria)!.push(p);
    }
    const cats = Array.from(buckets.keys());
    const seed = Number(hojeStr().replace(/-/g, ''));
    cats.sort((a, b) => {
      const ha = (seed * 9301 + a.charCodeAt(0) * 49297) % 233280;
      const hb = (seed * 9301 + b.charCodeAt(0) * 49297) % 233280;
      return ha - hb;
    });

    const escolhidos: Tema[] = [];
    let vazios = 0;
    while (escolhidos.length < n && vazios < cats.length) {
      vazios = 0;
      for (const c of cats) {
        const b = buckets.get(c)!;
        if (b.length === 0) {
          vazios++;
          continue;
        }
        escolhidos.push(b.shift()!);
        if (escolhidos.length >= n) break;
      }
    }

    const horarios = (config.horarios || []).slice(0, n);
    return escolhidos.map((t, i) => ({ ...t, horario: horarios[i] }));
  }, [config, pendentes]);

  const bibliotecaIds = useMemo(() => new Set(filaHoje.map((x) => x.id)), [filaHoje]);
  const biblioteca = useMemo(
    () => pendentes.filter((t) => !bibliotecaIds.has(t.id)),
    [pendentes, bibliotecaIds]
  );

  const filtered = useMemo(() => {
    if (tab === 'em_fila') return filaHoje;
    return concluidos;
  }, [tab, filaHoje, concluidos]);

  const proximaGeracao = useMemo(() => {
    if (!config) return { horario: null as string | null, item: null as Tema | null };
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const alvos = (config.horarios || [])
      .map((h, idx) => {
        const [hh, mm] = h.split(':').map(Number);
        return { h, mins: hh * 60 + (mm || 0), idx };
      })
      .sort((a, b) => a.mins - b.mins);
    const nxt = alvos.find((a) => a.mins > mins) || alvos[0] || null;
    const item = nxt ? filaHoje[nxt.idx] || filaHoje[0] : null;
    return { horario: nxt?.h || null, item };
  }, [config, filaHoje]);

  const gerarTemas = async () => {
    setRunning(true);
    toast.loading('Gerando 30 temas com IA...', { id: 'gerar-temas' });
    const { error } = await supabase.functions.invoke('blog-edicao-gerar-temas', {
      body: { quantidade: 30 },
    });
    if (error) toast.error('Falha: ' + error.message, { id: 'gerar-temas' });
    else {
      toast.success('Temas gerados!', { id: 'gerar-temas' });
      await load();
    }
    setRunning(false);
  };

  const rodarAgora = async (tema_id?: string) => {
    setRunning(true);
    toast.loading(tema_id ? 'Gerando artigo...' : 'Gerando próximo artigo...', { id: 'runner' });
    const { data, error } = await supabase.functions.invoke('blog-edicao-runner', {
      body: tema_id ? { tema_id } : {},
    });
    if (error) toast.error('Falha: ' + error.message, { id: 'runner' });
    else {
      const msg = data?.post_id ? 'Artigo publicado!' : data?.message || 'Nada a fazer';
      toast.success(msg, { id: 'runner' });
      await load();
    }
    setRunning(false);
  };

  const regerarCapa = async (post_id: string) => {
    setRunning(true);
    toast.loading('Regerando capa...', { id: 'cover' });
    const { error } = await supabase.functions.invoke('blog-edicao-runner', {
      body: { regenerate_cover_post_id: post_id },
    });
    if (error) toast.error('Falha: ' + error.message, { id: 'cover' });
    else {
      toast.success('Capa regerada!', { id: 'cover' });
      await load();
    }
    setRunning(false);
  };

  const regerarUltimasCapas = async (quantidade = 3) => {
    const { data: ultimos } = await supabase
      .from('blog_edicao_posts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(quantidade);
    const ids = (ultimos || []).map((p: any) => p.id);
    if (!ids.length) {
      toast.error('Nenhum post encontrado');
      return;
    }
    setRunning(true);
    let ok = 0;
    for (const [i, id] of ids.entries()) {
      toast.loading(`Regerando capa ${i + 1} de ${ids.length}...`, { id: 'covers' });
      const { error } = await supabase.functions.invoke('blog-edicao-runner', {
        body: { regenerate_cover_post_id: id },
      });
      if (!error) ok++;
    }
    if (ok === ids.length) toast.success(`${ok} capas regeradas!`, { id: 'covers' });
    else toast.error(`${ok}/${ids.length} capas regeradas`, { id: 'covers' });
    await load();
    setRunning(false);
  };

  const removerTema = async (id: string) => {
    if (!confirm('Remover este tema?')) return;
    await supabase.from('blog_edicao_temas').delete().eq('id', id);
    await load();
  };

  const salvarPostEditado = async () => {
    if (!editingPost) return;
    setSavingPost(true);
    const isNew = !editingPost.id;
    const payload: Record<string, unknown> = {
      titulo: editingPost.titulo,
      conteudo_md: editingPost.conteudo_md,
      imagem_url: editingPost.imagem_url,
      categoria: editingPost.categoria,
    };
    if (editingPost.imagem_path !== undefined) payload.imagem_path = editingPost.imagem_path;

    let error: { message: string } | null = null;
    if (isNew) {
      (payload as Record<string, unknown>).publicado = editingPost.publicado;
      const res = await supabase.from('blog_edicao_posts').insert(payload as any);
      error = res.error;
    } else {
      const res = await supabase.from('blog_edicao_posts').update(payload as any).eq('id', editingPost.id);
      error = res.error;
    }
    setSavingPost(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? 'Artigo criado!' : 'Artigo salvo com sucesso!');
    setEditingPost(null);
    loadBanco();
  };

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingPost) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop();
    const fileName = `${editingPost.id}-${Date.now()}.${ext}`;
    toast.loading('Enviando imagem...', { id: 'upload-capa' });
    try {
      const { error: uploadError } = await supabase.storage.from('blog-capas').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('blog-capas').getPublicUrl(fileName);
      setEditingPost({ ...editingPost, imagem_url: publicUrl, imagem_path: fileName });
      toast.success('Imagem carregada!', { id: 'upload-capa' });
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message, { id: 'upload-capa' });
    }
  };

  const salvarConfig = async () => {
    if (!config) return;
    const { error } = await supabase
      .from('blog_edicao_config')
      .update({
        posts_por_dia: config.posts_por_dia,
        horarios: config.horarios,
        intervalo_minutos: config.intervalo_minutos,
        modo_publicacao: config.modo_publicacao,
        tom: config.tom,
        tamanho_alvo: config.tamanho_alvo,
        estilo_capa_prompt: config.estilo_capa_prompt,
        push_ativo: config.push_ativo,
        push_titulo_template: config.push_titulo_template,
        push_corpo_template: config.push_corpo_template,
        push_audiencia: config.push_audiencia as any,
        push_quiet_start: config.push_quiet_start,
        push_quiet_end: config.push_quiet_end,
        narracao_voz: config.narracao_voz,
        narracao_modelo: config.narracao_modelo,
        narracao_estilo: config.narracao_estilo,
      })
      .eq('id', config.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Config salva');
      setConfigOpen(false);
    }
  };

  const gerarPreview = async (voz: string) => {
    if (!previewTexto.trim()) {
      toast.error('Escreva um trecho de exemplo');
      return;
    }
    const key = cacheKey(voz);
    if (previewAudio[key]) {
      togglePlay(previewAudio[key]);
      return;
    }
    setPreviewGerando(voz);
    try {
      const { data, error } = await supabase.functions.invoke('narracao', {
        body: { fn: 'blog_preview', texto: previewTexto, voz, estilo: config?.narracao_estilo },
      });
      if (error || !(data as any)?.audio_data_url) throw new Error(error?.message || 'sem áudio');
      const url = (data as any).audio_data_url as string;
      setPreviewAudio((prev) => {
        const next = { ...prev, [key]: url };
        try {
          localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(next));
        } catch {
          /* quota */
        }
        return next;
      });
      const a = new Audio(url);
      a.play().catch(() => {});
    } catch (e: any) {
      toast.error('Falha preview: ' + (e?.message || 'erro'));
    } finally {
      setPreviewGerando(null);
    }
  };

  const narrarArtigo = async (post_id: string) => {
    setNarrandoPostId(post_id);
    setNarracaoProgresso((p) => ({ ...p, [post_id]: { done: 0, total: 0 } }));
    toast.loading('Iniciando narração...', { id: 'narr-' + post_id });
    try {
      const base = (import.meta as any).env?.VITE_SUPABASE_URL as string;
      const anon = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || anon;
      const resp = await fetch(`${base}/functions/v1/narracao?fn=blog_artigo&stream=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          apikey: anon,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id }),
      });
      if (!resp.ok || !resp.body) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${txt.slice(0, 200)}`);
      }
      const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = '';
      let finalResult: any = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const events = buf.split('\n\n');
        buf = events.pop() || '';
        for (const evt of events) {
          const line = evt.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.type === 'progress') {
              setNarracaoProgresso((p) => ({
                ...p,
                [post_id]: { done: payload.done, total: payload.total },
              }));
              const pct = payload.total ? Math.round((payload.done / payload.total) * 100) : 0;
              toast.loading(`Narrando... ${pct}% (${payload.done}/${payload.total})`, { id: 'narr-' + post_id });
            } else if (payload.type === 'done') {
              finalResult = payload.result;
            } else if (payload.type === 'error') {
              throw new Error(payload.error || 'erro no stream');
            }
          } catch (err) {
            if (err instanceof Error && err.message?.startsWith('erro')) throw err;
          }
        }
      }
      if (!finalResult) throw new Error('stream encerrou sem resultado');
      toast.success(
        `Narração pronta · ${Math.round((finalResult.duration_seconds || 0) / 60)}min · ${finalResult.cost_credits} cr.`,
        { id: 'narr-' + post_id }
      );
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e?.message || 'erro'), { id: 'narr-' + post_id });
    } finally {
      setNarrandoPostId(null);
      setNarracaoProgresso((p) => {
        const next = { ...p };
        delete next[post_id];
        return next;
      });
    }
  };

  const togglePlay = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
    audioRef.current.onended = () => setPlayingUrl(null);
    setPlayingUrl(url);
  };

  const estimativa = useMemo(() => {
    const words = config?.tamanho_alvo || 1200;
    const chars = words * 5.5;
    const durationMin = Math.max(1, Math.round(chars / 900));
    const durationSec = durationMin * 60;
    const audioTokens = durationSec * 32;
    const custoUSD = (audioTokens / 1_000_000) * 10;
    const custoBRL = Number((custoUSD * USD_BRL).toFixed(2));
    return { chars: Math.round(chars), durationMin, custoBRL, custoUSD: Number(custoUSD.toFixed(3)) };
  }, [config?.tamanho_alvo]);

  const hojeFormatado = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }, []);

  const timelineSlots = useMemo<TimelineSlot[]>(() => {
    const hs = (config?.horarios || []).slice(0, config?.posts_por_dia || 3);
    const hojeYMD = hojeStr();
    const concluidosHoje = concluidos.filter((c) => (c.concluido_em || '').startsWith(hojeYMD));
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return hs.map((h, i) => {
      const [hh, mm] = h.split(':').map(Number);
      const slotMin = hh * 60 + (mm || 0);
      const enviado = concluidosHoje.length > i;
      const atrasado = !enviado && nowMin > slotMin + 30;
      return {
        horario: h,
        label: `${String(hh).padStart(2, '0')}h`,
        enviado,
        atrasado,
        isNext: proximaGeracao.horario === h,
      };
    });
  }, [config, concluidos, proximaGeracao.horario]);

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader
        title="Blog Edição"
        onBack={() => goBack()}
        rightAction={
          <button
            onClick={() => setConfigOpen(true)}
            aria-label="Configurações"
            className="w-11 h-11 rounded-full bg-muted flex items-center justify-center"
          >
            <Settings className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        <BlogEdicaoHero
          hojeFormatado={hojeFormatado}
          timelineSlots={timelineSlots}
          proximaGeracao={proximaGeracao}
        />

        {/* Menu Principal — Em fila e Gerados */}
        <div className="space-y-2 mt-4">
          {(
            [
              {
                id: 'em_fila',
                label: 'Em fila',
                count: filaHoje.length,
                icon: CalendarClock,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                id: 'gerados',
                label: 'Gerados',
                count: concluidos.length,
                icon: CheckCircle2,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setIsDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg}`}>
                    <Icon className={`w-5 h-5 ${t.color}`} />
                  </div>
                  <span className="font-semibold text-foreground">{t.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">{t.count}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </button>
            );
          })}
        </div>

        <BlogEdicaoDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          tab={tab}
          filtered={filtered}
          loading={loading}
          running={running}
          narrandoPostId={narrandoPostId}
          narracaoProgresso={narracaoProgresso}
          playingUrl={playingUrl}
          togglePlay={togglePlay}
          rodarAgora={rodarAgora}
          regerarCapa={regerarCapa}
          narrarArtigo={narrarArtigo}
          removerTema={removerTema}
          setEditingTema={setEditingTema}
        />
      </div>

      <BlogEdicaoConfigSheet
        configOpen={configOpen}
        setConfigOpen={setConfigOpen}
        config={config}
        setConfig={setConfig}
        configSection={configSection}
        setConfigSection={setConfigSection}
        running={running}
        gerarTemas={gerarTemas}
        rodarAgora={rodarAgora}
        regerarUltimasCapas={regerarUltimasCapas}
        bibliotecaCount={biblioteca.length}
        filaHojeCount={filaHoje.length}
        concluidosCount={concluidos.length}
        salvarConfig={salvarConfig}
        previewTexto={previewTexto}
        setPreviewTexto={setPreviewTexto}
        estimativa={estimativa}
        vozes={vozes}
        previewGerando={previewGerando}
        gerarPreview={gerarPreview}
        previewAudio={previewAudio}
        cacheKey={cacheKey}
        playingUrl={playingUrl}
        togglePlay={togglePlay}
      />

      <BlogEdicaoPostDialog
        editingPost={editingPost}
        setEditingPost={setEditingPost}
        salvarPostEditado={salvarPostEditado}
        savingPost={savingPost}
        handleCapaUpload={handleCapaUpload}
        regerarCapa={regerarCapa}
      />

      <BlogEdicaoTemaDialog
        editingTema={editingTema}
        setEditingTema={setEditingTema}
        onTemaUpdated={(updated) => {
          setTemas((prev) =>
            prev.map((t) =>
              t.id === updated.id
                ? {
                    ...t,
                    titulo_sugerido: updated.titulo_sugerido,
                    categoria: updated.categoria,
                    resumo_briefing: updated.resumo_briefing,
                  }
                : t
            )
          );
        }}
      />
    </div>
  );
}
