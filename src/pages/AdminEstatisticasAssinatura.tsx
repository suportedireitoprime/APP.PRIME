import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingDown, RotateCcw, ShieldAlert, ArrowDownRight, 
  Search, Filter, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Ban, CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// --- Mocks ---
const MOCK_CHURN = [
  { id: 1, user: 'João Silva', email: 'joao.silva@email.com', date: 'Hoje', reason: 'Preço muito alto', status: 'Cancelado', plan: 'Mensal' },
  { id: 2, user: 'Maria Oliveira', email: 'maria.o@email.com', date: 'Ontem', reason: 'Falta de tempo para estudar', status: 'Cancelado', plan: 'Anual' },
  { id: 3, user: 'Carlos Santos', email: 'carlos.santos@email.com', date: '12 Ago', reason: 'Aprovado na OAB', status: 'Concluído', plan: 'Anual' },
  { id: 4, user: 'Ana Costa', email: 'ana.costa@email.com', date: '10 Ago', reason: 'App travando', status: 'Cancelado', plan: 'Mensal' },
];

const MOCK_REFUNDS = [
  { id: 1, user: 'Pedro Rocha', email: 'pedro@email.com', date: 'Hoje', amount: 'R$ 29,90', reason: 'Cobrança indevida (não uso mais)', status: 'Pendente', txId: 'TX-9821' },
  { id: 2, user: 'Lucia Fernandes', email: 'lucia.f@email.com', date: 'Ontem', amount: 'R$ 249,90', reason: 'Esqueci de cancelar a renovação anual', status: 'Pendente', txId: 'TX-9811' },
  { id: 3, user: 'Bruno Alves', email: 'bruno.a@email.com', date: '14 Ago', amount: 'R$ 29,90', reason: 'Não gostei do conteúdo', status: 'Reembolsado', txId: 'TX-9705' },
];

const MOCK_FRAUD = [
  { id: 1, user: 'Usuário Desconhecido', email: 'teste123@email.com', date: 'Ontem', amount: 'R$ 249,90', reason: 'Chargeback (Fraude de Cartão)', status: 'Suspeito', actions: 'Revogar' },
  { id: 2, user: 'Marcos Paulo', email: 'marcos@email.com', date: '12 Ago', amount: 'R$ 29,90', reason: 'Disputa bancária', status: 'Banido', actions: '-' },
];

export default function AdminEstatisticasAssinatura() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('churn');

  return (
    <div className="min-h-dvh bg-background pb-8 flex flex-col">
      <PageHeader title="Estatísticas da Conta" onBack={() => navigate('/admin')} />

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Taxa de Churn (30d)</div>
              <div className="text-2xl font-display font-bold">4.2% <span className="text-xs text-red-500 font-normal ml-1">+0.5%</span></div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Reembolsos Pendentes</div>
              <div className="text-2xl font-display font-bold">12 <span className="text-xs text-muted-foreground font-normal ml-1">R$ 520,00</span></div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <div className="text-sm font-body text-muted-foreground">Alertas de Fraude</div>
              <div className="text-2xl font-display font-bold">3 <span className="text-xs text-destructive font-normal ml-1">Ação requerida</span></div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/40 p-1 rounded-xl h-auto">
            <TabsTrigger value="churn" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <TrendingDown className="w-4 h-4 mr-2" />
              Churn
            </TabsTrigger>
            <TabsTrigger value="refunds" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reembolsos
            </TabsTrigger>
            <TabsTrigger value="fraud" className="rounded-lg py-2.5 text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Antifraude
            </TabsTrigger>
          </TabsList>

          {/* Tab: CHURN */}
          <TabsContent value="churn" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-display font-bold">Cancelamentos Recentes</h2>
              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar email..." className="pl-9 bg-secondary/30 border-border/60" />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 border-border/60">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {MOCK_CHURN.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.user} <span className="text-muted-foreground font-normal ml-2">{item.email}</span></div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase border-border/50">{item.plan}</Badge>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right flex flex-col justify-center bg-secondary/40 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Motivo relatado</div>
                    <div className="text-sm font-medium text-foreground">{item.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab: REFUNDS */}
          <TabsContent value="refunds" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-display font-bold">Gestão de Reembolsos</h2>
            </div>

            <div className="space-y-3">
              {MOCK_REFUNDS.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm truncate">{item.user} <span className="text-muted-foreground font-normal ml-2">{item.email}</span></div>
                      <Badge variant={item.status === 'Pendente' ? 'default' : 'secondary'} className={item.status === 'Pendente' ? 'bg-orange-500/20 text-orange-500' : ''}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-background/50 p-2 rounded-md">
                        <span className="text-muted-foreground block mb-0.5">Valor</span>
                        <span className="font-semibold">{item.amount}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-md">
                        <span className="text-muted-foreground block mb-0.5">Data</span>
                        <span className="font-medium">{item.date}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-md col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block mb-0.5">Transação</span>
                        <span className="font-mono text-[10px]">{item.txId}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Motivo: <span className="text-foreground">{item.reason}</span></span>
                    </div>
                  </div>

                  {item.status === 'Pendente' && (
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Aprovar</Button>
                      <Button size="sm" variant="outline" className="w-full border-border/60 text-destructive hover:bg-destructive/10">Negar</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab: FRAUD */}
          <TabsContent value="fraud" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-display font-bold">Monitoramento Antifraude</h2>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Proteção Ativa</Badge>
            </div>

            <div className="space-y-3">
              {MOCK_FRAUD.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                      <Ban className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.user} <span className="text-muted-foreground font-normal ml-2">{item.email}</span></div>
                      <div className="text-xs mt-1 text-destructive font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.reason} — {item.amount} ({item.date})
                      </div>
                    </div>
                  </div>
                  
                  {item.status === 'Suspeito' ? (
                     <div className="flex gap-2 w-full sm:w-auto">
                       <Button size="sm" variant="destructive" className="w-full">Banir e Revogar</Button>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium w-full sm:w-auto justify-center sm:justify-start">
                       <CheckCircle className="w-4 h-4 text-emerald-500" /> Conta Banida
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
