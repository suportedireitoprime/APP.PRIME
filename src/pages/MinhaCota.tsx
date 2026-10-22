import { useNavigate } from 'react-router-dom';
import { Crown, Infinity as InfinityIcon, BookOpen, Newspaper, Scale, Headphones, Volume2, GraduationCap, ListChecks, PlayCircle, Network, Layers, HelpCircle, FileText, Library, MessageCircle, Highlighter, StickyNote, Heart, Gavel, Sparkles, Radar, Bell, Download, Pill, Presentation, Globe, Gamepad2, LockOpen, type LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ICONES: Record<string, LucideIcon> = {
  audioaula_mes: Headphones, audioaula_dia: Headphones, audiolei: Volume2, aula: GraduationCap, lei_seca_praticar: ListChecks,
  videoaula: PlayCircle, videoaula_funcoes: PlayCircle, mapa_mental: Network, flashcards: Layers, questoes: HelpCircle, questao_funcoes: HelpCircle,
  simulado: FileText, biblioteca_ler: Library, ia_juridica: MessageCircle, chat_juridico: MessageCircle, chat_web: Globe, perguntar: MessageCircle,
  grifo: Highlighter, lei_anotacao: StickyNote, lei_favorito: Heart, jurisprudencia: Gavel, explicacao: Sparkles, exemplo: Sparkles, termos: BookOpen,
  radar_analise: Radar, lembretes: Bell, documentos_download: Download, resumo_ver: FileText, resumo_download: Download, resumo_ia: FileText,
  pilulas: Pill, apresentacao_ver: Presentation, blog_read: Newspaper, gamificacao_fase: Gamepad2, grafo: Network, praticar: ListChecks, peticao_inicial: FileText,
};

/** Tabela com o acervo disponível de cada função (para mostrar "X disponíveis"). */
const ACERVO: Record<string, string> = {
  audioaula_mes: 'audioaulas_acervo', audiolei: 'narracoes_artigos', aula: 'aprender_aulas', lei_seca_praticar: 'lei_seca_licoes',
  flashcards: 'flashcards_cards', pilulas: 'pilulas_cards', biblioteca_ler: 'biblioteca_estudos', mapa_mental: 'mapas_mentais',
  livre_leis: 'vade_mecum_artigos', livre_noticias: 'noticias_juridicas',
};

/** Funções que nunca descontam da cota, de plano. */
const LIVRES: { key: string; label: string; icon: LucideIcon; acervo?: boolean }[] = [
  { key: 'livre_dicionario', label: 'Dicionário jurídico', icon: BookOpen },
  { key: 'livre_leis', label: 'Consultar leis', icon: Scale, acervo: true },
  { key: 'livre_noticias', label: 'Notícias jurídicas', icon: Newspaper, acervo: true },
];

function useAcervo() {
  return useQuery({
    queryKey: ['minha-cota-acervo'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const out: Record<string, number> = {};
      await Promise.all(Object.entries(ACERVO).map(async ([k, t]) => {
        const { count, error } = await supabase.from(t as any).select('*', { count: 'exact', head: true });
        if (!error && count) out[k] = count;
      }));
      return out;
    },
  });
}
const fmtN = (n: number) => n.toLocaleString('pt-BR');
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useMinhaCota } from '@/hooks/useMinhaCota';

const CATEGORIAS: Record<string, string> = { audio: 'Áudio', estudo: 'Estudo', leis: 'Leis e artigos', ia: 'Inteligência artificial', biblioteca: 'Biblioteca', blog: 'Blog', radar: 'Radar legislativo', ferramentas: 'Ferramentas' };

function Anel({ pct }: { pct: number }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      <circle cx="50" cy="50" r={r} className="stroke-muted" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r={r} className="stroke-primary transition-all" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
  );
}

/** Uma linha da lista: ícone grande (sem fundo), título, barra e detalhe. */
function Linha({ icon: Ic, label, right, pct, barClass, caption }: {
  icon: LucideIcon; label: string; right: React.ReactNode; pct: number; barClass: string; caption: string;
}) {
  return (
    <div className="p-4 flex items-center gap-3.5">
      <Ic className="w-7 h-7 text-primary shrink-0" strokeWidth={2.1} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium truncate min-w-0">{label}</span>
          {right}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground truncate">{caption}</div>
      </div>
    </div>
  );
}

export default function MinhaCota() {
  const navigate = useNavigate();
  const { loading, isPremium, itens, percentual, renovaEm, diasParaRenovar } = useMinhaCota();
  const { data: acervo = {} } = useAcervo();

  const grupos = Object.entries(itens.reduce((acc, i) => { (acc[i.category] ||= []).push(i); return acc; }, {} as Record<string, typeof itens>));

  return (
    <div className="min-h-dvh bg-background pb-24">
      <PageHeader title="Minha Cota" subtitle="Plano gratuito mensal" onBack={() => navigate(-1)} />
      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-2">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
          {isPremium ? (
            <div className="w-28 h-28 rounded-full bg-primary/10 grid place-items-center shrink-0"><InfinityIcon className="w-12 h-12 text-primary" /></div>
          ) : (
            <div className="relative shrink-0">
              <Anel pct={percentual} />
              <div className="absolute inset-0 grid place-items-center text-2xl font-bold">{loading ? '…' : `${percentual}%`}</div>
            </div>
          )}
          <div className="min-w-0">
            <div className="text-lg font-semibold">{isPremium ? 'Ilimitado' : 'Cota usada'}</div>
            <p className="text-sm text-muted-foreground">
              {isPremium ? 'Você é assinante: todas as funções estão liberadas.' : `Renova em ${diasParaRenovar} dia(s)${renovaEm ? ` · ${renovaEm.toLocaleDateString('pt-BR')}` : ''}.`}
            </p>
          </div>
        </div>

        {!isPremium && (
          <button onClick={() => navigate('/assinatura')} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
            <Crown className="w-4 h-4" /> Assinar e liberar tudo
          </button>
        )}

        <div className="space-y-4">
          {loading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}

          {/* Sempre livre: funções que nunca descontam da cota */}
          <div>
            <div className="px-1 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Sempre livre</div>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {LIVRES.map((l) => (
                <Linha
                  key={l.key}
                  icon={l.icon}
                  label={l.label}
                  right={<span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0"><LockOpen className="w-4 h-4" /> Livre</span>}
                  pct={100}
                  barClass="bg-gradient-to-r from-primary/70 to-primary"
                  caption={l.acervo && acervo[l.key] ? `${fmtN(acervo[l.key])} disponíveis · não desconta da cota` : 'Sem limite · não desconta da cota'}
                />
              ))}
            </div>
          </div>

          {grupos.map(([cat, lista]) => (
            <div key={cat}>
              <div className="px-1 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{CATEGORIAS[cat] || cat}</div>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                {lista.map((i) => {
                  const pct = isPremium ? 100 : Math.min(100, Math.round((i.used / i.limit) * 100));
                  const acabou = !isPremium && i.used >= i.limit;
                  const Ic = ICONES[i.key] || Sparkles;
                  return (
                    <Linha
                      key={i.key}
                      icon={Ic}
                      label={i.label}
                      pct={pct}
                      barClass={acabou ? 'bg-destructive' : 'bg-gradient-to-r from-primary/70 to-primary'}
                      right={isPremium ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0"><InfinityIcon className="w-4 h-4" /></span>
                      ) : (
                        <span className={`text-xs shrink-0 tabular-nums ${acabou ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {Math.min(i.used, i.limit)} / {i.limit}
                        </span>
                      )}
                      caption={isPremium
                        ? (acervo[i.key] ? `${fmtN(acervo[i.key])} disponíveis · uso ilimitado` : 'Uso ilimitado')
                        : acabou ? `Esgotado · renova em ${diasParaRenovar} dia(s)`
                        : `${i.limit - i.used} restantes este mês${acervo[i.key] ? ` · ${fmtN(acervo[i.key])} no acervo` : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
