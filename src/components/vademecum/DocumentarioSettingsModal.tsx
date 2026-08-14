import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Upload, Check, Volume2, Mic } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { SOCRATES_ROTEIROS, PLATAO_ROTEIROS, ARISTOTELES_ROTEIROS, RoteiroItem } from './roteiros';

type Props = {
  open: boolean;
  onClose: () => void;
  personagemId: string;
  styleVersion: number;
  onStyleChange: (v: number) => void;
  audioMode: 'native' | 'custom';
  onAudioModeChange: (m: 'native' | 'custom') => void;
  customAudioFile: File | null;
  onCustomAudioFileChange: (file: File | null) => void;
};

const ROTEIROS_MAP: Record<string, Record<number, RoteiroItem[]>> = {
  socrates: SOCRATES_ROTEIROS,
  platao: PLATAO_ROTEIROS,
  aristoteles: ARISTOTELES_ROTEIROS,
};

export const DocumentarioSettingsModal: React.FC<Props> = ({
  open,
  onClose,
  personagemId,
  styleVersion,
  onStyleChange,
  audioMode,
  onAudioModeChange,
  customAudioFile,
  onCustomAudioFileChange,
}) => {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFullScript = () => {
    const roteiros = ROTEIROS_MAP[personagemId || 'socrates'];
    if (!roteiros) return '';
    const roteiro = roteiros[styleVersion] || roteiros[1];
    return roteiro.map((r) => r.text).join(' ');
  };

  const handleCopyScript = () => {
    haptic.selection();
    const script = getFullScript();
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomAudioFileChange(file);
      onAudioModeChange('custom');
      haptic.medium();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-wide">Configurações do Documentário</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Secão 1: ESTILO VISUAL */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase">1. Estilo Visual</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 1, title: 'Versão 1: Dinâmica', desc: '(TikTok/Shorts, Geometrias Rotativas, Rápido)' },
                    { id: 2, title: 'Versão 2: Cinematográfica', desc: '(Netflix, Fade, Zoom Lento)' },
                    { id: 3, title: 'Versão 3: Minimalista', desc: '(Apple, Fundo Escuro, Tipografia Pura)' },
                  ].map(st => {
                    const isActive = styleVersion === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => { haptic.selection(); onStyleChange(st.id); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${isActive ? 'bg-[#2A1115] border-red-900/50' : 'bg-[#1A1A1A] border-white/5 hover:border-white/20'}`}
                      >
                        <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                          {st.title}
                        </div>
                        <div className={`text-sm mt-1 ${isActive ? 'text-red-400/80' : 'text-zinc-500'}`}>
                          {st.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: ROTEIRO E NARRAÇÃO */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 tracking-widest uppercase">2. Roteiro e Narração</h3>
                
                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Script da Narração</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Texto exato ajustado para a versão selecionada.</p>
                    </div>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar Script'}
                    </button>
                  </div>

                  <hr className="border-white/10" />

                  <div className="space-y-3">
                    <p className="text-white font-medium">Fonte do Áudio</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { haptic.selection(); onAudioModeChange('native'); }}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${audioMode === 'native' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/50 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                      >
                        <Mic className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">Voz Nativa (Robô)</span>
                      </button>
                      
                      <button
                        onClick={() => { haptic.selection(); fileInputRef.current?.click(); }}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${audioMode === 'custom' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/50 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                      >
                        <Volume2 className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">{customAudioFile ? 'Áudio Carregado' : 'Subir Áudio (IA)'}</span>
                      </button>
                    </div>

                    <input 
                      type="file" 
                      accept="audio/mp3,audio/wav,audio/mpeg" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    {customAudioFile && (
                      <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded-lg border border-white/5 mt-2">
                        <span className="text-xs text-zinc-400 truncate max-w-[200px]">{customAudioFile.name}</span>
                        <button 
                          onClick={() => { haptic.selection(); onCustomAudioFileChange(null); onAudioModeChange('native'); }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-white/10 bg-[#0A0A0A]">
              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl hover:bg-primary/90 transition-all active:scale-95 text-lg"
              >
                Confirmar Configurações
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
