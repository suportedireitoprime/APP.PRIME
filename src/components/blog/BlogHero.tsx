import React, { memo } from 'react';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioActionShortcuts } from '@/components/audio/AudioActionShortcuts';
import { haptic } from '@/lib/nativeHaptics';
import { resetGlobalScroll } from '@/lib/scrollUtils';
import blogRomaCover from '@/assets/blog/blog-roma-antiga-cover.webp';
import BlogHeroWave from './BlogHeroWave';

interface BlogHeroProps {
  totalArtigos: number;
  totalFavoritos?: number;
  totalRecentes?: number;
  onBuscar?: () => void;
  onVoltar?: () => void;
  onRecentes?: () => void;
  onEmAlta?: () => void;
  onEstatistica?: () => void;
  onFavoritos?: () => void;
  onTrilhas?: () => void;
  categoriaAtual?: string;
}

export const BlogHero: React.FC<BlogHeroProps> = memo(function BlogHero({
  totalArtigos,
  totalFavoritos = 0,
  totalRecentes = 0,
  onBuscar,
  onVoltar,
  onRecentes,
  onEmAlta,
  onEstatistica,
  onFavoritos,
  onTrilhas,
  categoriaAtual,
}) {
  const navigate = useNavigate();

  const handleVoltar = () => {
    resetGlobalScroll();
    if (onVoltar) {
      onVoltar();
    } else {
      navigate('/');
    }
    requestAnimationFrame(() => resetGlobalScroll());
  };

  const isFilosofia = categoriaAtual === 'filosofia';
  const isConstitucional = categoriaAtual === 'constitucional';
  const isPenal = categoriaAtual === 'penal';

  const heroTitulo1 = isFilosofia
    ? 'Filosofia &'
    : isConstitucional
      ? 'Constitucional &'
      : isPenal
        ? 'Penal &'
        : 'Artigos &';

  const heroTitulo2 = isFilosofia
    ? 'Teoria'
    : isConstitucional
      ? 'Garantias'
      : isPenal
        ? 'Dogmática'
        : 'Doutrina';

  return (
    <div className="relative mb-6">
      {/* Shell unificado idêntico ao painel de Áudio Aulas e Biblioteca */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/70 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[315px] xs:min-h-[330px] sm:min-h-[355px]"
        style={{
          transform: 'translateZ(0)',
          backgroundColor: '#040d16',
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#040d16' }}
          aria-hidden="true"
        />

        {/* Imagem de Capa Oficial: Roma Antiga com Céu Azul Claro Luminoso */}
        <img
          src={blogRomaCover}
          alt="Fórum de Roma Antiga sob céu azul límpido"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_28%] md:object-[center_22%] z-0 pointer-events-none transform-gpu will-change-transform"
        />

        {/* Onda 3D Hiper-Realista em Cetim Azul Celeste / Céu Claro */}
        <BlogHeroWave />

        {/* Cabeçalho Superior Transparente (Botão de Voltar e Busca) */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                haptic.selection();
                handleVoltar();
              }}
              aria-label="Voltar para o início"
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
                aria-label="Pesquisar artigos do blog"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo: Tipografia de Marca Minimalista no Estilo Audiobook */}
        <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[160px] sm:min-h-[175px]">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-4 sm:ml-6 max-w-[285px]">
            {/* Espaçador para o botão de voltar */}
            <div className="h-[64px] sm:h-[72px] mb-2 shrink-0 w-full" aria-hidden="true" />

            {/* Pill de Categoria / Contagem */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-[10px] font-bold tracking-widest uppercase mb-1 shadow-sm backdrop-blur-md">
              <BookOpen className="w-3 h-3 text-sky-300" />
              <span>{totalArtigos} Artigos Publicados</span>
            </div>

            {/* Tipografia de Marca no Padrão Editorial Playfair Display */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[26px] sm:text-[30px] font-medium text-white block">
                {heroTitulo1}
              </span>
              <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-[#38bdf8] block drop-shadow-[0_2px_16px_rgba(56,189,248,0.85)] -mt-0.5">
                {heroTitulo2}
              </span>
            </h1>

            {/* Traço vertical azul celeste e slogan */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0369a1] rounded-full shrink-0 mt-0.5 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
              <p className="font-serif italic text-white/95 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                Teses, reflexões e doutrina clássica.
                <br />
                Do Fórum Romano ao direito moderno.
              </p>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos com Esquema Azul Claro Celeste (Sky) */}
        <div className="relative z-10 px-4 sm:px-6 pt-2 pb-5 sm:pb-6">
          <AudioActionShortcuts
            colorScheme="sky"
            onRecentes={onRecentes}
            onEmAlta={onEmAlta}
            onEstatistica={onEstatistica}
            onFavoritos={onFavoritos}
            onTrilhas={onTrilhas || onFavoritos}
            badgeRecentes={totalRecentes}
            badgeFavoritos={totalFavoritos}
          />
        </div>
      </div>
    </div>
  );
});

export default BlogHero;
