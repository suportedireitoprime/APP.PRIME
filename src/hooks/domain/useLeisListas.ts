import { useState, useEffect } from 'react';
import { LeiOrdinaria, fetchLeisOrdinariasPorAno, fetchDecretosPorAno } from '@/services/legislacaoService';
import { Sumula, fetchSumulas } from '@/services/sumulasService';

export function useLeisListas() {
  // Leis Ordinárias state
  const [selectedAno, setSelectedAno] = useState<number | null>(null);
  const [leisOrdinarias, setLeisOrdinarias] = useState<LeiOrdinaria[]>([]);
  const [loadingLeisOrd, setLoadingLeisOrd] = useState(false);
  const [searchLeisOrd, setSearchLeisOrd] = useState('');
  const [openLeiOrd, setOpenLeiOrd] = useState<LeiOrdinaria | null>(null);

  // Decretos state
  const [selectedAnoDecreto, setSelectedAnoDecreto] = useState<number | null>(null);
  const [decretos, setDecretos] = useState<LeiOrdinaria[]>([]);
  const [loadingDecretos, setLoadingDecretos] = useState(false);
  const [searchDecretos, setSearchDecretos] = useState('');
  const [openDecreto, setOpenDecreto] = useState<LeiOrdinaria | null>(null);

  // Súmulas state
  const [selectedTribunal, setSelectedTribunal] = useState<string | null>(null);
  const [sumulas, setSumulas] = useState<Sumula[]>([]);
  const [loadingSumulas, setLoadingSumulas] = useState(false);
  const [searchSumulas, setSearchSumulas] = useState('');
  const [openSumula, setOpenSumula] = useState<Sumula | null>(null);

  useEffect(() => {
    if (!selectedAno) return;
    setLoadingLeisOrd(true);
    fetchLeisOrdinariasPorAno(selectedAno).then((data) => {
      setLeisOrdinarias(data);
      setLoadingLeisOrd(false);
    });
  }, [selectedAno]);

  useEffect(() => {
    if (!selectedAnoDecreto) return;
    setLoadingDecretos(true);
    fetchDecretosPorAno(selectedAnoDecreto).then((data) => {
      setDecretos(data);
      setLoadingDecretos(false);
    });
  }, [selectedAnoDecreto]);

  useEffect(() => {
    if (!selectedTribunal) return;
    setLoadingSumulas(true);
    fetchSumulas(selectedTribunal).then((data) => {
      setSumulas(data);
      setLoadingSumulas(false);
    });
  }, [selectedTribunal]);

  return {
    selectedAno,
    setSelectedAno,
    leisOrdinarias,
    loadingLeisOrd,
    searchLeisOrd,
    setSearchLeisOrd,
    openLeiOrd,
    setOpenLeiOrd,

    selectedAnoDecreto,
    setSelectedAnoDecreto,
    decretos,
    loadingDecretos,
    searchDecretos,
    setSearchDecretos,
    openDecreto,
    setOpenDecreto,

    selectedTribunal,
    setSelectedTribunal,
    sumulas,
    loadingSumulas,
    searchSumulas,
    setSearchSumulas,
    openSumula,
    setOpenSumula
  };
}
