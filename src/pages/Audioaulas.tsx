import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Headphones, Loader2, Play, Pause, ChevronRight, Clock, Download, Check } from 'lucide-react';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { toast } from 'sonner';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  fonteDeAudio,
  suportaAudioOffline,
  assinarAudioOffline,
} from '@/lib/nativo/audioOffline';

interface Aula {
  id: number;
  area: string;
  tema: string | null;
  sequencia: number | null;
  titulo: string;
  descricao: string | null;
  url_audio: string | null;
}

function Player({ id, url, titulo, subtitulo }: { id: string; url: string; titulo: string; subtitulo?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [baixado, setBaixado] = useState(false);
  const [baixando, setBaixando] = useState(false);

  // Mantém a tela acesa enquanto a aula toca.
  useEffect(() => {
    void telaAcesa(`audioaula-${id}`, tocando);
    return () => { void telaAcesa(`audioaula-${id}`, false); };
  }, [tocando, id]);

  useEffect(() => {
    const checar = () => { void estaBaixado(id).then(setBaixado); };
    checar();
    return assinarAudioOffline(checar);
  }, [id]);

  const alternarDownload = async () => {
    if (baixado) {
      await removerAudioOffline(id);
      toast.success('Download removido');
      return;
    }
    setBaixando(true);
    const ok = await baixarAudioOffline({ id, url, titulo, subtitulo, categoria: 'audioaulas' });
    setBaixando(false);
    toast[ok ? 'success' : 'error'](ok ? 'Aula disponível offline' : 'Não foi possível baixar');
  };

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary/50 border border-border/60 px-3 py-2">
      <button
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) {
            // Prefere o arquivo salvo no aparelho, se houver.
            void fonteDeAudio(id, url).then((src) => {
              if (a.src !== src) a.src = src;
              a.play();
            });
            setTocando(true);
            registrarMidia({
              titulo,
              subtitulo,
              album: 'Audioaulas',
              audio: a,
              onStop: () => { a.pause(); setTocando(false); },
            });
          } else { a.pause(); setTocando(false); }
        }}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
        aria-label={tocando ? 'Pausar' : 'Tocar'}
      >
        {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      {suportaAudioOffline() && (
        <button
          onClick={() => void alternarDownload()}
          disabled={baixando}
          aria-label={baixado ? 'Remover download' : 'Baixar aula'}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-border/60 disabled:opacity-60 ${
            baixado ? 'text-emerald-400' : 'text-muted-foreground'
          }`}
        >
          {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : baixado ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </button>
      )}
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${progresso}%` }} />
      </div>
      <audio
        ref={ref}
        src={url}
        preload="none"
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgresso(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onEnded={(e) => { setTocando(false); setProgresso(0); clearMediaSession(e.currentTarget); }}
        onPause={() => setTocando(false)}
        onPlay={() => setTocando(true)}
      />
    </div>
  );
}

const Audioaulas = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const areaAtual = area ? decodeURIComponent(area) : null;

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('audioaulas_acervo')
        .select('id, area, tema, sequencia, titulo, descricao, url_audio')
        .order('area', { ascending: true })
        .order('sequencia', { ascending: true });
      if (!ativo) return;
      setAulas((data ?? []) as Aula[]);
      setLoading(false);
    })();
    return () => { ativo = false; };
  }, []);

  const areas = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aulas) {
      const nome = a.area || 'Geral';
      map.set(nome, (map.get(nome) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [aulas]);

  const temasDaArea = useMemo(() => {
    if (!areaAtual) return [] as [string, Aula[]][];
    const map = new Map<string, Aula[]>();
    for (const a of aulas) {
      if ((a.area || 'Geral') !== areaAtual) continue;
      const tema = a.tema || 'Aulas';
      map.set(tema, [...(map.get(tema) ?? []), a]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [aulas, areaAtual]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Audioaulas" subtitle="Aprenda ouvindo" onBack={() => navigate("/")} />
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (areaAtual) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <PageHeader title={areaAtual} subtitle="Audioaulas" onBack={() => navigate('/audioaulas')} />
        <div className="px-4 pt-4 space-y-5">
          {temasDaArea.length === 0 && (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Aulas em breve
            </p>
          )}
          {temasDaArea.map(([tema, lista]) => (
            <div key={tema} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-bold text-foreground">{tema}</h2>
              <div className="mt-3 space-y-3">
                {lista.map((a, i) => (
                  <div key={a.id} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {a.sequencia ?? i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">{a.titulo}</div>
                        {a.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.descricao}</p>}
                      </div>
                    </div>
                    {a.url_audio
                      ? <Player id={`audioaula-${a.id}`} url={a.url_audio} titulo={a.titulo} subtitulo={a.tema || a.area} />
                      : <p className="mt-2 text-[11px] text-muted-foreground">Áudio em breve</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Audioaulas" subtitle="Aprenda ouvindo, por área do Direito" onBack={() => navigate("/")} />
      <div className="px-4 pt-4 space-y-3">
        {areas.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
          </div>
        )}
        {areas.map(([nome, total]) => (
          <button
            key={nome}
            onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
            className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left hover:bg-secondary/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{nome}</div>
              <div className="text-[11px] text-muted-foreground">{total} aulas</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Audioaulas;
