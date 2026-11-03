import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight, Layers } from 'lucide-react';
import { TEMAS, type BlogTema, type BlogPost } from '@/data/blogPosts';
import { haptic } from '@/lib/nativeHaptics';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';

interface BlogCategoriasListSectionProps {
  posts: BlogPost[];
  selectedCategory: string | null;
  onSelectCategory: (tema: BlogTema | string) => void;
  temas?: string[];
}

export const BlogCategoriasListSection: React.FC<BlogCategoriasListSectionProps> = ({
  posts,
  selectedCategory,
  onSelectCategory,
  temas,
}) => {
  const [termoBusca, setTermoBusca] = useState('');

  const sortedTemas = useMemo(() => {
    return temas && temas.length > 0
      ? temas
      : [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [temas]);

  const temasFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return sortedTemas;
    const q = termoBusca.toLowerCase().trim();
    return sortedTemas.filter((tema) => {
      if (tema.toLowerCase().includes(q)) return true;
      return posts?.some((p) => p.tema === tema && p.titulo.toLowerCase().includes(q));
    });
  }, [sortedTemas, termoBusca, posts]);

  return (
    <section className="w-full pt-1 pb-8">
      {/* Header da Seção: Elegante e Humanizado */}
      <div className="mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-red-600 shrink-0" />
          <h2 className="font-sans text-base sm:text-lg font-bold uppercase tracking-wider text-white">
            Todas as Categorias
          </h2>
        </div>
        <p className="text-xs sm:text-[13px] text-white/50 ml-3 mt-0.5">
          Explore os artigos organizados por áreas e temas do Direito
        </p>
      </div>

      {/* Campo de Busca Rápida: Design Limpo com Margem Elegante */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Buscar categoria ou tema..."
          className="w-full pl-10 pr-10 h-12 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/35 focus:outline-none focus:border-red-500/50 transition-colors"
        />
        {termoBusca && (
          <button
            type="button"
            onClick={() => setTermoBusca('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Listagem de Categorias: Design Editorial Sem Visual de IA */}
      {temasFiltrados.length === 0 ? (
        <div className="py-12 text-center text-white/50 text-sm bg-white/[0.02] border border-white/5 rounded-2xl px-4">
          Nenhuma categoria ou artigo encontrado com o termo informado.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {temasFiltrados.map((tema, index) => {
            const firstPost = posts?.find((p) => p.tema === tema);
            const count = posts ? posts.filter((p) => p.tema === tema).length : 0;
            const isSelected = selectedCategory === tema;

            return (
              <motion.div
                key={tema}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(index * 0.02, 0.2),
                }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  haptic.selection();
                  onSelectCategory(tema);
                }}
                className={`group flex items-center gap-4 p-3 sm:p-3.5 rounded-2xl bg-[#141417] hover:bg-[#19191E] border transition-all text-left w-full cursor-pointer select-none ${
                  isSelected
                    ? 'border-red-500/70 ring-1 ring-red-500/30'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Capa Retangular Vertical à Esquerda */}
                <div className="w-[68px] sm:w-[76px] h-[92px] sm:h-[100px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-sm relative">
                  {firstPost?.imagem_url ? (
                    <BlogCoverImage
                      postId={firstPost.id}
                      remoteUrl={blogThumb(firstPost.imagem_url, 320)}
                      alt={tema}
                      loading={index < 5 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30">
                      <Layers className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Informações Centrais: Título e Contagem Limpa Sem Tags de IA */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                  <h3 className="font-sans text-[15px] sm:text-[16px] font-bold text-white line-clamp-1 truncate leading-snug group-hover:text-red-400 transition-colors">
                    {tema}
                  </h3>

                  {firstPost?.titulo && (
                    <p className="mt-1 text-xs text-white/50 line-clamp-1 truncate">
                      {firstPost.titulo}
                    </p>
                  )}

                  {/* Quantidade de artigos: Tipografia limpa, discreta e elegante (sem fundo verde, sem tag de blog jurídico) */}
                  <p className="mt-1.5 text-[11.5px] sm:text-xs text-white/40 font-medium flex items-center gap-1.5">
                    <span>{count} {count === 1 ? 'artigo disponível' : 'artigos disponíveis'}</span>
                  </p>
                </div>

                {/* Seta discreta e elegante à direita */}
                <div className="pr-1 sm:pr-2 text-white/30 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BlogCategoriasListSection;
