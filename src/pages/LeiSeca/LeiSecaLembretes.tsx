import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BellRing, Clock, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import LeiSecaBottomNav from "@/components/lei-seca/LeiSecaBottomNav";

export default function LeiSecaLembretes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diarioAtivo, setDiarioAtivo] = useState(false);
  const [diarioHora, setDiarioHora] = useState("20:00");
  const [retomadaAtiva, setRetomadaAtiva] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    supabase
      .from("lei_seca_lembretes")
      .select("diario_ativo,diario_hora,retomada_ativa")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel || !data) return;
        setDiarioAtivo(!!data.diario_ativo);
        setDiarioHora(data.diario_hora ?? "20:00");
        setRetomadaAtiva(!!data.retomada_ativa);
      });
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  async function salvar() {
    if (!user?.id) return;
    setSalvando(true);
    const { error } = await supabase.from("lei_seca_lembretes").upsert(
      {
        user_id: user.id,
        diario_ativo: diarioAtivo,
        diario_hora: diarioHora,
        retomada_ativa: retomadaAtiva,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSalvando(false);
    if (error) toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Lembretes atualizados" });
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 pt-safe">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/lei-seca")} aria-label="Voltar" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-[16px] flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" /> Lembretes da Lei Seca
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-[15px]">Lembrete diário</p>
              <p className="text-[12.5px] text-muted-foreground">Receba um aviso para praticar a lei seca todo dia.</p>
            </div>
            <Switch checked={diarioAtivo} onCheckedChange={setDiarioAtivo} />
          </div>
          {diarioAtivo && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[12.5px] text-muted-foreground">Horário</span>
              <Input type="time" value={diarioHora} onChange={(e) => setDiarioHora(e.target.value)} className="w-32" />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-start gap-3">
          <Repeat className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[15px]">Retomar de onde parei</p>
            <p className="text-[12.5px] text-muted-foreground">Avisar quando houver uma trilha em andamento parada.</p>
          </div>
          <Switch checked={retomadaAtiva} onCheckedChange={setRetomadaAtiva} />
        </div>

        <Button onClick={salvar} disabled={salvando || !user?.id} className="w-full h-12 rounded-xl font-bold">
          {salvando ? "Salvando…" : "Salvar preferências"}
        </Button>
      </div>

      <LeiSecaBottomNav />
    </div>
  );
}
