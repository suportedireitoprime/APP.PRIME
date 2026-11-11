import { useState, useEffect, useCallback, useMemo } from 'react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { 
  carregarProgressoSupabase, 
  salvarProgressoSupabase, 
  carregarFavoritosSupabase, 
  alternarFavoritoSupabase 
} from '@/services/aulasSyncService';

const PROGRESSO_STORAGE_KEY = 'aulas_interativas_progresso_v1';
const FLASHCARDS_STORAGE_KEY = 'aulas_interativas_flashcards_v1';
const QUESTOES_STORAGE_KEY = 'aulas_interativas_questoes_v1';

function getStoredProgresso(): Record<string, { etapaAtual: number }> {
  try {
    const raw = localStorage.getItem(PROGRESSO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredProgresso(aulaId: string, etapaAtual: number) {
  try {
    const atual = getStoredProgresso();
    atual[aulaId] = { etapaAtual };
    localStorage.setItem(PROGRESSO_STORAGE_KEY, JSON.stringify(atual));
  } catch {}
}

function getStoredBooleanMap(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredBoolean(key: string, id: string, val: boolean) {
  try {
    const atual = getStoredBooleanMap(key);
    atual[id] = val;
    localStorage.setItem(key, JSON.stringify(atual));
  } catch {}
}

export function useAulasProgresso(todasAulas: AulaItem[]) {
  const [progressoMap, setProgressoMap] = useState<Record<string, { etapaAtual: number }>>(() => getStoredProgresso());
  const [flashcardsConcluidos, setFlashcardsConcluidos] = useState<Record<string, boolean>>(() => getStoredBooleanMap(FLASHCARDS_STORAGE_KEY));
  const [questoesConcluidas, setQuestoesConcluidas] = useState<Record<string, boolean>>(() => getStoredBooleanMap(QUESTOES_STORAGE_KEY));
  const [acertosMap, setAcertosMap] = useState<Record<string, { acertos: number; total: number }>>({});
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const [toastAviso, setToastAviso] = useState<string | null>(null);

  // Auto-dismiss do toast
  useEffect(() => {
    if (!toastAviso) return;
    const timer = setTimeout(() => setToastAviso(null), 3500);
    return () => clearTimeout(timer);
  }, [toastAviso]);

  // Sincronização inicial com o Supabase (Single Source of Truth)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [progData, favData] = await Promise.all([
          carregarProgressoSupabase(),
          carregarFavoritosSupabase()
        ]);
        if (!mounted) return;
        setProgressoMap(progData.progressoMap);
        setFlashcardsConcluidos(progData.flashcardsMap);
        setQuestoesConcluidas(progData.questoesMap);
        setAcertosMap(progData.acertosMap);
        setFavoritosIds(favData);
      } catch (err) {
        console.warn('[useAulasProgresso] Falha na sincronização remota inicial:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cálculo ponderado do progresso de cada aula individual (Aula 34% + Flashcards 33% + Questões 33% = 100%)
  const calcularProgressoCiclo = useCallback((aula: AulaItem) => {
    const salvo = progressoMap[aula.id];
    const etapaAtual = salvo ? salvo.etapaAtual : 0;
    
    // Pilar 1: Aula (vale até 34%)
    const aulaTerminada = etapaAtual >= aula.etapas;
    const pctAula = aulaTerminada 
      ? 34 
      : aula.etapas > 0 
        ? Math.round((etapaAtual / aula.etapas) * 34) 
        : 0;

    // Pilar 2: Flashcards (vale 33%)
    const fcOk = !!flashcardsConcluidos[aula.id];
    const pctFlashcards = fcOk ? 33 : 0;

    // Pilar 3: Praticar / Questões (vale 33%)
    const questoesOk = !!questoesConcluidas[aula.id];
    const pctQuestoes = questoesOk ? 33 : 0;

    const fasesConcluidasCount = (aulaTerminada ? 1 : 0) + (fcOk ? 1 : 0) + (questoesOk ? 1 : 0);
    const cicloCompleto = fasesConcluidasCount === 3;
    const porcentagemTotal = cicloCompleto ? 100 : Math.min(99, pctAula + pctFlashcards + pctQuestoes);

    return {
      etapaAtual,
      totalEtapas: aula.etapas,
      aulaTerminada,
      fcOk,
      questoesOk,
      fasesConcluidasCount,
      porcentagemTotal,
      cicloCompleto
    };
  }, [flashcardsConcluidos, progressoMap, questoesConcluidas]);

  // Progresso Geral da Plataforma
  const { porcentagemGeral, ciclosGeralCompletos } = useMemo(() => {
    const totalAulasGeral = todasAulas.length;
    if (totalAulasGeral === 0) return { porcentagemGeral: 0, ciclosGeralCompletos: 0 };
    const somaPorcentagensGeral = todasAulas.reduce((acc, aula) => acc + calcularProgressoCiclo(aula).porcentagemTotal, 0);
    const pct = Math.round(somaPorcentagensGeral / totalAulasGeral);
    const completos = todasAulas.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
    return { porcentagemGeral: pct, ciclosGeralCompletos: completos };
  }, [calcularProgressoCiclo, todasAulas]);

  const registrarInicioAula = useCallback((aula: AulaItem) => {
    if (!progressoMap[aula.id] || progressoMap[aula.id].etapaAtual === 0) {
      saveStoredProgresso(aula.id, 1);
      setProgressoMap(prev => ({ ...prev, [aula.id]: { etapaAtual: 1 } }));
      salvarProgressoSupabase({
        aula,
        etapaAtual: 1,
        aulaTerminada: false,
        flashcardsRevisados: !!flashcardsConcluidos[aula.id],
        questoesPraticadas: !!questoesConcluidas[aula.id]
      });
    }
  }, [flashcardsConcluidos, progressoMap, questoesConcluidas]);

  const atualizarEtapaManual = useCallback((aulaId: string, etapaAtual: number) => {
    saveStoredProgresso(aulaId, etapaAtual);
    setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual } }));
  }, []);

  const concluirAulaManual = useCallback((aulaId: string, totalEtapas: number) => {
    saveStoredProgresso(aulaId, totalEtapas);
    setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: totalEtapas } }));
    setToastAviso('Fase 1 (Aula) concluída! Fase 2 (Revisar Flashcards) liberada.');
    const aula = todasAulas.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: totalEtapas,
        aulaTerminada: true,
        flashcardsRevisados: !!flashcardsConcluidos[aulaId],
        questoesPraticadas: !!questoesConcluidas[aulaId]
      });
    }
  }, [flashcardsConcluidos, questoesConcluidas, todasAulas]);

  const concluirFlashcards = useCallback((aulaId: string) => {
    setStoredBoolean(FLASHCARDS_STORAGE_KEY, aulaId, true);
    setFlashcardsConcluidos(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Fase 2 (Flashcards) concluída! Fase 3 (Praticar Questões) liberada.');
    const aula = todasAulas.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: progressoMap[aulaId]?.etapaAtual || aula.etapas,
        aulaTerminada: true,
        flashcardsRevisados: true,
        questoesPraticadas: !!questoesConcluidas[aulaId]
      });
    }
  }, [progressoMap, questoesConcluidas, todasAulas]);

  const concluirQuestoes = useCallback((aulaId: string, acertos = 10, total = 10) => {
    setStoredBoolean(QUESTOES_STORAGE_KEY, aulaId, true);
    setQuestoesConcluidas(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Parabéns! 100% da aula concluída (Aula + Flashcards + Questões)!');
    const aula = todasAulas.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: progressoMap[aulaId]?.etapaAtual || aula.etapas,
        aulaTerminada: true,
        flashcardsRevisados: true,
        questoesPraticadas: true,
        acertosQuestoes: acertos,
        totalQuestoes: total
      });
    }
  }, [progressoMap, todasAulas]);

  const alternarFavorito = useCallback((aulaOuId: AulaItem | string) => {
    const aulaId = typeof aulaOuId === 'string' ? aulaOuId : aulaOuId.id;
    const aulaObj = typeof aulaOuId === 'string' ? todasAulas.find(a => a.id === aulaId) : aulaOuId;

    setFavoritosIds(prev => {
      const next = new Set(prev);
      const isFav = next.has(aulaId);
      if (isFav) {
        next.delete(aulaId);
        setToastAviso('Removida dos favoritos');
      } else {
        next.add(aulaId);
        setToastAviso('Adicionada aos favoritos');
      }
      if (aulaObj) {
        alternarFavoritoSupabase(aulaObj, isFav);
      }
      return next;
    });
  }, [todasAulas]);

  return {
    progressoMap,
    setProgressoMap,
    flashcardsConcluidos,
    questoesConcluidas,
    acertosMap,
    favoritosIds,
    toastAviso,
    setToastAviso,
    calcularProgressoCiclo,
    porcentagemGeral,
    ciclosGeralCompletos,
    registrarInicioAula,
    atualizarEtapaManual,
    concluirAulaManual,
    concluirFlashcards,
    concluirQuestoes,
    alternarFavorito,
  };
}
