import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { NativePilulasPlugin } from '@/plugins/NativePilulasPlugin';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

export default function PilulasLeiSeca() {
  const navigate = useNavigate();
  const goBack = useGoBack();

  useEffect(() => {
    const launchNativePilulas = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { data } = await supabase.auth.getSession();
          // We could pass a parameter to open a specific tab, but the user requested 100% native migration.
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
          title="Pílulas Lei Seca"
          subtitle="Áudio nativo"
          onBack={() => goBack()}
        />
      </div>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        {Capacitor.isNativePlatform() ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-bold font-display text-white">Iniciando Ambiente Nativo...</h2>
          </>
        ) : (
          <h2 className="text-lg font-bold font-display text-red-500">Apenas Aplicativo Nativo</h2>
        )}
      </div>
    </div>
  );
}
