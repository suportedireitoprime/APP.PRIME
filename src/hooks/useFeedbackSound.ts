/**
 * Hook para tocar sons de feedback (acerto/erro) usando Web Audio API
 */
export const useFeedbackSound = () => {
  const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          resolve();
          return;
        }
        
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        
        if (type === 'correct') {
          // Som de acerto: acordes ascendentes (alegre)
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // Dó
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08); // Mi
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16); // Sol
        } else {
          // Som de erro: tom descendente (triste)
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // Mi
          oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12); // Dó grave
        }
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
        
        setTimeout(() => {
          audioContext.close();
          resolve();
        }, 300);
      } catch (err) {
        console.error('Erro ao tocar som:', err);
        resolve();
      }
    });
  };

  return { playFeedbackSound };
};

// Função standalone para uso sem hook
export const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve();
        return;
      }
      
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      
      if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
      } else {
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12);
      }
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
      
      setTimeout(() => {
        audioContext.close();
        resolve();
      }, 300);
    } catch (err) {
      console.error('Erro ao tocar som:', err);
      resolve();
    }
  });
};

// Som curto de transição (swoosh tipo "card flip") entre perguntas
export const playTransitionSound = (): void => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.24);
    setTimeout(() => ctx.close(), 280);
  } catch {}
};

// Som refinado de conquista / desbloqueio VIP (arpejo harmônico cristalino em acorde maior)
export const playAchievementSound = (): void => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.4 }, // C5
      { freq: 659.25, time: 0.08, dur: 0.45 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.55 }, // G5
      { freq: 1046.50, time: 0.24, dur: 0.85 }, // C6 (brilho cristalino no ápice)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.05);
    });

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1200);
  } catch {}
};

