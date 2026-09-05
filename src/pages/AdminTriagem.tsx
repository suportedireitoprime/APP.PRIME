import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MessageCircle, UserPlus, Sparkles, Database, Activity } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import HorusOnboardingOverlay from '@/components/horus/onboarding/HorusOnboardingOverlay';
import CadastroOnboardingOverlay from '@/components/onboarding/CadastroOnboardingOverlay';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function AdminTriagem() {
  const navigate = useNavigate();
  const [previewCadastro, setPreviewCadastro] = useState(false);
  const [previewHorus, setPreviewHorus] = useState(false);

  // Respostas State
  const [respostas, setRespostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRespostas();
  }, []);

  const fetchRespostas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, status_perfil, faixa_etaria, areas_interesse, interesses, whatsapp_number, onboarding_completed_at')
      .not('onboarding_completed_at', 'is', null)
      .order('onboarding_completed_at', { ascending: false })
      .limit(100);
      
    if (error) {
      toast.error('Erro ao buscar respostas: ' + error.message);
    } else if (data) {
      setRespostas(data);
    }
    setLoading(false);
  };

  const resetFirstSeen = () => {
    try {
      localStorage.removeItem('intro:firstSeen');
      localStorage.removeItem('triagem:firstSeen');
    } catch {}
    toast.success('Reset feito. A triagem vai aparecer de novo.');
  };

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title="Triagem" onBack={() => navigate('/admin-funcoes')} />
      <div className="max-w-5xl mx-auto p-4 pb-24">
        <Tabs defaultValue="cadastro" className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="cadastro" className="gap-2">
              <UserPlus className="w-4 h-4" /> Cadastro
            </TabsTrigger>
            <TabsTrigger value="respostas" className="gap-2">
              <Database className="w-4 h-4" /> Respostas
            </TabsTrigger>
            <TabsTrigger value="horus" className="gap-2">
              <MessageCircle className="w-4 h-4" /> Horus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Triagem de Cadastro
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fluxo unificado de coleta de dados e apresentação em Remotion do App Prime.
                  </p>
                </div>
                <button
                  onClick={resetFirstSeen}
                  className="h-10 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                >
                  Resetar "primeira vez"
                </button>
              </div>
              <button
                onClick={() => setPreviewCadastro(true)}
                className="mt-4 h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 active:scale-95"
              >
                <Play className="w-5 h-5" /> Preview ao vivo
              </button>
            </div>
          </TabsContent>

          <TabsContent value="respostas" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Últimas 100 Respostas
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visualização em tempo real de quem terminou a triagem.
                  </p>
                </div>
                <button
                  onClick={fetchRespostas}
                  disabled={loading}
                  className="h-10 px-4 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  {loading ? 'Carregando...' : 'Atualizar'}
                </button>
              </div>

              {respostas.length === 0 && !loading && (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma resposta encontrada.
                </div>
              )}

              {respostas.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <ScrollArea className="w-full max-w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/40 border-b border-border text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Nome</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Perfil</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Faixa Etária</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Interesses</th>
                          <th className="px-4 py-3 font-semibold whitespace-nowrap">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {respostas.map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-foreground">{r.display_name || 'Anônimo'}</div>
                              {r.whatsapp_number && <div className="text-[11px] text-muted-foreground">{r.whatsapp_number}</div>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                                {r.status_perfil || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                              {r.faixa_etaria || '-'}
                            </td>
                            <td className="px-4 py-3 max-w-[200px] truncate">
                              <div className="text-xs text-muted-foreground truncate" title={r.areas_interesse?.join(', ')}>
                                {r.areas_interesse?.length ? r.areas_interesse.join(', ') : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                              {r.onboarding_completed_at ? new Date(r.onboarding_completed_at).toLocaleString('pt-BR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="horus" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold text-lg">Triagem do Horus</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Apresentação em Remotion mostrada na primeira abertura do Assistente Horus.
              </p>
              <button
                onClick={() => setPreviewHorus(true)}
                className="mt-4 h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 active:scale-95"
              >
                <Play className="w-5 h-5" /> Preview ao vivo
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {previewCadastro && (
        <CadastroOnboardingOverlay
          open
          previewMode
          onFinished={() => setPreviewCadastro(false)}
        />
      )}
      {previewHorus && (
        <HorusOnboardingOverlay
          open
          previewMode
          initialName="Preview"
          onFinished={() => setPreviewHorus(false)}
        />
      )}
    </div>
  );
}
