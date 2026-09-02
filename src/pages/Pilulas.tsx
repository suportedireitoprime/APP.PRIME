import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { NativePilulasPlugin } from '@/plugins/NativePilulasPlugin';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

export default function Pilulas() {
  const navigate = useNavigate();
  const goBack = useGoBack();

  useEffect(() => {
    const launchNativePilulas = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { data } = await supabase.auth.getSession();
          await NativePilulasPlugin.openPilulasDashboard({
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token
          });
          navigate(-1);
        } catch (e) {
          console.error("Erro ao iniciar Pílulas Nativas:", e);
          navigate(-1);
        }
      } else {
        console.warn("Pílulas Nativas são suportadas apenas em dispositivos móveis.");
      }
    };

    launchNativePilulas();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4">
        <PageHeader
          title="Pílulas de Áudio"
          subtitle="Aprenda a essência em minutos"
          onBack={() => goBack()}
        />
      </div>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        {Capacitor.isNativePlatform() ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-bold font-display text-white">Iniciando Ambiente Nativo...</h2>
            <p className="text-sm text-white/50 mt-2">
              As pílulas de áudio estão sendo abertas na interface de alta performance.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold font-display text-red-500">Apenas Aplicativo Nativo</h2>
            <p className="text-sm text-white/50 mt-2 max-w-md">
              A nova experiência 100% nativa de áudio está disponível apenas nos aplicativos para Android e iOS.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
