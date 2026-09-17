import React from 'react';
import TriagemModerna from './TriagemModerna';

export type CadastroResult = {
  persona: 'faculdade' | 'oab' | 'concurso' | 'advogado' | null;
  personaLabel: string | null;
  faixa: string | null;
  nome: string;
  areas?: string[];
  interesses?: string[];
  dores?: string[];
  whatsapp?: string | null;
};

type Props = {
  open: boolean;
  onFinished: (r: CadastroResult) => void;
  onFormFinished?: (r: CadastroResult) => Promise<void> | void;
  previewMode?: boolean;
  initialName?: string;
  playerRefExternal?: unknown;
};

export default function CadastroOnboardingOverlay({
  open,
  onFinished,
  onFormFinished,
  previewMode,
  initialName,
}: Props) {
  if (!open) return null;

  const handleComplete = async (r: CadastroResult) => {
    if (onFormFinished) {
      try {
        await onFormFinished(r);
      } catch (err) {
        console.error('[Onboarding] Erro ao persistir dados da triagem:', err);
      }
    }
    onFinished(r);
  };

  return (
    <TriagemModerna
      initialName={initialName}
      onComplete={handleComplete}
      previewMode={previewMode}
    />
  );
}
