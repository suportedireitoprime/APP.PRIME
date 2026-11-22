import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useTrackArea } from "@/hooks/useTrackArea";
import { useSubscription } from "@/hooks/useSubscription";
import { useGoBack } from '@/hooks/useGoBack';
import { getSubscriptionLayout } from '@/lib/subscriptionLayoutStore';
import { AssinaturaVitaliciaView } from '@/components/assinatura/AssinaturaVitaliciaView';
import { AssinaturaPadraoView } from '@/components/assinatura/AssinaturaPadraoView';

export default function Assinatura() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();

  const welcomeFlag = searchParams.get('welcome') === '1';
  const previewPlans = searchParams.get('preview') === 'plans' || searchParams.get('planos') === '1';
  const { refresh: refreshSubscription, isPremium, isTrial, loading: subLoading } = useSubscription({ pollOnMount: welcomeFlag });

  useTrackArea("assinatura_aberta");

  // Redireciona imediatamente assinantes ativos para seus planos, impedindo acesso indevido ao checkout
  if (!subLoading && isPremium && !isTrial && !previewPlans && !welcomeFlag) {
    return <Navigate to="/planos/ativos" replace />;
  }

  // Seleção dinâmica do Layout de Assinatura (Vitalício Promocional vs Padrão 3 Planos)
  const layoutParam = searchParams.get('layout');
  const activeLayout = layoutParam === 'vitalicio'
    ? 'vitalicio_promocional'
    : layoutParam === 'padrao'
    ? 'padrao_3_planos'
    : getSubscriptionLayout();

  if (activeLayout === 'vitalicio_promocional') {
    return (
      <AssinaturaVitaliciaView
        onSuccess={() => {
          refreshSubscription();
        }}
        onVoltar={() => goBack()}
      />
    );
  }

  return (
    <AssinaturaPadraoView
      onSuccess={() => {
        refreshSubscription();
      }}
      onVoltar={() => goBack()}
    />
  );
}
