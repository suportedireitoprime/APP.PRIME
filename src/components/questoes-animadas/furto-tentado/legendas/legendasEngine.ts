import { clamp, estDur } from '../narracao/narracaoData';

export interface CaptionState {
  who: string;
  phrases: string[];
  bounds: number[];
  idx: number;
  start: number;
  durMs: number;
}

export function splitPhrases(text: string): string[] {
  const raw = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];

  for (const p of raw) {
    if (p.length <= 42) {
      out.push(p);
      continue;
    }
    const parts = p.split(/(?<=[,;:])\s+/);
    let cur = '';
    for (const part of parts) {
      const cand = cur ? cur + ' ' + part : part;
      if (cand.length > 42 && cur) {
        out.push(cur);
        cur = part;
      } else {
        cur = cand;
      }
    }
    if (cur) out.push(cur);
  }

  return out.length ? out : [text];
}

export function buildCaptionState(who: string, text: string, durationSec?: number): CaptionState {
  const phrases = splitPhrases(text);
  const totalWords = Math.max(1, text.split(/\s+/).length);
  const bounds: number[] = [];
  let acc = 0;

  for (const ph of phrases) {
    acc += Math.max(1, ph.split(/\s+/).length) / totalWords;
    bounds.push(acc);
  }

  const dur = durationSec || estDur(text);
  return {
    who,
    phrases,
    bounds,
    idx: 0,
    start: performance.now(),
    durMs: Math.max(1200, dur * 1000),
  };
}

export function getActiveCaptionPhrase(state: CaptionState | null): { who: string; text: string } | null {
  if (!state) return null;
  const f = clamp((performance.now() - state.start) / state.durMs, 0, 1);
  let i = state.bounds.findIndex((b) => f <= b);
  if (i < 0) i = state.phrases.length - 1;
  const phrase = state.phrases[i] || '';
  const whoPrefix = i === 0 && state.who ? state.who + ': ' : '';
  return {
    who: state.who,
    text: whoPrefix + phrase,
  };
}
