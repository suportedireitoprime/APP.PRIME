import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Volume2,
  BookOpen,
  Sparkles,
  Layers,
  FileText,
  X,
  Headphones,
  SlidersHorizontal,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/nativeHaptics";
import { toast } from "sonner";
import { setupMediaSession, clearMediaSession } from "@/lib/mediaSession";
import { LEIS_CATALOG } from "@/data/leisCatalog";
import { useGatedFeature } from "@/hooks/useGatedFeature";
import { leiToSlug, tipoToSlug } from "@/lib/legislacaoSlugs";
import { safeStorageUrl } from "@/lib/cdnImg";
import { capaDaArea } from "@/lib/audioaulasHelper";
import { useLeiArtigos } from "@/hooks/domain/useLeiArtigos";
import {
  extractLeiCapitulos,
  isStructuralArtigo,
  formatArtigoNumeroOnly,
  type LeiCapituloItem,
} from "@/lib/leiStructure";
import type { ArtigoLei } from "@/data/mockData";

import { AudioleiQuickPlayer } from "@/components/audioleis/AudioleiQuickPlayer";
import { AudioleiLawSelector } from "@/components/audioleis/AudioleiLawSelector";
import { AudioleiArticlesList } from "@/components/audioleis/AudioleiArticlesList";
import { AudioleiChaptersList } from "@/components/audioleis/AudioleiChaptersList";
import { AudioleiBottomDock } from "@/components/audioleis/AudioleiBottomDock";
import {
  AudioleiPlaylistSheet,
  type CapituloComAudiosData,
} from "@/components/audioleis/AudioleiPlaylistSheet";
import type { LawOption, NarracaoItem } from "@/components/audioleis/audioleiTypes";

const LAWS_CONFIG: LawOption[] = LEIS_CATALOG.map((law) => ({
  ...law,
  status: "completo",
  color: "",
}));

const COVER_AREAS: Record<string, string> = {
  cf88: "Direito Constitucional",
  cp: "Direito Penal",
  cpp: "Processo Penal",
  cc: "Direito Civil",
  cpc: "Processo Civil",
  clt: "Direito do Trabalho",
  ctn: "Direito Tributário",
  cdc: "Consumidor",
  ce: "Eleitoral",
  cpm: "Direito Penal",
  cppm: "Processo Penal",
  ctb: "Direito Administrativo",
  cflor: "Direito Ambiental",
  ccom: "Direito Empresarial",
  cba: "Direito Administrativo",
  cagua: "Direito Ambiental",
  cmin: "Direito Ambiental",
  ctel: "Direito Administrativo",
  eca: "Direito da Criança e do Adolescente",
  ei: "Direito Civil",
  epd: "Direitos Humanos",
  eir: "Direitos Humanos",
  ec: "Direito Urbanístico",
  ed: "Direito Penal",
  eoab: "Deontologia e Estatuto da OAB",
  et: "Direito Desportivo",
  ej: "Direitos Humanos",
  em: "Direito Administrativo",
  eind: "Direitos Humanos",
  eterra: "Direito Agrário",
  emig: "Direito Internacional",
  eref: "Direitos Humanos",
  emet: "Direito Urbanístico",
  emus: "Direito Administrativo",
  eme: "Direito Empresarial",
  epc: "Direito Médico",
  lep: "Direito Penal",
  lmp: "Direito Penal",
  ld: "Direito Penal",
  loc: "Direito Penal",
  laa: "Direito Penal",
  lit: "Processo Penal",
  l8112: "Direito Administrativo",
  lia: "Direito Administrativo",
  nll: "Direito Administrativo",
  lms: "Processo Civil",
  lacp: "Processo Civil",
  lje: "Processo Civil",
  lgpd: "Direito Digital",
  mci: "Direito Digital",
  lf: "Direito Empresarial",
  la: "Processo Civil",
  li: "Direito Civil",
  lrp: "Direito Civil",
  loman: "Processo Civil",
  lat: "Direito Penal",
  lindb: "Direito Civil",
  lch: "Direito Penal",
  ltort: "Direito Penal",
  lca: "Direito Ambiental",
  lrac: "Direitos Humanos",
  llav: "Direito Penal",
  lpaf: "Direito Administrativo",
  lrf: "Direito Financeiro",
  lai: "Direito Administrativo",
  lap: "Processo Civil",
  lcp: "Direito Penal",
  ldb: "Políticas Públicas",
  lomp: "Processo Penal",
  lsa: "Direito Empresarial",
  lpi: "Direito Empresarial",
  lda: "Direito Civil",
  lace: "Direito Empresarial",
  lcon: "Direito Administrativo",
  lppp: "Direito Administrativo",
  lhd: "Processo Civil",
  lmi: "Processo Civil",
  lpp: "Direito Eleitoral",
  lele: "Direito Eleitoral",
  lfl: "Direito Eleitoral",
  lcsf: "Direito Penal",
  lpt: "Processo Penal",
  lpsu: "Direito Urbanístico",
  lalp: "Direito Civil",
  lalim: "Direito Civil",
  lcade: "Direito Empresarial",
  lsus: "Direito Médico",
  lbio: "Direito Ambiental",
  lci: "Direito Digital",
  line: "Direito Eleitoral",
  lotcu: "Direito Administrativo",
  lle: "Direito Empresarial",
  ces: "Direito Administrativo",
  lmls: "Direito Empresarial",
  lrt: "Direito Tributário",
  lbps: "Direito Previdenciário",
  lcss: "Direito Previdenciário",
  lpc: "Direito Previdenciário",
  loas: "Direito Previdenciário",
};

function sortArtigos(a: string, b: string) {
  const matchA = a.match(/^(\d+)(.*)$/);
  const matchB = b.match(/^(\d+)(.*)$/);

  if (matchA && matchB) {
    const numA = parseInt(matchA[1], 10);
    const numB = parseInt(matchB[1], 10);
    if (numA !== numB) return numA - numB;
    return matchA[2].localeCompare(matchB[2]);
  }
  return a.localeCompare(b, undefined, { numeric: true });
}

export default function AudioleisPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabelaParam = searchParams.get("tabela") || searchParams.get("lei");
  const artigoParam = searchParams.get("artigo");

  // Guarda e restaura a última lei acessada para que a tela já abra pronta para tocar
  const [selectedTabela, setSelectedTabela] = useState<string>(() => {
    if (tabelaParam) {
      const match = LAWS_CONFIG.find(
        (l) =>
          l.tabela_nome.toLowerCase() === tabelaParam.toLowerCase() ||
          l.id.toLowerCase() === tabelaParam.toLowerCase() ||
          l.sigla.toLowerCase() === tabelaParam.toLowerCase()
      );
      if (match) return match.tabela_nome;
    }
    try {
      const saved = localStorage.getItem("audioleis_last_tabela");
      if (saved && LAWS_CONFIG.some((l) => l.tabela_nome === saved)) {
        return saved;
      }
    } catch {
      // Ignora erro de localStorage
    }
    return "CF88_CONSTITUICAO_FEDERAL";
  });

  // Catálogo completo com contagem de áudios
  const { data: lawCounts = {} } = useQuery({
    queryKey: ["audioleis-catalogo"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("narracoes_artigos")
          .select("tabela_nome")
          .not("audio_url", "is", null)
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        for (const row of data || []) counts[row.tabela_nome] = (counts[row.tabela_nome] || 0) + 1;
        if (!data || data.length < 1000) break;
      }
      return counts;
    },
  });

  const availableLaws = useMemo(() => {
    return LAWS_CONFIG.filter((law) => !lawCounts || (lawCounts[law.tabela_nome] || 0) > 0);
  }, [lawCounts]);

  const currentLaw = useMemo(() => {
    return LAWS_CONFIG.find((l) => l.tabela_nome === selectedTabela) || LAWS_CONFIG[0];
  }, [selectedTabela]);

  const areaCapa = COVER_AREAS[currentLaw.id] || currentLaw.nome;
  const capaUrl = capaDaArea(areaCapa);

  // Controle de Permissão/Gate
  const audioleiGate = useGatedFeature("audiolei", "narracao");
  const audioleiGateRef = useRef(audioleiGate);
  audioleiGateRef.current = audioleiGate;

  // Busca rápida de artigos
  const [searchQuery, setSearchQuery] = useState("");

  // Modo de exibição: Artigos vs Capítulos
  const [modoVisualizacao, setModoVisualizacao] = useState<"artigos" | "capitulos">("artigos");
  const [selectedCapituloParaPlaylist, setSelectedCapituloParaPlaylist] =
    useState<CapituloComAudiosData | null>(null);

  // Carrega os áudios da lei selecionada
  const {
    data: artigos = [],
    isLoading: loadingArtigosNarrados,
    refetch: reloadArticles,
  } = useQuery({
    queryKey: ["audioleis-artigos", selectedTabela],
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const rows: NarracaoItem[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("narracoes_artigos")
          .select("artigo_numero, audio_url, titulo_artigo")
          .eq("tabela_nome", selectedTabela)
          .not("audio_url", "is", null)
          .order("id")
          .range(from, from + 999)
          .abortSignal(signal);
        if (error) throw error;
        rows.push(
          ...(data || []).map((row) => ({
            ...row,
            audio_url: safeStorageUrl(row.audio_url) || row.audio_url,
            titulo_artigo: row.titulo_artigo ?? undefined,
          }))
        );
        if (!data || data.length < 1000) break;
      }
      const unique = new Map<string, NarracaoItem>();
      for (const row of rows) {
        const numero = row.artigo_numero
          .replace(/^Art(?:igo|\.)?\s*/i, "")
          .replace(/[º°ª]/g, "")
          .trim();
        if (numero && row.audio_url && !unique.has(numero)) {
          unique.set(numero, { ...row, artigo_numero: numero });
        }
      }
      return Array.from(unique.values()).sort((a, b) =>
        sortArtigos(a.artigo_numero, b.artigo_numero)
      );
    },
  });

  // Carrega a estrutura de artigos da lei para montagem dos capítulos
  const { artigos: fullArtigos = [], loadingArtigos: loadingFullArtigos } = useLeiArtigos(
    currentLaw.id,
    selectedTabela
  );

  const capitulos = useMemo(
    () => extractLeiCapitulos(fullArtigos as ArtigoLei[]),
    [fullArtigos]
  );

  // Mapeamento de áudios
  const audioMap = useMemo(() => {
    const map = new Map<string, NarracaoItem>();
    for (const item of artigos) {
      const clean = formatArtigoNumeroOnly(item.artigo_numero).toLowerCase();
      if (clean) map.set(clean, item);
      map.set(item.artigo_numero.toLowerCase(), item);
    }
    return map;
  }, [artigos]);

  // Capítulos com estatísticas de áudios gravados
  const capitulosComAudios = useMemo(() => {
    if (!capitulos || capitulos.length === 0) return [];
    return capitulos.map((cap) => {
      const realArtigos = cap.artigos.filter((a) => !isStructuralArtigo(a));
      const audiosDisponiveis: Array<{ artigo: ArtigoLei; narracao: NarracaoItem }> = [];

      for (const art of realArtigos) {
        const clean = formatArtigoNumeroOnly(art.numero).toLowerCase();
        const raw = String(art.numero || "").trim().toLowerCase();
        const narracao = audioMap.get(clean) || audioMap.get(raw);
        if (narracao) {
          audiosDisponiveis.push({ artigo: art, narracao });
        }
      }

      const totalArts = realArtigos.length;
      const totalAudios = audiosDisponiveis.length;
      const pctGravado = totalArts > 0 ? Math.round((totalAudios / totalArts) * 100) : 0;

      return {
        capitulo: cap,
        realArtigos,
        audiosDisponiveis,
        totalArts,
        totalAudios,
        pctGravado,
      };
    });
  }, [capitulos, audioMap]);

  // Fallback caso a lei não tenha capítulos formais
  const fallbackCapitulosComAudios = useMemo(() => {
    if (capitulosComAudios.length > 0) return capitulosComAudios;
    if (!artigos || artigos.length === 0) return [];

    const chunkSize = 50;
    const groups: typeof capitulosComAudios = [];
    for (let i = 0; i < artigos.length; i += chunkSize) {
      const chunk = artigos.slice(i, i + chunkSize);
      const primeiro = chunk[0].artigo_numero;
      const ultimo = chunk[chunk.length - 1].artigo_numero;
      groups.push({
        capitulo: {
          id: `chunk-${i}`,
          capituloNome: `Artigos ${primeiro} a ${ultimo}`,
          capituloHead: `BLOCO ${Math.floor(i / chunkSize) + 1}`,
          primeiroArtigo: primeiro,
          ultimoArtigo: ultimo,
          artigos: chunk.map((a) => ({
            id: a.artigo_numero,
            numero: a.artigo_numero,
            caput: a.titulo_artigo || `Artigo ${a.artigo_numero}`,
          })),
        },
        realArtigos: chunk.map((a) => ({
          id: a.artigo_numero,
          numero: a.artigo_numero,
          caput: a.titulo_artigo || `Artigo ${a.artigo_numero}`,
        })),
        audiosDisponiveis: chunk.map((a) => ({
          artigo: {
            id: a.artigo_numero,
            numero: a.artigo_numero,
            caput: a.titulo_artigo || `Artigo ${a.artigo_numero}`,
          },
          narracao: a,
        })),
        totalArts: chunk.length,
        totalAudios: chunk.length,
        pctGravado: 100,
      });
    }
    return groups;
  }, [capitulosComAudios, artigos]);

  // Filtro de busca nos artigos
  const filteredArtigos = useMemo(() => {
    if (!searchQuery.trim()) return artigos;
    const q = searchQuery
      .toLowerCase()
      .trim()
      .replace(/^art(?:igo|\.)?\s*/i, "")
      .replace(/[º°ª]/g, "");
    return artigos.filter((item) => {
      const matchNum = item.artigo_numero.toLowerCase().includes(q);
      const matchTitle = item.titulo_artigo?.toLowerCase().includes(q);
      return matchNum || matchTitle;
    });
  }, [artigos, searchQuery]);

  // Filtro de busca nos capítulos
  const displayedCapitulos = useMemo(() => {
    const source =
      capitulosComAudios.length > 0 ? capitulosComAudios : fallbackCapitulosComAudios;
    if (!searchQuery.trim()) return source;
    const q = searchQuery
      .toLowerCase()
      .trim()
      .replace(/^art(?:igo|\.)?\s*/i, "")
      .replace(/[º°ª]/g, "");

    return source.filter(({ capitulo, realArtigos }) => {
      const matchName =
        (capitulo.capituloNome && capitulo.capituloNome.toLowerCase().includes(q)) ||
        (capitulo.capituloHead && capitulo.capituloHead.toLowerCase().includes(q)) ||
        (capitulo.parentContext && capitulo.parentContext.toLowerCase().includes(q));
      if (matchName) return true;

      return realArtigos.some((art) => {
        const artNum = formatArtigoNumeroOnly(art.numero).toLowerCase();
        const caput = (art.caput || "").toLowerCase();
        return artNum.includes(q) || caput.includes(q);
      });
    });
  }, [capitulosComAudios, fallbackCapitulosComAudios, searchQuery]);

  // Player de Áudio Nativo
  const [currentArtigo, setCurrentArtigo] = useState<NarracaoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem("vademecum_audio_speed"));
      return [0.75, 1, 1.25, 1.5, 2].includes(saved) ? saved : 1.0;
    } catch {
      return 1.0;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Se nenhum artigo foi tocado ainda, inicializa o card do topo com o primeiro artigo da lista
  const activeArtigoForQuickPlayer = useMemo(() => {
    if (currentArtigo) return currentArtigo;
    if (filteredArtigos.length > 0) return filteredArtigos[0];
    if (artigos.length > 0) return artigos[0];
    return null;
  }, [currentArtigo, filteredArtigos, artigos]);

  // Função central de reprodução de áudio
  const playAudio = useCallback(
    (item: NarracaoItem) => {
      haptic.impact();
      const g = audioleiGateRef.current;
      const ref = `${selectedTabela}:${item.artigo_numero}`;
      if (g.blocked) {
        g.openGate();
        return;
      }
      void g.register(ref);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;

      // Mesmo artigo tocando -> pausa
      if (currentArtigo?.artigo_numero === item.artigo_numero && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      // Mesmo artigo pausado -> play
      if (currentArtigo?.artigo_numero === item.artigo_numero && !isPlaying) {
        audio.play().catch(console.error);
        setIsPlaying(true);
        return;
      }

      // Novo artigo
      setCurrentArtigo(item);
      audio.src = item.audio_url;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      setCurrentTime(0);

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setupMediaSession({
            title: `Artigo ${item.artigo_numero} — ${currentLaw.nome}`,
            artist: "Audioleis Prime",
            album: currentLaw.nome,
            audio,
          });
        })
        .catch((e) => {
          console.error("Erro ao iniciar áudio:", e);
          toast.error("Não foi possível reproduzir este áudio no momento.");
        });
    },
    [currentArtigo, isPlaying, playbackRate, currentLaw, selectedTabela]
  );

  const togglePlay = useCallback(() => {
    if (currentArtigo) {
      playAudio(currentArtigo);
    } else if (activeArtigoForQuickPlayer) {
      playAudio(activeArtigoForQuickPlayer);
    }
  }, [currentArtigo, activeArtigoForQuickPlayer, playAudio]);

  const skipTime = useCallback(
    (deltaSeconds: number) => {
      if (!audioRef.current) return;
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + deltaSeconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  const seekTime = useCallback(
    (seconds: number) => {
      if (!audioRef.current) return;
      const target = Math.max(0, Math.min(duration, seconds));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    },
    [duration]
  );

  const changeSpeed = useCallback((rate: number) => {
    haptic.selection();
    setPlaybackRate(rate);
    try {
      localStorage.setItem("vademecum_audio_speed", String(rate));
    } catch {
      // Ignora erro de localStorage
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Pular para o próximo ou anterior artigo
  const pularArtigo = useCallback(
    (direction: "next" | "prev") => {
      const list = filteredArtigos.length > 0 ? filteredArtigos : artigos;
      if (!list.length) return;

      const currentIdx = currentArtigo
        ? list.findIndex((a) => a.artigo_numero === currentArtigo.artigo_numero)
        : -1;

      const nextIdx =
        direction === "next"
          ? currentIdx + 1
          : currentIdx === -1
          ? 0
          : currentIdx - 1;

      if (nextIdx >= 0 && nextIdx < list.length) {
        playAudio(list[nextIdx]);
      } else {
        toast.info(direction === "next" ? "Fim da lista de artigos." : "Primeiro artigo da lei.");
      }
    },
    [artigos, filteredArtigos, currentArtigo, playAudio]
  );

  // Tocar o capítulo inteiro em sequência
  const playWholeChapter = useCallback(
    (capituloData: CapituloComAudiosData) => {
      haptic.impact();
      if (!capituloData.audiosDisponiveis.length) {
        toast.info("Este capítulo ainda não possui áudios gravados.");
        return;
      }
      const primeiro = capituloData.audiosDisponiveis[0].narracao;
      playAudio(primeiro);
      toast.success(`Tocando Capítulo: ${capituloData.capitulo.capituloNome}`);
    },
    [playAudio]
  );

  // Abrir Vade Mecum
  const irParaArtigoVadeMecum = useCallback(
    (numArtigo: string) => {
      haptic.selection();
      const lei = LEIS_CATALOG.find((l) => l.tabela_nome === selectedTabela);
      if (lei) {
        const slug = leiToSlug({ id: lei.id, nome: lei.nome });
        navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${slug}/${encodeURIComponent(numArtigo)}`);
      } else {
        navigate("/vademecum");
      }
    },
    [navigate, selectedTabela]
  );

  // Troca de Lei Instantânea
  const handleSelectLaw = useCallback(
    (tabela: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentArtigo(null);
      setCurrentTime(0);
      setDuration(0);
      clearMediaSession();
      setSelectedTabela(tabela);
      setSearchQuery("");
      setSelectedCapituloParaPlaylist(null);
      try {
        localStorage.setItem("audioleis_last_tabela", tabela);
      } catch {
        // Ignora
      }
      setSearchParams({ tabela });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams]
  );

  // Deep Link do artigo na URL
  const deepLinkPlayed = useRef<string | null>(null);
  useEffect(() => {
    if (!artigoParam || loadingArtigosNarrados || artigos.length === 0) return;
    const key = `${selectedTabela}:${artigoParam}`;
    if (deepLinkPlayed.current === key) return;
    const target = artigoParam
      .replace(/^art(?:igo|\.)?\s*/i, "")
      .replace(/[º°ª]/g, "")
      .trim()
      .toLowerCase();
    const match = artigos.find((item) => item.artigo_numero.toLowerCase() === target);
    if (!match) return;
    deepLinkPlayed.current = key;
    setSearchQuery(target);
    playAudio(match);
  }, [artigoParam, artigos, loadingArtigosNarrados, selectedTabela, playAudio]);

  // Event Listeners do Audio Element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);

      if (autoplayNext && currentArtigo) {
        const list = filteredArtigos.length > 0 ? filteredArtigos : artigos;
        const currentIdx = list.findIndex(
          (a) => a.artigo_numero === currentArtigo.artigo_numero
        );
        if (currentIdx >= 0 && currentIdx < list.length - 1) {
          const next = list[currentIdx + 1];
          playAudio(next);
        }
      }
    };
    const onError = () => {
      setIsPlaying(false);
      toast.error("Erro na reprodução do áudio.");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [currentArtigo, artigos, filteredArtigos, autoplayNext, playAudio]);

  // Atalhos de teclado no Desktop (Espaço = Play/Pause, Setas = -15s/+15s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        skipTime(-15);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        skipTime(15);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skipTime]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearMediaSession();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {audioleiGate.gateNode}

      {/* Fundo ShapeGrid Padrão Oficial */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <ShapeGrid />
      </div>

      {/* Header Compacto & Tátil ("Focus Bar") */}
      <header className="relative z-20 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Botão de voltar padrão premium das diretrizes */}
            <button
              type="button"
              onClick={() => {
                haptic.impact();
                navigate(-1);
              }}
              aria-label="Voltar"
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-card hover:bg-secondary border border-border flex items-center justify-center text-foreground transition-all duration-200 active:scale-95 shadow-xs"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  <span>Audioleis</span>
                </h1>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {currentLaw.nome} • {artigos.length} áudios
              </p>
            </div>
          </div>

          {/* Atalho para o Vade Mecum da Lei */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              const slug = leiToSlug({ id: currentLaw.id, nome: currentLaw.nome });
              navigate(`/legislacao/${tipoToSlug(currentLaw.tipo)}/${slug}`);
            }}
            title="Abrir lei completa no Vade Mecum"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Vade Mecum</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal de Alta Eficiência */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 pb-[calc(7.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-5">
        {/* Seletor Rápido de Leis (Chips Horizontais + Gaveta Completa) */}
        <section>
          <AudioleiLawSelector
            selectedTabela={selectedTabela}
            onSelectLaw={handleSelectLaw}
            availableLaws={availableLaws}
            lawCounts={lawCounts}
          />
        </section>

        {/* Hero Player Dinâmico no Topo ("Play em 1 Toque") */}
        <section>
          <AudioleiQuickPlayer
            currentArtigo={activeArtigoForQuickPlayer}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            leiNome={currentLaw.nome}
            leiSigla={currentLaw.sigla}
            totalAudios={artigos.length}
            capaUrl={capaUrl}
            onTogglePlay={togglePlay}
            onSeek={seekTime}
            onSkipTime={skipTime}
            onChangeSpeed={changeSpeed}
            onPrevious={() => pularArtigo("prev")}
            onNext={() => pularArtigo("next")}
            onOpenVadeMecum={irParaArtigoVadeMecum}
          />
        </section>

        {/* Barra de Busca Instantânea */}
        <section className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar por artigo ou tema em ${currentLaw.sigla} (ex: 121, legítima defesa, 5º)...`}
            className="w-full bg-card/90 border border-border rounded-2xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* Alternador Rápido de Abas: Artigos vs Capítulos */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="inline-flex items-center p-1 rounded-2xl bg-card border border-border shadow-xs">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setModoVisualizacao("artigos");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                modoVisualizacao === "artigos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Artigos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  modoVisualizacao === "artigos"
                    ? "bg-black/30 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {filteredArtigos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setModoVisualizacao("capitulos");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                modoVisualizacao === "capitulos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Capítulos (Playlists)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  modoVisualizacao === "capitulos"
                    ? "bg-black/30 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {displayedCapitulos.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            Clique em qualquer artigo para escuta imediata
          </span>
        </div>

        {/* Lista Conforme a Aba Selecionada */}
        {modoVisualizacao === "artigos" ? (
          <AudioleiArticlesList
            artigos={filteredArtigos}
            currentArtigo={currentArtigo}
            isPlaying={isPlaying}
            onPlayArticle={playAudio}
            onOpenVadeMecum={irParaArtigoVadeMecum}
            loading={loadingArtigosNarrados}
          />
        ) : (
          <AudioleiChaptersList
            capitulos={displayedCapitulos}
            currentArtigo={currentArtigo}
            isPlaying={isPlaying}
            onOpenPlaylistSheet={(item) => setSelectedCapituloParaPlaylist(item)}
            onPlayWholeChapter={playWholeChapter}
            loading={loadingFullArtigos}
          />
        )}
      </main>

      {/* Dock Player Fixo Inferior (Visível quando há áudio ativo) */}
      <AudioleiBottomDock
        currentArtigo={currentArtigo}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        leiNome={currentLaw.nome}
        leiSigla={currentLaw.sigla}
        capaUrl={capaUrl}
        onTogglePlay={togglePlay}
        onSeek={seekTime}
        onSkipTime={skipTime}
        onChangeSpeed={changeSpeed}
        onClose={() => {
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setCurrentArtigo(null);
        }}
        onOpenVadeMecum={irParaArtigoVadeMecum}
      />

      {/* Playlist Deslizante do Capítulo em Bottom Sheet */}
      <AudioleiPlaylistSheet
        isOpen={Boolean(selectedCapituloParaPlaylist)}
        onClose={() => setSelectedCapituloParaPlaylist(null)}
        capituloData={selectedCapituloParaPlaylist}
        leiNome={currentLaw.nome}
        leiSigla={currentLaw.sigla}
        audioMap={audioMap}
        currentArtigo={currentArtigo}
        isPlaying={isPlaying}
        onPlayAudio={playAudio}
        onTogglePlay={togglePlay}
      />
    </div>
  );
}
