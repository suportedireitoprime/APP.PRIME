import { registerPlugin } from '@capacitor/core';

export interface NativeAudioPlugin {
  /**
   * Inicializa o player com duas faixas (Intro e Main) para fazer o fade.
   * Na web, pode ser ignorado.
   */
  prepare(options: { 
    introUrl: string; 
    mainUrl: string; 
    title: string; 
    author: string; 
    coverUrl?: string; 
  }): Promise<{ success: boolean }>;

  play(): Promise<void>;
  pause(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  stop(): Promise<void>;
  
  /**
   * Pega o progresso atual em segundos.
   * trackIndex: 0 = Intro, 1 = Main
   */
  getProgress(): Promise<{ currentTime: number, duration: number, isPlaying: boolean, trackIndex: number }>;
}

export const NativeAudio = registerPlugin<NativeAudioPlugin>('NativeAudio');
