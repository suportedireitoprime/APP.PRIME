import React, { useRef, useEffect } from 'react';

export const formatarTempo = (seg: number): string => {
  if (!Number.isFinite(seg) || seg < 0) return '--:--';
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Componente isolado para a barra de progresso do áudio (Performance/Smooth Seek)
export const AudioProgressBar = ({ 
  audioRef, 
  tempoAcumulado,
  duracaoTotal,
  onSeekGlobal
}: { 
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  tempoAcumulado: number;
  duracaoTotal: number;
  onSeekGlobal: (globalTime: number) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      if (audioRef.current && duracaoTotal > 0 && !isDragging.current) {
        const ct = audioRef.current.currentTime;
        const globalTime = tempoAcumulado + ct;
        const pct = Math.min(100, (globalTime / duracaoTotal) * 100);
        if (barRef.current) barRef.current.style.width = `${pct}%`;
        if (timeRef.current) timeRef.current.textContent = formatarTempo(globalTime);
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
  }, [audioRef, tempoAcumulado, duracaoTotal]);

  const handleSeek = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || duracaoTotal <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = offsetX / rect.width;
    const newGlobalTime = pct * duracaoTotal;
    
    if (barRef.current) barRef.current.style.width = `${pct * 100}%`;
    if (timeRef.current) timeRef.current.textContent = formatarTempo(newGlobalTime);
    onSeekGlobal(newGlobalTime);
  };

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        className="h-8 -my-3 flex items-center cursor-pointer"
        onMouseDown={(e) => { isDragging.current = true; handleSeek(e); }}
        onMouseMove={(e) => { if (isDragging.current) handleSeek(e); }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
        onTouchStart={(e) => { isDragging.current = true; handleSeek(e); }}
        onTouchMove={(e) => { if (isDragging.current) handleSeek(e); }}
        onTouchEnd={() => { isDragging.current = false; }}
      >
        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
          <div ref={barRef} className="h-full bg-primary relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full scale-150 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/50 font-body tabular-nums">
        <span ref={timeRef}>0:00</span>
        <span>{duracaoTotal > 0 ? formatarTempo(duracaoTotal) : '--:--'}</span>
      </div>
    </div>
  );
};
