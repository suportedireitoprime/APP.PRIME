import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { fetchCanalData, CanalData } from '@/lib/youtubeApi';
import { Play, ListVideo, Radio, AlertCircle } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export default function VideoaulasCanalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CanalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const openVideo = (videoId: string) => {
    haptic.selection();
    // Simples redirecionamento ou abertura do player, vamos apenas abrir o YT por enquanto
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const openPlaylist = (playlistId: string) => {
    haptic.selection();
    window.open(`https://www.youtube.com/playlist?list=${playlistId}`, '_blank');
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      <PageHeader title={titulo} onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 lg:max-w-[1200px]">
          {loading ? (
            <div className="space-y-8 animate-pulse">
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
            <div className="space-y-10">
              {/* Ao Vivo */}
              {data.aoVivo && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <h2 className="text-lg font-extrabold text-foreground uppercase tracking-widest">
                      Ao Vivo Agora
                    </h2>
                  </div>
                  <div 
                    onClick={() => openVideo(data.aoVivo!.id)}
                    className="relative cursor-pointer group rounded-2xl overflow-hidden border border-border/80 bg-card shadow-sm hover:border-red-500/50 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-video w-full bg-muted">
                      <img src={data.aoVivo.thumbnail} alt={data.aoVivo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                        <Radio className="w-4 h-4" />
                        AO VIVO
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
                          {data.aoVivo.title}
                        </h3>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm shadow-xl">
                          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Últimos Vídeos */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-extrabold text-foreground uppercase tracking-widest">
                    Últimos Vídeos
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.ultimosVideos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video.id)}
                      className="group cursor-pointer rounded-xl bg-card border border-border/60 overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-md flex flex-col"
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Playlists */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ListVideo className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-extrabold text-foreground uppercase tracking-widest">
                    Playlists
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.playlists.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => openPlaylist(pl.id)}
                      className="group flex gap-3 p-2 cursor-pointer rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md items-center"
                    >
                      <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-y-0 right-0 w-8 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                          <ListVideo className="w-4 h-4 mb-0.5" />
                          <span className="text-[10px] font-bold">{pl.itemCount}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {pl.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
