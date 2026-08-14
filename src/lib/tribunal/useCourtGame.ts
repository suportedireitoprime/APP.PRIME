import { useCallback, useEffect, useState } from 'react';
import { CharacterRole, Choice, COURT_SCRIPT, GameScores, INITIAL_SCORES } from './courtGameData';

export type Verdict = 'absolvicao' | 'condenacao' | 'acordo' | 'nulidade' | null;

const clampScore = (value: number) => Math.min(100, Math.max(0, value));

export function useCourtGame() {
  const [phaseId, setPhaseId] = useState<string>('1_abertura');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [scores, setScores] = useState<GameScores>(INITIAL_SCORES);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [actionNonce, setActionNonce] = useState(0);

  const currentPhase = COURT_SCRIPT[phaseId];
  const isLastDialogue = dialogueIndex >= currentPhase.dialogues.length - 1;
  const currentDialogue = currentPhase.dialogues[dialogueIndex];

  const calculateVerdict = useCallback(() => {
    if (scores.credibilidadeDefesa > 70 && scores.forcaAcusacao < 30) {
      setVerdict('absolvicao');
    } else if (scores.dominioTecnico > 80 && scores.pacienciaJuiz < 30) {
      setVerdict('nulidade');
    } else if (scores.credibilidadeDefesa > 50 && scores.forcaAcusacao > 40) {
      setVerdict('acordo');
    } else {
      setVerdict('condenacao');
    }
  }, [scores]);

  const advanceDialogue = useCallback(() => {
    if (!isLastDialogue) {
      setDialogueIndex((prev) => prev + 1);
      return;
    }

    if (currentPhase.nextPhase && !currentPhase.choices) {
      if (currentPhase.id === '8_alegacoes') {
        calculateVerdict();
      }
      setPhaseId(currentPhase.nextPhase);
      setDialogueIndex(0);
    }
  }, [calculateVerdict, currentPhase, isLastDialogue]);

  const makeChoice = useCallback((choice: Choice) => {
    setScores((prev) => ({
      credibilidadeDefesa: clampScore(prev.credibilidadeDefesa + (choice.scoreImpact.credibilidadeDefesa || 0)),
      forcaAcusacao: clampScore(prev.forcaAcusacao + (choice.scoreImpact.forcaAcusacao || 0)),
      pacienciaJuiz: clampScore(prev.pacienciaJuiz + (choice.scoreImpact.pacienciaJuiz || 0)),
      dominioTecnico: clampScore(prev.dominioTecnico + (choice.scoreImpact.dominioTecnico || 0)),
    }));

    if (choice.feedback) {
      setFeedbacks((prev) => [...prev, choice.feedback!]);
    }

    if (choice.id === 'pergunta_objetiva' || choice.id === 'objetar_indutiva' || choice.id === 'prova_documental') {
      setActionNonce((prev) => prev + 1);
      courtAudio.playObjection();
    }

    setPhaseId(choice.nextPhase);
    setDialogueIndex(0);
  }, []);

  const resetGame = () => {
    setScores(INITIAL_SCORES);
    setPhaseId('1_abertura');
    setDialogueIndex(0);
    setVerdict(null);
    setFeedbacks([]);
    setActionNonce(0);
  };

  useEffect(() => {
    const initAudio = () => courtAudio.init();
    document.addEventListener('click', initAudio, { once: true });
    return () => document.removeEventListener('click', initAudio);
  }, []);

  useEffect(() => {
    const handleAudio = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'blip') {
        courtAudio.playBlip();
      }
    };

    window.addEventListener('court_audio', handleAudio);
    return () => window.removeEventListener('court_audio', handleAudio);
  }, []);

  return {
    phase: currentPhase,
    dialogue: currentDialogue,
    isLastDialogue,
    scores,
    verdict,
    feedbacks,
    actionNonce,
    advanceDialogue,
    makeChoice,
    resetGame,
  };
}

class CourtAudioEngine {
  private ctx: AudioContext | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  playBlip(speaker?: CharacterRole) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const baseFrequency = getSpeakerFrequency(speaker);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFrequency + Math.random() * 80, this.ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.065);
  }

  playObjection() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

export const courtAudio = new CourtAudioEngine();

function getSpeakerFrequency(speaker?: CharacterRole) {
  switch (speaker) {
    case 'juiz':
      return 330;
    case 'promotor':
      return 430;
    case 'defesa':
      return 520;
    case 'reu':
      return 470;
    case 'testemunha':
      return 560;
    case 'professor':
      return 620;
    default:
      return 500;
  }
}
