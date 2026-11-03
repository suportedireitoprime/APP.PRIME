import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  History,
  BarChart3,
  Sparkles,
  BookOpen,
  Clock,
  ChevronRight,
  Flame,
  Award,
  Trash2,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import type { BlogPost, BlogTema } from '@/data/blogPosts';
import { TEMA_COLORS } from '@/data/blogPosts';
import { blogTracking, type BlogFavItem, type BlogRecenteItem } from '@/lib/blogTracking';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';
import type { BlogQuickActionType } from './BlogHeroPanel';

interface BlogQuickActionSheetProps {
  activeSheet: BlogQuickActionType | null;
  onClose: () => void;
  allPosts: BlogPost[];
  temas: string[];
  onSelectPost: (post: BlogPost) => void;
  onSelectTema: (tema: string) => void;
}

export const BlogQuickActionSheet: React.FC<BlogQuickActionSheetProps> = ({
  activeSheet,
  onClose,
  allPosts,
  temas,
  onSelectPost,
  onSelectTema,
}) => {
  const [tabAtiva, setTabAtiva] = useState<BlogQuickActionType>(activeSheet || 'favoritos');
  const [favoritos, setFavoritos] = useState<BlogFavItem[]>(() => blogTracking.getFavoritos());
  const [recentes, setRecentes] = useState<BlogRecenteItem[]>(() => blogTracking.getRecentes());
  const stats = blogTracking.getEstatisticas(allPosts.length);

  useEffect(() => {
    if (activeSheet) {
      setTabAtiva(activeSheet);
      setFavoritos(blogTracking.getFavoritos());
      setRecentes(blogTracking.getRecentes());
    }
  }, [activeSheet]);

  const removerFavorito = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact();
    const post = allPosts.find((p) => p.id === id);
    if (post) {
      blogTracking.toggleFavorito(post);
      setFavoritos(blogTracking.getFavoritos());
      toast.info(`"${post.titulo}" removido dos favoritos.`);
    }
  };

  const titles: Record<BlogQuickActionType, { title: string; subtitle: string }> = {
    favoritos: {
      title: 'Meus Favoritos',
      subtitle: 'Artigos e doutrinas salvos para consulta',
    },
    recentes: {
      title: 'Lidos Recentemente',
      subtitle: 'Histórico de artigos e continuidade de leitura',
    },
    estatisticas: {
      title: 'Minhas Estatísticas',
      subtitle: 'Tempo de estudo, artigos e evolução jurídica',
    },
    temas: {
      title: 'Temas & Categorias',
      subtitle: 'Explore o acervo pelas principais áreas do Direito',
    },
  };

  if (!activeSheet) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        {/* Backdrop Escuro com Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic.selection();
            onClose();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Sheet Principal Deslizando de Baixo */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-2xl mx-auto bg-[#0E0E11] border-t border-red-500/25 rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Alça visual de arrasto */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Cabeçalho do Sheet */}
          <div className="px-5 pt-2 pb-3 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.4} />
              </button>

              <div>
                <h3 className="font-sans font-bold text-base sm:text-lg text-white">
                  {titles[tabAtiva]?.title}
                </h3>
                <p className="text-[11.5px] sm:text-xs text-white/50 truncate max-w-[260px] sm:max-w-md">
                  {titles[tabAtiva]?.subtitle}
                </p>
              </div>
            </div>

            {/* Abas Superiores Rápidas */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('favoritos');
                }}
                className={`p-2 rounded-lg transition-all ${
                  tabAtiva === 'favoritos'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Favoritos"
              >
                <Heart className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('recentes');
                }}
                className={`p-2 rounded-lg transition-all ${
                  tabAtiva === 'recentes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Recentes"
              >
                <History className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('estatisticas');
                }}
                className={`p-2 rounded-lg transition-all ${
                  tabAtiva === 'estatisticas'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Estatísticas"
              >
                <BarChart3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('temas');
                }}
                className={`p-2 rounded-lg transition-all ${
                  tabAtiva === 'temas'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Temas"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo Dinâmico por Aba */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* ── ABA 1: FAVORITOS ── */}
            {tabAtiva === 'favoritos' && (
              <div>
                {favoritos.length === 0 ? (
                  <div className="py-16 text-center text-white/50 space-y-2">
                    <Heart className="w-12 h-12 mx-auto stroke-1 text-white/20" />
                    <p className="font-semibold text-white/70">Nenhum artigo favoritado ainda</p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                      Toque no coração de qualquer artigo para salvar no seu acervo pessoal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {favoritos.map((fav) => {
                      const post = allPosts.find((p) => p.id === fav.id);
                      return (
                        <div
                          key={`fav-${fav.id}`}
                          onClick={() => {
                            haptic.selection();
                            if (post) {
                              onSelectPost(post);
                              onClose();
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                            {fav.imagemUrl && (
                              <img
                                src={blogThumb(fav.imagemUrl, 160)}
                                alt={fav.titulo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-sans font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                              {fav.titulo}
                            </h4>
                            <p className="text-xs text-white/50 truncate mt-0.5">
                              {fav.autor} • {fav.tema}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-300 mt-1 font-semibold">
                              <Clock className="w-2.5 h-2.5" />
                              {fav.tempoLeituraMin} min de leitura
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => removerFavorito(fav.id, e)}
                            className="p-2 text-white/40 hover:text-rose-400 active:scale-95 transition-all"
                            title="Remover dos favoritos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA 2: RECENTES ── */}
            {tabAtiva === 'recentes' && (
              <div>
                {recentes.length === 0 ? (
                  <div className="py-16 text-center text-white/50 space-y-2">
                    <History className="w-12 h-12 mx-auto stroke-1 text-white/20" />
                    <p className="font-semibold text-white/70">Nenhuma leitura recente registrada</p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                      Seus artigos lidos aparecerão aqui automaticamente para você continuar de onde parou.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentes.map((rec) => {
                      const post = allPosts.find((p) => p.id === rec.id);
                      return (
                        <div
                          key={`rec-${rec.id}`}
                          onClick={() => {
                            haptic.selection();
                            if (post) {
                              onSelectPost(post);
                              onClose();
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                            {rec.imagemUrl && (
                              <img
                                src={blogThumb(rec.imagemUrl, 160)}
                                alt={rec.titulo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-sans font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                              {rec.titulo}
                            </h4>
                            <p className="text-xs text-white/50 truncate mt-0.5">
                              {rec.autor} • {rec.tema}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">
                              {new Date(rec.ts).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(rec.ts).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA 3: ESTATÍSTICAS ── */}
            {tabAtiva === 'estatisticas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                    <BookOpen className="w-6 h-6 mx-auto text-red-400 mb-1" />
                    <p className="text-2xl font-bold font-sans text-white">{stats.totalLidos}</p>
                    <p className="text-xs text-white/50">Artigos Lidos</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                    <Clock className="w-6 h-6 mx-auto text-amber-400 mb-1" />
                    <p className="text-2xl font-bold font-sans text-white">{stats.minutosTotais}m</p>
                    <p className="text-xs text-white/50">Tempo Estimado</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                    <Flame className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-bold font-sans text-white">{stats.streakDias} dias</p>
                    <p className="text-xs text-white/50">Ofensiva de Estudos</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                    <Award className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                    <p className="text-sm font-bold font-sans text-white truncate">{stats.temaFavorito}</p>
                    <p className="text-xs text-white/50">Área Predileta</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/30 via-black to-black border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-sans font-bold text-sm text-white">Acervo Dinâmico Sempre Disponível</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        Mais de {allPosts.length} artigos autorais sobre filosofia, STF, leis e jurisprudência.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA 4: TEMAS & CATEGORIAS ── */}
            {tabAtiva === 'temas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {temas.map((tema) => {
                  const count = allPosts.filter((p) => p.tema === tema).length;
                  const c = TEMA_COLORS[tema] || { chip: '#444', chipText: '#fff' };

                  return (
                    <div
                      key={`sheet-tema-${tema}`}
                      onClick={() => {
                        haptic.selection();
                        onSelectTema(tema);
                        onClose();
                      }}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-3 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.chip }}
                        />
                        <span className="font-sans font-bold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                          {tema}
                        </span>
                      </div>
                      <span className="text-xs text-white/40 font-semibold shrink-0">
                        {count} artigos
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BlogQuickActionSheet;
