// Bloco de preferências do "card flutuante" de lembretes.
// Android: pede a permissão de sobreposição ("Exibir sobre outros apps").
// iOS: explica que o aviso aparece na tela de bloqueio / Ilha Dinâmica.

import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Layers, CheckCircle2, AlertTriangle, Settings, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  overlayEnabled,
  setOverlayEnabled,
  overlayKind,
  overlayPermissionGranted,
  requestOverlayPermission,
  showReminderOverlay,
  hideReminderOverlay,
} from '@/lib/floatingReminder';
import { toast } from 'sonner';

export function CardFlutuanteCard() {
  const [enabled, setEnabled] = useState(() => overlayEnabled());
  const [granted, setGranted] = useState<boolean | null>(null);
  const kind = overlayKind();
  const native = Capacitor.isNativePlatform();

  const check = useCallback(async () => {
    setGranted(await overlayPermissionGranted());
  }, []);

  useEffect(() => {
    void check();
    const onVis = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [check]);

  const toggle = (v: boolean) => {
    setEnabled(v);
    setOverlayEnabled(v);
  };

  const pedirPermissao = async () => {
    const opened = await requestOverlayPermission();
    if (!opened) {
      toast.info('Abra Ajustes > Apps > Estudos Jurídicos > Exibir sobre outros apps e ative.');
      return;
    }
    toast.success('Ative a opção na tela que abriu e volte para o app.');
  };

  const testar = async () => {
    const ok = await showReminderOverlay({
      id: 'teste-card-flutuante',
      titulo: '📍 Fórum Central',
      subtitulo: 'Você está chegando — 3 questões esperando',
      distanciaM: 320,
      deepLink: '/questoes/praticar',
    });
    if (!ok) {
      toast.error(
        kind === 'none'
          ? 'Disponível apenas no aplicativo instalado (Android/iPhone).'
          : 'Falta liberar a permissão de sobreposição.',
      );
      return;
    }
    toast.success('Card exibido. Ele fecha sozinho em 15 segundos.');
    window.setTimeout(() => { void hideReminderOverlay('teste-card-flutuante'); }, 15_000);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold">Card flutuante</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {kind === 'ios-live-activity'
              ? 'No iPhone o aviso aparece na tela de bloqueio e na Ilha Dinâmica, com a distância atualizando ao vivo.'
              : 'No Android o aviso aparece por cima de qualquer aplicativo, como o card de corrida do 99, com a distância ao vivo.'}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} aria-label="Ativar card flutuante" />
      </div>

      {!native ? (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          No navegador o aviso aparece como faixa no topo do site. Instale o aplicativo para ter o card por cima de outros apps.
        </div>
      ) : granted ? (
        <div className="flex items-center gap-2 text-xs text-primary">
          <CheckCircle2 className="h-4 w-4" />
          {kind === 'ios-live-activity' ? 'Live Activity disponível neste iPhone.' : 'Permissão de sobreposição liberada.'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {kind === 'ios-live-activity'
              ? 'Este iPhone não suporta Live Activities (precisa iOS 16.1 ou superior).'
              : 'Falta liberar "Exibir sobre outros apps". Sem isso o card não aparece fora do aplicativo.'}
          </div>
          {kind === 'android-overlay' && (
            <Button variant="outline" size="sm" className="w-full" onClick={pedirPermissao}>
              <Settings className="mr-2 h-4 w-4" /> Liberar sobreposição
            </Button>
          )}
        </div>
      )}

      <Button variant="secondary" size="sm" className="w-full" onClick={testar} disabled={!enabled}>
        Testar card agora
      </Button>
    </section>
  );
}

export default CardFlutuanteCard;