import { Suspense, useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ListChecks,
  Layers,
  BookOpenText,
  Subtitles,
  PenTool,
  Copy,
  Check,
  CheckCircle2,
  Heart,
  Send,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { AnotacoesAulaSheet } from '@/components/videoaulas/AnotacoesAulaSheet';
import { TrilhaAula } from '@/components/videoaulas/TrilhaAula';
import { useVideoaulaResumo, type AulaCtxInput } from '@/hooks/useVideoaulaAcao';
import { limparTitulo, getCatalogo } from '@/lib/videoaulasCatalogos';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { useVideoaulaView } from '@/hooks/useVideoaulaView';
import { VideoaulaSidebarDesktop } from '@/components/videoaulas/view/VideoaulaSidebarDesktop';
import { VideoaulaPanoramaIA } from '@/components/videoaulas/view/VideoaulaPanoramaIA';
import { VideoaulaPlayerHeader } from '@/components/videoaulas/view/VideoaulaPlayerHeader';
import { VideoaulaResumeDialog } from '@/components/videoaulas/view/VideoaulaResumeDialog';
import { VideoaulaMateriaisCompletos } from '@/components/videoaulas/view/VideoaulaMateriaisCompletos';
import { findVideoaulaByVideoId } from '@/data/videoaulas/videoaulasDriveData';
import { QuestoesPanel } from '@/components/videoaulas/acoes/VideoaulaQuestoesPanel';
import { FlashcardsPanel } from '@/components/videoaulas/acoes/VideoaulaEstudoPanels';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';

type AbaVideoaula = 'materiais' | 'questoes' | 'flashcards' | 'resumo' | 'transcricao' | 'anotacoes';

const VideoaulaView = () => {
  const { catalogo: catalogoId, area: areaSlug, videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { tocarVideo, tempo, duracao, setTocandoState, seek } = useVideoaulasPlayer();

  const state = useVideoaulaView({ catalogoId, videoId, userId, setTocandoState });
  const driveItem = useMemo(() => findVideoaulaByVideoId(videoId), [videoId]);

  const [activeTab, setActiveTab] = useState<AbaVideoaula>('materiais');
  const [showAnotacoes, setShowAnotacoes] = useState(false);
  const [podeResumir, setPodeResumir] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const displayDuracao = duracao > 0 ? duracao : (state.aula?.duracao_segundos || 0);
  const pctAtual = displayDuracao > 0 ? Math.min(100, Math.round((tempo / displayDuracao) * 100)) : 0;

  useEffect(() => {
    if (state.aula && (!state.carregado || state.aula.video_id !== videoId)) {
      tocarVideo({
        id: state.aula.id,
        video_id: state.aula.video_id,
        titulo: state.aula.titulo,
        area: state.aula.area,
        descricao: state.aula.descricao,
        thumb: state.aula.thumb,
        thumbnail: state.aula.thumbnail,
        catalogoId,
        areaSlug,
        tempoInicial: state.inicio,
      });
    }
  }, [state.aula, catalogoId, areaSlug, tocarVideo, videoId, state.carregado, state.inicio]);

  useEffect(() => {
    const t = window.setTimeout(() => setPodeResumir(true), 600);
    return () => window.clearTimeout(t);
  }, [videoId]);

  const tituloLimpo = useMemo(
    () => (state.aula?.titulo ? limparTitulo(state.aula.titulo) : driveItem?.titulo ? limparTitulo(driveItem.titulo) : 'Aula'),
    [state.aula?.titulo, driveItem?.titulo],
  );

  const catalogoEfetivo = useMemo(() => {
    return state.catalogo ?? getCatalogo(catalogoId) ?? getCatalogo('iniciante');
  }, [state.catalogo, catalogoId]);

  const input: AulaCtxInput | null = useMemo(() => {
    if (!catalogoEfetivo || !videoId) return null;
    return {
      tabela: catalogoEfetivo.tabela,
      videoId,
      titulo: tituloLimpo,
      area: state.aula?.area ?? catalogoEfetivo.titulo,
      descricao: state.aula?.sobre_aula || state.aula?.descricao || undefined,
    };
  }, [catalogoEfetivo, videoId, state.aula, tituloLimpo]);

  const resumo = useVideoaulaResumo(podeResumir ? input : null);

  const tituloHeader = useMemo(() => {
    if (!state.aulasDaArea.length || !videoId) return 'Aula';
    const idx = state.aulasDaArea.findIndex((a) => a?.video_id === videoId);
    if (idx !== -1) return `Aula ${idx + 1}`;
    if (driveItem?.numero) return `Aula ${driveItem.numero}`;
    return 'Aula';
  }, [state.aulasDaArea, videoId, driveItem?.numero]);

  // Questões e Flashcards formatados diretamente do catálogo oficial (0ms)
  const driveQuestoes = useMemo(() => {
    if (!driveItem?.questoes) return [];
    return driveItem.questoes.map((q) => ({
      enunciado: q.enunciado,
      a: q.opcoes[0] || '',
      b: q.opcoes[1] || '',
      c: q.opcoes[2] || '',
      d: q.opcoes[3] || '',
      gabarito: q.correta,
      comentario: q.explicacao,
    }));
  }, [driveItem]);

  const driveCards = useMemo(() => {
    if (!driveItem?.flashcards) return [];
    return driveItem.flashcards.map((f) => ({
      frente: f.frente,
      verso: f.verso,
    }));
  }, [driveItem]);

  const toggleFavorito = async () => {
    if (!userId || !catalogoEfetivo || !state.aula) return;
    haptic.selection();
    try {
      if (state.favorito) {
        await supabase
          .from('videoaulas_favoritos')
          .delete()
          .eq('user_id', userId)
          .eq('tabela', catalogoEfetivo.tabela)
          .eq('video_id', state.aula.video_id);
        state.setFavorito(false);
        toast.info('Aula removida dos favoritos.');
      } else {
        await supabase.from('videoaulas_favoritos').insert({
          user_id: userId,
          tabela: catalogoEfetivo.tabela,
          registro_id: String(state.aula.id),
          video_id: state.aula.video_id,
          titulo: tituloLimpo,
          area: state.aula.area ?? null,
          thumb: state.aula.thumb ?? state.aula.thumbnail ?? null,
        });
        state.setFavorito(true);
        toast.success('Aula adicionada aos favoritos!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao atualizar favoritos.');
    }
  };

  const marcarConcluida = async () => {
    haptic.selection();
    try {
      if (state.concluida) {
        state.setConcluida(false);
        if (userId && catalogoEfetivo && videoId) {
          await supabase
            .from('videoaulas_progresso')
            .update({ concluida: false })
            .eq('user_id', userId)
            .eq('tabela', catalogoEfetivo.tabela)
            .eq('video_id', videoId);
        }
        toast('Marcação de aula removida.');
      } else {
        state.setConcluida(true);
        if (userId && catalogoEfetivo && videoId) {
          await supabase
            .from('videoaulas_progresso')
            .upsert({
              user_id: userId,
              tabela: catalogoEfetivo.tabela,
              registro_id: String(state.aula?.id || driveItem?.id || videoId),
              video_id: videoId,
              concluida: true,
              tempo_atual: tempo || 0,
            });
        }
        toast.success('Aula marcada como concluída.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar progresso da aula.');
    }
  };

  const handleCopiarTranscricao = () => {
    if (!driveItem?.transcricao) return;
    haptic.selection();
    void navigator.clipboard.writeText(driveItem.transcricao);
    setCopiado(true);
    toast.success('Transcrição copiada para a área de transferência!');
    setTimeout(() => setCopiado(false), 2500);
  };

  const shareWhatsApp = () => {
    const nome = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Alguém';
    const area = state.aula?.area || catalogoEfetivo?.titulo || 'Direito';
    const text = encodeURIComponent(`${nome} recomendou esta aula sobre ${area} no Direito Prime:\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const nome = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Alguém';
    const area = state.aula?.area || catalogoEfetivo?.titulo || 'Direito';
    const text = encodeURIComponent(`${nome} recomendou esta aula sobre ${area} no Direito Prime:`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleAlertClose = (v: boolean) => {
    if (!v) state.setShowResumePrompt({ show: false, tempo: 0 });
  };

  if (!videoId) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Aula não encontrada.</p>
      </div>
    );
  }

  // Lista de abas para o Menu de Alternância
  const abasDisponiveis: Array<{ id: AbaVideoaula; label: string; icon: any; count?: number | string }> = [
    { id: 'materiais', label: 'Materiais & PDFs', icon: FileText, count: driveItem ? 4 : undefined },
    { id: 'questoes', label: 'Questões', icon: ListChecks, count: driveQuestoes.length || undefined },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, count: driveCards.length || undefined },
    { id: 'resumo', label: 'Resumo & Panorama', icon: BookOpenText },
    { id: 'transcricao', label: 'Transcrição', icon: Subtitles },
    { id: 'anotacoes', label: 'Minhas Anotações', icon: PenTool },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24 lg:pb-16 selection:bg-rose-500/30">
      {/* Header Superior Limpo */}
      <PageHeader
        title={tituloHeader}
        subtitle={state.aula?.area ?? catalogoEfetivo?.titulo ?? 'Videoaulas'}
        onBack={() => {
          haptic.selection();
          if (catalogoId === 'iniciante') {
            navigate('/videoaulas/iniciante');
          } else if (areaSlug && areaSlug !== 'todas') {
            navigate(`/videoaulas/${catalogoEfetivo?.id || 'areas'}/${areaSlug}`);
          } else {
            navigate(`/videoaulas/${catalogoEfetivo?.id || 'areas'}`);
          }
        }}
      />

      <div className="w-full 2xl:max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 lg:pt-4 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Coluna Principal: Player e Menu de Alternância */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
          {/* Player & Informações do Topo */}
          <div className="space-y-3.5">
            <VideoaulaPlayerHeader
              tempo={tempo}
              displayDuracao={displayDuracao}
              pctAtual={pctAtual}
              tituloLimpo={tituloLimpo}
            />

            {/* Ações Rápidas (Visto, Favoritar, Compartilhar) */}
            <div className="flex items-center gap-2 px-1 sm:px-2 w-full overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={marcarConcluida}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl border text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm',
                  state.concluida
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-emerald-500/40 hover:text-white',
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {state.concluida ? 'Concluída' : 'Marcar como visto'}
              </button>

              <button
                type="button"
                onClick={toggleFavorito}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl border text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm',
                  state.favorito
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
                    : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-rose-500/40 hover:text-white',
                )}
              >
                <Heart className={cn('w-4 h-4', state.favorito && 'fill-current text-rose-500')} />
                {state.favorito ? 'Favorita' : 'Favoritar'}
              </button>

              <Drawer>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-blue-500/40 transition-all text-xs sm:text-[13px] font-bold active:scale-95 whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    Compartilhar
                  </button>
                </DrawerTrigger>
                <DrawerContent className="bg-zinc-950 border-t border-white/10 p-5 text-white">
                  <DrawerHeader className="p-0 pb-4">
                    <DrawerTitle className="text-base font-bold">Compartilhar Aula</DrawerTitle>
                    <DrawerDescription className="text-xs text-zinc-400">
                      Envie para amigos ou colegas de estudo
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={shareWhatsApp}
                      className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-950/50"
                    >
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={shareTelegram}
                      className="h-12 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-sky-950/50"
                    >
                      <span>Telegram</span>
                    </button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            {/* Trilha de Etapas da Aula */}
            <div className="px-1 sm:px-2 py-1 space-y-1.5">
              <p className="text-[10.5px] uppercase tracking-wider text-zinc-400 font-bold pl-0.5">
                Etapas para Conclusão
              </p>
              <TrilhaAula
                videoId={videoId}
                concluida={state.concluida}
                pctAtual={pctAtual}
                onMarcarConcluida={marcarConcluida}
              />
            </div>
          </div>

          {/* MENU DE ALTERNÂNCIA (SUBSTITUI O ANTIGO RODAPÉ) */}
          <div className="sticky top-[56px] z-30 -mx-2 sm:-mx-4 lg:mx-0 px-2 sm:px-4 lg:px-0 py-2.5 bg-[#0D0D0D]/95 backdrop-blur-xl border-y border-white/10 shadow-lg">
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {abasDisponiveis.map((aba) => {
                const Icon = aba.icon;
                const isActive = activeTab === aba.id;
                return (
                  <button
                    key={aba.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      if (aba.id === 'anotacoes') {
                        setShowAnotacoes(true);
                      } else {
                        setActiveTab(aba.id);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 cursor-pointer select-none',
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 border border-red-400/40'
                        : 'bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white',
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{aba.label}</span>
                    {aba.count !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-black',
                          isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400',
                        )}
                      >
                        {aba.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTEÚDO DA ABA SELECIONADA */}
          <div className="mt-2 min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* ABA 1: MATERIAIS & PDFs */}
              {activeTab === 'materiais' && (
                <motion.div
                  key="tab-materiais"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {driveItem ? (
                    <VideoaulaMateriaisCompletos item={driveItem} />
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-zinc-400 text-sm">
                      Nenhum material adicional cadastrado para esta aula.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ABA 2: QUESTÕES COMENTADAS */}
              {activeTab === 'questoes' && (
                <motion.div
                  key="tab-questoes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
                    <h3 className="font-sans text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Questões Comentadas da Aula</span>
                    </h3>
                    <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      {driveQuestoes.length} Questões
                    </span>
                  </div>

                  {driveQuestoes.length > 0 ? (
                    <QuestoesPanel questoes={driveQuestoes} />
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-zinc-400 text-sm">
                      Nenhuma questão disponível para esta aula no momento.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ABA 3: FLASHCARDS INTERATIVOS */}
              {activeTab === 'flashcards' && (
                <motion.div
                  key="tab-flashcards"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
                    <h3 className="font-sans text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Flashcards de Fixação</span>
                    </h3>
                    <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      {driveCards.length} Cards
                    </span>
                  </div>

                  {driveCards.length > 0 ? (
                    <div className="py-4">
                      <FlashcardsPanel cards={driveCards} />
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-zinc-400 text-sm">
                      Nenhum flashcard disponível para esta aula no momento.
                    </div>
                  )}
                </motion.div>
              )}

              {/* ABA 4: RESUMO & PANORAMA */}
              {activeTab === 'resumo' && (
                <motion.div
                  key="tab-resumo"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
                    <h3 className="font-sans text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>Panorama & Síntese da Aula</span>
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md">
                    <VideoaulaPanoramaIA
                      resumo={resumo.data?.resumo}
                      sobreAula={state.aula?.sobre_aula}
                      descricao={state.aula?.descricao}
                      isLoading={resumo.isLoading}
                    />
                  </div>
                </motion.div>
              )}

              {/* ABA 5: TRANSCRIÇÃO COMPLETA */}
              {activeTab === 'transcricao' && (
                <motion.div
                  key="tab-transcricao"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
                    <h3 className="font-sans text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-4.5 rounded-full bg-purple-400 shrink-0" />
                      <span>Transcrição Integral do Áudio</span>
                    </h3>
                    {driveItem?.transcricao && (
                      <button
                        type="button"
                        onClick={handleCopiarTranscricao}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-white/10 transition-all active:scale-95"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>

                  {driveItem?.transcricao ? (
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-6 text-sm text-zinc-300 leading-relaxed whitespace-pre-line space-y-3 font-body">
                      {driveItem.transcricao}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-zinc-400 text-sm">
                      Transcrição não disponível para esta aula.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna Direita: Playlist da Matéria (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <VideoaulaSidebarDesktop
            aulasDaArea={state.aulasDaArea}
            videoId={videoId}
            catalogoId={catalogoEfetivo.id}
            areaSlug={areaSlug}
          />
        </div>
      </div>

      {/* Diálogo de Retomada de Tempo */}
      <VideoaulaResumeDialog
        open={state.showResumePrompt.show}
        tempo={state.showResumePrompt.tempo}
        onOpenChange={handleAlertClose}
        onRestart={() => {
          state.setInicio(0);
          seek(0);
          setTocandoState(true);
          state.setShowResumePrompt({ show: false, tempo: 0 });
        }}
        onResume={() => {
          state.setInicio(state.showResumePrompt.tempo);
          seek(state.showResumePrompt.tempo);
          setTocandoState(true);
          state.setShowResumePrompt({ show: false, tempo: 0 });
        }}
      />

      {/* Sheet de Anotações do Estudante */}
      <AnotacoesAulaSheet
        open={showAnotacoes}
        onClose={() => setShowAnotacoes(false)}
        videoId={videoId ?? ''}
        aulaTitulo={tituloLimpo}
        areaSlug={areaSlug}
      />
    </div>
  );
};

export default VideoaulaView;
