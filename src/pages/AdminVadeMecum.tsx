import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Save, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type ConfigIA = {
  id: string;
  tipo: string;
  modelo_ia: string;
  prompt_sistema: string;
};

const AdminVadeMecum = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<ConfigIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('vademecum_config_ia')
        .select('*')
        .order('tipo');

      if (error) {
        toast.error('Erro ao carregar configurações: ' + error.message);
      } else if (data) {
        setConfigs(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (config: ConfigIA) => {
    setSaving(true);
    const { error } = await supabase
      .from('vademecum_config_ia')
      .update({
        modelo_ia: config.modelo_ia,
        prompt_sistema: config.prompt_sistema,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', config.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Configuração atualizada com sucesso!');
    }
  };

  const handleChange = (id: string, field: keyof ConfigIA, value: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'historico': return 'Histórico de Alterações (Resumo IA)';
      case 'narracao': return 'Narração de Artigo (Voz)';
      case 'exemplos': return 'Exemplos Práticos';
      default: return tipo;
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-10">
      <PageHeader title="Configurações IA - Vade Mecum" onBack={() => navigate('/admin')} />

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Prompts do Sistema</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Controle as diretrizes (System Prompts) e modelos usados nas funções de Inteligência Artificial dentro do Vade Mecum.
        </p>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {configs.map((config) => (
              <div key={config.id} className="bg-secondary/20 border border-border/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">{getTipoLabel(config.tipo)}</h3>
                  <Badge variant="outline" className="text-xs uppercase">{config.tipo}</Badge>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modelo de IA</label>
                  <Select value={config.modelo_ia} onValueChange={(v) => handleChange(config.id, 'modelo_ia', v)}>
                    <SelectTrigger className="w-full bg-background border-border/60 rounded-xl h-12">
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido/Barato)</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Complexo/Caro)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prompt (Comportamento e Regras)</label>
                  <Textarea 
                    value={config.prompt_sistema}
                    onChange={(e) => handleChange(config.id, 'prompt_sistema', e.target.value)}
                    className="min-h-[140px] bg-background border-border/60 rounded-xl resize-y text-sm font-mono"
                    placeholder="Digite o prompt do sistema..."
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    disabled={saving} 
                    onClick={() => handleSave(config)}
                    className="w-full sm:w-auto h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar {getTipoLabel(config.tipo)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVadeMecum;
