import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Highlighter, FileText, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Highlight } from '@/hooks/useHighlights';
import { useIsDesktop } from '@/hooks/use-desktop';

interface CadernoData {
  livroId: string;
  highlights: Highlight[];
}

const BibliotecaCaderno = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [dados, setDados] = useState<CadernoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      supabase
        .from('user_preferences')
        .select('highlights')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data?.highlights) {
            setDados([]);
          } else {
            const raw = data.highlights as unknown as Record<string, Highlight[]>;
            const parsed = Object.entries(raw).map(([livroId, highlights]) => ({
              livroId,
              highlights: highlights || [],
            })).filter(d => d.highlights.length > 0);
            
            setDados(parsed);
          }
          setLoading(false);
        });
    });
  }, []);

  return (
    <div className="min-h-dvh bg-background pb-[calc(96px+var(--sai-bottom,0px))]">
      {/* Header Mobile / Tablet */}
      <div className="md:hidden">
        <PageHeader title="Meu Caderno" onBack={() => navigate('/biblioteca')} />
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        <div className="hidden md:flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Highlighter className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Meu Caderno</h1>
            <p className="text-muted-foreground mt-1">Todos os seus grifos e marcações em um só lugar</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Buscando suas anotações...</p>
          </div>
        ) : dados.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-4"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground/50 mb-6">
              <Highlighter className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Caderno Vazio</h3>
            <p className="text-muted-foreground max-w-[280px]">
              Quando você fizer grifos e anotações nos livros e leis da biblioteca, eles aparecerão aqui.
            </p>
            <button
              onClick={() => navigate('/biblioteca')}
              className="mt-8 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              Explorar Biblioteca
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {dados.map((d) => (
                <motion.div
                  key={d.livroId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 md:p-5 bg-secondary/20 border-b border-border/50 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-foreground line-clamp-1 flex-1 capitalize">
                      {d.livroId.replace(/-/g, ' ')}
                    </h2>
                  </div>
                  <div className="p-4 md:p-5 space-y-4">
                    {d.highlights.map((h) => {
                      // fallback for color mapping if it's css class or rgba
                      const bgColor = h.color && h.color.startsWith('rgba') 
                        ? h.color.replace('0.42)', '1)') // make it solid
                        : 'var(--primary)';
                        
                      return (
                        <div key={h.id} className="relative group">
                          <div 
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-full opacity-60"
                            style={{ backgroundColor: bgColor }}
                          />
                          <div className="pl-4">
                            <p className="text-[15px] leading-relaxed text-foreground/90 italic">
                              "{h.text}"
                            </p>
                            {h.comment && (
                              <div className="mt-3 bg-secondary/40 p-3 rounded-xl border border-border/50 text-sm text-foreground/80">
                                <span className="font-bold text-primary mr-2">Nota:</span>
                                {h.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default BibliotecaCaderno;
