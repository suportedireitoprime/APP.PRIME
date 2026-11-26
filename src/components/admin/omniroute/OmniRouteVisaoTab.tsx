import type React from 'react';
import { CheckCircle2, Copy, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import { POPULAR_VISION_MODELS } from './omnirouteConfig';

type Props = {
  visionModel: string;
  setVisionModel: (v: string) => void;
  visionImageBase64: string | null;
  visionPrompt: string;
  setVisionPrompt: (v: string) => void;
  visionLoading: boolean;
  visionResponse: string | null;
  handleVisionImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRunVisionAnalysis: () => void;
  copyToClipboard: (text: string) => void;
};

export default function OmniRouteVisaoTab({
  visionModel,
  setVisionModel,
  visionImageBase64,
  visionPrompt,
  setVisionPrompt,
  visionLoading,
  visionResponse,
  handleVisionImageUpload,
  handleRunVisionAnalysis,
  copyToClipboard,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="!font-sans text-base sm:text-lg font-semibold text-white tracking-normal normal-case flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <span>Análise Visual & Multimodal (Visão / OCR)</span>
              </h2>
              <p className="!font-sans text-xs text-white/50 mt-1 font-normal tracking-normal normal-case">
                Envie uma foto ou documento para a IA analisar elementos, transcrever texto ou responder dúvidas
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium !font-sans">Modelo de Visão:</label>
              <select
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-amber-400 font-mono focus:outline-none cursor-pointer"
              >
                {POPULAR_VISION_MODELS.map((m) => (
                  <option key={m} value={m} className="bg-zinc-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium !font-sans">Carregar Imagem para Análise:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleVisionImageUpload}
                className="block w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
              />
            </div>
          </div>

          {visionImageBase64 && (
            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/10">
              <img
                src={visionImageBase64}
                alt="Preview da análise"
                className="w-16 h-16 object-cover rounded-lg border border-white/10"
              />
              <div className="text-xs text-white/70">
                <span className="text-emerald-400 font-medium flex items-center gap-1 !font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Imagem carregada com sucesso
                </span>
                <p className="text-[11px] text-white/40 mt-0.5 !font-sans">
                  Pronta para envio ao modelo de visão multimodal
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-medium !font-sans">
              Pergunta ou Instrução sobre a Imagem:
            </label>
            <Input
              value={visionPrompt}
              onChange={(e) => setVisionPrompt(e.target.value)}
              placeholder="Ex: O que está escrito neste documento? Descreva a cena."
              className="bg-black/50 border-white/10 text-xs h-10 rounded-xl !font-sans"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleRunVisionAnalysis}
              disabled={visionLoading || !visionImageBase64}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:opacity-70 transition-all !font-sans cursor-pointer"
            >
              {visionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {visionLoading ? 'Analisando Imagem...' : 'Analisar Imagem'}
            </Button>
          </div>

          {visionResponse && (
            <div className="mt-5 p-4 sm:p-6 bg-[#0e0e10] rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 !font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  Análise Multimodal da IA
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(visionResponse)}
                  className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 gap-1.5 rounded-xl !font-sans cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </Button>
              </div>
              <div className="text-sm leading-relaxed text-zinc-100 prose prose-invert max-w-none !font-sans">
                <PremiumMarkdown>{visionResponse}</PremiumMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
