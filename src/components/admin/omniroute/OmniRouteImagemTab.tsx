import { CheckCircle2, Clock, Download, ExternalLink, ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { POPULAR_IMAGE_MODELS } from './omnirouteConfig';

type Props = {
  imageModel: string;
  setImageModel: (v: string) => void;
  imageSize: string;
  setImageSize: (v: string) => void;
  imagePrompt: string;
  setImagePrompt: (v: string) => void;
  imageLoading: boolean;
  imageUrl: string | null;
  imageMeta: { durationMs: number } | null;
  handleRunImageGeneration: () => void;
};

export default function OmniRouteImagemTab({
  imageModel,
  setImageModel,
  imageSize,
  setImageSize,
  imagePrompt,
  setImagePrompt,
  imageLoading,
  imageUrl,
  imageMeta,
  handleRunImageGeneration,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="!font-sans text-base sm:text-lg font-semibold text-white tracking-normal normal-case flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Geração de Imagens (Texto para Imagem)</span>
              </h2>
              <p className="!font-sans text-xs text-white/50 mt-1 font-normal tracking-normal normal-case">
                Geração de ilustrações e arte com IA através do modelo Antigravity / Gemini
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium !font-sans">Modelo de Imagem:</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-amber-400 font-mono focus:outline-none cursor-pointer"
              >
                {POPULAR_IMAGE_MODELS.map((m) => (
                  <option key={m} value={m} className="bg-zinc-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium !font-sans">Resolução:</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-white focus:outline-none cursor-pointer"
              >
                <option value="1024x1024" className="bg-zinc-900 text-white">1024x1024 (Quadrado - Padrão)</option>
                <option value="1024x1792" className="bg-zinc-900 text-white">1024x1792 (Vertical / Story)</option>
                <option value="1792x1024" className="bg-zinc-900 text-white">1792x1024 (Horizontal / Banner)</option>
                <option value="512x512" className="bg-zinc-900 text-white">512x512 (Rápido)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-medium !font-sans">Prompt de Imagem:</label>
            <Textarea
              rows={3}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Descreva a ilustração jurídica que deseja criar..."
              className="bg-black/50 border-white/10 text-sm leading-relaxed rounded-xl p-3.5 focus-visible:ring-amber-500/50 !font-sans"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleRunImageGeneration}
              disabled={imageLoading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:opacity-70 transition-all !font-sans cursor-pointer"
            >
              {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {imageLoading ? 'Gerando Imagem...' : 'Gerar Imagem'}
            </Button>
          </div>

          {imageUrl && (
            <div className="mt-5 p-4 sm:p-5 bg-black/60 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 !font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  Imagem Gerada com Sucesso
                </span>
                {imageMeta && (
                  <span className="text-xs text-white/50 font-mono bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                    {imageMeta.durationMs}ms
                  </span>
                )}
              </div>

              <div className="relative group max-w-lg mx-auto overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl">
                <img
                  src={imageUrl}
                  alt="Resultado do teste de imagem"
                  className="w-full h-auto object-cover max-h-[500px] transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={imageUrl}
                  download={`omniroute-${Date.now()}.jpg`}
                  className="inline-flex items-center gap-1.5 text-xs text-white font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/15 transition-all active:opacity-70 !font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Imagem
                </a>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/20 transition-all active:opacity-70 !font-sans"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir em Nova Aba
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
