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
  ImageIcon,
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
  onInteract?: (e?: React.SyntheticEvent) => boolean | void;
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
  onInteract,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        className={
          isDesktop
            ? 'relative px-6 pb-6 pt-3 bg-gradient-to-t from-[#080306] via-[#080306]/95 to-transparent'
            : 'relative px-3.5 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3 bg-gradient-to-t from-[#080306] via-[#080306]/95 to-transparent'
        }
      >
        <div className="mx-auto w-full max-w-3xl rounded-[28px] bg-gradient-to-b from-[#18070d]/95 via-[#100508]/95 to-[#080306]/95 backdrop-blur-2xl border border-rose-900/40 shadow-[0_16px_44px_rgba(0,0,0,0.85)] flex flex-col p-2 transition-all focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 px-3.5 py-2 mx-1 rounded-2xl bg-[#240b12] border border-rose-500/35">
              <Paperclip className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-body text-zinc-100 truncate flex-1 font-medium">
                {attachment.name}
              </span>
              <button
                onClick={() => setAttachment(null)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 relative">
            {/* Botão de Anexos (+) */}
            <button
              onClick={() => {
                haptic.selection();
                onAbrirAnexos();
              }}
              aria-label="Anexar arquivo ou foto"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
            </button>

            {/* Campo de Entrada de Mensagem */}
            <textarea
              ref={textareaRef}
              value={input}
              onFocus={(e) => {
                if (onInteract) {
                  const allowed = onInteract(e);
                  if (allowed === false) e.target.blur();
                }
              }}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading) onSendMessage();
                }
              }}
              rows={1}
              placeholder={voice.listening ? 'Ouvindo áudio…' : 'Tire sua dúvida...'}
              className="flex-1 min-h-[46px] max-h-36 bg-transparent px-2.5 py-3 text-[15.5px] sm:text-[16px] font-sans text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed tracking-normal"
            />

            {/* Botão de Envio ou Microfone */}
            {input.trim() || attachment ? (
              <button
                onClick={() => {
                  haptic.light();
                  onSendMessage();
                }}
                disabled={loading}
                aria-label="Enviar mensagem"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_22px_rgba(244,63,94,0.45)] transition-all active:scale-95 disabled:opacity-50 touch-manipulation cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-white ml-0.5" strokeWidth={2.4} />
                )}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  if (onInteract && onInteract(e) === false) return;
                  haptic.selection();
                  onToggleMic();
                }}
                aria-label="Gravar áudio"
                className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  voice.listening
                    ? 'bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.6)] border-rose-400'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Mic className="w-5 h-5" strokeWidth={2.2} />
                {voice.listening && (
                  <span className="absolute inset-1 rounded-full ring-2 ring-rose-400 animate-ping" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Disclaimer / Rodapé Elegante */}
        <div className="text-center mt-2.5 px-4 select-none">
          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
            TUTOR JURÍDICO • IA DIREITO PRIME • VERIFIQUE FONTES OFICIAIS
          </p>
        </div>

        {/* Menu Flutuante do (+) (Galeria / Câmera / Documento) */}
        <AnimatePresence>
          {attachOpen && (
            <>
              <div
                className="fixed inset-0 z-[68]"
                onClick={() => setAttachOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.92 }}
                transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                className="absolute bottom-[100%] mb-4 left-4 z-[69] bg-zinc-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 flex flex-col gap-1 min-w-[210px]"
              >
                <button
                  onClick={() => {
                    haptic.light();
                    setAttachOpen(false);
                    fileInputRef.current?.removeAttribute('capture');
                    fileInputRef.current?.setAttribute('accept', 'image/*');
                    fileInputRef.current?.click();
                    setTimeout(() => {
                      fileInputRef.current?.setAttribute('accept', 'image/*,application/pdf');
                    }, 1000);
                  }}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-white tracking-tight">
                      Galeria
                    </span>
                    <span className="block text-[10.5px] text-zinc-400">Escolher imagem</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    haptic.light();
                    setAttachOpen(false);
                    void onTirarFoto();
                  }}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4 text-sky-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-white tracking-tight">
                      Câmera
                    </span>
                    <span className="block text-[10.5px] text-zinc-400">Tirar foto</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    haptic.light();
                    setAttachOpen(false);
                    fileInputRef.current?.removeAttribute('capture');
                    fileInputRef.current?.setAttribute('accept', 'application/pdf');
                    fileInputRef.current?.click();
                    setTimeout(() => {
                      fileInputRef.current?.setAttribute('accept', 'image/*,application/pdf');
                    }, 1000);
                  }}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Paperclip className="w-4 h-4 text-purple-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-white tracking-tight">
                      Documento
                    </span>
                    <span className="block text-[10.5px] text-zinc-400">Enviar PDF</span>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {voice.listening && (
        <div
          className="fixed left-4 right-4 z-[64] pointer-events-none flex justify-center"
          style={{ bottom: 'calc(11rem + var(--sai-bottom, 0px))' }}
        >
          <div className="px-3.5 py-1.5 rounded-full bg-rose-600/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Ouvindo... fale sua pergunta jurídica</span>
          </div>
        </div>
      )}
    </>
  );
};
