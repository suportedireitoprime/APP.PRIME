import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Scale, Calendar, PlayCircle, Info, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function SessaoSTFDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['stf-session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stf_sessions')
        .select(`
          *,
          agendas:stf_session_agendas(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

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
      title="Sessão do STF"
      subtitle="Detalhes do Plenário"
      onBack={() => navigate(-1)}
    />
  );

  return (
    <DesktopPageLayout mobileHeader={mobileHeader} title="Sessão do STF">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-2">
              <Scale className="w-7 h-7 text-primary" />
              {isLoading ? <Skeleton className="w-48 h-8" /> : session?.title || 'Sessão não encontrada'}
            </h1>
            {!isLoading && session && (
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                <Calendar className="w-4 h-4" />
                {format(new Date(session.scheduled_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                <span>•</span>
                {getStatusBadge(session.status)}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="w-full h-48 rounded-xl" />
          </div>
        ) : !session ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Scale className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold">Sessão Não Encontrada</h3>
              <p className="text-muted-foreground max-w-sm mt-2">Não foi possível carregar os detalhes desta sessão.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate('/ferramentas/stf')}>Voltar para Sessões</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Player Area */}
            <Card className="overflow-hidden border-border/50 shadow-xl bg-black">
              <div className="w-full aspect-video relative">
                {session.status === 'scheduled' || !session.youtube_video_id ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20">
                    <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-lg">Transmissão em Breve</p>
                    <p className="text-muted-foreground/60 text-sm mt-2 text-center max-w-md">
                      A transmissão estará disponível aqui no horário agendado.
                    </p>
                  </div>
                ) : (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${session.youtube_video_id}?autoplay=${session.status === 'live' ? 1 : 0}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </Card>

            {/* Enturmação / Descrição */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-6">
                <Card className="bg-primary/5 border-primary/20 h-full">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3 text-primary">
                      <Info className="w-5 h-5" />
                      Entendendo a Sessão
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {session.description || 
                      'Nesta sessão do plenário do Supremo Tribunal Federal, os ministros se reúnem para julgar as pautas listadas. Acompanhe os debates e as decisões finais ao vivo.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pauta */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-xl font-bold border-b border-border/50 pb-2 flex items-center justify-between">
                  Pauta de Julgamentos
                  <Badge variant="secondary" className="font-normal">{session.agendas?.length || 0} processos</Badge>
                </h2>
                
                {!session.agendas || session.agendas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    Nenhuma pauta registrada para esta sessão até o momento.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {session.agendas
                      .sort((a: { order_index?: number | null }, b: { order_index?: number | null }) => (a.order_index || 0) - (b.order_index || 0))
                      .map((agenda: { id: string; process_number?: string | null; status?: string | null; theme?: string | null; relator?: string | null }) => (
                      <Card key={agenda.id} className="bg-card hover:bg-muted/30 transition-colors border-border/50">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                            <span className="font-bold text-base text-primary font-display">{agenda.process_number}</span>
                            {agenda.status && <Badge variant="outline" className="bg-background">{agenda.status}</Badge>}
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{agenda.theme}</p>
                          {agenda.relator && (
                            <div className="mt-3 text-xs text-muted-foreground bg-muted/40 inline-flex px-2 py-1 rounded-md">
                              Relator: <strong className="ml-1 text-foreground/80">{agenda.relator}</strong>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
