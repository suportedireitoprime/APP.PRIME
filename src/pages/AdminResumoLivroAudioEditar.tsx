import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
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
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.colecao.table}-${item.livro.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumos-livros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audios') // Usando um bucket público existente
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

      toast.success('Áudio de resumo atualizado com sucesso!', { id: toastId });
      
      // Update local state
      const publicUrlString = publicUrl;
      setLivros((prev) =>
        prev.map((l) =>
          l.livro.id === item.livro.id && l.colecao.table === item.colecao.table
            ? { ...l, livro: { ...l.livro, audioResumoUrl: publicUrlString } }
            : l
        )
      );
      
      if (selectedBook && selectedBook.livro.id === item.livro.id && selectedBook.colecao.table === item.colecao.table) {
        setSelectedBook((prev) => prev ? { ...prev, livro: { ...prev.livro, audioResumoUrl: publicUrlString } } : null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao enviar áudio', { id: toastId });
    } finally {
      setUploadingId(null);
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
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
