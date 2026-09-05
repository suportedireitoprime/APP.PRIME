import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Loader2, Send, Smile, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  Platform,
  PremiumFilter,
  SendMode,
  Recurrence,
  Channel,
  TITULO_TEMPLATES,
  MENSAGEM_TEMPLATES,
  PLATFORM_LABEL,
  DESTINOS,
} from "./pushTypes";

interface PushManualFormProps {
  onCampaignSent: () => void;
}

export function PushManualForm({ onCampaignSent }: PushManualFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [emoji, setEmoji] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(["android", "ios", "web"]);
  const [premium, setPremium] = useState<PremiumFilter>("all");
  const [emails, setEmails] = useState("");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [weekday, setWeekday] = useState("1");
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<Channel>("app");
  const [personalize, setPersonalize] = useState(true);
  const [tituloTemplate, setTituloTemplate] = useState<string>("__custom");
  const [mensagemTemplate, setMensagemTemplate] = useState<string>("__custom");

  const audience = useMemo(() => {
    const emailList = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    return {
      all: platforms.length === 3 && premium === "all" && emailList.length === 0,
      platforms,
      premium,
      emails: emailList.length ? emailList : undefined,
    };
  }, [platforms, premium, emails]);

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setUrl("");
    setEmails("");
    setEmoji("");
    setImageUrl("");
    setPlatforms(["android", "ios", "web"]);
    setPremium("all");
    setSendMode("now");
    setScheduledAt("");
    setRecurrence("none");
    setChannel("app");
    setTituloTemplate("__custom");
    setMensagemTemplate("__custom");
  }

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `manual/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("push-covers").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("push-covers").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (!signed.data?.signedUrl) throw new Error("Não gerou URL");
      setImageUrl(signed.data.signedUrl);
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no upload");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Selecione ao menos uma plataforma");
      return;
    }
    if (sendMode === "scheduled" && !scheduledAt) {
      toast.error("Escolha data e hora do agendamento");
      return;
    }
    setSending(true);
    try {
      if (sendMode === "now") {
        const results: string[] = [];

        if (channel === "app" || channel === "both") {
          const { data: campaign, error: campaignError } = await supabase
            .from("push_campaigns")
            .insert({
              title,
              body,
              url: url || null,
              audience,
              recurrence: null,
              status: "sending",
              emoji: emoji || null,
              image_url: imageUrl || null,
            })
            .select("id")
            .single();
          if (campaignError) throw campaignError;

          const { data, error } = await supabase.functions.invoke("send-push", {
            body: {
              campaign_id: campaign.id,
              title,
              body,
              url: url || undefined,
              audience,
              emoji: emoji || undefined,
              image: imageUrl || undefined,
              personalize,
            },
          });
          if (error) {
            const detail = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
            throw new Error(detail);
          }
          results.push(`App: ${data?.sent ?? 0}/${data?.total ?? 0}`);
        }

        if (channel === "horus" || channel === "both") {
          const linkAbs = url ? (url.startsWith("http") ? url : `https://huggable-calc-89.lovable.app${url}`) : "";
          const mensagemFinal = `*${title}*\n\n${body}${linkAbs ? `\n\n${linkAbs}` : ""}`;
          const { data: hc, error: hcErr } = await supabase
            .from("horus_campaigns")
            .insert({
              titulo: title,
              mensagem: mensagemFinal,
              media_url: imageUrl || null,
              publico_alvo: premium === "all" ? "todos" : premium,
              status: "pendente",
            })
            .select("id")
            .single();
          if (hcErr) throw hcErr;
          const { data: hData, error: hErr } = await supabase.functions.invoke("horus", {
            body: { fn: "campaign-run", campaign_id: hc.id },
          });
          if (hErr) {
            const detail = hErr instanceof FunctionsHttpError ? await hErr.context.text() : hErr.message;
            throw new Error(detail);
          }
          results.push(`Horus: ${hData?.total ?? 0} alvos`);
        }

        toast.success(`Enviado — ${results.join(" • ")}`);
      } else {
        if (channel === "horus") {
          toast.error("Agendamento pelo Horus ainda não é suportado — envie agora.");
          setSending(false);
          return;
        }
        const rec =
          recurrence === "none"
            ? null
            : recurrence === "daily"
            ? { type: "daily", time: scheduledAt.slice(11, 16) || "09:00" }
            : { type: "weekly", weekday: Number(weekday), time: scheduledAt.slice(11, 16) || "09:00" };
        const iso = new Date(scheduledAt).toISOString();
        const { error } = await supabase.from("push_campaigns").insert({
          title,
          body,
          url: url || null,
          audience,
          recurrence: rec,
          status: "scheduled",
          scheduled_at: iso,
          next_run_at: iso,
          emoji: emoji || null,
          image_url: imageUrl || null,
        });
        if (error) throw error;
        toast.success("Campanha agendada");
      }
      resetForm();
      onCampaignSent();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div>
          <Label className="text-sm font-semibold">Título</Label>
          <Select
            value={tituloTemplate}
            onValueChange={(v) => {
              setTituloTemplate(v);
              if (v === "__custom") setTitle("");
              else {
                const tpl = TITULO_TEMPLATES.find((t) => t.value === v);
                if (tpl) setTitle(tpl.value);
              }
            }}
          >
            <SelectTrigger className="mt-1 h-11 text-base">
              <SelectValue placeholder="Escolher template ou personalizar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__custom">✏️ Personalizado</SelectItem>
              {TITULO_TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="mt-2 h-11 text-base"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tituloTemplate === "__custom" ? "Digite o título…" : "Edite o template se quiser"}
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-[88px_1fr] gap-2">
          <div>
            <Label className="flex items-center gap-1 text-xs">
              <Smile className="w-3 h-3" /> Emoji
            </Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              placeholder="⚖️"
              className="text-center text-xl h-11"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1 text-xs">
              <ImageIcon className="w-3 h-3" /> Capa (opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL ou envie um arquivo"
                className="h-11 text-base"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
                <Button asChild size="lg" variant="secondary" disabled={uploadingImage} className="h-11">
                  <span>
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </span>
                </Button>
              </label>
            </div>
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 h-16 rounded border object-cover" />}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold">Mensagem</Label>
          <Select
            value={mensagemTemplate}
            onValueChange={(v) => {
              setMensagemTemplate(v);
              if (v === "__custom") setBody("");
              else {
                const tpl = MENSAGEM_TEMPLATES.find((t) => t.value === v);
                if (tpl) setBody(tpl.value);
              }
            }}
          >
            <SelectTrigger className="mt-1 h-11 text-base">
              <SelectValue placeholder="Escolher template ou personalizar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__custom">✏️ Personalizado</SelectItem>
              {MENSAGEM_TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="mt-2 text-base"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={240}
            placeholder={mensagemTemplate === "__custom" ? "Digite a mensagem…" : "Edite o template se quiser"}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Canal de envio</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(
              [
                { v: "app", label: "App", desc: "Push Exclusivo" },
              ] as { v: Channel; label: string; desc: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setChannel(opt.v)}
                className={`rounded-lg border p-3 text-center transition ${
                  channel === opt.v
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <label className="mt-3 flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 transition-colors">
          <input
            type="checkbox"
            checked={personalize}
            onChange={(e) => setPersonalize(e.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <div className="text-xs">
            <div className="font-semibold text-foreground">Personalizar com o nome do usuário</div>
            <div className="text-muted-foreground mt-0.5">
              Prefixa o primeiro nome no título (ex.: “João, {title.toLowerCase().slice(0, 24) || "novidade…”"}”).
              Também substitui <code className="text-[10px]">{"{primeiro_nome}"}</code> quando presente.
            </div>
          </div>
        </label>

        <div>
          <Label>Destino ao tocar (opcional)</Label>
          <Select
            value={url === "" ? "__none" : DESTINOS.some((g) => g.items.some((i) => i.path === url)) ? url : "__custom"}
            onValueChange={(v) => {
              if (v === "__none") setUrl("");
              else if (v === "__custom") setUrl("https://");
              else setUrl(v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tela" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="__none">Nenhum (só notificação)</SelectItem>
              {DESTINOS.map((g) => (
                <SelectGroup key={g.group}>
                  <SelectLabel>{g.group}</SelectLabel>
                  {g.items.map((i) => (
                    <SelectItem key={i.path} value={i.path}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectItem value="__custom">URL personalizada…</SelectItem>
            </SelectContent>
          </Select>
          {url && !DESTINOS.some((g) => g.items.some((i) => i.path === url)) && (
            <Input
              className="mt-2"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/rota ou https://..."
            />
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-semibold text-sm">Segmentação</div>
        <div>
          <Label className="text-xs text-muted-foreground">Plataformas</Label>
          <div className="flex gap-3 mt-2">
            {(["android", "ios", "web"] as Platform[]).map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <Checkbox checked={platforms.includes(p)} onCheckedChange={() => togglePlatform(p)} />
                {PLATFORM_LABEL[p]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Assinatura</Label>
          <RadioGroup
            value={premium}
            onValueChange={(v) => setPremium(v as PremiumFilter)}
            className="flex gap-4 mt-2"
          >
            {(["all", "premium", "free"] as PremiumFilter[]).map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm capitalize">
                <RadioGroupItem value={v} />
                {v === "all" ? "Todos" : v}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Emails específicos (opcional)</Label>
          <Textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={2}
            placeholder="email1@x.com, email2@x.com"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-semibold text-sm">Quando enviar</div>
        <RadioGroup
          value={sendMode}
          onValueChange={(v) => setSendMode(v as SendMode)}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="now" />
            Agora
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="scheduled" />
            Agendar
          </label>
        </RadioGroup>
        {sendMode === "scheduled" && (
          <div className="space-y-3">
            <div>
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Recorrência</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem recorrência</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recurrence === "weekly" && (
              <div>
                <Label>Dia da semana</Label>
                <Select value={weekday} onValueChange={setWeekday}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </Card>

      <Button onClick={handleSubmit} disabled={sending} className="w-full" size="lg">
        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        {sendMode === "now" ? "Enviar agora" : "Agendar campanha"}
      </Button>
    </div>
  );
}
