import { useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BellRing, BookOpen, Layers, Library, Heart, History, BarChart3, Sparkles, X, ChevronRight, Scale, Landmark, FileText, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import resumosHeroImg from '@/assets/covers/resumos-philosophers-hero.webp';

interface Props {
  totalResumos?: number;
  totalAreas?: number;
  totalTemas?: number;
}

const ResumosHero = ({
  totalResumos = 4694,
  totalAreas = 30,
  totalTemas = 531,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [statsOpen, setStatsOpen] = useState(false);
  const [outrosOpen, setOutrosOpen] = useState(false);
  const isMapas = location.pathname.startsWith('/mapas-mentais') || location.pathname.startsWith('/visuais') || location.pathname.startsWith('/mapas');

  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll idêntico à Home */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 border-b border-rose-500/20"
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

        {/* Imagem de Fundo dos 5 Grandes Filósofos do Direito de Épocas Distintas */}
        <img
          src={resumosHeroImg}
          alt="Filósofos do Direito"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[62%_center] md:object-center z-0 pointer-events-none translate-x-[4%] md:translate-x-0"
        />

        {/* Overlay vermelho com gradiente estilo menu e sombra */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-hero-panel" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            {/* Motivos clássicos do Direito com máscara elegante */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
                maskImage: 'linear-gradient(to right, transparent 20%, black 46%)'
              }}
            >
              <HeroMotifs />
            </div>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </div>

        {/* Glow de Atmosfera */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-rose-600/25 rounded-full blur-3xl pointer-events-none z-[2]" />

        {/* Botões do Topo: Voltar à esquerda e Notificações à direita */}
        <header className="relative z-20 px-4 sm:px-6 md:px-8 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1 flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate('/'); }}
            aria-label="Voltar para tela inicial"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 grid place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest text-rose-200 flex items-center gap-1.5 drop-shadow-md">
              <Layers className="w-3.5 h-3.5 text-white" />
              Direito Prime Resumos
            </span>
            <h1 className="font-display font-bold text-base sm:text-lg text-white drop-shadow-md">
              {isMapas ? 'Mapas Mentais' : 'Resumos Jurídicos'}
            </h1>
          </div>

          <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 pointer-events-none" aria-hidden="true" />
        </header>

        {/* Conteúdo Central do Painel */}
        <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-2 sm:pt-3 pb-2 flex flex-col justify-start min-h-[110px]">
          <div className="flex flex-col items-start text-left z-10 w-[50%] max-w-[280px]">
            <h2 className="font-serif italic text-white text-2xl sm:text-3xl leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              {isMapas ? 'Mapas' : 'Resumos'}
            </h2>

            <p className="font-body text-white/95 text-[9.5px] sm:text-[10.5px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
              {isMapas ? 'INFOGRÁFICOS VISUAIS' : 'DOUTRINA & CONCEITOS'}
            </p>
            
            <div className="mt-2 flex items-center text-left gap-2">
              <div className="w-[2.5px] h-7 bg-white/50 rounded-full shrink-0" />
              <p className="font-serif italic text-white/90 text-xs sm:text-[12.5px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Domine os conceitos,<br/>fixe o essencial.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4 Botões de Ação Rápida no Padrão Audiobooks / Vade Mecum: Favoritos, Recentes, Estatísticas e Outros ── */}
        <div className="relative z-10 px-3 sm:px-6 md:px-8 pb-3.5 pt-1">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
            {/* Botão 1: Favoritos */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate('/resumos-juridicos/favoritos');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Abrir Favoritos"
            >
              <Heart
                className="w-5 h-5 text-rose-500 fill-rose-500/20 group-hover:fill-rose-500 transition-all duration-200 group-hover:scale-110 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Favoritos
              </span>
            </button>

            {/* Botão 2: Recentes */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate('/resumos-juridicos/recentes');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Abrir Recentes"
            >
              <History
                className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Recentes
              </span>
            </button>

            {/* Botão 3: Estatísticas */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setStatsOpen(true);
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Abrir Estatísticas"
            >
              <BarChart3
                className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Estatísticas
              </span>
            </button>

            {/* Botão 4: Outros */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setOutrosOpen(true);
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
              aria-label="Outros Recursos"
            >
              <Sparkles
                className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                strokeWidth={2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
                Outros
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Sheet de Estatísticas */}
      {statsOpen && (
        <>
          <div
            onClick={() => setStatsOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141416] border-t border-white/15 rounded-t-[32px] p-6 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">Estatísticas do Acervo</h3>
              </div>
              <button
                onClick={() => setStatsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <BookOpen className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalResumos.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Resumos</p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <Library className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalAreas.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Áreas</p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <Layers className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalTemas.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Temas</p>
              </div>
            </div>
            <div className="mt-4 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-400 leading-relaxed">
              O acervo de resumos jurídicos é atualizado constantemente com jurisprudência recente, reformas legislativas e foco em bancas de concursos.
            </div>
          </div>
        </>
      )}

      {/* Modal / Sheet de Outros Recursos */}
      {outrosOpen && (
        <>
          <div
            onClick={() => setOutrosOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141416] border-t border-white/15 rounded-t-[32px] p-6 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">Recursos Complementares</h3>
              </div>
              <button
                onClick={() => setOutrosOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  haptic.selection();
                  setOutrosOpen(false);
                  navigate('/resumos-juridicos/materias');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Library className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">Resumos por Matérias</p>
                  <p className="text-xs text-zinc-400">Navegue pelas 30 grandes disciplinas do Direito</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => {
                  haptic.selection();
                  setOutrosOpen(false);
                  navigate('/resumos-juridicos/leis');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">Resumos de Leis e Códigos</p>
                  <p className="text-xs text-zinc-400">Esquematização de diplomas legais e artigos-chave</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => {
                  haptic.selection();
                  setOutrosOpen(false);
                  navigate('/resumos-juridicos/jurisprudencia');
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">Jurisprudência em Teses</p>
                  <p className="text-xs text-zinc-400">Súmulas e julgados do STF e STJ organizados</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </>
      )}

    </>
  );
};

export default memo(ResumosHero);
