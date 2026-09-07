import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic, telaAcesa } from '@/lib/nativo';
import { SessaoMeExplique, type FalaTranscrita, type StatusLive } from '@/lib/meExplique/liveClient';
import { CameraMeExplique, type RecursosCamera } from '@/lib/meExplique/camera';
import { type FalaSalva } from '@/components/meExplique/TranscricaoSheet';
import { type MeExpliqueConfig, DEFAULT_CONFIG } from '@/components/meExplique/MeExpliqueConfigSheet';

const LIMITE_PREMIUM_SEG = 300; // 5 minutos por dia
const LIMITE_FREE_SEG = 60;     // 1 minuto teste

export function useMeExpliqueEngine(videoRef: RefObject<HTMLVideoElement>) {
  const { isPremium, loading: carregandoPlano } = useSubscription();
  const sessaoRef = useRef<SessaoMeExplique | null>(null);
  const cameraRef = useRef<CameraMeExplique>(new CameraMeExplique());
  const pinchRef = useRef<{ distancia: number; zoom: number } | null>(null);
  const isMounted = useRef(true);
  const aberturaPendente = useRef(false);
  const focoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (focoTimerRef.current) window.clearTimeout(focoTimerRef.current);
    };
  }, []);

  const [status, setStatus] = useState<StatusLive>('inativo');
  const [erro, setErro] = useState<string | null>(null);
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [micAtivo, setMicAtivo] = useState(true);
  const [falas, setFalas] = useState<FalaTranscrita[]>([]);
  const [falaParcial, setFalaParcial] = useState<FalaTranscrita | null>(null);
  const [historico, setHistorico] = useState<FalaSalva[]>([]);
  const [transcricaoAberta, setTranscricaoAberta] = useState(false);

  const [config, setConfig] = useState<MeExpliqueConfig>(() => {
    const saved = localStorage.getItem('me_explique_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [configAberta, setConfigAberta] = useState(false);

  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('me_explique_tutorial_visto');
  });

  const [limiteModal, setLimiteModal] = useState(false);
  const hojeKey = new Date().toISOString().slice(0, 10);
  const storageKey = btoa(`me_explique_uso_${hojeKey}`);
  
  const [tempoUsadoHoje, setTempoUsadoHoje] = useState<number>(() => {
    const val = localStorage.getItem(storageKey);
    try {
      return val ? parseInt(atob(val), 10) : 0;
    } catch {
      return 0;
    }
  });

  const limiteSegundos = isPremium ? LIMITE_PREMIUM_SEG : LIMITE_FREE_SEG;
  const tempoRestante = Math.max(0, limiteSegundos - tempoUsadoHoje);

  const registrar = useCallback((fala: FalaTranscrita) => {
    setHistorico((atual) => {
      const ultimo = atual[atual.length - 1];
      if (ultimo && ultimo.quem === fala.quem && Date.now() - ultimo.em < 12000) {
        const juntos = [...atual];
        juntos[juntos.length - 1] = {
          ...ultimo,
          texto: `${ultimo.texto} ${fala.texto}`.replace(/\s+/g, ' ').trim(),
        };
        return juntos;
      }
      return [...atual, { quem: fala.quem, texto: fala.texto, em: Date.now() }];
    });
  }, []);

  const [gateAberto, setGateAberto] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [previewPronto, setPreviewPronto] = useState(false);
  const [recursos, setRecursos] = useState<RecursosCamera>({
    focoManual: false,
    zoom: null,
    lanterna: false,
  });
  const [lanterna, setLanterna] = useState(false);
  const [foco, setFoco] = useState<{ x: number; y: number; id: number } | null>(null);

  const ativo = status === 'ouvindo' || status === 'falando' || status === 'conectando';
  const aoVivo = status === 'ouvindo' || status === 'falando';

  useEffect(() => {
    void telaAcesa('me-explique', ativo);
    return () => {
      void telaAcesa('me-explique', false);
    };
  }, [ativo]);

  const encerrar = useCallback(() => {
    sessaoRef.current?.encerrar();
    sessaoRef.current = null;
    setStatus('inativo');
    setFalaParcial(null);
    setTempoUsadoHoje(prev => {
      localStorage.setItem(storageKey, btoa(String(prev)));
      return prev;
    });
  }, [storageKey]);

  const startTimeRef = useRef<number>(Date.now());
  const initialTempoRef = useRef<number>(tempoUsadoHoje);

  useEffect(() => {
    if (!aoVivo) return;
    startTimeRef.current = Date.now();
    initialTempoRef.current = tempoUsadoHoje;

    const interval = setInterval(() => {
      setTempoUsadoHoje(() => {
        const decorrido = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const novo = initialTempoRef.current + decorrido;
        if (novo % 5 === 0) localStorage.setItem(storageKey, btoa(String(novo)));
        if (novo >= limiteSegundos) {
          encerrar();
          setLimiteModal(true);
          haptic.heavy();
        }
        return novo;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoVivo, limiteSegundos, storageKey, encerrar]);

  const abrirPreview = useCallback(async () => {
    if (aberturaPendente.current) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      aberturaPendente.current = true;
      setErroCamera(null);
      const disponiveis = await cameraRef.current.abrir(video);
      if (!isMounted.current) return;
      setRecursos(disponiveis);
      setLanterna(cameraRef.current.lanterna);
      setPreviewPronto(true);
    } catch (e) {
      if (!isMounted.current) return;
      setPreviewPronto(false);
      setErroCamera(e instanceof Error ? e.message : 'Não consegui abrir a câmera.');
    } finally {
      aberturaPendente.current = false;
    }
  }, [videoRef]);


  useEffect(() => {
    const camera = cameraRef.current;
    void abrirPreview();
    return () => {
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      camera.fechar();
    };
  }, [abrirPreview]);

  useEffect(() => {
    const camera = cameraRef.current;
    let appListener: any;

    const aoTrocar = (hidden: boolean) => {
      if (hidden) {
        sessaoRef.current?.encerrar();
        sessaoRef.current = null;
        setStatus('inativo');
        camera.fechar();
        setPreviewPronto(false);
      } else {
        void abrirPreview();
      }
    };

    const handleVis = () => aoTrocar(document.hidden);
    document.addEventListener('visibilitychange', handleVis);

    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        aoTrocar(!isActive);
      }).then(l => { appListener = l; }).catch(() => {});
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      if (appListener) appListener.remove();
    };
  }, [abrirPreview]);

  const iniciar = useCallback(async () => {
    if (tempoRestante <= 0) {
      setLimiteModal(true);
      return;
    }
    if (sessaoRef.current || iniciando) return;

    setErro(null);
    setFalas([]);
    setIniciando(true);
    setStatus('conectando');
    void haptic.medium();

    try {
      if (!cameraRef.current.ativa) await abrirPreview();

      const chamador = supabase.functions.invoke('me-explique-token', {
        body: config
      });
      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('A conexão demorou demais. Verifique sua internet e tente novamente.')), 12000);
      });
      
      const { data, error } = await Promise.race([chamador, timeoutPromise]);
      
      if (error) throw new Error(error.message);
      const resposta = data as { token?: string; modelo?: string; setup?: Record<string, unknown> | null; ephemeral?: boolean } | null;
      const token = resposta?.token;
      const modelo = resposta?.modelo;
      if (!token || !modelo) throw new Error('Não foi possível autorizar a sessão ao vivo.');

      const video = videoRef.current;
      if (!video) throw new Error('Câmera indisponível.');

      const sessao = new SessaoMeExplique({
        token,
        modelo,
        ephemeral: resposta?.ephemeral ?? false,
        setup: resposta?.setup ?? null,
        video,
        streamVideo: cameraRef.current.obterStream(),

        onStatus: (s) => {
          if (isMounted.current) setStatus(s);
        },
        onTranscricaoParcial: (fala) => {
          if (isMounted.current) setFalaParcial(fala);
        },
        onTranscricao: (fala) => {
          if (!isMounted.current) return;
          setFalas((atual) => [...atual.slice(-20), fala]);
          registrar(fala);
          setFalaParcial(null);
        },
        onErro: (msg) => {
          if (isMounted.current) setErro(msg);
        },
        fps: 1,
      });

      sessaoRef.current = sessao;
      await sessao.iniciar();
      if (isMounted.current) setMicAtivo(true);
    } catch (e) {
      if (!isMounted.current) return;
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar.';
      setErro(
        /permission|notallowed|denied/i.test(msg)
          ? 'Precisamos da sua câmera e microfone. Abra os Ajustes do aparelho e libere as permissões para o app.'
          : msg,
      );

      setStatus('erro');
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
    } finally {
      if (isMounted.current) setIniciando(false);
    }
  }, [tempoRestante, iniciando, abrirPreview, registrar, config, videoRef]);

  const alternarMic = useCallback(() => {
    const sessao = sessaoRef.current;
    if (!sessao) return;
    void haptic.light();
    setMicAtivo(sessao.alternarMicrofone());
  }, []);

  const alternarLanterna = useCallback(async () => {
    void haptic.light();
    setLanterna(await cameraRef.current.alternarLanterna());
  }, []);

  const perguntar = useCallback((texto: string) => {
    sessaoRef.current?.enviarTexto(texto);
    void haptic.light();
    setFalas((atual) => [...atual.slice(-20), { quem: 'aluno', texto }]);
    registrar({ quem: 'aluno', texto });
  }, [registrar]);

  const fecharCameraCompleta = useCallback(() => {
    encerrar();
    cameraRef.current.fechar();
  }, [encerrar]);

  const tocarParaFocar = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewPronto || pinchRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFoco({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    void haptic.light();
    void cameraRef.current.focarEm(x, y);
    if (focoTimerRef.current) window.clearTimeout(focoTimerRef.current);
    focoTimerRef.current = window.setTimeout(() => sessaoRef.current?.enviarFrame(), 700);
  }, [previewPronto]);

  const aoTocar = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !recursos.zoom) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const distancia = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pinchRef.current = { distancia, zoom: cameraRef.current.zoom };
  }, [recursos.zoom]);

  const aoMover = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const inicio = pinchRef.current;
    if (!inicio || e.touches.length !== 2 || !recursos.zoom) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const distancia = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const fator = distancia / (inicio.distancia || 1);
    void cameraRef.current.definirZoom(inicio.zoom * fator);
  }, [recursos.zoom]);

  const aoSoltar = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      window.setTimeout(() => {
        pinchRef.current = null;
      }, 120);
    }
  }, []);

  const fecharTutorial = useCallback(() => {
    localStorage.setItem('me_explique_tutorial_visto', 'true');
    setShowTutorial(false);
    haptic.selection();
  }, []);

  const ultimaFala = falas[falas.length - 1];
  const minRest = Math.floor(tempoRestante / 60);
  const segRest = String(tempoRestante % 60).padStart(2, '0');

  return {
    // State
    status, erro, erroCamera, micAtivo, falas, falaParcial, historico,
    config, setConfig, configAberta, setConfigAberta, transcricaoAberta, setTranscricaoAberta,
    showTutorial, setShowTutorial, limiteModal, setLimiteModal, tempoRestante, gateAberto, setGateAberto,
    iniciando, previewPronto, recursos, lanterna, foco, setFoco,
    ativo, aoVivo, minRest, segRest, ultimaFala, isPremium, carregandoPlano,
    // Actions
    abrirPreview, encerrar, iniciar, alternarMic, alternarLanterna, perguntar,
    tocarParaFocar, aoTocar, aoMover, aoSoltar, fecharTutorial, fecharCameraCompleta
  };
}
