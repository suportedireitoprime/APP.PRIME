import { useCallback, useEffect, useMemo, useState } from 'react'
import { FLASHCARDS, QUIZ, TRECHOS } from '../data/article5'
import type { ProgressState, ProgressSummary } from '../types'

const STORAGE_KEY = 'atlas-juridico-art5-progress-v1'

interface StoredProgress {
  read: number[]
  quizAnswered: number
  quizRight: number
  fcSeen: number[]
  listened: boolean
  watched: boolean
}

function loadStored(): StoredProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    return {
      read: Array.isArray(parsed.read) ? parsed.read : [],
      quizAnswered: typeof parsed.quizAnswered === 'number' ? parsed.quizAnswered : 0,
      quizRight: typeof parsed.quizRight === 'number' ? parsed.quizRight : 0,
      fcSeen: Array.isArray(parsed.fcSeen) ? parsed.fcSeen : [],
      listened: parsed.listened === true,
      watched: parsed.watched === true,
    }
  } catch {
    return null
  }
}

/**
 * Progresso do artigo, nas mesmas 5 partes do protótipo:
 * trechos lidos, quiz, flashcards, áudio ouvido e vídeo assistido.
 * Persiste em localStorage (na versão nativa, trocar por AsyncStorage —
 * ver README).
 */
export function useProgress() {
  const [state, setState] = useState<ProgressState>(() => {
    const stored = loadStored()
    return {
      read: new Set(stored?.read ?? []),
      quizAnswered: stored?.quizAnswered ?? 0,
      quizRight: stored?.quizRight ?? 0,
      fcSeen: new Set(stored?.fcSeen ?? []),
      listened: stored?.listened ?? false,
      watched: stored?.watched ?? false,
    }
  })

  useEffect(() => {
    try {
      const stored: StoredProgress = {
        read: [...state.read],
        quizAnswered: state.quizAnswered,
        quizRight: state.quizRight,
        fcSeen: [...state.fcSeen],
        listened: state.listened,
        watched: state.watched,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Navegador sem armazenamento: o progresso vale só para a sessão.
    }
  }, [state])

  const toggleRead = useCallback((idx: number) => {
    setState((s) => {
      const read = new Set(s.read)
      if (read.has(idx)) read.delete(idx)
      else read.add(idx)
      return { ...s, read }
    })
  }, [])

  const toggleFlashcard = useCallback((idx: number, flipped: boolean) => {
    setState((s) => {
      const fcSeen = new Set(s.fcSeen)
      if (flipped) fcSeen.add(idx)
      else fcSeen.delete(idx)
      return { ...s, fcSeen }
    })
  }, [])

  const recordQuizAnswer = useCallback((right: boolean) => {
    setState((s) => ({
      ...s,
      quizAnswered: s.quizAnswered + 1,
      quizRight: s.quizRight + (right ? 1 : 0),
    }))
  }, [])

  const resetQuiz = useCallback(() => {
    setState((s) => ({ ...s, quizAnswered: 0, quizRight: 0 }))
  }, [])

  const markListened = useCallback(() => {
    setState((s) => (s.listened ? s : { ...s, listened: true }))
  }, [])

  const markWatched = useCallback(() => {
    setState((s) => (s.watched ? s : { ...s, watched: true }))
  }, [])

  const summary: ProgressSummary = useMemo(() => {
    const checks = {
      texto: state.read.size >= 3,
      ouvir: state.listened,
      assistir: state.watched,
      praticar: state.quizAnswered >= QUIZ.length,
      flash: state.fcSeen.size >= FLASHCARDS.length,
    }
    const parts = [
      state.read.size / TRECHOS.length,
      state.quizAnswered >= QUIZ.length ? state.quizRight / QUIZ.length : 0,
      state.fcSeen.size / FLASHCARDS.length,
      state.listened ? 1 : 0,
      state.watched ? 1 : 0,
    ]
    const pct = Math.round((100 * parts.reduce((a, b) => a + b, 0)) / parts.length)
    return {
      pct,
      readCount: state.read.size,
      readTotal: TRECHOS.length,
      quizScore: state.quizAnswered ? `${state.quizRight}/${state.quizAnswered}` : '—',
      fcCount: state.fcSeen.size,
      fcTotal: FLASHCARDS.length,
      segments: [checks.texto, checks.ouvir, checks.assistir, checks.praticar, checks.flash],
      checks,
    }
  }, [state])

  return {
    state,
    summary,
    toggleRead,
    toggleFlashcard,
    recordQuizAnswer,
    resetQuiz,
    markListened,
    markWatched,
  }
}
