import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ExternalLink, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function STFNoticias() {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data, error } = await supabase
        .from('stf_noticias_folha')
        .select('*')
        .order('data_publicacao', { ascending: false })
        .limit(20);

      if (data) {
        setNoticias(data);
      }
      setLoading(false);
    };

    fetchNoticias();
  }, []);

  const handleBack = () => {
    haptic.selection();
    navigate(-1);
  };

  const openUrl = (url: string) => {
    haptic.selection();
    window.open(url, '_blank');
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

      <div className="relative z-10 pt-24 px-6 md:px-12 mx-auto w-full max-w-[800px]">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif italic text-4xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg mb-3">
              Últimas Notícias
            </h2>
            <p className="text-purple-200 text-base font-body leading-relaxed max-w-xl">
              Fique por dentro dos julgamentos e pautas mais recentes do STF através do nosso Radar de Notícias.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold tracking-wider text-purple-400 uppercase bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-500/20">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-2" />
            Ao Vivo
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : noticias.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5">
            <Newspaper className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Nenhuma notícia encontrada no momento.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {noticias.map((noticia, index) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openUrl(noticia.url)}
                className="group cursor-pointer p-5 sm:p-6 rounded-3xl bg-zinc-900/80 backdrop-blur-sm border border-white/5 hover:border-purple-500/40 hover:bg-zinc-800/80 transition-all shadow-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                    {noticia.data_publicacao 
                      ? formatDistanceToNow(new Date(noticia.data_publicacao), { addSuffix: true, locale: ptBR })
                      : 'Recente'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {noticia.titulo}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  {noticia.resumo}
                </p>
                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  Ler matéria original <ExternalLink className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
