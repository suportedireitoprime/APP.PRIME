import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLECOES, normalizeLivro } from '@/lib/bibliotecaColecoes';

import {
  LivroComColecao,
  ArtigoCP,
  Ministro,
  SelectedItemType,
  ScreenState,
  LEI_NOMES_MAP,
  PilulasMenuScreen,
  PilulasRapidasSubmenu,
  PilulasClassicosList,
  PilulasMinistrosList,
  PilulasArtigosList,
  PilulaUploadSheet,
} from '@/components/admin/pilulas/chunks';

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

  const [loadingCPP, setLoadingCPP] = useState(true);
  const [artigosCPP, setArtigosCPP] = useState<ArtigoCP[]>([]);

  const [loadingCLT, setLoadingCLT] = useState(true);
  const [artigosCLT, setArtigosCLT] = useState<ArtigoCP[]>([]);
  
  const [loadingMinistros, setLoadingMinistros] = useState(true);
  const [ministros, setMinistros] = useState<Ministro[]>([]);
  
  const [busca, setBusca] = useState('');
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [transcribingId, setTranscribingId] = useState<number | string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItemType | null>(null);
  const [livros, setLivros] = useState<LivroComColecao[]>([]);
  
  useEffect(() => {
    carregarTudo();
    carregarLei('cp');
    carregarLei('cf');
    carregarLei('cc');
    carregarLei('cpp');
    carregarLei('clt');
    carregarMinistros();
  }, []);

  async function carregarMinistros() {
    setLoadingMinistros(true);
    try {
      const { data, error } = await supabase
        .from('stf_ministros')
        .select('id, nome, nome_completo, foto_url, diversos, status')
        .eq('status', 'vigente')
        .order('nome');
      if (error) throw error;
      setMinistros(data || []);
    } catch (err) {
      toast.error('Erro ao carregar ministros');
    } finally {
      setLoadingMinistros(false);
    }
  }

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

  async function carregarLei(slug: 'cp' | 'cf' | 'cc' | 'cpp' | 'clt') {
    const setLoad = slug === 'cp' ? setLoadingCP : slug === 'cf' ? setLoadingCF : slug === 'cc' ? setLoadingCC : slug === 'cpp' ? setLoadingCPP : setLoadingCLT;
    const setData = slug === 'cp' ? setArtigosCP : slug === 'cf' ? setArtigosCF : slug === 'cc' ? setArtigosCC : slug === 'cpp' ? setArtigosCPP : setArtigosCLT;
    
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
      
      const artigosComLei = (data || []).map(a => ({ ...a, lei_slug: slug, lei_nome: LEI_NOMES_MAP[slug] }));
      
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

  const ministrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    if (!q) return ministros;
    return ministros.filter(m => m.nome.toLowerCase().includes(q) || (m.nome_completo && m.nome_completo.toLowerCase().includes(q)));
  }, [ministros, busca]);

  const artigosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    let lista: ArtigoCP[] = [];
    if (activeScreen === 'cp') lista = artigosCP;
    if (activeScreen === 'cf') lista = artigosCF;
    if (activeScreen === 'cc') lista = artigosCC;
    if (activeScreen === 'cpp') lista = artigosCPP;
    if (activeScreen === 'clt') lista = artigosCLT;
    
    if (!q) return lista;
    return lista.filter(a => a.numero.toLowerCase().includes(q));
  }, [artigosCP, artigosCF, artigosCC, artigosCPP, artigosCLT, busca, activeScreen]);

  async function handleUploadAudio(item: SelectedItemType, file: File) {
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido.');
      return;
    }

    const itemId = item.type === 'livro' ? item.data.livro.id : item.data.id;
    const itemTitulo = item.type === 'livro' ? item.data.livro.titulo : item.type === 'artigo' ? item.data.numero : item.data.nome;

    setUploadingId(itemId);
    const toastId = toast.loading(`Enviando áudio para ${itemTitulo}...`);

    try {
      const fileExt = file.name.split('.').pop();
      let rawFileName = `resumos-livros/pilulas-classicos-${itemId}-${Date.now()}.${fileExt}`;
      if (item.type === 'artigo') {
        const slug = item.data.lei_slug || 'cp';
        rawFileName = `resumos-livros/pilulas-${slug}-${itemId}-${Date.now()}.${fileExt}`;
      } else if (item.type === 'ministro') {
        rawFileName = `resumos-livros/pilulas-ministro-${itemId}-${Date.now()}.${fileExt}`;
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
      } else if (item.type === 'artigo') {
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
        if (slug === 'cpp') setArtigosCPP((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));
        if (slug === 'clt') setArtigosCLT((prev) => prev.map(a => a.id === itemId ? updatedArtigoCP : a));

        updatedItemForTranscription = { type: 'artigo', data: updatedArtigoCP };
        setSelectedItem((prev) => (prev && prev.type === 'artigo' && prev.data.id === itemId) ? updatedItemForTranscription : prev);
      } else if (item.type === 'ministro') {
        const curDiversos = item.data.diversos || {};
        const newDiversos = { ...curDiversos, audio_pilula_url: rawUrl };

        const { error: dbError } = await supabase
          .from('stf_ministros')
          .update({ diversos: newDiversos })
          .eq('id', itemId);
        if (dbError) throw dbError;

        const updatedMinistro = { ...item.data, diversos: newDiversos };
        setMinistros((prev) => prev.map(m => m.id === itemId ? updatedMinistro : m));
        updatedItemForTranscription = { type: 'ministro', data: updatedMinistro };
        setSelectedItem((prev) => (prev && prev.type === 'ministro' && prev.data.id === itemId) ? updatedItemForTranscription : prev);
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
    
    const itemId = item.type === 'livro' ? item.data.livro.id : item.data.id;
    const itemTitulo = item.type === 'livro' ? item.data.livro.titulo : item.type === 'artigo' ? item.data.numero : item.data.nome;
    const audioUrl = item.type === 'livro' ? item.data.livro.audioResumoUrl : item.type === 'artigo' ? item.data.audio_pilula_url : item.data.diversos?.audio_pilula_url;

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
      } else if (item.type === 'artigo') {
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
        if (slug === 'cpp') setArtigosCPP((prev) => prev.map((a) => (a.id === itemId ? updatedArtigo : a)));
        if (slug === 'clt') setArtigosCLT((prev) => prev.map((a) => (a.id === itemId ? updatedArtigo : a)));
        
        setSelectedItem((prev) => (prev && prev.type === 'artigo' && prev.data.id === itemId) ? { type: 'artigo', data: updatedArtigo } : prev);

        toast.success('Pílula transcrita e grafo gerado com sucesso!', { id: toastId });
      } else if (item.type === 'ministro') {
        const curDiversos = item.data.diversos || {};
        const newDiversos = { ...curDiversos, audio_transcricao: transcriptionText };

        const { error: dbUpdateError } = await supabase
          .from('stf_ministros')
          .update({ diversos: newDiversos })
          .eq('id', itemId);
          
        if (dbUpdateError) throw dbUpdateError;

        const updatedMinistro = { ...item.data, diversos: newDiversos };
        setMinistros((prev) => prev.map((m) => (m.id === itemId ? updatedMinistro : m)));
        setSelectedItem((prev) => (prev && prev.type === 'ministro' && prev.data.id === itemId) ? { type: 'ministro', data: updatedMinistro } : prev);

        toast.success('Pílula de ministro transcrita com sucesso!', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao transcrever pílula.', { id: toastId });
    } finally {
      setTranscribingId(null);
    }
  }

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
  } else if (['cp', 'cf', 'cc', 'cpp', 'clt'].includes(activeScreen)) {
    title = LEI_NOMES_MAP[activeScreen] || 'Lei';
    subtitle = `Gerencie as pílulas de ${title} (${artigosFiltrados.length})`;
    onBack = () => setActiveScreen('rapidas');
  } else if (activeScreen === 'ministros') {
    title = "Ministros do STF";
    subtitle = `Gerencie as pílulas dos ministros (${ministrosFiltrados.length})`;
    onBack = () => setActiveScreen('menu');
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
        {(activeScreen === 'menu' || activeScreen === 'classicos' || activeScreen === 'ministros' || ['cp', 'cf', 'cc', 'cpp', 'clt'].includes(activeScreen)) && (
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
          <PilulasMenuScreen
            livrosCount={livrosFiltrados.length}
            onNavigate={setActiveScreen}
          />
        )}

        {/* Tela Pílulas Rápidas (Sub-menu) */}
        {activeScreen === 'rapidas' && (
          <PilulasRapidasSubmenu
            counts={{
              cp: artigosCP.length,
              cf: artigosCF.length,
              cc: artigosCC.length,
              cpp: artigosCPP.length,
              clt: artigosCLT.length,
            }}
            onSelectLei={setActiveScreen}
          />
        )}

        {/* Tela Clássicos do Direito (Listagem) */}
        {activeScreen === 'classicos' && (
          <PilulasClassicosList
            loading={loading}
            livros={livrosFiltrados}
            onSelect={(item) => setSelectedItem({ type: 'livro', data: item })}
          />
        )}

        {/* Tela Ministros (Listagem) */}
        {activeScreen === 'ministros' && (
          <PilulasMinistrosList
            loading={loadingMinistros}
            ministros={ministrosFiltrados}
            onSelect={(item) => setSelectedItem({ type: 'ministro', data: item })}
          />
        )}

        {/* Tela Artigos (Listagem Virtualizada) */}
        {['cp', 'cf', 'cc', 'cpp', 'clt'].includes(activeScreen) && (
          <PilulasArtigosList
            loading={
              activeScreen === 'cp' ? loadingCP :
              activeScreen === 'cf' ? loadingCF :
              activeScreen === 'cc' ? loadingCC :
              activeScreen === 'cpp' ? loadingCPP : loadingCLT
            }
            title={title}
            artigos={artigosFiltrados}
            onSelect={(artigo) => setSelectedItem({ type: 'artigo', data: artigo })}
          />
        )}
      </div>

      {/* Sheet de Upload e Transcrição */}
      <PilulaUploadSheet
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        uploadingId={uploadingId}
        transcribingId={transcribingId}
        onUploadAudio={handleUploadAudio}
        onTranscribeAudio={handleTranscribeAudio}
      />
    </div>
  );
}
