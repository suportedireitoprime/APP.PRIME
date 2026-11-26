import {
  AlertTriangle,
  ArrowRight,
  Bug,
  Check,
  Copy,
  CornerDownRight,
  ExternalLink,
  Globe,
  Lock,
  MessageSquareQuote,
  TrendingDown,
} from 'lucide-react';
import type { AppRouteItem } from '@/data/appRoutesCatalog';
import { getWeightBadge } from './rotasUtils';

export interface RouteCardProps {
  route: AppRouteItem;
  copiedPath: string | null;
  onCopy: (path: string) => void;
  onAskAI: (route: AppRouteItem) => void;
  onOpen: (route: AppRouteItem) => void;
}

export function RouteCard({ route, copiedPath, onCopy, onAskAI, onOpen }: RouteCardProps) {
  const isCopied = copiedPath === route.path;
  const w = getWeightBadge(route.weightLevel, route.weightEstimate);
  const WeightIcon = w.icon;

  const isBug = route.healthStatus === 'com_bug';
  const isPoucoUsada =
    route.healthStatus === 'pouco_usada' ||
    route.usageLevel === 'rara' ||
    route.usageLevel === 'baixa';
  const isEmRevisao = route.healthStatus === 'em_revisao';

  return (
    <div
      className={`p-3 sm:p-4 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isBug ? 'bg-red-500/[0.04]' : isPoucoUsada ? 'bg-amber-500/[0.02]' : ''
      }`}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-mono text-xs sm:text-[13px] font-bold px-2 py-0.5 rounded-md select-all border ${
              isBug
                ? 'text-red-400 bg-red-500/15 border-red-500/30'
                : 'text-zinc-200 bg-secondary/80 border-border'
            }`}
          >
            {route.path}
          </span>

          {isBug && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
              <Bug className="w-3 h-3 text-red-400 shrink-0" />
              <span>COM BUG DETECTADO</span>
            </span>
          )}

          {isPoucoUsada && !isBug && (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <TrendingDown className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Menos Usada</span>
            </span>
          )}

          {isEmRevisao && (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <AlertTriangle className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Em Revisão</span>
            </span>
          )}

          <span
            title={`Estimativa de carga de bundle e memória: ${route.weightEstimate}${
              route.weightReasons?.length ? ` (${route.weightReasons.join(', ')})` : ''
            }`}
            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-sm ${w.badgeClass}`}
          >
            <WeightIcon className="w-3 h-3 shrink-0" />
            <span>{w.estimate}</span>
            <span className="opacity-80 hidden xs:inline">· {w.label}</span>
          </span>

          {route.isRedirect ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ArrowRight className="w-3 h-3" />
              <span>Redireciona → {route.redirectTarget}</span>
            </span>
          ) : (
            <span className="text-[10px] font-body font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Ativa
            </span>
          )}

          {route.isAdmin && (
            <span className="text-[10px] font-body font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin
            </span>
          )}

          {route.isProtected ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-body px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Lock className="w-2.5 h-2.5" />
              <span>Protegida</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-body px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Globe className="w-2.5 h-2.5" />
              <span>Pública</span>
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CornerDownRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            <span>{route.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground font-normal">
              ({route.component})
            </span>
          </p>

          <p className="font-body text-xs text-muted-foreground leading-relaxed pl-4">
            {route.description}
          </p>

          {route.healthReason && (
            <div
              className={`mt-1.5 ml-4 p-2 rounded-lg border text-xs flex items-start gap-2 ${
                isBug
                  ? 'bg-red-500/10 border-red-500/25 text-red-200'
                  : isPoucoUsada
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-200'
              }`}
            >
              {isBug ? (
                <Bug className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              ) : isPoucoUsada ? (
                <TrendingDown className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-bold">
                  {isBug
                    ? 'Motivo do Bug / Erro:'
                    : isPoucoUsada
                      ? 'Diagnóstico de Baixo Acesso:'
                      : 'Motivo da Revisão:'}
                </span>{' '}
                <span>{route.healthReason}</span>
              </div>
            </div>
          )}

          {route.weightReasons && route.weightReasons.length > 0 && !route.isRedirect && (
            <div className="flex flex-wrap items-center gap-1 pl-4 pt-0.5">
              <span className="text-[10px] text-muted-foreground/60 font-mono">Carga:</span>
              {route.weightReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary/70 text-muted-foreground border border-border/40"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          onClick={() => onAskAI(route)}
          title="Copiar prompt pronto para perguntar à IA sobre esta rota"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-body font-medium transition-colors"
        >
          <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Perguntar à IA</span>
        </button>

        <button
          onClick={() => onCopy(route.path)}
          title="Copiar caminho da rota"
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copiar rota"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onOpen(route)}
          title={`Acessar ${route.exampleUrl} no aplicativo`}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold shadow-sm transition-transform active:scale-95 ${
            isBug ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          <span>{isBug ? 'Testar Erro' : 'Abrir'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
