import { useState } from 'react';
import { ListChecks, ChevronRight, Trophy, Award, BarChart2, Sparkles, UserCheck, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import { SeloOabBadge } from '@/components/ui/SeloOabBadge';

interface Props {
  /** % de acerto */
  pct: number;
  /** questões respondidas */
  total: number;
  /** respondidas hoje */
  hoje: number;
  /** acertos acumulados */
  acertos: number;
  /** total de questões disponíveis no banco */
  disponiveis: number;
  /** Função para voltar (header) */
  onBack?: () => void;
}

const RANKING_RESPONDIDAS = [
  { pos: 1, nome: 'Dr. Lucas Andrade', total: 14820, pct: 92, avatar: '🥇' },
  { pos: 2, nome: 'Mariana Fonseca', total: 12450, pct: 89, avatar: '🥈' },
  { pos: 3, nome: 'Carlos Eduardo', total: 10980, pct: 87, avatar: '🥉' },
  { pos: 4, nome: 'Juliana Paes', total: 9420, pct: 85, avatar: '⭐' },
  { pos: 5, nome: 'Thiago Martins', total: 8750, pct: 84, avatar: '⭐' },
  { pos: 6, nome: 'Fernanda Lima', total: 7910, pct: 82, avatar: '⭐' },
];

const RANKING_PRECISAO = [
  { pos: 1, nome: 'Beatriz Lima', pct: 96.4, total: 8400, avatar: '🥇' },
  { pos: 2, nome: 'Rafael Silveira', pct: 94.2, total: 9120, avatar: '🥈' },
  { pos: 3, nome: 'Gabriela Castro', pct: 93.8, total: 7890, avatar: '🥉' },
  { pos: 4, nome: 'Rodrigo Alves', pct: 91.5, total: 6540, avatar: '⭐' },
  { pos: 5, nome: 'Vanessa Rocha', pct: 90.1, total: 7110, avatar: '⭐' },
  { pos: 6, nome: 'Marcelo Souza', pct: 89.6, total: 5980, avatar: '⭐' },
];

const QuestoesHero = ({ pct, total, hoje, acertos, disponiveis, onBack }: Props) => {
  const [sheetAberto, setSheetAberto] = useState<'respondidas' | 'precisao' | 'banco' | null>(null);
  const { areas, loading: loadingAreas } = useQuestoesAreas();

  const totalSumAreas = areas.reduce((acc, a) => acc + Number(a.total || 0), 0);

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* ── Cabeçalho Nativo ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between border-b border-white/5">
        <button 
          onClick={() => {
            try { haptic.selection(); } catch {}
            onBack?.();
          }} 
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11">
          QUESTÕES
        </h1>
      </div>

      {/* ── Painel Principal de Questões (Vermelho Oficial #e11d48) ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Questões"
      >
        {/* Fundo Vermelho Oficial */}
        <div className="absolute inset-0 bg-hero-panel -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de questões no fundo */}
        <ListChecks
          className="absolute -right-4 -bottom-4 w-36 h-36 text-white/[0.12] pointer-events-none"
          strokeWidth={1.2}
        />

        {/* Personagem 3D Oficial das Questões */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[35%] overflow-hidden flex items-end justify-end z-0"
          aria-hidden="true"
        >
          <img
            src="/assets/praticar-questoes.webp"
            alt="Questões Comentadas"
            className="h-[105%] w-auto object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-1.5"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[hsl(350_74%_42%)] to-transparent pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Selo / Rosca de Progresso à esquerda */}
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
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-rose-200">Acerto</span>
                </div>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HORA DE PRATICAR ⚖️
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                QUESTÕES <span className="font-light not-italic text-rose-200">COMENTADAS</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Resolva, entenda o erro e fixe com a IA.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior: RESPONDIDAS, TAXA DE ACERTO, BANCO TOTAL ───────────────── */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* 1. Respondidas */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setSheetAberto('respondidas');
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>RESPONDIDAS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {total.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* 2. Taxa de Acerto */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setSheetAberto('precisao');
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>TAXA DE ACERTO</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className={`font-display text-base sm:text-lg font-black mt-0.5 ${pct >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
              {disponiveis > 0 ? disponiveis.toLocaleString('pt-BR') : '25.000+'}
            </div>
          </button>
        </div>
      </section>

      {/* ── Modais / Sheets Clicáveis ────────────────── */}

      {/* Sheet 1: Ranking por Questões Respondidas */}
      <Sheet open={sheetAberto === 'respondidas'} onOpenChange={(v) => !v && setSheetAberto(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-black text-foreground">
              <Trophy className="w-5 h-5 text-amber-400" />
              Ranking de Questões Praticadas
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground font-semibold">
              Alunos que mais resolveram questões na plataforma:
            </p>

            <div className="space-y-2">
              {/* Sua Posição */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E11D48]/15 border border-[#E11D48]/40">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-black text-sm text-red-400">#4</span>
                  <div>
                    <span className="block text-xs font-black text-foreground">Você</span>
                    <span className="block text-[10px] text-muted-foreground">{total} questões respondidas</span>
                  </div>
                </div>
                <span className="text-xs font-black text-red-400 bg-red-500/20 px-2.5 py-1 rounded-full">
                  {pct}% acerto
                </span>
              </div>

              {RANKING_RESPONDIDAS.map((u) => (
                <div key={u.pos} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-center text-sm font-black">{u.avatar}</span>
                    <div>
                      <span className="block text-xs font-extrabold text-foreground">{u.nome}</span>
                      <span className="block text-[10px] text-muted-foreground">{u.total.toLocaleString('pt-BR')} questões</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {u.pct}% acerto
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet 2: Ranking por Taxa de Acerto */}
      <Sheet open={sheetAberto === 'precisao'} onOpenChange={(v) => !v && setSheetAberto(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-black text-foreground">
              <Award className="w-5 h-5 text-red-400" />
              Ranking de Taxa de Acerto
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground font-semibold">
              Alunos com maior precisão e aproveitamento geral:
            </p>

            <div className="space-y-2">
              {/* Sua Posição */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E11D48]/15 border border-[#E11D48]/40">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-black text-sm text-red-400">#7</span>
                  <div>
                    <span className="block text-xs font-black text-foreground">Você</span>
                    <span className="block text-[10px] text-muted-foreground">{total} praticadas</span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                  {pct}% precisão
                </span>
              </div>

              {RANKING_PRECISAO.map((u) => (
                <div key={u.pos} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-center text-sm font-black">{u.avatar}</span>
                    <div>
                      <span className="block text-xs font-extrabold text-foreground">{u.nome}</span>
                      <span className="block text-[10px] text-muted-foreground">{u.total.toLocaleString('pt-BR')} praticadas</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400">
                    {u.pct}% acertos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet 3: Distribuição do Banco por Matéria */}
      <Sheet open={sheetAberto === 'banco'} onOpenChange={(v) => !v && setSheetAberto(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-black text-foreground">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              Banco de Questões por Matéria
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground font-semibold">
              Total de <strong className="text-foreground">{disponiveis > 0 ? disponiveis.toLocaleString('pt-BR') : '25.000+'}</strong> questões catalogadas na plataforma:
            </p>

            {loadingAreas ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">Carregando dados do banco...</div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {areas.map((a) => {
                  const perc = totalSumAreas > 0 ? Math.round((Number(a.total) / totalSumAreas) * 100) : 0;
                  return (
                    <div key={a.area} className="space-y-1.5 bg-secondary/50 p-3 rounded-2xl border border-border/40">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground truncate max-w-[200px]">{a.area}</span>
                        <span className="text-amber-400 font-extrabold">{Number(a.total).toLocaleString('pt-BR')} q. ({perc}%)</span>
                      </div>
                      <div className="w-full bg-background/80 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(perc, 5)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default QuestoesHero;

