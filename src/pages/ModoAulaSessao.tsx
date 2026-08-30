import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Mic, Pause, Play, Square, Star, Loader2, CloudUpload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { manterTelaAcesa, liberarTela, haptic } from '@/lib/nativo';
import { criarAula, criarMarcador, atualizarAula, enviarSegmento, excluirAula } from '@/lib/modoAula/api';
import { criarGravador, formatarHms, type Gravador, type SegmentoGravado } from '@/lib/modoAula/gravacao';

const NOTIF_ID = 909191;

async function notificacaoAtiva(titulo: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_ID,
        title: 'Modo Aula — gravando',
        body: titulo,
        ongoing: true,
        autoCancel: false,
        smallIcon: 'ic_stat_icon_config_sample',
      }],
    });
  } catch { /* enhancement */ }
}
async function limparNotificacao() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
  } catch { /* noop */ }
}

export default function ModoAulaSessao() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const disciplinaId = params.get('disciplina');
  const professor = params.get('professor');
  const tituloParam = params.get('titulo');

  const [aulaId, setAulaId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState(tituloParam || '');
  const [status, setStatus] = useState<'preparando' | 'gravando' | 'pausado' | 'encerrando'>('preparando');
  const [segundos, setSegundos] = useState(0);
  const [blocosSalvos, setBlocosSalvos] = useState(0);
  const [enviando, setEnviando] = useState(0);
  const [marcadores, setMarcadores] = useState<number[]>([]);

  const gravadorRef = useRef<Gravador | null>(null);
  const aulaIdRef = useRef<string | null>(null);
  const iniciadoRef = useRef(false);

  const salvarSegmento = useCallback(async (segmento: SegmentoGravado) => {
    const id = aulaIdRef.current;
    if (!id) return;
    setEnviando((n) => n + 1);
    try {
      await enviarSegmento(id, segmento);
      setBlocosSalvos((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao salvar um trecho da aula.');
    } finally {
      setEnviando((n) => Math.max(0, n - 1));
    }
  }, []);

  // Cria a aula e começa a gravar assim que a tela abre.
  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    (async () => {
      const agora = new Date();
      const nome = (tituloParam || '').trim() ||
        `Aula de ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      setTitulo(nome);

      try {
        const aula = await criarAula({ titulo: nome, disciplinaId, professor });
        aulaIdRef.current = aula.id;
        setAulaId(aula.id);

        const gravador = criarGravador({
          onSegmento: salvarSegmento,
          onErro: (msg) => toast.error(msg),
          onStatus: (s) => {
            if (s === 'gravando') setStatus('gravando');
            else if (s === 'pausado') setStatus('pausado');
          },
        });
        gravadorRef.current = gravador;

        const ok = await gravador.iniciar();
        if (!ok) {
          await excluirAula(aula.id);
          navigate('/modo-aula', { replace: true });
          return;
        }
        setStatus('gravando');
        await manterTelaAcesa('modo-aula');
        await notificacaoAtiva(nome);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não foi possível iniciar a aula.');
        navigate('/modo-aula', { replace: true });
      }
    })();

    return () => {
      void liberarTela('modo-aula');
      void limparNotificacao();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cronômetro
  useEffect(() => {
    const t = window.setInterval(() => {
      const g = gravadorRef.current;
      if (g) setSegundos(g.segundosDecorridos());
    }, 500);
    return () => clearInterval(t);
  }, []);

  const pausar = async () => {
    await haptic.light();
    await gravadorRef.current?.pausar();
    setStatus('pausado');
  };

  const retomar = async () => {
    await haptic.light();
    await gravadorRef.current?.retomar();
    setStatus('gravando');
  };

  const marcar = async () => {
    const id = aulaIdRef.current;
    if (!id) return;
    const s = gravadorRef.current?.segundosDecorridos() ?? segundos;
    await haptic.medium();
    setMarcadores((prev) => [...prev, s]);
    try {
      await criarMarcador(id, s, 'manual');
      toast.success(`Momento marcado em ${formatarHms(s)}`);
    } catch {
      toast.error('Não foi possível salvar o marcador.');
    }
  };

  const encerrar = async () => {
    const id = aulaIdRef.current;
    if (!id) return;
    setStatus('encerrando');
    try {
      const total = gravadorRef.current?.segundosDecorridos() ?? segundos;
      await gravadorRef.current?.encerrar();
      await liberarTela('modo-aula');
      await limparNotificacao();
      await atualizarAula(id, { duracao_seg: total, status: 'rascunho' });
      navigate(`/modo-aula/aula/${id}?transcrever=1`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao encerrar a aula.');
      setStatus('gravando');
    }
  };

  const cancelar = async () => {
    const id = aulaIdRef.current;
    await gravadorRef.current?.cancelar();
    await liberarTela('modo-aula');
    await limparNotificacao();
    if (id) { try { await excluirAula(id); } catch { /* noop */ } }
    navigate('/modo-aula', { replace: true });
  };

  const gravando = status === 'gravando';

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      <header
        className="flex items-center justify-between px-4 py-4"
        style={{ paddingTop: 'calc(var(--sai-top) + 1rem)' }}
      >
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wide text-white/50">Modo Aula</p>
          <p className="text-[15px] font-semibold truncate">{titulo || 'Preparando…'}</p>
        </div>
        <button
          onClick={() => void cancelar()}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0"
          aria-label="Cancelar aula"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          animate={gravando ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: gravando ? Infinity : 0, ease: 'easeInOut' }}
          className={`w-32 h-32 rounded-full flex items-center justify-center ${
            gravando ? 'bg-primary' : 'bg-white/10'
          }`}
        >
          {status === 'preparando' || status === 'encerrando'
            ? <Loader2 className="w-12 h-12 animate-spin" />
            : <Mic className="w-12 h-12" />}
        </motion.div>

        <p className="mt-8 text-[44px] font-bold tabular-nums tracking-tight">
          {formatarHms(segundos)}
        </p>
        <p className="text-[13px] text-white/60">
          {status === 'preparando' && 'Iniciando gravação…'}
          {status === 'gravando' && 'Gravando — pode bloquear a tela'}
          {status === 'pausado' && 'Pausado'}
          {status === 'encerrando' && 'Finalizando a aula…'}
        </p>

        <div className="mt-4 flex items-center gap-3 text-[12px] text-white/50">
          <span className="flex items-center gap-1.5">
            <CloudUpload className="w-3.5 h-3.5" /> {blocosSalvos} trecho(s) salvo(s)
          </span>
          {enviando > 0 && (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> enviando…
            </span>
          )}
        </div>

        {marcadores.length > 0 && (
          <div className="mt-6 w-full max-w-sm">
            <p className="text-[12px] font-bold uppercase tracking-wide text-white/50">
              Momentos marcados
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {marcadores.map((s, i) => (
                <span key={`${s}-${i}`} className="px-3 py-1.5 rounded-full bg-white/10 text-[12px] font-semibold tabular-nums">
                  ⭐ {formatarHms(s)}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer
        className="px-4 pb-6 space-y-3"
        style={{ paddingBottom: 'calc(var(--sai-bottom) + 1.5rem)' }}
      >
        <Button
          onClick={() => void marcar()}
          disabled={!aulaId || status === 'encerrando'}
          className="w-full h-14 text-[15px] font-bold bg-white/10 hover:bg-white/15 text-white"
        >
          <Star className="w-5 h-5 mr-2" /> Marcar momento importante
        </Button>

        <div className="flex gap-3">
          {gravando ? (
            <Button
              onClick={() => void pausar()}
              className="flex-1 h-14 text-[15px] font-bold bg-white/10 hover:bg-white/15 text-white"
            >
              <Pause className="w-5 h-5 mr-2" /> Pausar
            </Button>
          ) : (
            <Button
              onClick={() => void retomar()}
              disabled={status !== 'pausado'}
              className="flex-1 h-14 text-[15px] font-bold bg-white/10 hover:bg-white/15 text-white"
            >
              <Play className="w-5 h-5 mr-2" /> Retomar
            </Button>
          )}
          <Button
            onClick={() => void encerrar()}
            disabled={status === 'preparando' || status === 'encerrando'}
            className="flex-1 h-14 text-[15px] font-bold"
          >
            <Square className="w-5 h-5 mr-2" /> Encerrar
          </Button>
        </div>
      </footer>
    </div>
  );
}
