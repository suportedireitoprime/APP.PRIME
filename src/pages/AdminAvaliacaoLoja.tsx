import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Star, ThumbsUp, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';

interface AvaliacaoEvent {
  id: string;
  user_id: string;
  email: string;
  event_name: string;
  created_at: string;
  metadata: any;
}

export default function AdminAvaliacaoLoja() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<AvaliacaoEvent[]>([]);
  const [stats, setStats] = useState({
    totalExibido: 0,
    totalErro: 0,
    totalClick: 0
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_events')
      .select('*')
      .in('event_name', ['avaliacao_prompt_exibido', 'avaliacao_prompt_erro', 'avaliacao_loja_click'])
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
    } else if (data) {
      setEventos(data);
      setStats({
        totalExibido: data.filter(e => e.event_name === 'avaliacao_prompt_exibido').length,
        totalErro: data.filter(e => e.event_name === 'avaliacao_prompt_erro').length,
        totalClick: data.filter(e => e.event_name === 'avaliacao_loja_click').length,
      });
    }
    setLoading(false);
  };

  const getEventLabel = (eventName: string) => {
    if (eventName === 'avaliacao_prompt_exibido') return <span className="text-green-500 flex items-center gap-1"><Star size={14}/> API Sucesso (Exibido)</span>;
    if (eventName === 'avaliacao_prompt_erro') return <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={14}/> API Erro (Cota)</span>;
    if (eventName === 'avaliacao_loja_click') return <span className="text-blue-500 flex items-center gap-1"><ThumbsUp size={14}/> Clicou Manualmente</span>;
    return eventName;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <PageHeader title="Avaliação Loja" onBack={() => navigate('/admin-funcoes')} />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Sucesso (API)</span>
            <span className="text-3xl font-bold text-green-500">{stats.totalExibido}</span>
          </div>
          <div className="bg-card p-4 rounded-xl border flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Cliques Manuais</span>
            <span className="text-3xl font-bold text-blue-500">{stats.totalClick}</span>
          </div>
          <div className="bg-card p-4 rounded-xl border flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Erros (API/Cota)</span>
            <span className="text-3xl font-bold text-red-500">{stats.totalErro}</span>
          </div>
        </div>

        {/* Teste da API Nativa */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Testar API Nativa (Estrelinhas)</h2>
              <p className="text-xs text-muted-foreground">Testa se o prompt nativo da loja aparece neste dispositivo.</p>
            </div>
            <button 
              onClick={async () => {
                const { requestReviewNow } = await import('@/lib/inAppReview');
                const success = await requestReviewNow();
                if (!success) {
                  alert('A API nativa falhou ou não está disponível (você está na Web/PC ou cota esgotada).');
                }
              }}
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <Star size={14} /> Disparar API Nativa
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="font-semibold">Últimos Eventos de Avaliação</h2>
            <p className="text-xs text-muted-foreground">Mostrando os últimos 500 registros</p>
          </div>
          
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : eventos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum evento de avaliação registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Usuário</th>
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eventos.map((ev) => (
                    <tr key={ev.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">
                        {new Date(ev.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <div className="truncate max-w-[200px]" title={ev.email || ev.user_id}>
                          {ev.email || 'Usuário Desconhecido'}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {getEventLabel(ev.event_name)}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {ev.metadata ? JSON.stringify(ev.metadata) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
