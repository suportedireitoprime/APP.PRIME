import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Heart,
  ArrowLeft,
  NotebookText,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { haptic } from "@/lib/nativeHaptics";
import { Input } from "@/components/ui/input";
import { resumosLocal } from "@/lib/resumosLocal";
import { useTypewriter } from "@/hooks/useTypewriter";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";

const RED = "#ef4444";

type AreaRow = { area: string; total: number; temas: string[] };
type TemaRow = { tema: string; ordem_tema: number | null; total: number };
type Ordem = "crono" | "alpha" | "fav";

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

let areasThemesCache: AreaRow[] | null = null;
const temasCache = new Map<string, TemaRow[]>();

export default function ResumosJuridicosDesktop() {
  const { area, tema } = useParams<{ area?: string; tema?: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();

  // --- COL 1: AREAS ---
  const [areas, setAreas] = useState<AreaRow[]>(() => areasThemesCache || []);
  const [loadingAreas, setLoadingAreas] = useState(!areasThemesCache);
  const [qArea, setQArea] = useState("");

  useEffect(() => {
    if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) {
      try {
        const stored = localStorage.getItem("resumos_areas_temas_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].temas) {
            areasThemesCache = parsed;
            setAreas(parsed);
            setLoadingAreas(false);
          }
        }
      } catch {}
    } else {
      setAreas(areasThemesCache);
      setLoadingAreas(false);
    }

    (async () => {
      if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) setLoadingAreas(true);

      const map = new Map<string, Set<string>>();
      const totalMap = new Map<string, number>();
      let from = 0;
      const step = 1000;
      let gotAny = false;

      while (true) {
        const { data, error } = await (supabase as any)
          .from("resumos_juridicos")
          .select("area, tema")
          .not("area", "is", null)
          .range(from, from + step - 1);
        
        if (error) break;
        if (!data || data.length === 0) break;
        
        gotAny = true;
        for (const r of data as { area: string; tema: string }) {
          if (!map.has(r.area)) map.set(r.area, new Set());
          if (r.tema) map.get(r.area)!.add(r.tema);
          totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
        }
        
        if (data.length < step) break;
        from += step;
      }

      if (!gotAny) {
        try {
          const { bundle } = await import("@/services/offlineBundle");
          const rows = await bundle.resumos<{ area: string; tema: string }>();
          for (const r of rows) {
            if (!r.area) continue;
            if (!map.has(r.area)) map.set(r.area, new Set());
            if (r.tema) map.get(r.area)!.add(r.tema);
            totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
          }
        } catch {}
      }

      const list = Array.from(map.entries())
        .map(([a, temasSet]) => ({
          area: a,
          total: totalMap.get(a) || 0,
          temas: Array.from(temasSet).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.area.localeCompare(b.area));

      if (list.length > 0) {
        areasThemesCache = list;
        setAreas(list);
        try {
          localStorage.setItem("resumos_areas_temas_cache", JSON.stringify(list));
        } catch {}
      }
      setLoadingAreas(false);
    })();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!qArea) return areas;
    const t = normalize(qArea.trim());
    return areas.filter((r) => normalize(r.area).includes(t));
  }, [areas, qArea]);


  // --- COL 2: TEMAS ---
  const [temas, setTemas] = useState<TemaRow[]>(() => decodedArea ? (temasCache.get(decodedArea) || []) : []);
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [qTema, setQTema] = useState("");
  const [ordemTema, setOrdemTema] = useState<Ordem>("crono");
  
  const [recentes, setRecentes] = useState(() => resumosLocal.recentes());
  const [favoritosGlobais, setFavoritosGlobais] = useState(() => resumosLocal.favoritos());

  useEffect(() => {
    const onEvt = () => {
      setRecentes(resumosLocal.recentes());
      setFavoritosGlobais(resumosLocal.favoritos());
    };
    window.addEventListener("resumos-local-change", onEvt);
    return () => window.removeEventListener("resumos-local-change", onEvt);
  }, []);

  useEffect(() => {
    if (!decodedArea) {
      setTemas([]);
      return;
    }
    let cancelled = false;
    const cacheKey = `resumos_temas_cache:${decodedArea}`;

    if (!temasCache.has(decodedArea)) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            temasCache.set(decodedArea, parsed);
            setTemas(parsed);
          }
        }
      } catch {}
    } else {
      setTemas(temasCache.get(decodedArea)!);
    }

    (async () => {
      if (!temasCache.has(decodedArea)) setLoadingTemas(true);
      let list: TemaRow[] = [];

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
        setTemas(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {}
      }
      setLoadingTemas(false);
    })();

    return () => { cancelled = true; };
  }, [decodedArea]);

  const filteredTemas = useMemo(() => {
    let result = temas;
    if (qTema.trim()) {
      const t = qTema.toLowerCase();
      result = result.filter(r => r.tema.toLowerCase().includes(t));
    }
    
    if (ordemTema === "alpha") {
      result = [...result].sort((a, b) => a.tema.localeCompare(b.tema));
    } else if (ordemTema === "fav") {
      result = result.filter(r => favoritosGlobais.some(f => f.tema === r.tema && f.area === decodedArea));
    }
    return result;
  }, [temas, qTema, ordemTema, favoritosGlobais, decodedArea]);

  const placeholderWordsTemas = useMemo(() => {
    const areaName = decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');
    if (temas.length === 0) return [`Pesquisar matéria de ${areaName}...`];
    return temas.map(r => `Pesquisar ${r.tema.toLowerCase()}...`);
  }, [temas, decodedArea]);
  const placeholderTextTemas = useTypewriter(placeholderWordsTemas, 50, 20, 2500);

  // --- COL 3: SUBTEMAS E LEITOR ---
  const [subtemas, setSubtemas] = useState<ResumoRow[]>([]);
  const [loadingSubtemas, setLoadingSubtemas] = useState(false);
  const [qSubtema, setQSubtema] = useState("");
  const [ordemSubtema, setOrdemSubtema] = useState<Ordem>("crono");
  
  const [selectedSubtema, setSelectedSubtema] = useState<ResumoRow | null>(null);

  useEffect(() => {
    setSelectedSubtema(null);
    if (!decodedArea || !decodedTema) {
      setSubtemas([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSubtemas(true);
      const { data } = await (supabase as any)
        .from("resumos_juridicos")
        .select("id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos")
        .eq("area", decodedArea)
        .eq("tema", decodedTema)
        .order("ordem_subtema", { ascending: true, nullsFirst: false })
        .order("subtema", { ascending: true })
        .limit(5000);
      let list = (data || []) as ResumoRow[];
      if (list.length === 0) {
        const { bundle } = await import("@/services/offlineBundle");
        const all = await bundle.resumos<ResumoRow>();
        list = all
          .filter((r) => r.area === decodedArea && r.tema === decodedTema)
          .sort((a, b) => (a.ordem_subtema ?? 9999) - (b.ordem_subtema ?? 9999));
      }
      if (cancelled) return;
      setSubtemas(list);
      setLoadingSubtemas(false);
    })();
    return () => { cancelled = true; };
  }, [decodedArea, decodedTema]);

  const subtemasOrdenados = useMemo(() => {
    let result = subtemas;
    
    if (qSubtema.trim()) {
      const qLower = qSubtema.toLowerCase();
      result = result.filter(s => 
        (s.subtema || s.tema).toLowerCase().includes(qLower)
      );
    }

    if (ordemSubtema === "alpha") {
      result = [...result].sort((a, b) => (a.subtema || "").localeCompare(b.subtema || ""));
    } else if (ordemSubtema === "fav") {
      result = result.filter((s) => favoritosGlobais.some(f => f.id === s.id));
    }
    
    return result;
  }, [subtemas, ordemSubtema, favoritosGlobais, qSubtema]);


  return (
    <div className="flex h-dvh bg-[#0D0D0D] text-white overflow-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex w-full h-full">
        {/* COL 1: Áreas */}
        <div className="w-[320px] xl:w-[380px] shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-md flex flex-col h-full shadow-2xl z-20">
          <div className="p-4 border-b border-white/5">
            <button
              onClick={() => { haptic.selection(); navigate("/"); }}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold text-[13px] tracking-wide">Voltar ao Início</span>
            </button>
            <h1 className="font-display text-white text-[24px] font-black tracking-tight mb-4 flex items-center gap-2">
              <NotebookText className="w-6 h-6 text-[#ef4444]" />
              Resumos
            </h1>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={qArea}
                onChange={(e) => setQArea(e.target.value)}
                placeholder="Pesquisar matéria..."
                className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
            {loadingAreas ? (
              <div className="flex items-center justify-center py-10 text-white/50">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredAreas.map((r) => {
              const displayArea = r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
              const isActive = r.area === decodedArea;
              const { icon: Icon, color } = styleForArea(r.area);
              return (
                <button
                  key={r.area}
                  onClick={() => navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-white/10 border-white/20 shadow-md' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${isActive ? 'bg-[#ef4444]/20' : 'bg-white/5'}`}>
                    <Icon className="w-5 h-5" style={{ color: isActive ? '#ef4444' : color }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`font-bold text-[14px] truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                      {displayArea}
                    </div>
                    <div className="text-[12px] text-zinc-500 font-medium">
                      {r.total} resumos
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white rotate-90' : 'text-zinc-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* COL 2: Temas */}
        {decodedArea && (
          <div className="w-[360px] xl:w-[420px] shrink-0 border-r border-white/5 bg-[#0D0D0D]/80 backdrop-blur-md flex flex-col h-full z-10">
            <div className="p-4 border-b border-white/5 bg-black/20">
              <div className="font-display text-[11px] uppercase tracking-widest text-[#ef4444] font-bold mb-1">
                Área Selecionada
              </div>
              <h2 className="font-display text-white text-[20px] font-bold tracking-tight mb-4">
                {decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "")}
              </h2>
              
              <div className="relative flex items-center mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={qTema}
                  onChange={(e) => setQTema(e.target.value)}
                  placeholder={placeholderTextTemas || "Pesquisar tema..."}
                  className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
                />
              </div>
              
              <div className="flex w-full bg-black/40 rounded-lg p-1 gap-1">
                {[
                  { id: "crono", label: "Crono" },
                  { id: "alpha", label: "A-Z" },
                  { id: "fav", label: "Fav" },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOrdemTema(o.id as Ordem)}
                    className={`flex-1 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                      ordemTema === o.id ? 'bg-[#ef4444] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
              {loadingTemas ? (
                <div className="flex items-center justify-center py-10 text-white/50">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filteredTemas.map((r) => {
                const isActive = r.tema === decodedTema;
                return (
                  <button
                    key={r.tema}
                    onClick={() => navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                      isActive 
                        ? 'bg-white/10 border-white/20 shadow-md' 
                        : 'bg-transparent border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-[36px] h-[50px] rounded flex-shrink-0 overflow-hidden opacity-90">
                      <img src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.webp" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-[14px] leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                        {r.tema}
                      </div>
                      <div className="text-[12px] text-[#ef4444] font-bold mt-1">
                        {r.total} resumos
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white rotate-90' : 'text-zinc-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* COL 3: Subtemas e Leitor */}
        {decodedTema ? (
          <div className="flex-1 flex flex-col h-full bg-[#0D0D0D]/60 backdrop-blur-sm z-0 relative">
            {!selectedSubtema ? (
              <>
                <div className="p-6 border-b border-white/5 bg-black/20">
                  <div className="font-display text-[11px] uppercase tracking-widest text-[#ef4444] font-bold mb-1">
                    Tema Selecionado
                  </div>
                  <h2 className="font-display text-white text-[24px] font-bold tracking-tight mb-4">
                    {decodedTema}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input
                        value={qSubtema}
                        onChange={(e) => setQSubtema(e.target.value)}
                        placeholder="Filtrar subtemas..."
                        className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-1 gap-1 shrink-0">
                      {[
                        { id: "crono", label: "Crono" },
                        { id: "alpha", label: "A-Z" },
                        { id: "fav", label: "Fav" },
                      ].map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setOrdemSubtema(o.id as Ordem)}
                          className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                            ordemSubtema === o.id ? 'bg-[#ef4444] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                  {loadingSubtemas ? (
                    <div className="flex items-center justify-center py-20 text-white/50">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 max-w-4xl">
                      {subtemasOrdenados.map((r, i) => {
                        const numero = String(
                          ordemSubtema === "crono" ? i + 1 : subtemas.findIndex((s) => s.id === r.id) + 1
                        ).padStart(2, "0");
                        const isFav = favoritosGlobais.some(f => f.id === r.id);
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedSubtema(r)}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-[#ef4444]/50 hover:bg-black/60 transition-all text-left group relative overflow-hidden"
                          >
                            <div className="absolute inset-y-0 left-0 w-1 bg-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="font-display font-bold text-[24px] text-[#ef4444] opacity-80 shrink-0 w-8 ml-1">
                              {numero}
                            </span>
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="font-semibold text-[15px] leading-snug text-white">
                                {r.subtema || r.tema}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isFav && <Heart className="w-4 h-4 text-[#ef4444] fill-[#ef4444]" />}
                              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full w-full bg-[#0D0D0D]">
                <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-black/40 backdrop-blur-md">
                  <button
                    onClick={() => setSelectedSubtema(null)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#ef4444] font-bold uppercase tracking-wider mb-0.5">
                      {selectedSubtema.tema}
                    </div>
                    <div className="font-bold text-[18px] text-white truncate">
                      {selectedSubtema.subtema || selectedSubtema.tema}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      haptic.selection();
                      resumosLocal.toggleFavorito({
                        id: selectedSubtema.id,
                        area: selectedSubtema.area,
                        tema: selectedSubtema.tema,
                        subtema: selectedSubtema.subtema,
                      });
                      setFavoritosGlobais(resumosLocal.favoritos());
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Heart className={`w-5 h-5 ${favoritosGlobais.some(f => f.id === selectedSubtema.id) ? "text-[#ef4444] fill-[#ef4444]" : "text-white"}`} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto w-full flex justify-center">
                  <div className="w-full max-w-4xl">
                    <ResumoJuridicoReaderSheet
                      open={true}
                      onOpenChange={(v) => !v && setSelectedSubtema(null)}
                      resumo={selectedSubtema}
                      defaultMetodo="conceitos"
                      inline={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0D0D0D]/60 backdrop-blur-sm z-0 relative p-8 text-center">
            <NotebookText className="w-24 h-24 text-white/5 mb-6" strokeWidth={1} />
            <h3 className="font-display text-[28px] font-bold text-white mb-2">Resumos Jurídicos</h3>
            <p className="text-zinc-500 max-w-md">Selecione uma área à esquerda para explorar os temas, e aprofunde seus estudos de forma estruturada e eficiente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
