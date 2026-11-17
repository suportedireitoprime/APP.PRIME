import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { useFlashcardsSessao, FlashcardCard } from '@/lib/flashcardsQueries';
import { saveFlashcardsSessao, getFlashcardsSessoes } from '@/lib/flashcardsSessoes';
import { useGatedFeature } from '@/hooks/useGatedFeature';

function parseList(val?: string | null): string[] | null {
  if (!val) return null;
  const items = val.split(/[|,]/).map(s => s.trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

export function useFlashcardsEngine() {
  const [params, setParams] = useSearchParams();

  // Suporte flexível para área/disciplina, temas/assuntos, modo/status
  const rawAreaParam = params.get('area') || params.get('areas') || params.get('disciplina') || params.get('disciplinas');
  const rawTemasParam = params.get('temas') || params.get('tema') || params.get('assuntos') || params.get('assunto');
  const subtemaParam = params.get('subtema') || params.get('subtemas');
  const tiposParam = params.get('tipos') || params.get('tipo');
  const deckId = params.get('deck');
  const modo = params.get('modo') || params.get('status') || 'todos';
  const ordemParam = params.get('ordem') || 'embaralhado';
  const quantidadeParam = params.get('quantidade') || params.get('limite') || params.get('qtd');
  const artigosParam = params.get('artigos');
  const escolhendo = false;

  const rawLimitStr = quantidadeParam;
  let limitParam = 10000;
  if (rawLimitStr === 'todos' || rawLimitStr === 'all') {
    limitParam = 10000;
  } else if (rawLimitStr) {
    const parsed = parseInt(rawLimitStr, 10);
    limitParam = isNaN(parsed) || parsed <= 0 ? 10000 : parsed;
  } else if (rawTemasParam || subtemaParam || deckId) {
    // Ao estudar um tema, deck ou subtema específico, carrega todos os flashcards
    limitParam = 10000;
  } else {
    limitParam = 50;
  }

  const listaAreas = parseList(rawAreaParam);
  const rawTemas = parseList(rawTemasParam);
  const cleanTemas = rawTemas ? rawTemas.map(t => t.replace(/^\d+[\.\-\s_:]+/, '').trim()) : null;
  const temasList = rawTemas && cleanTemas ? Array.from(new Set([...rawTemas, ...cleanTemas])) : rawTemas;

  const parsedTipos = parseList(tiposParam);
  // Se 'todos' estiver na lista ou vazio ou cobrir todos os 7 tipos padrão, passa null para a RPC liberar todos os cards
  const tiposList = (!parsedTipos || parsedTipos.length === 0 || parsedTipos.some(t => t.toLowerCase() === 'todos') || parsedTipos.length >= 7)
    ? null
    : parsedTipos;

  const areaParam = listaAreas?.[0] || null;
  const areasParam = rawAreaParam;
  const temasParam = rawTemasParam;
  
  const [sessaoId] = useState(() => params.get('sessaoId') || Date.now().toString());

  const { data: cardsRaw, isLoading: loadingCards, refetch: refetchCards } = useFlashcardsSessao({
    areas: listaAreas,
    temas: temasList,
    modo: modo,
    deckId: deckId,
    limit: limitParam,
    tipos: tiposList
  }, true);

  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [totalCardsOriginal, setTotalCardsOriginal] = useState(0);
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [feitos, setFeitos] = useState(0);
  const [sessionCompreendidos, setSessionCompreendidos] = useState(0);
  const [sessionRevisar, setSessionRevisar] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'down'>('left');
  const [emContagem, setEmContagem] = useState(true);
  
  const salvando = useRef(false);
  const gateFlashcards = useGatedFeature('flashcards', 'flashcards');
  
  const loading = loadingCards || emContagem;

  // Filtragem local
  useEffect(() => {
    if (cardsRaw) {
      let finalCards = [...cardsRaw];
      
      const artigosList = artigosParam ? artigosParam.split('|').filter(Boolean) : null;
      if (artigosList && artigosList.length > 0) {
        finalCards = finalCards.filter(c => {
          if (!c.artigo_numero) return false;
          const numCard = c.artigo_numero.replace(/\D/g, '');
          return artigosList.includes(c.artigo_numero) || (numCard !== '' && artigosList.some(a => a.replace(/\D/g, '') === numCard));
        });
      }
      
      if (subtemaParam) {
        const subClean = subtemaParam.trim().toLowerCase();
        const filteredBySub = finalCards.filter(c => {
          if (!c.subtema) return false;
          const s = c.subtema.trim().toLowerCase();
          return s === subClean || s.includes(subClean) || subClean.includes(s);
        });
        if (filteredBySub.length > 0) {
          finalCards = filteredBySub;
        }
      }

      if (ordemParam === 'sequencial') {
        finalCards.sort((a,b) => (a.artigo_numero || '').localeCompare(b.artigo_numero || '', undefined, {numeric: true}));
      }

      if (quantidadeParam) {
        const q = parseInt(quantidadeParam, 10);
        if (!isNaN(q) && q > 0) {
          finalCards = finalCards.slice(0, q);
        }
      }

      setCards(finalCards);
      setTotalCardsOriginal(finalCards.length);
      setIdx(0);
      setVirado(false);
    }
  }, [cardsRaw, ordemParam, artigosParam, quantidadeParam, subtemaParam]);

  const [savedIndexToResume, setSavedIndexToResume] = useState<number | null>(null);

  // Ponto de Retomada
  const sessionKey = `flashcards_pos_${areaParam || areasParam || deckId || 'geral'}_${temasParam || 'todos'}`;

  useEffect(() => {
    if (cards.length > 0) {
      const savedIdx = localStorage.getItem(sessionKey);
      if (savedIdx) {
        const parsed = parseInt(savedIdx, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < cards.length) {
          setSavedIndexToResume(parsed);
        }
      }
    }
  }, [cards, sessionKey]);

  const confirmResume = useCallback((shouldResume: boolean) => {
    if (shouldResume && savedIndexToResume !== null) {
      setIdx(savedIndexToResume);
    } else {
      setIdx(0);
      localStorage.setItem(sessionKey, '0');
    }
    setSavedIndexToResume(null);
  }, [savedIndexToResume, sessionKey]);

  useEffect(() => {
    if (cards.length > 0 && idx >= 0 && savedIndexToResume === null) {
      localStorage.setItem(sessionKey, idx.toString());
    }
  }, [idx, cards.length, sessionKey, savedIndexToResume]);

  useEffect(() => {
    const s = getFlashcardsSessoes().find(s => s.id === sessaoId);
    if (s && s.cardsRevisados > 0 && feitos === 0) {
      setFeitos(s.cardsRevisados);
    }
  }, [sessaoId, feitos]);

  const atual = cards[idx];

  const virar = useCallback(() => {
    haptic.selection();
    playFlipSound();
    setVirado((v) => !v);
  }, []);

  const responder = useCallback((status: 'compreendido' | 'revisar', shakeCallback?: () => void) => {
    if (!atual || salvando.current) return;
    if (gateFlashcards.blocked) { gateFlashcards.openGate(); return; }
    
    setExitDirection(status === 'revisar' ? 'down' : 'left');
    
    if (status === 'compreendido') {
      setSessionCompreendidos(c => c + 1);
    } else {
      setSessionRevisar(c => c + 1);
      if (shakeCallback) shakeCallback();
      // SRS Inteligente: reinsere o card no final da fila da sessão para fixação ativa
      setCards(prev => [...prev, { ...atual, _retryCount: (((atual as any)._retryCount || 0) + 1) }]);
    }
    
    salvando.current = true;
    haptic.light();

    setFeitos((f) => f + 1);
    setVirado(false);
    
    // Se era o último card e foi compreendido (ou não há retestes pendentes)
    const proximoIdx = idx + 1;
    const totalAtualizado = status === 'revisar' ? cards.length + 1 : cards.length;
    if (proximoIdx >= totalAtualizado) {
      toast.success('Sessão concluída!');
      setIdx(totalAtualizado);
    } else {
      setIdx(proximoIdx);
    }

    const novoFeitos = feitos + 1;
    const titleParts = [];
    if (areaParam || areasParam) titleParts.push(areaParam || 'Geral');
    if (temasParam) titleParts.push(temasParam.split('|')[0]);
    if (deckId) titleParts.push(`Deck ${deckId}`);
    
    saveFlashcardsSessao({
      id: sessaoId,
      dataInicio: new Date().toISOString(),
      dataUltimoAcesso: new Date().toISOString(),
      queryString: params.toString() + (params.has('sessaoId') ? '' : `&sessaoId=${sessaoId}`),
      filtroAplicado: titleParts.join(' • ') || 'Sessão Personalizada',
      cardsRevisados: novoFeitos,
      totalCards: cards.length,
    });

    supabase.auth.getUser().then(({ data: auth }) => {
      if (auth.user) {
        supabase.from('flashcards_progresso').upsert(
          {
            user_id: auth.user.id,
            card_id: atual.id,
            area: atual.area,
            tema: atual.tema,
            status,
            ultima_resposta_em: new Date().toISOString(),
          },
          { onConflict: 'user_id,card_id' },
        ).then(({ error }) => {
          if (error) toast.error('Não foi possível salvar o progresso');
        });
      }
    });

    gateFlashcards.run();
    
    setTimeout(() => {
      salvando.current = false;
    }, 250);
  }, [atual, idx, cards.length, feitos, areaParam, areasParam, temasParam, deckId, params, sessaoId, gateFlashcards]);

  const setParam = useCallback((k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k === 'area') { next.delete('tema'); next.delete('temas'); }
    setParams(next, { replace: true });
  }, [params, setParams]);

  const toggleOrdem = useCallback(() => {
    const next = new URLSearchParams(params);
    const newOrdem = ordemParam === 'sequencial' ? 'embaralhado' : 'sequencial';
    next.set('ordem', newOrdem);
    setParams(next, { replace: true });
    haptic.selection();
  }, [params, ordemParam, setParams]);

  // Performance por Título
  const sessionPerTitle = useMemo(() => {
    if (!cards.length) return [];
    const map: Record<string, { total: number; done: number }> = {};
    cards.forEach(c => {
      const key = c.tema || c.area || 'Geral';
      if (!map[key]) map[key] = { total: 0, done: 0 };
      map[key].total++;
    });
    cards.slice(0, idx).forEach(c => {
      const key = c.tema || c.area || 'Geral';
      if (map[key]) map[key].done++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, pct: v.total ? Math.round((v.done / v.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [cards, idx]);

  // Atalhos de Teclado no Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (emContagem || !atual || salvando.current) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        virar();
      } else if (virado && (e.key === '1' || e.code === 'ArrowLeft')) {
        e.preventDefault();
        responder('revisar');
      } else if (virado && (e.key === '2' || e.code === 'ArrowRight')) {
        e.preventDefault();
        responder('compreendido');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emContagem, atual, virado, virar, responder]);

  return {
    params,
    setParam,
    escolhendo,
    loading,
    emContagem,
    setEmContagem,
    cards,
    totalCardsOriginal,
    idx,
    feitos,
    atual,
    virado,
    virar,
    responder,
    sessionCompreendidos,
    sessionRevisar,
    exitDirection,
    sessionPerTitle,
    ordemParam,
    toggleOrdem,
    gateFlashcards,
    refetchCards,
    areaParam,
    temasParam,
    setFeitos,
    savedIndexToResume,
    confirmResume,
  };
}
