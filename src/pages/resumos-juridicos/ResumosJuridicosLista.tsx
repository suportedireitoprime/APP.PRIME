import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, FileText, Heart, History, Loader2, Search } from "lucide-react";
import ResumosBottomNav from "@/components/resumos/ResumosBottomNav";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal, ResumoRef } from "@/lib/resumosLocal";
import { supabase } from "@/integrations/supabase/client";

export default function ResumosJuridicosLista({ modo }: { modo: "favoritos" | "recentes" }) {
 const navigate = useNavigate();
 const [refs, setRefs] = useState<ResumoRef[]>(() =>
 modo === "favoritos" ? resumosLocal.favoritos() : resumosLocal.recentes()
 );
 const [q, setQ] = useState("");
 const [selected, setSelected] = useState<ResumoRow | null>(null);
 const [loadingId, setLoadingId] = useState<string | null>(null);

 useEffect(() => {
 const sync = () =>
 setRefs(modo === "favoritos" ? resumosLocal.favoritos() : resumosLocal.recentes());
 sync();
 window.addEventListener("resumos-local-change", sync);
 return () => window.removeEventListener("resumos-local-change", sync);
 }, [modo]);

 const filtered = useMemo(() => {
 const t = q.toLowerCase();
 return refs.filter(
 (r) =>
 (r.subtema || "").toLowerCase().includes(t) ||
 r.tema.toLowerCase().includes(t) ||
 r.area.toLowerCase().includes(t)
 );
 }, [refs, q]);

 const abrir = async (ref: ResumoRef) => {
 setLoadingId(ref.id);
 const { data } = await (supabase as any)
 .from("resumos_juridicos")
 .select("id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos")
 .eq("id", ref.id)
 .maybeSingle();
 setLoadingId(null);
 if (data) {
 resumosLocal.registrarRecente({
 id: data.id,
 area: data.area,
 tema: data.tema,
 subtema: data.subtema,
 });
 setSelected(data as ResumoRow);
 }
 };

 const Icon = modo === "favoritos" ? Heart : History;
 const titulo = modo === "favoritos" ? "Favoritos" : "Recentes";

 return (
 <div className="min-h-dvh bg-background pb-28">
 <div className="bg-hero-panel-cyan relative overflow-hidden rounded-b-[32px] border-b border-white/10 shadow-xl shadow-black/50 pt-[var(--sai-top)]">
 <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
 <div className="relative px-4 pt-4 pb-5 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigate("/resumos-juridicos")}
 aria-label="Voltar"
 className="w-11 h-11 rounded-full bg-black/80 border border-white/20 flex items-center justify-center active:scale-95 transition"
 >
 <ChevronDown className="w-6 h-6 text-white" />
 </button>
 <div className="flex items-center gap-2">
 <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
 <h1 className="font-display text-white text-[20px] font-black tracking-tight">
 {titulo}
 </h1>
 </div>
 </div>

 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
 <input
 value={q}
 onChange={(e) => setQ(e.target.value)}
 placeholder="Buscar resumo"
 className="w-full h-12 pl-11 pr-4 rounded-2xl bg-black/80 border border-white/25 text-white placeholder:text-white/50 outline-none"
 />
 </div>
 </div>
 </div>

 <div className="max-w-5xl mx-auto px-4 pt-4 flex flex-col gap-2">
 {filtered.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground">
 <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />
 {modo === "favoritos" ? "Nenhum resumo favoritado." : "Nenhum resumo aberto ainda."}
 </div>
 ) : (
 filtered.map((r, i) => (
 <motion.button
 key={r.id}
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(i * 0.01, 0.2) }}
 onClick={() => abrir(r)}
 className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
 >
 <FileText className="w-6 h-6 shrink-0" style={{ color: "#22D3EE" }} strokeWidth={1.7} />
 <div className="flex-1 min-w-0">
 <div className="font-body text-foreground line-clamp-2">
 {r.subtema || r.tema}
 </div>
 <div className="text-xs text-muted-foreground mt-0.5 truncate">
 {r.area} · {r.tema}
 </div>
 </div>
 {loadingId === r.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
 </motion.button>
 ))
 )}
 </div>

 <ResumoJuridicoReaderSheet resumo={selected} onClose={() => setSelected(null)} />
 <ResumosBottomNav />
 </div>
 );
}
