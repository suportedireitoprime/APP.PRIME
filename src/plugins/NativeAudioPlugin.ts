import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface PrepareAudioOptions {
  mainUrl: string;
  introUrl?: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  speed?: number;
}

export interface AudioProgress {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  trackIndex: number;
}

export interface NativeAudioPluginInterface {
  prepare(options: PrepareAudioOptions): Promise<{ success: boolean }>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  setSpeed(options: { speed: number }): Promise<void>;
  stop(): Promise<void>;
  getProgress(): Promise<AudioProgress>;
  addListener(
    eventName: 'onTimeUpdate',
    listenerFunc: (progress: AudioProgress) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'onEnded',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'onRemoteAction',
    listenerFunc: (action: { type: 'play' | 'pause' | 'next' | 'previous' | 'seek'; time?: number }) => void,
  ): Promise<PluginListenerHandle>;
}

const RawNativeAudio = registerPlugin<NativeAudioPluginInterface>('NativeAudio');

export const NativeAudio = {
  isAvailable: () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('NativeAudio'),

  async prepare(options: PrepareAudioOptions): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false };
    return RawNativeAudio.prepare(options);
  },

  async play(): Promise<void> {
    if (!this.isAvailable()) return;
    return RawNativeAudio.play();
  },

  async pause(): Promise<void> {
    if (!this.isAvailable()) return;
    return RawNativeAudio.pause();
  },

  async seek(time: number): Promise<void> {
    if (!this.isAvailable()) return;
    return RawNativeAudio.seek({ time });
  },

  async setSpeed(speed: number): Promise<void> {
    if (!this.isAvailable()) return;
    return RawNativeAudio.setSpeed({ speed });
  },

  async stop(): Promise<void> {
    if (!this.isAvailable()) return;
    return RawNativeAudio.stop();
  },

  async getProgress(): Promise<AudioProgress | null> {
    if (!this.isAvailable()) return null;
    return RawNativeAudio.getProgress();
  },

  async addListener(
    eventName: 'onTimeUpdate' | 'onEnded' | 'onRemoteAction',
    listenerFunc: any,
  ): Promise<PluginListenerHandle | null> {
    if (!this.isAvailable()) return null;
    return RawNativeAudio.addListener(eventName as any, listenerFunc);
  },
};

export default NativeAudio;
