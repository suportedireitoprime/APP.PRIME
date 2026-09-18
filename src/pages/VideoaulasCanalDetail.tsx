import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { fetchCanalData, CanalData } from '@/lib/youtubeApi';
import { Play, ListVideo, Radio, AlertCircle, X, Info } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export default function VideoaulasCanalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CanalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playingVideo, setPlayingVideo] = useState<YoutubeVideo | null>(null);

  const canalNomes: Record<string, string> = {
    'stf': 'Supremo Tribunal Federal',
    'camara': 'Câmara dos Deputados',
    'senado': 'Senado Federal',
  };

  const titulo = canalNomes[id || ''] || 'Canal Oficial';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchCanalData(id || '');
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const openVideo = (video: YoutubeVideo) => {
    haptic.selection();
    setPlayingVideo(video);
  };

  const openPlaylist = (playlistId: string) => {
    haptic.selection();
    window.open(`https://www.youtube.com/playlist?list=${playlistId}`, '_blank');
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      <PageHeader title={titulo} onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pb-32">
        {loading ? (
          <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 lg:max-w-[1200px] space-y-8 animate-pulse">
            <div className="h-40 bg-muted rounded-2xl w-full" />
            <div className="grid grid-cols-2 gap-4"><div className="h-24 bg-muted rounded-2xl"/><div className="h-24 bg-muted rounded-2xl"/></div>
          </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Erro ao carregar canal</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : data && (
            <div className="space-y-8 pb-8">
              {/* Ao Vivo */}
              {data.aoVivo && (
                <section className="w-full">
                  <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-[1200px] flex items-center gap-2 mb-3 pt-4">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <h2 className="text-[13px] font-extrabold text-foreground uppercase tracking-widest">
                      Ao Vivo Agora
                    </h2>
                  </div>
                  <div className="mx-auto max-w-3xl sm:px-6 lg:max-w-[1200px]">
                    <div 
                      onClick={() => openVideo(data.aoVivo!)}
                      className="relative cursor-pointer group sm:rounded-2xl overflow-hidden border-y sm:border border-border/80 bg-card shadow-sm hover:border-red-500/50 hover:shadow-lg transition-all"
                    >
                      <div className="w-full bg-muted h-[200px] sm:h-[300px]">
                        <img src={data.aoVivo.thumbnail} alt={data.aoVivo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
                          <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                          Ao Vivo
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                          <p className="font-sans text-white font-bold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-md">
                            {data.aoVivo.title}
                          </p>
                          {data.aoVivo.description && (
                            <p className="font-sans text-white/80 text-[11px] sm:text-xs mt-1 line-clamp-2 leading-relaxed">
                              {data.aoVivo.description}
                            </p>
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm shadow-xl">
                            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Últimos Vídeos */}
              <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-[1200px]">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-4 h-4 text-primary" />
                  <h2 className="text-[13px] font-extrabold text-foreground uppercase tracking-widest">
                    Últimos Vídeos
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {data.ultimosVideos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video)}
                      className="group cursor-pointer rounded-xl bg-card border border-border/60 overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-md flex items-center h-[100px] sm:h-[120px]"
                    >
                      <div className="h-full aspect-video relative overflow-hidden bg-muted shrink-0">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex-1 min-w-0 flex flex-col justify-center h-full">
                        <p className="font-sans text-[13px] sm:text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1.5">
                          {video.title}
                        </p>
                        <p className="font-sans text-[11px] text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Playlists */}
              <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-[1200px]">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <ListVideo className="w-4 h-4 text-primary" />
                  <h2 className="text-[13px] font-extrabold text-foreground uppercase tracking-widest">
                    Playlists Oficiais
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.playlists.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => openPlaylist(pl.id)}
                      className="group flex gap-3 p-2 cursor-pointer rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md items-center"
                    >
                      <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-y-0 right-0 w-8 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                          <ListVideo className="w-3.5 h-3.5 mb-0.5" />
                          <span className="text-[9px] font-bold">{pl.itemCount}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-sans text-[12px] sm:text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {pl.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        {/* Remover a tag extra </div> que fechava o container antigo */}
      </main>

      {/* Video Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto pb-safe">
          <div className="flex items-center justify-end p-4 pt-safe shrink-0">
            <button
              onClick={() => setPlayingVideo(null)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            <div className="w-full aspect-video bg-black shadow-2xl border-y sm:border border-white/10 sm:rounded-xl overflow-hidden shrink-0">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&playsinline=1`}
                title={playingVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="px-4 pb-12 w-full flex-1">
              <p className="font-sans text-white font-bold text-lg sm:text-xl leading-tight mb-2">
                {playingVideo.title}
              </p>
              {playingVideo.description && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="font-sans text-xs uppercase tracking-wider font-semibold">Descrição do Vídeo</span>
                  </div>
                  <p className="font-sans text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {playingVideo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
