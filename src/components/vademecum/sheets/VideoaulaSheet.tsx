import { useState, useEffect, useRef, useCallback } from 'react';
import { autoPip } from '@/lib/nativo/pip';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { protegerTela, desprotegerTela } from '@/lib/nativo/protecaoTela';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Play, Check, X as XIcon, ChevronLeft, ChevronRight, MessageCircle, Download, Send, ThumbsUp, ThumbsDown, GraduationCap, Plus, Brain, Trash2, RectangleHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { baixarBlob } from '@/lib/nativo';
import { resumoMdComponents } from './chunks/VideoaulaResumoMarkdown';
import { VideoaulaPdfDocument } from './chunks/VideoaulaPdf';
import { VideoaulaPraticarSheet, Questao, Flashcard } from './chunks/VideoaulaPraticarSheet';
import { VideoaulaChatOverlay, ChatMessage } from './chunks/VideoaulaChatOverlay';

interface VideoaulaSheetProps {
  open: boolean;
  onClose: () => void;
  video: { titulo: string; url: string; canal: string; videoId: string } | null;
  tabelaNome: string;
  artigoNumero: string;
  artigoTexto: string;
}

interface Comentario { id: string; user_id: string; autor_nome: string | null; texto: string; created_at: string; }

const VideoaulaSheet = ({ open, onClose, video, tabelaNome, artigoNumero, artigoTexto }: VideoaulaSheetProps) => {
  const [activeTab, setActiveTab] = useState<'resumo' | 'artigo' | 'comentarios'>('resumo');

  // Content
  const [resumo, setResumo] = useState('');
  const [textoArtigoCompleto, setTextoArtigoCompleto] = useState(artigoTexto || '');

  useEffect(() => {
    if (artigoTexto) {
      setTextoArtigoCompleto(artigoTexto);
      return;
    }
    
    if (tabelaNome && artigoNumero) {
      const fetchTexto = async () => {
        try {
          const { data } = await supabase
            .from(tabelaNome as any)
            .select('*')
            .eq('numero', artigoNumero)
            .maybeSingle();
          if (data) {
            setTextoArtigoCompleto(data.caput || data.conteudo || data.enunciado || '');
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchTexto();
    }
  }, [tabelaNome, artigoNumero, artigoTexto]);
  const [resumoLoading, setResumoLoading] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questoesLoading, setQuestoesLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  // Reactions
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<'like' | 'dislike' | null>(null);
  const [reactionBusy, setReactionBusy] = useState(false);

  // Comments
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comInput, setComInput] = useState('');
  const [comSending, setComSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Usuário');

  // Praticar sheet
  const [praticarOpen, setPraticarOpen] = useState(false);
  const [praticarMode, setPraticarMode] = useState<null | 'questoes' | 'flashcards'>(null);

  // Question / flashcard state
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [currentFcIdx, setCurrentFcIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [pdfExporting, setPdfExporting] = useState(false);
  const [recursosAberto, setRecursosAberto] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  /* ─── Nativo: PiP, tela acesa e proteção de tela ─── */
  useEffect(() => {
    const ativo = open && !!video;
    void autoPip(ativo);            // minimiza em janelinha ao sair do app
    void telaAcesa('videoaula', ativo);
    void (ativo ? protegerTela('videoaula') : desprotegerTela('videoaula')); // conteúdo premium: sem print
    return () => {
      void autoPip(false);
      void telaAcesa('videoaula', false);
      void desprotegerTela('videoaula');
    };
  }, [open, video?.videoId]);

  /* ─── Effects ─── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
      const meta: any = data.user?.user_metadata || {};
      setUserName(meta.display_name || meta.full_name || meta.name || data.user?.email?.split('@')[0] || 'Usuário');
    });
  }, []);

  useEffect(() => {
    if (!open || !video) return;
    // reset per-video state
    setActiveTab('resumo');
    setResumo(''); setQuestoes([]); setFlashcards([]);
    setCurrentQIdx(0); setSelectedAlt(null); setAnswered(false);
    setCurrentFcIdx(0); setFlipped(false);
    setPraticarOpen(false); setPraticarMode(null);
    setChatOpen(false); setChatMessages([]);
    loadResumo();
    loadReactionState();
    loadComentarios();
  }, [open, video?.videoId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  /* ─── Content loaders (edge fn with cache) ─── */
  const invokeConteudo = async (tipo: 'resumo' | 'questoes' | 'flashcards') => {
    if (!video) return null;
    const { data, error } = await supabase.functions.invoke('gerar-videoaula-conteudo', {
      body: {
        videoId: video.videoId,
        titulo: video.titulo,
        canal: video.canal,
        artigoNumero,
        tabelaNome,
        artigoTexto: (textoArtigoCompleto || '').substring(0, 1500),
        tipo,
      },
    });
    if (error) { console.error(`Erro ao gerar ${tipo}:`, error); return null; }
    return data?.resultado ?? null;
  };

  const loadResumo = async () => {
    if (!video || resumo) return;
    setResumoLoading(true);
    const r = await invokeConteudo('resumo');
    if (typeof r === 'string' && r.trim()) setResumo(r);
    else setResumo('Desculpe, não consegui gerar uma resposta.');
    setResumoLoading(false);
  };

  const loadQuestoes = async () => {
    if (!video || questoes.length > 0 || questoesLoading) return;
    setQuestoesLoading(true);
    const r = await invokeConteudo('questoes');
    if (Array.isArray(r)) setQuestoes(r.slice(0, 15));
    setQuestoesLoading(false);
  };

  const loadFlashcards = async () => {
    if (!video || flashcards.length > 0 || flashcardsLoading) return;
    setFlashcardsLoading(true);
    const r = await invokeConteudo('flashcards');
    if (Array.isArray(r)) setFlashcards(r.slice(0, 15));
    setFlashcardsLoading(false);
  };

  /* ─── Reactions ─── */
  const loadReactionState = useCallback(async () => {
    if (!video) return;
    const [{ data: conteudo }, { data: reac }] = await Promise.all([
      supabase.from('videoaula_conteudo').select('likes_count, dislikes_count').eq('video_id', video.videoId).maybeSingle(),
      userId
        ? supabase.from('videoaula_reacoes').select('tipo').eq('video_id', video.videoId).eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    setLikes(conteudo?.likes_count || 0);
    setDislikes(conteudo?.dislikes_count || 0);
    setMyReaction((reac as any)?.tipo || null);
  }, [video?.videoId, userId]);

  useEffect(() => { if (open && video && userId !== undefined) loadReactionState(); }, [open, userId, loadReactionState]);

  const handleReact = async (tipo: 'like' | 'dislike') => {
    if (!video || reactionBusy) return;
    if (!userId) { toast.error('Entre para curtir'); return; }
    setReactionBusy(true);
    const prevReaction = myReaction;
    // optimistic
    setMyReaction(prev => prev === tipo ? null : tipo);
    try {
      const { data, error } = await supabase.rpc('set_videoaula_reacao', { _video_id: video.videoId, _tipo: tipo });
      if (error) throw error;
      const res = data as any;
      setLikes(res?.likes || 0);
      setDislikes(res?.dislikes || 0);
      setMyReaction(res?.tipo || null);
    } catch (e) {
      console.error('reacao', e);
      setMyReaction(prevReaction);
      toast.error('Não foi possível registrar');
    } finally {
      setReactionBusy(false);
    }
  };

  /* ─── Comments ─── */
  const loadComentarios = async () => {
    if (!video) return;
    const { data } = await supabase
      .from('videoaula_comentarios')
      .select('id, user_id, autor_nome, texto, created_at')
      .eq('video_id', video.videoId)
      .order('created_at', { ascending: false })
      .limit(200);
    setComentarios((data || []) as Comentario[]);
  };

  const sendComentario = async () => {
    const t = comInput.trim();
    if (!t || !video || comSending) return;
    if (!userId) { toast.error('Entre para comentar'); return; }
    setComSending(true);
    const { error } = await supabase.from('videoaula_comentarios').insert({
      video_id: video.videoId,
      user_id: userId,
      autor_nome: userName,
      texto: t,
    });
    if (error) { console.error(error); toast.error('Erro ao enviar'); }
    else { setComInput(''); loadComentarios(); }
    setComSending(false);
  };

  const deleteComentario = async (id: string) => {
    const { error } = await supabase.from('videoaula_comentarios').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else setComentarios(prev => prev.filter(c => c.id !== id));
  };

  /* ─── Question / Flashcard handlers ─── */
  const handleResponder = () => { if (selectedAlt !== null) setAnswered(true); };
  const handleNextQuestion = () => { setCurrentQIdx(prev => prev + 1); setSelectedAlt(null); setAnswered(false); };
  const handleNextFc = () => { setCurrentFcIdx(prev => prev + 1); setFlipped(false); };
  const handlePrevFc = () => { setCurrentFcIdx(prev => prev - 1); setFlipped(false); };

  /* ─── Chat ─── */
  const suggestedQuestions = [
    'Resuma o ponto principal',
    'Explique com exemplo prático',
    'Qual a aplicação em concurso?',
    'Quais as exceções a essa regra?',
  ];

  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: msg.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          messages: [
            { role: 'system', content: `Você é uma professora de Direito explicando o conteúdo de uma videoaula sobre o ${artigoNumero}. Seja didática e objetiva.\n\nResumo da aula:\n${(resumo || '').substring(0, 4000)}` },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: msg.trim() },
          ],
          tabelaNome, artigoNumero,
        },
      });
      const reply = data?.resposta || data?.reply || 'Desculpe, não consegui responder.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error('Erro no chat:', e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar sua pergunta.' }]);
    } finally { setChatLoading(false); }
  };


  /* ─── PDF ─── */
  const handleExportPdf = async () => {
    if (!resumo || pdfExporting) return;
    setPdfExporting(true);
    try {
      const doc = <VideoaulaPdfDocument video={video} resumo={resumo} artigoNumero={artigoNumero} tabelaNome={tabelaNome} textoArtigoCompleto={textoArtigoCompleto} />;
      const blob = await pdf(doc).toBlob();
      const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      await baixarBlob(blob, `oab-na-risca-${slug(artigoNumero)}-${slug(video?.titulo || 'resumo')}.pdf`, {
        titulo: video?.titulo || 'Resumo da videoaula',
        toastSucesso: false,
      });
      toast.success('PDF baixado com sucesso!');
    } catch (e) {
      console.error(e); toast.error('Erro ao gerar PDF');
    } finally { setPdfExporting(false); }
  };

  const openPraticar = (mode: 'questoes' | 'flashcards') => {
    setPraticarMode(mode);
    if (mode === 'questoes') loadQuestoes();
    else loadFlashcards();
  };
  const closePraticar = () => { setPraticarMode(null); setPraticarOpen(false); };

  if (!video) return null;

  const tabs = [
    { id: 'resumo' as const, label: 'Resumo' },
    { id: 'artigo' as const, label: 'Artigo' },
    { id: 'comentarios' as const, label: `Comentários${comentarios.length ? ` (${comentarios.length})` : ''}` },
  ];

  const currentQ = questoes[currentQIdx];
  const currentFc = flashcards[currentFcIdx];

  const relTime = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return `${Math.floor(s / 60)}min`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d`;
    return new Date(iso).toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[10040]" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[10041] bg-background flex flex-col items-center md:left-auto md:right-0 md:w-[min(46rem,96vw)] md:border-l md:border-border md:shadow-2xl"
          >
            <div className="w-full max-w-3xl h-full flex flex-col min-h-0 relative">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-base font-semibold text-foreground truncate">Videoaula</h2>
                    <p className="text-[11px] text-foreground/60 truncate">Art. {artigoNumero}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => setIsLandscape(!isLandscape)} 
                    className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                    aria-label="Tela Estendida"
                  >
                    <RectangleHorizontal className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onClose} 
                    className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                    aria-label="Fechar"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable content — everything below the header scrolls together */}
              <div className="flex-1 overflow-y-auto min-h-0 pb-24">
              {/* Video Player */}
              {video.videoId ? (
                <div className={isLandscape ? "fixed inset-0 z-[100000] bg-black" : "aspect-video w-full shrink-0 bg-black relative"}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                    className={isLandscape ? "absolute top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 rotate-90 border-0" : "w-full h-full border-0"}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                  {isLandscape && (
                    <button 
                      onClick={() => setIsLandscape(false)} 
                      className="absolute top-8 right-8 z-[100001] w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-md"
                      style={{ transform: 'rotate(90deg)' }}
                    >
                      <XIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="aspect-video w-full shrink-0 bg-secondary flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              {/* Video Info + Reactions */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <h3 className="text-[17px] sm:text-lg font-bold text-foreground leading-snug">{video.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">{video.canal}</p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleReact('like')}
                    disabled={reactionBusy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      myReaction === 'like'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/60 text-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>{likes}</span>
                  </button>
                  <button
                    onClick={() => handleReact('dislike')}
                    disabled={reactionBusy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      myReaction === 'dislike'
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-secondary/60 text-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>{dislikes}</span>
                  </button>
                  
                  <button
                    onClick={() => setRecursosAberto(true)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border bg-secondary/60 text-foreground border-border hover:bg-secondary"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>Recursos</span>
                  </button>
                </div>
              </div>

              {/* Tabs (sticky so they stay visible while reading) */}
              <div className="flex gap-1 px-3 pt-2 sticky top-0 bg-background z-10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-sm font-semibold rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary bg-primary/5 border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="px-4 py-4">
                {/* RESUMO */}
                {activeTab === 'resumo' && (
                  <div>
                    {resumoLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Baixando transcrição e gerando resumo...</p>
                      </div>
                    ) : resumo ? (
                      <div className="max-w-none">
                        <ReactMarkdown components={resumoMdComponents}>{resumo}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum resumo disponível</p>
                    )}
                  </div>
                )}

                {/* ARTIGO */}
                {activeTab === 'artigo' && (
                  <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                    <p className="text-[15px] font-bold text-primary mb-3 font-display">{artigoNumero}</p>
                    <div className="text-[14px] text-foreground/90 leading-[1.8] text-justify whitespace-pre-wrap font-body">
                      {textoArtigoCompleto || 'Texto não disponível.'}
                    </div>
                  </div>
                )}

                {/* COMENTÁRIOS */}
                {activeTab === 'comentarios' && (
                  <div className="space-y-3">
                    <div className="flex gap-2 sticky top-0 bg-background pb-2 -mt-1 pt-1 z-10">
                      <input
                        value={comInput}
                        onChange={(e) => setComInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendComentario()}
                        placeholder={userId ? 'Escreva um comentário...' : 'Entre para comentar'}
                        disabled={!userId || comSending}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50"
                      />
                      <button
                        onClick={sendComentario}
                        disabled={!comInput.trim() || comSending || !userId}
                        className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                      >
                        {comSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>

                    {comentarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Seja o primeiro a comentar</p>
                    ) : (
                      comentarios.map((c) => (
                        <div key={c.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold">
                                {(c.autor_nome || 'U').slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[12px] font-semibold text-foreground leading-tight">{c.autor_nome || 'Usuário'}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight">{relTime(c.created_at)}</p>
                              </div>
                            </div>
                            {c.user_id === userId && (
                              <button onClick={() => deleteComentario(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-[13px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{c.texto}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              </div>
              {/* /scrollable */}

              {/* Footer "Praticar" */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border z-20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPraticarOpen(true)}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Praticar
                  </button>
                  {activeTab === 'resumo' && resumo && (
                    <button
                      onClick={handleExportPdf}
                      disabled={pdfExporting}
                      className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      title="Baixar PDF"
                    >
                      {pdfExporting ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Download className="w-5 h-5 text-foreground" />}
                    </button>
                  )}
                  <button
                    onClick={() => setChatOpen(true)}
                    className="w-12 h-12 rounded-xl bg-yellow-400 text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
                    title="Professora"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── PRATICAR bottom sheet ─── */}
            <VideoaulaPraticarSheet
              open={praticarOpen}
              onClose={closePraticar}
              mode={praticarMode}
              setMode={setPraticarMode}
              openMode={openPraticar}
              questoes={questoes}
              questoesLoading={questoesLoading}
              flashcards={flashcards}
              flashcardsLoading={flashcardsLoading}
              currentQIdx={currentQIdx}
              setCurrentQIdx={setCurrentQIdx}
              selectedAlt={selectedAlt}
              setSelectedAlt={setSelectedAlt}
              answered={answered}
              setAnswered={setAnswered}
              currentFcIdx={currentFcIdx}
              setCurrentFcIdx={setCurrentFcIdx}
              flipped={flipped}
              setFlipped={setFlipped}
              handleResponder={handleResponder}
              handleNextQuestion={handleNextQuestion}
              handleNextFc={handleNextFc}
              handlePrevFc={handlePrevFc}
            />
            <VideoaulaChatOverlay
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              messages={chatMessages}
              loading={chatLoading}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={sendChatMessage}
              chatEndRef={chatEndRef}
            />
            {/* RECURSOS DRAWER */}
            <AnimatePresence>
              {recursosAberto && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/40 z-[10050]"
                    onClick={() => setRecursosAberto(false)}
                  />
                  <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="absolute top-0 right-0 bottom-0 w-64 bg-background border-l border-border z-[10051] flex flex-col shadow-2xl"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="text-[13px] font-bold text-foreground font-display tracking-wider">RECURSOS</h3>
                      <button onClick={() => setRecursosAberto(false)} className="p-1.5 rounded-md hover:bg-secondary">
                        <XIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="p-3 space-y-2 overflow-y-auto">
                      <button onClick={() => { handleExportPdf(); setRecursosAberto(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary text-left text-sm text-foreground transition-colors border border-border bg-secondary/30">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[13px] font-display">Baixar Resumo (PDF)</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">Material da aula</p>
                        </div>
                      </button>
                      <button onClick={() => { toast.info('Mapa mental em breve!'); setRecursosAberto(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary text-left text-sm text-foreground transition-colors border border-border bg-secondary/30">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[13px] font-display">Mapa Mental</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">Visualizar diagrama</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoaulaSheet;
