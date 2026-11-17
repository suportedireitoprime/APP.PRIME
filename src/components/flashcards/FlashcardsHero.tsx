import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronRight, Trophy, BarChart2, Sparkles, Flame, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  /** % de retenção / acerto */
  pct: number;
  /** cards estudados / respondidos */
  total: number;
  /** cards estudados hoje */
  hoje: number;
  /** cards compreendidos */
  compreendidos: number;
  /** total de flashcards disponíveis no banco */
  disponiveis: number;
  /** ofensiva em dias */
  streak?: number;
  /** Função para voltar (header) */
  onBack?: () => void;
  onNavigateHistorico?: () => void;
  onNavigateProgresso?: () => void;
}

const RANKING_FLASHCARDS = [
  { pos: 1, nome: 'Dr. Lucas Andrade', total: 4280, pct: 94, avatar: '🥇' },
  { pos: 2, nome: 'Mariana Fonseca', total: 3950, pct: 91, avatar: '🥈' },
  { pos: 3, nome: 'Carlos Eduardo', total: 3410, pct: 89, avatar: '🥉' },
  { pos: 4, nome: 'Juliana Paes', total: 2980, pct: 88, avatar: '⭐' },
  { pos: 5, nome: 'Thiago Martins', total: 2750, pct: 86, avatar: '⭐' },
  { pos: 6, nome: 'Fernanda Lima', total: 2410, pct: 85, avatar: '⭐' },
];

export const FlashcardsHero = ({
  pct,
  total,
  hoje,
  compreendidos,
  disponiveis,
  streak = 0,
  onBack,
  onNavigateHistorico,
  onNavigateProgresso,
}: Props) => {
  const navigate = useNavigate();
  const [sheetAberto, setSheetAberto] = useState<'revisados' | 'retencao' | 'banco' | null>(null);

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* ── Cabeçalho Nativo ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between border-b border-white/5">
        <button 
          onClick={() => {
            try { haptic.selection(); } catch {}
            if (onBack) {
              onBack();
            } else {
              navigate('/');
            }
          }} 
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar para o início"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11">
          FLASHCARDS
        </h1>
      </div>

      {/* ── Painel Principal de Flashcards (Azul Oficial #2563eb / #1d4ed8) ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Flashcards"
      >
        {/* Fundo Azul Oficial */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de cards no fundo */}
        <Layers
          className="absolute -right-4 -bottom-4 w-36 h-36 text-white/[0.12] pointer-events-none"
          strokeWidth={1.2}
        />

        {/* Personagem 3D Oficial dos Flashcards */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[35%] overflow-hidden flex items-end justify-end z-0"
          aria-hidden="true"
        >
          <img
            src="/assets/praticar-flashcards.webp"
            alt="Flashcards Inteligentes"
            className="h-[105%] w-auto object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-1.5"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#1d4ed8] to-transparent pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Selo / Rosca de Progresso / Retenção à esquerda */}
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm relative">
                <svg width={56} height={56} className="-rotate-90">
                  <circle cx={28} cy={28} r={22} stroke="rgba(255,255,255,0.2)" strokeWidth={4.5} fill="none" />
                  <circle
                    cx={28}
                    cy={28}
                    r={22}
                    stroke="#fff"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={(2 * Math.PI * 22) - (pct / 100) * (2 * Math.PI * 22)}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-black leading-none text-white">{pct}%</span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-blue-200">Retenção</span>
                </div>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                HORA DE PRATICAR ⚡
                {streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded bg-orange-500/30 text-orange-300 font-black text-[9px]">
                    <Flame className="w-2.5 h-2.5 text-orange-400 fill-current" />
                    {streak}d
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                FLASHCARDS <span className="font-light not-italic text-blue-200">INTERATIVOS</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Memorize, revise no tempo certo e fixe com repetição espaçada.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior: REVISADOS, RETENÇÃO, BANCO TOTAL ───────────────── */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* 1. Revisados / Estudados */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              if (onNavigateHistorico) onNavigateHistorico();
              else setSheetAberto('revisados');
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>REVISADOS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {total.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* 2. Taxa de Retenção */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              if (onNavigateProgresso) onNavigateProgresso();
              else setSheetAberto('retencao');
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>RETENÇÃO</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className={`font-display text-base sm:text-lg font-black mt-0.5 ${pct >= 60 ? 'text-cyan-300' : 'text-blue-300'}`}>
              {pct}%
            </div>
          </button>

          {/* 3. Banco Total */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setSheetAberto('banco');
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>BANCO TOTAL</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {disponiveis > 0 ? disponiveis.toLocaleString('pt-BR') : '127.200'}
            </div>
          </button>
        </div>
      </section>

      {/* ── Modais / Sheets Clicáveis ────────────────── */}
      {/* 1. Modal Revisados / Ranking */}
      <Sheet open={sheetAberto === 'revisados'} onOpenChange={(open) => !open && setSheetAberto(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-zinc-950 border-t border-white/10 text-white max-h-[85vh] overflow-y-auto p-6">
          <SheetHeader className="text-left mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Top Estudantes</span>
            </div>
            <SheetTitle className="text-xl font-black text-white">Cards Revisados</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {RANKING_FLASHCARDS.map((r) => (
              <div key={r.pos} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.avatar}</span>
                  <div>
                    <p className="font-bold text-sm text-white">{r.nome}</p>
                    <p className="text-xs text-white/50">{r.pct}% de retenção</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-blue-400">{r.total.toLocaleString('pt-BR')} cards</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* 2. Modal Retenção */}
      <Sheet open={sheetAberto === 'retencao'} onOpenChange={(open) => !open && setSheetAberto(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-zinc-950 border-t border-white/10 text-white max-h-[85vh] overflow-y-auto p-6">
          <SheetHeader className="text-left mb-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <BarChart2 className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Desempenho</span>
            </div>
            <SheetTitle className="text-xl font-black text-white">Taxa de Retenção</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-white/70 mb-4">
            Sua taxa de retenção indica a porcentagem de flashcards compreendidos e dominados em relação aos revisados.
          </p>
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-3xl font-black text-blue-400">{pct}%</span>
            <p className="text-xs text-white/60 mt-1">Nível de Fixação Atual</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* 3. Modal Banco Total */}
      <Sheet open={sheetAberto === 'banco'} onOpenChange={(open) => !open && setSheetAberto(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-zinc-950 border-t border-white/10 text-white max-h-[85vh] overflow-y-auto p-6">
          <SheetHeader className="text-left mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Acervo Completo</span>
            </div>
            <SheetTitle className="text-xl font-black text-white">Banco de Flashcards</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-white/70">
            Mais de <strong className="text-white">{disponiveis.toLocaleString('pt-BR')} flashcards</strong> cobrindo todas as disciplinas jurídicas, artigos de lei, súmulas e jurisprudência com repetição espaçada.
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FlashcardsHero;
