import { useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Layers, Library, Heart, History, 
  BarChart3, Sparkles, X, ChevronRight, Scale, Landmark 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import resumosHeroImg from '@/assets/covers/resumos-juristas-jardim.jpg';
import ResumosHeroWave from './ResumosHeroWave';

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
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll idêntico a Pílulas */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
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

        {/* Imagem de Capa Oficial dos Três Juristas no Jardim Clássico */}
        <img
          src={resumosHeroImg}
          alt="Juristas e Filósofos do Direito no Jardim"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] md:object-[center_30%] z-0 pointer-events-none transform-gpu will-change-transform"
        />

        {/* Onda Hiper-Realista 3D em Tom Verde Botânico / Esmeralda Acetinado */}
        <ResumosHeroWave />

        {/* Cabeçalho Superior Transparente (Botão de Voltar Padrão Ouro do Projeto) */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                haptic.selection();
                navigate('/');
              }}
              aria-label="Voltar para tela inicial"
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Conteúdo: Tipografia de Marca Minimalista no Estilo Pílulas */}
        <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px]">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-4 sm:ml-6 max-w-[260px]">
            {/* Espaçador para o botão de voltar */}
            <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

            {/* Tipografia de Marca Minimalista: Resumos (branco) + Jurídicos (verde esmeralda) */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                {isMapas ? 'Mapas' : 'Resumos'}
              </span>
              <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-[#86efac] block drop-shadow-[0_2px_14px_rgba(74,222,128,0.55)] -mt-0.5">
                {isMapas ? 'Mentais' : 'Jurídicos'}
              </span>
            </h1>

            {/* Traço vertical verde esmeralda e slogan minimalista */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-[#86efac] via-[#22c55e] to-[#14532d] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
              <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Domine os conceitos.
                <br />
                Fixe o essencial.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4 Atalhos Rápidos no Rodapé do Painel (Padrão Vidro Fosco Pílulas) ── */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/45 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
            {/* Botão 1: Favoritos */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate('/resumos-juridicos/favoritos');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1.5 text-center cursor-pointer select-none"
              aria-label="Abrir Favoritos"
            >
              <Heart
                className="w-5 h-5 text-[#86efac] group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                strokeWidth={2}
              />
              <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap text-white/85 group-hover:text-white drop-shadow-sm">
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
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1.5 text-center cursor-pointer select-none"
              aria-label="Abrir Recentes"
            >
              <History
                className="w-5 h-5 text-[#86efac] group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                strokeWidth={2}
              />
              <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap text-white/85 group-hover:text-white drop-shadow-sm">
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
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1.5 text-center cursor-pointer select-none"
              aria-label="Abrir Estatísticas"
            >
              <BarChart3
                className="w-5 h-5 text-[#86efac] group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                strokeWidth={2}
              />
              <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap text-white/85 group-hover:text-white drop-shadow-sm">
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
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1.5 text-center cursor-pointer select-none"
              aria-label="Outros Recursos"
            >
              <Sparkles
                className="w-5 h-5 text-[#86efac] group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                strokeWidth={2}
              />
              <span className="text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap text-white/85 group-hover:text-white drop-shadow-sm">
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
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-lg text-white">Estatísticas do Acervo</h3>
              </div>
              <button
                onClick={() => setStatsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <BookOpen className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalResumos.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Resumos</p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <Library className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalAreas.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Áreas</p>
              </div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3.5 text-center">
                <Layers className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold font-display text-white">{totalTemas.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Temas</p>
              </div>
            </div>
            <div className="mt-4 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-400 leading-relaxed">
              O acervo de resumos jurídicos é atualizado constantemente com doutrina selecionada, jurisprudência recente e foco em aprovação.
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
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-lg text-white">Recursos Complementares</h3>
              </div>
              <button
                onClick={() => setOutrosOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
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
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
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
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
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
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
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
