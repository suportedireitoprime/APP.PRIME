import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Search,
  BookOpen,
  Scale,
  Gavel,
  FileText,
  Landmark,
  Scroll,
  Building2,
  Shield,
  Users,
  Briefcase,
  Vote,
  Globe,
  Leaf,
  HeartHandshake,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { Input } from "@/components/ui/input";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal } from "@/lib/resumosLocal";
import { Heart } from "lucide-react";

type Row = { tema: string; ordem_tema: number | null; total: number };

// ---- Cache em memória entre navegações ----
const temasCache = new Map<string, Row[]>();
const subtemasCache = new Map<string, ResumoRow[]>();

/** Vermelho oficial do app */
const RED = "hsl(348 78% 45%)";

// Ícones rotativos por tema (para dar identidade visual no lado esquerdo)
const TEMA_ICONS = [
  BookOpen,
  Scale,
  Gavel,
  FileText,
  Landmark,
  Scroll,
  Building2,
  Shield,
  Users,
  Briefcase,
  Vote,
  Globe,
  Leaf,
  HeartHandshake,
  ClipboardList,
];

function hashIdx(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

type Ordem = "crono" | "alpha" | "fav";


export default function ResumosJuridicosTemas() {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>(() => temasCache.get(decodedArea) || []);
  const [loading, setLoading] = useState(!temasCache.has(decodedArea));
  const [q, setQ] = useState("");

  const [openTema, setOpenTema] = useState<string | null>(null);
  const [subtemas, setSubtemas] = useState<ResumoRow[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("crono");
  const [favs, setFavs] = useState<string[]>(() => resumosLocal.favoritos().map((f) => f.id));

  const refreshFavs = () => setFavs(resumosLocal.favoritos().map((f) => f.id));

  const subtemasOrdenados = useMemo(() => {
    if (ordem === "alpha")
      return [...subtemas].sort((a, b) => (a.subtema || "").localeCompare(b.subtema || ""));
    if (ordem === "fav") return subtemas.filter((s) => favs.includes(s.id));
    return subtemas;
  }, [subtemas, ordem, favs]);


  useEffect(() => {
    let cancelled = false;
    const cacheKey = `resumos_temas_cache:${decodedArea}`;

    // 1. Tenta carregar do localStorage imediatamente (0ms)
    if (!temasCache.has(decodedArea)) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            temasCache.set(decodedArea, parsed);
            setRows(parsed);
            setLoading(false);
          }
        }
      } catch {}
    } else {
      setRows(temasCache.get(decodedArea)!);
      setLoading(false);
    }

    (async () => {
      if (!temasCache.has(decodedArea)) setLoading(true);
      let list: Row[] = [];

      // 2. Tenta função RPC no Supabase
      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("get_resumos_temas_counts", {
          p_area: decodedArea,
        });
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          list = rpcData.map((r: any) => ({
            tema: r.tema,
            ordem_tema: r.ordem_tema != null ? Number(r.ordem_tema) : null,
            total: Number(r.total) || 0,
          }));
        }
      } catch {}

      // 3. Fallback: consulta paginada tradicional
      if (list.length === 0) {
        const map = new Map<string, { ordem: number | null; total: number }>();
        let from = 0;
        const step = 1000;
        let gotAny = false;
        while (true) {
          const { data, error } = await (supabase as any)
            .from("resumos_juridicos")
            .select("tema, ordem_tema")
            .eq("area", decodedArea)
            .range(from, from + step - 1);
          if (error) break;
          if (!data || data.length === 0) break;
          gotAny = true;
          for (const r of data as { tema: string; ordem_tema: number | null }[]) {
            const prev = map.get(r.tema);
            map.set(r.tema, {
              ordem: prev?.ordem ?? r.ordem_tema,
              total: (prev?.total || 0) + 1,
            });
          }
          if (data.length < step) break;
          from += step;
        }
        if (!gotAny) {
          const { bundle } = await import("@/services/offlineBundle");
          const rows = await bundle.resumos<{ area: string; tema: string; ordem_tema: number | null }>();
          for (const r of rows) {
            if (r.area !== decodedArea) continue;
            const prev = map.get(r.tema);
            map.set(r.tema, {
              ordem: prev?.ordem ?? r.ordem_tema,
              total: (prev?.total || 0) + 1,
            });
          }
        }
        list = Array.from(map.entries())
          .map(([tema, v]) => ({ tema, ordem_tema: v.ordem, total: v.total }))
          .sort((a, b) => {
            if (a.ordem_tema != null && b.ordem_tema != null) return a.ordem_tema - b.ordem_tema;
            if (a.ordem_tema != null) return -1;
            if (b.ordem_tema != null) return 1;
            return a.tema.localeCompare(b.tema);
          });
      }

      if (cancelled) return;
      if (list.length > 0) {
        temasCache.set(decodedArea, list);
        setRows(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {}
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedArea]);

  const filtered = useMemo(
    () => rows.filter((r) => r.tema.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const openSubtemas = async (tema: string) => {
    setOpenTema(tema);
    setOrdem("crono");
    refreshFavs();
    const key = `${decodedArea}::${tema}`;
    if (subtemasCache.has(key)) {
      setSubtemas(subtemasCache.get(key)!);
      setSubLoading(false);
      return;
    }
    setSubLoading(true);
    setSubtemas([]);
    const { data } = await (supabase as any)
      .from("resumos_juridicos")
      .select("id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos")
      .eq("area", decodedArea)
      .eq("tema", tema)
      .order("ordem_subtema", { ascending: true, nullsFirst: false })
      .order("subtema", { ascending: true })
      .limit(5000);
    let list = (data || []) as ResumoRow[];
    if (list.length === 0) {
      const { bundle } = await import("@/services/offlineBundle");
      const all = await bundle.resumos<ResumoRow>();
      list = all
        .filter((r) => r.area === decodedArea && r.tema === tema)
        .sort((a, b) => (a.ordem_subtema ?? 9999) - (b.ordem_subtema ?? 9999));
    }
    subtemasCache.set(key, list);
    setSubtemas(list);
    setSubLoading(false);
  };

  const closeSubtemas = () => {
    setOpenTema(null);
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <PageHeader
          title={decodedArea}
          subtitle="Área"
          onBack={() => navigate("/resumos-juridicos")}
          className="border-b-0"
        />

        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tema" className="pl-9" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((r, i) => {
              const Icon = TEMA_ICONS[hashIdx(r.tema, TEMA_ICONS.length)];
              return (
                <motion.button
                  key={r.tema}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.25) }}
                  onClick={() => openSubtemas(r.tema)}
                  className="flex items-center gap-3 px-4 h-[76px] rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
                >
                  <Icon className="w-7 h-7 shrink-0" strokeWidth={1.7} style={{ color: RED }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-semibold text-foreground line-clamp-1">
                      {r.tema}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r.total} {r.total === 1 ? "subtema" : "subtemas"}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet: subtemas do tema selecionado (sempre 90%) */}
      <AnimatePresence>
        {openTema && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeSubtemas}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed left-0 right-0 bottom-0 z-[70] bg-card border-t border-border rounded-t-2xl flex flex-col h-[90dvh] pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]"
            >
              <div className="flex items-center justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center gap-3 px-4 pb-3 shrink-0">
                <button
                  onClick={closeSubtemas}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground break-words">
                    {decodedArea}
                  </p>
                  <h2 className="font-display text-base font-bold leading-tight break-words">{openTema}</h2>
                </div>
              </div>

              {/* Menu de alternância */}
              <div className="px-4 pb-3 shrink-0">
                <div className="flex w-full bg-secondary/50 rounded-xl p-1 gap-1">
                  {([
                    { id: "crono", label: "Cronológica" },
                    { id: "alpha", label: "Alfabética" },
                    { id: "fav", label: "Favoritos" },
                  ] as { id: Ordem; label: string }[]).map((o) => {
                    const ativo = ordem === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setOrdem(o.id)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors"
                        style={
                          ativo
                            ? { backgroundColor: RED, color: "#fff" }
                            : { color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {subLoading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
                  </div>
                ) : subtemasOrdenados.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {ordem === "fav" ? "Nenhum favorito neste tema." : "Nenhum subtema."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {subtemasOrdenados.map((r, i) => {
                      const numero = String(
                        ordem === "crono" ? i + 1 : subtemas.findIndex((s) => s.id === r.id) + 1
                      ).padStart(2, "0");
                      const isFav = favs.includes(r.id);
                      return (
                        <motion.button
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.01, 0.2) }}
                          onClick={() => {
                            resumosLocal.registrarRecente({
                              id: r.id,
                              area: r.area,
                              tema: r.tema,
                              subtema: r.subtema,
                            });
                            setSelected(r);
                            setOpenTema(null);
                          }}
                          className="flex items-center gap-3 px-4 h-[68px] rounded-xl bg-secondary/40 border border-border hover:border-primary/40 transition-all text-left"
                        >
                          <span
                            className="font-display font-bold text-lg shrink-0 w-8 tabular-nums"
                            style={{ color: RED }}
                          >
                            {numero}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-body text-foreground line-clamp-2">
                              {r.subtema || "(sem título)"}
                            </div>
                          </div>
                          {isFav && (
                            <span
                              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: "hsl(348 78% 45% / 0.15)", color: RED }}
                            >
                              <Heart className="w-3 h-3" style={{ fill: RED }} />
                              Favorito
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <ResumoJuridicoReaderSheet
        resumo={selected}
        onClose={() => setSelected(null)}
        onFavoritoChange={refreshFavs}
      />
    </div>
  );
}
