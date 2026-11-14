import React, { useState } from 'react';
import { ArrowLeft, Search, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioActionShortcuts } from '@/components/audio/AudioActionShortcuts';
import { type AulaAudio } from '@/contexts/AudioaulasPlayerContext';
import { haptic } from '@/lib/nativeHaptics';
import { resetGlobalScroll } from '@/lib/scrollUtils';
import audioaulasOnibusCover from '@/assets/audioaulas-onibus-cover.jpg';
import AudioaulasHeroWave from './AudioaulasHeroWave';

const AudioFavoritosModal = React.lazy(() => import('@/components/audio/AudioFavoritosModal').then((m) => ({ default: m.AudioFavoritosModal })));
const AudioRecentesModal = React.lazy(() => import('@/components/audio/AudioRecentesModal').then((m) => ({ default: m.AudioRecentesModal })));
const AudioEstatisticasModal = React.lazy(() => import('@/components/audio/AudioEstatisticasModal').then((m) => ({ default: m.AudioEstatisticasModal })));
const AudioEmAltaModal = React.lazy(() => import('@/components/audio/AudioEmAltaModal').then((m) => ({ default: m.AudioEmAltaModal })));
const AudioTrilhasModal = React.lazy(() => import('@/components/audio/AudioTrilhasModal').then((m) => ({ default: m.AudioTrilhasModal })));

interface AudioaulasHeroProps {
  areaAtual: string | null;
  loading: boolean;
  totalAulas: number;
  totalAreas?: number;
  totalFavoritas?: number;
  aulasFavoritas?: AulaAudio[];
  totalRecentes?: number;
  aulasRecentes?: AulaAudio[];
  onTocarAula?: (aula: AulaAudio, fila?: AulaAudio[]) => void;
  onAlternarFavoritoAula?: (aula: AulaAudio) => void;
  aulas?: AulaAudio[];
  onBuscar?: () => void;
  onFavoritos?: () => void;
  onRecentes?: () => void;
  onLimparRecentes?: () => void;
  onEmAlta?: () => void;
  onEstatistica?: () => void;
  onTrilhas?: () => void;
  onVoltar?: () => void;
  subtituloCustom?: string;
  tituloCustom?: string;
  unidadeCustom?: string;
}

export const AudioaulasHero: React.FC<AudioaulasHeroProps> = React.memo(
  function AudioaulasHero({
    areaAtual,
    loading,
    totalAulas,
    totalAreas = 12,
    totalFavoritas = 0,
    aulasFavoritas = [],
    totalRecentes = 0,
    aulasRecentes = [],
    onTocarAula,
    onAlternarFavoritoAula,
    aulas = [],
    onBuscar,
    onFavoritos,
    onRecentes,
    onLimparRecentes,
    onEmAlta,
    onEstatistica,
    onTrilhas,
    onVoltar,
    subtituloCustom,
    tituloCustom,
    unidadeCustom,
  }) {
    const navigate = useNavigate();

    const [recentesOpen, setRecentesOpen] = useState(false);
    const [favoritosOpen, setFavoritosOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [emAltaOpen, setEmAltaOpen] = useState(false);
    const [trilhasOpen, setTrilhasOpen] = useState(false);

    const isEca = areaAtual && /eca|criança|adolescente/i.test(areaAtual);
    const heroTitulo =
      tituloCustom ||
      (isEca
        ? 'ECA'
        : areaAtual
          ? areaAtual.replace(/^Direitos?\s+(do\s+)?/i, '').trim()
          : 'Áudio Aulas');

    const heroSub =
      subtituloCustom ||
      (isEca
        ? 'Estatuto da Criança e do Adolescente'
        : areaAtual
          ? `ÁREA: ${areaAtual.toUpperCase()}`
          : 'DOUTRINA EM ÁUDIO');

    const handleVoltar = () => {
      resetGlobalScroll();
      if (onVoltar) {
        onVoltar();
      } else if (areaAtual) {
        navigate('/audioaulas');
      } else {
        navigate('/');
      }
      requestAnimationFrame(() => resetGlobalScroll());
    };

    return (
      <div className="relative mb-6">
        {/* Shell unificado com o painel da Home, Resumos e Biblioteca */}
        <div
          className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
          style={{
            transform: 'translateZ(0)',
            backgroundColor: '#050505',
          }}
        >
          {/* Blindagem de overscroll superior contra vazamento do fundo */}
          <div
            className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
            style={{ backgroundColor: '#050505' }}
            aria-hidden="true"
          />

          {/* Imagem de Capa Oficial (Mulher no ônibus ouvindo com fones ao pôr do sol) */}
          <img
            src={audioaulasOnibusCover}
            alt="Estudante ouvindo áudio aulas no trajeto"
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%] md:object-[center_25%] z-0 pointer-events-none transform-gpu will-change-transform"
          />

          {/* Onda Hiper-Realista 3D em Laranja Salmão / Coral */}
          <AudioaulasHeroWave />

          {/* Cabeçalho Superior Transparente (Botão de Voltar e Busca) */}
          <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
            <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  haptic.selection();
                  handleVoltar();
                }}
                aria-label="Voltar"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>

              {onBuscar && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onBuscar();
                  }}
                  aria-label="Pesquisar áudio aulas"
                  className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
                >
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </header>

          {/* Conteúdo: Tipografia de Marca Minimalista */}
          <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px]">
            <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-4 sm:ml-6 max-w-[270px]">
              {/* Espaçador para o botão de voltar */}
              <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

              {/* Tipografia de Marca: Áudio Aulas (branco) + Especializada/Doutrina (laranja salmão) */}
              <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
                <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                  {heroTitulo}
                </span>
                <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#ffa285] block drop-shadow-[0_2px_14px_rgba(255,107,74,0.65)] -mt-0.5">
                  {areaAtual ? 'Especializada' : 'Jurídicas'}
                </span>
              </h1>

              {/* Traço vertical laranja salmão e slogan */}
              <div className="mt-2 flex items-start text-left gap-2">
                <div className="w-[3px] h-8 bg-gradient-to-b from-[#ffa285] via-[#ff6b4a] to-[#7a2616] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(255,107,74,0.6)]" />
                <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  Estudo dinâmico em áudio.
                  <br />
                  Aprenda no trajeto ou onde estiver.
                </p>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos flutuando sobre a onda laranja salmão */}
          <div className="relative z-10 px-3 sm:px-5 pt-2 pb-3">
            <AudioActionShortcuts
              colorScheme="salmon"
              onRecentes={() => {
                if (onRecentes) onRecentes();
                else setRecentesOpen(true);
              }}
              onEmAlta={() => {
                if (onEmAlta) onEmAlta();
                else setEmAltaOpen(true);
              }}
              onEstatistica={() => {
                if (onEstatistica) onEstatistica();
                else setStatsOpen(true);
              }}
              onFavoritos={() => {
                if (onFavoritos) onFavoritos();
                else setFavoritosOpen(true);
              }}
              onTrilhas={() => {
                if (onFavoritos) onFavoritos();
                else setFavoritosOpen(true);
              }}
              badgeRecentes={totalRecentes || aulasRecentes.length}
              badgeFavoritos={totalFavoritas || aulasFavoritas?.length || 0}
            />
          </div>
        </div>

        {/* Modais de Ações de Áudio (Carregados sob demanda) */}
        {recentesOpen && (
          <React.Suspense fallback={null}>
            <AudioRecentesModal
              isOpen={recentesOpen}
              onClose={() => setRecentesOpen(false)}
              colorScheme="salmon"
              aulasRecentes={aulasRecentes}
              onTocarAula={onTocarAula}
              onLimparRecentes={onLimparRecentes}
              onAlternarFavoritoAula={onAlternarFavoritoAula}
            />
          </React.Suspense>
        )}
        {favoritosOpen && (
          <React.Suspense fallback={null}>
            <AudioFavoritosModal
              isOpen={favoritosOpen}
              onClose={() => setFavoritosOpen(false)}
              colorScheme="salmon"
              aulasFavoritas={aulasFavoritas}
              onTocarAula={onTocarAula}
              onAlternarFavoritoAula={onAlternarFavoritoAula}
            />
          </React.Suspense>
        )}
        {statsOpen && (
          <React.Suspense fallback={null}>
            <AudioEstatisticasModal
              isOpen={statsOpen}
              onClose={() => setStatsOpen(false)}
              colorScheme="salmon"
            />
          </React.Suspense>
        )}
        {emAltaOpen && (
          <React.Suspense fallback={null}>
            <AudioEmAltaModal
              isOpen={emAltaOpen}
              onClose={() => setEmAltaOpen(false)}
              colorScheme="salmon"
              aulas={aulas}
              onTocarAula={onTocarAula}
            />
          </React.Suspense>
        )}
        {trilhasOpen && (
          <React.Suspense fallback={null}>
            <AudioTrilhasModal
              isOpen={trilhasOpen}
              onClose={() => setTrilhasOpen(false)}
              colorScheme="purple"
            />
          </React.Suspense>
        )}
      </div>
    );
  }
);

export default AudioaulasHero;
