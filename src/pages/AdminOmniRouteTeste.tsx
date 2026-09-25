import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Sparkles,
  Type,
  Mic,
  ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Volume2,
  Download,
  Eye,
  Settings,
  Cpu,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const STORAGE_KEYS = {
  BASE_URL: 'omniroute_test_base_url',
  API_KEY: 'omniroute_test_api_key',
  LAST_MODEL: 'omniroute_test_model',
};

const DEFAULT_BASE_URL = 'https://omniroute-production-fb57.up.railway.app/v1';
const DEFAULT_API_KEY = 'sk-b031bdec64ce3755-4e94d3-d0de5a82';

const POPULAR_TEXT_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-7-sonnet',
  'deepseek-chat',
];

const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy (Neutro)' },
  { id: 'echo', name: 'Echo (Masculino suave)' },
  { id: 'fable', name: 'Fable (Narrativo)' },
  { id: 'onyx', name: 'Onyx (Masculino grave)' },
  { id: 'nova', name: 'Nova (Feminino suave)' },
  { id: 'shimmer', name: 'Shimmer (Feminino claro)' },
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
  const [textModel, setTextModel] = useState(() => localStorage.getItem(STORAGE_KEYS.LAST_MODEL) || 'gemini-2.5-pro');
  const [textPrompt, setTextPrompt] = useState('Explique de forma concisa o princípio da dignidade da pessoa humana para um estudante de direito.');
  const [textSystem, setTextSystem] = useState('Você é um assistente jurídico experiente e didático do Vade Mecum Prime.');
  const [temperature, setTemperature] = useState(0.7);
  const [textLoading, setTextLoading] = useState(false);
  const [textResponse, setTextResponse] = useState<string | null>(null);
  const [textMeta, setTextMeta] = useState<{ durationMs: number; tokens?: { prompt: number; completion: number; total: number }; raw?: unknown } | null>(null);

  // Tab Áudio (TTS)
  const [audioText, setAudioText] = useState('Bem-vindo ao aplicativo Vade Mecum Prime. Aqui você estuda leis, jurisprudência e resumos de forma inteligente.');
  const [audioVoice, setAudioVoice] = useState('nova');
  const [audioModel, setAudioModel] = useState('tts-1');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMeta, setAudioMeta] = useState<{ durationMs: number; sizeBytes: number } | null>(null);

  // Tab Imagem (Geração & Visão)
  const [imageTab, setImageTab] = useState<'generate' | 'vision'>('generate');
  const [imagePrompt, setImagePrompt] = useState('Balança da justiça dourada reluzente sobre livro antigo de couro e martelo de juiz, estilo cinematográfico ultra realista, 8k');
  const [imageModel, setImageModel] = useState('dall-e-3');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ durationMs: number } | null>(null);

  // Visão
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('Descreva os elementos jurídicos e visuais presentes nesta imagem.');
  const [visionModel, setVisionModel] = useState('gemini-2.5-pro');
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResponse, setVisionResponse] = useState<string | null>(null);

  // Logs de requisições recentes
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: string; model: string; duration: number; status: number | string }>>([]);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Salvar conexões locais
  const saveConnection = (newUrl: string, newKey: string) => {
    const cleanUrl = newUrl.trim().replace(/\/+$/, '');
    setBaseUrl(cleanUrl);
    setApiKey(newKey.trim());
    localStorage.setItem(STORAGE_KEYS.BASE_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEYS.API_KEY, newKey.trim());
    toast.success('Configurações salvas localmente');
  };

  // Testar Conexão com OmniRoute
  const checkConnection = async () => {
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
        setTextModel(modelsList[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnStatus('error');
      setConnError(msg);
      toast.error(`Falha ao conectar no OmniRoute: ${msg}`);
    }
  };

  // Auto checar conexão no mount
  useEffect(() => {
    void checkConnection();
  }, []);

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

  // 1. Teste de Texto
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
        addLog('Texto', textModel, elapsed, res.status);
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
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
      toast.success(`Resposta recebida em ${elapsed}ms!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTextResponse(`❌ Erro na execução: ${msg}`);
      toast.error(`Erro: ${msg}`);
    } finally {
      setTextLoading(false);
    }
  };

  // 2. Teste de Áudio (TTS)
  const handleRunAudioTTS = async () => {
    if (!audioText.trim()) {
      toast.error('Digite um texto para sintetizar áudio');
      return;
    }

    setAudioLoading(true);
    setAudioUrl(null);
    setAudioMeta(null);
    const start = performance.now();

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: audioModel,
          input: audioText.trim(),
          voice: audioVoice,
        }),
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        addLog('Áudio TTS', audioModel, elapsed, res.status);
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioMeta({
        durationMs: elapsed,
        sizeBytes: blob.size,
      });

      addLog('Áudio TTS', audioModel, elapsed, 200);
      toast.success(`Áudio gerado com sucesso em ${elapsed}ms!`);

      // Auto play
      setTimeout(() => {
        if (audioPlayerRef.current) {
          void audioPlayerRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro na geração de áudio: ${msg}`);
    } finally {
      setAudioLoading(false);
    }
  };

  // 3. Teste de Imagem (Geração)
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
        addLog('Imagem Gerada', imageModel, elapsed, res.status);
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const generatedUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);

      if (!generatedUrl) {
        throw new Error('Nenhuma URL ou imagem base64 retornada pela API.');
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

  // 4. Teste de Visão (Análise de Imagem)
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
      setVisionResponse(`❌ Erro na análise visual: ${msg}`);
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
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      <PageHeader
        title={
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-semibold tracking-wide">Teste OmniRoute</span>
          </div>
        }
        subtitle="Testes integrados de Texto, Áudio e Imagem com auto-fallback"
        onBack={() => navigate('/admin-funcoes')}
        variant="dark"
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 space-y-6 pb-20">
        {/* Barra de Status e Conexão */}
        <Card className="bg-[#161616] border-white/10 text-white shadow-xl">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base sm:text-lg font-medium">Gateway OmniRoute</CardTitle>
                {connStatus === 'connected' && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Online ({availableModels.length} modelos)
                  </Badge>
                )}
                {connStatus === 'checking' && (
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Conectando...
                  </Badge>
                )}
                {connStatus === 'error' && (
                  <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 text-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    Offline / Erro
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="border-white/10 hover:bg-white/10 text-xs gap-1.5 h-8"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showConfig ? 'Ocultar Configurações' : 'Configurar Conexão'}
                  {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={checkConnection}
                  disabled={connStatus === 'checking'}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium text-xs gap-1.5 h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </Button>
              </div>
            </div>

            {connError && (
              <p className="text-xs text-rose-400 mt-2 bg-rose-950/40 p-2.5 rounded border border-rose-800/40 break-all">
                ⚠️ {connError}
              </p>
            )}
          </CardHeader>

          {showConfig && (
            <CardContent className="pt-0 px-4 sm:px-6 pb-4 border-t border-white/5 space-y-4 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium">Base URL (Endpoint)</label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://sua-url.up.railway.app/v1"
                    className="bg-black/50 border-white/10 text-xs font-mono"
                  />
                  <p className="text-[11px] text-white/40">Ex: URL pública gerada no Railway terminando em /v1</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium">Chave de API (OmniRoute API Key)</label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-black/50 border-white/10 text-xs font-mono"
                  />
                  <p className="text-[11px] text-white/40">Token gerado no menu API Keys do OmniRoute</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveConnection(baseUrl, apiKey)}
                  className="border-white/10 text-xs"
                >
                  Salvar Conexão
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Abas Principais: Texto, Áudio, Imagem */}
        <Tabs defaultValue="texto" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-[#161616] border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="texto"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
            >
              <Type className="w-4 h-4" />
              <span>Teste de Texto</span>
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Teste de Áudio</span>
            </TabsTrigger>
            <TabsTrigger
              value="imagem"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Teste de Imagem</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TEXTO */}
          <TabsContent value="texto" className="mt-4 space-y-4">
            <Card className="bg-[#141414] border-white/10 text-white">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Type className="w-4 h-4 text-sky-400" />
                      Geração de Texto (Chat Completions)
                    </CardTitle>
                    <CardDescription className="text-xs text-white/50">
                      Roteamento inteligente para Google Gemini Pro / Flash com fallback
                    </CardDescription>
                  </div>

                  {/* Seletor de Modelo */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Modelo:</span>
                    <select
                      value={textModel}
                      onChange={(e) => {
                        setTextModel(e.target.value);
                        localStorage.setItem(STORAGE_KEYS.LAST_MODEL, e.target.value);
                      }}
                      className="bg-black/60 border border-white/15 text-xs rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
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

              <CardContent className="space-y-4">
                {/* Prompts Rápidos */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-white/40 mr-1">Sugestões:</span>
                  {[
                    'Explicar HC para leigo',
                    'Resumo Art. 121 CP',
                    'Princípios Constitucionais',
                    'Diferença dolo e culpa',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTextPrompt(sug)}
                      className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-md text-white/70 hover:text-white transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Prompt do Sistema (Opcional) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Prompt de Sistema (Opcional):</label>
                  <Input
                    value={textSystem}
                    onChange={(e) => setTextSystem(e.target.value)}
                    placeholder="Instruções de sistema para a IA..."
                    className="bg-black/40 border-white/10 text-xs"
                  />
                </div>

                {/* Prompt Principal */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium">Prompt do Usuário:</label>
                  <Textarea
                    rows={4}
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Digite sua dúvida, caso ou instrução jurídica para testar o Gemini Pro..."
                    className="bg-black/50 border-white/10 text-sm leading-relaxed"
                  />
                </div>

                {/* Temperatura */}
                <div className="flex items-center gap-4 py-1">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Criatividade (Temperatura):</span>
                      <span className="font-mono text-amber-400">{temperature.toFixed(2)}</span>
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
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm px-5 h-11 shrink-0 gap-2"
                  >
                    {textLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {textLoading ? 'Processando...' : 'Executar Teste'}
                  </Button>
                </div>

                {/* Resposta de Texto */}
                {textResponse && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resposta do OmniRoute
                      </span>
                      <div className="flex items-center gap-3">
                        {textMeta && (
                          <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {textMeta.durationMs}ms
                            </span>
                            {textMeta.tokens && (
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {textMeta.tokens.total} tokens
                              </span>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(textResponse)}
                          className="h-7 text-xs text-white/60 hover:text-white px-2 gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </Button>
                      </div>
                    </div>

                    <div className="bg-black/60 p-4 rounded-xl border border-white/10 text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto select-text">
                      {textResponse}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ÁUDIO */}
          <TabsContent value="audio" className="mt-4 space-y-4">
            <Card className="bg-[#141414] border-white/10 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  Síntese de Voz (Text-to-Speech / Áudio)
                </CardTitle>
                <CardDescription className="text-xs text-white/50">
                  Gere arquivos de áudio narrados a partir de texto com vozes de estúdio
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70">Modelo de Áudio:</label>
                    <Input
                      value={audioModel}
                      onChange={(e) => setAudioModel(e.target.value)}
                      placeholder="tts-1 ou tts-1-hd"
                      className="bg-black/40 border-white/10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70">Voz:</label>
                    <select
                      value={audioVoice}
                      onChange={(e) => setAudioVoice(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 text-xs rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                    >
                      {TTS_VOICES.map((v) => (
                        <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium">Texto para Locução:</label>
                  <Textarea
                    rows={4}
                    value={audioText}
                    onChange={(e) => setAudioText(e.target.value)}
                    placeholder="Digite o texto que a IA deverá narrar..."
                    className="bg-black/50 border-white/10 text-sm leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleRunAudioTTS}
                    disabled={audioLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm px-6 h-10 gap-2"
                  >
                    {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    {audioLoading ? 'Sintetizando Áudio...' : 'Gerar Áudio (TTS)'}
                  </Button>
                </div>

                {/* Player de Áudio */}
                {audioUrl && (
                  <div className="mt-4 p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Áudio Gerado com Sucesso
                      </span>
                      {audioMeta && (
                        <span className="text-[11px] text-white/50 font-mono">
                          {audioMeta.durationMs}ms • {(audioMeta.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-11" />

                    <div className="flex justify-end">
                      <a
                        href={audioUrl}
                        download={`omniroute-audio-${Date.now()}.mp3`}
                        className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar MP3
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: IMAGEM (GERAÇÃO & VISÃO) */}
          <TabsContent value="imagem" className="mt-4 space-y-4">
            <Card className="bg-[#141414] border-white/10 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                      Testes de Imagem (Geração & Visão)
                    </CardTitle>
                    <CardDescription className="text-xs text-white/50">
                      Geração via prompts e análise visual multimodal com Gemini
                    </CardDescription>
                  </div>

                  <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageTab('generate')}
                      className={`px-3 py-1 rounded-md transition-colors ${imageTab === 'generate' ? 'bg-amber-500 text-black font-medium' : 'text-white/60 hover:text-white'}`}
                    >
                      Geração
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('vision')}
                      className={`px-3 py-1 rounded-md transition-colors ${imageTab === 'vision' ? 'bg-amber-500 text-black font-medium' : 'text-white/60 hover:text-white'}`}
                    >
                      Visão / Análise
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {imageTab === 'generate' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70">Modelo de Imagem:</label>
                        <Input
                          value={imageModel}
                          onChange={(e) => setImageModel(e.target.value)}
                          placeholder="dall-e-3, imagen-3.0 ou flux"
                          className="bg-black/40 border-white/10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70">Resolução:</label>
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 text-xs rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="1024x1024" className="bg-zinc-900 text-white">1024x1024 (Quadrado)</option>
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
                        className="bg-black/50 border-white/10 text-sm leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleRunImageGeneration}
                        disabled={imageLoading}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm px-6 h-10 gap-2"
                      >
                        {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {imageLoading ? 'Gerando Imagem...' : 'Gerar Imagem'}
                      </Button>
                    </div>

                    {/* Exibição da Imagem Gerada */}
                    {imageUrl && (
                      <div className="mt-4 p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Imagem Gerada
                          </span>
                          {imageMeta && (
                            <span className="text-[11px] text-white/50 font-mono">
                              {imageMeta.durationMs}ms
                            </span>
                          )}
                        </div>

                        <div className="relative group max-w-md mx-auto overflow-hidden rounded-lg border border-white/15 bg-black">
                          <img
                            src={imageUrl}
                            alt="Resultado do teste de imagem"
                            className="w-full h-auto object-cover max-h-[400px]"
                          />
                        </div>

                        <div className="flex justify-center gap-3">
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
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
                        <label className="text-xs text-white/70">Modelo de Visão:</label>
                        <select
                          value={visionModel}
                          onChange={(e) => setVisionModel(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 text-xs rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="gemini-2.5-pro" className="bg-zinc-900 text-white">gemini-2.5-pro (Recomendado)</option>
                          <option value="gemini-2.5-flash" className="bg-zinc-900 text-white">gemini-2.5-flash (Ultra Rápido)</option>
                          <option value="gpt-4o" className="bg-zinc-900 text-white">gpt-4o</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/70">Carregar Imagem para Análise:</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleVisionImageUpload}
                            className="block w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {visionImageBase64 && (
                      <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10">
                        <img
                          src={visionImageBase64}
                          alt="Preview da análise"
                          className="w-16 h-16 object-cover rounded border border-white/10"
                        />
                        <div className="text-xs text-white/70">
                          <span className="text-emerald-400 font-medium">✓ Imagem carregada</span>
                          <p className="text-[11px] text-white/40">Pronta para envio ao Gemini Pro</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 font-medium">Pergunta ou Instrução sobre a Imagem:</label>
                      <Input
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        placeholder="Ex: O que está escrito neste documento? Descreva a cena."
                        className="bg-black/50 border-white/10 text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleRunVisionAnalysis}
                        disabled={visionLoading || !visionImageBase64}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm px-6 h-10 gap-2"
                      >
                        {visionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        {visionLoading ? 'Analisando Imagem...' : 'Analisar com Gemini'}
                      </Button>
                    </div>

                    {visionResponse && (
                      <div className="mt-4 p-4 bg-black/60 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Análise do Gemini Pro
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(visionResponse)}
                            className="h-7 text-xs text-white/60 hover:text-white px-2 gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </Button>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/90">
                          {visionResponse}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Histórico de Requisições / Logs */}
        {logs.length > 0 && (
          <Card className="bg-[#141414] border-white/10 text-white">
            <CardHeader className="py-3 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                Histórico Recente de Execuções
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 pt-0">
              <div className="divide-y divide-white/5 text-xs font-mono">
                {logs.map((log) => (
                  <div key={log.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-[11px]">{log.time}</span>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-white/80 py-0">
                        {log.type}
                      </Badge>
                      <span className="text-white/60 text-xs truncate max-w-[150px] sm:max-w-[250px]">
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
