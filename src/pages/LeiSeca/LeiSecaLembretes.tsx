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
    <div className="min-h-screen bg-background pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/lei-seca")} aria-label="Voltar" className="h-11 w-11 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition touch-manipulation">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-[16px] flex items-center gap-2">
            <BellRing className="h-4.5 w-4.5 text-primary" /> Lembretes da Lei Seca
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-3.5">
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-[15px] text-foreground">Lembrete diário</p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">Receba um aviso para praticar a lei seca todo dia.</p>
            </div>
            <Switch checked={diarioAtivo} onCheckedChange={setDiarioAtivo} className="touch-manipulation" />
          </div>
          {diarioAtivo && (
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-3">
              <span className="text-[13px] font-medium text-muted-foreground">Horário do aviso</span>
              <Input type="time" value={diarioHora} onChange={(e) => setDiarioHora(e.target.value)} className="w-36 h-11 text-center font-bold text-base" />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 flex items-start gap-3">
          <Repeat className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[15px] text-foreground">Retomar de onde parei</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Avisar quando houver uma trilha em andamento parada.</p>
          </div>
          <Switch checked={retomadaAtiva} onCheckedChange={setRetomadaAtiva} className="touch-manipulation" />
        </div>

        <Button onClick={salvar} disabled={salvando || !user?.id} className="w-full min-h-[52px] rounded-2xl font-bold text-[15px] touch-manipulation">
          {salvando ? "Salvando…" : "Salvar preferências"}
        </Button>
      </div>

      <LeiSecaBottomNav />
    </div>
  );
}
