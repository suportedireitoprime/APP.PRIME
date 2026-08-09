import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';

interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

export default function AdminResumoLivroAudioEditar() {
  const [loading, setLoading] = useState(true);
  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setLoading(true);
    try {
      const colecoesVisiveis = COLECOES.filter((c) => c.modo !== 'escondido');
      const promessas = colecoesVisiveis.map(async (col) => {
        const { data, error } = await supabase.from(col.table).select(col.select);
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

  const livrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    if (!q) return livros;
    return livros.filter((item) => {
      const l = item.livro;
      return (
        l.titulo.toLowerCase().includes(q) ||
        (l.autor && l.autor.toLowerCase().includes(q)) ||
        (l.area && l.area.toLowerCase().includes(q))
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
      const fileName = `${item.colecao.table}-${item.livro.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumos-livros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('aulas-audio') // Usando um bucket público existente
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicData } = supabase.storage.from('aulas-audio').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // 3. Update Database
      const { error: dbError } = await supabase
        .from(item.colecao.table)
        .update({ audio_resumo_url: publicUrl })
        .eq('id', item.livro.id);

      if (dbError) throw dbError;

      toast.success('Áudio de resumo atualizado com sucesso!', { id: toastId });
      
      // Update local state
      setLivros((prev) =>
        prev.map((l) =>
          l.livro.id === item.livro.id && l.colecao.table === item.colecao.table
            ? { ...l, livro: { ...l.livro, audioResumoUrl: publicUrl } }
            : l
        )
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao enviar áudio', { id: toastId });
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Resumos de Livros" subtitle="Adicione áudios de resumo às obras da biblioteca" />

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
        ) : livrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <Search className="w-10 h-10 mb-4 opacity-50" />
            <p>Nenhum livro encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {livrosFiltrados.map((item) => (
              <div
                key={`${item.colecao.table}-${item.livro.id}`}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm"
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.livro.titulo}</h3>
                  {item.livro.autor && <p className="text-sm text-muted-foreground truncate">{item.livro.autor}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {item.colecao.titulo}
                    </span>
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

                {/* Ação */}
                <div className="shrink-0 relative">
                  <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={uploadingId === item.livro.id}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadAudio(item, e.target.files[0]);
                        e.target.value = ''; // Reset
                      }
                    }}
                  />
                  <Button
                    variant={item.livro.audioResumoUrl ? 'outline' : 'default'}
                    size="sm"
                    className="pointer-events-none"
                    disabled={uploadingId === item.livro.id}
                  >
                    {uploadingId === item.livro.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4 mr-2" />
                    )}
                    {item.livro.audioResumoUrl ? 'Substituir' : 'Enviar Áudio'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
