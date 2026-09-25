import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import { toast } from 'sonner';
import {
  Sparkles,
  Type,
  ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Download,
  Eye,
  Settings,
  Cpu,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Bot
} from 'lucide-react';

const STORAGE_KEYS = {
  BASE_URL: 'omniroute_test_base_url',
  API_KEY: 'omniroute_test_api_key',
  LAST_MODEL: 'omniroute_test_model',
};

const DEFAULT_BASE_URL = 'https://omniroute-production-fb57.up.railway.app/v1';
const DEFAULT_API_KEY = 'sk-03fcfd719bf0cc25-19fbd7-028392e5';

const POPULAR_TEXT_MODELS = [
  'antigravity/gemini-3.7-flash-high',
  'antigravity/gemini-pro-agent',
  'antigravity/gemini-3.1-pro-low',
  'antigravity/claude-sonnet-4-6',
  'antigravity/claude-opus-4-6-thinking',
  'auto/best-coding',
  'auto/gemini',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-flash',
];

const POPULAR_IMAGE_MODELS = [
  'antigravity/gemini-3.1-flash-image',
  'auto/best-vision',
  'dall-e-3',
  'imagen-3.0-generate-002',
];

export default function AdminOmniRouteTeste() {
  const navigate = useNavigate();

  // Conexão
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.BASE_URL) || DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.API_KEY) || DEFAULT_API_KEY);
  const [connStatus, setConnStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [connError, setConnError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  // Tab Texto
  const [textModel, setTextModel] = useState(() => localStorage.getItem(STORAGE_KEYS.LAST_MODEL) || 'antigravity/gemini-3.7-flash-high');
  const [textPrompt, setTextPrompt] = useState('Explique de forma concisa e didática o princípio da dignidade da pessoa humana para um estudante de direito, destacando base constitucional e jurisprudência.');
  const [textSystem, setTextSystem] = useState('Você é um jurista e tutor de alta precisão do Vade Mecum Prime. Utilize formatação rica em Markdown (negritos, listas e títulos claros).');
  const [temperature, setTemperature] = useState(0.7);
  const [textLoading, setTextLoading] = useState(false);
  const [textResponse, setTextResponse] = useState<string | null>(null);
  const [textMeta, setTextMeta] = useState<{ durationMs: number; tokens?: { prompt: number; completion: number; total: number }; raw?: unknown } | null>(null);

  // Tab Imagem (Geração & Visão)
  const [imageTab, setImageTab] = useState<'generate' | 'vision'>('generate');
  const [imagePrompt, setImagePrompt] = useState('Balança da justiça dourada reluzente sobre pedestal de mármore e livros clássicos de direito, iluminação cinematográfica dramática, 8k ultra detalhado');
  const [imageModel, setImageModel] = useState('antigravity/gemini-3.1-flash-image');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ durationMs: number } | null>(null);

  // Visão
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('Descreva os elementos jurídicos e visuais presentes nesta imagem.');
  const [visionModel, setVisionModel] = useState('antigravity/gemini-3.7-flash-high');
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResponse, setVisionResponse] = useState<string | null>(null);

  // Histórico de requisições
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; model: string; duration: number; status: number | string }>>([]);

  const saveConnection = (newUrl: string, newKey: string) => {
    const cleanUrl = newUrl.trim().replace(/\/+$/, '');
    setBaseUrl(cleanUrl);
    setApiKey(newKey.trim());
    localStorage.setItem(STORAGE_KEYS.BASE_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEYS.API_KEY, newKey.trim());
    toast.success('Configurações salvas localmente');
  };

  const addLog = (type: string, model: string, duration: number, status: number | string) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        type,
        model,
        duration,
        status,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const checkConnection = useCallback(async () => {
    setConnStatus('checking');
    setConnError(null);
    const start = performance.now();

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const modelsList: string[] = Array.isArray(data?.data)
        ? data.data.map((m: { id: string }) => m.id).filter(Boolean)
        : [];

      setAvailableModels(modelsList);
      setConnStatus('connected');
      toast.success(`OmniRoute conectado com sucesso (${elapsed}ms)!`);

      if (modelsList.length > 0 && !modelsList.includes(textModel)) {
        const found = modelsList.find((m) => m === 'antigravity/gemini-3.7-flash-high') || modelsList[0];
        setTextModel(found);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnStatus('error');
      setConnError(msg);
      toast.error(`Falha ao conectar no OmniRoute: ${msg}`);
    }
  }, [baseUrl, apiKey, textModel]);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // 1. Executar Teste de Texto
  const handleRunTextTest = async () => {
    if (!textPrompt.trim()) {
      toast.error('Digite um prompt para testar');
      return;
    }

    setTextLoading(true);
    setTextResponse(null);
    setTextMeta(null);
    const start = performance.now();

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const messages: Array<{ role: string; content: string }> = [];
      if (textSystem.trim()) {
        messages.push({ role: 'system', content: textSystem.trim() });
      }
      messages.push({ role: 'user', content: textPrompt.trim() });

      const res = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: textModel,
          messages,
          temperature,
        }),
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let parsedMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedMsg = parsed?.error?.message || errorText;
        } catch {}
        addLog('Texto', textModel, elapsed, res.status);
        throw new Error(parsedMsg || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || 'Sem resposta de texto.';
      const usage = data?.usage;

      setTextResponse(content);
      setTextMeta({
        durationMs: elapsed,
        tokens: usage
          ? {
              prompt: usage.prompt_tokens || 0,
              completion: usage.completion_tokens || 0,
              total: usage.total_tokens || 0,
            }
          : undefined,
        raw: data,
      });

      addLog('Texto', textModel, elapsed, 200);
      toast.success(`Resposta gerada em ${elapsed}ms!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTextResponse(`❌ **Erro na execução:**\n\`\`\`\n${msg}\n\`\`\``);
      toast.error(`Erro: ${msg}`);
    } finally {
      setTextLoading(false);
    }
  };

  // 2. Executar Teste de Imagem (Geração)
  const handleRunImageGeneration = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Descreva a imagem que deseja gerar');
      return;
    }

    setImageLoading(true);
    setImageUrl(null);
    setImageMeta(null);
    const start = performance.now();

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: imagePrompt.trim(),
          n: 1,
          size: imageSize,
        }),
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let parsedMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedMsg = parsed?.error?.message || errorText;
        } catch {}
        addLog('Imagem Gerada', imageModel, elapsed, res.status);
        throw new Error(parsedMsg || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const generatedUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/jpeg;base64,${data.data[0].b64_json}` : null);

      if (!generatedUrl) {
        throw new Error('Nenhuma URL ou base64 retornada pela API.');
      }

      setImageUrl(generatedUrl);
      setImageMeta({ durationMs: elapsed });
      addLog('Imagem Gerada', imageModel, elapsed, 200);
      toast.success(`Imagem gerada em ${elapsed}ms!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao gerar imagem: ${msg}`);
    } finally {
      setImageLoading(false);
    }
  };

  // 3. Executar Análise de Visão
  const handleVisionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setVisionImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisionAnalysis = async () => {
    if (!visionImageBase64) {
      toast.error('Carregue uma imagem para analisar.');
      return;
    }
    if (!visionPrompt.trim()) {
      toast.error('Digite uma pergunta ou instrução sobre a imagem.');
      return;
    }

    setVisionLoading(true);
    setVisionResponse(null);
    const start = performance.now();

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt.trim() },
                { type: 'image_url', image_url: { url: visionImageBase64 } },
              ],
            },
          ],
        }),
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        addLog('Visão', visionModel, elapsed, res.status);
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || 'Sem análise gerada.';
      setVisionResponse(content);
      addLog('Visão', visionModel, elapsed, 200);
      toast.success(`Análise visual concluída em ${elapsed}ms!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVisionResponse(`❌ **Erro na análise visual:**\n\`\`\`\n${msg}\n\`\`\``);
      toast.error(`Erro: ${msg}`);
    } finally {
      setVisionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col antialiased">
      <PageHeader
        title={
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-semibold tracking-wide">Teste OmniRoute</span>
          </div>
        }
        subtitle="Gateway de Inteligência Artificial: Texto e Imagem com auto-fallback"
        onBack={() => navigate('/admin-funcoes')}
        variant="dark"
      />

      {/* Conteúdo Fluido - Margens amplas e responsivas sem aperto lateral */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 pb-24">
        {/* Barra de Status e Conexão */}
        <Card className="bg-[#141416] border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="py-3.5 px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-white">Gateway OmniRoute</CardTitle>
                    {connStatus === 'connected' && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-[11px] px-2 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Online ({availableModels.length} modelos)
                      </Badge>
                    )}
                    {connStatus === 'checking' && (
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] px-2 py-0.5">
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Conectando...
                      </Badge>
                    )}
                    {connStatus === 'error' && (
                      <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] px-2 py-0.5">
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                    {baseUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs gap-1.5 h-9 rounded-xl transition-all"
                >
                  <Settings className="w-3.5 h-3.5 text-white/70" />
                  {showConfig ? 'Ocultar' : 'Configurar'}
                  {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={checkConnection}
                  disabled={connStatus === 'checking'}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5 h-9 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </Button>
              </div>
            </div>

            {connError && (
              <div className="text-xs text-rose-400 mt-3 bg-rose-950/40 p-3 rounded-xl border border-rose-800/40 break-all flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{connError}</span>
              </div>
            )}
          </CardHeader>

          {showConfig && (
            <CardContent className="pt-0 px-4 sm:px-6 pb-4 border-t border-white/5 space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium">Base URL (Endpoint)</label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://sua-url.up.railway.app/v1"
                    className="bg-black/50 border-white/10 text-xs font-mono h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-white/40">URL pública gerada no Railway terminando em /v1</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium">Chave de API (OmniRoute API Key)</label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-black/50 border-white/10 text-xs font-mono h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-white/40">Token gerado no menu API Keys do OmniRoute</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveConnection(baseUrl, apiKey)}
                  className="border-white/15 bg-white/5 text-xs h-9 rounded-xl"
                >
                  Salvar Conexão
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 2 Abas Principais: Texto e Imagem */}
        <Tabs defaultValue="texto" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-[#141416] border border-white/10 p-1.5 rounded-2xl shadow-xl">
            <TabsTrigger
              value="texto"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-black text-white/80 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-md"
            >
              <Type className="w-4 h-4" />
              <span>Teste de Texto</span>
            </TabsTrigger>
            <TabsTrigger
              value="imagem"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-black text-white/80 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-md"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Teste de Imagem</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TESTE DE TEXTO */}
          <TabsContent value="texto" className="mt-4 space-y-4">
            <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-semibold text-white">
                      <Bot className="w-5 h-5 text-amber-400" />
                      Geração de Texto & Raciocínio (Chat Completions)
                    </CardTitle>
                    <CardDescription className="text-xs text-white/50 mt-0.5">
                      Roteamento inteligente para Google Gemini / Antigravity com fallback automático
                    </CardDescription>
                  </div>

                  {/* Seletor de Modelo */}
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
                      {availableModels.length > 0
                        ? availableModels.map((m) => (
                            <option key={m} value={m} className="bg-zinc-900 text-white">
                              {m}
                            </option>
                          ))
                        : POPULAR_TEXT_MODELS.map((m) => (
                            <option key={m} value={m} className="bg-zinc-900 text-white">
                              {m}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
                {/* Prompts Rápidos Sugeridos */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11.5px] text-white/40 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Sugestões:
                  </span>
                  {[
                    'Explicar HC para leigo',
                    'Resumo Art. 121 CP',
                    'Princípios Constitucionais',
                    'Diferença dolo e culpa',
                    'Recurso Especial vs Extraordinário',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTextPrompt(sug)}
                      className="text-xs bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Prompt do Sistema */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium">Instrução de Sistema (Opcional):</label>
                  <Input
                    value={textSystem}
                    onChange={(e) => setTextSystem(e.target.value)}
                    placeholder="Instruções de sistema..."
                    className="bg-black/50 border-white/10 text-xs h-10 rounded-xl"
                  />
                </div>

                {/* Prompt Principal */}
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

                {/* Slider de Temperatura & Botão de Executar */}
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
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 shrink-0 gap-2 transition-all active:scale-95"
                  >
                    {textLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {textLoading ? 'Gerando Resposta...' : 'Executar Teste'}
                  </Button>
                </div>

                {/* Exibição da Resposta com Markdown Lapidado */}
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

                    {/* Container Markdown Formatado */}
                    <div className="bg-[#0e0e10] p-4 sm:p-6 rounded-2xl border border-white/10 text-sm leading-relaxed text-zinc-100 max-h-[600px] overflow-y-auto select-text prose prose-invert max-w-none shadow-inner">
                      <PremiumMarkdown>{textResponse}</PremiumMarkdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TESTE DE IMAGEM */}
          <TabsContent value="imagem" className="mt-4 space-y-4">
            <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-semibold text-white">
                      <ImageIcon className="w-5 h-5 text-amber-400" />
                      Geração de Imagens & Visão Multimodal
                    </CardTitle>
                    <CardDescription className="text-xs text-white/50 mt-0.5">
                      Geração de arte com IA ou análise visual de documentos e fotos
                    </CardDescription>
                  </div>

                  <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageTab('generate')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all font-medium ${imageTab === 'generate' ? 'bg-amber-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                    >
                      Geração de Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('vision')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all font-medium ${imageTab === 'vision' ? 'bg-amber-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                    >
                      Análise / Visão
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
                {imageTab === 'generate' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70 font-medium">Modelo de Imagem:</label>
                        <select
                          value={imageModel}
                          onChange={(e) => setImageModel(e.target.value)}
                          className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-amber-400 font-mono focus:outline-none"
                        >
                          {POPULAR_IMAGE_MODELS.map((m) => (
                            <option key={m} value={m} className="bg-zinc-900 text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70 font-medium">Resolução:</label>
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-white focus:outline-none"
                        >
                          <option value="1024x1024" className="bg-zinc-900 text-white">1024x1024 (Quadrado - Padrão)</option>
                          <option value="1024x1792" className="bg-zinc-900 text-white">1024x1792 (Vertical / Story)</option>
                          <option value="1792x1024" className="bg-zinc-900 text-white">1792x1024 (Horizontal / Banner)</option>
                          <option value="512x512" className="bg-zinc-900 text-white">512x512 (Rápido)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 font-medium">Prompt de Imagem:</label>
                      <Textarea
                        rows={3}
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Descreva a ilustração jurídica que deseja criar..."
                        className="bg-black/50 border-white/10 text-sm leading-relaxed rounded-xl p-3.5"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={handleRunImageGeneration}
                        disabled={imageLoading}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:scale-95 transition-all"
                      >
                        {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {imageLoading ? 'Gerando Imagem...' : 'Gerar Imagem'}
                      </Button>
                    </div>

                    {/* Exibição da Imagem Gerada */}
                    {imageUrl && (
                      <div className="mt-5 p-4 sm:p-5 bg-black/60 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
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
                            className="inline-flex items-center gap-1.5 text-xs text-white font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/15 transition-all active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar Imagem
                          </a>
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/20 transition-all active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir em Nova Aba
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* SUBTAB: VISÃO / MULTIMODAL */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70 font-medium">Modelo de Visão:</label>
                        <select
                          value={visionModel}
                          onChange={(e) => setVisionModel(e.target.value)}
                          className="w-full bg-black/50 border border-white/15 text-xs rounded-xl px-3 py-2.5 text-amber-400 font-mono focus:outline-none"
                        >
                          <option value="antigravity/gemini-3.7-flash-high" className="bg-zinc-900 text-white">antigravity/gemini-3.7-flash-high (Recomendado)</option>
                          <option value="antigravity/gemini-pro-agent" className="bg-zinc-900 text-white">antigravity/gemini-pro-agent</option>
                          <option value="google/gemini-2.5-pro" className="bg-zinc-900 text-white">google/gemini-2.5-pro</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70 font-medium">Carregar Imagem para Análise:</label>
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
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Imagem carregada com sucesso
                          </span>
                          <p className="text-[11px] text-white/40 mt-0.5">Pronta para envio ao modelo de visão multimodal</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 font-medium">Pergunta ou Instrução sobre a Imagem:</label>
                      <Input
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        placeholder="Ex: O que está escrito neste documento? Descreva a cena."
                        className="bg-black/50 border-white/10 text-xs h-10 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={handleRunVisionAnalysis}
                        disabled={visionLoading || !visionImageBase64}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:scale-95 transition-all"
                      >
                        {visionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        {visionLoading ? 'Analisando Imagem...' : 'Analisar Imagem'}
                      </Button>
                    </div>

                    {visionResponse && (
                      <div className="mt-5 p-4 sm:p-6 bg-[#0e0e10] rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Análise Multimodal da IA
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(visionResponse)}
                            className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 gap-1.5 rounded-xl"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar
                          </Button>
                        </div>
                        <div className="text-sm leading-relaxed text-zinc-100 prose prose-invert max-w-none">
                          <PremiumMarkdown>{visionResponse}</PremiumMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Histórico Recente de Execuções */}
        {logs.length > 0 && (
          <Card className="bg-[#141416] border-white/10 text-white rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="py-3 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                Histórico Recente de Execuções
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 pt-0">
              <div className="divide-y divide-white/5 text-xs font-mono">
                {logs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-white/40 text-[11px]">{log.time}</span>
                      <Badge variant="outline" className="text-[10px] border-white/15 bg-white/5 text-white/90 py-0.5">
                        {log.type}
                      </Badge>
                      <span className="text-white/60 text-xs truncate max-w-[140px] sm:max-w-[280px]">
                        {log.model}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-white/40">{log.duration}ms</span>
                      <span
                        className={`text-xs font-semibold ${log.status === 200 ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
