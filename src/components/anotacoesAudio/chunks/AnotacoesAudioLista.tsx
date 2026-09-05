import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Mic,
  Trash2,
  Loader2,
  Play,
  Pause,
  FileText,
  Sparkles,
  Download,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatHms } from '@/contexts/RecordingContext';
import { baixarBlob } from '@/lib/nativo';
import { Recording } from './anotacoesAudioConstants';
import { AnotacoesAudioChatModal } from './AnotacoesAudioChatModal';

interface AnotacoesAudioListaProps {
  soPendentes?: boolean;
}

export const AnotacoesAudioLista: React.FC<AnotacoesAudioListaProps> = ({ soPendentes = false }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Chat Interativo
  const [chatRec, setChatRec] = useState<Recording | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('audio_recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => (r.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (soPendentes) list = list.filter((r) => r.transcript && !r.summary);
    if (filterTag) list = list.filter((r) => (r.tags || []).includes(filterTag));
    return list;
  }, [rows, soPendentes, filterTag]);

  const signedUrl = async (r: Recording): Promise<string | null> => {
    if (r.local_path) return r.local_path;
    if (r.file_path) {
      const { data } = await supabase.storage.from('aulas-audio').createSignedUrl(r.file_path, 3600);
      return data?.signedUrl ?? null;
    }
    return null;
  };

  const play = async (r: Recording) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing === r.id) {
      setPlaying(null);
      return;
    }
    const url = await signedUrl(r);
    if (!url) return toast.error('Áudio indisponível.');
    const a = new Audio(url);
    a.onended = () => setPlaying(null);
    a.play().catch(() => toast.error('Falha ao tocar.'));
    audioRef.current = a;
    setPlaying(r.id);
  };

  const remove = async (r: Recording) => {
    if (!confirm('Excluir esta gravação?')) return;
    const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    if (online) {
      if (r.file_path) {
        try {
          await supabase.storage.from('aulas-audio').remove([r.file_path]);
        } catch {}
      }
      const { error } = await supabase.from('audio_recordings').delete().eq('id', r.id);
      if (error) {
        try {
          const { syncQueue } = await import('@/services/syncQueue');
          await syncQueue.enqueue({ kind: 'table.delete', table: 'audio_recordings', match: { id: r.id } });
        } catch {}
      }
    } else {
      try {
        const { syncQueue } = await import('@/services/syncQueue');
        await syncQueue.enqueue({ kind: 'table.delete', table: 'audio_recordings', match: { id: r.id } });
        toast.message('Exclusão enfileirada — sincroniza quando voltar a internet.');
      } catch {}
    }
    load();
  };

  const rename = async (r: Recording, newTitle: string) => {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    if (online) {
      const { error } = await supabase.from('audio_recordings').update({ title: newTitle }).eq('id', r.id);
      if (error) {
        try {
          const { syncQueue } = await import('@/services/syncQueue');
          await syncQueue.enqueue({
            kind: 'table.update',
            table: 'audio_recordings',
            match: { id: r.id },
            values: { title: newTitle },
          });
        } catch {}
      }
    } else {
      try {
        const { syncQueue } = await import('@/services/syncQueue');
        await syncQueue.enqueue({
          kind: 'table.update',
          table: 'audio_recordings',
          match: { id: r.id },
          values: { title: newTitle },
        });
        toast.message('Novo nome salvo localmente — sincroniza quando voltar a internet.');
      } catch {}
    }
    load();
  };

  const transcribe = async (r: Recording) => {
    setWorking(r.id);
    try {
      const payload: any = { language: 'pt' };
      if (r.file_path) payload.filePath = r.file_path;
      else if (r.local_path) {
        const [meta, b64] = r.local_path.split(',');
        payload.audioBase64 = b64;
        payload.mimeType = /data:([^;]+);/.exec(meta)?.[1] ?? 'audio/aac';
      } else return toast.error('Sem áudio pra transcrever.');
      const { data, error } = await supabase.functions.invoke('transcrever-audio', { body: payload });
      if (error) throw error;
      const text = (data as any)?.text ?? '';
      await supabase.from('audio_recordings').update({ transcript: text }).eq('id', r.id);
      toast.success('Transcrição pronta!');
      load();
    } catch (e: any) {
      toast.error('Falha: ' + (e?.message ?? 'erro'));
    } finally {
      setWorking(null);
    }
  };

  const summarize = async (r: Recording) => {
    if (!r.transcript) return toast.error('Transcreva primeiro.');
    setWorking(r.id);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-aula', {
        body: { transcript: r.transcript, title: r.title },
      });
      if (error) throw error;
      const summary = (data as any)?.summary ?? {};
      await supabase.from('audio_recordings').update({ summary }).eq('id', r.id);
      toast.success('Resumo gerado!');
      load();
    } catch (e: any) {
      toast.error('Falha: ' + (e?.message ?? 'erro'));
    } finally {
      setWorking(null);
    }
  };

  const download = async (r: Recording, kind: 'txt' | 'md') => {
    let content = '';
    let filename = '';
    if (kind === 'txt') {
      content = r.transcript ?? '';
      filename = `${r.title}.txt`;
    } else {
      const s = r.summary || {};
      content = `# ${s.titulo || r.title}\n\n${s.resumo || ''}\n\n## Tópicos\n${(s.topicos || [])
        .map((t: string) => `- ${t}`)
        .join('\n')}\n\n## Conceitos\n${(s.conceitos || [])
        .map((c: any) => `- **${c.termo}**: ${c.definicao}`)
        .join('\n')}\n\n## Perguntas de revisão\n${(s.duvidas || [])
        .map((d: string) => `- ${d}`)
        .join('\n')}\n`;
      filename = `${r.title} — resumo.md`;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    await baixarBlob(blob, filename, { titulo: filename });
  };

  const openChat = (r: Recording) => {
    if (!r.transcript) return toast.error('Transcreva a aula primeiro para usar o chat.');
    setChatRec(r);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnotacoesAudioChatModal chatRec={chatRec} onClose={() => setChatRec(null)} />

      {soPendentes && (
        <p className="mb-3 text-sm text-muted-foreground">
          Escolha uma gravação com transcrição pronta e gere o resumo.
        </p>
      )}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              filterTag === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            Todas
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterTag(t)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filterTag === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mic className="mx-auto mb-3 h-10 w-10 opacity-40" />
          {soPendentes ? 'Nenhuma gravação aguardando resumo.' : 'Nenhuma gravação ainda.'}
        </div>
      ) : (
        <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filtered.map((r) => {
            const busy = working === r.id;
            const s = r.summary || null;
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Input
                      defaultValue={r.title}
                      onBlur={(e) => e.target.value !== r.title && rename(r, e.target.value)}
                      className="border-none px-0 h-auto text-base font-semibold bg-transparent focus-visible:ring-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatHms(r.duration_ms)} · {new Date(r.created_at).toLocaleString('pt-BR')}
                      {r.source === 'whatsapp' && (
                        <>
                          {' '}
                          · <span className="text-emerald-500">WhatsApp</span>
                        </>
                      )}
                      {r.source === 'celular' && (
                        <>
                          {' '}
                          · <span className="text-primary">Importado</span>
                        </>
                      )}
                    </p>
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.transcript && !s && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                        {r.transcript}
                      </p>
                    )}
                    {s && (
                      <div className="mt-3 space-y-2">
                        {s.titulo && <h4 className="text-sm font-semibold">{s.titulo}</h4>}
                        {s.resumo && <p className="text-sm text-muted-foreground">{s.resumo}</p>}
                        {Array.isArray(s.topicos) && s.topicos.length > 0 && (
                          <ul className="ml-4 list-disc text-sm text-muted-foreground">
                            {s.topicos.slice(0, 5).map((t: string, i: number) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => play(r)}>
                    {playing === r.id ? (
                      <Pause className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <Play className="mr-1 h-3.5 w-3.5" />
                    )}
                    {playing === r.id ? 'Pausar' : 'Ouvir'}
                  </Button>
                  {!r.transcript && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => transcribe(r)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="mr-1 h-3.5 w-3.5" />
                      )}
                      Transcrever
                    </Button>
                  )}
                  {r.transcript && !s && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => summarize(r)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                      )}
                      Gerar resumo
                    </Button>
                  )}
                  {r.transcript && (
                    <Button size="sm" variant="outline" onClick={() => openChat(r)}>
                      <MessageCircle className="mr-1 h-3.5 w-3.5 text-primary" /> Pergunte à Aula
                    </Button>
                  )}
                  {r.transcript && (
                    <Button size="sm" variant="ghost" onClick={() => download(r, 'txt')}>
                      <Download className="mr-1 h-3.5 w-3.5" /> .txt
                    </Button>
                  )}
                  {s && (
                    <Button size="sm" variant="ghost" onClick={() => download(r, 'md')}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Resumo .md
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};
