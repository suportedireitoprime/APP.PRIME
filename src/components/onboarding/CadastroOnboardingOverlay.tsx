import React, { useRef, useCallback } from 'react';
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
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const onFormFinishedRef = useRef(onFormFinished);
  onFormFinishedRef.current = onFormFinished;

  const handleComplete = useCallback((r: CadastroResult) => {
    if (onFormFinishedRef.current) {
      try {
        void Promise.resolve(onFormFinishedRef.current(r)).catch((err) => {
          console.error('[Onboarding] Erro ao persistir dados da triagem:', err);
        });
      } catch (err) {
        console.error('[Onboarding] Erro ao persistir dados da triagem:', err);
      }
    }
    onFinishedRef.current(r);
  }, []);

  if (!open) return null;

  return (
    <TriagemModerna
      initialName={initialName}
      onComplete={handleComplete}
      previewMode={previewMode}
    />
  );
}
