import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { TEMAS, TEMA_COLORS, type BlogTema, type BlogPost } from '@/data/blogPosts';
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
    return temas && temas.length > 0 ? temas : [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [temas]);

  const temasFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return sortedTemas;
    const q = termoBusca.toLowerCase().trim();
    return sortedTemas.filter((tema) => {
      if (tema.toLowerCase().includes(q)) return true;
      // Procura também nos títulos dos artigos pertencentes à categoria
      return posts?.some((p) => p.tema === tema && p.titulo.toLowerCase().includes(q));
    });
  }, [sortedTemas, termoBusca, posts]);

  return (
    <section className="w-full pt-2 pb-6 max-w-7xl mx-auto px-4">
      {/* Header da Seção Idêntico ao Audiobook */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-red-400 font-bold">
          ACERVO DO BLOG JURÍDICO
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1 h-6 rounded-full bg-red-600" />
          <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
            Todas as Categorias
          </h2>
        </div>
        <p className="text-sm text-white/60 mt-1 ml-3 truncate">
          Toque em qualquer categoria para abrir os artigos, doutrinas e jurisprudências.
        </p>
      </div>

      {/* Campo de Busca Rápida Idêntico ao Audiobook */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Buscar categoria, área ou tema…"
          className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-red-500/60 transition-colors shadow-sm"
        />
        {termoBusca && (
          <button
            type="button"
            onClick={() => setTermoBusca('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Listagem de Categorias — Padrão Fiel ao Layout de Audiobooks */}
      {temasFiltrados.length === 0 ? (
        <div className="py-14 text-center text-white/60 text-sm bg-white/[0.02] border border-white/5 rounded-3xl px-4">
          Nenhuma categoria ou artigo encontrado com o termo informado.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {temasFiltrados.map((tema, index) => {
            const c = TEMA_COLORS[tema] || { chip: '#444', chipText: '#fff' };
            const firstPost = posts?.find((p) => p.tema === tema);
            const count = posts ? posts.filter((p) => p.tema === tema).length : 0;
            const isSelected = selectedCategory === tema;

            return (
              <motion.div
                key={tema}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.02, 0.25),
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  haptic.selection();
                  onSelectCategory(tema);
                }}
                className={`group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416] hover:bg-[#1A1A1E] border transition-colors text-left w-full relative overflow-hidden shadow-sm cursor-pointer select-none ${
                  isSelected
                    ? 'border-red-500/80 ring-1 ring-red-500/40 shadow-red-500/10'
                    : 'border-white/10 hover:border-red-500/40'
                }`}
              >
                {/* Capa Retangular Vertical à Esquerda (Padrão Livro/Audiobook) */}
                <div className="w-[72px] sm:w-[80px] h-[100px] sm:h-[110px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-md relative">
                  {firstPost?.imagem_url ? (
                    <BlogCoverImage
                      postId={firstPost.id}
                      remoteUrl={blogThumb(firstPost.imagem_url, 320)}
                      alt={`Capa da categoria: ${tema}`}
                      loading={index < 5 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${c.chip}25`, color: c.chip }}
                    >
                      <Layers className="w-8 h-8" />
                    </div>
                  )}

                  {/* Selo verde no topo da capinha */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-md animate-pulse" />
                  </div>
                </div>

                {/* Informações Centrais da Categoria — Título e Descrição de 1 Linha */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                  <p className="font-sans text-[14.5px] sm:text-[15.5px] font-bold text-white line-clamp-1 truncate leading-snug group-hover:text-red-400 transition-colors">
                    {tema}
                  </p>

                  <p className="mt-1 text-[11.5px] sm:text-[12px] text-white/50 line-clamp-1 truncate">
                    {firstPost?.titulo || 'Coleção de artigos autorais, súmulas e julgados'}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {/* Tag de Coleção */}
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-bold border border-white/10">
                      BLOG JURÍDICO
                    </span>

                    {/* Badge de Artigos */}
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <BookOpen className="w-2.5 h-2.5" />
                      {count} {count === 1 ? 'Artigo Gravado' : 'Artigos Gravados'}
                    </span>
                  </div>
                </div>

                {/* Botão de Ação à Direita com Pill LER idêntico ao OUVIR do Audiobook */}
                <div className="flex flex-col items-center justify-center py-1 pl-1 pr-1 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 group-hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm">
                    <BookOpen className="w-3 h-3" />
                    <span>LER</span>
                  </span>
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
