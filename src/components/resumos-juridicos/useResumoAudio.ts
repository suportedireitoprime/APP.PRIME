import { useState, useEffect, useRef, useCallback } from "react";
import { setupMediaSession, clearMediaSession } from "@/lib/mediaSession";
import { haptic } from "@/lib/nativeHaptics";

interface UseResumoAudioParams {
  audioUrl?: string | null;
  titulo?: string;
  subtitulo?: string;
}

export function useResumoAudio({ audioUrl, titulo, subtitulo }: UseResumoAudioParams) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(false);
      clearMediaSession();
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audio.playbackRate = playbackRate;
    audio.muted = isMuted;
    audioRef.current = audio;
    setIsLoading(true);

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onPlay = () => {
      setIsPlaying(true);
      setupMediaSession({
        title: titulo || "Resumo Jurídico",
        artist: subtitulo || "Direito Prime",
        album: "Resumos Jurídicos",
        audio,
      });
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      clearMediaSession();
    };
  }, [audioUrl, titulo, subtitulo]);

  const togglePlay = useCallback(() => {
    haptic.selection();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const skipSeconds = useCallback((sec: number) => {
    haptic.selection();
    const audio = audioRef.current;
    if (!audio) return;
    const novo = Math.max(0, Math.min(audio.currentTime + sec, audio.duration || 0));
    audio.currentTime = novo;
    setCurrentTime(novo);
  }, []);

  const seekTo = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const novo = Math.max(0, Math.min(sec, audio.duration || 0));
    audio.currentTime = novo;
    setCurrentTime(novo);
  }, []);

  const cycleSpeed = useCallback(() => {
    haptic.selection();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }, [playbackRate]);

  const toggleMute = useCallback(() => {
    haptic.selection();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progressPct,
    playbackRate,
    isMuted,
    togglePlay,
    skipSeconds,
    seekTo,
    cycleSpeed,
    toggleMute,
  };
}
