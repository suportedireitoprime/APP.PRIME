import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Headphones,
  X,
  Layers,
  FileText,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { AudioaulasHero } from "@/components/audioaulas/home/AudioaulasHero";
import { capaDaArea } from "@/lib/audioaulasHelper";
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
import { useLeiArtigos } from "@/hooks/domain/useLeiArtigos";
import {
  extractLeiCapitulos,
  isStructuralArtigo,
  formatArtigoNumeroOnly,
  type LeiCapituloItem,
} from "@/lib/leiStructure";
import type { ArtigoLei } from "@/data/mockData";
import {
  AudioleiPlaylistSheet,
  type CapituloComAudiosData,
} from "@/components/audioleis/AudioleiPlaylistSheet";
import { AudioleiPlayerModal } from "@/components/audioleis/AudioleiPlayerModal";

interface NarracaoItem {
  artigo_numero: string;
  audio_url: string;
  titulo_artigo?: string;
  word_timings?: unknown;
}

interface LawOption {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  descricao: string;
  tipo: string;
  artigosCount?: number;
  status: "completo" | "em_breve";
  color: string;
}

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
  if (!matchA || !matchB) return a.localeCompare(b);
  const numA = parseInt(matchA[1], 10);
  const numB = parseInt(matchB[1], 10);
  if (numA !== numB) return numA - numB;
  return (matchA[2] || "").localeCompare(matchB[2] || "");
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function AudioleisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabelaParam = searchParams.get("tabela") || searchParams.get("lei");
  const artigoParam = searchParams.get("artigo");

  // Estados principais
  const [selectedTabela, setSelectedTabela] = useState<string>(() => {
    if (tabelaParam) {
      const match = LAWS_CONFIG.find(
        (l) =>
          l.tabela_nome.toLowerCase() === tabelaParam.toLowerCase() ||
          l.id.toLowerCase() === tabelaParam.toLowerCase() ||
          l.sigla.toLowerCase() === tabelaParam.toLowerCase(),
      );
      if (match) return match.tabela_nome;
    }
    return "CP_CODIGO_PENAL";
  });
  const [mostrarOutrasLeis, setMostrarOutrasLeis] = useState<boolean>(!tabelaParam);
  const {
    data: lawCounts,
    isLoading: loadingCatalog,
    isError: catalogError,
    refetch: reloadCatalog,
  } = useQuery({
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
  const availableLaws = LAWS_CONFIG.filter((law) => !lawCounts || lawCounts[law.tabela_nome] > 0);
  const catalogTotal = Object.values(lawCounts || {}).reduce((sum, count) => sum + count, 0);

  const [buscaCatalogo, setBuscaCatalogo] = useState("");
  const [categoriaFoco, setCategoriaFoco] = useState<"codigos" | "estatutos" | "especiais" | null>(
    null,
  );

  const refCarrosselCodigos = useRef<HTMLDivElement | null>(null);
  const refCarrosselEstatutos = useRef<HTMLDivElement | null>(null);
  const refCarrosselEspeciais = useRef<HTMLDivElement | null>(null);

  const scrollCarrossel = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
      haptic.selection();
      if (ref.current) {
        const scrollAmount = direction === "left" ? -380 : 380;
        ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    },
    [],
  );

  const codigosLaws = useMemo(() => {
    return availableLaws.filter((l) => l.tipo === "constituicao" || l.tipo === "codigo");
  }, [availableLaws]);

  const estatutosLaws = useMemo(() => {
    return availableLaws.filter((l) => l.tipo === "estatuto");
  }, [availableLaws]);

  const especiaisLaws = useMemo(() => {
    return availableLaws.filter(
      (l) => l.tipo !== "constituicao" && l.tipo !== "codigo" && l.tipo !== "estatuto",
    );
  }, [availableLaws]);

  const totalArtigosCodigos = useMemo(() => {
    if (!lawCounts) return 0;
    return codigosLaws.reduce((sum, l) => sum + (lawCounts[l.tabela_nome] || 0), 0);
  }, [codigosLaws, lawCounts]);

  const totalArtigosEstatutos = useMemo(() => {
    if (!lawCounts) return 0;
    return estatutosLaws.reduce((sum, l) => sum + (lawCounts[l.tabela_nome] || 0), 0);
  }, [estatutosLaws, lawCounts]);

  const totalArtigosEspeciais = useMemo(() => {
    if (!lawCounts) return 0;
    return especiaisLaws.reduce((sum, l) => sum + (lawCounts[l.tabela_nome] || 0), 0);
  }, [especiaisLaws, lawCounts]);

  const leisBuscadas = useMemo(() => {
    const q = buscaCatalogo.toLowerCase().trim();
    if (!q) return [];
    return availableLaws.filter(
      (l) =>
        l.nome.toLowerCase().includes(q) ||
        l.sigla.toLowerCase().includes(q) ||
        (l.descricao && l.descricao.toLowerCase().includes(q)),
    );
  }, [availableLaws, buscaCatalogo]);

  const { categoriaTitulo, categoriaLaws, totalArtigosCategoriaFoco } = useMemo(() => {
    if (categoriaFoco === "codigos") {
      return {
        categoriaTitulo: "Constituição & Códigos",
        categoriaLaws: codigosLaws,
        totalArtigosCategoriaFoco: totalArtigosCodigos,
      };
    }
    if (categoriaFoco === "estatutos") {
      return {
        categoriaTitulo: "Estatutos",
        categoriaLaws: estatutosLaws,
        totalArtigosCategoriaFoco: totalArtigosEstatutos,
      };
    }
    if (categoriaFoco === "especiais") {
      return {
        categoriaTitulo: "Legislação Especial",
        categoriaLaws: especiaisLaws,
        totalArtigosCategoriaFoco: totalArtigosEspeciais,
      };
    }
    return {
      categoriaTitulo: "Todas as Leis",
      categoriaLaws: availableLaws,
      totalArtigosCategoriaFoco: catalogTotal,
    };
  }, [
    categoriaFoco,
    codigosLaws,
    totalArtigosCodigos,
    estatutosLaws,
    totalArtigosEstatutos,
    especiaisLaws,
    totalArtigosEspeciais,
    availableLaws,
    catalogTotal,
  ]);

  const abrirLei = useCallback((law: LawOption) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentArtigo(null);
    setCurrentTime(0);
    setDuration(0);
    clearMediaSession();
    setSelectedTabela(law.tabela_nome);
    setSearchQuery("");
    setBuscaCatalogo("");
    setCategoriaFoco(null);
    setMostrarOutrasLeis(false);
    setSelectedCapituloParaPlaylist(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const audioleiGate = useGatedFeature("audiolei", "narracao");
  const audioleiGateRef = useRef(audioleiGate);
  audioleiGateRef.current = audioleiGate;
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: artigos = [],
    isLoading: loading,
    isError: articleError,
    refetch: reloadArticles,
  } = useQuery({
    queryKey: ["audioleis-artigos", selectedTabela],
    enabled: !mostrarOutrasLeis,
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const rows: NarracaoItem[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("narracoes_artigos")
          // Word timings are large and unused by this player. Fetch only its metadata.
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
          })),
        );
        if (!data || data.length < 1000) break;
      }
      const unique = new Map<string, NarracaoItem>();
      for (const row of rows) {
        const numero = row.artigo_numero
          .replace(/^Art(?:igo|\.)?\s*/i, "")
          .replace(/[º°ª]/g, "")
          .trim();
        if (numero && row.audio_url && !unique.has(numero))
          unique.set(numero, { ...row, artigo_numero: numero });
      }
      return Array.from(unique.values()).sort((a, b) =>
        sortArtigos(a.artigo_numero, b.artigo_numero),
      );
    },
  });
  const totalCount = artigos.length;

  // Player de Áudio
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
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentLaw = useMemo(() => {
    return LAWS_CONFIG.find((l) => l.tabela_nome === selectedTabela) || LAWS_CONFIG[0];
  }, [selectedTabela]);

  // A deep link must not strand the user in a law with no uploaded audio.
  useEffect(() => {
    if (!mostrarOutrasLeis && lawCounts && !lawCounts[selectedTabela]) {
      setMostrarOutrasLeis(true);
      toast.info("Esta lei ainda não possui áudios no acervo. Escolha uma das leis disponíveis.");
    }
  }, [lawCounts, selectedTabela, mostrarOutrasLeis]);

  // Filtragem com busca
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

  // Modo de exibição: Capítulos vs Artigos (conforme Vade Mecum)
  const [modoVisualizacao, setModoVisualizacao] = useState<"capitulos" | "artigos">("capitulos");
  const [selectedCapituloParaPlaylist, setSelectedCapituloParaPlaylist] =
    useState<CapituloComAudiosData | null>(null);

  // Carrega a estrutura completa dos artigos da lei para extração de capítulos
  const { artigos: fullArtigos = [], loadingArtigos } = useLeiArtigos(
    currentLaw.id,
    selectedTabela,
  );

  const capitulos = useMemo(() => extractLeiCapitulos(fullArtigos as ArtigoLei[]), [fullArtigos]);

  // Mapeamento rápido de áudios disponíveis por número de artigo
  const audioMap = useMemo(() => {
    const map = new Map<string, NarracaoItem>();
    for (const item of artigos) {
      const clean = formatArtigoNumeroOnly(item.artigo_numero).toLowerCase();
      if (clean) map.set(clean, item);
      map.set(item.artigo_numero.toLowerCase(), item);
    }
    return map;
  }, [artigos]);

  // Estatísticas e agrupamento de áudios por capítulo
  const capitulosComAudios = useMemo(() => {
    if (!capitulos || capitulos.length === 0) return [];
    return capitulos.map((cap) => {
      const realArtigos = cap.artigos.filter((a) => !isStructuralArtigo(a));
      const audiosDisponiveis: Array<{ artigo: ArtigoLei; narracao: NarracaoItem }> = [];

      for (const art of realArtigos) {
        const clean = formatArtigoNumeroOnly(art.numero).toLowerCase();
        const raw = String(art.numero || "")
          .trim()
          .toLowerCase();
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

  // Fallback caso a lei não possua divisão formal de capítulos (agrupamento dinâmico em blocos)
  const fallbackCapitulosComAudios = useMemo(() => {
    if (capitulosComAudios.length > 0) return capitulosComAudios;
    if (!artigos || artigos.length === 0) return [];

    const chunkSize = 50;
    const groups: typeof capitulosComAudios = [];
    for (let i = 0; i < artigos.length; i += chunkSize) {
      const chunk = artigos.slice(i, i + chunkSize);
      const primeiro = chunk[0].artigo_numero;
      const ultimo = chunk[chunk.length - 1].artigo_numero;
      const capFake: LeiCapituloItem = {
        id: `bloco-${i}`,
        capituloHead: `BLOCO ${Math.floor(i / chunkSize) + 1}`,
        capituloNome: `Artigos ${primeiro} a ${ultimo}`,
        artigos: chunk.map(
          (c) =>
            ({
              id: c.artigo_numero,
              numero: c.artigo_numero,
              caput: c.titulo_artigo || `Artigo ${c.artigo_numero}`,
              tipo: "artigo",
            }) as ArtigoLei,
        ),
        primeiroArtigo: primeiro,
        ultimoArtigo: ultimo,
      };

      groups.push({
        capitulo: capFake,
        realArtigos: capFake.artigos,
        audiosDisponiveis: chunk.map((c) => ({
          artigo: capFake.artigos.find((a) => a.numero === c.artigo_numero)!,
          narracao: c,
        })),
        totalArts: chunk.length,
        totalAudios: chunk.length,
        pctGravado: 100,
      });
    }
    return groups;
  }, [capitulosComAudios, artigos]);

  // Capítulos filtrados por busca
  const displayedCapitulos = useMemo(() => {
    const source = capitulosComAudios.length > 0 ? capitulosComAudios : fallbackCapitulosComAudios;
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

  // Se o usuário digitou um número de artigo específico na busca, expande automaticamente o capítulo
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery
      .toLowerCase()
      .trim()
      .replace(/^art(?:igo|\.)?\s*/i, "")
      .replace(/[º°ª]/g, "");
    if (!q) return;

    const found = displayedCapitulos.find(({ realArtigos }) =>
      realArtigos.some((a) => formatArtigoNumeroOnly(a.numero).toLowerCase() === q),
    );
    if (found) {
      setSelectedCapituloParaPlaylist(found);
    }
  }, [searchQuery, displayedCapitulos]);

  // Inicialização e controle do áudio nativo
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

      if (currentArtigo?.artigo_numero === item.artigo_numero && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      if (currentArtigo?.artigo_numero === item.artigo_numero && !isPlaying) {
        audio.play().catch(console.error);
        setIsPlaying(true);
        setIsPlayerModalOpen(true);
        return;
      }

      // Novo artigo
      setCurrentArtigo(item);
      audio.src = item.audio_url;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      setCurrentTime(0);
      setIsPlayerModalOpen(true);

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
    [currentArtigo, isPlaying, playbackRate, currentLaw, selectedTabela],
  );

  const togglePlay = useCallback(() => {
    if (currentArtigo) {
      playAudio(currentArtigo);
    }
  }, [currentArtigo, playAudio]);

  const deepLinkPlayed = useRef<string | null>(null);
  useEffect(() => {
    if (!artigoParam || loading || mostrarOutrasLeis || artigos.length === 0) return;
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
  }, [artigoParam, artigos, loading, mostrarOutrasLeis, selectedTabela, playAudio]);

  // Ouvintes do HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);

      if (autoplayNext && currentArtigo) {
        const currentIdx = artigos.findIndex(
          (a) => a.artigo_numero === currentArtigo.artigo_numero,
        );
        if (currentIdx >= 0 && currentIdx < artigos.length - 1) {
          const next = artigos[currentIdx + 1];
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
  }, [currentArtigo, artigos, autoplayNext, playAudio]);

  // Alteração de velocidade
  const changeSpeed = (rate: number) => {
    haptic.selection();
    setPlaybackRate(rate);
    try {
      localStorage.setItem("vademecum_audio_speed", String(rate));
    } catch {
      // Ignora erro de acesso ao localStorage
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Fila atual de artigos para o modal do player
  const playlistModalArtigos = useMemo(() => {
    if (selectedCapituloParaPlaylist && selectedCapituloParaPlaylist.audiosDisponiveis.length > 0) {
      return selectedCapituloParaPlaylist.audiosDisponiveis.map((a) => a.narracao);
    }
    return artigos;
  }, [selectedCapituloParaPlaylist, artigos]);

  // Detalhes textuais (caput) do artigo em reprodução
  const artigoDetalhe = useMemo(() => {
    if (!currentArtigo || !fullArtigos) return null;
    const clean = formatArtigoNumeroOnly(currentArtigo.artigo_numero).toLowerCase();
    return (
      (fullArtigos as ArtigoLei[]).find(
        (a) => formatArtigoNumeroOnly(a.numero).toLowerCase() === clean,
      ) || null
    );
  }, [currentArtigo, fullArtigos]);

  // Nome do capítulo ativo
  const currentCapituloNome = useMemo(() => {
    if (selectedCapituloParaPlaylist?.capitulo?.capituloNome) {
      return selectedCapituloParaPlaylist.capitulo.capituloNome;
    }
    if (currentArtigo && capitulosComAudios.length > 0) {
      const clean = formatArtigoNumeroOnly(currentArtigo.artigo_numero).toLowerCase();
      const found = capitulosComAudios.find((c) =>
        c.realArtigos.some((a) => formatArtigoNumeroOnly(a.numero).toLowerCase() === clean),
      );
      if (found) return found.capitulo.capituloNome;
    }
    return undefined;
  }, [selectedCapituloParaPlaylist, currentArtigo, capitulosComAudios]);

  // Pular para o próximo ou anterior considerando a playlist ativa
  const pularArtigo = (direction: "next" | "prev") => {
    if (!currentArtigo) return;
    const listaAtual = playlistModalArtigos.length > 0 ? playlistModalArtigos : artigos;
    const currentIdx = listaAtual.findIndex(
      (a) =>
        a.artigo_numero.toLowerCase() ===
        currentArtigo.artigo_numero.toLowerCase(),
    );
    if (currentIdx === -1) return;

    const nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < listaAtual.length) {
      playAudio(listaAtual[nextIdx]);
    } else {
      toast.info(direction === "next" ? "Fim da lista de artigos." : "Primeiro artigo da lista.");
    }
  };

  // Navegar para o texto completo do artigo no Vade Mecum
  const irParaArtigoVadeMecum = (numArtigo: string) => {
    haptic.selection();
    const lei = LEIS_CATALOG.find((l) => l.tabela_nome === selectedTabela);
    if (lei) {
      const slug = leiToSlug({ id: lei.id, nome: lei.nome });
      navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${slug}/${encodeURIComponent(numArtigo)}`);
    } else {
      navigate("/vademecum");
    }
  };

  // Limpeza ao sair da página
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearMediaSession();
    };
  }, []);

  const renderCardCarrossel = (law: LawOption) => {
    const artigosQtd = lawCounts ? lawCounts[law.tabela_nome] || 0 : 0;
    const areaCapa = COVER_AREAS[law.id] || law.nome;
    const capaUrl = capaDaArea(areaCapa);

    return (
      <button
        key={law.id}
        type="button"
        onClick={() => abrirLei(law)}
        aria-label={`Abrir ${law.nome}`}
        className="group relative w-40 sm:w-48 md:w-52 aspect-square shrink-0 snap-start rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
      >
        <img
          src={capaUrl}
          alt={law.nome}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

        <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="h-8 w-8 sm:h-8.5 sm:w-8.5 grid place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-md shadow-black/50">
              <Volume2 className="h-4 w-4" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-black/65 text-white border border-white/20 backdrop-blur shadow-sm">
              {law.sigla}
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-sans font-bold leading-snug text-white text-[13px] sm:text-[14px] line-clamp-2 tracking-normal normal-case drop-shadow-sm">
              {law.nome}
            </p>
            <p className="font-sans text-[11px] sm:text-xs text-zinc-300 font-medium tracking-normal">
              {artigosQtd > 0 ? `${artigosQtd.toLocaleString("pt-BR")} artigos` : "Ver artigos"}
            </p>
          </div>
        </div>
      </button>
    );
  };

  const renderCardGrid = (law: LawOption) => {
    const artigosQtd = lawCounts ? lawCounts[law.tabela_nome] || 0 : 0;
    const areaCapa = COVER_AREAS[law.id] || law.nome;
    const capaUrl = capaDaArea(areaCapa);

    return (
      <button
        key={law.id}
        type="button"
        onClick={() => abrirLei(law)}
        aria-label={`Abrir ${law.nome}`}
        className="group relative w-full aspect-square rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
      >
        <img
          src={capaUrl}
          alt={law.nome}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

        <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="h-8 w-8 sm:h-8.5 sm:w-8.5 grid place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-md shadow-black/50">
              <Volume2 className="h-4 w-4" />
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-black/65 text-white border border-white/20 backdrop-blur shadow-sm">
              {law.sigla}
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-sans font-bold leading-snug text-white text-[13px] sm:text-[14px] line-clamp-2 tracking-normal normal-case drop-shadow-sm">
              {law.nome}
            </p>
            <p className="font-sans text-[11px] sm:text-xs text-zinc-300 font-medium tracking-normal">
              {artigosQtd > 0 ? `${artigosQtd.toLocaleString("pt-BR")} artigos` : "Ver artigos"}
            </p>
          </div>
        </div>
      </button>
    );
  };

  const renderSecaoCarrossel = (
    titulo: string,
    subtitulo: string,
    laws: LawOption[],
    refRail: React.RefObject<HTMLDivElement | null>,
    tipoCategoria: "codigos" | "estatutos" | "especiais",
  ) => {
    if (laws.length === 0) return null;

    return (
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-foreground text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
              <span className="truncate">{titulo}</span>
            </h2>
            <p className="font-sans text-muted-foreground text-[12px] sm:text-[12.5px] leading-snug ml-3 truncate">
              {subtitulo}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                haptic.selection();
                setCategoriaFoco(tipoCategoria);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition active:scale-95"
              aria-label={`Ver todos os ${titulo}`}
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="hidden sm:flex items-center gap-1 pl-1">
              <button
                onClick={() => scrollCarrossel(refRail, "left")}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarrossel(refRail, "right")}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={refRail}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none select-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {laws.map((law) => renderCardCarrossel(law))}
        </div>
      </section>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {audioleiGate.gateNode}
      {/* Background ShapeGrid oficial */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <ShapeGrid />
      </div>

      <AudioaulasHero
        areaAtual={mostrarOutrasLeis ? null : COVER_AREAS[currentLaw.id] || currentLaw.nome}
        loading={mostrarOutrasLeis ? loadingCatalog : loading}
        tituloCustom={
          mostrarOutrasLeis ? (categoriaFoco ? categoriaTitulo : "Audioleis") : currentLaw.sigla
        }
        unidadeCustom="artigos"
        subtituloCustom={
          mostrarOutrasLeis
            ? categoriaFoco
              ? `${categoriaLaws.length} leis disponíveis para escuta artigo por artigo.`
              : "Leis narradas, artigo por artigo."
            : currentLaw.nome
        }
        onVoltar={() => {
          haptic.impact();
          if (!mostrarOutrasLeis) {
            setMostrarOutrasLeis(true);
            setSearchQuery("");
          } else if (categoriaFoco) {
            setCategoriaFoco(null);
          } else if (buscaCatalogo) {
            setBuscaCatalogo("");
          } else {
            navigate("/");
          }
        }}
        totalAulas={
          mostrarOutrasLeis
            ? categoriaFoco
              ? totalArtigosCategoriaFoco
              : catalogTotal
            : totalCount
        }
      />

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        {mostrarOutrasLeis ? (
          <div className="space-y-6">
            {catalogError ? (
              <div
                role="alert"
                className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-foreground flex items-center justify-between"
              >
                <span>Não foi possível carregar o catálogo de leis.</span>
                <Button variant="outline" size="sm" onClick={() => void reloadCatalog()}>
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {/* Barra de Pesquisa de Leis do Catálogo */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={buscaCatalogo}
                onChange={(e) => setBuscaCatalogo(e.target.value)}
                placeholder="Pesquisar código, estatuto ou lei (ex: Penal, ECA, CLT, 8.112)..."
                className="w-full bg-card/80 border border-border rounded-2xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {buscaCatalogo && (
                <button
                  type="button"
                  onClick={() => setBuscaCatalogo("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Visualização 1: Busca Ativa */}
            {buscaCatalogo.trim().length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {leisBuscadas.length === 0
                      ? `Nenhuma lei encontrada para "${buscaCatalogo}"`
                      : `${leisBuscadas.length} ${leisBuscadas.length === 1 ? "lei encontrada" : "leis encontradas"}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBuscaCatalogo("")}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Limpar busca
                  </button>
                </div>
                {leisBuscadas.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {leisBuscadas.map((law) => renderCardGrid(law))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <p className="text-sm">Nenhum resultado corresponde ao termo digitado.</p>
                    <p className="text-xs">
                      Tente buscar pela sigla (ex: CP, CC, ECA, LEP) ou pelo nome.
                    </p>
                  </div>
                )}
              </div>
            ) : categoriaFoco ? (
              /* Visualização 2: "Ver todos" de uma Categoria */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoriaFoco(null)}
                    className="gap-2 -ml-2 text-zinc-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar às categorias</span>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {categoriaLaws.length} leis ·{" "}
                    {totalArtigosCategoriaFoco.toLocaleString("pt-BR")} artigos
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {categoriaLaws.map((law) => renderCardGrid(law))}
                </div>
              </div>
            ) : (
              /* Visualização 3: Hub com 3 Carrosséis por Categoria */
              <div className="space-y-9">
                {renderSecaoCarrossel(
                  "Constituição & Códigos",
                  `${codigosLaws.length} códigos · ${totalArtigosCodigos.toLocaleString("pt-BR")} artigos narrados`,
                  codigosLaws,
                  refCarrosselCodigos,
                  "codigos",
                )}

                {renderSecaoCarrossel(
                  "Estatutos",
                  `${estatutosLaws.length} estatutos · ${totalArtigosEstatutos.toLocaleString("pt-BR")} artigos narrados`,
                  estatutosLaws,
                  refCarrosselEstatutos,
                  "estatutos",
                )}

                {renderSecaoCarrossel(
                  "Legislação Especial",
                  `${especiaisLaws.length} leis especiais · ${totalArtigosEspeciais.toLocaleString("pt-BR")} artigos narrados`,
                  especiaisLaws,
                  refCarrosselEspeciais,
                  "especiais",
                )}
              </div>
            )}
          </div>
        ) : (
          /* Lei Selecionada: Alternância Por Capítulo / Por Artigo */
          <>
            {/* Menu de Alternância (Pill Switcher) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="inline-flex items-center p-1 rounded-2xl bg-card border border-border shadow-sm self-start">
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
                  <span>Por Capítulo</span>
                  {displayedCapitulos.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        modoVisualizacao === "capitulos"
                          ? "bg-black/30 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {displayedCapitulos.length}
                    </span>
                  )}
                </button>

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
                  <span>Por Artigo</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      modoVisualizacao === "artigos"
                        ? "bg-black/30 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {filteredArtigos.length}
                  </span>
                </button>
              </div>

              <span className="text-xs text-muted-foreground font-medium truncate hidden sm:inline">
                {currentLaw.nome}
              </span>
            </div>

            {/* Barra de Busca de Artigo / Capítulo */}
            <section className="mb-6">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    modoVisualizacao === "capitulos"
                      ? "Buscar por capítulo, tema ou número do artigo (ex: 121)..."
                      : "Digite o número do artigo (ex: 121, 54-A) ou tema..."
                  }
                  className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-card"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </section>

            {/* Conteúdo Dinâmico Conforme o Menu de Alternância */}
            {modoVisualizacao === "capitulos" ? (
              /* Visualização Por Capítulos (Estilo Vade Mecum) */
              <section className="space-y-3.5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Capítulos da Lei ({displayedCapitulos.length})
                  </h2>
                </div>

                {loadingArtigos && displayedCapitulos.length === 0 ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-28 bg-card border border-border rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : displayedCapitulos.length === 0 ? (
                  <div className="p-12 text-center bg-card border border-border rounded-3xl">
                    <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">
                      Nenhum capítulo encontrado
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                      Tente outro termo ou número de artigo, ou alterne para a visualização por
                      artigo.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setModoVisualizacao("artigos");
                      }}
                    >
                      Ver todos os artigos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedCapitulos.map((itemData, idx) => {
                      const {
                        capitulo,
                        realArtigos,
                        totalArts,
                        totalAudios,
                        pctGravado,
                      } = itemData;

                      const rangeText =
                        capitulo.primeiroArtigo && capitulo.ultimoArtigo
                          ? capitulo.primeiroArtigo === capitulo.ultimoArtigo
                            ? `(Art. ${capitulo.primeiroArtigo})`
                            : `(Arts. ${capitulo.primeiroArtigo} a ${capitulo.ultimoArtigo})`
                          : "";

                      const isPlayingInThisChapter =
                        Boolean(currentArtigo && isPlaying) &&
                        realArtigos.some((a) => {
                          const numClean = formatArtigoNumeroOnly(a.numero);
                          return (
                            numClean.toLowerCase() === currentArtigo?.artigo_numero.toLowerCase()
                          );
                        });

                      return (
                        <div
                          key={capitulo.id || idx}
                          onClick={() => {
                            haptic.selection();
                            setSelectedCapituloParaPlaylist(itemData);
                          }}
                          className={`group rounded-2xl transition-all border overflow-hidden shadow-sm hover:shadow-md cursor-pointer ${
                            isPlayingInThisChapter
                              ? "bg-card border-primary/60 ring-2 ring-primary/30 shadow-xl shadow-primary/10"
                              : "bg-card/90 border-border hover:border-border/90 hover:bg-card"
                          }`}
                        >
                          <div className="w-full text-left flex items-stretch p-0 transition-transform active:scale-[0.995]">
                            <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-primary shrink-0">
                                    {capitulo.capituloHead || "CAPÍTULO"}
                                  </span>
                                  {capitulo.parentContext && (
                                    <span className="text-[11px] text-muted-foreground font-medium truncate hidden sm:inline">
                                      • {capitulo.parentContext}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isPlayingInThisChapter && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-bold tracking-wider uppercase animate-pulse shadow-sm shadow-primary/20">
                                      <Volume2 className="w-3 h-3" />
                                      <span>Tocando</span>
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border tabular-nums shrink-0 ${
                                      totalAudios > 0
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                                  >
                                    {totalAudios > 0
                                      ? `${totalAudios} ${totalAudios === 1 ? "áudio" : "áudios"}`
                                      : "Em breve"}
                                  </span>
                                </div>
                              </div>

                              {/* Título com tipografia nítida e elegante */}
                              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-normal font-sans">
                                {capitulo.capituloNome}
                              </h3>

                              {rangeText && (
                                <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                                  {rangeText}
                                </p>
                              )}

                              {/* Barra de progresso de áudios gravados */}
                              {totalArts > 0 && (
                                <div className="mt-2.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-secondary/80">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      totalAudios > 0
                                        ? "bg-linear-to-r from-primary to-emerald-400"
                                        : "bg-muted"
                                    }`}
                                    style={{
                                      width: `${Math.max(totalAudios > 0 ? 8 : 0, pctGravado)}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Indicador de abertura de Playlist */}
                            <div className="flex items-center pr-4 sm:pr-5 shrink-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/80 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground flex items-center justify-center transition-all shadow-sm">
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : (
              /* Visualização Por Artigo (Lista Completa, sem o checkbox Tocar Próximo) */
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Artigos com Narração ({filteredArtigos.length})
                  </h2>
                </div>

                {articleError ? (
                  <div role="alert" className="py-8 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Não foi possível carregar os áudios desta lei.
                    </p>
                    <Button variant="outline" onClick={() => void reloadArticles()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-card border border-border rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredArtigos.length === 0 ? (
                  <div className="p-12 text-center bg-card border border-border rounded-3xl">
                    <Volume2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">
                      Nenhum artigo encontrado
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Tente buscar por outro número de artigo ou limpe o filtro de busca.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredArtigos.map((item) => {
                      const isSelected = currentArtigo?.artigo_numero === item.artigo_numero;
                      const activeThis = isSelected && isPlaying;

                      return (
                        <div
                          key={item.artigo_numero}
                          className={`group relative p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5"
                              : "bg-card border-border hover:bg-card hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Botão Play/Pause Direto */}
                            <Button
                              variant="ghost"
                              onClick={() => playAudio(item)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                                activeThis
                                  ? "bg-primary text-foreground shadow-lg shadow-primary/40 scale-105"
                                  : isSelected
                                    ? "bg-primary/20 text-primary border border-primary/40"
                                    : "bg-card text-muted-foreground hover:bg-primary hover:text-foreground border border-border"
                              }`}
                              aria-label={activeThis ? "Pausar" : "Ouvir Artigo"}
                            >
                              {activeThis ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              )}
                            </Button>

                            {/* Info do Artigo */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-heading font-black text-sm text-foreground tracking-wide">
                                  Art. {item.artigo_numero}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-card text-muted-foreground border border-border">
                                  MP3
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {item.titulo_artigo || `${currentLaw.sigla} — Narração em Áudio`}
                              </p>
                            </div>
                          </div>

                          {/* Ação de abrir texto no Vade Mecum */}
                          <Button
                            variant="ghost"
                            onClick={() => irParaArtigoVadeMecum(item.artigo_numero)}
                            className="w-9 h-9 rounded-xl bg-card hover:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 active:scale-95"
                            title="Ler artigo completo no Vade Mecum"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Miniplayer Fixo no Rodapé */}
      {currentArtigo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border shadow-[0_-15px_45px_rgba(0,0,0,0.85)] pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-2.5">
          <div className="max-w-4xl mx-auto px-4">
            {/* Barra de Progresso com Scrub interativo */}
            <div
              className="h-2 rounded-full bg-white/10 hover:bg-white/15 overflow-hidden cursor-pointer mb-2.5 relative group transition-colors"
              onClick={(e) => {
                const audio = audioRef.current;
                if (!audio || !audio.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                audio.currentTime = pct * audio.duration;
              }}
            >
              <div
                className="h-full bg-linear-to-r from-primary via-primary to-amber-400 rounded-full transition-[width] duration-100 ease-out"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Título do Artigo em Reprodução (Toque para expandir player) */}
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all group"
                onClick={() => {
                  haptic.selection();
                  setIsPlayerModalOpen(true);
                }}
                title="Toque para expandir player"
              >
                <span
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all ${
                    isPlaying
                      ? "bg-primary text-primary-foreground shadow-primary/30"
                      : "bg-primary/20 border border-primary/40 text-primary"
                  }`}
                >
                  <Volume2 className={`w-5 h-5 ${isPlaying ? "animate-pulse" : ""}`} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                      Art. {currentArtigo.artigo_numero}
                    </span>
                    <span className="text-xs text-primary font-semibold shrink-0">
                      {currentLaw.sigla}
                    </span>
                    {isPlaying && (
                      <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                        Áudio
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground tabular-nums mt-0.5">
                    <span>{formatAudioTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatAudioTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Controles Principais */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Botão de Velocidade no Mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    haptic.selection();
                    const speeds = [1, 1.25, 1.5, 2];
                    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
                    changeSpeed(speeds[nextIdx]);
                  }}
                  className="sm:hidden px-2 h-9 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-primary hover:bg-white/10"
                  title="Alterar velocidade"
                >
                  {playbackRate}x
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => pularArtigo("prev")}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
                  aria-label="Artigo Anterior"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </Button>

                <Button
                  variant="default"
                  onClick={() => playAudio(currentArtigo)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition"
                  aria-label={isPlaying ? "Pausar" : "Tocar"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => pularArtigo("next")}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
                  aria-label="Próximo Artigo"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </Button>

                {/* Atalho para ler no Vade Mecum */}
                <Button
                  variant="ghost"
                  onClick={() => irParaArtigoVadeMecum(currentArtigo.artigo_numero)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card hover:bg-white/10 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
                  title="Ler texto completo no Vade Mecum"
                  aria-label="Ler no Vade Mecum"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>

                {/* Fechar miniplayer */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                    setCurrentArtigo(null);
                  }}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 p-0 ml-0.5"
                  title="Fechar player"
                  aria-label="Fechar player"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Seletor de Velocidade no Desktop */}
              <div className="hidden sm:flex items-center gap-1 shrink-0 border-l border-border pl-3">
                {[1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    variant="ghost"
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      playbackRate === speed
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sheet deslizante de baixo para cima estilo Playlist do Capítulo */}
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

      {/* Player Modal Completo Deslizante de Baixo para Cima (Estilo Audioaulas) */}
      <AudioleiPlayerModal
        isOpen={isPlayerModalOpen && Boolean(currentArtigo)}
        onClose={() => setIsPlayerModalOpen(false)}
        currentArtigo={currentArtigo}
        currentLaw={currentLaw}
        capituloNome={currentCapituloNome}
        artigoDetalhe={artigoDetalhe}
        playlistArtigos={playlistModalArtigos}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onTogglePlay={togglePlay}
        onPlayAudio={(item) => {
          playAudio(item);
        }}
        onSeek={(seconds) => {
          if (audioRef.current) {
            audioRef.current.currentTime = seconds;
            setCurrentTime(seconds);
          }
        }}
        onSkip={pularArtigo}
        onChangeSpeed={changeSpeed}
        onIrParaVadeMecum={irParaArtigoVadeMecum}
      />
    </div>
  );
}
