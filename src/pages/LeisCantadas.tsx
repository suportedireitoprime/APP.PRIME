import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Play, Pause, SkipBack, SkipForward, Loader2, ChevronDown, Mic2, FileText, ThumbsUp, ThumbsDown, Share2, Flame, Heart, Lock, Scale, BookOpen, Landmark, Briefcase, Headphones, ArrowUpDown, Eye, EyeOff, ExternalLink, Download, Minus, Plus, Search, ListMusic, ListPlus, X, Check, ArrowLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { toast } from "sonner";
import {
  fetchArtigoDetalhe,
  fetchLeisCantadasStats,
  fetchMinhasCurtidas,
  alternarCurtida,
  fetchTodosResumosCantados,
  resumoParaFaixa,
  type LeiCantada,
  type LeiCantadaStat,
  type ResumoCantado,
} from "@/lib/leisCantadasApi";
import { useLeisCantadasPlayer } from "@/contexts/LeisCantadasPlayerContext";
import { parseLetra, linhaAtivaIndex, formatarArtigoVadeMecum, limparAnotacoes } from "@/lib/leisCantadasFormat";
import { getPlanaltoUrl } from "@/services/legislacaoService";
import capaPenal from "@/assets/direito-penal.webp.asset.json";
import capaCivil from "@/assets/direito-civil.webp.asset.json";
import capaConstituicao from "@/assets/direito-constituicao.webp.asset.json";
import capaClt from "@/assets/direito-clt.webp.asset.json";
import { srcOf } from "@/lib/assetUrl";
import { VideoCapa, VIDEO_URL, POSTER_URL, usePrewarmVideo } from "@/components/leis-cantadas/VideoCapa";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import LeisCantadasBottomNav, { type LeisCantadasTab } from "@/components/leis-cantadas/LeisCantadasBottomNav";
import { baixarBlob } from '@/lib/nativo';
import { copiarTexto } from '@/lib/nativo/copiar';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  suportaAudioOffline,
  assinarAudioOffline,
} from '@/lib/nativo/audioOffline';

const CAPA_PENAL = srcOf(capaPenal);

const AREAS_EM_BREVE = [
  { nome: "Direito Civil", Icon: BookOpen, capa: srcOf(capaCivil) },
  { nome: "Constituição", Icon: Landmark, capa: srcOf(capaConstituicao) },
  { nome: "CLT", Icon: Briefcase, capa: srcOf(capaClt) },
];

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Ordena por número do artigo (numérico crescente), tratando sufixos "-A".
function numArtigo(n: string | null | undefined): number {
  const m = String(n ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

// Favoritos por dispositivo (localStorage).
const FAV_KEY = "lc_favoritos";
function lerFavoritos(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); }
}
function salvarFavoritos(s: Set<string>) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

// Minha Playlist por dispositivo (localStorage).
const PLAYLIST_KEY = "lc_playlist";
function lerPlaylist(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "[]")); } catch { return new Set(); }
}
function salvarPlaylist(s: Set<string>) {
  try { localStorage.setItem(PLAYLIST_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

function normalizar(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function fmtN(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k";
  return String(n);
}

function RankRow({ f, pos, valor, unidade, onClick }: {
  f: LeiCantada; pos: number; valor: number; unidade: string; onClick: () => void;
}) {
  const destaque = pos <= 3;

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl text-left transition focus-visible:outline-none ${destaque ? "p-3 bg-white/5 hover:bg-white/10" : "p-2.5 hover:bg-white/5"}`}
    >
      <span className={`text-center font-black shrink-0 ${destaque ? "w-7 text-2xl text-fuchsia-300" : "w-6 text-lg text-muted-foreground"}`}>{pos}</span>
      <span className={`relative shrink-0 rounded-lg overflow-hidden ${destaque ? "h-14 w-14" : "h-11 w-11"}`}>
        <img src={CAPA_PENAL} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
          <Play className={destaque ? "h-5 w-5" : "h-4 w-4"} />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold truncate ${destaque ? "text-[15px]" : "text-sm"}`}>{f.titulo || `Art. ${f.numero_artigo}`}</p>
        <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{valor} {unidade}</span>
    </motion.button>
  );
}

export default function LeisCantadasPage() {
  const navigate = useNavigate();

  // Playback global (continua tocando ao navegar pelo app)
  const {
    faixas, loading, atualId, atual, atualIdx, tocando, tempo, dur,
    aberto, setAberto, tocar, pular, seek: seekTo,
  } = useLeisCantadasPlayer();

  const [aba, setAba] = useState<"karaoke" | "letra">("karaoke");
  const [artigoRaw, setArtigoRaw] = useState<string | null>(null);
  const [carregandoArtigo, setCarregandoArtigo] = useState(false);
  const [revelarRedacao, setRevelarRedacao] = useState(false);
  const [tela, setTela] = useState<"hub" | "lista">("hub");
  const [rankAba, setRankAba] = useState<"ouvidas" | "curtidas">("ouvidas");
  const [stats, setStats] = useState<Map<string, LeiCantadaStat>>(new Map());
  const [curtidas, setCurtidas] = useState<Set<string>>(new Set());
  const [naoCurtidas, setNaoCurtidas] = useState<Set<string>>(new Set());
  const [ordenar, setOrdenar] = useState<"ordem" | "ouvidas" | "curtidas">("ordem");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [soCurtidas, setSoCurtidas] = useState(false);
  const [soPlaylist, setSoPlaylist] = useState(false);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | "leis" | "resumos">("todos");
  const [resumos, setResumos] = useState<ResumoCantado[]>([]);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => lerFavoritos());
  const [playlist, setPlaylist] = useState<Set<string>>(() => lerPlaylist());
  const [sheetAberto, setSheetAberto] = useState(false);
  const [sheetFiltro, setSheetFiltro] = useState<"playlist" | "buscar" | "favoritos" | "curtidas">("playlist");
  const [resumoFontSize, setResumoFontSize] = useState<number>(17);
  const [artigoFontSize, setArtigoFontSize] = useState<number>(17);
  const [verTodos, setVerTodos] = useState(false);
  const linhaRef = useRef<HTMLParagraphElement | null>(null);
  const artigoCache = useRef<Map<string, string>>(new Map());
  const buscaRef = useRef<HTMLInputElement | null>(null);

  const alternarFavorito = (id: string) => {
    setFavoritos((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      salvarFavoritos(n);
      return n;
    });
  };

  const alternarPlaylist = (id: string) => {
    setPlaylist((s) => {
      const n = new Set(s);
      const tinha = n.has(id);
      tinha ? n.delete(id) : n.add(id);
      salvarPlaylist(n);
      toast.success(tinha ? "Removido da sua playlist" : "Adicionado à playlist");
      return n;
    });
  };

  const limparFiltros = () => {
    setSoFavoritos(false);
    setSoCurtidas(false);
    setSoPlaylist(false);
  };

  const irParaFiltro = (f: "playlist" | "buscar" | "favoritos" | "curtidas") => {
    setTipo("todos");
    setOrdenar("ordem");
    setSoFavoritos(f === "favoritos");
    setSoCurtidas(f === "curtidas");
    setSoPlaylist(f === "playlist");
    if (f !== "buscar") setBusca("");
    setSheetFiltro(f);
    setSheetAberto(true);
    if (f === "buscar") window.setTimeout(() => buscaRef.current?.focus(), 200);
  };

  useEffect(() => {
    fetchLeisCantadasStats().then(setStats).catch(() => {});
    fetchMinhasCurtidas().then(setCurtidas).catch(() => {});
    fetchTodosResumosCantados().then(setResumos).catch(() => {});
  }, []);

  usePrewarmVideo();

  // Integra o "voltar" global com as telas internas.
  useEffect(() => {
    if (tela !== "lista" && !aberto) return;
    window.history.pushState({ leisCantadasInterno: true }, "");
    const onPop = () => {
      if (aberto) setAberto(false);
      else setTela("hub");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [tela, aberto, setAberto]);

  // Carrega o texto (bruto) do artigo da faixa atual
  useEffect(() => {
    setRevelarRedacao(false);
    if (!atual || atual.slug === "resumo") { setArtigoRaw(null); return; }
    const key = `${atual.tabela_codigo}:${atual.artigo_id}`;
    if (artigoCache.current.has(key)) { setArtigoRaw(artigoCache.current.get(key)!); return; }
    setCarregandoArtigo(true);
    setArtigoRaw(null);
    fetchArtigoDetalhe(atual.tabela_codigo, atual.artigo_id)
      .then((d) => {
        const t = d?.texto ?? "";
        artigoCache.current.set(key, t);
        setArtigoRaw(t);
      })
      .catch(() => setArtigoRaw(""))
      .finally(() => setCarregandoArtigo(false));
  }, [atual?.tabela_codigo, atual?.artigo_id, atual?.slug]);

  // Texto formatado no mesmo estilo do Vade Mecum (§/incisos/alíneas).
  const artigoTexto = useMemo(() => {
    if (artigoRaw == null) return null;
    const semPrefixo = artigoRaw.replace(/^\s*art(?:igo)?\.?\s*\d+[º°]?(?:-[A-Za-z])?\s*[-–—.]+\s*/i, "");
    const base = revelarRedacao ? semPrefixo : limparAnotacoes(semPrefixo);
    return formatarArtigoVadeMecum(base);
  }, [artigoRaw, revelarRedacao]);

  const temRedacao = useMemo(
    () => /\([^()]*(reda[çc][ãa]o|inclu[íi]d|vig[êe]ncia|revogad|renumerad)[^()]*\)/i.test(artigoRaw || ""),
    [artigoRaw]
  );

  const planaltoUrl = atual && atual.tabela_codigo ? getPlanaltoUrl(atual.tabela_codigo) : null;

  const linhas = useMemo(() => parseLetra(atual?.letra), [atual?.letra]);

  const linhaAtiva = useMemo(
    () => linhaAtivaIndex(tempo, dur, linhas.length, atual?.letra_sync),
    [tempo, dur, linhas.length, atual?.letra_sync]
  );

  useEffect(() => {
    if (aba === "karaoke") {
      linhaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [linhaAtiva, aba]);

  const abrirFaixa = (f: LeiCantada) => {
    setSheetAberto(false);
    setAba("karaoke");
    setAberto(true);
    if (atualId !== f.id) tocar(f);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const curtir = async () => {
    if (!atual) return;
    const id = atual.id;
    const jaCurtido = curtidas.has(id);
    setCurtidas((s) => { const n = new Set(s); jaCurtido ? n.delete(id) : n.add(id); return n; });
    setStats((m) => {
      const n = new Map(m);
      const cur = n.get(id) ?? { musica_id: id, plays: 0, likes: 0 };
      n.set(id, { ...cur, likes: Math.max(0, cur.likes + (jaCurtido ? -1 : 1)) });
      return n;
    });
    try {
      await alternarCurtida(id);
    } catch {
      setCurtidas((s) => { const n = new Set(s); jaCurtido ? n.add(id) : n.delete(id); return n; });
    }
  };

  // Download offline do áudio atual
  const [baixado, setBaixado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  useEffect(() => {
    let vivo = true;
    const checar = () => {
      if (!atual) { setBaixado(false); return; }
      void estaBaixado(atual.id).then((v) => { if (vivo) setBaixado(v); });
    };
    checar();
    const off = assinarAudioOffline(checar);
    return () => { vivo = false; off(); };
  }, [atual?.id]);

  const alternarDownload = async () => {
    if (!atual) return;
    if (baixado) {
      await removerAudioOffline(atual.id);
      toast.success("Download removido");
      return;
    }
    setBaixando(true);
    const ok = await baixarAudioOffline({
      id: atual.id,
      url: atual.audio_url,
      titulo: atual.titulo || `Art. ${atual.numero_artigo}`,
      subtitulo: atual.lei_nome,
      categoria: "leis-cantadas",
    });
    setBaixando(false);
    toast[ok ? "success" : "error"](ok ? "Áudio disponível offline" : "Não foi possível baixar");
  };

  const compartilhar = async () => {
    if (!atual) return;
    const titulo = atual.titulo || `Art. ${atual.numero_artigo}`;
    try {
      if (podeCompartilhar()) {
        await compartilharNativo({ title: `${titulo} — Leis Cantadas`, text: `${titulo} (${atual.lei_nome})`, url: window.location.href });
      } else {
        await copiarTexto(window.location.href);
        toast.success("Link copiado!");
      }
    } catch {
      /* usuário cancelou */
    }
  };

  const porLei = useMemo(() => {
    const map = new Map<string, LeiCantada[]>();
    faixas.filter((f) => f.slug !== "resumo").forEach((f) => {
      const arr = map.get(f.slug) ?? [];
      arr.push(f);
      map.set(f.slug, arr);
    });
    return Array.from(map.entries());
  }, [faixas]);

  const plays = (id: string) => stats.get(id)?.plays ?? 0;
  const likes = (id: string) => stats.get(id)?.likes ?? 0;

  const topOuvidas = useMemo(
    () => [...faixas].sort((a, b) => plays(b.id) - plays(a.id)).slice(0, 3),
    [faixas, stats]
  );
  const topCurtidas = useMemo(
    () => [...faixas].sort((a, b) => likes(b.id) - likes(a.id)).slice(0, 3),
    [faixas, stats]
  );

  const rankingCompleto = useMemo(
    () =>
      [...faixas].sort((a, b) =>
        rankAba === "ouvidas" ? plays(b.id) - plays(a.id) : likes(b.id) - likes(a.id)
      ),
    [faixas, stats, rankAba]
  );

  const listaConteudo = (
    <div className="px-4 space-y-6 mt-2">
      {/* Seletor de tipo: Todos / Leis / Resumos */}
      <div className="grid grid-cols-3 gap-1 rounded-full bg-white/5 p-1 text-xs font-semibold">
        {([
          { id: "todos" as const, label: "Todos", Icon: Music },
          { id: "leis" as const, label: "Leis", Icon: Scale, count: faixas.filter((f) => f.slug !== "resumo").length },
          { id: "resumos" as const, label: "Resumos", Icon: FileText, count: resumos.length },
        ]).map((t) => {
          const ativo = tipo === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-full transition ${
                ativo ? "bg-fuchsia-500/25 text-fuchsia-100 shadow-inner shadow-fuchsia-500/20" : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              <t.Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {typeof t.count === "number" && (
                <span className={`text-[10px] tabular-nums ${ativo ? "text-fuchsia-200/90" : "text-muted-foreground/70"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Busca / localizar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={buscaRef}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar artigo, número ou lei..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-fuchsia-400/40"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtro de coleção ativo */}
      {(soFavoritos || soCurtidas || soPlaylist) && (
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            {soPlaylist ? (
              <><ListMusic className="h-3.5 w-3.5 text-fuchsia-300" /> Playlist</>
            ) : soFavoritos ? (
              <><Heart className="h-3.5 w-3.5 text-rose-300" /> Favoritas</>
            ) : (
              <><ThumbsUp className="h-3.5 w-3.5 text-emerald-300" /> Curtidas</>
            )}
          </span>
          <button onClick={limparFiltros} className="font-semibold text-muted-foreground hover:text-foreground">
            Limpar
          </button>
        </div>
      )}

      {/* Ordenação + favoritos */}
      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-white/5 p-1.5 text-[10px] font-semibold">
        {([
          { id: "ordem" as const, label: "Ordem", Icon: ArrowUpDown },
          { id: "ouvidas" as const, label: "Em alta", Icon: Flame },
          { id: "curtidas" as const, label: "Em alta ♥", Icon: ThumbsUp },
        ]).map((o) => {
          const ativo = !soFavoritos && !soCurtidas && !soPlaylist && ordenar === o.id;
          return (
            <button
              key={o.id}
              onClick={() => { setOrdenar(o.id); limparFiltros(); }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition ${ativo ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              <o.Icon className="h-4 w-4" />
              <span>{o.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => { setSoCurtidas(false); setSoPlaylist(false); setSoFavoritos((v) => !v); }}
          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition ${
            soFavoritos ? "bg-rose-400/20 text-rose-300" : "text-muted-foreground hover:text-foreground/80"
          }`}
        >
          <Heart className={`h-4 w-4 ${soFavoritos ? "fill-rose-300" : ""}`} />
          <span>Favoritos</span>
        </button>
      </div>

      {tipo !== "resumos" && porLei.map(([slug, arr]) => {
        let lista = [...arr];
        if (soFavoritos) lista = lista.filter((f) => favoritos.has(f.id));
        else if (soCurtidas) lista = lista.filter((f) => curtidas.has(f.id));
        else if (soPlaylist) lista = lista.filter((f) => playlist.has(f.id));
        if (busca.trim()) { const q = normalizar(busca); lista = lista.filter((f) => normalizar(`${f.titulo ?? ""} ${f.numero_artigo ?? ""} ${f.lei_nome ?? ""}`).includes(q)); }
        if (ordenar === "ouvidas") lista.sort((a, b) => plays(b.id) - plays(a.id));
        else if (ordenar === "curtidas") lista.sort((a, b) => likes(b.id) - likes(a.id));
        else lista.sort((a, b) => numArtigo(a.numero_artigo) - numArtigo(b.numero_artigo));
        return (
          <section key={slug}>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-8 w-8 grid place-items-center rounded-lg text-white bg-fuchsia-600">
                <Music className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold">{arr[0].lei_nome ?? slug}</h2>
              <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Leis</span>
            </div>
            {lista.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2.5 py-6 text-center">
                {soPlaylist ? "Sua playlist está vazia. Toque no + de uma faixa para adicionar."
                  : soCurtidas ? "Você ainda não curtiu nenhuma faixa aqui."
                  : soFavoritos ? "Nenhum favorito ainda. Toque no coração para favoritar."
                  : busca.trim() ? "Nada encontrado para sua busca."
                  : "Nenhuma faixa disponível."}
              </p>
            ) : (
              <motion.div 
                className="divide-y divide-white/[0.06]"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                initial="hidden"
                animate="show"
              >
                {lista.map((f) => {
                  const ativo = f.id === atualId;
                  const fav = favoritos.has(f.id);
                  return (
                    <motion.div key={f.id}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      className={`flex items-center gap-3 px-2.5 py-3 transition first:rounded-t-xl last:rounded-b-xl ${
                        ativo ? "bg-white/10" : "hover:bg-white/5"
                      }`}>
                      <motion.button 
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => abrirFaixa(f)} 
                        className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <span className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden">
                          <img src={CAPA_PENAL} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform hover:scale-105" />
                          <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                            {ativo && tocando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${ativo ? "text-fuchsia-300" : ""}`}>
                            {f.titulo || `Art. ${f.numero_artigo}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
                        </div>
                      </motion.button>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
                        <span className="inline-flex items-center gap-1" title="Reproduções">
                          <Headphones className="h-3.5 w-3.5" /> {fmtN(plays(f.id))}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Curtidas">
                          <ThumbsUp className={`h-3.5 w-3.5 ${curtidas.has(f.id) ? "fill-sky-400 text-sky-400" : ""}`} /> {fmtN(likes(f.id))}
                        </span>
                      </div>
                      <button
                        onClick={() => alternarPlaylist(f.id)}
                        aria-label={playlist.has(f.id) ? "Remover da playlist" : "Adicionar à playlist"}
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                      >
                        {playlist.has(f.id) ? <Check className="h-4 w-4 text-fuchsia-400" /> : <ListPlus className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => alternarFavorito(f.id)}
                        aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* ───────── Resumos cantados (temas por área) ───────── */}
      {tipo !== "leis" && (() => {
        let lista = [...resumos].map(resumoParaFaixa);
        if (soFavoritos) lista = lista.filter((f) => favoritos.has(f.id));
        else if (soCurtidas) lista = lista.filter((f) => curtidas.has(f.id));
        else if (soPlaylist) lista = lista.filter((f) => playlist.has(f.id));
        if (busca.trim()) { const q = normalizar(busca); lista = lista.filter((f) => normalizar(`${f.titulo ?? ""} ${f.numero_artigo ?? ""} ${f.lei_nome ?? ""}`).includes(q)); }
        if (ordenar === "ouvidas") lista.sort((a, b) => plays(b.id) - plays(a.id));
        else if (ordenar === "curtidas") lista.sort((a, b) => likes(b.id) - likes(a.id));
        if (resumos.length === 0) return null;
        return (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-8 w-8 grid place-items-center rounded-lg bg-fuchsia-500/90 text-white">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold">Resumos</h2>
              <span className="ml-1 rounded-full bg-fuchsia-500/15 text-fuchsia-200 px-2 py-0.5 text-[10px] font-semibold">
                Temas cantados
              </span>
            </div>
            {lista.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2.5 py-6 text-center">
                {soPlaylist ? "Sua playlist está vazia. Toque no + de uma faixa para adicionar."
                  : soCurtidas ? "Você ainda não curtiu nenhum resumo."
                  : soFavoritos ? "Nenhum favorito ainda. Toque no coração para favoritar."
                  : busca.trim() ? "Nada encontrado para sua busca."
                  : "Nenhum resumo disponível."}
              </p>
            ) : (
              <motion.div 
                className="divide-y divide-white/[0.06]"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                initial="hidden"
                animate="show"
              >
                {lista.map((f) => {
                  const ativo = f.id === atualId;
                  const fav = favoritos.has(f.id);
                  return (
                    <motion.div key={f.id}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      className={`flex items-center gap-3 px-2.5 py-3 transition first:rounded-t-xl last:rounded-b-xl ${
                        ativo ? "bg-white/10" : "hover:bg-white/5"
                      }`}>
                      <motion.button 
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => abrirFaixa(f)} 
                        className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <span className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-fuchsia-900/40">
                          <img src={CAPA_PENAL} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform hover:scale-105" />
                          <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                            {ativo && tocando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${ativo ? "text-fuchsia-300" : ""}`}>
                            {f.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
                        </div>
                      </motion.button>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
                        <span className="inline-flex items-center gap-1" title="Reproduções">
                          <Headphones className="h-3.5 w-3.5" /> {fmtN(plays(f.id))}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Curtidas">
                          <ThumbsUp className={`h-3.5 w-3.5 ${curtidas.has(f.id) ? "fill-sky-400 text-sky-400" : ""}`} /> {fmtN(likes(f.id))}
                        </span>
                      </div>
                      <button
                        onClick={() => alternarPlaylist(f.id)}
                        aria-label={playlist.has(f.id) ? "Remover da playlist" : "Adicionar à playlist"}
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                      >
                        {playlist.has(f.id) ? <Check className="h-4 w-4 text-fuchsia-400" /> : <ListPlus className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => alternarFavorito(f.id)}
                        aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-background to-background text-foreground pb-40">
      {/* Hero com vídeo de fundo */}
      <div className="relative px-5 pt-10 pb-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <video
            src={VIDEO_URL}
            poster={POSTER_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            className="w-full h-full object-cover opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/30 via-background/60 to-black" />
        </div>

        <button
          onClick={() => (tela === "lista" ? setTela("hub") : navigate("/"))}
          aria-label="Voltar"
          className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-foreground backdrop-blur transition hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <VideoCapa className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl shadow-2xl shadow-fuchsia-900/40 shrink-0" />
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-widest mb-2">
              <Music className="h-3.5 w-3.5" /> {tela === "lista" ? "Código Penal" : "Playlist"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              {tela === "lista" ? "Código Penal" : "Leis Cantadas"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {tela === "lista" ? "Artigos cantados para memorizar." : "Aprenda sobre as leis cantando."}
            </p>
            {!loading && tela === "lista" && <p className="text-xs text-muted-foreground mt-1">{faixas.length} faixa(s)</p>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : tela === "hub" ? (
        /* ───────── HUB ───────── */
        <div className="px-4 space-y-8 mt-2">
          {/* Rankings em destaque */}
          {faixas.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-8 w-8 grid place-items-center rounded-lg text-white ${rankAba === "ouvidas" ? "bg-orange-500/90" : "bg-rose-500/90"}`}>
                    {rankAba === "ouvidas" ? <Flame className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                  </span>
                  <h2 className="text-lg font-bold">Top 3</h2>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setRankAba("ouvidas")}
                    className={`px-3 py-1.5 rounded-full transition ${rankAba === "ouvidas" ? "bg-white/15 text-foreground" : "text-muted-foreground"}`}
                  >
                    Mais ouvidas
                  </button>
                  <button
                    onClick={() => setRankAba("curtidas")}
                    className={`px-3 py-1.5 rounded-full transition ${rankAba === "curtidas" ? "bg-white/15 text-foreground" : "text-muted-foreground"}`}
                  >
                    Mais curtidas
                  </button>
                </div>
              </div>
              <motion.div 
                className="space-y-1.5"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                initial="hidden"
                animate="show"
              >
                {(rankAba === "ouvidas" ? topOuvidas : topCurtidas).map((f, i) => (
                  <RankRow
                    key={f.id}
                    f={f}
                    pos={i + 1}
                    valor={rankAba === "ouvidas" ? plays(f.id) : likes(f.id)}
                    unidade={rankAba === "ouvidas" ? "plays" : "curtidas"}
                    onClick={() => abrirFaixa(f)}
                  />
                ))}
              </motion.div>
              {rankingCompleto.length > 3 && (
                <button
                  onClick={() => setVerTodos(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/10 transition"
                >
                  Ver todos
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </section>
          )}

          {/* Categorias estilo Spotify */}
          <section>
            <h2 className="text-lg font-bold mb-3">Categorias</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTela("lista")}
                className="group relative aspect-square rounded-2xl overflow-hidden text-left"
              >
                <img src={CAPA_PENAL} alt="Direito Penal" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span className="self-start h-9 w-9 grid place-items-center rounded-lg bg-red-500 text-white shadow-lg"><Scale className="h-5 w-5" /></span>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="font-bold leading-tight">Direito Penal</p>
                      <p className="text-[11px] text-white/70">{faixas.length} faixa(s)</p>
                    </div>
                    <span className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/15 text-white group-hover:bg-white/25 transition"><ChevronRight className="h-5 w-5" /></span>
                  </div>
                </div>
              </button>
              {AREAS_EM_BREVE.map((a) => (
                <div
                  key={a.nome}
                  aria-disabled
                  className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.04] cursor-not-allowed"
                >
                  <img src={a.capa} alt={a.nome} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale-[0.2]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <span className="self-start h-9 w-9 grid place-items-center rounded-lg bg-white/10 text-white/80"><a.Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="font-bold leading-tight text-white/90">{a.nome}</p>
                      <p className="inline-flex items-center gap-1 text-[11px] text-white/70"><Lock className="h-3 w-3" /> Em breve</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : faixas.length === 0 && resumos.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm px-6">
          Nenhuma lei cantada disponível ainda.
        </div>
      ) : (
        listaConteudo
      )}

      {/* Player em tela cheia (estilo Spotify, abre de baixo pra cima) */}
      {atual && (
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
            aberto ? "translate-y-0" : "translate-y-full pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 -z-10 bg-zinc-950">
            <video src={VIDEO_URL} poster={POSTER_URL} autoPlay muted loop playsInline preload="auto" aria-hidden className="w-full h-full object-cover opacity-30 blur-2xl scale-125" />
            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/30 via-zinc-950/90 to-black" />
            <div className="absolute inset-0 bg-zinc-950/70" />
          </div>

          {/* topo */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <button onClick={() => setAberto(false)} className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/10">
              <ChevronDown className="h-6 w-6" />
            </button>
            <div className="text-center min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Tocando</p>
              <p className="text-sm font-semibold truncate max-w-[60vw]">{atual.lei_nome}</p>
            </div>
            <div className="h-10 w-10" />
          </div>

          {/* capa + conteúdo */}
          <div className="flex-1 min-h-0 flex flex-col px-5">
            <div className="relative shrink-0 flex items-center justify-center">
              <VideoCapa
                overlay
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl shadow-black/60"
              />
              <button
                onClick={() => alternarFavorito(atual.id)}
                aria-label={favoritos.has(atual.id) ? "Remover dos favoritos" : "Favoritar"}
                title={favoritos.has(atual.id) ? "Remover dos favoritos" : "Favoritar"}
                className="absolute right-0 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 backdrop-blur transition hover:bg-white/20 active:scale-95"
              >
                <Heart className={`h-5 w-5 transition ${favoritos.has(atual.id) ? "fill-rose-400 text-rose-400" : "text-white/80"}`} />
              </button>
            </div>

            <div className="mt-4 shrink-0">
              <h2 className="text-2xl font-black tracking-tight truncate">{atual.titulo || `Art. ${atual.numero_artigo}`}</h2>
              <p className="text-sm text-muted-foreground truncate">{atual.lei_nome}</p>
            </div>

            {/* abas */}
            <div className="mt-4 shrink-0 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
              <button
                onClick={() => setAba("karaoke")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
                  aba === "karaoke" ? "bg-sky-500 text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic2 className="h-4 w-4" /> Karaokê
              </button>
              <button
                onClick={() => setAba("letra")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
                  aba === "letra" ? "bg-sky-500 text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> {atual.slug === "resumo" ? "Resumo" : "Artigo"}
              </button>
            </div>

            {/* área rolável */}
            <div className="relative flex-1 min-h-0 overflow-y-auto py-4">
              {aba === "karaoke" ? (
                linhas.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">
                    Letra ainda não cadastrada para esta música.
                  </p>
                ) : (
                  <div className="space-y-4 py-6 text-center px-10">
                    {linhas.map((l, i) => {
                      const ativa = i === linhaAtiva;
                      const vizinha = i === linhaAtiva - 1 || i === linhaAtiva + 1;
                      const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
                      if (l.secao) {
                        return (
                          <p
                            key={i}
                            ref={ativa ? linhaRef : undefined}
                            style={{ transitionTimingFunction: EASE }}
                            className={`pt-3 pb-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-[900ms] ${
                              ativa ? "text-sky-300 opacity-100" : "text-sky-300/40 opacity-60"
                            }`}
                          >
                            {l.texto}
                          </p>
                        );
                      }
                      return (
                        <p
                          key={i}
                          ref={ativa ? linhaRef : undefined}
                          style={{
                            transitionTimingFunction: EASE,
                            opacity: ativa ? 1 : vizinha ? 0.75 : i < linhaAtiva ? 0.32 : 0.45,
                            filter: ativa
                              ? "blur(0px)"
                              : vizinha
                              ? "blur(0.4px)"
                              : "blur(1.4px)",
                            transform: ativa
                              ? "translateY(0) scale(1.05)"
                              : i === linhaAtiva - 1
                              ? "translateY(-2px) scale(0.98)"
                              : i === linhaAtiva + 1
                              ? "translateY(2px) scale(0.98)"
                              : "translateY(0) scale(0.94)",
                          }}
                          className={`transition-[transform,opacity,filter,color,text-shadow] duration-[900ms] leading-relaxed will-change-[transform,opacity,filter] ${
                            ativa
                              ? "text-2xl font-extrabold text-white [text-shadow:0_0_24px_rgba(125,211,252,0.5)]"
                              : vizinha
                              ? "text-base text-white/70"
                              : "text-sm text-white/45"
                          }`}
                        >
                          {l.texto}
                        </p>
                      );
                    })}
                  </div>
                )
              ) : atual.slug === "resumo" ? (
                <div className="w-full max-w-full">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-sky-300 break-words">
                        Resumo
                      </p>
                      <p className="mt-0.5 text-[13px] text-white/70 truncate">{atual.titulo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setResumoFontSize((s) => Math.max(13, s - 1))}
                        aria-label="Diminuir fonte"
                        title="Diminuir fonte"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-[11px] tabular-nums text-muted-foreground w-6 text-center">
                        {resumoFontSize}
                      </span>
                      <button
                        onClick={() => setResumoFontSize((s) => Math.min(28, s + 1))}
                        aria-label="Aumentar fonte"
                        title="Aumentar fonte"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      {atual.resumo_texto && (
                        <button
                          onClick={() => {
                            const nome = `${(atual.titulo || "resumo").replace(/[^a-z0-9À-ÿ\- ]/gi, "").trim() || "resumo"}.md`;
                            const blob = new Blob([atual.resumo_texto || ""], { type: "text/markdown;charset=utf-8" });
                            void baixarBlob(blob, nome, { titulo: atual.titulo || "Resumo" });
                          }}
                          aria-label="Baixar resumo"
                          title="Baixar resumo"
                          className="grid h-9 w-9 place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {atual.resumo_texto ? (
                    <div
                      className="resumo-markdown break-words text-white/90 [overflow-wrap:anywhere]"
                      style={{ fontSize: `${resumoFontSize}px`, lineHeight: 1.7 }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          h1: ({ node, ...p }) => <h1 className="mt-2 mb-3 text-2xl font-black tracking-tight text-white" {...p} />,
                          h2: ({ node, ...p }) => <h2 className="mt-5 mb-2 text-xl font-extrabold text-sky-300" {...p} />,
                          h3: ({ node, ...p }) => <h3 className="mt-4 mb-2 text-lg font-bold text-fuchsia-300" {...p} />,
                          h4: ({ node, ...p }) => <h4 className="mt-3 mb-1.5 text-base font-bold text-white/90" {...p} />,
                          p:  ({ node, ...p }) => <p className="my-2.5 leading-relaxed text-white/90" {...p} />,
                          ul: ({ node, ...p }) => <ul className="my-2.5 ml-5 list-disc space-y-1 marker:text-sky-400" {...p} />,
                          ol: ({ node, ...p }) => <ol className="my-2.5 ml-5 list-decimal space-y-1 marker:text-sky-400" {...p} />,
                          li: ({ node, ...p }) => <li className="pl-1" {...p} />,
                          strong: ({ node, ...p }) => <strong className="font-bold text-white" {...p} />,
                          em: ({ node, ...p }) => <em className="italic text-white/85" {...p} />,
                          blockquote: ({ node, ...p }) => <blockquote className="my-3 border-l-2 border-sky-400/60 bg-white/5 px-3 py-1.5 italic text-white/85" {...p} />,
                          code: ({ node, className, ...p }) => (
                            <code className={`rounded bg-white/10 px-1.5 py-0.5 text-[0.9em] text-fuchsia-200 ${className ?? ""}`} {...p} />
                          ),
                          hr: () => <hr className="my-4 border-white/10" />,
                          table: ({ node, ...p }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
                              <table className="w-full text-sm" {...p} />
                            </div>
                          ),
                          th: ({ node, ...p }) => <th className="bg-white/5 px-3 py-2 text-left font-semibold text-white" {...p} />,
                          td: ({ node, ...p }) => <td className="border-t border-white/10 px-3 py-2 align-top text-white/85" {...p} />,
                          a:  ({ node, ...p }) => <a className="text-sky-300 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-200" target="_blank" rel="noopener noreferrer" {...p} />,
                        }}
                      >
                        {atual.resumo_texto}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                      <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        O resumo escrito ainda não foi cadastrado para este tema.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-full">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="min-w-0 text-xs font-bold uppercase tracking-widest text-sky-300 break-words">
                      Artigo {atual.numero_artigo ?? ""}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setArtigoFontSize((s) => Math.max(13, s - 1))}
                        aria-label="Diminuir fonte"
                        title="Diminuir fonte"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-[11px] tabular-nums text-muted-foreground w-6 text-center">
                        {artigoFontSize}
                      </span>
                      <button
                        onClick={() => setArtigoFontSize((s) => Math.min(28, s + 1))}
                        aria-label="Aumentar fonte"
                        title="Aumentar fonte"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      {temRedacao && (
                        <button
                          onClick={() => setRevelarRedacao((v) => !v)}
                          aria-label={revelarRedacao ? "Ocultar redação dada" : "Revelar redação dada"}
                          title={revelarRedacao ? "Ocultar redação dada" : "Revelar redação dada"}
                          className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                            revelarRedacao
                              ? "border-sky-400/40 bg-sky-500/20 text-sky-300"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {revelarRedacao ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      )}
                      {planaltoUrl && (
                        <a
                          href={planaltoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Ver no Planalto"
                          title="Ver no Planalto"
                          className="grid h-9 w-9 place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  {carregandoArtigo ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando artigo...
                    </div>
                  ) : artigoTexto ? (
                    <div
                      className="break-words [overflow-wrap:anywhere]"
                      style={{ fontSize: `${artigoFontSize}px`, lineHeight: 1.75 }}
                    >
                      <span className="block text-white/90 whitespace-pre-line leading-relaxed">
                        {artigoTexto}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Texto do artigo indisponível.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* controles (somente no Karaokê) */}
          {aba === "karaoke" && (
            <div className="shrink-0 px-5 pb-8 pt-2">
              <input
                type="range"
                min={0}
                max={dur || 0}
                value={tempo}
                onChange={seek}
                className="w-full accent-sky-500 h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>{fmt(tempo)}</span>
                <span>{fmt(dur)}</span>
              </div>
              <div className="flex items-center justify-center gap-8 mt-3">
                <button onClick={() => pular(-1)} className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10">
                  <SkipBack className="h-6 w-6" />
                </button>
                <button onClick={() => tocar(atual)} className="h-16 w-16 grid place-items-center rounded-full bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-900/50">
                  {tocando ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
                </button>
                <button onClick={() => pular(1)} className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10">
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>

              {/* ações: curtir, não curtir, compartilhar */}
              <div className="flex items-center justify-center gap-10 mt-5">
                <button
                  onClick={curtir}
                  className={`flex flex-col items-center gap-1 text-[11px] transition ${
                    curtidas.has(atual.id) ? "text-sky-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsUp className={`h-6 w-6 ${curtidas.has(atual.id) ? "fill-sky-400" : ""}`} />
                  {likes(atual.id) > 0 ? likes(atual.id) : "Curtir"}
                </button>
                <button
                  onClick={() => setNaoCurtidas((s) => { const n = new Set(s); n.has(atual.id) ? n.delete(atual.id) : n.add(atual.id); return n; })}
                  className={`flex flex-col items-center gap-1 text-[11px] transition ${
                    naoCurtidas.has(atual.id) ? "text-sky-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsDown className={`h-6 w-6 ${naoCurtidas.has(atual.id) ? "fill-sky-400" : ""}`} />
                  Não curtir
                </button>
                <button
                  onClick={compartilhar}
                  className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                >
                  <Share2 className="h-6 w-6" />
                  Compartilhar
                </button>
                {suportaAudioOffline() && (
                  <button
                    onClick={() => void alternarDownload()}
                    disabled={baixando}
                    className={`flex flex-col items-center gap-1 text-[11px] transition disabled:opacity-60 ${
                      baixado ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {baixando ? <Loader2 className="h-6 w-6 animate-spin" /> : baixado ? <Check className="h-6 w-6" /> : <Download className="h-6 w-6" />}
                    {baixado ? "Baixado" : "Baixar"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Painel Playlist / Buscar / Favoritas / Curtidas */}
      <Drawer open={sheetAberto} onOpenChange={setSheetAberto}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              {sheetFiltro === "playlist" ? (
                <><span className="h-8 w-8 grid place-items-center rounded-lg bg-fuchsia-500 text-white"><ListMusic className="h-4 w-4" /></span> Playlist</>
              ) : sheetFiltro === "buscar" ? (
                <><span className="h-8 w-8 grid place-items-center rounded-lg bg-sky-500 text-white"><Search className="h-4 w-4" /></span> Buscar</>
              ) : sheetFiltro === "favoritos" ? (
                <><span className="h-8 w-8 grid place-items-center rounded-lg bg-rose-500 text-white"><Heart className="h-4 w-4" /></span> Favoritas</>
              ) : (
                <><span className="h-8 w-8 grid place-items-center rounded-lg bg-emerald-500 text-white"><ThumbsUp className="h-4 w-4" /></span> Curtidas</>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto pb-8">
            {listaConteudo}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Ranking completo */}
      <Drawer open={verTodos} onOpenChange={setVerTodos}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <span className={`h-8 w-8 grid place-items-center rounded-lg text-white ${rankAba === "ouvidas" ? "bg-orange-500/90" : "bg-rose-500/90"}`}>
                {rankAba === "ouvidas" ? <Flame className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              </span>
              {rankAba === "ouvidas" ? "Mais ouvidas" : "Mais curtidas"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 space-y-1">
            {rankingCompleto.map((f, i) => (
              <RankRow
                key={f.id}
                f={f}
                pos={i + 1}
                valor={rankAba === "ouvidas" ? plays(f.id) : likes(f.id)}
                unidade={rankAba === "ouvidas" ? "plays" : "curtidas"}
                onClick={() => { setVerTodos(false); abrirFaixa(f); }}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Menu de rodapé */}
      <LeisCantadasBottomNav
        hidden={aberto}
        ativo={sheetAberto ? (sheetFiltro as LeisCantadasTab) : "musicas"}
        onSelect={(tab) => {
          if (tab === "musicas") {
            setSheetAberto(false);
            limparFiltros();
            setBusca("");
            setTipo("todos");
            setOrdenar("ordem");
            setTela("hub");
            return;
          }
          irParaFiltro(tab);
        }}
      />
    </div>
  );
}