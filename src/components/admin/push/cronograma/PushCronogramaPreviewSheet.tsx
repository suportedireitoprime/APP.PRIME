import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Send, SmartphoneNfc } from "lucide-react";
import { CanalBadge } from "./CanalBadge";
import {
  padHora,
  PUSH_DEFAULT_COVERS,
  type EventoBase,
} from "./pushCronogramaConstants";

interface PushCronogramaPreviewSheetProps {
  detalhe: EventoBase | null;
  onClose: () => void;
  previewPlatform: "android" | "ios";
  setPreviewPlatform: (p: "android" | "ios") => void;
  selectedCover: string;
  setSelectedCover: (url: string) => void;
  testando: string | null;
  onTestarAdmin: (ev: EventoBase, coverUrl?: string) => void;
}

export function PushCronogramaPreviewSheet({
  detalhe,
  onClose,
  previewPlatform,
  setPreviewPlatform,
  selectedCover,
  setSelectedCover,
  testando,
  onTestarAdmin,
}: PushCronogramaPreviewSheetProps) {
  return (
    <Sheet open={!!detalhe} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border/80 bg-background/95 backdrop-blur-xl"
      >
        {detalhe && (
          <div className="max-w-2xl mx-auto space-y-5 pb-8">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{detalhe.emoji}</span> {detalhe.nome}
                </SheetTitle>
                <CanalBadge canal={detalhe.canal} />
              </div>
              <SheetDescription>
                Disparo agendado para as {padHora(detalhe.hora, detalhe.minuto)} BRT · {detalhe.regra}
              </SheetDescription>
            </SheetHeader>

            {/* Seletor de visualização Android vs iOS */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <SmartphoneNfc className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Prévia de Notificação Push:</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
                <Button
                  size="sm"
                  variant={previewPlatform === "android" ? "default" : "ghost"}
                  className="h-6 text-xs px-2 rounded-lg"
                  onClick={() => setPreviewPlatform("android")}
                >
                  Android
                </Button>
                <Button
                  size="sm"
                  variant={previewPlatform === "ios" ? "default" : "ghost"}
                  className="h-6 text-xs px-2 rounded-lg"
                  onClick={() => setPreviewPlatform("ios")}
                >
                  iOS (Apple)
                </Button>
              </div>
            </div>

            {/* SMARTPHONE REALISTA — NOTIFICAÇÃO EXPANDIDA COM CAPA */}
            <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-2xl relative mx-auto max-w-[380px]">
              {/* Mockup Android Notification */}
              {previewPlatform === "android" ? (
                <div className="bg-[#242424] rounded-2xl p-3.5 shadow-xl text-white space-y-2.5 border border-zinc-700/50">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <img
                        src="/icons/icon-72x72.png"
                        alt="App"
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/favicon.png";
                        }}
                      />
                      <span>Direito Prime</span>
                      <span>•</span>
                      <span>agora</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-zinc-600 text-zinc-300">
                      FCM
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-[13px] text-zinc-100 leading-tight">
                      {detalhe.titulo_exemplo}
                    </div>
                    <div className="text-[12px] text-zinc-300 leading-snug">
                      {detalhe.corpo_exemplo}
                    </div>
                  </div>

                  {/* Capa Anexada */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700/80 shadow-md">
                    <img src={selectedCover} alt="Capa Push" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : (
                /* Mockup iOS Notification */
                <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-3.5 shadow-xl text-white space-y-2 border border-zinc-700/40">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <img
                        src="/icons/icon-72x72.png"
                        alt="App"
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/favicon.png";
                        }}
                      />
                      <span>DIREITO PRIME</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">agora</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-bold text-[13px] text-zinc-100">{detalhe.titulo_exemplo}</div>
                    <div className="text-[12px] text-zinc-300 leading-snug">{detalhe.corpo_exemplo}</div>
                  </div>

                  {/* Capa Anexada iOS */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700/60 shadow-md mt-2">
                    <img src={selectedCover} alt="Capa Push" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            {/* SELEÇÃO DE CAPAS PARA O TESTE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Escolha a capa padrão para disparar neste teste:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PUSH_DEFAULT_COVERS.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setSelectedCover(cp.url)}
                    className={`p-1.5 rounded-xl border transition-all text-left ${
                      selectedCover === cp.url
                        ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                        : "bg-secondary/40 border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden border border-border/60">
                      <img src={cp.url} alt={cp.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] font-bold text-foreground mt-1 truncate">{cp.nome}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÃO DE DISPARO DE TESTE */}
            <div className="pt-2">
              <Button
                className="w-full h-12 text-sm font-bold rounded-xl shadow-lg"
                disabled={testando === detalhe.automation_key}
                onClick={() => onTestarAdmin(detalhe, selectedCover)}
              >
                {testando === detalhe.automation_key ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                Disparar Teste Imediato (Push + Capa Selecionada)
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                O teste será enviado aos aparelhos com token de administrador cadastrado no Supabase.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
