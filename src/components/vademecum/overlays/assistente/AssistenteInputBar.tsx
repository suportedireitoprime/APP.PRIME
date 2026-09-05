import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  Paperclip,
  X,
  Loader2,
  Mic,
  Camera,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { Attachment } from './assistenteTypes';

interface AssistenteInputBarProps {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSendMessage: () => void;
  attachment: Attachment | null;
  setAttachment: (att: Attachment | null) => void;
  attachOpen: boolean;
  setAttachOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  onAbrirAnexos: () => void;
  onTirarFoto: () => void;
  onFileSelected: (file: File) => void;
  isDesktop: boolean;
  voice: {
    listening: boolean;
    toggle: () => void;
  };
  onToggleMic: () => void;
}

export const AssistenteInputBar: React.FC<AssistenteInputBarProps> = ({
  input,
  setInput,
  loading,
  onSendMessage,
  attachment,
  setAttachment,
  attachOpen,
  setAttachOpen,
  onAbrirAnexos,
  onTirarFoto,
  onFileSelected,
  isDesktop,
  voice,
  onToggleMic,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        className={
          isDesktop
            ? 'relative px-6 pb-6 pt-3 bg-gradient-to-t from-[#07080b] via-[#07080b]/95 to-transparent'
            : 'relative px-3.5 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3 bg-gradient-to-t from-[#07080b] via-[#07080b]/95 to-transparent'
        }
      >
        <div className="mx-auto w-full max-w-3xl rounded-[28px] bg-zinc-900/90 sm:bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col p-2 transition-all focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/25">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 px-3.5 py-2 mx-1 rounded-2xl bg-white/10 border border-white/10">
              <Paperclip className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs font-body text-foreground truncate flex-1 font-medium">
                {attachment.name}
              </span>
              <button
                onClick={() => setAttachment(null)}
                className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 relative">
            <button
              onClick={() => {
                haptic.selection();
                onAbrirAnexos();
              }}
              aria-label="Anexar"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-90 touch-manipulation cursor-pointer"
            >
              <Plus className="w-6 h-6" strokeWidth={2.2} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              rows={1}
              placeholder={voice.listening ? 'Ouvindo…' : 'Mensagem...'}
              className="flex-1 min-h-[48px] max-h-36 bg-transparent px-2 py-3 text-[16px] font-body text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-none leading-relaxed"
            />

            {input.trim() || attachment ? (
              <button
                onClick={() => {
                  haptic.light();
                  onSendMessage();
                }}
                disabled={loading}
                aria-label="Enviar mensagem"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0 shadow-[0_4px_18px_rgba(255,255,255,0.35)] transition-all active:scale-90 disabled:opacity-50 touch-manipulation cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
                ) : (
                  <Send className="w-5 h-5 text-zinc-950 ml-0.5" strokeWidth={2.4} />
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  haptic.selection();
                  onToggleMic();
                }}
                aria-label="Gravar áudio"
                className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 touch-manipulation cursor-pointer ${
                  voice.listening
                    ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.5)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                <Mic className="w-5 h-5" strokeWidth={2.2} />
                {voice.listening && (
                  <span className="absolute inset-1 rounded-full ring-2 ring-red-400 animate-ping" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected(f);
              e.target.value = '';
            }}
          />
        </div>

        {!isDesktop && (
          <div className="text-center mt-2.5 px-4">
            <p className="text-[10px] text-muted-foreground/60 font-body tracking-wider">
              O Chat Jurídico pode cometer erros. Considere verificar as fontes.
            </p>
          </div>
        )}
      </div>

      {voice.listening && (
        <div
          className="fixed left-4 right-4 z-[64] pointer-events-none flex justify-center"
          style={{ bottom: 'calc(11rem + var(--sai-bottom, 0px))' }}
        >
          <div className="px-3 py-1.5 rounded-full bg-red-500/95 text-white text-[11px] font-body shadow-lg">
            🎙️ Ouvindo… fale agora
          </div>
        </div>
      )}

      {/* Menu flutuante do + (Câmera / Tirar Foto) */}
      <AnimatePresence>
        {attachOpen && (
          <>
            <div
              className="fixed inset-0 z-[68]"
              onClick={() => setAttachOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="fixed left-3 z-[69] bg-card border border-border rounded-2xl shadow-2xl p-2 flex flex-col gap-1 min-w-[200px]"
              style={{ bottom: 'calc(9.5rem + var(--sai-bottom, 0px))' }}
            >
              <button
                onClick={() => {
                  haptic.light();
                  setAttachOpen(false);
                  void onTirarFoto();
                }}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors text-left"
              >
                <Camera className="w-[26px] h-[26px] text-sky-400" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block text-[15px] font-body font-semibold text-foreground tracking-tight">
                    Câmera
                  </span>
                  <span className="block text-[11px] text-muted-foreground/70">Tirar foto</span>
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
