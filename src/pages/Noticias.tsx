import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { NativeNewsPlugin } from '@/plugins/NativeNewsPlugin';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

const Noticias = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();

  useEffect(() => {
    const launchNativeNews = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { data } = await supabase.auth.getSession();
          await NativeNewsPlugin.openNewsDashboard({
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token
          });
          // Se o dashboard for fechado, voltamos para a home ou aba anterior
          navigate(-1);
        } catch (e) {
          console.error("Erro ao iniciar Notícias Nativas:", e);
          // Volta caso dê erro
          navigate(-1);
        }
      } else {
        // Fallback for Web/PWA: For now, we can just show a message, 
        // since the user requested 100% native. But we should at least not crash.
        console.warn("Notícias Nativas são suportadas apenas em dispositivos móveis.");
      }
    };

    launchNativeNews();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4">
        <PageHeader
          title="Notícias Legislativas"
          subtitle="Últimas do mundo jurídico"
          onBack={() => goBack()}
        />
      </div>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        {Capacitor.isNativePlatform() ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-bold font-display">Iniciando Ambiente Nativo...</h2>
            <p className="text-sm text-muted-foreground mt-2">
              As notícias estão sendo abertas na interface otimizada para o seu dispositivo.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold font-display text-red-500">Apenas Aplicativo Nativo</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              A nova experiência 100% nativa e super-rápida de notícias está disponível apenas nos aplicativos para Android e iOS.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Noticias;
