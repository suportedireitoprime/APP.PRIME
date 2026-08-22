import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MessageCircle, UserPlus, Sparkles, Check, Database, Activity, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import HorusOnboardingOverlay from '@/components/horus/onboarding/HorusOnboardingOverlay';
import CadastroOnboardingOverlay, {
  getActiveTriagemVersion,
  setActiveTriagemVersion,
} from '@/components/onboarding/CadastroOnboardingOverlay';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const VERSIONS: {
  id: 'A' | 'B' | 'C';
  name: string;
  desc: string;
  vibe: string;
}[] = [
  {
    id: 'A',
    name: 'Editorial Cinematográfico',
    desc: 'Fundo colorido que muda a cada etapa, tipografia grande em cima, cards no meio.',
    vibe: 'Elegante · Sério · Editorial',
  },
  {
    id: 'B',
    name: 'Conversa com Horus',
    desc: 'Chat animado com bubbles e "digitando…". Cada pergunta chega como mensagem.',
    vibe: 'Direto · Amigável · Rápido',
  },
  {
    id: 'C',
    name: 'Cards Empilhados',
    desc: 'Cards coloridos deslizando lateralmente com progresso segmentado no topo.',
    vibe: 'Pop · Divertido · Kinetic',
  },
];

export default function AdminTriagem() {
  const navigate = useNavigate();
  const [previewVersion, setPreviewVersion] = useState<'A' | 'B' | 'C' | null>(null);
  const [previewHorus, setPreviewHorus] = useState(false);
  const [active, setActive] = useState<'A' | 'B' | 'C'>(getActiveTriagemVersion());

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

  const definir = (v: 'A' | 'B' | 'C') => {
    setActiveTriagemVersion(v);
    setActive(v);
    toast.success(`Versão ${v} agora é a triagem ativa`);
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
                    3 versões de triagem
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview de cada uma abaixo. Clique em <b>Definir como ativa</b> pra escolher qual
                    novos usuários verão. Ativa agora: <b>Versão {active}</b>.
                  </p>
                </div>
                <button
                  onClick={resetFirstSeen}
                  className="h-10 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                >
                  Resetar "primeira vez"
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {VERSIONS.map((v) => {
                const isActive = active === v.id;
                return (
                  <div
                    key={v.id}
                    className={`rounded-2xl border-2 p-5 space-y-3 transition ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black tracking-widest text-primary">
                        VERSÃO {v.id}
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Check className="w-3.5 h-3.5" /> ATIVA
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base leading-tight">{v.name}</h3>
                    <p className="text-sm text-muted-foreground min-h-[3.5rem]">{v.desc}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {v.vibe}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setPreviewVersion(v.id)}
                        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Play className="w-4 h-4" /> Preview
                      </button>
                      <button
                        onClick={() => definir(v.id)}
                        disabled={isActive}
                        className="h-11 px-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-40"
                      >
                        {isActive ? 'Ativa' : 'Definir'}
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {previewVersion && (
        <CadastroOnboardingOverlay
          open
          previewMode
          forceVersion={previewVersion}
          onFinished={() => setPreviewVersion(null)}
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
