import type React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FileAudio,
  Loader2,
  Mic,
  Square,
  Upload,
  Volume2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import { POPULAR_AUDIO_MODELS } from './omnirouteConfig';

type Props = {
  audioModel: string;
  setAudioModel: (v: string) => void;
  isRecording: boolean;
  recordingSeconds: number;
  startRecording: () => void;
  stopRecording: () => void;
  handleAudioFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioUrl: string | null;
  audioFileName: string | null;
  audioBlob: Blob | null;
  audioLoading: boolean;
  handleTranscribeAudio: () => void;
  audioTranscription: string | null;
  audioMeta: { durationMs: number } | null;
  copyToClipboard: (text: string) => void;
  useTranscriptionInChat: () => void;
};

export default function OmniRouteAudioTab({
  audioModel,
  setAudioModel,
  isRecording,
  recordingSeconds,
  startRecording,
  stopRecording,
  handleAudioFileUpload,
  audioUrl,
  audioFileName,
  audioBlob,
  audioLoading,
  handleTranscribeAudio,
  audioTranscription,
  audioMeta,
  copyToClipboard,
  useTranscriptionInChat,
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#141416] border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-3 px-4 sm:px-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="!font-sans text-base sm:text-lg font-semibold text-white tracking-normal normal-case flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                <span>Transcrição de Áudio & Reconhecimento de Voz</span>
              </h2>
              <p className="!font-sans text-xs text-white/50 mt-1 font-normal tracking-normal normal-case">
                Grave diretamente pelo microfone ou envie um arquivo de áudio (.mp3, .wav, .m4a, .webm) para transcrever
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-white/60 !font-sans">Modelo:</span>
              <select
                value={audioModel}
                onChange={(e) => setAudioModel(e.target.value)}
                className="bg-transparent text-xs text-amber-400 font-mono focus:outline-none cursor-pointer"
              >
                {POPULAR_AUDIO_MODELS.map((m) => (
                  <option key={m} value={m} className="bg-zinc-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-2 !font-sans">
                    <Mic className="w-4 h-4 text-amber-400" />
                    Gravar Microfone ao Vivo
                  </span>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                      {(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 !font-sans">
                  Fale uma dúvida, ementa jurídica ou depoimento
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    type="button"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-10 rounded-xl gap-2 !font-sans cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    <Mic className="w-4 h-4" />
                    Iniciar Gravação
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    type="button"
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 rounded-xl gap-2 !font-sans cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4" />
                    Parar Gravação
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-white flex items-center gap-2 !font-sans">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Carregar Arquivo de Áudio
                </span>
                <p className="text-[11px] text-white/50 !font-sans">
                  Formatos suportados: .mp3, .wav, .m4a, .ogg, .webm
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
                  onChange={handleAudioFileUpload}
                  className="block w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {audioUrl && (
            <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white !font-sans truncate max-w-[200px] sm:max-w-xs">
                    {audioFileName || 'Áudio gravado'}
                  </div>
                  <div className="text-[10.5px] text-white/40 !font-sans">
                    {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : ''}
                  </div>
                </div>
              </div>

              <audio controls src={audioUrl} className="h-8 max-w-[280px]" />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleTranscribeAudio}
              disabled={audioLoading || !audioBlob}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm px-6 h-11 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:opacity-70 transition-all !font-sans cursor-pointer"
            >
              {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileAudio className="w-4 h-4" />}
              {audioLoading ? 'Transcrevendo Áudio...' : 'Transcrever Áudio com IA'}
            </Button>
          </div>

          {audioTranscription && (
            <div className="mt-5 p-4 sm:p-6 bg-[#0e0e10] rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 !font-sans">
                    <CheckCircle2 className="w-4 h-4" />
                    Áudio Transcrito com Sucesso
                  </span>
                  {audioMeta && (
                    <span className="text-xs text-white/50 font-mono bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                      {audioMeta.durationMs}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(audioTranscription)}
                    className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 gap-1.5 rounded-xl !font-sans cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={useTranscriptionInChat}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold px-3 gap-1.5 rounded-xl !font-sans cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <span>Usar no Teste de Texto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-zinc-100 prose prose-invert max-w-none !font-sans bg-black/40 p-4 rounded-xl border border-white/5">
                <PremiumMarkdown>{audioTranscription}</PremiumMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
