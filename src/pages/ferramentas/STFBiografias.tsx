import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/PageHeader';

export default function STFBiografias() {
  const navigate = useNavigate();
  const [ministros, setMinistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBiografias = async () => {
      // Fetch posts from blog_edicao_posts with category STF or containing 'Ministro'
      // Adjust this query based on how biographies are categorized in the blog
      const { data, error } = await supabase
        .from('blog_edicao_posts')
        .select('*')
        .eq('publicado', true)
        .ilike('titulo', '%Ministro%')
        .order('created_at', { ascending: false });

      if (data) {
        setMinistros(data);
      }
      setLoading(false);
    };

    fetchBiografias();
  }, []);

  const handleBack = () => {
    haptic.selection();
    navigate(-1);
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      {/* Botão de Voltar Premium */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 flex items-center justify-center w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors focus-visible:outline-none"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>

      <div className="absolute inset-0 z-0 opacity-40">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(168, 85, 247, 0.15)'
          hoverFillColor='rgba(168, 85, 247, 0.2)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 pt-24 px-6 md:px-12 mx-auto w-full max-w-[1000px]">
        <div className="mb-10">
          <h2 className="font-serif italic text-4xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg mb-3">
            Biografias dos Ministros
          </h2>
          <p className="text-purple-200 text-base font-body leading-relaxed max-w-xl">
            Conheça o histórico, as decisões notórias e a trajetória dos Ministros do Supremo Tribunal Federal.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ministros.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5">
            <User className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Nenhuma biografia encontrada no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ministros.map((ministro, index) => (
              <motion.div
                key={ministro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col rounded-3xl bg-zinc-900/80 backdrop-blur-sm border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all shadow-xl"
              >
                {ministro.imagem_url ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img 
                      src={`https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/${ministro.imagem_url}`} 
                      alt={ministro.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  </div>
                ) : (
                  <div className="h-32 bg-purple-900/20 flex items-center justify-center">
                    <User className="w-12 h-12 text-purple-500/50" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {ministro.titulo}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4">
                    {ministro.resumo || 'Clique para ler a biografia completa e histórico do Ministro.'}
                  </p>
                  <button 
                    className="flex items-center gap-2 text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" /> Ler Biografia Completa
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
