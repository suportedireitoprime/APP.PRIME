import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { motion } from 'framer-motion';
import { BookOpenText, Mic, Play, AlignLeft, Calendar, Loader2, ChevronRight, Video } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { CATALOGOS, ytThumb, limparTitulo } from '@/lib/videoaulasCatalogos';
import { getCachedAula } from '@/lib/videoaulasStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnotacaoAula {
  id: string;
  texto: string;
  created_at: string;
  audio_url?: string | null;
}

interface CadernoEntry {
  videoId: string;
  aulaTitulo: string;
  areaSlug: string;
  catalogoId: string;
  thumb: string;
  anotacoes: AnotacaoAula[];
}

const VideoaulasAnotacoes = () => {
  const navigate = useNavigate();
  const [cadernos, setCadernos] = useState<CadernoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnotacoes = () => {
      try {
        const entries: CadernoEntry[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('videoaula:anotacoes:')) {
            const videoId = key.split(':')[2];
            const raw = localStorage.getItem(key);
            
            if (raw) {
              const parsed: AnotacaoAula[] = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Procurar metadata da aula nos catálogos
                let aulaTitulo = 'Aula Desconhecida';
                let areaSlug = 'todas';
                let catalogoId = 'areas';
                let thumb = ytThumb(videoId, 'hq');
                
                for (const cat of CATALOGOS) {
                  const aulaCache = getCachedAula(cat.id, videoId);
                  if (aulaCache) {
                    aulaTitulo = limparTitulo(aulaCache.titulo || 'Aula');
                    areaSlug = aulaCache.area ? aulaCache.area.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'todas';
                    catalogoId = cat.id;
                    thumb = aulaCache.thumb || aulaCache.thumbnail || thumb;
                    break;
                  }
                }

                entries.push({
                  videoId,
                  aulaTitulo,
                  areaSlug,
                  catalogoId,
                  thumb,
                  anotacoes: parsed.sort((a, b) => {
                    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return tB - tA;
                  }),
                });
              }
            }
          }
        }
        
        // Ordena por anotação mais recente globalmente
        entries.sort((a, b) => {
          const ultimaA = a.anotacoes[0]?.created_at ? new Date(a.anotacoes[0].created_at).getTime() : 0;
          const ultimaB = b.anotacoes[0]?.created_at ? new Date(b.anotacoes[0].created_at).getTime() : 0;
          return ultimaB - ultimaA;
        });

        setCadernos(entries);
      } catch (err) {
        console.error('Erro ao carregar anotações', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnotacoes();
  }, []);

  const totalNotas = cadernos.reduce((acc, curr) => acc + curr.anotacoes.length, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title="Caderno do Aluno"
        subtitle={`${totalNotas} anotações`}
        onBack={() => navigate('/videoaulas/painel')}
      />

      <div className="w-full 2xl:max-w-[1400px] mx-auto px-4 lg:px-8 pt-6">
        
        {/* Empty State */}
        {!loading && cadernos.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <BookOpenText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Caderno Vazio</h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Assista a uma videoaula e use o painel lateral para fazer anotações em texto ou áudio transcrito.
            </p>
          </motion.div>
        )}

        {/* Listagem Masonry/Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cadernos.map((caderno, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              key={caderno.videoId}
              className="bg-card/40 border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col"
            >
              {/* Header da Aula (Capa e Título) */}
              <div 
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${caderno.catalogoId}/${caderno.areaSlug}/${caderno.videoId}`);
                }}
                className="relative h-32 w-full cursor-pointer group"
              >
                <img src={caderno.thumb} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-white font-bold text-sm line-clamp-2 leading-snug">
                      {caderno.aulaTitulo}
                    </p>
                    <p className="text-white/60 text-[11px] uppercase tracking-wider font-semibold mt-1 flex items-center gap-1">
                      <Video className="w-3 h-3" /> {caderno.anotacoes.length} notas
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Lista de Anotações Internas */}
              <div className="p-5 flex-1 bg-card/40 flex flex-col gap-4">
                {caderno.anotacoes.slice(0, 3).map((nota) => {
                  const textoOriginal = nota.texto || '';
                  const isAudio = textoOriginal.includes('[Áudio Transcrito]');
                  const textoLimpo = textoOriginal.replace('🤖 [Áudio Transcrito]:', '').replace('🎙️ [Áudio Transcrito]:', '').trim();
                  
                  return (
                    <div key={nota.id} className="group relative pl-4 border-l-2 border-primary/20 hover:border-primary transition-colors">
                      <div className="flex items-center gap-2 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {isAudio ? <Mic className="w-3.5 h-3.5 text-blue-500" /> : <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />}
                        <Calendar className="w-3 h-3 ml-auto opacity-50" />
                        {nota.created_at ? format(new Date(nota.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : 'Sem data'}
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                        {textoLimpo}
                      </p>
                    </div>
                  );
                })}

                {caderno.anotacoes.length > 3 && (
                  <button className="w-full text-center py-2 mt-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
                    Ver mais {caderno.anotacoes.length - 3} anotações
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasAnotacoes;
