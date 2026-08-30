import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { useFlashcardsSessao, FlashcardCard } from '@/lib/flashcardsQueries';
import { saveFlashcardsSessao, getFlashcardsSessoes } from '@/lib/flashcardsSessoes';
import { useGatedFeature } from '@/hooks/useGatedFeature';

export function useFlashcardsEngine() {
  const [params, setParams] = useSearchParams();

  const areaParam = params.get('area');
  const areasParam = params.get('areas');
  const temasParam = params.get('temas') || params.get('tema');
  const deckId = params.get('deck');
  const modo = params.get('modo') || 'todos';
  const ordemParam = params.get('ordem') || 'embaralhado';
  const quantidadeParam = params.get('quantidade');
  const artigosParam = params.get('artigos');

  const escolhendo = !areaParam && !areasParam && !temasParam && !deckId && modo !== 'edital';
  const limitParam = parseInt(params.get('limite') || '30', 10);
  const listaAreas = areasParam ? areasParam.split('|').filter(Boolean) : areaParam ? [areaParam] : null;
  const temasList = temasParam ? temasParam.split('|').filter(Boolean) : null;
  
  const [sessaoId] = useState(() => params.get('sessaoId') || Date.now().toString());

  const { data: cardsRaw, isLoading: loadingCards, refetch: refetchCards } = useFlashcardsSessao({
    areas: listaAreas,
    temas: temasList,
    modo: modo,
    deckId: deckId,
    limit: limitParam
  }, !escolhendo);

  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [feitos, setFeitos] = useState(0);
  const [sessionCompreendidos, setSessionCompreendidos] = useState(0);
  const [sessionRevisar, setSessionRevisar] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'down'>('left');
  const [emContagem, setEmContagem] = useState(!escolhendo);
  
  const salvando = useRef(false);
  const gateFlashcards = useGatedFeature('flashcards', 'flashcards');
  
  const loading = (loadingCards || emContagem) && !escolhendo;

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
      setIdx(0);
      setVirado(false);
    }
  }, [cardsRaw, ordemParam, artigosParam, quantidadeParam]);

  // Ponto de Retomada
  const sessionKey = `flashcards_pos_${areaParam || areasParam || deckId || 'geral'}_${temasParam || 'todos'}`;

  useEffect(() => {
    if (cards.length > 0) {
      const savedIdx = localStorage.getItem(sessionKey);
      if (savedIdx) {
        const parsed = parseInt(savedIdx, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < cards.length) {
          setIdx(parsed);
        }
      }
    }
  }, [cards, sessionKey]);

  useEffect(() => {
    if (cards.length > 0 && idx >= 0) {
      localStorage.setItem(sessionKey, idx.toString());
    }
  }, [idx, cards.length, sessionKey]);

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
    }
    
    salvando.current = true;
    haptic.light();

    setFeitos((f) => f + 1);
    setVirado(false);
    
    if (idx + 1 >= cards.length) {
      toast.success('Sessão concluída!');
      setIdx(cards.length);
    } else {
      setIdx((i) => i + 1);
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

  return {
    params,
    setParam,
    escolhendo,
    loading,
    emContagem,
    setEmContagem,
    cards,
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
    setFeitos
  };
}
