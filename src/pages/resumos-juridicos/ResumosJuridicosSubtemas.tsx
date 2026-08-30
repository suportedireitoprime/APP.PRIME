import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Heart, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import ResumosBottomNav from "@/components/resumos/ResumosBottomNav";
import { resumosLocal } from "@/lib/resumosLocal";

export default function ResumosJuridicosSubtemas() {
  const { area, tema } = useParams<{ area: string; tema: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();
  const [rows, setRows] = useState<ResumoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [favs, setFavs] = useState<string[]>(() => resumosLocal.favoritos().map((f) => f.id));

  useEffect(() => {
    (async () => {
      setLoading(true);
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
      setRows(list);
      setLoading(false);
    })();
  }, [decodedArea, decodedTema]);

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <PageHeader
          title={decodedTema}
          subtitle={decodedArea}
          onBack={() => navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}`)}
        />
      </div>


      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Nenhum subtema.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => {
              const fav = favs.includes(r.id);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all"
                >
                  <button
                    onClick={() => {
                      resumosLocal.registrarRecente({
                        id: r.id,
                        area: r.area,
                        tema: r.tema,
                        subtema: r.subtema,
                      });
                      setSelected(r);
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <FileText className="w-6 h-6 shrink-0" style={{ color: "#22D3EE" }} strokeWidth={1.7} />
                    <span className="font-body text-foreground line-clamp-2">
                      {r.subtema || "(sem título)"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      resumosLocal.toggleFavorito({
                        id: r.id,
                        area: r.area,
                        tema: r.tema,
                        subtema: r.subtema,
                      });
                      setFavs(resumosLocal.favoritos().map((f) => f.id));
                    }}
                    aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                    className="shrink-0 p-1.5 active:scale-90 transition"
                  >
                    <Heart
                      className={`w-5 h-5 ${fav ? "text-primary fill-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ResumoJuridicoReaderSheet resumo={selected} onClose={() => setSelected(null)} />
      <ResumosBottomNav />
    </div>
  );
}

