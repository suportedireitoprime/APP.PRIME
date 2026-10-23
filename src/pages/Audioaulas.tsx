import { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizar } from '@/lib/audioaulasHelper';
import { resetGlobalScroll } from '@/lib/scrollUtils';
import AudioaulasBottomNav from '@/components/audioaulas/AudioaulasBottomNav';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useIsDesktop } from '@/hooks/use-desktop';
import ShapeGrid from '@/components/ui/ShapeGrid';

import { useAudioaulas } from '@/hooks/useAudioaulas';
import { AudioaulasHero } from '@/components/audioaulas/home/AudioaulasHero';
import { AudioaulasGridAreas, type ModoVisualizacao } from '@/components/audioaulas/home/AudioaulasGridAreas';
import { AudioaulasListaAulas } from '@/components/audioaulas/home/AudioaulasListaAulas';
import { AudioaulasBuscaInput } from '@/components/audioaulas/home/AudioaulasBuscaInput';
import { AudioaulasBuscaGlobal } from '@/components/audioaulas/home/AudioaulasBuscaGlobal';
import { AudioaulasPlayerModal } from '@/components/audioaulas/home/AudioaulasPlayerModal';
import { AudioaulasContinuarOuvindo } from '@/components/audioaulas/home/AudioaulasContinuarOuvindo';

const Audioaulas = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const areaAtual = area ? decodeURIComponent(area) : null;
  const buscaRef = useRef<HTMLInputElement | null>(null);

  const isDesktop = useIsDesktop();
  const state = useAudioaulas(areaAtual);
  const [searchParams, setSearchParams] = useSearchParams();

  const { aulas, loading: loadingAulas, handleTocarAula, setAba, setBusca } = state;

  // Handle deep link from push notifications or artigo query
  useEffect(() => {
    const playId = searchParams.get('play_id');
    if (playId && aulas.length > 0 && !loadingAulas) {
      const aulaToPlay = aulas.find(a => String(a.id) === String(playId));
      if (aulaToPlay) {
        handleTocarAula(aulaToPlay);
        setSearchParams({}, { replace: true });
        return;
      }
    }

    const artigoParam = searchParams.get('artigo');
    const buscaParam = searchParams.get('busca');
    if ((artigoParam || buscaParam) && aulas.length > 0 && !loadingAulas) {
      const cleanNum = (artigoParam || '').replace(/^art(?:igo|\.)?\s*/i, '').replace(/[º°ª]/g, '').trim();
      const termo = buscaParam || (cleanNum ? `Art. ${cleanNum}` : '');

      const aulaMatch = aulas.find(a => {
        const t = normalizar(a.titulo || '');
        const tema = normalizar(a.tema || '');
        const desc = normalizar(a.descricao || '');
        if (cleanNum) {
          if (t.includes(`art ${cleanNum}`) || t.includes(`artigo ${cleanNum}`) || 
              tema.includes(`art ${cleanNum}`) || tema.includes(`artigo ${cleanNum}`) ||
              desc.includes(`art ${cleanNum}`) || desc.includes(`artigo ${cleanNum}`)) {
            return true;
          }
        }
        if (termo) {
          const q = normalizar(termo);
          return t.includes(q) || tema.includes(q);
        }
        return false;
      });

      if (aulaMatch) {
        handleTocarAula(aulaMatch);
        toast.success(`Áudio Aula personalizada: ${aulaMatch.titulo}`);
        setSearchParams({}, { replace: true });
      } else if (termo) {
        setAba('buscar');
        setBusca(termo);
      }
    }
  }, [searchParams, aulas, loadingAulas, handleTocarAula, setAba, setBusca, setSearchParams]);

  const [capituloSelecionado, setCapituloSelecionado] = useState<string | null>(null);
  const [modoVerTodos, setModoVerTodos] = useState<ModoVisualizacao>('hub');

  // Reset capítulo e modo ao trocar de área (Lei Global de Scroll)
  useEffect(() => {
    setCapituloSelecionado(null);
    setModoVerTodos('hub');
    resetGlobalScroll();
    requestAnimationFrame(() => resetGlobalScroll());
  }, [areaAtual]);

  // Sempre que capituloSelecionado mudar, garante scroll top a 0
  useEffect(() => {
    resetGlobalScroll();
    requestAnimationFrame(() => resetGlobalScroll());
  }, [capituloSelecionado]);

  const isBottomNavVisivel = !state.aberto && !areaAtual && modoVerTodos === 'hub' && state.aba === 'aulas';

  const content = (
    <div className={`w-full bg-zinc-950 text-foreground relative ${
      isDesktop
        ? 'rounded-2xl pb-12 min-h-[700px] border border-white/5 overflow-hidden'
        : isBottomNavVisivel
          ? 'min-h-screen pb-40'
          : 'min-h-screen pb-[calc(2.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
    }`}>
      <div className="absolute inset-0 z-0 opacity-60">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        {state.gateNodes}

      {/* Hero: exibido na home e na página da área quando nenhum capítulo estiver selecionado. Ao abrir as aulas de um capítulo, a lista assume o layout idêntico ao de Resumos Jurídicos */}
      {(!capituloSelecionado && (areaAtual !== null || modoVerTodos === 'hub')) && (
        <AudioaulasHero 
          areaAtual={areaAtual}
          loading={state.loading}
          totalAulas={areaAtual ? state.daArea.length : state.aulas.length}
          onVoltar={
            areaAtual
              ? () => {
                  resetGlobalScroll();
                  navigate('/audioaulas');
                }
              : () => {
                  resetGlobalScroll();
                  navigate('/');
                }
          }
        />
      )}

      {/* Continue de onde parou (card de retomada rápida) — exclusivo da home hub */}
      {!areaAtual && modoVerTodos === 'hub' && state.aba === 'aulas' && (
        <AudioaulasContinuarOuvindo />
      )}

      {state.loading ? (
        <div className="py-20 grid place-items-center text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : areaAtual ? (
        /* ───────── LISTA DA ÁREA ───────── */
        <AudioaulasListaAulas
          areaAtual={areaAtual}
          aba={state.aba}
          temasDaArea={state.temasDaArea}
          listaAba={state.listaAba}
          busca={state.busca}
          atualId={state.atualId}
          tocando={state.tocando}
          favoritos={state.favoritos}
          alternarFavorito={state.alternarFavorito}
          handleTocarAula={state.handleTocarAula}
          capituloSelecionado={capituloSelecionado}
          setCapituloSelecionado={setCapituloSelecionado}
        />
      ) : state.aba === 'aulas' ? (
        /* ───────── HUB DE ÁREAS COM BUSCA INSTANTÂNEA FUZZY ───────── */
        <AudioaulasBuscaGlobal
          aulas={state.aulas}
          atualId={state.atualId}
          tocando={state.tocando}
          handleTocarAula={state.handleTocarAula}
          favoritos={state.favoritos}
          alternarFavorito={state.alternarFavorito}
          busca={state.busca}
          setBusca={state.setBusca}
        >
          <AudioaulasGridAreas
            areas={state.areas}
            modo={modoVerTodos}
            onModoChange={setModoVerTodos}
          />
        </AudioaulasBuscaGlobal>
      ) : (
        /* ───────── ABAS: favoritas / baixadas / buscar ───────── */
        <>
          {state.aba === 'buscar' && (
            <AudioaulasBuscaInput 
              busca={state.busca}
              setBusca={state.setBusca}
              buscaRef={buscaRef}
            />
          )}

          <AudioaulasListaAulas
            areaAtual={null}
            aba={state.aba}
            temasDaArea={state.temasDaArea}
            listaAba={state.listaAba}
            busca={state.busca}
            atualId={state.atualId}
            tocando={state.tocando}
            favoritos={state.favoritos}
            alternarFavorito={state.alternarFavorito}
            handleTocarAula={state.handleTocarAula}
          />
        </>
      )}

      {/* Player Completo Expandido — Adaptado como Modal Centralizado em Desktop */}
      <AudioaulasPlayerModal
        aberto={state.aberto}
        setAberto={state.setAberto}
        atual={state.atual}
        atualIdx={state.atualIdx}
        fila={state.fila}
        tempo={state.tempo}
        dur={state.dur}
        tocando={state.tocando}
        velocidade={state.velocidade}
        favoritos={state.favoritos}
        alternarFavorito={state.alternarFavorito}
        togglePlay={state.togglePlay}
        seek={state.seek}
        pular={state.pular}
        setVelocidade={state.setVelocidade}
        tocandoIntro={state.tocandoIntro}
      />

      {/* Navegação Inferior das Áudio Aulas — visível estritamente no início */}
      <AudioaulasBottomNav
        ativo={areaAtual ? null : state.aba}
        hidden={!isBottomNavVisivel}
        onSelect={(t) => {
          resetGlobalScroll();
          if (areaAtual) navigate('/audioaulas');
          state.setAba(t);
          state.setAberto(false);
          if (t === 'buscar') window.setTimeout(() => buscaRef.current?.focus(), 150);
          requestAnimationFrame(() => resetGlobalScroll());
        }}
      />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopPageLayout activeId="aprender" title={areaAtual ? `Audioaulas - ${areaAtual}` : "Audioaulas"} wide hideTabs>
        {content}
      </DesktopPageLayout>
    );
  }

  return content;
};

export default Audioaulas;
