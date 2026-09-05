import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Landmark, Scale, Shield, FileText, ScrollText, Gavel, BookMarked, HeartPulse } from 'lucide-react';
import { getLeisPorTipo } from '@/services/legislacaoService';
import { slugToTipo, tipoToSlug, findLeiBySlug } from '@/lib/legislacaoSlugs';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { useLeisListas } from '@/hooks/domain/useLeisListas';
import { useTrackArea } from '@/hooks/useTrackArea';

import LeiOrdinariaView from '@/components/vademecum/views/LeiOrdinariaView';
import DecretoView from '@/components/vademecum/views/DecretoView';
import SumulaView from '@/components/vademecum/views/SumulaView';
import LeiDetailView from '@/components/vademecum/views/LeiDetailView';

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string }> = {
  constituicao: { label: 'Constituição', icon: Landmark, bg: 'from-amber-500/90 to-amber-700/80' },
  codigo: { label: 'Códigos', icon: Scale, bg: 'from-sky-500/90 to-sky-700/80' },
  estatuto: { label: 'Estatutos', icon: Shield, bg: 'from-emerald-500/90 to-emerald-700/80' },
  'lei-ordinaria': { label: 'Leis Ordinárias', icon: FileText, bg: 'from-violet-500/90 to-violet-700/80' },
  decreto: { label: 'Decretos', icon: ScrollText, bg: 'from-orange-500/90 to-orange-700/80' },
  sumula: { label: 'Jurisprudência', icon: Gavel, bg: 'from-pink-500/90 to-pink-700/80' },
  'lei-especial': { label: 'Leis Especiais', icon: BookMarked, bg: 'from-indigo-500/90 to-indigo-700/80' },
  previdenciario: { label: 'Previdenciário', icon: HeartPulse, bg: 'from-teal-500/90 to-teal-700/80' },
};

const CategoriaLegislacao = () => {
  useTrackArea("legislacao_aberta");
  const params = useParams<{ tipo: string; leiSlug?: string; artigoNumero?: string }>();
  const rawTipo = params.tipo;
  const leiSlugParam = params.leiSlug;
  const artigoNumeroParam = params.artigoNumero;
  const tipo = rawTipo ? slugToTipo(rawTipo) : rawTipo;
  
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/vade-mecum');
    }
  }, [navigate]);

  useEffect(() => {
    const id = (window as any).requestIdleCallback?.(() => {
      void import('./VadeMecum').catch(() => {});
    }, { timeout: 1500 }) ?? setTimeout(() => {
      void import('./VadeMecum').catch(() => {});
    }, 400);

    return () => {
      (window as any).cancelIdleCallback?.(id);
      clearTimeout(id as any);
    };
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const [leis, setLeis] = useState<{ id: string; nome: string; sigla: string; descricao: string; tipo: string; tabela_nome: string }[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(true);

  const [selectedLeiId, setSelectedLeiId] = useState<string | null>(null);
  const [selectedLeiNome, setSelectedLeiNome] = useState('');
  const [selectedLeiDescricao, setSelectedLeiDescricao] = useState('');
  const [selectedTabelaNome, setSelectedTabelaNome] = useState<string | null>(null);
  const [pendingArtigoNumero, setPendingArtigoNumero] = useState<string | null>(null);

  const {
    selectedAno, setSelectedAno, leisOrdinarias, loadingLeisOrd, searchLeisOrd, setSearchLeisOrd, openLeiOrd, setOpenLeiOrd,
    selectedAnoDecreto, setSelectedAnoDecreto, decretos, loadingDecretos, searchDecretos, setSearchDecretos, openDecreto, setOpenDecreto,
    selectedTribunal, setSelectedTribunal, sumulas, loadingSumulas, searchSumulas, setSearchSumulas, openSumula, setOpenSumula
  } = useLeisListas();

  useEffect(() => {
    if (!tipo) return;
    setLoadingLeis(true);
    getLeisPorTipo(tipo).then((data) => {
      setLeis(data);
      setLoadingLeis(false);
      // Auto-select if there's only one law (like CF)
      if (data.length === 1 && !selectedLeiId) {
        const lei = data[0];
        setSelectedLeiId(lei.id);
        setSelectedLeiNome(lei.nome);
        setSelectedLeiDescricao(lei.descricao);
        setSelectedTabelaNome(lei.tabela_nome);
      }
    });
  }, [tipo]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.autoSelectLei) {
      const lei = state.autoSelectLei;
      setSelectedLeiId(lei.leiId);
      setSelectedLeiNome(lei.nome);
      setSelectedLeiDescricao(lei.descricao);
      setSelectedTabelaNome(lei.tabela_nome);
      if (state.artigoNumero) setPendingArtigoNumero(state.artigoNumero);
      window.history.replaceState({}, '');
    } else if (state?.autoSelectTribunal) {
      setSelectedTribunal(state.autoSelectTribunal);
      window.history.replaceState({}, '');
    }
  }, [location.state, setSelectedTribunal]);

  useEffect(() => {
    if (!tipo) return;
    if (tipo === 'constituicao') {
      const cf = LEIS_CATALOG.find((l) => l.tipo === 'constituicao');
      if (cf) {
        if (leiSlugParam) {
          navigate(`/legislacao/${tipoToSlug('constituicao')}`, { replace: true });
          return;
        }
        setSelectedLeiId(cf.id);
        setSelectedLeiNome(cf.nome);
        setSelectedLeiDescricao(cf.descricao);
        setSelectedTabelaNome(cf.tabela_nome);
        if (artigoNumeroParam) setPendingArtigoNumero(artigoNumeroParam);
        return;
      }
    if (!leiSlugParam) {
      if (tipo !== 'lei-ordinaria' && tipo !== 'decreto' && tipo !== 'sumula' && tipo !== 'constituicao') {
        navigate('/vade-mecum', { replace: true });
      }
      return;
    }
    const lei = findLeiBySlug(tipo, leiSlugParam);
    if (lei) {
      setSelectedLeiId(lei.id);
      setSelectedLeiNome(lei.nome);
      setSelectedLeiDescricao(lei.descricao);
      setSelectedTabelaNome(lei.tabela_nome);
      if (artigoNumeroParam) setPendingArtigoNumero(artigoNumeroParam);
      return;
    }
    const s = leiSlugParam.toLowerCase();
    const dyn = leis.find(l => l.tabela_nome.toLowerCase() === s);
    if (dyn) {
      setSelectedLeiId(dyn.id);
      setSelectedLeiNome(dyn.nome);
      setSelectedLeiDescricao(dyn.descricao);
      setSelectedTabelaNome(dyn.tabela_nome);
      if (artigoNumeroParam) setPendingArtigoNumero(artigoNumeroParam);
    }
  }, [leiSlugParam, tipo, artigoNumeroParam, leis, navigate]);

  const UF_ESTADUAL = tipo && /^estadual_([a-z]{2})$/i.exec(tipo)?.[1]?.toUpperCase();
  const config = tipo
    ? (TIPO_CONFIG[tipo] || (UF_ESTADUAL
        ? { label: `Legislação ${UF_ESTADUAL}`, icon: Landmark, bg: 'from-emerald-500/90 to-emerald-700/80' }
        : null))
    : null;

  if (loadingLeis && (!selectedLeiId || tipo !== 'lei-ordinaria' && tipo !== 'decreto' && tipo !== 'sumula')) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Se tem uma lei selecionada ou se a view secundária tem um aberto, delegamos ao LeiDetailView ou aos componentes das views.
  if (tipo === 'lei-ordinaria' && !selectedLeiId) {
    return (
      <LeiOrdinariaView
        goBack={goBack}
        config={config}
        selectedAno={selectedAno}
        setSelectedAno={setSelectedAno}
        leisOrdinarias={leisOrdinarias}
        loadingLeisOrd={loadingLeisOrd}
        searchLeisOrd={searchLeisOrd}
        setSearchLeisOrd={setSearchLeisOrd}
        openLeiOrd={openLeiOrd}
        setOpenLeiOrd={setOpenLeiOrd}
      />
    );
  }

  if (tipo === 'decreto' && !selectedLeiId) {
    return (
      <DecretoView
        goBack={goBack}
        config={config}
        selectedAnoDecreto={selectedAnoDecreto}
        setSelectedAnoDecreto={setSelectedAnoDecreto}
        decretos={decretos}
        loadingDecretos={loadingDecretos}
        searchDecretos={searchDecretos}
        setSearchDecretos={setSearchDecretos}
        openDecreto={openDecreto}
        setOpenDecreto={setOpenDecreto}
      />
    );
  }

  if (tipo === 'sumula' && !selectedLeiId) {
    return (
      <SumulaView
        goBack={goBack}
        config={config}
        selectedTribunal={selectedTribunal}
        setSelectedTribunal={setSelectedTribunal}
        sumulas={sumulas}
        loadingSumulas={loadingSumulas}
        searchSumulas={searchSumulas}
        setSearchSumulas={setSearchSumulas}
        openSumula={openSumula}
        setOpenSumula={setOpenSumula}
      />
    );
  }

  if (selectedLeiId) {
    return (
      <LeiDetailView
        tipo={tipo}
        leis={leis}
        selectedLeiId={selectedLeiId}
        selectedLeiNome={selectedLeiNome}
        selectedLeiDescricao={selectedLeiDescricao}
        selectedTabelaNome={selectedTabelaNome}
        subcat={'todas'} // Fallback for subcat prop which generic list handles internally now
        config={config}
        goBack={goBack}
        pendingArtigoNumero={pendingArtigoNumero}
        setPendingArtigoNumero={setPendingArtigoNumero}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
};

export default CategoriaLegislacao;
