import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Scroll,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { haptic } from "@/lib/nativeHaptics";

const JURIS_ITENS: { label: string; desc: string; rota: string; color: string }[] = [
  { label: "Súmulas Vinculantes", desc: "STF – efeito vinculante", rota: "/resumos-juridicos/jurisprudencia/sumulas-vinculantes", color: "#f87171" },
  { label: "Súmulas do STF", desc: "Enunciados do Supremo", rota: "/resumos-juridicos/jurisprudencia/sumulas-stf", color: "#60a5fa" },
  { label: "Súmulas do STJ", desc: "Enunciados do Superior", rota: "/resumos-juridicos/jurisprudencia/sumulas-stj", color: "#34d399" },
  { label: "Informativos do STF", desc: "Julgados recentes", rota: "/resumos-juridicos/jurisprudencia/informativos-stf", color: "#a78bfa" },
  { label: "Informativos do STJ", desc: "Julgados recentes", rota: "/resumos-juridicos/jurisprudencia/informativos-stj", color: "#22d3ee" },
  { label: "Teses do STF", desc: "Repercussão geral", rota: "/resumos-juridicos/jurisprudencia/teses-stf", color: "#fbbf24" },
  { label: "Teses do STJ", desc: "Jurisprudência em teses", rota: "/resumos-juridicos/jurisprudencia/teses-stj", color: "#fb923c" },
  { label: "Pesquisas prontas STF", desc: "Temas selecionados", rota: "/resumos-juridicos/jurisprudencia/prontas-stf", color: "#f472b6" },
  { label: "Pesquisas prontas STJ", desc: "Temas selecionados", rota: "/resumos-juridicos/jurisprudencia/prontas-stj", color: "#a3e635" },
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ResumosJurisprudencia() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"lista" | "cards">("cards");
  const [q, setQ] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const filtered = JURIS_ITENS.filter((j) => {
    if (!q) return true;
    const t = normalize(q.trim());
    return normalize(`${j.label} ${j.desc}`).includes(t);
  });

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <PageHeader title="Jurisprudência" onBack={() => navigate(-1)} rightAction={<div className="w-8" />} />

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar em Jurisprudência..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
              />
            </div>
            <button
              onClick={() => {
                haptic.selection();
                setViewMode(viewMode === "lista" ? "cards" : "lista");
              }}
              className="h-10 px-4 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium hover:bg-secondary/70 transition-colors shrink-0"
            >
              {viewMode === "lista" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === "lista" ? "Cards" : "Lista"}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom))]">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/50 text-sm space-y-3">
              <p>Nenhum resultado encontrado para "{q}".</p>
            </div>
          ) : viewMode === "lista" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((j, i) => (
                <motion.button
                  key={j.rota}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => navigate(j.rota)}
                  className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 hover:border-[#38bdf8]/40 transition-all text-left group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center group-hover:bg-[#38bdf8]/10 transition-colors">
                    <Scroll className="w-7 h-7 shrink-0" style={{ color: j.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-[15px] uppercase text-white truncate">{j.label}</div>
                    <div className="text-[12px] text-white/50 mt-1 truncate">{j.desc}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#38bdf8] transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 no-scrollbar px-1 -mx-4 sm:mx-0 sm:px-0">
                {filtered.map((j, i) => (
                  <motion.button
                    key={j.rota}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    onClick={() => navigate(j.rota)}
                    className="snap-center shrink-0 w-[260px] flex flex-col justify-between p-6 rounded-[32px] bg-secondary/40 border border-white/5 hover:border-[#38bdf8]/30 transition-all text-left group overflow-hidden relative"
                  >
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 ease-out">
                      <Scroll className="w-8 h-8 shrink-0" style={{ color: j.color }} strokeWidth={1.5} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="font-display font-black text-[22px] uppercase text-white leading-tight line-clamp-2 mb-2">
                        {j.label}
                      </div>
                      <div className="text-[13px] text-white/50 font-medium line-clamp-2">
                        {j.desc}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
