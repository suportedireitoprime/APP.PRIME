import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Play, Pause, Loader2, Star, FileText, Search, AlertCircle, Sparkles, Copy, SkipBack, SkipForward,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useGoBack';
import { copiarTexto } from '@/lib/nativo';
import {
  listarMarcadores, listarMidias, obterAula, obterTranscricao, transcreverAula, urlAssinada,
} from '@/lib/modoAula/api';
import { formatarHms } from '@/lib/modoAula/gravacao';
import type { Aula, AulaMarcador, AulaMidia, AulaTranscricao } from '@/lib/modoAula/types';

interface Trecho {
  url: string;
  inicio: number;   // segundo global em que este trecho começa
  duracao: number;
}

export default function ModoAulaAula() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const goBack = useGoBack();

  const [aula, setAula] = useState<Aula | null>(null);
  const [midias, setMidias] = useState<AulaMidia[]>([]);
  const [marcadores, setMarcadores] = useState<AulaMarcador[]>([]);
  const [transcricao, setTranscricao] = useState<AulaTranscricao | null>(null);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [transcrevendo, setTranscrevendo] = useState(false);
  const [progresso, setProgresso] = useState<{ feitos: number; total: number } | null>(null);

  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0); // segundo global
  const [indice, setIndice] = useState(0);
  const [busca, setBusca] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoRef = useRef(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const [a, m, mk, t] = await Promise.all([
        obterAula(id), listarMidias(id, 'audio'), listarMarcadores(id), obterTranscricao(id),
      ]);
      setAula(a);
      setMidias(m);
      setMarcadores(mk);
      setTranscricao(t);

      // Monta a playlist com offsets acumulados para poder navegar pelo tempo global.
      let acumulado = 0;
      const lista: Trecho[] = [];
      for (const midia of m) {
        if (!midia.storage_path) continue;
        const url = await urlAssinada(midia.storage_path);
        if (!url) continue;
        const duracao = midia.duracao_seg ?? 0;
        lista.push({ url, inicio: acumulado, duracao });
        acumulado += duracao;
      }
      setTrechos(lista);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao carregar a aula.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { void carregar(); }, [carregar]);

  const iniciarTranscricao = useCallback(async () => {
    if (!id || transcrevendo) return;
    setTranscrevendo(true);
    setProgresso({ feitos: 0, total: 0 });
    try {
      const t = await transcreverAula(id, (feitos, total) => setProgresso({ feitos, total }));
      setTranscricao(t);
      setAula((prev) => (prev ? { ...prev, status: 'transcrita', erro: null } : prev));
      toast.success('Transcrição concluída.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha na transcrição.';
      setAula((prev) => (prev ? { ...prev, status: 'erro', erro: msg } : prev));
      toast.error(msg);
    } finally {
      setTranscrevendo(false);
      setProgresso(null);
    }
  }, [id, transcrevendo]);

  // Dispara automaticamente quando vem da gravação (?transcrever=1)
  useEffect(() => {
    if (autoRef.current || carregando || !aula) return;
    if (params.get('transcrever') !== '1') return;
    autoRef.current = true;
    params.delete('transcrever');
    setParams(params, { replace: true });
    if (!transcricao) void iniciarTranscricao();
  }, [carregando, aula, transcricao, params, setParams, iniciarTranscricao]);

  // ── Player ──────────────────────────────────────────────
  const duracaoTotal = useMemo(
    () => trechos.reduce((s, t) => s + t.duracao, 0) || aula?.duracao_seg || 0,
    [trechos, aula],
  );

  const irPara = useCallback((segundoGlobal: number) => {
    if (trechos.length === 0) return;
    const alvo = Math.max(0, Math.min(segundoGlobal, Math.max(0, duracaoTotal - 1)));
    let idx = trechos.findIndex((t) => alvo >= t.inicio && alvo < t.inicio + t.duracao);
    if (idx < 0) idx = trechos.length - 1;
    const offset = Math.max(0, alvo - trechos[idx].inicio);

    setIndice(idx);
    setPosicao(alvo);

    const el = audioRef.current;
    if (!el) return;
    const mesmoTrecho = el.src === trechos[idx].url;
    if (!mesmoTrecho) el.src = trechos[idx].url;
    const aplicar = () => { el.currentTime = offset; void el.play().then(() => setTocando(true)).catch(() => {}); };
    if (mesmoTrecho && el.readyState >= 1) aplicar();
    else el.addEventListener('loadedmetadata', aplicar, { once: true });
  }, [trechos, duracaoTotal]);

  const alternarPlay = () => {
    const el = audioRef.current;
    if (!el || trechos.length === 0) return;
    if (tocando) { el.pause(); setTocando(false); return; }
    if (!el.src) { irPara(posicao); return; }
    void el.play().then(() => setTocando(true)).catch(() => toast.error('Não foi possível reproduzir o áudio.'));
  };

  const onTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;
    setPosicao((trechos[indice]?.inicio ?? 0) + el.currentTime);
  };

  const onEnded = () => {
    if (indice < trechos.length - 1) irPara(trechos[indice + 1].inicio);
    else setTocando(false);
  };

  const falas = useMemo(() => {
    const lista = transcricao?.segmentos ?? [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;
    return lista.filter((f) => f.fala.toLowerCase().includes(termo));
  }, [transcricao, busca]);

  const falaAtiva = useMemo(() => {
    const lista = transcricao?.segmentos ?? [];
    return lista.findIndex((f) => posicao >= f.ini && posicao < f.fim);
  }, [transcricao, posicao]);

  const copiar = async () => {
    if (!transcricao?.texto) return;
    await copiarTexto(transcricao.texto);
    toast.success('Transcrição copiada.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={aula?.titulo ?? 'Aula'}
        subtitle={aula?.professor ?? undefined}
        onBack={goBack}
        leading={<FileText className="w-5 h-5 text-primary" />}
      />

      <main className="flex-1 px-4 pt-4 pb-40 space-y-5">
        {carregando ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !aula ? (
          <p className="text-[14px] text-muted-foreground">Aula não encontrada.</p>
        ) : (
          <>
            {/* Resumo da captura */}
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                <span>🎙️ {formatarHms(duracaoTotal)}</span>
                <span>📦 {midias.length} trecho(s)</span>
                <span>⭐ {marcadores.length} marcador(es)</span>
              </div>

              {aula.status === 'erro' && aula.erro && (
                <p className="mt-3 text-[13px] text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {aula.erro}
                </p>
              )}

              {!transcricao && (
                <Button
                  onClick={() => void iniciarTranscricao()}
                  disabled={transcrevendo || midias.length === 0}
                  className="mt-4 w-full h-12 text-[15px] font-bold"
                >
                  {transcrevendo
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {progresso && progresso.total > 0
                          ? `Transcrevendo ${progresso.feitos}/${progresso.total}…`
                          : 'Transcrevendo…'}</>
                    : <><Sparkles className="w-5 h-5 mr-2" /> Transcrever aula</>}
                </Button>
              )}
            </section>

            {/* Marcadores */}
            {marcadores.length > 0 && (
              <section>
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                  Momentos importantes
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {marcadores.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => irPara(m.segundo)}
                      className="h-11 px-4 rounded-xl bg-primary/10 text-primary text-[13px] font-semibold tabular-nums flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5" /> {formatarHms(m.segundo)}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Transcrição */}
            {transcricao && (
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                    Transcrição
                  </h3>
                  <button
                    onClick={() => void copiar()}
                    className="h-11 px-3 flex items-center gap-1.5 text-[13px] font-semibold text-primary"
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                </div>

                <div className="mt-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar na aula (ex.: "prescrição")'
                    className="h-12 pl-10"
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {falas.length === 0 ? (
                    <p className="text-[14px] text-muted-foreground">Nada encontrado para “{busca}”.</p>
                  ) : (
                    falas.map((f, i) => {
                      const ativa = !busca && i === falaAtiva;
                      return (
                        <button
                          key={`${f.ini}-${i}`}
                          onClick={() => irPara(f.ini)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                            ativa ? 'border-primary bg-primary/5' : 'border-border bg-card'
                          }`}
                        >
                          <span className="text-[12px] font-bold tabular-nums text-primary">
                            {formatarHms(f.ini)}
                          </span>
                          <p className="mt-1 text-[15px] leading-relaxed text-foreground">{f.fala}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Player fixo */}
      {trechos.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur px-4 pt-3"
          style={{ paddingBottom: 'calc(var(--sai-bottom) + 0.75rem)' }}
        >
          <input
            type="range"
            min={0}
            max={Math.max(1, duracaoTotal)}
            value={Math.min(posicao, duracaoTotal)}
            onChange={(e) => irPara(Number(e.target.value))}
            className="w-full h-2 accent-primary"
            aria-label="Posição da aula"
          />
          <div className="mt-1 flex items-center justify-between text-[12px] tabular-nums text-muted-foreground">
            <span>{formatarHms(Math.floor(posicao))}</span>
            <span>{formatarHms(duracaoTotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-6 pb-1">
            <button onClick={() => irPara(posicao - 15)} className="w-12 h-12 flex items-center justify-center" aria-label="Voltar 15 segundos">
              <SkipBack className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={alternarPlay}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              aria-label={tocando ? 'Pausar' : 'Reproduzir'}
            >
              {tocando ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button onClick={() => irPara(posicao + 15)} className="w-12 h-12 flex items-center justify-center" aria-label="Avançar 15 segundos">
              <SkipForward className="w-6 h-6 text-foreground" />
            </button>
          </div>
          <audio
            ref={audioRef}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            onPause={() => setTocando(false)}
            onPlay={() => setTocando(true)}
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
