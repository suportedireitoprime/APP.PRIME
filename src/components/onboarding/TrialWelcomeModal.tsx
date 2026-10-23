import React, { useEffect } from 'react';

interface Props {
  onDone: () => void;
}

/**
 * Modal de 3 dias de degustação desativado conforme diretriz:
 * O usuário agora conta com cotas gratuitas mensais renováveis (ex: 10/mês),
 * eliminando a tela vermelha de bloqueio de 3 dias no cadastro.
 */
export default function TrialWelcomeModal({ onDone }: Props) {
  useEffect(() => {
    onDone();
  }, [onDone]);

  return null;
}
