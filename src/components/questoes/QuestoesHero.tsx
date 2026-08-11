import { useEffect, useState } from 'react';
import { ListChecks, ChevronRight, Trophy, Award, BarChart2, Sparkles, UserCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import q1 from '@/assets/questoes-hero/q-1.png';
import q2 from '@/assets/questoes-hero/q-2.png';
import q3 from '@/assets/questoes-hero/q-3.png';

const FIGURAS = [q1, q2, q3];

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

const QuestoesHero = ({ pct, total, hoje, acertos, disponiveis }: Props) => {
  const [heroIdx, setHeroIdx] = useState(0);
  const [sheetAberto, setSheetAberto] = useState<'respondidas' | 'precisao' | 'banco' | null>(null);
  const { areas, loading: loadingAreas } = useQuestoesAreas();

  useEffect(() => {
    const id = window.setInterval(() => setHeroIdx((i) => (i + 1) % FIGURAS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;

  const totalSumAreas = areas.reduce((acc, a) => acc + Number(a.total || 0), 0);

  return (
    <section
      className="relative isolate overflow-hidden border-b border-black/20"
      style={{ background: 'linear-gradient(135deg, hsl(258 62% 42%) 0%, hsl(258 72% 58%) 100%)' }}
      aria-label="Seu progresso em questões"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden sm:w-[34%]" aria-hidden="true">
        {FIGURAS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
            style={{ opacity: i === heroIdx ? 1 : 0, filter: 'brightness(0) invert(1)', mixBlendMode: 'soft-light' }}
          />
        ))}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[hsl(258_62%_42%)] via-[hsl(258_62%_42%)]/60 to-transparent" />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.22)" strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="#fff"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-base font-black leading-none text-white">{pct}%</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">Acerto</span>
            </div>
          </div>

          <div className="min-w-0 max-w-[58%]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Hora de praticar</p>
            <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px]">
              Questões
              <span className="ml-2 font-display text-[15px] font-semibold italic text-white/75 sm:text-[20px]">
                comentadas
              </span>
            </h1>
            <p
              className="mt-0.5 text-[12px] leading-snug text-white/80 sm:text-[13px]"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              Resolva, entenda o erro e fixe com a IA.
            </p>
          </div>
        </div>

        {/* ── 3 Caixas Clicáveis do Banner ────────────────── */}
        <div className="relative mt-3 rounded-2xl bg-black/85 text-white shadow-xl ring-1 ring-black/20 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {/* Box 1: Respondidas */}
            <button
              type="button"
              onClick={() => { haptic.selection(); setSheetAberto('respondidas'); }}
              className="flex flex-col items-center justify-center px-1.5 py-2.5 transition-colors hover:bg-white/10 active:scale-95 group"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 group-hover:text-white">Respondidas</span>
                <ChevronRight className="w-2.5 h-2.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="mt-0.5 font-display text-base font-black leading-none text-white">
                {total.toLocaleString('pt-BR')}
              </span>
            </button>

            {/* Box 2: Taxa de Acerto */}
            <button
              type="button"
              onClick={() => { haptic.selection(); setSheetAberto('precisao'); }}
              className="flex flex-col items-center justify-center px-1.5 py-2.5 transition-colors hover:bg-white/10 active:scale-95 group"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 group-hover:text-white">Taxa de Acerto</span>
                <ChevronRight className="w-2.5 h-2.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className={`mt-0.5 font-display text-base font-black leading-none ${pct >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pct}%
              </span>
            </button>

            {/* Box 3: Banco Total */}
            <button
              type="button"
              onClick={() => { haptic.selection(); setSheetAberto('banco'); }}
              className="flex flex-col items-center justify-center px-1.5 py-2.5 transition-colors hover:bg-white/10 active:scale-95 group"
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 group-hover:text-white">Banco Total</span>
                <ChevronRight className="w-2.5 h-2.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="mt-0.5 font-display text-base font-black leading-none text-purple-400">
                {disponiveis > 0 ? disponiveis.toLocaleString('pt-BR') : '25.000+'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <ListChecks className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 text-white/15" />

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
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-600/15 border border-purple-500/40">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-black text-sm text-purple-400">#4</span>
                  <div>
                    <span className="block text-xs font-black text-foreground">Você</span>
                    <span className="block text-[10px] text-muted-foreground">{total} questões respondidas</span>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-400 bg-purple-500/20 px-2.5 py-1 rounded-full">
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
              <Award className="w-5 h-5 text-purple-400" />
              Ranking de Taxa de Acerto
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground font-semibold">
              Alunos com maior precisão e aproveitamento geral:
            </p>

            <div className="space-y-2">
              {/* Sua Posição */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-600/15 border border-purple-500/40">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-black text-sm text-purple-400">#7</span>
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
    </section>
  );
};

export default QuestoesHero;

