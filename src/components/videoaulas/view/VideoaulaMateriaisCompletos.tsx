import React, { useState } from 'react';
import { FileText, BookOpen, Brain, Download, Subtitles, ChevronDown, ChevronUp } from 'lucide-react';
import type { VideoaulaDriveItem } from '@/data/videoaulas/videoaulasDriveData';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  item: VideoaulaDriveItem;
}

export const VideoaulaMateriaisCompletos: React.FC<Props> = ({ item }) => {
  const [showTranscricao, setShowTranscricao] = useState(false);

  const downloadFile = (url: string, filename: string) => {
    haptic.selection();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4.5 rounded-full bg-amber-400 shrink-0" />
          <h3 className="font-sans text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            Materiais de Apoio Oficiais
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          Arquivos R2
        </span>
      </div>

      {/* Grid de Materiais em PDF e Legenda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Resumo Completo */}
        {item.resumoCompletoUrl && (
          <a
            href={item.resumoCompletoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.selection()}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/40 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                Resumo Completo
              </p>
              <p className="text-[11px] text-zinc-400 truncate">Documento PDF formatado</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 shrink-0 transition-colors" />
          </a>
        )}

        {/* Resumo Cornell */}
        {item.resumoCornellUrl && (
          <a
            href={item.resumoCornellUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.selection()}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/40 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                Método Cornell
              </p>
              <p className="text-[11px] text-zinc-400 truncate">Notas, palavras-chave e síntese</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 shrink-0 transition-colors" />
          </a>
        )}

        {/* Mapa Mental */}
        {item.mapaMentalUrl && (
          <a
            href={item.mapaMentalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.selection()}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 hover:border-cyan-500/40 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                Mapa Mental
              </p>
              <p className="text-[11px] text-zinc-400 truncate">Esquematização visual em PDF</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 shrink-0 transition-colors" />
          </a>
        )}

        {/* Legenda SRT */}
        {item.srtUrl && (
          <button
            type="button"
            onClick={() => downloadFile(item.srtUrl, `${item.slug || 'legenda'}.srt`)}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 hover:border-purple-500/40 transition-all group active:scale-[0.98] text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <Subtitles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                Legenda Oficial (SRT)
              </p>
              <p className="text-[11px] text-zinc-400 truncate">Sincronização com o áudio</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 shrink-0 transition-colors" />
          </button>
        )}
      </div>

      {/* Accordion Transcrição Completa */}
      {item.transcricao && (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-950/40">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setShowTranscricao((prev) => !prev);
            }}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-800/30 transition-colors"
          >
            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              Transcrição Integral da Aula
            </span>
            {showTranscricao ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showTranscricao && (
            <div className="p-3.5 pt-0 border-t border-white/5 text-xs sm:text-sm text-zinc-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-line space-y-2">
              {item.transcricao}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
