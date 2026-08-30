import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle, Copy, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { Clipboard } from '@capacitor/clipboard';

interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

export default function AdminPilulas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
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
    const toastId = toast.loading(`Enviando áudio para ${item.livro.titulo}...`);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `pilulas-classicos-${item.livro.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumos-livros/${fileName}`; // Mantemos a mesma pasta de resumos para reaproveitar permissões

      const { error: uploadError } = await supabase.storage
        .from('audios') 
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicData } = supabase.storage.from('audios').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // 3. Update Database
      const { error: dbError } = await supabase
        .from(item.colecao.table as any)
        .update({ audio_resumo_url: publicUrl })
        .eq('id', item.livro.id);

      if (dbError) throw dbError;

      toast.success('Pílula (áudio) atualizada com sucesso!', { id: toastId });
      
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
      toast.error(err.message || 'Erro ao enviar áudio', { id: toastId });
    } finally {
      setUploadingId(null);
    }
  }

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await Clipboard.write({ string: text });
      toast.success(successMsg);
    } catch (err) {
      console.error('Erro ao copiar com Capacitor:', err);
      // Fallback
      try {
        await navigator.clipboard.writeText(text);
        toast.success(successMsg);
      } catch (e) {
        toast.error('Erro ao copiar');
      }
    }
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
              {livrosFiltrados.map((item) => (
                <button
                  type="button"
                  key={item.livro.id}
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
                          <CheckCircle2 className="w-3 h-3" /> Pílula Disponível
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Sem Pílula
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
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
                  <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold">Pílula disponível</p>
                      <p className="text-xs opacity-90 truncate mt-1">{selectedBook.livro.audioResumoUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold">Nenhuma pílula enviada ainda</p>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3">
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
                    {selectedBook.livro.audioResumoUrl ? 'Substituir Pílula Atual' : 'Selecionar e Enviar Pílula'}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Formatos suportados: MP3, M4A, WAV
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
