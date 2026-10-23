import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Infinity as InfinityIcon,
  BookOpen,
  Newspaper,
  Scale,
  Headphones,
  Volume2,
  GraduationCap,
  ListChecks,
  PlayCircle,
  Network,
  Layers,
  HelpCircle,
  FileText,
  Library,
  MessageCircle,
  Highlighter,
  StickyNote,
  Heart,
  Gavel,
  Sparkles,
  Radar,
  Bell,
  Download,
  Pill,
  Presentation,
  Globe,
  Gamepad2,
  LockOpen,
  MicVocal,
  ArrowLeft,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { useMinhaCota, type CotaItem } from '@/hooks/useMinhaCota';
import { haptic } from '@/lib/nativeHaptics';

const ICONES: Record<string, LucideIcon> = {
  audioaula_mes: Headphones,
  audioaula_dia: Headphones,
  audiolei: Volume2,
  aula: GraduationCap,
  lei_seca_praticar: ListChecks,
  videoaula: PlayCircle,
  videoaula_funcoes: PlayCircle,
  mapa_mental: Network,
  flashcards: Layers,
  questoes: HelpCircle,
  questao_funcoes: HelpCircle,
  simulado: FileText,
  biblioteca_ler: Library,
  ia_juridica: MessageCircle,
  chat_juridico: MessageCircle,
  chat_web: Globe,
  perguntar: MessageCircle,
  grifo: Highlighter,
  lei_anotacao: StickyNote,
  lei_favorito: Heart,
  jurisprudencia: Gavel,
  explicacao: Sparkles,
  exemplo: Sparkles,
  termos: BookOpen,
  radar_analise: Radar,
  lembretes: Bell,
  documentos_download: Download,
  resumo_ver: FileText,
  resumo_download: Download,
  resumo_ia: FileText,
  pilulas: Pill,
  apresentacao_ver: Presentation,
  blog_read: Newspaper,
  gamificacao_fase: Gamepad2,
  grafo: Network,
  praticar: ListChecks,
  peticao_inicial: FileText,
  boletins: MicVocal,
};

/** Categorias padronizadas */
const CATEGORIAS: Record<string, string> = {
  audio: 'Áudio & Videoaulas',
  ia: 'Inteligência Artificial',
  estudo: 'Estudo & Memorização',
  leis: 'Leis & Vade Mecum',
  biblioteca: 'Biblioteca & Doutrina',
  blog: 'Blog & Atualidades',
  radar: 'Radar Legislativo',
  ferramentas: 'Ferramentas de Prática',
};

/** Chaves prioritárias que devem aparecer em destaque no topo da tela */
const DESTAQUES_KEYS = new Set([
  'audioaula_mes',
  'audiolei',
  'ia_juridica',
  'questoes',
  'simulado',
  'flashcards',
  'pilulas',
  'mapa_mental',
  'biblioteca_ler',
]);

/** Funções que nunca descontam da cota mensal (sempre 100% livres) */
const LIVRES = [
  {
    key: 'livre_leis',
    label: 'Consultar Leis e Códigos',
    icon: Scale,
    caption: 'Mais de 26.000 leis disponíveis · não desconta da cota',
  },
  {
    key: 'livre_dicionario',
    label: 'Dicionário Jurídico',
    icon: BookOpen,
    caption: 'Sem limite de consultas · não desconta da cota',
  },
  {
    key: 'livre_noticias',
    label: 'Notícias & Informativos',
    icon: Newspaper,
    caption: 'Mais de 2.500 notícias disponíveis · não desconta da cota',
  },
];

/** Anel SVG Circular Elegante para a Cota */
function AnelCircular({ pct }: { pct: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const safePct = Math.min(100, Math.max(0, pct));
  const offset = c * (1 - safePct / 100);

  return (
    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          className="stroke-zinc-800"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="stroke-primary transition-all duration-700 ease-out"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-extrabold text-2xl text-foreground leading-none">
          {safePct}%
        </span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
          Usado
        </span>
      </div>
    </div>
  );
}

/** Card de Linha de Função da Cota */
function CardFuncao({
  icon: Ic,
  label,
  right,
  pct,
  barClass,
  caption,
  destaque = false,
}: {
  icon: LucideIcon;
  label: string;
  right: React.ReactNode;
  pct: number;
  barClass: string;
  caption: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
        destaque
          ? 'bg-zinc-900/90 hover:bg-zinc-850 border-white/10 hover:border-primary/40 shadow-sm'
          : 'bg-zinc-900/70 hover:bg-zinc-850/80 border-border/80 hover:border-border'
      }`}
    >
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Ic className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-[14px] sm:text-[15px] text-foreground truncate">
            {label}
          </span>
          {right}
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11.5px] text-muted-foreground truncate">{caption}</div>
      </div>
    </div>
  );
}

export default function MinhaCota() {
  const navigate = useNavigate();
  const { loading, isPremium, itens, percentual, renovaEm, diasParaRenovar } = useMinhaCota();
  const [abaAtiva, setAbaAtiva] = useState<'principais' | 'todas'>('principais');

  // Separar itens principais dos demais
  const { itensPrincipais, gruposDemais } = useMemo(() => {
    const principais: CotaItem[] = [];
    const outros: Record<string, CotaItem[]> = {};

    itens.forEach((item) => {
      if (DESTAQUES_KEYS.has(item.key)) {
        principais.push(item);
      }
      const cat = item.category || 'outros';
      (outros[cat] ||= []).push(item);
    });

    return {
      itensPrincipais: principais,
      gruposDemais: Object.entries(outros),
    };
  }, [itens]);

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
      {/* Background ShapeGrid oficial */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <ShapeGrid />
      </div>

      {/* Top Header Padrão Ouro com Botão de Voltar */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 py-3 sm:py-3.5 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate(-1);
              }}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-secondary/80 hover:bg-secondary active:scale-95 transition-all text-foreground shrink-0 shadow-sm border border-border/30 cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold font-display uppercase tracking-widest text-foreground truncate">
                Minha Cota
              </h1>
              <p className="text-xs text-muted-foreground font-body truncate">
                {isPremium ? 'Assinatura Premium ativa' : 'Plano gratuito mensal'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5" /> PRO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-white/10">
                Gratuito
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 space-y-5 pt-4">
        {/* Card do Status do Plano no Topo */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
          {/* Brilho decorativo suave */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            {isPremium ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-br from-amber-500/20 via-primary/15 to-transparent border border-amber-500/30 grid place-items-center shrink-0 shadow-lg shadow-black/40">
                <InfinityIcon className="w-12 h-12 text-primary" strokeWidth={2.2} />
              </div>
            ) : (
              <AnelCircular pct={percentual} />
            )}

            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                {isPremium ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Acesso Ilimitado</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cota Gratuita Mensal</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                {isPremium ? 'Você tem acesso ilimitado' : `${percentual}% da sua cota utilizada`}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {isPremium
                  ? 'Todas as funções, áudios, inteligência artificial e simulados estão desbloqueados sem limite de consumo.'
                  : `Sua cota renova em ${diasParaRenovar} dia(s)${
                      renovaEm ? ` · ${renovaEm.toLocaleDateString('pt-BR')}` : ''
                    }. Aproveite os recursos livres.`}
              </p>
            </div>
          </div>

          {!isPremium && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  haptic.impact();
                  navigate('/assinatura');
                }}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-primary to-rose-600 hover:from-primary/95 hover:to-rose-500 text-primary-foreground font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Assinar Prime e Liberar Ilimitado</span>
              </button>
            </div>
          )}
        </div>

        {/* Seção 1: Recursos 100% Sempre Livres (0ms de carregamento) */}
        <section className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h3 className="font-display text-[14px] sm:text-[15px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
              <span>Sempre Livres no App</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Sem desconto
            </span>
          </div>

          <div className="space-y-2.5">
            {LIVRES.map((l) => (
              <CardFuncao
                key={l.key}
                icon={l.icon}
                label={l.label}
                right={
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                    <LockOpen className="w-3.5 h-3.5" /> 100% Livre
                  </span>
                }
                pct={100}
                barClass="bg-linear-to-r from-emerald-500 to-teal-400"
                caption={l.caption}
              />
            ))}
          </div>
        </section>

        {/* Alternância: Principais vs. Todas as Funções */}
        <div className="flex items-center justify-center p-1 rounded-2xl bg-zinc-900 border border-border/80">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaAtiva('principais');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              abaAtiva === 'principais'
                ? 'bg-zinc-800 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ★ Principais Recursos
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setAbaAtiva('todas');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              abaAtiva === 'todas'
                ? 'bg-zinc-800 text-white shadow-xs font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todas as Cotas ({itens.length})
          </button>
        </div>

        {/* Seção 2: Visualização dos Itens da Cota */}
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Carregando sua cota...</span>
          </div>
        ) : abaAtiva === 'principais' ? (
          /* Aba 1: Principais Recursos */
          <section className="space-y-3">
            <div className="px-1 flex items-center justify-between">
              <h3 className="font-display text-[14px] sm:text-[15px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-primary shrink-0" />
                <span>Principais Funções Monitoradas</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {itensPrincipais.length} recursos chave
              </span>
            </div>

            <div className="space-y-2.5">
              {itensPrincipais.map((i) => {
                const pct = isPremium ? 100 : Math.min(100, Math.round((i.used / i.limit) * 100));
                const acabou = !isPremium && i.used >= i.limit;
                const Ic = ICONES[i.key] || Sparkles;

                return (
                  <CardFuncao
                    key={i.key}
                    icon={Ic}
                    label={i.label}
                    pct={pct}
                    destaque={true}
                    barClass={
                      acabou
                        ? 'bg-destructive'
                        : isPremium
                        ? 'bg-linear-to-r from-primary to-amber-400'
                        : 'bg-linear-to-r from-primary/80 to-primary'
                    }
                    right={
                      isPremium ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary shrink-0 bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
                          <InfinityIcon className="w-3.5 h-3.5" /> Ilimitado
                        </span>
                      ) : (
                        <span
                          className={`text-xs shrink-0 font-semibold tabular-nums px-2.5 py-0.5 rounded-full ${
                            acabou
                              ? 'text-destructive bg-destructive/10 border border-destructive/30'
                              : 'text-zinc-300 bg-zinc-800 border border-white/10'
                          }`}
                        >
                          {Math.min(i.used, i.limit)} / {i.limit}
                        </span>
                      )
                    }
                    caption={
                      isPremium
                        ? 'Uso ilimitado liberado para assinantes'
                        : acabou
                        ? `Limite mensal atingido · renova em ${diasParaRenovar} dia(s)`
                        : `${i.limit - i.used} utilizações restantes neste ciclo`
                    }
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* Aba 2: Todas as Cotas Agrupadas por Categoria */
          <div className="space-y-6">
            {gruposDemais.map(([cat, lista]) => (
              <section key={cat} className="space-y-2.5">
                <div className="px-1 flex items-center justify-between">
                  <h3 className="font-display text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-3.5 rounded-full bg-zinc-600 shrink-0" />
                    <span>{CATEGORIAS[cat] || cat}</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {lista.length} {lista.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-2">
                  {lista.map((i) => {
                    const pct = isPremium ? 100 : Math.min(100, Math.round((i.used / i.limit) * 100));
                    const acabou = !isPremium && i.used >= i.limit;
                    const Ic = ICONES[i.key] || Sparkles;

                    return (
                      <CardFuncao
                        key={i.key}
                        icon={Ic}
                        label={i.label}
                        pct={pct}
                        barClass={
                          acabou
                            ? 'bg-destructive'
                            : isPremium
                            ? 'bg-linear-to-r from-primary to-amber-400'
                            : 'bg-linear-to-r from-primary/80 to-primary'
                        }
                        right={
                          isPremium ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary shrink-0">
                              <InfinityIcon className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span
                              className={`text-xs shrink-0 font-medium tabular-nums ${
                                acabou ? 'text-destructive font-semibold' : 'text-zinc-400'
                              }`}
                            >
                              {Math.min(i.used, i.limit)} / {i.limit}
                            </span>
                          )
                        }
                        caption={
                          isPremium
                            ? 'Uso ilimitado'
                            : acabou
                            ? `Esgotado · renova em ${diasParaRenovar} dia(s)`
                            : `${i.limit - i.used} restantes este mês`
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
