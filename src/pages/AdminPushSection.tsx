import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import { Smartphone, Globe } from "lucide-react";
import PushDiagnosticoTab from "@/components/admin/PushDiagnosticoTab";
import { Section, SECTION_META, Campaign, TokenStats } from "@/components/admin/push/pushTypes";
import { StatCard } from "@/components/admin/push/PushStatCard";
import { PushManualForm } from "@/components/admin/push/PushManualForm";
import { PushProgramadasSection } from "@/components/admin/push/PushProgramadasSection";
import { PushDashboardSection } from "@/components/admin/push/PushDashboardSection";
import { PushHistoricoSection } from "@/components/admin/push/PushHistoricoSection";
import { PushCampaignDetailDialog } from "@/components/admin/push/PushCampaignDetailDialog";
import { PushOpensHistoryDialog } from "@/components/admin/push/PushOpensHistoryDialog";

export default function AdminPushSection() {
  const navigate = useNavigate();
  const { section: rawSection } = useParams<{ section: string }>();
  const section = (SECTION_META[rawSection as Section] ? rawSection : "enviar") as Section;
  const meta = SECTION_META[section];

  const [stats, setStats] = useState<TokenStats>({ total: 0, android: 0, ios: 0, web: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todas");
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [opensTodayOpen, setOpensTodayOpen] = useState(false);

  async function loadStats() {
    const { data } = await supabase.from("device_tokens").select("platform");
    const s: TokenStats = { total: 0, android: 0, ios: 0, web: 0 };
    (data ?? []).forEach((r: any) => {
      s.total++;
      if (r.platform === "android") s.android++;
      else if (r.platform === "ios") s.ios++;
      else if (r.platform === "web") s.web++;
    });
    setStats(s);
  }

  async function loadCampaigns() {
    const { data } = await supabase
      .from("push_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setCampaigns((data ?? []) as Campaign[]);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadCampaigns()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={meta.title} subtitle={meta.subtitle} onBack={() => navigate("/admin-push")} />
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Devices" value={stats.total} />
          <StatCard icon={<Smartphone className="w-3 h-3" />} label="Android" value={stats.android} />
          <StatCard icon={<Smartphone className="w-3 h-3" />} label="iOS" value={stats.ios} />
          <StatCard icon={<Globe className="w-3 h-3" />} label="Web" value={stats.web} />
        </div>

        {section === "enviar" && <PushManualForm onCampaignSent={loadCampaigns} />}

        {section === "programadas" && (
          <PushProgramadasSection campaigns={campaigns} onRefresh={loadCampaigns} />
        )}

        {section === "dashboard" && (
          <PushDashboardSection
            campaigns={campaigns}
            loading={loading}
            tipoFiltro={tipoFiltro}
            setTipoFiltro={setTipoFiltro}
            onRefresh={loadCampaigns}
            onOpenDetail={setDetailCampaign}
            onOpenOpensToday={() => setOpensTodayOpen(true)}
          />
        )}

        {section === "historico" && (
          <PushHistoricoSection
            campaigns={campaigns}
            onRefresh={loadCampaigns}
            onOpenDetail={setDetailCampaign}
          />
        )}

        {section === "diagnostico" && <PushDiagnosticoTab />}
      </div>

      <PushCampaignDetailDialog campaign={detailCampaign} onClose={() => setDetailCampaign(null)} />
      <PushOpensHistoryDialog open={opensTodayOpen} onClose={() => setOpensTodayOpen(false)} />
    </div>
  );
}
