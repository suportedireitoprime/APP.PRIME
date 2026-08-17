import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Star, MousePointerClick, Eye, AlertCircle } from "lucide-react";

type AvaliacaoEvent = {
  id: string;
  created_at: string;
  email: string | null;
  display_name: string | null;
  tag: string;
  platform: string | null;
};

export default function AdminAvaliacoesLoja() {
  const [events, setEvents] = useState<AvaliacaoEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from("app_feedback" as any)
          .select("id, created_at, email, display_name, tag, platform")
          .ilike("tag", "horus_avaliacao_%")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        setEvents(data as AvaliacaoEvent[]);
      } catch (err) {
        console.error("Erro ao carregar avaliações", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const totalExibicoes = events.filter((e) => e.tag === "horus_avaliacao_view").length;
  const totalCliques = events.filter((e) => e.tag === "horus_avaliacao_click").length;
  const ctr = totalExibicoes > 0 ? ((totalCliques / totalExibicoes) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Avaliações na Loja (Hórus)</h1>
        <p className="text-muted-foreground mt-1">
          Monitoramento do novo gatilho de avaliação (3 aberturas / 6h).
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
          <strong className="font-semibold text-amber-700 dark:text-amber-300">Nota sobre a API Nativa:</strong>
          <br />
          Google Play e App Store não permitem rastrear se o usuário de fato enviou as estrelas nem quantas foram (para evitar que apps exijam 5 estrelas). O que conseguimos mensurar aqui é a <b>intenção</b>: quem viu o banner e quem clicou em avaliar.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="w-4 h-4" />
            <h3 className="font-medium text-sm">Total de Exibições</h3>
          </div>
          <p className="text-3xl font-bold font-display text-foreground">{totalExibicoes}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MousePointerClick className="w-4 h-4" />
            <h3 className="font-medium text-sm">Cliques (Intenções)</h3>
          </div>
          <p className="text-3xl font-bold font-display text-foreground">{totalCliques}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Star className="w-4 h-4" />
            <h3 className="font-medium text-sm">Taxa de Conversão</h3>
          </div>
          <p className="text-3xl font-bold font-display text-primary">{ctr}%</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">Últimos Eventos</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum evento registrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium">Plataforma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(e.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{e.display_name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground">{e.email || "Sem e-mail"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {e.tag === "horus_avaliacao_click" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                          <MousePointerClick className="w-3 h-3" />
                          Clicou
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Eye className="w-3 h-3" />
                          Visualizou
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-muted-foreground">{e.platform || "Web"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
