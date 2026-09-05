import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
}

export function CustomAudioPlayer({ src, title }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Reset state when src changes
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-sm w-full">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <button 
        onClick={togglePlay}
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
      </button>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {title && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{title}</span>}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground min-w-[32px] text-right">{formatTime(progress)}</span>
          <div 
            className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              if (audioRef.current) {
                audioRef.current.currentTime = percent * duration;
                setProgress(audioRef.current.currentTime);
              }
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 ease-linear group-hover:bg-primary/90" 
              style={{ width: `${(progress / (duration || 1)) * 100}%` }} 
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground min-w-[32px]">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
