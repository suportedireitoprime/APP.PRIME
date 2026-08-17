import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Image as ImageIcon, Youtube, Mic, ArrowLeft, ArrowRight, Loader2, Sparkles, Check, X, SlidersHorizontal, UploadCloud, Layers, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getOfflineDecks, saveOfflineDecks, saveOfflineCards, getOfflineCards, OfflineFlashcard } from '@/lib/flashcardsOfflineManager';
import { haptic } from '@/lib/nativeHaptics';

interface WizardFlashcardsIAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSource?: 'document' | 'image' | 'youtube' | 'audio' | null;
  appendDeckId?: string | null;
}

type SourceType = 'document' | 'image' | 'youtube' | 'audio' | null;

const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const formatYoutubeDuration = (duration: string) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '00:00';
  const h = (match[1] || '').replace('H', '');
  const m = (match[2] || '').replace('M', '');
  const s = (match[3] || '').replace('S', '');
  
  const formattedM = m ? m.padStart(2, '0') : '00';
  const formattedS = s ? s.padStart(2, '0') : '00';
  
  if (h) return `${h}:${formattedM}:${formattedS}`;
  return `${formattedM}:${formattedS}`;
};

const PREDEFINED_TAGS = [
  { label: 'Direito Penal', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { label: 'Direito Civil', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { label: 'Processo Penal', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { label: 'Direito Const.', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { label: 'Direito Admin.', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { label: 'Concursos', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { label: 'OAB', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' }
];

export default function WizardFlashcardsIA({ open, onOpenChange, initialSource, appendDeckId }: WizardFlashcardsIAProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceType>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  
  const [youtubeLink, setYoutubeLink] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<{ title: string, duration: string, image: string, author?: string, description?: string, hasCaptions?: boolean } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [isRoleplayMode, setIsRoleplayMode] = useState(false);
  const [tema, setTema] = useState('');
  const [resumo, setResumo] = useState('');
  
  const [qtdCards, setQtdCards] = useState(45);
  const [maxCards, setMaxCards] = useState(100);

  const [deckName, setDeckName] = useState('');
  const [deckMateria, setDeckMateria] = useState('');
  const [deckTags, setDeckTags] = useState<string[]>([]);
  const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialSource) {
        setStep(2);
        setSource(initialSource);
      } else {
        setStep(1);
        setSource(null);
      }
    } else {
      setTimeout(() => {
        setStep(1);
        setSource(null);
        setYoutubeLink('');
        setYoutubePreview(null);
        setTema('');
        setResumo('');
        setDeckName('');
        setDeckMateria('');
        setDeckTags([]);
        setIsTagsPanelOpen(false);
        setIsRoleplayMode(false);
        setQtdCards(45);
        setMaxCards(100);
      }, 300);
    }
  }, [open, initialSource]);

  const handleSourceSelect = (s: SourceType) => {
    haptic.selection();
    setSource(s);
    setStep(2);
  };

  const handleSearchYoutube = async () => {
    if (!youtubeLink.trim()) return;
    setLoadingPreview(true);
    haptic.selection();

    try {
      const videoId = extractYoutubeId(youtubeLink);
      if (!videoId) throw new Error('Link do YouTube inválido');

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (apiKey) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
        if (!res.ok) throw new Error('Erro na API do YouTube');
        
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          setYoutubePreview({
            title: item.snippet.title,
            duration: formatYoutubeDuration(item.contentDetails.duration),
            image: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            author: item.snippet.channelTitle,
            description: item.snippet.description,
            hasCaptions: item.contentDetails.caption === 'true'
          });
          haptic.success();
          return;
        }
      }

      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        setYoutubePreview({
          title: oembedData.title,
          duration: 'Vídeo do YouTube',
          image: oembedData.thumbnail_url,
          author: oembedData.author_name,
          hasCaptions: true
        });
        haptic.success();
        return;
      }
      
      throw new Error('Não foi possível buscar os dados');
    } catch (error) {
      console.error("Erro na busca do YouTube:", error);
      setYoutubePreview({
        title: 'Vídeo Encontrado',
        duration: 'YouTube',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
        author: 'Professor(a)',
        hasCaptions: true
      });
      haptic.success();
    } finally {
      setLoadingPreview(false);
    }
  };

  const [loadingStep, setLoadingStep] = useState(0);

  const handleSimulateAI = async () => {
    haptic.selection();
    setStep(3);
    setLoadingAI(true);
    setLoadingStep(0);
    
    const loadingTimer = setInterval(() => {
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
    }, 1000);

    const finishLoading = (temaStr: string, resumoStr: string, qtdRecomendada: number, qtdMax: number, tagsArray: string[]) => {
      clearInterval(loadingTimer);
      setLoadingStep(4);
      setTema(temaStr);
      setResumo(resumoStr);
      setQtdCards(qtdRecomendada);
      setMaxCards(qtdMax);
      setDeckTags(tagsArray);
      setTimeout(() => {
        setLoadingAI(false);
        setStep(4);
        haptic.success();
      }, 600);
    };
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const title = youtubePreview?.title || '';
      const desc = youtubePreview?.description || '';

      if (apiKey && title) {
        const basePrompt = `Analise o título e a descrição deste vídeo educacional/jurídico.
Título: ${title}
Descrição: ${desc.substring(0, 1500)}`;

        const prompt = isRoleplayMode
          ? `${basePrompt}\n\nO usuário solicitou 'Casos Práticos'. Retorne um JSON estrito sugerindo flashcards baseados em HIPÓTESES PRÁTICAS e estudos de caso, extraindo até 3 tags curtas. A quantidade máxima não deve ultrapassar 150.
{
  "tema": "Tema principal em até 5 palavras",
  "resumo": "Um resumo direto de até 2 linhas focando na resolução de casos práticos...",
  "qtd_recomendada": 30,
  "qtd_maxima": 60,
  "tags": ["Caso Prático", "Tag2"]
}`
          : `${basePrompt}\n\nRetorne um JSON estrito neste formato, sugerindo uma quantidade adequada de flashcards baseada na densidade provável do assunto e extraindo até 3 tags curtas (ex: Direito Penal, Concursos). A quantidade máxima não deve ultrapassar 150.
{
  "tema": "Tema principal em até 5 palavras",
  "resumo": "Um resumo direto de até 2 linhas sobre o conteúdo que será abordado (ex: O material aborda os elementos...)",
  "qtd_recomendada": 30,
  "qtd_maxima": 60,
  "tags": ["Tag1", "Tag2"]
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            finishLoading(
              parsed.tema || title,
              parsed.resumo || 'Descrição não disponível.',
              parsed.qtd_recomendada || 35,
              Math.min(150, parsed.qtd_maxima || 100),
              parsed.tags || []
            );
            return;
          }
        }
      }

      finishLoading(
        title,
        desc ? desc.substring(0, 150) + '...' : 'Descrição não disponível para este vídeo.',
        25,
        100,
        ['Estudo']
      );
    } catch (e) {
      console.error(e);
      finishLoading(
        youtubePreview?.title || 'Conteúdo do YouTube',
        'Não foi possível gerar um resumo avançado. Prosseguindo com os dados básicos.',
        25,
        100,
        ['Estudo', 'Revisão']
      );
    }
  };

  const generateMockCards = (deckId: string, topic: string, count: number): OfflineFlashcard[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `ai-mock-${deckId}-${crypto.randomUUID().substring(0, 8)}`,
      deck_id: deckId,
      pergunta: `Explique o conceito ou a regra principal abordada na parte ${i+1} do conteúdo: ${topic}?`,
      resposta: `O conceito abordado trata da regra geral de aplicação daquele tema específico na prática, ressaltando os pontos chaves identificados no material enviado.`,
      status: null,
      dica: `Tente lembrar das palavras-chave do tópico ${i+1}.`
    }));
  };

  const handleSave = () => {
    if (!appendDeckId && !deckName.trim()) return;
    haptic.selection();
    setLoadingSave(true);
    
    setTimeout(() => {
      const offlineDecks = getOfflineDecks();
      
      if (appendDeckId) {
        const deckIndex = offlineDecks.findIndex(d => d.id === appendDeckId);
        if (deckIndex >= 0) {
          const deck = offlineDecks[deckIndex];
          const currentCards = getOfflineCards(appendDeckId);
          const newCards = generateMockCards(appendDeckId, deck.nome, qtdCards);
          
          saveOfflineCards(appendDeckId, [...currentCards, ...newCards]);
          
          offlineDecks[deckIndex].total_cards += qtdCards;
          saveOfflineDecks(offlineDecks);
          
          toast({
            title: "Cards Adicionados!",
            description: `Foram adicionados +${qtdCards} flashcards ao deck "${deck.nome}".`,
          });
        }
      } else {
        const newDeckId = crypto.randomUUID();
        
        offlineDecks.unshift({
          id: newDeckId,
          nome: deckName,
          materia: deckMateria,
          descricao: resumo,
          filtros: { source: source },
          total_cards: qtdCards,
          cards_compreendidos: 0,
          cards_a_revisar: 0,
          created_at: new Date().toISOString(),
          thumbnail: youtubePreview?.image,
          duration: youtubePreview?.duration,
          tags: deckTags
        });
        saveOfflineDecks(offlineDecks);
        
        const generatedCards = generateMockCards(newDeckId, deckName, qtdCards);
        saveOfflineCards(newDeckId, generatedCards);
        
        toast({
          title: "Flashcards Gerados!",
          description: `Seu deck "${deckName}" com ${qtdCards} cards foi criado com sucesso.`,
        });
      }
      
      setLoadingSave(false);
      haptic.success();
      onOpenChange(false);
    }, 3500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-border/80 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Criar Flashcards com IA</DialogTitle>
        
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="font-black text-foreground uppercase tracking-widest text-sm">
            {step === 1 && 'Escolha a Fonte'}
            {step === 2 && 'Envie o Material'}
            {step === 3 && 'Análise da IA'}
            {step === 4 && 'Plano de Estudo'}
            {step === 5 && 'Salvar Deck'}
          </h2>
          <button onClick={() => { haptic.selection(); onOpenChange(false); }} className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors active:scale-95">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh] scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-2 gap-4">
                <div onClick={() => handleSourceSelect('document')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-blue-500" /></div>
                  <div><h3 className="font-bold text-foreground">Documentos</h3><p className="text-[10px] text-muted-foreground mt-0.5">PDF, Word, Slides</p></div>
                </div>
                <div onClick={() => handleSourceSelect('image')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon className="w-6 h-6 text-blue-500" /></div>
                  <div><h3 className="font-bold text-foreground">Imagem</h3><p className="text-[10px] text-muted-foreground mt-0.5">Fotos de caderno</p></div>
                </div>
                <div onClick={() => handleSourceSelect('youtube')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10"><Youtube className="w-6 h-6 text-red-600" /></div>
                  <div className="relative z-10"><h3 className="font-bold text-foreground flex items-center gap-1.5">YouTube <Sparkles className="w-3 h-3 text-[#36AF85]" /></h3><p className="text-[10px] text-muted-foreground mt-0.5">Aulas em vídeo</p></div>
                </div>
                <div onClick={() => handleSourceSelect('audio')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group opacity-60">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Mic className="w-6 h-6 text-amber-500" /></div>
                  <div><h3 className="font-bold text-foreground">Áudio (Breve)</h3><p className="text-[10px] text-muted-foreground mt-0.5">Aulas gravadas</p></div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {source === 'youtube' ? (
                  <div className="space-y-6">
                    {!youtubePreview ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground ml-1">Cole o link do vídeo</label>
                          <div className="relative">
                            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                            <Input placeholder="https://youtube.com/watch?v=..." className="pl-12 h-14 rounded-full bg-muted/30 border-border/80 focus-visible:ring-[#36AF85]" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchYoutube()} />
                          </div>
                        </div>
                        <Button onClick={handleSearchYoutube} disabled={!youtubeLink.trim() || loadingPreview} className="w-full h-14 rounded-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white font-bold text-base shadow-lg shadow-[#36AF85]/20 active:scale-95 transition-all">
                          {loadingPreview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Procurar Vídeo'}
                        </Button>
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden relative shadow-lg">
                          <img src={youtubePreview.image} className="aspect-video w-full object-cover opacity-70" />
                          <div className="p-4 bg-zinc-950">
                            <h4 className="font-bold text-sm line-clamp-2 text-zinc-100">{youtubePreview.title}</h4>
                            <p className="text-xs text-zinc-500 mt-2">{youtubePreview.author || 'Canal'}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setYoutubePreview(null)} className="flex-1 rounded-full h-12 font-bold">Voltar</Button>
                          <Button onClick={handleSimulateAI} disabled={youtubePreview.hasCaptions === false} className="flex-[2] bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12"><Sparkles className="w-4 h-4 mr-2" /> Extrair Conteúdo</Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 cursor-pointer">
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="font-bold text-foreground">Toque no + para anexar</p>
                    <Button onClick={handleSimulateAI} className="mt-8 bg-[#36AF85] hover:bg-[#2b8c6a] text-white w-full rounded-full font-bold h-12">Extrair Conteúdo</Button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col items-center py-10">
                <div className="relative w-40 h-28 mb-12">
                   {[0, 1, 2].map((i) => (
                     <div key={i} className="absolute inset-0 bg-card border border-border/50 rounded-xl shadow-lg animate-pulse" style={{ transform: `translateY(${i * 4}px) scale(${1 - i * 0.05})`, zIndex: 3 - i }}></div>
                   ))}
                </div>
                <h3 className="text-lg font-black text-foreground mb-4">Analisando conteúdo...</h3>
                <div className="space-y-3 w-full px-4">
                  {["Extraindo transcrição", "Identificando conceitos-chave", "Criando flashcards"].map((text, i) => (
                    <div key={i} className={`flex items-center gap-3 ${loadingStep >= i ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-2 h-2 rounded-full ${loadingStep >= i ? 'bg-[#36AF85]' : 'bg-muted'}`} />
                      <span className="text-sm font-bold">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col items-center">
                  <span className="text-5xl font-black text-foreground">{qtdCards}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Flashcards</span>
                  <input type="range" min="1" max={maxCards} value={qtdCards} onChange={e => setQtdCards(parseInt(e.target.value))} className="w-full mt-6 accent-[#36AF85]" />
                </div>
                <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex flex-col gap-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">Modo Casos Práticos</h4>
                      <div className="bg-indigo-500/10 text-indigo-500 text-[10px] px-1.5 py-0.5 rounded font-bold">BETA</div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">Gera estudos de caso simulados em vez de perguntas conceituais.</p>
                  </div>
                  <Switch checked={isRoleplayMode} onCheckedChange={(c) => { haptic.selection(); setIsRoleplayMode(c); }} className="data-[state=checked]:bg-indigo-500" />
                </div>
                <Button onClick={() => { haptic.selection(); setStep(5); setDeckName(tema); }} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12">Avançar para Salvar</Button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl">Identifique seu Deck</h3>
                  <p className="text-sm text-muted-foreground">O material foi analisado e está pronto.</p>
                </div>

                <div className="space-y-4">
                  {!appendDeckId && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Nome do Deck</label>
                        <Textarea 
                          value={deckName} 
                          onChange={e => setDeckName(e.target.value)} 
                          placeholder="Ex: Aplicação da Lei Penal" 
                          className="min-h-[80px] rounded-2xl bg-muted/30 border-border/80 resize-none font-medium p-4" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Matéria</label>
                        <Input 
                          value={deckMateria} 
                          onChange={e => setDeckMateria(e.target.value)} 
                          placeholder="Ex: Direito Penal do Zero" 
                          className="h-14 rounded-2xl bg-muted/30 border-border/80 font-medium px-4" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider flex justify-between items-center">
                          Tags
                          <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">{deckTags.length}</span>
                        </label>
                        
                        <div className="bg-muted/20 border border-border/50 rounded-2xl p-3">
                           <div className="flex flex-wrap gap-2 mb-3">
                             {deckTags.map(tag => {
                               const preset = PREDEFINED_TAGS.find(t => t.label === tag);
                               return (
                                 <span key={tag} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${preset ? preset.color : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                                   {tag}
                                   <button onClick={() => setDeckTags(deckTags.filter(t => t !== tag))} className="ml-1 opacity-60 hover:opacity-100">
                                      <X className="w-3 h-3" />
                                   </button>
                                 </span>
                               )
                             })}
                             {deckTags.length === 0 && <span className="text-xs text-muted-foreground px-2 py-1">Nenhuma tag selecionada.</span>}
                           </div>

                           <Button variant="outline" size="sm" onClick={() => setIsTagsPanelOpen(!isTagsPanelOpen)} className="w-full rounded-xl border-dashed bg-transparent hover:bg-muted/30 h-10 text-xs">
                             {isTagsPanelOpen ? 'Fechar Painel' : '+ Adicionar Tags'}
                           </Button>
                           
                           <AnimatePresence>
                             {isTagsPanelOpen && (
                               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 overflow-hidden">
                                 <div className="grid grid-cols-2 gap-2">
                                    {PREDEFINED_TAGS.map(t => {
                                      const isSelected = deckTags.includes(t.label);
                                      return (
                                        <button 
                                          key={t.label} 
                                          onClick={() => setDeckTags(isSelected ? deckTags.filter(tag => tag !== t.label) : [...deckTags, t.label])}
                                          className={`px-3 py-2 text-left rounded-xl text-xs font-bold border transition-all ${isSelected ? t.color.replace('/10', '/30').replace('/20', '/50') + ' ring-1 ring-current' : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/80'}`}
                                        >
                                          {t.label}
                                        </button>
                                      )
                                    })}
                                 </div>
                                 <div className="mt-3 flex gap-2">
                                    <Input 
                                       placeholder="Nova tag..." 
                                       className="h-10 rounded-xl text-xs bg-card" 
                                       onKeyDown={e => {
                                         if (e.key === 'Enter') {
                                           const val = e.currentTarget.value.trim();
                                           if (val && !deckTags.includes(val)) setDeckTags([...deckTags, val]);
                                           e.currentTarget.value = '';
                                         }
                                       }}
                                    />
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleSave} disabled={(!appendDeckId && !deckName.trim()) || loadingSave} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12 relative overflow-hidden">
                  {loadingSave ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Gerando Cards...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" /> {appendDeckId ? 'Adicionar ao Deck Existente' : 'Salvar e Finalizar'}
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer (Step Counter) */}
        {step > 1 && step < 5 && (
          <div className="p-4 border-t border-border/50 flex justify-center bg-background/50">
            <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
              Passo {step} de 5
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SourceCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <div 
      onClick={() => { haptic.selection(); onClick(); }}
      className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95"
    >
      <div className="mb-1">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
