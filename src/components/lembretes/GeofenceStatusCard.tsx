// Cartão de status do monitoramento por localização: mostra se os lembretes
// estão realmente sendo vigiados em segundo plano (com o app fechado) e ajuda
// a pessoa a liberar a permissão "Permitir o tempo todo" quando falta.

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CheckCircle2, AlertTriangle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGeofenceStatus } from '@/lib/nativeGeofence';

interface Status {
  foreground: boolean;
  background: boolean;
  nativeGeofence: boolean;
  reminders: number;
}

export function GeofenceStatusCard() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const s = await getGeofenceStatus();
      if (alive) setStatus(s);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const openSettings = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { App } = await import('@capacitor/app');
        // Reabre o fluxo de permissão do sistema; se negado permanentemente,
        // orientamos manualmente logo abaixo.
        const { Geolocation } = await import('@capacitor/geolocation');
        const res = await Geolocation.requestPermissions();
        if (res.location === 'granted') return;
        void App; // mantém o import tree-shake-safe
      }
    } catch { /* segue para a orientação manual */ }
    window.alert('Abra Ajustes > Apps > Direito Prime > Permissões > Localização e escolha "Permitir o tempo todo".');
  };

  if (!status) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando monitoramento…
      </div>
    );
  }

  const native = Capacitor.isNativePlatform();
  const fullyOn = native ? (status.nativeGeofence || status.background) : status.foreground;

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        {fullyOn ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">
            {fullyOn
              ? 'Monitorando em segundo plano'
              : native
                ? 'Monitoramento limitado'
                : 'Monitoramento só com o site aberto'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fullyOn
              ? status.nativeGeofence
                ? 'Você é avisado ao chegar no local mesmo com o app fechado.'
                : 'Serviço em segundo plano ativo. Você é avisado ao chegar no local.'
              : native
                ? 'Falta liberar a localização "o tempo todo". Sem isso, o aviso só chega com o app aberto.'
                : 'No navegador o aviso só funciona com esta aba aberta. Use o app instalado para receber com o app fechado.'}
          </p>
        </div>
      </div>
      {!fullyOn && native && (
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={openSettings}>
          <Settings className="mr-2 h-4 w-4" /> Abrir permissões de localização
        </Button>
      )}
    </div>
  );
}
