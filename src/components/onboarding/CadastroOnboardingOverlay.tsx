import { useState } from 'react';
import TriagemForm from './versoes/TriagemForm';
import type { TriagemResult } from './versoes/triagemShared';
import AppIntroOverlay from './AppIntroOverlay';

export type CadastroResult = {
  persona: TriagemResult['persona'];
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
  previewMode?: boolean;
  initialName?: string;
  playerRefExternal?: any;
};

export default function CadastroOnboardingOverlay({
  open,
  onFinished,
  previewMode,
}: Props) {
  const [phase, setPhase] = useState<'form' | 'video'>('form');
  const [result, setResult] = useState<CadastroResult | null>(null);

  const handleFormFinished = (r: TriagemResult) => {
    setResult({
      persona: r.persona,
      personaLabel: r.personaLabel,
      faixa: r.faixa,
      nome: r.nome,
      areas: r.areas,
      interesses: r.interesses,
      dores: r.dores,
      whatsapp: r.whatsapp,
    });
    setPhase('video');
  };

  const handleVideoFinished = () => {
    if (result) onFinished(result);
  };

  if (!open) return null;

  return (
    <>
      {phase === 'form' && (
        <TriagemForm open={true} onFinished={handleFormFinished} previewMode={previewMode} />
      )}
      {phase === 'video' && result && (
        <AppIntroOverlay 
          open={true} 
          nome={result.nome} 
          onFinished={handleVideoFinished} 
          previewMode={previewMode} 
        />
      )}
    </>
  );
}
