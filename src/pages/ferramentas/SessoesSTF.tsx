import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
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

  const { data: session, isLoading } = useQuery({
    queryKey: ['latest-stf-session'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stf_sessions')
        .select(`
          *,
          agendas:stf_session_agendas(*)
        `)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
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
          // Invalidate query or just reload page for simplicity
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
        return <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>;
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
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              Sessões do Plenário
            </h1>
            <p className="text-muted-foreground mt-1">Acompanhe pautas e julgamentos ao vivo do Supremo Tribunal Federal.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
        ) : !session ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma Sessão Agendada</h3>
              <p className="text-muted-foreground max-w-sm mt-2">No momento não há sessões do plenário previstas ou em andamento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              
              {/* YouTube Player */}
              {session.youtube_video_id && (
                <div className="w-full aspect-video bg-black relative">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${session.youtube_video_id}?autoplay=${session.status === 'live' ? 1 : 0}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl leading-tight">{session.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.scheduled_at), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(session.status)}
                  </div>
                </div>
                {session.description && (
                  <p className="text-sm mt-4 text-muted-foreground border-l-2 border-primary/50 pl-3">
                    {session.description}
                  </p>
                )}
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Pauta de Julgamentos
              </h2>
              
              {session.agendas && session.agendas.length > 0 ? (
                <div className="grid gap-3">
                  {session.agendas
                    .sort((a: { order_index?: number | null }, b: { order_index?: number | null }) => (a.order_index || 0) - (b.order_index || 0))
                    .map((agenda: { id: string; process_number?: string | null; status?: string | null; theme?: string | null; relator?: string | null; parties?: string | null }) => (
                    <Card key={agenda.id} className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                          <span className="font-bold text-lg text-primary">{agenda.process_number}</span>
                          {agenda.status && (
                            <Badge variant="outline" className="w-fit">{agenda.status}</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{agenda.theme}</p>
                        {agenda.relator && (
                          <p className="text-xs text-muted-foreground mt-2">Relator: {agenda.relator}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/40">
                  A pauta ainda não foi disponibilizada para esta sessão.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
