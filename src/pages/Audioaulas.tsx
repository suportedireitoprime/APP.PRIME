import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AudioaulasBottomNav from '@/components/audioaulas/AudioaulasBottomNav';

import { useAudioaulas } from '@/hooks/useAudioaulas';
import { AudioaulasHero } from '@/components/audioaulas/home/AudioaulasHero';
import { AudioaulasGridAreas } from '@/components/audioaulas/home/AudioaulasGridAreas';
import { AudioaulasListaAulas } from '@/components/audioaulas/home/AudioaulasListaAulas';
import { AudioaulasBuscaInput } from '@/components/audioaulas/home/AudioaulasBuscaInput';
import { AudioaulasPlayerModal } from '@/components/audioaulas/home/AudioaulasPlayerModal';

const Audioaulas = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const areaAtual = area ? decodeURIComponent(area) : null;
  const buscaRef = useRef<HTMLInputElement | null>(null);

  const state = useAudioaulas(areaAtual);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-background to-background text-foreground pb-40">
      {state.gateNodes}

      <AudioaulasHero 
        areaAtual={areaAtual}
        loading={state.loading}
        totalAulas={areaAtual ? state.daArea.length : state.aulas.length}
      />

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
        />
      ) : state.aba === 'aulas' ? (
        /* ───────── HUB DE ÁREAS ───────── */
        <AudioaulasGridAreas areas={state.areas} />
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
      />

      {/* Navegação Inferior das Áudio Aulas */}
      <AudioaulasBottomNav
        ativo={areaAtual ? null : state.aba}
        hidden={state.aberto}
        onSelect={(t) => {
          if (areaAtual) navigate('/audioaulas');
          state.setAba(t);
          state.setAberto(false);
          if (t === 'buscar') window.setTimeout(() => buscaRef.current?.focus(), 150);
        }}
      />
    </div>
  );
};

export default Audioaulas;
