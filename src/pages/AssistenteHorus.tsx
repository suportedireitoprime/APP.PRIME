import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { track } from '@/lib/analyticsEvents';
import { abrirLink } from '@/lib/nativo';
import { useGoBack } from '@/hooks/useGoBack';
import { useSubscription } from '@/hooks/useSubscription';

import HorusVerifyPhoneSheet from '@/components/horus/HorusVerifyPhoneSheet';
import HorusEuSheet from '@/components/horus/HorusEuSheet';
import HorusOnboardingOverlay from '@/components/horus/onboarding/HorusOnboardingOverlay';
import { useHorusOnboarding } from '@/components/horus/onboarding/useHorusOnboarding';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { useAssistenteHorus } from '@/hooks/domain/useAssistenteHorus';
import { HorusTab } from '@/components/horus/tabs/HorusTopTabs';
import { HorusMainTab } from '@/components/horus/tabs/HorusMainTab';
import { HorusFuncoesTab } from '@/components/horus/tabs/HorusFuncoesTab';
import { HorusNotificacoesTab } from '@/components/horus/tabs/HorusNotificacoesTab';
import { HorusAjustesTab } from '@/components/horus/tabs/HorusAjustesTab';

const WHATSAPP_NUMERO = '5511914910906';
const WHATSAPP_MSG = 'Olá Horus! Preciso da sua ajuda com uma dúvida jurídica.';

const AssistenteHorus = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  
  const { loading: onbLoading, onboarded } = useHorusOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab] = useState<HorusTab>('main');
  
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [euOpen, setEuOpen] = useState(false);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const [waIntent, setWaIntent] = useState(false);

  const { isPremium } = useSubscription();
  const {
    statusLoading, profileName, linked, isVerified, displayName, prefs,
    nomeEdit, setNomeEdit, apelidoEdit, setApelidoEdit, apelidoAtivo, setApelidoAtivo,
    savingNome, savingApelido, savingKey,
    loadStatus, handleVerified, savePref, saveNome, saveApelido
  } = useAssistenteHorus();

  // Show onboarding logic
  if (!onbLoading && !onboarded && !showOnboarding) {
    setShowOnboarding(true);
  }

  const openWhatsApp = () => {
    track('horus_whatsapp_redirect', { verified: isVerified, source: 'horus_page' });
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
    void abrirLink(url);
  };

  const handleWhatsAppClick = () => {
    haptic.light();
    track('horus_whatsapp_click', { verified: isVerified });
    if (!isVerified) {
      setWaIntent(true);
      setVerifyOpen(true);
      toast.info('Vamos verificar seu número primeiro');
      return;
    }
    openWhatsApp();
  };

  const onVerifiedCallback = () => {
    handleVerified();
    if (waIntent) {
      setWaIntent(false);
      setTimeout(openWhatsApp, 400);
    }
  };

  const back = () => {
    haptic.selection();
    if (tab !== 'main') setTab('main');
    else goBack();
  };

  const titles: Record<HorusTab, string> = {
    main: 'Assistente Horus',
    funcoes: 'Funções',
    notificacoes: 'Notificações',
    ajustes: 'Ajustes',
  };

  return (
    <div className="min-h-dvh bg-background text-foreground pb-10">
      <HorusOnboardingOverlay
        open={showOnboarding}
        initialName={profileName}
        onFinished={() => { setShowOnboarding(false); loadStatus(); }}
      />
      <HorusVerifyPhoneSheet
        open={verifyOpen}
        onClose={() => { setVerifyOpen(false); setWaIntent(false); }}
        onVerified={onVerifiedCallback}
        initialPhone={linked?.phone_e164 || ''}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center">
          <div className="flex-1 min-w-0">
            <PageHeader title={titles[tab]} onBack={back} />
          </div>
          <button
            onClick={() => { haptic.selection(); setAjustesOpen(true); }}
            className="mr-3 shrink-0 w-10 h-10 rounded-full bg-secondary/70 border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Ajustes"
          >
            <Settings className="w-5 h-5 text-foreground" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {tab === 'main' && (
            <HorusMainTab
              statusLoading={statusLoading}
              displayName={displayName}
              isVerified={isVerified}
              lastDigits={linked?.phone_e164 ? linked.phone_e164.slice(-4) : ''}
              isPremium={isPremium}
              handleWhatsAppClick={handleWhatsAppClick}
              onRequestVerify={() => setVerifyOpen(true)}
            />
          )}

          {tab === 'funcoes' && (
            <HorusFuncoesTab tab={tab} setTab={setTab} />
          )}

          {tab === 'notificacoes' && (
            <HorusNotificacoesTab
              tab={tab}
              setTab={setTab}
              isVerified={isVerified}
              statusLoading={statusLoading}
              prefs={prefs}
              savingKey={savingKey}
              savePref={savePref}
              onRequestVerify={() => setVerifyOpen(true)}
            />
          )}

          {tab === 'ajustes' && (
            <HorusAjustesTab
              tab={tab}
              setTab={setTab}
              isVerified={isVerified}
              profileName={profileName}
              nomeEdit={nomeEdit}
              setNomeEdit={setNomeEdit}
              savingNome={savingNome}
              saveNome={saveNome}
              apelidoAtivo={apelidoAtivo}
              setApelidoAtivo={setApelidoAtivo}
              apelidoEdit={apelidoEdit}
              setApelidoEdit={setApelidoEdit}
              savingApelido={savingApelido}
              saveApelido={saveApelido}
              linkedApelidoAtivo={linked?.apelido_ativo}
              linkedApelido={linked?.apelido || undefined}
              linkedPhone={linked?.phone_e164}
              onRequestVerify={() => setVerifyOpen(true)}
            />
          )}
        </AnimatePresence>
      </div>

      <HorusEuSheet open={euOpen} onClose={() => { setEuOpen(false); loadStatus(); }} />

      <Sheet open={ajustesOpen} onOpenChange={setAjustesOpen}>
        <SheetContent side="bottom" className="p-0 h-[90dvh] rounded-t-3xl border-t border-border bg-background overflow-hidden flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="font-display text-xl font-bold text-left flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Ajustes do Horus
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <HorusAjustesTab
              tab={'ajustes'}
              setTab={(t) => { setAjustesOpen(false); setTab(t); }}
              isVerified={isVerified}
              profileName={profileName}
              nomeEdit={nomeEdit}
              setNomeEdit={setNomeEdit}
              savingNome={savingNome}
              saveNome={saveNome}
              apelidoAtivo={apelidoAtivo}
              setApelidoAtivo={setApelidoAtivo}
              apelidoEdit={apelidoEdit}
              setApelidoEdit={setApelidoEdit}
              savingApelido={savingApelido}
              saveApelido={saveApelido}
              linkedApelidoAtivo={linked?.apelido_ativo}
              linkedApelido={linked?.apelido || undefined}
              linkedPhone={linked?.phone_e164}
              onRequestVerify={() => setVerifyOpen(true)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssistenteHorus;
