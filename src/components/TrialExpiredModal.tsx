import React, { memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { isAdminEmail } from "@/lib/adminEmails";
import { TelaPosTrialView } from "@/components/subscription/TelaPosTrialView";

interface TrialExpiredModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const TrialExpiredModal = memo(function TrialExpiredModal({
  open = true,
  onClose,
}: TrialExpiredModalProps) {
  const { user } = useAuth();
  const { isPremium, isTrial, isAdminOverride, loading: subLoading } = useSubscription();

  const isPaidSubscriber = isAdminOverride || isAdminEmail(user?.email) || (isPremium && !isTrial);

  if (!open || !user || isPaidSubscriber || subLoading) {
    return null;
  }

  return <TelaPosTrialView onVoltar={onClose} />;
});
