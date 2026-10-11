import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Target, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminAdmob() {
  const [loading, setLoading] = useState(false);

  // Exemplo de configurações baseadas no áudio
  const [settings, setSettings] = useState({
    enabled: false,
    showRewardedOnPaywall: true, // "se a pessoa quer assinar ou ver um premiado"
    adUnits: {
      native: '',
      appOpen: '',
      rewarded: '',
      interstitial: '',
      rewardedInterstitial: '',
      banner: ''
    }
  });

  const handleSave = async () => {
    setLoading(true);
    // Aqui no futuro salvamos as configurações no banco
    setTimeout(() => {
      setLoading(false);
      toast.success('Configurações de AdMob salvas!');
    }, 800);
  };

  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+var(--sai-bottom))]">
      <PageHeader title="Anúncios AdMob" />
      
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        
        {/* Cabeçalho */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-display font-black text-foreground">Estratégia de Monetização</h2>
              <p className="text-sm text-muted-foreground font-medium">Controle dos anúncios nativos e regras de exibição.</p>
            </div>
          </div>
        </div>

        {/* Estratégias */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground px-1">Geral</h3>
          
          <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/50 cursor-pointer hover:bg-card transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              checked={settings.enabled}
              onChange={e => setSettings({...settings, enabled: e.target.checked})}
            />
            <div className="flex flex-col flex-1">
              <span className="font-bold text-sm text-foreground">Ativar Anúncios AdMob no App</span>
              <span className="text-xs text-muted-foreground mt-0.5">Se desativado, nenhum anúncio será exibido para usuários não-pagantes.</span>
            </div>
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground px-1">Estratégia Pós-Trial (3 dias)</h3>
          
          <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/50 cursor-pointer hover:bg-card transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              checked={settings.showRewardedOnPaywall}
              onChange={e => setSettings({...settings, showRewardedOnPaywall: e.target.checked})}
            />
            <div className="flex flex-col flex-1">
              <span className="font-bold text-sm text-foreground">Oferecer Anúncio Premiado no Paywall</span>
              <span className="text-xs text-muted-foreground mt-0.5">Quando os 3 dias acabarem e o usuário não quiser assinar, mostra a opção: "Assistir anúncio premiado para liberar acesso".</span>
            </div>
          </label>
        </div>

        {/* IDs dos blocos */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground px-1">IDs dos Blocos de Anúncio (Ad Units)</h3>
          
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card/50">
            {[
              { id: 'appOpen', label: 'Abertura do App (App Open)' },
              { id: 'native', label: 'Nativo Avançado (Listas e Feeds)' },
              { id: 'rewarded', label: 'Premiado (Liberar telas)' },
              { id: 'interstitial', label: 'Intersticial (Transições)' },
              { id: 'rewardedInterstitial', label: 'Intersticial Premiado' },
              { id: 'banner', label: 'Banner' }
            ].map((ad) => (
              <div key={ad.id} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">{ad.label}</label>
                <input 
                  type="text" 
                  placeholder="ca-app-pub-..."
                  value={settings.adUnits[ad.id as keyof typeof settings.adUnits]}
                  onChange={e => setSettings({
                    ...settings, 
                    adUnits: { ...settings.adUnits, [ad.id]: e.target.value }
                  })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide active:scale-[0.98] transition-transform"
        >
          {loading ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
        </Button>
      </div>
    </div>
  );
}
