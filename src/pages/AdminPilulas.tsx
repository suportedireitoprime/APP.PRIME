import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { compressAudioToMp3 } from '@/utils/audioCompressor';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle, Copy, Link, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { copiar } from '@/lib/nativo/copiar';

import { CustomAudioPlayer } from '@/components/vademecum/CustomAudioPlayer';

interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

export default function AdminPilulas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compressingId, setCompressingId] = useState<string | number | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [compressionSize, setCompressionSize] = useState<string>('');
  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [transcribingId, setTranscribingId] = useState<number | string | null>(null);
  const [selectedBook, setSelectedBook] = useState<LivroComColecao | null>(null);

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setLoading(true);
    try {
      const classicosCol = COLECOES.find((c) => c.id === 'classicos');
      if (!classicosCol) return;

      const { data, error } = await supabase.from(classicosCol.table as any).select(classicosCol.select).order('id');
      if (error) {
        console.error(`Erro ao carregar ${classicosCol.table}:`, error);
        return;
      }
      
      const todosLivros = (data || []).map((row) => ({
        colecao: classicosCol,
        livro: normalizeLivro(row, classicosCol),
      }));

      setLivros(todosLivros);
    } catch (err) {
      toast.error('Erro ao carregar a biblioteca de clássicos');
    } finally {
      setLoading(false);
    }
  }

  const livrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    if (!q) return livros;
    return livros.filter((item) => {
      const l = item.livro;
      return (
        l.titulo.toLowerCase().includes(q) ||
        (l.autor && l.autor.toLowerCase().includes(q))
      );
    });
  }, [livros, busca]);

  async function handleUploadAudio(item: LivroComColecao, file: File) {
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido.');
      return;
    }

    setUploadingId(item.livro.id);
    let toastId = toast.loading('Iniciando processamento do áudio...');

    try {
      // 1. Comprime o arquivo localmente
      toast.loading(`Comprimindo áudio (isso pode levar alguns minutos)... 0%`, { id: toastId });
      setCompressingId(item.livro.id);
      setCompressionProgress(0);
      setCompressionSize('');

      const compressedFile = await compressAudioToMp3(file, (progress, sizeLog) => {
        setCompressionProgress(progress);
        if (sizeLog) setCompressionSize(sizeLog);
        
        toast.loading(`Comprimindo áudio... ${Math.round(progress)}% ${sizeLog ? `(${sizeLog})` : ''}`, { id: toastId });
      });

      setCompressingId(null);
      toast.loading(`Fazendo upload do áudio comprimido...`, { id: toastId });

      // 2. Upload to Supabase Storage
      const fileExt = 'mp3';
      const fileName = `pilulas-classicos-${item.livro.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumos-livros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audios') 
        .upload(filePath, compressedFile, { upsert: true, contentType: compressedFile.type });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: publicData } = supabase.storage.from('audios').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // 4. Update Database
      const { error: dbError } = await supabase
        .from(item.colecao.table as any)
        .update({ audio_resumo_url: publicUrl })
        .eq('id', item.livro.id);

      if (dbError) throw dbError;

      toast.success('Pílula enviada e salva com sucesso!', { id: toastId });
      
      // Update local state
      const publicUrlString = publicUrl;
      setLivros((prev) =>
        prev.map((l) =>
          l.livro.id === item.livro.id
            ? { ...l, livro: { ...l.livro, audioResumoUrl: publicUrlString } }
            : l
        )
      );
      
      if (selectedBook && selectedBook.livro.id === item.livro.id) {
        setSelectedBook((prev) => prev ? { ...prev, livro: { ...prev.livro, audioResumoUrl: publicUrlString } } : null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar/enviar áudio', { id: toastId });
    } finally {
      setUploadingId(null);
      setCompressingId(null);
    }
  }

  async function handleTranscribeAudio(item: LivroComColecao) {
    if (!item.livro.audioResumoUrl) return;

    setTranscribingId(item.livro.id);
    const toastId = toast.loading(`Transcrevendo pílula de ${item.livro.titulo}... (Isso pode levar alguns minutos)`);

    try {
      const { data, error } = await supabase.functions.invoke('transcrever-audio', {
        body: { fileUrl: item.livro.audioResumoUrl, language: 'pt' }
      });

      if (error) {
        let msg = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const ctx = await error.context.json();
            if (ctx.error) msg = ctx.error;
          }
        } catch (_) {}
        throw new Error(msg);
      }

      if (!data?.text) {
        throw new Error("Transcrição retornou vazia");
      }

      const transcriptionText = data.text;
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

      setLivros((prev) => prev.map((l) => (l.livro.id === item.livro.id ? updatedBook : l)));
      setSelectedBook(updatedBook);

      toast.success('Pílula transcrita e salva com sucesso!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao transcrever pílula.', { id: toastId });
    } finally {
      setTranscribingId(null);
    }
  }

  const copyToClipboard = (text: string, successMsg: string) => {
    void copiar(text, successMsg);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Admin Pílulas"
        subtitle="Gerencie os áudios (Pílulas) da coleção Clássicos do Direito"
        onBack={() => navigate(-1)}
      />

      <div className="px-4 pt-6 max-w-4xl mx-auto space-y-6">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou autor..."
            className="pl-11 h-12 rounded-xl border-border bg-card shadow-sm text-base"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Carregando clássicos do direito...</p>
          </div>
        ) : livrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <Search className="w-10 h-10 mb-4 opacity-50" />
            <p>Nenhum livro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
              Clássicos do Direito ({livrosFiltrados.length})
            </h2>
            <div className="grid gap-3">
              {livrosFiltrados.map((item) => {
                const hasAudio = !!item.livro.audioResumoUrl;
                return (
                  <button
                    type="button"
                    key={item.livro.id}
                    onClick={() => setSelectedBook(item)}
                    className={`flex items-start gap-4 rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full ${
                      hasAudio 
                        ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                        : 'bg-card border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    {/* Capa */}
                    <div className="w-16 h-24 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                      {item.livro.capa ? (
                        <img src={item.livro.capa} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] text-center leading-tight p-1">
                          Sem Capa
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2 mb-1.5">
                        {item.livro.titulo}
                      </h3>
                      {item.livro.autor && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{item.livro.autor}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {hasAudio ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Pílula Concluída
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sheet de Upload */}
      <Sheet open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[95vh] overflow-y-auto">
          {selectedBook && (
            <div className="space-y-6 pt-2 pb-6 max-w-lg mx-auto">
              <SheetHeader className="text-left space-y-0">
                <SheetTitle className="text-2xl font-bold">Pílula em Áudio</SheetTitle>
                <p className="text-muted-foreground text-sm">
                  Gerencie o áudio da pílula para este clássico.
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
                <div className="flex-1 py-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
                    {selectedBook.livro.titulo}
                  </h3>
                  {selectedBook.livro.autor && (
                    <p className="text-muted-foreground mt-1 text-sm truncate">{selectedBook.livro.autor}</p>
                  )}
                </div>
              </div>

              {/* Botões de Cópia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => copyToClipboard(selectedBook.livro.titulo, 'Título copiado!')}
                >
                  <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Título</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => {
                    const linkPdf = selectedBook.livro.link || selectedBook.livro.download || '';
                    if (linkPdf) {
                      copyToClipboard(linkPdf, 'Link do Drive/PDF copiado!');
                    } else {
                      toast.error('Nenhum link encontrado para esta obra.');
                    }
                  }}
                >
                  <Link className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Link</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => {
                    const promptText = `Você deve explicar o livro todo capítulo por capítulo passando a importância para o estudante de direito ler, explicando o que o autor quis dizer, qual a obra... bem detalhado explicando os conceitos. Livro: ${selectedBook.livro.titulo} - ${selectedBook.livro.autor || 'Autor Desconhecido'}`;
                    copyToClipboard(promptText, 'Prompt copiado!');
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Prompt</span>
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status Atual</h4>
                {selectedBook.livro.audioResumoUrl ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 text-green-500">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <p className="font-bold">Pílula Concluída (OK!)</p>
                    </div>
                    <CustomAudioPlayer src={selectedBook.livro.audioResumoUrl} title="Ouvir Pílula" />
                  </div>
                ) : (
                  <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold">Nenhuma pílula enviada ainda</p>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3">
                {/* Instruções da Intro */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Headphones className="w-4 h-4" /> Instruções de Edição (Intro)
                  </h4>
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="text-sm text-foreground space-y-1.5">
                      <p><strong>1.</strong> Toque a música abaixo até os <strong>7 segundos</strong>.</p>
                      <p><strong>2.</strong> A partir do <strong>segundo 8</strong> a voz já entra e o volume da música começa a diminuir.</p>
                      <p><strong>3.</strong> Aos <strong>10 segundos</strong> a música para completamente.</p>
                    </div>
                    <div className="pt-2">
                      <CustomAudioPlayer src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/intros/secret-agent-groove.mp3" title="Música de Intro" />
                    </div>
                  </div>
                </div>

                <div className="relative mt-4">
                  <input
                    id={`audio-upload-${selectedBook.livro.id}`}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={uploadingId === selectedBook.livro.id || compressingId === selectedBook.livro.id}
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
                    onClick={() => {
                      const input = document.getElementById(`audio-upload-${selectedBook.livro.id}`);
                      if (input) input.click();
                    }}
                    disabled={uploadingId === selectedBook.livro.id || compressingId === selectedBook.livro.id}
                  >
                    {compressingId === selectedBook.livro.id ? (
                      `Comprimindo... ${Math.round(compressionProgress)}% ${compressionSize ? `(${compressionSize})` : ''}`
                    ) : uploadingId === selectedBook.livro.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 mr-2" />
                        {selectedBook.livro.audioResumoUrl ? 'Substituir Pílula Atual' : 'Selecionar e Enviar Pílula'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Formatos suportados: MP3, M4A, WAV
                </p>

                {selectedBook.livro.audioResumoUrl && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full text-base h-14 rounded-xl mt-4 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    disabled={transcribingId === selectedBook.livro.id}
                    onClick={() => handleTranscribeAudio(selectedBook)}
                  >
                    {transcribingId === selectedBook.livro.id ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Headphones className="w-5 h-5 mr-2" />
                    )}
                    {selectedBook.livro.transcricaoAudio ? 'Regerar Transcrição com IA' : 'Transcrever Pílula com IA'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
