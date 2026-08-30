import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
 BookOpen,
 ChevronDown,
 ChevronRight,
 Loader2,
 Search,
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
 X,
 Mic,
 MicOff,
 Scroll,
} from "lucide-react";
import ResumosBottomNav from "@/components/resumos/ResumosBottomNav";
import ResumosCargoHero from "@/components/resumos/ResumosCargoHero";
import { AREAS_LEIS, leisDaArea, AreaLeis } from "@/lib/leisPorArea";
import type { LeiCatalogItem } from "@/data/leisCatalog";
import LeiArtigosSheet from "@/components/resumos-juridicos/LeiArtigosSheet";
import { LEI_ICON_MAP } from "@/lib/leiIcons";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { haptic } from "@/lib/nativeHaptics";

type Aba = "cargos" | "areas" | "leis" | "jurisprudencia";

const JURIS_ITENS: { label: string; desc: string; rota: string; color: string }[] = [
 { label: "Súmulas Vinculantes", desc: "STF · efeito vinculante", rota: "/resumos-juridicos/jurisprudencia/sumulas-vinculantes", color: "#f87171" },
 { label: "Súmulas do STF", desc: "Enunciados do Supremo", rota: "/resumos-juridicos/jurisprudencia/sumulas-stf", color: "#60a5fa" },
 { label: "Súmulas do STJ", desc: "Enunciados do Superior", rota: "/resumos-juridicos/jurisprudencia/sumulas-stj", color: "#34d399" },
 { label: "Informativos do STF", desc: "Julgados recentes", rota: "/resumos-juridicos/jurisprudencia/informativos-stf", color: "#a78bfa" },
 { label: "Informativos do STJ", desc: "Julgados recentes", rota: "/resumos-juridicos/jurisprudencia/informativos-stj", color: "#22d3ee" },
 { label: "Teses do STF", desc: "Repercussão geral", rota: "/resumos-juridicos/jurisprudencia/teses-stf", color: "#fbbf24" },
 { label: "Teses do STJ", desc: "Jurisprudência em teses", rota: "/resumos-juridicos/jurisprudencia/teses-stj", color: "#fb923c" },
 { label: "Pesquisas prontas STF", desc: "Temas selecionados", rota: "/resumos-juridicos/jurisprudencia/prontas-stf", color: "#f472b6" },
 { label: "Pesquisas prontas STJ", desc: "Temas selecionados", rota: "/resumos-juridicos/jurisprudencia/prontas-stj", color: "#a3e635" },
];

const CARGOS = [
 { id: "magistratura", nome: "Magistratura", color: "#c2274a", icon: Scale },
 { id: "ministerio-publico", nome: "Ministério Público", color: "#38bdf8", icon: Landmark },
 { id: "carreira-policial", nome: "Carreira Policial", color: "#fbbf24", icon: Shield },
 { id: "oab", nome: "OAB", color: "#f87171", icon: Briefcase },
];


type AreaRow = { area: string; total: number };

// Ícone e cor (hex) por área
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

let areasCache: AreaRow[] | null = null;

export default function ResumosJuridicosAreas() {
 const navigate = useNavigate();
 const [rows, setRows] = useState<AreaRow[]>(() => areasCache || []);
 const [loading, setLoading] = useState(!areasCache);
 const [q, setQ] = useState("");
 const [buscaAberta, setBuscaAberta] = useState(false);
 const [aba, setAba] = useState<Aba>("cargos");
 const [areaLeis, setAreaLeis] = useState<AreaLeis | null>(null);
 const [leiArtigos, setLeiArtigos] = useState<{ lei: LeiCatalogItem; area: string } | null>(null);
 const [buscaLeis, setBuscaLeis] = useState("");
 const voiceLeis = useVoiceInput((t: string) => setBuscaLeis(t));
 const voiceBusca = useVoiceInput((t: string) => setQ(t));
 const [filtroBusca, setFiltroBusca] = useState<"todos" | "areas" | "leis" | "jurisprudencia">("todos");

 useEffect(() => {
 // Scroll top when switching tabs
 window.scrollTo({ top: 0, left: 0, behavior: "instant" });
 }, [aba]);

 useEffect(() => {
 if (!areasCache) {
 try {
 const stored = localStorage.getItem("resumos_areas_cache");
 if (stored) {
 const parsed = JSON.parse(stored);
 if (Array.isArray(parsed) && parsed.length > 0) {
 areasCache = parsed;
 setRows(parsed);
 setLoading(false);
 }
 }
 } catch {}
 } else {
 setRows(areasCache);
 setLoading(false);
 }

 (async () => {
 if (!areasCache) setLoading(true);
 let list: AreaRow[] = [];

 try {
 const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("get_resumos_areas_counts");
 if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
 list = rpcData.map((r: any) => ({ area: r.area, total: Number(r.total) || 0 }));
 }
 } catch {}

 if (list.length === 0) {
 const map = new Map<string, number>();
 let from = 0;
 const step = 1000;
 let gotAny = false;
 while (true) {
 const { data, error } = await (supabase as any)
 .from("resumos_juridicos")
 .select("area")
 .not("area", "is", null)
 .range(from, from + step - 1);
 if (error) break;
 if (!data || data.length === 0) break;
 gotAny = true;
 for (const r of data as { area: string }[]) {
 map.set(r.area, (map.get(r.area) || 0) + 1);
 }
 if (data.length < step) break;
 from += step;
 }

 if (!gotAny) {
 const { bundle } = await import("@/services/offlineBundle");
 const rows = await bundle.resumos<{ area: string }>();
 for (const r of rows) {
 if (!r.area) continue;
 map.set(r.area, (map.get(r.area) || 0) + 1);
 }
 }

 list = Array.from(map.entries())
 .map(([area, total]) => ({ area, total }))
 .sort((a, b) => a.area.localeCompare(b.area));
 }

 if (list.length > 0) {
 areasCache = list;
 setRows(list);
 try {
 localStorage.setItem("resumos_areas_cache", JSON.stringify(list));
 } catch {}
 }
 setLoading(false);
 })();
 }, []);

 const totalAcervo = rows.reduce((acc, row) => acc + row.total, 0);

 const filtered = useMemo(() => {
 if (!q) return rows;
 const t = normalize(q.trim());
 return rows.filter((r) => normalize(r.area).includes(t));
 }, [rows, q]);

 return (
 <div className="min-h-dvh bg-background pb-[calc(7rem+var(--sai-bottom))] lg:pb-[calc(3rem+var(--sai-bottom))] overflow-x-hidden">
 <PageHeader title="Resumos Jurídicos" onBack={() => navigate("/")} />

 <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 mt-2">
 
 {/* HERO SECTION */}
 <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6 mt-1">
 <ResumosCargoHero 
 pct={0} 
 total={0} 
 hoje={0} 
 meta={100} 
 disponiveis={totalAcervo || 1200} 
 streak={0}
 />
 </div>

 {/* BUSCA PRINCIPAL */}
 <div className="bg-card border border-border/80 p-5 rounded-3xl shadow-xl mt-2 mb-6">
 <div className="flex items-center gap-2">
 <span className="h-5 w-1 rounded-full bg-[#38bdf8]" />
 <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Explorar Resumos</h2>
 </div>
 <p className="ml-3 mt-1 text-xs text-muted-foreground">
 Pesquise qualquer matéria, lei ou súmula no acervo.
 </p>

 <button
 onClick={() => { haptic.selection(); setBuscaAberta(true); }}
 className="group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-start px-4 gap-3 rounded-2xl bg-[#0b3b46] border border-[#38bdf8]/30 shadow-lg shadow-black/30 transition-all active:scale-[0.99]"
 >
 <Search className="h-6 w-6 text-white shrink-0" strokeWidth={2} />
 <span className="tracking-wide text-white/70 flex-1 text-left truncate font-medium">Pesquise o resumo...</span>
 <div className="h-10 px-4 rounded-xl bg-[#38bdf8] text-black font-display text-[12px] font-bold tracking-wider flex items-center justify-center shadow-md shrink-0">
 PESQUISAR
 </div>
 </button>
 </div>

 {/* MENU DE ALTERNÂNCIA (SEGMENTED CONTROL) */}
 <div className="flex w-full bg-secondary/50 rounded-2xl p-1 gap-1 mb-5">
 {([
 { id: "cargos", label: "Cargos" },
 { id: "areas", label: "Matérias" },
 { id: "leis", label: "Leis" },
 { id: "jurisprudencia", label: "Jurisprudência" },
 ] as { id: Aba; label: string }[]).map((o) => {
 const ativo = aba === o.id;
 return (
 <button
 key={o.id}
 onClick={() => { haptic.selection(); setAba(o.id); }}
 className={`flex-1 py-3 rounded-xl text-[12px] font-bold transition-all uppercase tracking-wide ${
 ativo ? 'bg-[#38bdf8] text-black shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 {o.label}
 </button>
 );
 })}
 </div>

 {/* LISTA: CARGOS */}
 {aba === "cargos" && (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {CARGOS.map((c, i) => {
 const Icon = c.icon;
 return (
 <motion.button
 key={c.id}
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(i * 0.02, 0.3) }}
 onClick={() => navigate(`/resumos-juridicos/cargos/${c.id}`)}
 className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-card border border-border hover:border-[#38bdf8]/40 transition-all text-center hover:scale-[1.02] shadow-sm group"
 >
 <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:bg-[#38bdf8]/10 transition-colors">
 <Icon className="w-8 h-8 shrink-0" style={{ color: c.color }} strokeWidth={1.7} />
 </div>
 <div className="font-display font-bold text-[14px] uppercase text-foreground leading-tight">
 {c.nome}
 </div>
 </motion.button>
 );
 })}
 </div>
 )}

 {/* LISTA: MATÉRIAS */}
 {aba === "areas" && (
 <div>
 {loading ? (
 <div className="flex items-center justify-center py-16 text-muted-foreground">
 <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando áreas...
 </div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground text-sm space-y-3">
 <p>Nenhuma área encontrada para &quot;{q}&quot;.</p>
 {!navigator.onLine && (
 <p className="text-xs text-primary max-w-sm mx-auto border border-primary/20 bg-primary/5 p-3 rounded-xl">
 Parece que você está offline e não baixou o Banco de Resumos.
 Acesse o <b>Modo Offline &gt; Banco de Dados Base</b> para baixá-los quando tiver internet.
 </p>
 )}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
 {filtered.map((r, i) => {
 const s = styleForArea(r.area);
 const Icon = s.icon;
 return (
 <motion.button
 key={r.area}
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(i * 0.02, 0.3) }}
 onClick={() => navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`)}
 className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-[#38bdf8]/40 transition-all text-left hover:scale-[1.02] shadow-sm group"
 >
 <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-[#38bdf8]/10 transition-colors">
 <Icon className="w-6 h-6 shrink-0" style={{ color: s.color }} strokeWidth={1.7} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-[14px] uppercase text-foreground truncate">{r.area.replace(/^DIREITO\s+/i, '')}</div>
 <div className="text-[12px] text-muted-foreground mt-0.5">
 {r.total} {r.total === 1 ? "resumo" : "resumos"}
 </div>
 </div>
 <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-[#38bdf8] transition-colors shrink-0" />
 </motion.button>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* LISTA: LEIS */}
 {aba === "leis" && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
 {AREAS_LEIS.map((a, i) => {
 const Icon = styleForArea(a.nome).icon;
 return (
 <motion.button
 key={a.id}
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(i * 0.02, 0.3) }}
 onClick={() => { setBuscaLeis(""); setAreaLeis(a); }}
 className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-[#38bdf8]/40 transition-all text-left hover:scale-[1.02] shadow-sm group"
 >
 <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-[#38bdf8]/10 transition-colors">
 <Icon className="w-6 h-6 shrink-0" style={{ color: a.color }} strokeWidth={1.7} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-[14px] uppercase text-foreground truncate">{a.nome.replace(/^DIREITO\s+/i, '')}</div>
 <div className="text-[12px] text-muted-foreground mt-0.5">
 {leisDaArea(a).length} {leisDaArea(a).length === 1 ? "lei" : "leis"}
 </div>
 </div>
 <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-[#38bdf8] transition-colors shrink-0" />
 </motion.button>
 );
 })}
 </div>
 )}

 {/* LISTA: JURISPRUDÊNCIA */}
 {aba === "jurisprudencia" && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
 {JURIS_ITENS.map((j, i) => (
 <motion.button
 key={j.rota}
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(i * 0.02, 0.3) }}
 onClick={() => navigate(j.rota)}
 className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-[#38bdf8]/40 transition-all text-left hover:scale-[1.02] shadow-sm group"
 >
 <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-[#38bdf8]/10 transition-colors">
 <Scroll className="w-6 h-6 shrink-0" style={{ color: j.color }} strokeWidth={1.7} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-[14px] uppercase text-foreground truncate">{j.label}</div>
 <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{j.desc}</div>
 </div>
 <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-[#38bdf8] transition-colors shrink-0" />
 </motion.button>
 ))}
 </div>
 )}
 </div>

 {/* OVERLAY: LEIS DA ÁREA */}
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
 placeholder="Pesquisar nesta área"
 className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
 />
 </div>
 <button
 type="button"
 onClick={voiceLeis.toggle}
 aria-label={voiceLeis.listening ? "Parar gravação" : "Pesquisar por voz"}
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

 {/* OVERLAY DE BUSCA PRINCIPAL */}
 <AnimatePresence>
 {buscaAberta && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setBuscaAberta(false)}
 className="fixed inset-0 z-[60] bg-black/60 "
 />
 <motion.div
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
 className="fixed bottom-0 left-0 right-0 z-[61] flex h-[90dvh] flex-col rounded-t-3xl overflow-hidden border-t border-border bg-background"
 >
 <div className="bg-hero-panel-cyan px-4 pb-4 pt-2">
 <div className="flex items-center justify-center pb-2">
 <div className="w-10 h-1 rounded-full bg-white/30" />
 </div>
 <div className="flex items-center gap-2.5">
 <button
 onClick={() => setBuscaAberta(false)}
 aria-label="Fechar busca"
 className="w-11 h-11 rounded-full bg-black/80 border border-white/20 flex items-center justify-center active:scale-95 transition shrink-0"
 >
 <ChevronDown className="w-6 h-6 text-white" />
 </button>
 <div className="relative flex-1 min-w-0">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
 <input
 autoFocus
 value={voiceBusca.listening && voiceBusca.partial ? voiceBusca.partial : q}
 onChange={(e) => setQ(e.target.value)}
 placeholder="Buscar matéria, lei ou súmula"
 className="w-full h-12 pl-11 pr-4 rounded-2xl bg-black/80 border border-white/25 text-white placeholder:text-white/50 outline-none"
 />
 </div>
 <button
 type="button"
 onClick={voiceBusca.toggle}
 aria-label={voiceBusca.listening ? "Parar gravação" : "Pesquisar por voz"}
 className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition ${
 voiceBusca.listening
 ? "bg-red-500 text-white animate-pulse shadow-red-500/40"
 : "bg-black/80 border border-white/25 text-white"
 }`}
 >
 {voiceBusca.listening ? <MicOff className="w-5 h-5" strokeWidth={2.4} /> : <Mic className="w-5 h-5" strokeWidth={2.4} />}
 </button>
 </div>

 <div className="mt-3 flex items-center gap-1 p-1 rounded-full bg-black/30 border border-white/15">
 {([
 { id: "todos", label: "Todos" },
 { id: "areas", label: "Matérias" },
 { id: "leis", label: "Leis" },
 { id: "jurisprudencia", label: "Jurisprudência" },
 ] as const).map((f) => {
 const ativo = filtroBusca === f.id;
 return (
 <button
 key={f.id}
 onClick={() => setFiltroBusca(f.id)}
 className={`relative flex-1 h-9 rounded-full font-display text-[12px] font-bold uppercase tracking-wide transition-colors ${
 ativo ? "bg-white text-[#0b3b46]" : "text-white/70"
 }`}
 >
 {f.label}
 </button>
 );
 })}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 pb-[calc(1rem+var(--sai-bottom))]">
 {(filtroBusca === "todos" || filtroBusca === "areas") &&
 filtered.map((r) => {
 const s = styleForArea(r.area);
 const Icon = s.icon;
 return (
 <button
 key={`area-${r.area}`}
 onClick={() => {
 setBuscaAberta(false);
 navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`);
 }}
 className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
 >
 <Icon className="w-6 h-6 shrink-0" style={{ color: s.color }} strokeWidth={1.7} />
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-foreground truncate">{r.area.replace(/^DIREITO\s+/i, '')}</div>
 <div className="text-xs text-muted-foreground/90 mt-0.5">
 {r.total} {r.total === 1 ? "resumo" : "resumos"}
 </div>
 </div>
 </button>
 );
 })}

 {(filtroBusca === "todos" || filtroBusca === "leis") &&
 AREAS_LEIS.flatMap((a) => leisDaArea(a).map((lei) => ({ lei, a })))
 .filter(({ lei }) => {
 const t = normalize(q.trim());
 if (!t) return true;
 return normalize(`${lei.nome} ${lei.sigla} ${lei.descricao}`).includes(t);
 })
 .slice(0, 60)
 .map(({ lei, a }) => {
 const LawIcon = LEI_ICON_MAP[lei.id] || styleForArea(a.nome).icon;
 return (
 <button
 key={`lei-${lei.id}`}
 onClick={() => {
 setBuscaAberta(false);
 setLeiArtigos({ lei, area: a.nome });
 }}
 className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
 >
 <LawIcon
 className="w-6 h-6 shrink-0"
 style={{ color: (lei as any).iconColor || a.color }}
 strokeWidth={1.7}
 />
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-foreground truncate uppercase text-[14px]">
 {lei.nome}
 </div>
 <div className="text-xs text-muted-foreground/90 mt-0.5 line-clamp-1">{lei.descricao}</div>
 </div>
 </button>
 );
 })}

 {(filtroBusca === "todos" || filtroBusca === "jurisprudencia") &&
 JURIS_ITENS.filter((j) => {
 const t = normalize(q.trim());
 if (!t) return true;
 return normalize(`${j.label} ${j.desc}`).includes(t);
 }).map((j) => (
 <button
 key={`juris-${j.rota}`}
 onClick={() => {
 setBuscaAberta(false);
 navigate(j.rota);
 }}
 className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
 >
 <Scroll className="w-6 h-6 shrink-0" style={{ color: j.color }} strokeWidth={1.7} />
 <div className="flex-1 min-w-0">
 <div className="font-display font-bold text-foreground truncate">{j.label}</div>
 <div className="text-xs text-muted-foreground/90 mt-0.5 line-clamp-1">{j.desc}</div>
 </div>
 </button>
 ))}
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

 <ResumosBottomNav hidden={buscaAberta || !!leiArtigos} />
 </div>
 );
}
