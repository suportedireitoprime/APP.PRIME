import { useState, useEffect } from 'react';

interface UseArtigoSheetsStateProps {
  artigoNumero?: number | string;
  tabelaNome?: string;
}

export function useArtigoSheetsState({ artigoNumero, tabelaNome }: UseArtigoSheetsStateProps) {
  const [showLembretesLocal, setShowLembretesLocal] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);
  const [showQuestoesPanel, setShowQuestoesPanel] = useState(false);
  const [showJurisPanel, setShowJurisPanel] = useState(false);
  const [showBaixarSheet, setShowBaixarSheet] = useState(false);
  const [showAnotacoesSheet, setShowAnotacoesSheet] = useState(false);
  const [showPerguntarSheet, setShowPerguntarSheet] = useState(false);
  const [showPraticarSheet, setShowPraticarSheet] = useState(false);
  const [showVideoaulasListSheet, setShowVideoaulasListSheet] = useState(false);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [showTermosSheet, setShowTermosSheet] = useState(false);
  const [showHistoricoSheet, setShowHistoricoSheet] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  useEffect(() => {
    setShowLembretesLocal(false);
    setShowGrafo(false);
    setShowQuestoesPanel(false);
    setShowJurisPanel(false);
    setShowBaixarSheet(false);
    setShowAnotacoesSheet(false);
    setShowPerguntarSheet(false);
    setShowPraticarSheet(false);
    setShowVideoaulasListSheet(false);
    setShowVideoaulaSheet(false);
    setShowTermosSheet(false);
    setShowHistoricoSheet(false);
    setShowSharePanel(false);
    setActiveActionMenu(null);
  }, [artigoNumero, tabelaNome]);

  return {
    showLembretesLocal, setShowLembretesLocal,
    showGrafo, setShowGrafo,
    showQuestoesPanel, setShowQuestoesPanel,
    showJurisPanel, setShowJurisPanel,
    showBaixarSheet, setShowBaixarSheet,
    showAnotacoesSheet, setShowAnotacoesSheet,
    showPerguntarSheet, setShowPerguntarSheet,
    showPraticarSheet, setShowPraticarSheet,
    showVideoaulasListSheet, setShowVideoaulasListSheet,
    showVideoaulaSheet, setShowVideoaulaSheet,
    showTermosSheet, setShowTermosSheet,
    showHistoricoSheet, setShowHistoricoSheet,
    showSharePanel, setShowSharePanel,
    activeActionMenu, setActiveActionMenu,
  };
}
