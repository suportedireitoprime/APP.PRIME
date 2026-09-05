import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Loader2,
  Scale,
  FileText,
  Search,
  ListMusic,
  Heart,
  ThumbsUp,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchArtigoDetalhe,
  fetchLeisCantadasStats,
  fetchMinhasCurtidas,
  alternarCurtida,
  fetchTodosResumosCantados,
  type LeiCantada,
  type LeiCantadaStat,
  type ResumoCantado,
} from '@/lib/leisCantadasApi';
import { useLeisCantadasPlayer } from '@/contexts/LeisCantadasPlayerContext';
import { parseLetra, linhaAtivaIndex, formatarArtigoVadeMecum, limparAnotacoes } from '@/lib/leisCantadasFormat';
import { getPlanaltoUrl } from '@/services/legislacaoService';
import { VideoCapa, VIDEO_URL, POSTER_URL, usePrewarmVideo } from '@/components/leis-cantadas/VideoCapa';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import LeisCantadasBottomNav, { type LeisCantadasTab } from '@/components/leis-cantadas/LeisCantadasBottomNav';
import { copiarTexto } from '@/lib/nativo/copiar';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  assinarAudioOffline,
} from '@/lib/nativo/audioOffline';
import { lerFavoritos, salvarFavoritos, lerPlaylist, salvarPlaylist } from '@/components/leis-cantadas/leisCantadasUtils';
import { LeisCantadasHubView } from '@/components/leis-cantadas/LeisCantadasHubView';
import { LeisCantadasListaView } from '@/components/leis-cantadas/LeisCantadasListaView';
import { LeisCantadasPlayerModal } from '@/components/leis-cantadas/LeisCantadasPlayerModal';
import { LeisCantadasRankingDrawer } from '@/components/leis-cantadas/LeisCantadasRankingDrawer';

export default function LeisCantadasPage() {
  const navigate = useNavigate();

  // Playback global (continua tocando ao navegar pelo app)
  const {
    faixas,
    loading,
    atualId,
    atual,
    tocando,
    tempo,
    dur,
    aberto,
    setAberto,
    tocar,
    pular,
    seek: seekTo,
  } = useLeisCantadasPlayer();

  const [aba, setAba] = useState<'karaoke' | 'letra'>('karaoke');
  const [artigoRaw, setArtigoRaw] = useState<string | null>(null);
  const [carregandoArtigo, setCarregandoArtigo] = useState(false);
  const [revelarRedacao, setRevelarRedacao] = useState(false);
  const [tela, setTela] = useState<'hub' | 'lista'>('hub');
  const [rankAba, setRankAba] = useState<'ouvidas' | 'curtidas'>('ouvidas');
  const [stats, setStats] = useState<Map<string, LeiCantadaStat>>(new Map());
  const [curtidas, setCurtidas] = useState<Set<string>>(new Set());
  const [naoCurtidas, setNaoCurtidas] = useState<Set<string>>(new Set());
  const [ordenar, setOrdenar] = useState<'ordem' | 'ouvidas' | 'curtidas'>('ordem');
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [soCurtidas, setSoCurtidas] = useState(false);
  const [soPlaylist, setSoPlaylist] = useState(false);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<'todos' | 'leis' | 'resumos'>('todos');
  const [resumos, setResumos] = useState<ResumoCantado[]>([]);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => lerFavoritos());
  const [playlist, setPlaylist] = useState<Set<string>>(() => lerPlaylist());
  const [sheetAberto, setSheetAberto] = useState(false);
  const [sheetFiltro, setSheetFiltro] = useState<'playlist' | 'buscar' | 'favoritos' | 'curtidas'>('playlist');
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
      toast.success(tinha ? 'Removido da sua playlist' : 'Adicionado à playlist');
      return n;
    });
  };

  const limparFiltros = () => {
    setSoFavoritos(false);
    setSoCurtidas(false);
    setSoPlaylist(false);
  };

  const irParaFiltro = (f: 'playlist' | 'buscar' | 'favoritos' | 'curtidas') => {
    setTipo('todos');
    setOrdenar('ordem');
    setSoFavoritos(f === 'favoritos');
    setSoCurtidas(f === 'curtidas');
    setSoPlaylist(f === 'playlist');
    if (f !== 'buscar') setBusca('');
    setSheetFiltro(f);
    setSheetAberto(true);
    if (f === 'buscar') window.setTimeout(() => buscaRef.current?.focus(), 200);
  };

  useEffect(() => {
    fetchLeisCantadasStats().then(setStats).catch(() => {});
    fetchMinhasCurtidas().then(setCurtidas).catch(() => {});
    fetchTodosResumosCantados().then(setResumos).catch(() => {});
  }, []);

  usePrewarmVideo();

  // Integra o "voltar" global com as telas internas.
  useEffect(() => {
    if (tela !== 'lista' && !aberto) return;
    window.history.pushState({ leisCantadasInterno: true }, '');
    const onPop = () => {
      if (aberto) setAberto(false);
      else setTela('hub');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [tela, aberto, setAberto]);

  // Carrega o texto (bruto) do artigo da faixa atual
  useEffect(() => {
    setRevelarRedacao(false);
    if (!atual || atual.slug === 'resumo') {
      setArtigoRaw(null);
      return;
    }
    const key = `${atual.tabela_codigo}:${atual.artigo_id}`;
    if (artigoCache.current.has(key)) {
      setArtigoRaw(artigoCache.current.get(key)!);
      return;
    }
    setCarregandoArtigo(true);
    setArtigoRaw(null);
    fetchArtigoDetalhe(atual.tabela_codigo, atual.artigo_id)
      .then((d) => {
        const t = d?.texto ?? '';
        artigoCache.current.set(key, t);
        setArtigoRaw(t);
      })
      .catch(() => setArtigoRaw(''))
      .finally(() => setCarregandoArtigo(false));
  }, [atual?.tabela_codigo, atual?.artigo_id, atual?.slug]);

  // Texto formatado no mesmo estilo do Vade Mecum (§/incisos/alíneas).
  const artigoTexto = useMemo(() => {
    if (artigoRaw == null) return null;
    const semPrefixo = artigoRaw.replace(/^\s*art(?:igo)?\.?\s*\d+[º°]?(?:-[A-Za-z])?\s*[-–—.]+\s*/i, '');
    const base = revelarRedacao ? semPrefixo : limparAnotacoes(semPrefixo);
    return formatarArtigoVadeMecum(base);
  }, [artigoRaw, revelarRedacao]);

  const temRedacao = useMemo(
    () => /\([^()]*(reda[çc][ãa]o|inclu[íi]d|vig[êe]ncia|revogad|renumerad)[^()]*\)/i.test(artigoRaw || ''),
    [artigoRaw]
  );

  const planaltoUrl = atual && atual.tabela_codigo ? getPlanaltoUrl(atual.tabela_codigo) : null;
  const linhas = useMemo(() => parseLetra(atual?.letra), [atual?.letra]);
  const linhaAtiva = useMemo(
    () => linhaAtivaIndex(tempo, dur, linhas.length, atual?.letra_sync),
    [tempo, dur, linhas.length, atual?.letra_sync]
  );

  useEffect(() => {
    if (aba === 'karaoke') {
      linhaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [linhaAtiva, aba]);

  const abrirFaixa = (f: LeiCantada) => {
    setSheetAberto(false);
    setAba('karaoke');
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
    setCurtidas((s) => {
      const n = new Set(s);
      jaCurtido ? n.delete(id) : n.add(id);
      return n;
    });
    setStats((m) => {
      const n = new Map(m);
      const cur = n.get(id) ?? { musica_id: id, plays: 0, likes: 0 };
      n.set(id, { ...cur, likes: Math.max(0, cur.likes + (jaCurtido ? -1 : 1)) });
      return n;
    });
    try {
      await alternarCurtida(id);
    } catch {
      setCurtidas((s) => {
        const n = new Set(s);
        jaCurtido ? n.add(id) : n.delete(id);
        return n;
      });
    }
  };

  const [baixado, setBaixado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  useEffect(() => {
    let vivo = true;
    const checar = () => {
      if (!atual) {
        setBaixado(false);
        return;
      }
      void estaBaixado(atual.id).then((v) => {
        if (vivo) setBaixado(v);
      });
    };
    checar();
    const off = assinarAudioOffline(checar);
    return () => {
      vivo = false;
      off();
    };
  }, [atual?.id]);

  const alternarDownload = async () => {
    if (!atual) return;
    if (baixado) {
      await removerAudioOffline(atual.id);
      toast.success('Download removido');
      return;
    }
    setBaixando(true);
    const ok = await baixarAudioOffline({
      id: atual.id,
      url: atual.audio_url,
      titulo: atual.titulo || `Art. ${atual.numero_artigo}`,
      subtitulo: atual.lei_nome,
      categoria: 'leis-cantadas',
    });
    setBaixando(false);
    toast[ok ? 'success' : 'error'](ok ? 'Áudio disponível offline' : 'Não foi possível baixar');
  };

  const compartilhar = async () => {
    if (!atual) return;
    const titulo = atual.titulo || `Art. ${atual.numero_artigo}`;
    try {
      if (podeCompartilhar()) {
        await compartilharNativo({
          title: `${titulo} — Leis Cantadas`,
          text: `${titulo} (${atual.lei_nome})`,
          url: window.location.href,
        });
      } else {
        await copiarTexto(window.location.href);
        toast.success('Link copiado!');
      }
    } catch {
      /* usuário cancelou */
    }
  };

  const porLei = useMemo<[string, LeiCantada[]][]>(() => {
    const map = new Map<string, LeiCantada[]>();
    faixas
      .filter((f) => f.slug !== 'resumo')
      .forEach((f) => {
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
        rankAba === 'ouvidas' ? plays(b.id) - plays(a.id) : likes(b.id) - likes(a.id)
      ),
    [faixas, stats, rankAba]
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
          onClick={() => (tela === 'lista' ? setTela('hub') : navigate('/'))}
          aria-label="Voltar"
          className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-foreground backdrop-blur transition hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <VideoCapa className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl shadow-2xl shadow-fuchsia-900/40 shrink-0" />
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-widest mb-2">
              <Music className="h-3.5 w-3.5" /> {tela === 'lista' ? 'Código Penal' : 'Playlist'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              {tela === 'lista' ? 'Código Penal' : 'Leis Cantadas'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {tela === 'lista' ? 'Artigos cantados para memorizar.' : 'Aprenda sobre as leis cantando.'}
            </p>
            {!loading && tela === 'lista' && (
              <p className="text-xs text-muted-foreground mt-1">{faixas.length} faixa(s)</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tela === 'hub' ? (
        <LeisCantadasHubView
          faixas={faixas}
          rankAba={rankAba}
          setRankAba={setRankAba}
          topOuvidas={topOuvidas}
          topCurtidas={topCurtidas}
          rankingCompletoLength={rankingCompleto.length}
          plays={plays}
          likes={likes}
          onSelectFaixa={abrirFaixa}
          onVerTodos={() => setVerTodos(true)}
          onOpenLista={() => setTela('lista')}
        />
      ) : faixas.length === 0 && resumos.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm px-6">
          Nenhuma lei cantada disponível ainda.
        </div>
      ) : (
        <LeisCantadasListaView
          tipo={tipo}
          setTipo={setTipo}
          faixas={faixas}
          resumos={resumos}
          busca={busca}
          setBusca={setBusca}
          buscaRef={buscaRef}
          soFavoritos={soFavoritos}
          soCurtidas={soCurtidas}
          soPlaylist={soPlaylist}
          limparFiltros={limparFiltros}
          ordenar={ordenar}
          setOrdenar={setOrdenar}
          setSoFavoritos={setSoFavoritos}
          setSoCurtidas={setSoCurtidas}
          setSoPlaylist={setSoPlaylist}
          porLei={porLei}
          favoritos={favoritos}
          curtidas={curtidas}
          playlist={playlist}
          atualId={atualId}
          tocando={tocando}
          abrirFaixa={abrirFaixa}
          alternarPlaylist={alternarPlaylist}
          alternarFavorito={alternarFavorito}
          plays={plays}
          likes={likes}
        />
      )}

      {/* Player em tela cheia (estilo Spotify, abre de baixo pra cima) */}
      <LeisCantadasPlayerModal
        atual={atual}
        aberto={aberto}
        setAberto={setAberto}
        favoritos={favoritos}
        alternarFavorito={alternarFavorito}
        aba={aba}
        setAba={setAba}
        linhas={linhas}
        linhaAtiva={linhaAtiva}
        linhaRef={linhaRef}
        resumoFontSize={resumoFontSize}
        setResumoFontSize={setResumoFontSize}
        artigoFontSize={artigoFontSize}
        setArtigoFontSize={setArtigoFontSize}
        temRedacao={temRedacao}
        revelarRedacao={revelarRedacao}
        setRevelarRedacao={setRevelarRedacao}
        planaltoUrl={planaltoUrl}
        carregandoArtigo={carregandoArtigo}
        artigoTexto={artigoTexto}
        dur={dur}
        tempo={tempo}
        seek={seek}
        pular={pular}
        tocar={tocar}
        tocando={tocando}
        curtir={curtir}
        curtidas={curtidas}
        naoCurtidas={naoCurtidas}
        setNaoCurtidas={setNaoCurtidas}
        likes={likes}
        compartilhar={compartilhar}
        alternarDownload={alternarDownload}
        baixando={baixando}
        baixado={baixado}
      />

      {/* Painel Playlist / Buscar / Favoritas / Curtidas */}
      <Drawer open={sheetAberto} onOpenChange={setSheetAberto}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              {sheetFiltro === 'playlist' ? (
                <>
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-fuchsia-500 text-white">
                    <ListMusic className="h-4 w-4" />
                  </span>{' '}
                  Playlist
                </>
              ) : sheetFiltro === 'buscar' ? (
                <>
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-sky-500 text-white">
                    <Search className="h-4 w-4" />
                  </span>{' '}
                  Buscar
                </>
              ) : sheetFiltro === 'favoritos' ? (
                <>
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-rose-500 text-white">
                    <Heart className="h-4 w-4" />
                  </span>{' '}
                  Favoritas
                </>
              ) : (
                <>
                  <span className="h-8 w-8 grid place-items-center rounded-lg bg-emerald-500 text-white">
                    <ThumbsUp className="h-4 w-4" />
                  </span>{' '}
                  Curtidas
                </>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto pb-8">
            <LeisCantadasListaView
              tipo={tipo}
              setTipo={setTipo}
              faixas={faixas}
              resumos={resumos}
              busca={busca}
              setBusca={setBusca}
              buscaRef={buscaRef}
              soFavoritos={soFavoritos}
              soCurtidas={soCurtidas}
              soPlaylist={soPlaylist}
              limparFiltros={limparFiltros}
              ordenar={ordenar}
              setOrdenar={setOrdenar}
              setSoFavoritos={setSoFavoritos}
              setSoCurtidas={setSoCurtidas}
              setSoPlaylist={setSoPlaylist}
              porLei={porLei}
              favoritos={favoritos}
              curtidas={curtidas}
              playlist={playlist}
              atualId={atualId}
              tocando={tocando}
              abrirFaixa={abrirFaixa}
              alternarPlaylist={alternarPlaylist}
              alternarFavorito={alternarFavorito}
              plays={plays}
              likes={likes}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Ranking completo */}
      <LeisCantadasRankingDrawer
        open={verTodos}
        onOpenChange={setVerTodos}
        rankAba={rankAba}
        rankingCompleto={rankingCompleto}
        plays={plays}
        likes={likes}
        onSelectFaixa={abrirFaixa}
      />

      {/* Menu de rodapé */}
      <LeisCantadasBottomNav
        hidden={aberto}
        ativo={sheetAberto ? (sheetFiltro as LeisCantadasTab) : 'musicas'}
        onSelect={(tab) => {
          if (tab === 'musicas') {
            setSheetAberto(false);
            limparFiltros();
            setBusca('');
            setTipo('todos');
            setOrdenar('ordem');
            setTela('hub');
            return;
          }
          irParaFiltro(tab);
        }}
      />
    </div>
  );
}
