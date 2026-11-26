import { Bot, CheckCircle2, Clock, Copy, Layers, Loader2, Send, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import { ANTIGRAVITY_TEXT_MODELS, STORAGE_KEYS } from './omnirouteConfig';

type Props = {
  textModel: string;
  setTextModel: (v: string) => void;
  textPrompt: string;
  setTextPrompt: (v: string) => void;
  textSystem: string;
  setTextSystem: (v: string) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  textLoading: boolean;
  textResponse: string | null;
  textMeta: {
    durationMs: number;
    tokens?: { prompt: number; completion: number; total: number };
    raw?: unknown;
  } | null;
  handleRunTextTest: () => void;
  copyToClipboard: (text: string) => void;
};

const SUGESTOES = [
  'Explicar HC para leigo',
  'Resumo Art. 121 CP',
  'Princípios Constitucionais',
  'Diferença dolo e culpa',
  'Recurso Especial vs Extraordinário',
];

export function OmniRouteTextoTab({
  textModel,
  setTextModel,
  textPrompt,
  setTextPrompt,
  textSystem,
  setTextSystem,
  temperature,
  setTemperature,
  textLoading,
  textResponse,
  textMeta,
  handleRunTextTest,
  copyToClipboard,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="!font-sans text-base sm:text-lg font-semibold text-white tracking-normal normal-case flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <span>Geração de Texto e Raciocínio (Chat)</span>
              </h2>
              <p className="!font-sans text-xs text-white/50 mt-1 font-normal tracking-normal normal-case">
                Roteamento inteligente para Google Gemini / Antigravity com fallback automático
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-white/60">Modelo:</span>
              <select
                value={textModel}
                onChange={(e) => {
                  setTextModel(e.target.value);
                  localStorage.setItem(STORAGE_KEYS.LAST_MODEL, e.target.value);
                }}
                className="bg-transparent text-xs text-amber-400 font-mono focus:outline-none cursor-pointer"
              >
                {ANTIGRAVITY_TEXT_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11.5px] text-white/40 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sugestões:
            </span>
            {SUGESTOES.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setTextPrompt(sug)}
                className="text-xs bg-white/5 hover:bg-white/10 active:opacity-70 border border-white/10 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white transition-all"
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60 font-medium">Instrução de Sistema (Opcional):</label>
            <Input
              value={textSystem}
              onChange={(e) => setTextSystem(e.target.value)}
              placeholder="Instruções de sistema..."
              className="bg-black/50 border-white/10 text-xs h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-medium">Prompt do Usuário:</label>
            <Textarea
              rows={4}
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Digite sua dúvida, caso ou instrução jurídica para testar o modelo..."
              className="bg-black/50 border-white/10 text-sm leading-relaxed rounded-xl p-3.5 focus-visible:ring-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex-1 min-w-[200px] max-w-sm space-y-1.5">
              <div className="flex justify-between text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
                  Temperatura (Criatividade):
                </span>
                <span className="font-mono text-amber-400 font-semibold">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[temperature]}
                onValueChange={([val]) => setTemperature(val)}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleRunTextTest}
              disabled={textLoading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 shrink-0 gap-2 transition-all active:opacity-70"
            >
              {textLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {textLoading ? 'Gerando Resposta...' : 'Executar Teste'}
            </Button>
          </div>

          {textResponse && (
            <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Resposta do Modelo ({textModel})
                </span>
                <div className="flex items-center gap-3">
                  {textMeta && (
                    <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {textMeta.durationMs}ms
                      </span>
                      {textMeta.tokens && (
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          <Layers className="w-3.5 h-3.5 text-sky-400" />
                          {textMeta.tokens.total} tokens
                        </span>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(textResponse)}
                    className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 gap-1.5 rounded-xl"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="bg-[#0e0e10] p-4 sm:p-6 rounded-2xl border border-white/10 text-sm leading-relaxed text-zinc-100 max-h-[600px] overflow-y-auto select-text prose prose-invert max-w-none shadow-inner">
                <PremiumMarkdown>{textResponse}</PremiumMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
