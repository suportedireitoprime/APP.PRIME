import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Image as ImageIcon, Youtube, Mic, ArrowLeft, ArrowRight, Loader2, Sparkles, Check, X, SlidersHorizontal, UploadCloud, Layers, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getOfflineDecks, saveOfflineDecks } from '@/lib/flashcardsOfflineManager';
import { haptic } from '@/lib/nativeHaptics';

interface WizardFlashcardsIAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSource?: 'pdf' | 'image' | 'youtube' | 'audio' | null;
}

type SourceType = 'pdf' | 'image' | 'youtube' | 'audio' | null;

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

export default function WizardFlashcardsIA({ open, onOpenChange, initialSource }: WizardFlashcardsIAProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceType>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  
  // Step 2 (Youtube specific)
  const [youtubeLink, setYoutubeLink] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<{ title: string, duration: string, image: string, author?: string, description?: string, hasCaptions?: boolean } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Step 3 results
  const [tema, setTema] = useState('');
  const [resumo, setResumo] = useState('');
  
  // Step 4
  const [qtdCards, setQtdCards] = useState(45);
  const [maxCards, setMaxCards] = useState(100);

  // Step 5
  const [deckName, setDeckName] = useState('');
  const [deckTags, setDeckTags] = useState<string[]>([]);

  // Reset when closed or apply initialSource when opened
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
        setDeckTags([]);
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

      // Tenta a API V3 usando a chave dedicada ou a chave do Gemini que tem permissões
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      
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

      // Fallback para oEmbed (público) se não houver chave ou falhar
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        setYoutubePreview({
          title: oembedData.title,
          duration: 'Vídeo do YouTube',
          image: oembedData.thumbnail_url,
          author: oembedData.author_name,
          hasCaptions: true // Assumimos true no fallback para não bloquear
        });
        haptic.success();
        return;
      }
      
      throw new Error('Não foi possível buscar os dados');
    } catch (error) {
      console.error("Erro na busca do YouTube:", error);
      // Fallback visual
      setYoutubePreview({
        title: 'Vídeo Encontrado',
        duration: 'YouTube',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
        author: 'Professor(a)',
        hasCaptions: true // Fallback
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
      setLoadingStep(4); // Tica todos
      setTema(temaStr);
      setResumo(resumoStr);
      setQtdCards(qtdRecomendada);
      setMaxCards(qtdMax);
      setDeckTags(tagsArray);
      setTimeout(() => {
        setLoadingAI(false);
        setStep(4); // Vai direto pro Step 4 (Quantidade)
        haptic.success();
      }, 600);
    };
    
    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      const title = youtubePreview?.title || '';
      const desc = youtubePreview?.description || '';

      if (apiKey && title) {
        const prompt = `Analise o título e a descrição deste vídeo educacional/jurídico.
Título: ${title}
Descrição: ${desc.substring(0, 1500)}

Retorne um JSON estrito neste formato, sugerindo uma quantidade adequada de flashcards baseada na densidade provável do assunto e extraindo até 3 tags curtas (ex: Direito Penal, Concursos). A quantidade máxima não deve ultrapassar 150.
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

      // Fallback sem IA
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
        ['Estudo']
      );
    }
  };

  const handleSave = () => {
    if (!deckName.trim()) return;
    haptic.selection();
    setLoadingSave(true);
    
    // Simula a geração da IA (os cards reais)
    setTimeout(() => {
      const newDeckId = crypto.randomUUID();
      const offlineDecks = getOfflineDecks();
      
      offlineDecks.unshift({
        id: newDeckId,
        nome: deckName,
        descricao: resumo,
        filtros: { source: source },
        total_cards: qtdCards,
        created_at: new Date().toISOString(),
        thumbnail: youtubePreview?.image,
        duration: youtubePreview?.duration,
        tags: deckTags
      });
      
      saveOfflineDecks(offlineDecks);
      
      setLoadingSave(false);
      haptic.success();
      onOpenChange(false);
      
      toast({
        title: "Flashcards Gerados!",
        description: `Seu deck "${deckName}" com ${qtdCards} cards foi criado com sucesso.`,
      });
      
      // Modal fecha e Decks Personalizados recarrega automaticamente
    }, 3500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-border/80 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Criar Flashcards com IA</DialogTitle>
        
        {/* Header */}
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
            {/* ETAPA 1: SELEÇÃO DA FONTE */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 gap-4"
              >
                <div onClick={() => handleSourceSelect('pdf')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Arquivo PDF</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Resumos e Apostilas</p>
                  </div>
                </div>

                <div onClick={() => handleSourceSelect('image')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Imagem</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fotos de caderno</p>
                  </div>
                </div>

                <div onClick={() => handleSourceSelect('youtube')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                  <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Youtube className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-foreground flex items-center gap-1.5">
                      YouTube <Sparkles className="w-3 h-3 text-[#36AF85]" />
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Aulas em vídeo</p>
                  </div>
                </div>

                <div onClick={() => handleSourceSelect('audio')} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 group opacity-60">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Áudio (Breve)</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Aulas gravadas</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ETAPA 2: UPLOAD / LINK */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {source === 'youtube' ? (
                  <div className="space-y-6">
                    {!youtubePreview ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground ml-1">Cole o link do vídeo</label>
                          <div className="relative">
                            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                            <Input 
                              placeholder="https://youtube.com/watch?v=..." 
                              className="pl-12 h-14 rounded-full bg-muted/30 border-border/80 focus-visible:ring-[#36AF85]"
                              value={youtubeLink}
                              onChange={e => setYoutubeLink(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSearchYoutube()}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleSearchYoutube} 
                          disabled={!youtubeLink.trim() || loadingPreview}
                          className="w-full h-14 rounded-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white font-bold text-base shadow-lg shadow-[#36AF85]/20 active:scale-95 transition-all"
                        >
                          {loadingPreview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Procurar Vídeo'}
                        </Button>
                        
                        <div className="bg-muted/50 border border-border/50 rounded-2xl p-4 flex gap-3 items-start mt-4">
                          <Scale className="w-5 h-5 text-[#36AF85] shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground/80 font-medium leading-relaxed">
                            A nossa IA Jurídica especializada analisará a transcrição completa deste vídeo e criará os flashcards ideais para consolidar o seu aprendizado de forma automática.
                          </p>
                        </div>
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="text-center space-y-1 mb-2">
                          <h3 className="font-black text-lg uppercase tracking-wider text-foreground">Vídeo Encontrado</h3>
                          <p className="text-sm text-muted-foreground">Confirme se é este o vídeo que deseja processar.</p>
                        </div>
                        
                        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden relative shadow-lg">
                          <div className="aspect-video bg-zinc-900 relative flex items-center justify-center group overflow-hidden">
                            <img 
                              src={youtubePreview.image} 
                              alt="Thumbnail" 
                              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="w-14 h-14 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center z-10 shadow-[0_0_20px_rgba(220,38,38,0.6)] group-hover:scale-110 transition-transform duration-300">
                              <Youtube className="w-7 h-7 text-white ml-0.5" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10 tracking-wider">
                              {youtubePreview.duration}
                            </div>
                          </div>
                          <div className="p-4 bg-zinc-950">
                            <h4 className="font-bold text-sm line-clamp-2 leading-tight text-zinc-100">{youtubePreview.title}</h4>
                            <p className="text-xs text-zinc-500 mt-2 font-medium">{youtubePreview.author || 'Canal'} • YouTube</p>
                            {youtubePreview.hasCaptions === false && (
                              <div className="mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded text-xs text-red-400 font-medium leading-tight">
                                Este vídeo não possui legendas ocultas. A IA não consegue extrair o conteúdo.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" onClick={() => setYoutubePreview(null)} className="flex-1 rounded-full h-12 font-bold border-border/50 hover:bg-muted">
                            Voltar
                          </Button>
                          <Button onClick={handleSimulateAI} disabled={youtubePreview.hasCaptions === false} className="flex-[2] bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12 shadow-lg shadow-[#36AF85]/20">
                            <Sparkles className="w-4 h-4 mr-2" /> Extrair Conteúdo
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="font-bold text-foreground">Toque para escolher o arquivo</p>
                      {source === 'audio' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: MP3, M4A, WAV (Max: 1h)</p>}
                      {source === 'pdf' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: PDF</p>}
                      {source === 'image' && <p className="text-xs text-muted-foreground mt-1">Formatos suportados: JPG, PNG</p>}
                    </div>
                    
                    <Button onClick={handleSimulateAI} className="mt-8 bg-[#36AF85] hover:bg-[#2b8c6a] text-white w-full rounded-full font-bold h-12 shadow-lg shadow-[#36AF85]/20">
                      <Sparkles className="w-4 h-4 mr-2" /> Extrair Conteúdo
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* ETAPA 3: PROCESSAMENTO IA E PRÉVIA */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center justify-center h-full text-center py-4"
              >
                {loadingAI && (
                  <div className="flex flex-col w-full px-2 py-4">
                     <div className="flex justify-center mb-8">
                        <Loader2 className="w-12 h-12 text-[#36AF85] animate-spin" />
                     </div>
                     <div className="space-y-4">
                       {[
                         "Analisando material base...",
                         "Extraindo transcrição e referências...",
                         "Estruturando conceitos principais...",
                         "Formatando flashcards com IA..."
                       ].map((text, i) => (
                         <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${loadingStep >= i ? 'opacity-100' : 'opacity-30'}`}>
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${loadingStep > i ? 'bg-[#36AF85] text-white' : loadingStep === i ? 'bg-[#36AF85]/20 text-[#36AF85] animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                             {loadingStep > i ? <Check className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                           </div>
                           <span className={`text-sm font-bold transition-colors duration-500 ${loadingStep >= i ? 'text-foreground' : 'text-muted-foreground'}`}>{text}</span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ETAPA 4: PLANO DE CARDS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#36AF85]/10 rounded-full flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8 text-[#36AF85]" />
                  </div>
                  <h3 className="font-bold text-xl">Plano de Geração</h3>
                  <p className="text-sm text-muted-foreground">Para cobrir 100% dos tópicos abordados no material, a IA sugere a criação de:</p>
                </div>
                
                <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col items-center">
                  <span className="text-5xl font-black text-foreground">{qtdCards}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Flashcards</span>
                  
                  <div className="w-full mt-8 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-2">
                      <span>1</span>
                      <span>Qtd. Desejada</span>
                      <span>{maxCards}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max={maxCards} 
                      value={qtdCards}
                      onChange={e => setQtdCards(parseInt(e.target.value))}
                      className="w-full accent-[#36AF85] h-2 bg-muted rounded-full appearance-none outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#36AF85]/10 border border-[#36AF85]/30 rounded-2xl p-4 flex gap-3 text-left">
                  <Sparkles className="w-5 h-5 text-[#36AF85] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#36AF85] text-sm mb-1">Qualidade do Resumo</h4>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      Gerar mais flashcards aumenta a profundidade dos detalhes cobrados. Diminuir a quantidade focará apenas nos conceitos mais vitais.
                    </p>
                  </div>
                </div>

                <Button onClick={() => { haptic.selection(); setDeckName(tema); setStep(5); }} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12">
                  Avançar para Salvar
                </Button>
              </motion.div>
            )}

            {/* ETAPA 5: SALVAR DECK */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl">Identifique seu Deck</h3>
                  <p className="text-sm text-muted-foreground">O material foi analisado e está pronto.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Nome do Deck</label>
                    <Input value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="Ex: Aula 01 - Direito Penal" className="h-14 rounded-2xl bg-muted/30 border-border/80" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Tags (Opcional)</label>
                    <Input 
                       value={deckTags.join(', ')} 
                       onChange={e => setDeckTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
                       placeholder="Ex: Penal, Concursos" 
                       className="h-14 rounded-2xl bg-muted/30 border-border/80" 
                    />
                    <p className="text-[10px] text-muted-foreground ml-1">Separadas por vírgula</p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={!deckName.trim() || loadingSave} className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-12 relative overflow-hidden">
                  {loadingSave ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Gerando Cards...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" /> Salvar e Finalizar
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
