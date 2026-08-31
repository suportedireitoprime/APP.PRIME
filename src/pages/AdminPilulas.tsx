import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Headphones, Search, UploadCloud, CheckCircle2, AlertCircle, Copy, Link, ChevronRight, AlignLeft, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, type ColecaoConfig, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { copiar } from '@/lib/nativo/copiar';

import { CustomAudioPlayer } from '@/components/vademecum/CustomAudioPlayer';
import GrafoOverlay from '@/components/vademecum/GrafoOverlay';

interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

interface ArtigoCP {
  id: string;
  numero: string;
  audio_pilula_url: string | null;
  audio_transcricao?: string | null;
  audio_grafo?: any;
  lei_slug?: string;
  lei_nome?: string;
}

type SelectedItemType = 
  | { type: 'livro'; data: LivroComColecao }
  | { type: 'artigo'; data: ArtigoCP };

type ScreenState = 'menu' | 'classicos' | 'rapidas' | 'cp' | 'cf' | 'cc';

export default function AdminPilulas() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState<ScreenState>('menu');
  const [loading, setLoading] = useState(true);
  
  const [loadingCP, setLoadingCP] = useState(true);
  const [artigosCP, setArtigosCP] = useState<ArtigoCP[]>([]);
  
  const [loadingCF, setLoadingCF] = useState(true);
  const [artigosCF, setArtigosCF] = useState<ArtigoCP[]>([]);
  
  const [loadingCC, setLoadingCC] = useState(true);
  const [artigosCC, setArtigosCC] = useState<ArtigoCP[]>([]);
  
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [transcribingId, setTranscribingId] = useState<number | string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItemType | null>(null);
  const [grafoPreviewOpen, setGrafoPreviewOpen] = useState(false);

  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  
  useEffect(() => {
    carregarTudo();
    carregarLei('cp');
    carregarLei('cf');
    carregarLei('cc');
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

  async function carregarLei(slug: 'cp' | 'cf' | 'cc') {
    const setLoad = slug === 'cp' ? setLoadingCP : slug === 'cf' ? setLoadingCF : setLoadingCC;
    const setData = slug === 'cp' ? setArtigosCP : slug === 'cf' ? setArtigosCF : setArtigosCC;
    
    setLoad(true);
    try {
      const { data: leiData, error: leiError } = await supabase
        .from('vade_mecum_leis')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (leiError || !leiData) {
        console.error(`Erro ao buscar ID do ${slug}:`, leiError);
        return;
      }
      
      const { data, error } = await supabase
        .from('vade_mecum_artigos')
        .select('id, numero, audio_pilula_url, audio_transcricao, audio_grafo')
        .eq('lei_id', leiData.id)
        .ilike('texto', '%Art.%') 
        .order('ordem', { ascending: true });
        
      if (error) {
        console.error(`Erro ao carregar artigos do ${slug}:`, error);
        return;
      }
      
      const nomeMap = { cp: 'Código Penal', cf: 'Constituição Federal', cc: 'Código Civil' };
      const artigosComLei = (data || []).map(a => ({ ...a, lei_slug: slug, lei_nome: nomeMap[slug] }));
      
      setData(artigosComLei as any[]);
    } catch (err) {
      toast.error(`Erro ao carregar artigos de ${slug}`);
    } finally {
      setLoad(false);
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

  const artigosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    let lista: ArtigoCP[] = [];
    if (activeScreen === 'cp') lista = artigosCP;
    if (activeScreen === 'cf') lista = artigosCF;
    if (activeScreen === 'cc') lista = artigosCC;
    
    if (!q) return lista;
    return lista.filter(a => a.numero.toLowerCase().includes(q));
  }, [artigosCP, artigosCF, artigosCC, busca, activeScreen]);

  async function handleUploadAudio(item: SelectedItemType, file: File) {
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido.');
      return;
    }

    const itemId = item.type === 'livro' ? item.data.livro.id : item.data.id;
    const itemTitulo = item.type === 'livro' ? item.data.livro.titulo : item.data.numero;

    setUploadingId(itemId);
    const toastId = toast.loading(`Enviando áudio para ${itemTitulo}...`);

    try {
      const fileExt = file.name.split('.').pop();
      let rawFileName = `resumos-livros/pilulas-classicos-${itemId}-${Date.now()}.${fileExt}`;
      if (item.type === 'artigo') {
        const slug = item.data.lei_slug || 'cp';
        rawFileName = `resumos-livros/pilulas-${slug}-${itemId}-${Date.now()}.${fileExt}`;
      }

      const { error: uploadError } = await supabase.storage
        .from('audios') 
        .upload(rawFileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('audios').getPublicUrl(rawFileName);
      const rawUrl = publicData.publicUrl;

      let updatedItemForTranscription: SelectedItemType;

      if (item.type === 'livro') {
        const { error: dbError } = await supabase
          .from(item.data.colecao.table)
          .update({ audio_resumo_url: rawUrl })
          .eq('id', itemId);
        if (dbError) throw dbError;

        const updatedLivroComColecao = { 
          ...item.data, 
          livro: { ...item.data.livro, audioResumoUrl: rawUrl } 
        };

        setLivros((prev: any) => prev.map((p: any) => 
          p.livro.id === itemId ? updatedLivroComColecao : p
        ));
        updatedItemForTranscription = { type: 'livro', data: updatedLivroComColecao };
        setSelectedItem((prev) => (prev && prev.type === 'livro' && prev.data.livro.id === itemId) ? updatedItemForTranscription : prev);
      } else {
        const { error: dbError } = await supabase
          .from('vade_mecum_artigos')
          .update({ audio_pilula_url: rawUrl })
          .eq('id', itemId);
        if (dbError) throw dbError;

        const updatedArtigoCP = { 
          ...item.data, 
          audio_pilula_url: rawUrl 
        };

        const slug = item.data.lei_slug;
        if (slug === 'cp') setArtigosCP((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));
        if (slug === 'cf') setArtigosCF((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));
        if (slug === 'cc') setArtigosCC((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));

        updatedItemForTranscription = { type: 'artigo', data: updatedArtigoCP };
        setSelectedItem((prev) => (prev && prev.type === 'artigo' && prev.data.id === itemId) ? updatedItemForTranscription : prev);
      }

      toast.success('Áudio enviado com sucesso!', { id: toastId, duration: 4000 });
      
      // Auto-start transcription in background
      handleTranscribeAudio(updatedItemForTranscription).catch(console.error);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao enviar áudio', { id: toastId });
    } finally {
      setUploadingId(null);
    }
  }

  async function handleTranscribeAudio(item: SelectedItemType) {
    const isLivro = item.type === 'livro';
    const itemId = isLivro ? item.data.livro.id : item.data.id;
    const itemTitulo = isLivro ? item.data.livro.titulo : item.data.numero;
    const audioUrl = isLivro ? item.data.livro.audioResumoUrl : item.data.audio_pilula_url;

    if (!audioUrl) return;

    setTranscribingId(itemId);
    const toastId = toast.loading(`Transcrevendo pílula de ${itemTitulo}... (Isso pode levar alguns minutos)`);

    try {
      // 1. Obter a Transcrição via Whisper/Gemini
      const { data: transcData, error: transcError } = await supabase.functions.invoke('transcrever-audio', {
        body: { fileUrl: audioUrl, language: 'pt' }
      });

      if (transcError) {
        let msg = transcError.message;
        try {
          if (transcError.context && typeof transcError.context.json === 'function') {
            const ctx = await transcError.context.json();
            if (ctx.error) msg = ctx.error;
          }
        } catch (_) {}
        throw new Error(msg);
      }

      if (!transcData?.text) {
        throw new Error("Transcrição retornou vazia");
      }
      const transcriptionText = transcData.text;

      // Se for livro, apenas salva a transcrição
      if (isLivro) {
        let cur = item.data.livro.curiosidades;
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
          .from(item.data.colecao.table as any)
          .update({ curiosidades: curiosidadesPayload })
          .eq('id', itemId);

        if (updateError) throw updateError;

        const updatedBook = {
          ...item.data,
          livro: { ...item.data.livro, transcricaoAudio: transcriptionText }
        };

        setLivros((prev) => prev.map((l) => (l.livro.id === itemId ? updatedBook : l)));
        setSelectedItem((prev) => (prev && prev.type === 'livro' && prev.data.livro.id === itemId) ? { type: 'livro', data: updatedBook } : prev);

        toast.success('Pílula transcrita e salva com sucesso!', { id: toastId });
      } else {
        // 2. Se for artigo, gerar Grafo com base na transcrição
        toast.loading(`Gerando grafo de conexões para o artigo...`, { id: toastId });
        
        const { data: grafoData, error: grafoError } = await supabase.functions.invoke('grafo-conexoes-gerar', {
          body: {
            item_key: `vade_mecum_artigos::${item.data.numero}`,
            artigo_texto: transcriptionText,
            titulo: item.data.numero,
          },
        });

        if (grafoError) throw grafoError;
        
        // 3. Salvar no banco
        const { error: dbUpdateError } = await supabase
          .from('vade_mecum_artigos')
          .update({
            audio_transcricao: transcriptionText,
            audio_grafo: grafoData?.grafo || null
          })
          .eq('id', itemId);
          
        if (dbUpdateError) throw dbUpdateError;

        const updatedArtigo = {
          ...item.data,
          audio_transcricao: transcriptionText,
          audio_grafo: grafoData?.grafo || null
        };
        
        const slug = item.data.lei_slug;
        if (slug === 'cp') setArtigosCP((prev) => prev.map((a) => (a.id === itemId ? updatedArtigo : a)));
        if (slug === 'cf') setArtigosCF((prev) => prev.map((a) => (a.id === itemId ? updatedArtigo : a)));
        if (slug === 'cc') setArtigosCC((prev) => prev.map((a) => (a.id === itemId ? updatedArtigo : a)));
        
        setSelectedItem((prev) => (prev && prev.type === 'artigo' && prev.data.id === itemId) ? { type: 'artigo', data: updatedArtigo } : prev);

        toast.success('Pílula transcrita e grafo gerado com sucesso!', { id: toastId });
      }
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

  let title = "Admin Pílulas";
  let subtitle = "Gerencie os áudios (Pílulas) da coleção Clássicos do Direito";
  let onBack = () => navigate(-1);

  if (activeScreen === 'classicos') {
    title = "Clássicos do Direito";
    subtitle = `Gerencie as pílulas dos Clássicos (${livrosFiltrados.length})`;
    onBack = () => setActiveScreen('menu');
  } else if (activeScreen === 'rapidas') {
    title = "Pílulas Rápidas";
    subtitle = "Gerencie pílulas de leitura rápida";
    onBack = () => setActiveScreen('menu');
  } else if (['cp', 'cf', 'cc'].includes(activeScreen)) {
    const nomeMap = { cp: 'Código Penal', cf: 'Constituição Federal', cc: 'Código Civil' };
    title = nomeMap[activeScreen as 'cp'|'cf'|'cc'];
    subtitle = `Gerencie as pílulas de ${title} (${artigosFiltrados.length})`;
    onBack = () => setActiveScreen('rapidas');
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
      />

      <div className="px-4 pt-6 max-w-4xl mx-auto space-y-6">
        
        {/* Busca Global (sempre visível nas listas) */}
        {(activeScreen === 'menu' || activeScreen === 'classicos' || ['cp', 'cf', 'cc'].includes(activeScreen)) && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou número..."
              className="pl-11 h-12 rounded-xl border-border bg-card shadow-sm text-base"
            />
          </div>
        )}

        {/* Menu Principal */}
        {activeScreen === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveScreen('classicos')}
              className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
            >
              <span className="font-bold text-lg uppercase tracking-wider text-muted-foreground">
                Clássicos do Direito ({livrosFiltrados.length})
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setActiveScreen('rapidas')}
              className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
            >
              <span className="font-bold text-lg uppercase tracking-wider text-muted-foreground">
                Pílulas Rápidas
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Tela Pílulas Rápidas (Sub-menu) */}
        {activeScreen === 'rapidas' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveScreen('cp')}
              className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
            >
              <span className="font-bold text-lg uppercase tracking-wider text-foreground">
                Código Penal ({artigosCP.length})
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setActiveScreen('cf')}
              className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
            >
              <span className="font-bold text-lg uppercase tracking-wider text-foreground">
                Constituição Federal ({artigosCF.length})
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setActiveScreen('cc')}
              className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
            >
              <span className="font-bold text-lg uppercase tracking-wider text-foreground">
                Código Civil ({artigosCC.length})
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Tela Clássicos do Direito (Listagem) */}
        {activeScreen === 'classicos' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Carregando clássicos...</p>
              </div>
            ) : livrosFiltrados.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 border border-dashed rounded-xl bg-card">
                Nenhum clássico encontrado.
              </div>
            ) : (
              <div className="grid gap-3">
                {livrosFiltrados.map((item) => {
                  const hasAudio = !!item.livro.audioResumoUrl;
                  return (
                    <button
                      type="button"
                      key={item.livro.id}
                      onClick={() => setSelectedItem({ type: 'livro', data: item })}
                      className={`flex items-start gap-4 rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full ${
                        hasAudio 
                          ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                          : 'bg-card border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="w-16 h-24 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                        {item.livro.capa ? (
                          <img src={item.livro.capa} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] text-center leading-tight p-1">
                            Sem Capa
                          </div>
                        )}
                      </div>
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
            )}
          </div>
        )}

        {/* Tela Artigos (Listagem) */}
        {['cp', 'cf', 'cc'].includes(activeScreen) && (
          <div className="space-y-4">
            {(activeScreen === 'cp' ? loadingCP : activeScreen === 'cf' ? loadingCF : loadingCC) ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Carregando {title}...</p>
              </div>
            ) : artigosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-zinc-500 mb-2">Nenhum artigo encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {artigosFiltrados.map((artigo) => {
                  const hasAudio = !!artigo.audio_pilula_url;
                  return (
                    <button
                      type="button"
                      key={artigo.id}
                      onClick={() => setSelectedItem({ type: 'artigo', data: artigo })}
                      className={`flex items-center justify-between rounded-xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full ${
                        hasAudio 
                          ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                          : 'bg-card border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="font-bold text-base">{artigo.numero}</span>
                      {hasAudio ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Concluída
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pendente
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sheet de Upload */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[95vh] overflow-y-auto">
          {selectedItem && (
            <div className="space-y-6 pt-2 pb-6 max-w-lg mx-auto">
              <SheetHeader className="text-left space-y-0">
                <SheetTitle className="text-2xl font-bold">Pílula em Áudio</SheetTitle>
                <p className="text-muted-foreground text-sm">
                  {selectedItem.type === 'livro' 
                    ? 'Gerencie o áudio da pílula para este clássico.' 
                    : 'Gerencie o áudio da pílula para este artigo.'}
                </p>
              </SheetHeader>

              {/* Informações Visuais (Livro vs Artigo) */}
              {selectedItem.type === 'livro' ? (
                <div className="flex gap-5 bg-muted/30 p-4 rounded-2xl border border-border">
                  <div className="w-20 h-28 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                    {selectedItem.data.livro.capa ? (
                      <img src={selectedItem.data.livro.capa} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2 leading-tight">
                        Sem Capa
                      </div>
                    )}
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
                      {selectedItem.data.livro.titulo}
                    </h3>
                    {selectedItem.data.livro.autor && (
                      <p className="text-muted-foreground mt-1 text-sm truncate">{selectedItem.data.livro.autor}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-5 rounded-2xl border border-border text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-2xl leading-tight">
                    {selectedItem.data.numero}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm font-semibold">{selectedItem.data.lei_nome || 'Código Penal'}</p>
                </div>
              )}

              {/* Botões de Ação para Livros */}
              {selectedItem.type === 'livro' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center rounded-xl text-xs h-10 px-2"
                    onClick={() => copyToClipboard(selectedItem.data.livro.titulo, 'Título copiado!')}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Título</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center rounded-xl text-xs h-10 px-2"
                    onClick={() => {
                      const linkPdf = selectedItem.data.livro.link || selectedItem.data.livro.download || '';
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
                      const promptText = `Você deve explicar o livro todo capítulo por capítulo passando a importância para o estudante de direito ler, explicando o que o autor quis dizer, qual a obra... bem detalhado explicando os conceitos. Livro: ${selectedItem.data.livro.titulo} - ${selectedItem.data.livro.autor || 'Autor Desconhecido'}`;
                      copyToClipboard(promptText, 'Prompt copiado!');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Prompt</span>
                  </Button>
                </div>
              )}

              {/* Status do Áudio */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[13px] uppercase tracking-wider text-muted-foreground">Status Atual</h4>
                {(selectedItem.type === 'livro' ? selectedItem.data.livro.audioResumoUrl : selectedItem.data.audio_pilula_url) ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 text-green-500 shrink-0 mb-2 sm:mb-0">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="font-bold text-sm">Pílula Concluída (OK!)</p>
                    </div>
                    <div className="w-full flex-1">
                      <CustomAudioPlayer src={(selectedItem.type === 'livro' ? selectedItem.data.livro.audioResumoUrl : selectedItem.data.audio_pilula_url) as string} title="Ouvir Pílula" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold text-sm">Nenhuma pílula enviada ainda</p>
                  </div>
                )}
              </div>

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

              {/* Upload Section */}
              <div className="pt-2 space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    disabled={uploadingId === (selectedItem.type === 'livro' ? selectedItem.data.livro.id : selectedItem.data.id)}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadAudio(selectedItem, e.target.files[0]);
                        e.target.value = ''; // Reset
                      }
                    }}
                  />
                  <Button
                    size="lg"
                    className="w-full text-base h-14 rounded-xl"
                    disabled={uploadingId === (selectedItem.type === 'livro' ? selectedItem.data.livro.id : selectedItem.data.id)}
                  >
                    {uploadingId === (selectedItem.type === 'livro' ? selectedItem.data.livro.id : selectedItem.data.id) ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5 mr-2" />
                    )}
                    {(selectedItem.type === 'livro' ? selectedItem.data.livro.audioResumoUrl : selectedItem.data.audio_pilula_url) 
                      ? 'Substituir Pílula Atual' 
                      : 'Selecionar e Enviar Pílula'}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Formatos suportados: MP3, M4A, WAV
                </p>

                {/* Transcrição de Áudio apenas para Livros (por enquanto) */}
                {selectedItem.type === 'livro' && selectedItem.data.livro.audioResumoUrl && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full text-base h-14 rounded-xl mt-4 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    disabled={transcribingId === selectedItem.data.livro.id}
                    onClick={() => handleTranscribeAudio(selectedItem)}
                  >
                    {transcribingId === selectedItem.data.livro.id ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Headphones className="w-5 h-5 mr-2" />
                    )}
                    {selectedItem.data.livro.transcricaoAudio ? 'Regerar Transcrição com IA' : 'Transcrever Pílula com IA'}
                  </Button>
                )}

                {/* Transcrição e Grafo para Artigos do CP */}
                {selectedItem.type === 'artigo' && selectedItem.data.audio_pilula_url && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full text-base h-14 rounded-xl mt-4 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    disabled={transcribingId === selectedItem.data.id}
                    onClick={() => handleTranscribeAudio(selectedItem)}
                  >
                    {transcribingId === selectedItem.data.id ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Headphones className="w-5 h-5 mr-2" />
                    )}
                    {selectedItem.data.audio_grafo ? 'Regerar Transcrição e Grafo' : 'Transcrever Pílula e Gerar Grafo'}
                  </Button>
                )}
                
                {/* Visualização de Transcrição e Grafo */}
                {selectedItem.type === 'artigo' && selectedItem.data.audio_transcricao && (
                  <div className="pt-6 space-y-4">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-emerald-500" /> Transcrição Gerada
                    </h4>
                    <div className="p-4 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                      {selectedItem.data.audio_transcricao}
                    </div>
                    
                    {selectedItem.data.audio_grafo && (
                      <>
                        <div className="flex items-center justify-between mt-4">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Network className="w-4 h-4 text-emerald-500" /> Grafo de Conexões
                          </h4>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setGrafoPreviewOpen(true)}
                          >
                            Ver Grafo Interativo
                          </Button>
                        </div>
                        <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-48 overflow-y-auto overflow-x-auto custom-scrollbar">
                          {JSON.stringify(selectedItem.data.audio_grafo, null, 2)}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedItem.type === 'livro' && selectedItem.data.livro.transcricaoAudio && (
                  <div className="pt-6 space-y-4">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-emerald-500" /> Transcrição Gerada
                    </h4>
                    <div className="p-4 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                      {selectedItem.data.livro.transcricaoAudio}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Visualizador de Grafo Modal */}
      {selectedItem?.type === 'artigo' && (
        <GrafoOverlay
          open={grafoPreviewOpen}
          onClose={() => setGrafoPreviewOpen(false)}
          tabelaNome="vade_mecum_artigos"
          artigoNumero={selectedItem.data.numero}
          leiNome={selectedItem.data.lei_nome || "Código Penal"}
          preloadedGraphData={selectedItem.data.audio_grafo}
        />
      )}
    </div>
  );
}
