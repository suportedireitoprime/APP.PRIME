import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Scale, Calendar, PlayCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function SessoesSTF() {
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['latest-stf-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stf_sessions')
        .select(`
          *,
          agendas:stf_session_agendas(*)
        `)
        .order('scheduled_at', { ascending: false })
        .limit(10);
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    }
  });

  // Enable Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stf_sessions' },
        (payload) => {
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">AO VIVO</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Agendada</Badge>;
      case 'finished':
        return <Badge variant="secondary">Encerrada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const mobileHeader = (
    <PageHeader
      title="Sessões do STF"
      subtitle="Acompanhe o Plenário"
      onBack={() => navigate(-1)}
    />
  );

  return (
    <DesktopPageLayout mobileHeader={mobileHeader} title="Sessões do STF">
      <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              Sessões do Plenário
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Acompanhe pautas e julgamentos ao vivo do Supremo Tribunal Federal.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Scale className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold">Nenhuma Sessão Encontrada</h3>
              <p className="text-muted-foreground max-w-sm mt-2">No momento não há sessões do plenário previstas ou registradas no histórico.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {sessions.map((session, index) => {
              const isLive = session.status === 'live';
              const isHighlight = index === 0; // Se a primeira é a mais importante (pode ser a live ou a mais recente)

              return (
                <div key={session.id} className="relative group cursor-pointer" onClick={() => navigate(`/ferramentas/stf/${session.id}`)}>
                  
                  <Card className={`border-border/50 shadow-md overflow-hidden bg-card/60 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-xl group-hover:-translate-y-1 ${isHighlight && isLive ? 'ring-2 ring-destructive/80' : ''}`}>
                    
                    {/* YouTube Thumbnail / Cover Area */}
                    <div className={`w-full bg-black relative ${isHighlight ? 'aspect-video md:aspect-[21/9]' : 'h-48'}`}>
                      {session.status === 'scheduled' || !session.youtube_video_id ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 border-b border-border/30 group-hover:bg-muted/40 transition-colors">
                          <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Ver Detalhes da Sessão</p>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                          <img 
                            src={`https://img.youtube.com/vi/${session.youtube_video_id}/maxresdefault.jpg`} 
                            alt={session.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                            <PlayCircle className={`w-16 h-16 ${isLive ? 'text-destructive' : 'text-white/80'} group-hover:text-white group-hover:scale-110 transition-all drop-shadow-lg`} />
                          </div>
                        </div>
                      )}
                      
                      {/* Top Right Live Badge Overlay if highlight video area */}
                      {isLive && (
                        <div className="absolute top-4 left-4 z-10">
                          <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)] px-3 py-1 text-xs">AO VIVO AGORA</Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="py-5">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className={`${isHighlight ? 'text-2xl' : 'text-xl'} leading-tight group-hover:text-primary transition-colors`}>
                            {session.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground font-medium">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(session.scheduled_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                        <div className="shrink-0 mt-2 md:mt-0">
                          {getStatusBadge(session.status)}
                        </div>
                      </div>
                      
                      {session.description && (
                        <p className="text-sm mt-4 text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      {/* Agenda preview chips */}
                      {session.agendas && session.agendas.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Pauta ({session.agendas.length} {session.agendas.length === 1 ? 'processo' : 'processos'})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {session.agendas
                              .sort((a: { order_index?: number | null }, b: { order_index?: number | null }) => (a.order_index || 0) - (b.order_index || 0))
                              .slice(0, 4)
                              .map((agenda: { id: string; process_number?: string | null; relator?: string | null }) => (
                                <div key={agenda.id} className="bg-muted/40 border border-border/30 rounded-lg px-3 py-1.5 text-xs">
                                  <span className="font-bold text-primary">{agenda.process_number}</span>
                                  {agenda.relator && (
                                    <span className="text-muted-foreground ml-1.5">· {agenda.relator}</span>
                                  )}
                                </div>
                              ))}
                            {session.agendas.length > 4 && (
                              <div className="bg-muted/40 border border-border/30 rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                                +{session.agendas.length - 4} mais
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
