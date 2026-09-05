import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Upload, Tag as TagIcon, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TAG_SUGESTOES, WHATSAPP_FILE_HINT } from './anotacoesAudioConstants';

interface AnotacoesAudioImportarProps {
  source: 'celular' | 'whatsapp';
  onDone: () => void;
  initialFile?: File | null;
  onInitialConsumed?: () => void;
}

export const AnotacoesAudioImportar: React.FC<AnotacoesAudioImportarProps> = ({
  source,
  onDone,
  initialFile,
  onInitialConsumed,
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [autoResumo, setAutoResumo] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isWA = source === 'whatsapp';

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|wav|ogg|opus|aac)$/i.test(f.name)) {
      return toast.error('Selecione um arquivo de áudio.');
    }
    if (f.size > 20 * 1024 * 1024) return toast.error('Máximo 20 MB.');
    setFile(f);
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, '');
      if (WHATSAPP_FILE_HINT.test(base)) {
        setTitle(`Áudio WhatsApp — ${new Date().toLocaleDateString('pt-BR')}`);
      } else {
        setTitle(base);
      }
    }
  };

  useEffect(() => {
    if (initialFile) {
      onPick(initialFile);
      onInitialConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const addTag = (t: string) => {
    const clean = t.trim();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const enviar = async () => {
    if (!user) return toast.error('Faça login primeiro.');
    if (!file) return toast.error('Escolha um áudio.');
    setBusy(true);
    try {
      const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
      const path = `${user.id}/import-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from('aulas-audio')
        .upload(path, file, { upsert: false, contentType: file.type || 'audio/mpeg' });
      if (up.error) throw up.error;

      const { data: inserted, error: insErr } = await supabase
        .from('audio_recordings')
        .insert({
          user_id: user.id,
          title: title || file.name,
          duration_ms: 0,
          file_path: path,
          mode: 'import',
          source,
          tags,
          status: 'ready',
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      toast.success('Áudio enviado! Transcrevendo…');
      const t0 = await supabase.functions.invoke('transcrever-audio', {
        body: { filePath: path, language: 'pt' },
      });
      if (t0.error) throw t0.error;
      const text = (t0.data as any)?.text ?? '';
      await supabase.from('audio_recordings').update({ transcript: text }).eq('id', inserted!.id);

      if (autoResumo && text) {
        toast.success('Transcrição pronta. Gerando resumo…');
        const r0 = await supabase.functions.invoke('gerar-resumo-aula', {
          body: { transcript: text, title: title || file.name },
        });
        if (!r0.error) {
          await supabase
            .from('audio_recordings')
            .update({ summary: (r0.data as any)?.summary ?? {} })
            .eq('id', inserted!.id);
        }
      }
      toast.success('Tudo pronto!');
      onDone();
    } catch (e: any) {
      toast.error('Falha: ' + (e?.message ?? 'erro'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {isWA && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm">
          <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-500" /> Como trazer do WhatsApp
          </p>
          <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
            <li>Abra a conversa e localize o áudio.</li>
            <li>Segure o áudio → toque em <b>Compartilhar</b> (⋮ ou ↗️).</li>
            <li>Escolha <b>Direito Prime</b> na lista de aplicativos.</li>
            <li>O áudio abre aqui pronto pra transcrever.</li>
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Se não vir o Direito Prime, use o botão abaixo pra escolher o arquivo manualmente (no
            iPhone, salve o áudio em <i>Arquivos</i> antes).
          </p>
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        {file ? (
          <>
            <p className="font-semibold text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">Toque pra escolher o áudio</p>
            <p className="text-xs text-muted-foreground mt-1">
              MP3, M4A, WAV, OGG, AAC · até 20 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.opus,.m4a,.mp3,.wav,.ogg,.aac"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Título
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Aula de Penal — 21/07"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <TagIcon className="w-3 h-3" /> Tags
        </label>
        <div className="mt-1 flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Adicionar tag e Enter"
          />
          <Button variant="outline" onClick={() => addTag(tagInput)}>
            Adicionar
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
              >
                {t}
                <button type="button" onClick={() => removeTag(t)} aria-label="remover">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">Sugestões:</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {TAG_SUGESTOES.filter((t) => !tags.includes(t)).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="px-2.5 py-1 rounded-full text-xs border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoResumo}
          onChange={(e) => setAutoResumo(e.target.checked)}
          className="accent-primary"
        />
        Gerar resumo automaticamente após a transcrição
      </label>

      <Button className="w-full h-12" onClick={enviar} disabled={!file || busy}>
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        {busy ? 'Enviando…' : 'Enviar e transcrever'}
      </Button>
    </div>
  );
};
