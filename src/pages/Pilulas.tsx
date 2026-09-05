import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Pill, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { PilulaClassicoItem } from './pilulas/components/PilulaClassicoItem';
import { containerVariants, itemVariants } from './pilulas/data/pilulaAnimations';

export default function Pilulas() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const { data: livros = [], isLoading: loading } = useQuery<LivroNormalizado[]>({
    queryKey: ['pilulas', 'classicos'],
    queryFn: async () => {
      const classicosCol = COLECOES.find((c) => c.id === 'classicos');
      if (!classicosCol) return [];

      const { data, error } = await supabase
        .from(classicosCol.table as any)
        .select(classicosCol.select)
        .order('id');

      if (error) throw error;
      return (data || []).map((row) => normalizeLivro(row, classicosCol));
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24 // 24 horas
  });

  const livrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return livros;
    return livros.filter(
      (l) =>
        l.titulo.toLowerCase().includes(termo) ||
        (l.autor && l.autor.toLowerCase().includes(termo))
    );
  }, [livros, busca]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-white pb-32 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        {/* Header Fixo */}
        <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                haptic.selection();
                navigate(-1);
              }}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Pílulas de Clássicos
              </h1>
              <p className="text-xs text-white/50">Aprenda a essência dos clássicos em minutos</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar clássicos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Lista de Livros */}
        <div className="px-4 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
              <p className="text-sm">Carregando acervo...</p>
            </div>
          ) : livrosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center">
              <BookOpen className="w-12 h-12 opacity-20 mb-4" />
              <p className="text-sm">Nenhuma pílula encontrada.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-3"
            >
              {livrosFiltrados.map((livro) => (
                <PilulaClassicoItem 
                  key={livro.id} 
                  livro={livro} 
                  itemVariants={itemVariants} 
                  navigate={navigate} 
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
