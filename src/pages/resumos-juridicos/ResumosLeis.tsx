import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Mic,
  MicOff,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { haptic } from "@/lib/nativeHaptics";
import { AREAS_LEIS, AreaLeis, leisDaArea } from "@/lib/leisPorArea";
import { LEI_ICON_MAP } from "@/lib/leiIcons";
import LeiArtigosSheet from "@/components/resumos-juridicos/LeiArtigosSheet";
import type { LeiCatalogItem } from "@/data/leisCatalog";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  Landmark,
  Leaf,
  Users,
  Building2,
  Scale,
  Trophy,
  Briefcase,
  Vote,
  Globe,
  Gavel,
  Shield,
  HeartPulse,
  Receipt,
  Baby,
  Car,
  Home,
  ScrollText,
  Wallet,
  Handshake,
  FileText,
} from "lucide-react";

// ?cone e cor (hex) por ǭrea
const AREA_STYLE: Record<string, { icon: any; color: string }> = {
  administrativo: { icon: Landmark, color: "#38bdf8" },
  ambiental: { icon: Leaf, color: "#34d399" },
  civil: { icon: Users, color: "#60a5fa" },
  concorrencial: { icon: Building2, color: "#22d3ee" },
  constitucional: { icon: Scale, color: "#c2274a" },
  desportivo: { icon: Trophy, color: "#fb923c" },
  trabalho: { icon: Briefcase, color: "#fb7185" },
  eleitoral: { icon: Vote, color: "#a78bfa" },
  internacional: { icon: Globe, color: "#2dd4bf" },
  penal: { icon: Gavel, color: "#f87171" },
  processo: { icon: ScrollText, color: "#818cf8" },
  processual: { icon: ScrollText, color: "#818cf8" },
  previdenciario: { icon: Shield, color: "#c2274a" },
  tributario: { icon: Receipt, color: "#a3e635" },
  empresarial: { icon: Building2, color: "#e879f9" },
  consumidor: { icon: Wallet, color: "#f472b6" },
  familia: { icon: Baby, color: "#f472b6" },
  transito: { icon: Car, color: "#fb923c" },
  imobiliario: { icon: Home, color: "#c2274a" },
  saude: { icon: HeartPulse, color: "#fb7185" },
  humanos: { icon: Handshake, color: "#34d399" },
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function styleForArea(area: string) {
  const n = normalize(area);
  for (const key of Object.keys(AREA_STYLE)) {
    if (n.includes(key)) return AREA_STYLE[key];
  }
  return { icon: FileText, color: "#e5c34a" };
}

export default function ResumosLeis() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"lista" | "cards">("cards");
  const [q, setQ] = useState("");
  const [areaLeis, setAreaLeis] = useState<AreaLeis | null>(null);
  const [leiArtigos, setLeiArtigos] = useState<{ lei: LeiCatalogItem; area: string } | null>(null);
  const [buscaLeis, setBuscaLeis] = useState("");
  const voiceLeis = useVoiceInput((t: string) => setBuscaLeis(t));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const filtered = AREAS_LEIS.filter((a) => {
    if (!q) return true;
    const t = normalize(q.trim());
    return normalize(a.nome).includes(t) || leisDaArea(a).some(l => normalize(l.sigla).includes(t) || normalize(l.nome).includes(t));
  });

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <PageHeader title="Leis" onBack={() => navigate(-1)} rightAction={<div className="w-8" />} />

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar lei ou área..."
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
              <p>Nenhuma lei encontrada para "{q}".</p>
            </div>
          ) : viewMode === "lista" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((a, i) => {
                const Icon = styleForArea(a.nome).icon;
                return (
                  <motion.button
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => { haptic.selection(); setBuscaLeis(""); setAreaLeis(a); }}
                    className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 hover:border-[#38bdf8]/40 transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#38bdf8]/5 border border-[#38bdf8]/10 flex items-center justify-center group-hover:bg-[#38bdf8]/15 transition-colors">
                      <Icon className="w-7 h-7 shrink-0" style={{ color: a.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[15px] uppercase text-white truncate">
                        {a.nome.replace(/^DIREITO\s+/i, "")}
                      </div>
                      <div className="text-[12px] text-white/50 mt-1">
                        {leisDaArea(a).length} {leisDaArea(a).length === 1 ? "lei" : "leis"}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#38bdf8] transition-colors shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 no-scrollbar px-1 -mx-4 sm:mx-0 sm:px-0">
                {filtered.map((a, i) => {
                  const Icon = styleForArea(a.nome).icon;
                  return (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                      onClick={() => { haptic.selection(); setBuscaLeis(""); setAreaLeis(a); }}
                      className="snap-center shrink-0 w-[260px] flex flex-col justify-between p-6 rounded-[32px] bg-secondary/40 border border-white/5 hover:border-[#38bdf8]/30 transition-all text-left group overflow-hidden relative"
                    >
                      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity" />
                      
                      <div className="w-16 h-16 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 ease-out">
                        <Icon className="w-8 h-8 shrink-0" style={{ color: a.color }} strokeWidth={1.5} />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="font-display font-black text-[22px] uppercase text-white leading-tight line-clamp-2 mb-2">
                          {a.nome.replace(/^DIREITO\s+/i, "")}
                        </div>
                        <div className="text-[13px] text-white/50 font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                          {leisDaArea(a).length} {leisDaArea(a).length === 1 ? "lei" : "leis"}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY: LEIS DA ?REA */}
      <AnimatePresence>
        {areaLeis && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAreaLeis(null)}
              className="fixed inset-0 z-[70] bg-black/60 "
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[71] flex h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-background pb-[calc(1rem+var(--sai-bottom))]"
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/70 flex items-center justify-center shrink-0">
                    {(() => {
                      const Icon = styleForArea(areaLeis.nome).icon;
                      return (
                        <Icon
                          className="w-6 h-6"
                          style={{ color: areaLeis.color, filter: "saturate(1.3) brightness(1.1)" }}
                          strokeWidth={1.2}
                        />
                      );
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-foreground font-bold leading-none truncate uppercase">
                      {areaLeis.nome.replace(/^DIREITO\s+/i, '')}
                    </h3>
                    <p className="text-muted-foreground text-[12px] font-body leading-tight mt-1 truncate">
                      {leisDaArea(areaLeis).map((l) => l.sigla).join(", ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAreaLeis(null)}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="px-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/45 px-3 h-12">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      value={buscaLeis}
                      onChange={(e) => setBuscaLeis(e.target.value)}
                      placeholder="Pesquisar nesta ǭrea"
                      className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={voiceLeis.toggle}
                    aria-label={voiceLeis.listening ? "Parar gravaǜo" : "Pesquisar por voz"}
                    className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${
                      voiceLeis.listening
                        ? "bg-red-500 text-white animate-pulse shadow-red-500/40"
                        : "bg-primary text-primary-foreground shadow-primary/30"
                    }`}
                  >
                    {voiceLeis.listening ? <MicOff className="w-6 h-6" strokeWidth={2.5} /> : <Mic className="w-6 h-6" strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-2">
                  {leisDaArea(areaLeis)
                    .filter((lei) => {
                      const t = buscaLeis.trim().toLowerCase();
                      if (!t) return true;
                      return `${lei.nome} ${lei.sigla} ${lei.descricao}`.toLowerCase().includes(t);
                    })
                    .map((lei, i) => {
                      const LawIcon = LEI_ICON_MAP[lei.id] || styleForArea(areaLeis.nome).icon;
                      return (
                        <motion.button
                          key={lei.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                          onClick={() => {
                            setLeiArtigos({ lei, area: areaLeis.nome });
                            setAreaLeis(null);
                          }}
                          className="w-full flex items-center gap-4 p-4 min-h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition text-left"
                        >
                          <LawIcon
                            className="w-8 h-8 shrink-0"
                            style={{
                              color: (lei as any).iconColor || areaLeis.color,
                              filter: "saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                            }}
                            strokeWidth={1.3}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                              {lei.nome}
                            </p>
                            <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-2">
                              {lei.descricao}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LeiArtigosSheet
        lei={leiArtigos?.lei ?? null}
        area={leiArtigos?.area}
        onClose={() => setLeiArtigos(null)}
      />
    </div>
  );
}
