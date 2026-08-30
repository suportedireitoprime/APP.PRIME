import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle, Bot, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';

interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

export default function AdminResumoLivroAudioEditar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [generatingChaptersId, setGeneratingChaptersId] = useState<number | string | null>(null);
  const [transcribingId, setTranscribingId] = useState<number | string | null>(null);
  const [selectedBook, setSelectedBook] = useState<LivroComColecao | null>(null);

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setLoading(true);
    try {
      const colecoesVisiveis = COLECOES.filter((c) => (c.modo as any) !== 'escondido');
      const promessas = colecoesVisiveis.map(async (col) => {
        const { data, error } = await supabase.from(col.table as any).select(col.select);
        if (error) {
          console.error(`Erro ao carregar ${col.table}:`, error);
          return [];
        }
        return (data || []).map((row) => ({
          colecao: col,
          livro: normalizeLivro(row, col),
        }));
      });

      const resultados = await Promise.all(promessas);
      const todosLivros = resultados.flat();
      setLivros(todosLivros);
    } catch (err) {
      toast.error('Erro ao carregar a biblioteca');
    } finally {
      setLoading(false);
    }
  }

  const livrosAgrupados = useMemo(() => {
    const q = busca.toLowerCase();
    const filtrados = q
      ? livros.filter((item) => {
          const l = item.livro;
          return (
            l.titulo.toLowerCase().includes(q) ||
            (l.autor && l.autor.toLowerCase().includes(q)) ||
            (l.area && l.area.toLowerCase().includes(q))
          );
        })
      : livros;

    const grupos: Record<string, LivroComColecao[]> = {};
    for (const item of filtrados) {
      const categoria = (item.colecao as any).titulo || item.colecao.modo || 'Outros';
      if (!grupos[categoria]) grupos[categoria] = [];
      grupos[categoria].push(item);
    }
    return grupos;
  }, [livros, busca]);

  async function handleUploadAudio(item: LivroComColecao, file: File) {
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido.');
      return;
    }

    setUploadingId(item.livro.id);
    const toastId = toast.loading(`Enviando áudio para ${item.livro.titulo}...`);

    try {
      // 1. Upload to Supabase Storage (RAW folder)
      const fileExt = file.name.split('.').pop();
      const rawFileName = `raw-uploads/${item.colecao.table}-${item.livro.id}-${Date.now()}.${fileExt}`;
      const finalFilePath = `resumos-livros/${item.colecao.table}-${item.livro.id}-${Date.now()}.mp3`;

      const { error: uploadError } = await supabase.storage
        .from('audios') // Usando um bucket público existente
        .upload(rawFileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Get Public URL for RAW file
      const { data: publicData } = supabase.storage.from('audios').getPublicUrl(rawFileName);
      const rawUrl = publicData.publicUrl;

      // 3. Trigger Edge Function (No intro for regular book audios unless specified, here we'll pass none)
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('processar-audio', {
        body: {
          raw_audio_url: rawUrl,
          record_id: item.livro.id,
          table_name: item.colecao.table,
          bucket_name: 'audios',
          final_file_path: finalFilePath,
          intro_url: "none"
        }
      });

      if (edgeError) {
        let msg = edgeError.message;
        try {
          if (edgeError.context && typeof edgeError.context.json === 'function') {
            const ctx = await edgeError.context.json();
            if (ctx.error) msg = ctx.error;
          }
        } catch (_) {}
        throw new Error(msg || "Falha ao iniciar processamento na nuvem");
      }

      toast.success('Áudio enviado para nuvem! A compressão deve terminar em até 1 minuto.', { id: toastId, duration: 10000 });
      
      // Update local state is skipped since it will update asynchronously via backend
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao enviar áudio.', { id: toastId });
    } finally {
      setUploadingId(null);
    }
  }

  async function handleGenerateChapters(item: LivroComColecao) {
    setGeneratingChaptersId(item.livro.id);
    const toastId = toast.loading(`Gerando sumários com IA para ${item.livro.titulo}...`);

    try {
      const texto = item.livro.analiseDetalhada || item.livro.sobre;
      if (!texto || texto.length < 50) {
        throw new Error('Texto muito curto para gerar sumários.');
      }

      const systemPrompt = `Você é um assistente que divide textos narrados em capítulos. 
O texto abaixo possui ${texto.length} caracteres.
Divida o texto em 3 a 6 capítulos, dependendo do tamanho.
Retorne ESTRITAMENTE um JSON no formato de array, onde cada objeto tem:
- "titulo": nome do capítulo (seja conciso)
- "percentage": um número decimal entre 0 e 1, indicando em que proporção do texto o capítulo começa (o primeiro deve ser 0).

Texto:
${texto}

NÃO retorne blocos de código (como \`\`\`json), apenas o texto JSON puro para ser parseado diretamente.`;

      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: { mode: 'chat', prompt: systemPrompt }
      });

      if (error) throw error;
      
      let resText = data?.text || data?.response || data;
      if (typeof resText === 'object') {
        resText = JSON.stringify(resText);
      }
      
      resText = resText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(resText);
      if (!Array.isArray(parsed)) throw new Error('A resposta da IA não é um array válido.');
      
      let cur = item.livro.curiosidades;
      let curiosidadesArray = Array.isArray(cur) ? cur : [];
      if (cur && typeof cur === 'object' && !Array.isArray(cur) && Array.isArray((cur as any).curiosidades)) {
        curiosidadesArray = (cur as any).curiosidades;
      }
      
      const curiosidadesPayload = {
        curiosidades: curiosidadesArray,
        sumarioAudio: parsed
      };

      const { error: updateError } = await supabase
        .from(item.colecao.table as any)
        .update({ curiosidades: curiosidadesPayload })
        .eq('id', item.livro.id);

      if (updateError) throw updateError;

      const updatedBook = {
        ...item,
        livro: { ...item.livro, sumarioAudio: parsed }
      };

      const novos = livros.map((l) => (l.livro.id === item.livro.id ? updatedBook : l));
      setLivros(novos);
      setSelectedBook(updatedBook);

      toast.success('Sumários gerados e salvos com sucesso!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao gerar sumários.', { id: toastId });
    } finally {
      setGeneratingChaptersId(null);
    }
  }

  async function handleTranscribeAudio(item: LivroComColecao) {
    if (!item.livro.audioResumoUrl) return;

    setTranscribingId(item.livro.id);
    const toastId = toast.loading(`Transcrevendo áudio de ${item.livro.titulo}... (Isso pode levar alguns minutos)`);

    try {
      const { data, error } = await supabase.functions.invoke('transcrever-audio', {
        body: { fileUrl: item.livro.audioResumoUrl, language: 'pt' }
      });

      if (error) throw error;
      
      const transcriptionText = data?.text || data;
      if (!transcriptionText) throw new Error("Transcrição retornou vazia");

      // Atualiza banco
      let cur = item.livro.curiosidades;
      let curiosidadesArray = Array.isArray(cur) ? cur : [];
      let sumarioAudioArray = [];
      if (cur && typeof cur === 'object' && !Array.isArray(cur)) {
        if (Array.isArray((cur as any).curiosidades)) curiosidadesArray = (cur as any).curiosidades;
        if (Array.isArray((cur as any).sumarioAudio)) sumarioAudioArray = (cur as any).sumarioAudio;
      }
      
      const curiosidadesPayload = {
        curiosidades: curiosidadesArray,
        sumarioAudio: sumarioAudioArray,
        transcricaoAudio: transcriptionText
      };

      const { error: updateError } = await supabase
        .from(item.colecao.table as any)
        .update({ curiosidades: curiosidadesPayload })
        .eq('id', item.livro.id);

      if (updateError) throw updateError;

      const updatedBook = {
        ...item,
        livro: { ...item.livro, transcricaoAudio: transcriptionText }
      };

      const novos = livros.map((l) => (l.livro.id === item.livro.id ? updatedBook : l));
      setLivros(novos);
      setSelectedBook(updatedBook);

      toast.success('Áudio transcrito e salvo com sucesso!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao transcrever áudio.', { id: toastId });
    } finally {
      setTranscribingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Resumos de Livros"
        subtitle="Adicione áudios de resumo às obras da biblioteca"
        onBack={() => navigate(-1)}
      />

      <div className="px-4 pt-6 max-w-4xl mx-auto space-y-6">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, autor ou área..."
            className="pl-11 h-12 rounded-xl border-border bg-card shadow-sm text-base"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Carregando acervo da biblioteca...</p>
          </div>
        ) : Object.keys(livrosAgrupados).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <Search className="w-10 h-10 mb-4 opacity-50" />
            <p>Nenhum livro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(livrosAgrupados).map(([categoria, itens]) => (
              <div key={categoria} className="space-y-4">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
                  {categoria} ({itens.length})
                </h2>
                <div className="grid gap-3">
                  {itens.map((item) => (
                    <button
                      type="button"
                      key={`${item.colecao.table}-${item.livro.id}`}
                      onClick={() => setSelectedBook(item)}
                      className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm text-left active:scale-[0.98] transition-transform w-full"
                    >
                      {/* Capa */}
                      <div className="w-14 h-20 rounded bg-muted overflow-hidden shrink-0">
                        {item.livro.capa ? (
                          <img src={item.livro.capa} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Sem Capa
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-semibold text-foreground truncate">{item.livro.titulo}</h3>
                        {item.livro.autor && (
                          <p className="text-sm text-muted-foreground truncate">{item.livro.autor}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {item.livro.audioResumoUrl ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Possui áudio
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Sem áudio
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet de Upload */}
      <Sheet open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto">
          {selectedBook && (
            <div className="space-y-6 pt-2 pb-6 max-w-lg mx-auto">
              <SheetHeader className="text-left space-y-0">
                <SheetTitle className="text-2xl font-bold">Resumo em Áudio</SheetTitle>
                <p className="text-muted-foreground text-sm">
                  Gerencie o áudio para o livro selecionado.
                </p>
              </SheetHeader>

              <div className="flex gap-5 bg-muted/30 p-4 rounded-2xl border border-border">
                <div className="w-20 h-28 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                  {selectedBook.livro.capa ? (
                    <img src={selectedBook.livro.capa} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2 leading-tight">
                      Sem Capa
                    </div>
                  )}
                </div>
                <div className="flex-1 py-1 flex flex-col justify-center">
                  <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
                    {selectedBook.livro.titulo}
                  </h3>
                  {selectedBook.livro.autor && (
                    <p className="text-muted-foreground mt-1 text-sm">{selectedBook.livro.autor}</p>
                  )}
                  <div className="mt-3 inline-flex">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {(selectedBook.colecao as any).titulo || selectedBook.colecao.modo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status Atual</h4>
                {selectedBook.livro.audioResumoUrl ? (
                  <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Áudio disponível</p>
                      <p className="text-sm opacity-90 break-all mt-1">{selectedBook.livro.audioResumoUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold">Nenhum áudio enviado ainda</p>
                  </div>
                )}
              </div>

              {selectedBook.livro.sumarioAudio && selectedBook.livro.sumarioAudio.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <List className="w-4 h-4" /> Sumários de Áudio
                  </h4>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    {selectedBook.livro.sumarioAudio.map((cap, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{cap.titulo}</span>
                        <span className="text-muted-foreground">{(cap.percentage * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    disabled={uploadingId === selectedBook.livro.id}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadAudio(selectedBook, e.target.files[0]);
                        e.target.value = ''; // Reset
                      }
                    }}
                  />
                  <Button
                    size="lg"
                    className="w-full text-base h-14 rounded-xl"
                    disabled={uploadingId === selectedBook.livro.id}
                  >
                    {uploadingId === selectedBook.livro.id ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5 mr-2" />
                    )}
                    {selectedBook.livro.audioResumoUrl ? 'Substituir Áudio Atual' : 'Selecionar e Enviar Áudio'}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Formatos suportados: MP3, M4A, WAV
                </p>

                {selectedBook.livro.audioResumoUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-base h-14 rounded-xl mt-4 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                      disabled={generatingChaptersId === selectedBook.livro.id}
                      onClick={() => handleGenerateChapters(selectedBook)}
                    >
                      {generatingChaptersId === selectedBook.livro.id ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Bot className="w-5 h-5 mr-2" />
                      )}
                      {selectedBook.livro.sumarioAudio ? 'Regerar Sumários com IA' : 'Dividir em Sumários com IA'}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-base h-14 rounded-xl mt-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                      disabled={transcribingId === selectedBook.livro.id}
                      onClick={() => handleTranscribeAudio(selectedBook)}
                    >
                      {transcribingId === selectedBook.livro.id ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Headphones className="w-5 h-5 mr-2" />
                      )}
                      {selectedBook.livro.transcricaoAudio ? 'Regerar Transcrição com IA' : 'Transcrever Áudio com IA'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
