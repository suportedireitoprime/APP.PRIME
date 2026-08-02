import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { estruturarTrilha, getTrilha, listarLicoes, listarProgresso, type LeiSecaLicao } from "@/lib/leiSeca";
import { hydrateLeiSecaFromSession, licoesKey, prefetchParte, trilhaKey } from "@/lib/leiSecaPrefetch";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { Button } from "@/components/ui/button";
import { Star, Lock, Check, Loader2, Play, Trophy, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getMateriaByTrilha } from "@/lib/leiSecaMaterias";


// Paleta hex por trilha (fallback rosa). Casa com a estética da home.
const TRILHA_HEX: Record<string, { from: string; solid: string; to: string }> = {
  cp: { from: "#7a1424", solid: "#b91c3a", to: "#3a0712" },
  cpp: { from: "#7a1424", solid: "#b91c3a", to: "#3a0712" },
  cf: { from: "#0f4534", solid: "#15803d", to: "#062117" },
  cc: { from: "#1a3b6e", solid: "#2563eb", to: "#0a1f3d" },
  cpc: { from: "#3b1d6e", solid: "#6d28d9", to: "#1a0a3a" },
  clt: { from: "#6a3a06", solid: "#c2510c", to: "#2c1604" },
};
function paletaTrilha(slug: string) {
  return TRILHA_HEX[slug] ?? { from: "#7a1424", solid: "#b91c3a", to: "#3a0712" };
}

function PainelBar({ label, valor, pct }: { label: string; valor: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px] mb-0.5">
        <span className="text-white/85 font-medium">{label}</span>
        <span className="tabular-nums font-bold text-white">{valor}</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/30 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-white to-white/80 transition-[width] duration-700"
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export default function LeiSecaParte() {
  const { slug = "", parte = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [estruturando, setEstruturando] = useState(false);

  // Hidrata cache do sessionStorage ANTES da primeira pintura — pinta header em ~0ms.
  if (slug && parte) hydrateLeiSecaFromSession(qc, slug, parte);

  const trilhaQ = useQuery({
    queryKey: trilhaKey(slug),
    queryFn: () => getTrilha(slug),
    enabled: !!slug,
    staleTime: 10 * 60_000,
    ...persistedInitial<Awaited<ReturnType<typeof getTrilha>>>(`lei-seca-trilha:${slug}`),
  });
  useEffect(() => { if (trilhaQ.data) savePersisted(`lei-seca-trilha:${slug}`, trilhaQ.data); }, [trilhaQ.data, slug]);

  const licoesQ = useQuery({
    queryKey: licoesKey(slug, parte),
    queryFn: () => listarLicoes(slug, parte),
    enabled: !!slug && !!parte,
    staleTime: 10 * 60_000,
    ...persistedInitial<LeiSecaLicao[]>(`lei-seca-licoes:${slug}:${parte}`),
  });
  useEffect(() => { if (licoesQ.data) savePersisted(`lei-seca-licoes:${slug}:${parte}`, licoesQ.data); }, [licoesQ.data, slug, parte]);

  const progressoQ = useQuery({
    queryKey: ["lei-seca-progresso", user?.id, slug, parte],
    enabled: !!user?.id && !!licoesQ.data?.length,
    staleTime: 30_000,
    queryFn: () => listarProgresso(user!.id, licoesQ.data!.map((l) => l.id)),
  });

  // Prefetch das outras partes assim que a trilha chega.
  useEffect(() => {
    const partes = trilhaQ.data?.partes ?? [];
    partes.forEach((p) => {
      if (p.slug !== parte) prefetchParte(qc, slug, p.slug);
    });
  }, [trilhaQ.data, parte, slug, qc]);


  useEffect(() => {
    if (licoesQ.isSuccess && licoesQ.data && licoesQ.data.length === 0 && !estruturando) {
      setEstruturando(true);
      estruturarTrilha(slug, parte)
        .then(() => qc.invalidateQueries({ queryKey: ["lei-seca-licoes", slug, parte] }))
        .catch((e) => toast({ title: "Erro ao montar trilha", description: e.message, variant: "destructive" }))
        .finally(() => setEstruturando(false));
    }
  }, [licoesQ.isSuccess, licoesQ.data, slug, parte, qc, estruturando]);

  const parteNome = useMemo(() => trilhaQ.data?.partes.find((p) => p.slug === parte)?.nome, [trilhaQ.data, parte]);
  const licoes = licoesQ.data ?? [];

  const isDesbloqueada = (idx: number) => {
    if (idx === 0) return true;
    const ant = licoes[idx - 1];
    return progressoQ.data?.get(ant.id)?.concluida === true;
  };

  const grupos = useMemo(() => {
    const g = new Map<string, LeiSecaLicao[]>();
    licoes.forEach((l) => {
      const k = l.titulo_pai ?? "—";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(l);
    });
    return Array.from(g.entries());
  }, [licoes]);

  // Quebra "TÍTULO I\nINTRODUÇÃO\n(Redação dada pelo…)" em { nivel, descricao }
  function parseTituloPai(raw: string): { nivel: string; descricao: string } {
    const linhas = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      // remove linhas que sejam apenas parentéticos (Redação dada, Vide, Incluído…)
      .filter((s) => !/^\(/.test(s));
    const nivel = linhas[0] ?? raw;
    // Junta o resto e tira tudo a partir de "(" — corta parentéticos pendurados na mesma linha
    const restoBruto = linhas.slice(1).join(" ").trim();
    const descricao = restoBruto.split("(")[0].trim().replace(/\s+/g, " ");
    return { nivel, descricao };
  }

  const stats = useMemo(() => {
    const total = licoes.length;
    const concluidas = licoes.filter((l) => progressoQ.data?.get(l.id)?.concluida).length;
    const estrelas = licoes.reduce((s, l) => s + (progressoQ.data?.get(l.id)?.estrelas ?? 0), 0);
    const pct = total ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, estrelas, pct, maxEstrelas: total * 3 };
  }, [licoes, progressoQ.data]);

  const tema = paletaTrilha(slug);
  const MateriaIcone = getMateriaByTrilha(slug)?.icone;

  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (stats.pct / 100) * circ;
  const proxIdx = licoes.findIndex((l, i) => isDesbloqueada(i) && !progressoQ.data?.get(l.id)?.concluida);

  return (
    <div className="min-h-screen bg-background animate-ls-enter">
      {/* Painel — estilo "Desempenho" */}
      <section
        className="relative overflow-hidden rounded-b-3xl text-white shadow-2xl shadow-black/40 ring-1 ring-black/20"

        style={{ background: `linear-gradient(160deg, ${tema.from} 0%, ${tema.solid} 55%, ${tema.to} 100%)` }}
      >
        <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-black/30 blur-3xl pointer-events-none" />
        {MateriaIcone && (
          <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-8 z-0 opacity-[0.13]">
            <MateriaIcone className="h-52 w-52 text-white" strokeWidth={0.9} />
          </div>
        )}
        {MateriaIcone && (
          <div aria-hidden className="pointer-events-none absolute right-24 top-2 z-0 opacity-[0.07] rotate-12">
            <MateriaIcone className="h-24 w-24 text-white" strokeWidth={0.8} />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[55%] overflow-hidden z-0">
          <div className="absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[18deg] animate-pulse" />
        </div>

        <div className="relative z-10 px-5 pt-5 pb-5">
          <button
            onClick={() => navigate("/lei-seca", { replace: true })}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center text-white mb-3 active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-white/70 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
            {trilhaQ.data?.sigla ?? "Lei Seca"} · Seu painel
          </p>

          <div className="flex items-center gap-2">
            <h1 className="font-body font-bold text-[22px] sm:text-2xl tracking-[0.01em] leading-[1.2] drop-shadow">
              {parteNome ?? trilhaQ.data?.nome ?? "Carregando..."}
            </h1>
            {stats.pct === 100 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 border border-emerald-300/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Check className="h-3 w-3" strokeWidth={4} /> Concluído
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-white/80 leading-snug">
            {stats.total} lição{stats.total === 1 ? "" : "ões"} · {stats.estrelas}/{stats.maxEstrelas} estrelas
          </p>

          {(trilhaQ.data?.partes?.length ?? 0) > 1 && (
            <div className="mt-3 inline-flex p-1 rounded-full bg-black/30 ring-1 ring-white/10 backdrop-blur-sm max-w-full overflow-x-auto no-scrollbar">
              {trilhaQ.data!.partes.map((p) => {
                const ativa = p.slug === parte;
                return (
                  <button
                    key={p.slug}
                    onPointerDown={() => prefetchParte(qc, slug, p.slug)}
                    onMouseEnter={() => prefetchParte(qc, slug, p.slug)}
                    onTouchStart={() => prefetchParte(qc, slug, p.slug)}
                    onClick={() => navigate(`/lei-seca/${slug}/${p.slug}`, { replace: true })}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-[0.97]",
                      ativa ? "bg-white text-black shadow" : "text-white/75 hover:text-white",
                    )}
                  >
                    {p.nome}
                  </button>

                );
              })}
            </div>
          )}


          <div className="mt-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="7" />
                <circle
                  cx="42"
                  cy="42"
                  r={r}
                  fill="none"
                  stroke="url(#gradPainelLS)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }}
                />
                <defs>
                  <linearGradient id="gradPainelLS" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center leading-none">
                  {stats.pct === 100 ? (
                    <>
                      <Trophy className="h-7 w-7 mx-auto text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]" />
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 font-bold mt-1">Concluído</p>
                    </>
                  ) : (
                    <>
                      <p className="font-black text-[22px] tabular-nums tracking-tight">
                        {stats.pct}
                        <span className="text-[11px] align-top ml-0.5 opacity-80">%</span>
                      </p>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 font-bold mt-0.5">Progresso</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <PainelBar label="Concluídas" valor={`${stats.concluidas}/${stats.total}`} pct={stats.total ? (stats.concluidas / stats.total) * 100 : 0} />
              <PainelBar label="Estrelas" valor={`${stats.estrelas}/${stats.maxEstrelas}`} pct={stats.maxEstrelas ? (stats.estrelas / stats.maxEstrelas) * 100 : 0} />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {(licoesQ.isLoading || estruturando) && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" style={{ color: tema.solid }} />
            {estruturando ? "Montando trilha de lições..." : "Carregando..."}
          </div>
        )}

        {grupos.map(([tituloPai, items], gi) => {
          const { nivel, descricao } = tituloPai !== "—" ? parseTituloPai(tituloPai) : { nivel: "", descricao: "" };
          return (
          <div key={tituloPai} className="mb-7 animate-fade-in-up" style={{ animationDelay: `${gi * 40}ms` }}>
            {tituloPai !== "—" && (
              <div className="mb-3 px-1">
                <div
                  className="text-[10px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: tema.solid }}
                >
                  {nivel}
                </div>
                {descricao && (
                  <h2 className="mt-0.5 font-body text-[17px] sm:text-[18px] font-bold text-foreground leading-snug tracking-[0.015em]">
                    {descricao}
                  </h2>
                )}
                <div
                  className="mt-2 h-px w-10 rounded-full opacity-60"
                  style={{ background: tema.solid }}
                />
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {items.map((l, li) => {
                const idx = licoes.findIndex((x) => x.id === l.id);
                const desbloq = isDesbloqueada(idx);
                const prog = progressoQ.data?.get(l.id);
                const isProx = idx === proxIdx;
                return (
                  <li key={l.id} className="animate-fade-in-up" style={{ animationDelay: `${(gi * 40) + li * 30}ms` }}>
                    <button
                      disabled={!desbloq}
                      onClick={() => navigate(`/lei-seca/${slug}/${parte}/licao/${l.id}`)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 active:scale-[0.99]",
                        desbloq
                          ? "border-white/10 bg-card hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg"
                          : "border-white/5 bg-card/40 opacity-60 cursor-not-allowed",
                        isProx && "ring-2 ring-offset-0",
                      )}
                      style={isProx ? { boxShadow: `0 0 0 2px ${tema.solid}55, 0 8px 24px -8px ${tema.solid}66` } : undefined}
                    >
                      <div
                        className={cn(
                          "h-11 w-11 shrink-0 rounded-xl grid place-items-center border transition-transform",
                          prog?.concluida
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300/40"
                            : desbloq
                              ? "border-white/10"
                              : "bg-muted border-muted-foreground/15",
                        )}
                        style={
                          !prog?.concluida && desbloq
                            ? { background: `linear-gradient(135deg, ${tema.from}, ${tema.solid})` }
                            : undefined
                        }
                      >
                        {!desbloq ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : prog?.concluida ? (
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        ) : (
                          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Lição {idx + 1}
                        </div>
                        <div className="text-sm font-semibold leading-tight truncate">{l.titulo}</div>
                        {prog?.concluida && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                            <Check className="h-3 w-3" strokeWidth={3} /> Concluído
                          </div>
                        )}
                      </div>
                      {prog && (
                        <div className="flex gap-0.5 shrink-0">
                          {[0, 1, 2].map((i) => (
                            <Star key={i} className={cn("h-3.5 w-3.5", i < (prog.estrelas ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40")} />
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}

        {!licoesQ.isLoading && !estruturando && licoes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-3">Nenhuma lição encontrada</p>
            <Button
              onClick={() => {
                setEstruturando(true);
                estruturarTrilha(slug, parte)
                  .then(() => qc.invalidateQueries({ queryKey: ["lei-seca-licoes", slug, parte] }))
                  .finally(() => setEstruturando(false));
              }}
            >
              Montar trilha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
