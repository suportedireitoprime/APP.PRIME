import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { estruturarTrilha, getTrilha, listarLicoes, listarProgresso, type LeiSecaLicao } from "@/lib/leiSeca";
import { hydrateLeiSecaFromSession, licoesKey, prefetchParte, trilhaKey } from "@/lib/leiSecaPrefetch";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { Button } from "@/components/ui/button";
import { Star, Lock, Check, Loader2, Play, Trophy, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumGate from "@/components/PremiumGate";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getMateriaByTrilha } from "@/lib/leiSecaMaterias";
import { LeiSecaParteHero, LeiSecaLicaoNode } from "@/components/lei-seca/chunks";

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
  const { isPremium } = useSubscription();
  const [estruturando, setEstruturando] = useState(false);
  const [premiumGateOpen, setPremiumGateOpen] = useState(false);

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
      {/* Chunk 6: Hero da Parte com Progresso e Paleta Temática */}
      <LeiSecaParteHero
        slug={slug}
        parteAtual={parte}
        sigla={trilhaQ.data?.sigla}
        titulo={parteNome ?? trilhaQ.data?.nome ?? "Carregando..."}
        partes={trilhaQ.data?.partes}
        tema={tema}
        MateriaIcone={MateriaIcone}
        stats={stats}
        onBack={() => navigate("/lei-seca", { replace: true })}
        onSelectParte={(pSlug) => navigate(`/lei-seca/${slug}/${pSlug}`, { replace: true })}
        onPrefetchParte={(pSlug) => prefetchParte(qc, slug, pSlug)}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 pb-[calc(7.5rem+var(--sai-bottom))]">
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
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.map((l, li) => {
                  const idx = licoes.findIndex((x) => x.id === l.id);
                  const desbloq = isDesbloqueada(idx);
                  const prog = progressoQ.data?.get(l.id);
                  const isProx = idx === proxIdx;
                  return (
                    <li key={l.id} className="animate-fade-in-up" style={{ animationDelay: `${(gi * 40) + li * 30}ms` }}>
                      {/* Chunk 7: Nó de Lição Gamificada */}
                      <LeiSecaLicaoNode
                        licao={l}
                        index={idx}
                        desbloqueada={desbloq}
                        isProxima={isProx}
                        progresso={prog}
                        tema={tema}
                        onSelect={() => {
                          if (!isPremium) {
                            setPremiumGateOpen(true);
                            return;
                          }
                          navigate(`/lei-seca/${slug}/${parte}/licao/${l.id}`);
                        }}
                      />
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

      <PremiumGate
        open={premiumGateOpen}
        onClose={() => setPremiumGateOpen(false)}
        feature="lei_seca"
      />
    </div>
  );
}
