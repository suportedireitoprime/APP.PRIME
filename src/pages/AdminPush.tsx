import { useNavigate } from "react-router-dom";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { PushProgramadasSection } from "@/components/admin/push/PushProgramadasSection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/components/admin/push/pushTypes";

export default function AdminPush() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

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
    loadCampaigns().finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader
        title="Notificações Push"
        subtitle="Central de automações e envios programados"
        onBack={() => navigate("/admin-funcoes")}
      />
      <div className="max-w-3xl mx-auto p-4 space-y-4">
         <PushProgramadasSection campaigns={campaigns} onRefresh={loadCampaigns} />
      </div>
    </div>
  );
}
