import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Bell, Check } from 'lucide-react';
import RadarBottomNav from '@/components/radar/RadarBottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { StateMapIcon } from '@/components/ui/StateMapIcon';

const UFS_LIST = [
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'SP', label: 'São Paulo' }, { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'MG', label: 'Minas Gerais' },
  { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'PR', label: 'Paraná' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'BA', label: 'Bahia' }, { value: 'PE', label: 'Pernambuco' }, { value: 'CE', label: 'Ceará' },
  { value: 'GO', label: 'Goiás' }, { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
  { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' }, { value: 'MA', label: 'Maranhão' },
  { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' }, { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'PI', label: 'Piauí' }, { value: 'AL', label: 'Alagoas' }, { value: 'SE', label: 'Sergipe' },
  { value: 'RO', label: 'Rondônia' }, { value: 'TO', label: 'Tocantins' }, { value: 'AC', label: 'Acre' },
  { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' }, { value: 'RR', label: 'Roraima' },
];

const CARREIRAS_OPTIONS = [
  { value: 'juridico', label: 'Carreiras Jurídicas' },
  { value: 'tribunais', label: 'Tribunais & Judiciário' },
  { value: 'seguranca', label: 'Segurança Pública' },
  { value: 'fiscal', label: 'Fiscal & Controle' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'professores', label: 'Educação & Professores' },
  { value: 'saude', label: 'Saúde & Medicina' },
];

export default function RadarConstrucao() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  
  const isAlertas = pathname.includes('/alertas');
  const isCargos = pathname.includes('/cargos');
  const isRegioes = pathname.includes('/regioes');

  // Alertas state
  const [notifPush, setNotifPush] = useState(false);
  const [notifHorus, setNotifHorus] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !isAlertas) return;
    async function loadAlertas() {
      if (!user) return;
      const { data } = await supabase.from('usuario_alertas_concursos').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        if (data.notificar_push !== undefined) setNotifPush(data.notificar_push);
        if (data.notificar_horus !== undefined) setNotifHorus(data.notificar_horus);
      }
    }
    loadAlertas();
  }, [user, isAlertas]);

  const salvarConfiguracoes = async () => {
    if (!user) return;
    haptic.selection();
    setSaving(true);
    try {
      await supabase.from('usuario_alertas_concursos').upsert({
        user_id: user.id,
        notificar_push: notifPush,
        notificar_horus: notifHorus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      toast.success('Preferências de alerta salvas!');
    } catch (err) {
      toast.error('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  };

  const handleFilterClick = (type: string, value: string) => {
    haptic.selection();
    // Redirects to radar main passing state
    navigate('/radar-concursos', { state: type === 'uf' ? { preFiltroUf: value } : { preFiltroCargo: value } });
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0f12] text-white overflow-hidden pb-24 flex flex-col">
      <ShapeGrid />
      
      {/* Header Nativo */}
      <div className="sticky top-0 z-40 bg-[#0d0f12]/80 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate('/ferramentas'); }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:opacity-70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2.4} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {isCargos && <><Briefcase className="w-5 h-5 text-emerald-400" /> CARGOS</>}
              {isRegioes && <><MapPin className="w-5 h-5 text-emerald-400" /> REGIÕES</>}
              {isAlertas && <><Bell className="w-5 h-5 text-emerald-400" /> ALERTAS</>}
            </h1>
          </div>
          <div className="w-12 h-12" />
        </div>
      </div>

      <div className="relative z-10 p-5 w-full max-w-xl mx-auto space-y-6">
        {isCargos && (
          <div className="space-y-4">
            <h2 className="text-white/80 font-semibold mb-2">Filtrar por Carreira</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CARREIRAS_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => handleFilterClick('cargo', c.value)}
                  className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl active:scale-95 transition-all text-left group hover:bg-emerald-500/10 hover:border-emerald-500/30"
                >
                  <span className="font-medium group-hover:text-emerald-400">{c.label}</span>
                  <Briefcase className="w-4 h-4 text-white/30 group-hover:text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isRegioes && (
          <div className="space-y-4">
            <h2 className="text-white/80 font-semibold mb-2">Filtrar por Estado</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {UFS_LIST.map(uf => (
                <button
                  key={uf.value}
                  onClick={() => handleFilterClick('uf', uf.value)}
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 p-4 rounded-2xl active:scale-95 transition-all group hover:bg-emerald-500/10 hover:border-emerald-500/30"
                >
                  <div className="w-10 h-10 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all">
                    {uf.value !== 'NACIONAL' ? (
                      <StateMapIcon uf={uf.value} className="w-full h-full fill-emerald-500" />
                    ) : (
                      <MapPin className="w-full h-full text-emerald-500" />
                    )}
                  </div>
                  <span className="font-bold text-sm group-hover:text-emerald-400">{uf.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isAlertas && (
          <div className="bg-card/70 border border-emerald-500/25 rounded-3xl p-5 shadow-md space-y-4 mt-2">
            <div className="space-y-1">
              <h3 className="font-display text-base sm:text-lg font-bold uppercase text-white">
                Notificações Automáticas
              </h3>
              <p className="text-sm text-white/50">Receba avisos instantâneos quando um novo edital for publicado.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Notificação Push</p>
                  <p className="text-xs text-white/50 mt-0.5">Alertas no seu celular</p>
                </div>
                <button
                  type="button"
                  onClick={() => { haptic.selection(); setNotifPush(!notifPush); }}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${notifPush ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${notifPush ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Resumo do Hórus IA</p>
                  <p className="text-xs text-white/50 mt-0.5">Análise rápida do edital</p>
                </div>
                <button
                  type="button"
                  onClick={() => { haptic.selection(); setNotifHorus(!notifHorus); }}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${notifHorus ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${notifHorus ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={salvarConfiguracoes}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 active:opacity-70 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </div>
          </div>
        )}
      </div>

      <RadarBottomNav />
    </div>
  );
}
