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
  const storageKey = `me_explique_uso_${hojeKey}`;
  
  const [tempoUsadoHoje, setTempoUsadoHoje] = useState<number>(() => {
    const val = localStorage.getItem(storageKey);
    return val ? parseInt(val, 10) : 0;
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

  useEffect(() => {
    if (!aoVivo) return;
    const interval = setInterval(() => {
      setTempoUsadoHoje((prev) => {
        const novo = prev + 1;
        localStorage.setItem(storageKey, String(novo));
        if (novo >= limiteSegundos) {
          encerrar();
          setLimiteModal(true);
          haptic.heavy();
        }
        return novo;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [aoVivo, limiteSegundos, storageKey]);

  const abrirPreview = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      setErroCamera(null);
      const disponiveis = await cameraRef.current.abrir(video);
      setRecursos(disponiveis);
      setLanterna(cameraRef.current.lanterna);
      setPreviewPronto(true);
    } catch (e) {
      setPreviewPronto(false);
      setErroCamera(e instanceof Error ? e.message : 'Não consegui abrir a câmera.');
    }
  }, [videoRef]);

  const encerrar = useCallback(() => {
    sessaoRef.current?.encerrar();
    sessaoRef.current = null;
    setStatus('inativo');
    setFalaParcial(null);
  }, []);

  useEffect(() => {
    void abrirPreview();
    return () => {
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      cameraRef.current.fechar();
    };
  }, [abrirPreview]);

  useEffect(() => {
    const aoTrocar = () => {
      if (document.hidden) {
        sessaoRef.current?.encerrar();
        sessaoRef.current = null;
        setStatus('inativo');
        cameraRef.current.fechar();
        setPreviewPronto(false);
      } else {
        void abrirPreview();
      }
    };
    document.addEventListener('visibilitychange', aoTrocar);
    return () => document.removeEventListener('visibilitychange', aoTrocar);
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

      const { data, error } = await supabase.functions.invoke('me-explique-token', {
        body: config
      });
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

        onStatus: (s) => setStatus(s),
        onTranscricaoParcial: (fala) => setFalaParcial(fala),
        onTranscricao: (fala) => {
          setFalas((atual) => [...atual.slice(-20), fala]);
          registrar(fala);
          setFalaParcial(null);
        },
        onErro: (msg) => setErro(msg),
        fps: 1,
      });

      sessaoRef.current = sessao;
      await sessao.iniciar();
      setMicAtivo(true);
    } catch (e) {
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
      setIniciando(false);
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
    window.setTimeout(() => sessaoRef.current?.enviarFrame(), 700);
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
