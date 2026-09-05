import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { motion } from 'framer-motion';
import { BookOpenText, Play, Calendar, Video, FileText } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { CATALOGOS, ytThumb, limparTitulo } from '@/lib/videoaulasCatalogos';
import { getCachedAula } from '@/lib/videoaulasStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '@/services/offlineDb';
import type { CadernoDocument } from '@/components/videoaulas/AnotacoesAulaSheet';
import ReactMarkdown from 'react-markdown';

interface CadernoEntry {
  videoId: string;
  aulaTitulo: string;
  areaSlug: string;
  catalogoId: string;
  thumb: string;
  documento: CadernoDocument;
}

const VideoaulasAnotacoes = () => {
  const navigate = useNavigate();
  const [cadernos, setCadernos] = useState<CadernoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnotacoes = async () => {
      try {
        const entries: CadernoEntry[] = [];
        
        // Buscar todas as anotações do IndexedDB
        const keys = await db.aprenderCache.where('key').startsWith('videoaula:anotacoes:').toArray();
        
        for (const row of keys) {
          if (!row.payload) continue;
          
          try {
            const parsed = JSON.parse(row.payload) as CadernoDocument;
            
            if (parsed.texto && parsed.texto.trim() !== '') {
              const videoId = parsed.videoId;
              
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
                documento: parsed,
              });
            }
          } catch (e) {
            console.error('Erro ao parsear caderno', row.key, e);
          }
        }

        // Tentar migrar velhos do LocalStorage também (caso a pessoa abra a tela de lista antes de abrir a aula)
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('videoaula:anotacoes:')) {
            const videoId = key.split(':')[2];
            // Se já não carregamos via IndexedDB, trazemos e formatamos
            if (!entries.find(e => e.videoId === videoId)) {
              const raw = localStorage.getItem(key);
              if (raw) {
                try {
                  const parsedOld = JSON.parse(raw);
                  if (Array.isArray(parsedOld) && parsedOld.length > 0) {
                    const migratedText = parsedOld.map((n: any) => n.texto).reverse().join('\n\n---\n\n');
                    
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
                      documento: {
                        videoId,
                        texto: migratedText,
                        updated_at: parsedOld[0]?.created_at || new Date().toISOString(),
                      }
                    });
                  }
                } catch { /* noop */ }
              }
            }
          }
        }
        
        // Ordena por anotação mais recente globalmente
        entries.sort((a, b) => {
          const ultimaA = new Date(a.documento.updated_at).getTime();
          const ultimaB = new Date(b.documento.updated_at).getTime();
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

  const countLetras = cadernos.reduce((acc, curr) => acc + (curr.documento.texto?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title="Caderno do Aluno"
        subtitle={`${cadernos.length} caderno${cadernos.length !== 1 ? 's' : ''} • ~${Math.round(countLetras / 1000)}k caracteres`}
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
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-primary/20">
              <BookOpenText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 font-display">Seu Caderno está Vazio</h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Assista a uma videoaula e use o painel lateral para fazer anotações com texto formatado ou áudio transcrito.
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
              className="bg-card/40 border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:border-primary/40 transition-colors group/card"
            >
              {/* Header da Aula (Capa e Título) */}
              <div 
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${caderno.catalogoId}/${caderno.areaSlug}/${caderno.videoId}?anotacoes=true`);
                }}
                className="relative h-36 w-full cursor-pointer group"
              >
                <img src={caderno.thumb} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-white font-bold text-sm line-clamp-2 leading-snug drop-shadow-md font-display">
                      {caderno.aulaTitulo}
                    </p>
                    <p className="text-white/60 text-[11px] uppercase tracking-wider font-semibold mt-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-primary" /> Caderno Ativo
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(var(--primary),0.5)] group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Pré-visualização das Anotações (Markdown) */}
              <div 
                className="p-5 flex-1 bg-card/40 flex flex-col gap-3 cursor-pointer"
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${caderno.catalogoId}/${caderno.areaSlug}/${caderno.videoId}?anotacoes=true`);
                }}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-2">
                  <Calendar className="w-3.5 h-3.5 text-primary/70" />
                  Atualizado em {format(new Date(caderno.documento.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </div>
                
                <div className="prose prose-invert prose-p:leading-relaxed prose-sm line-clamp-[6] text-foreground/80 opacity-90 group-hover/card:opacity-100 transition-opacity">
                  <ReactMarkdown>{caderno.documento.texto}</ReactMarkdown>
                </div>
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
