import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpenText, FileText, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import type { Tema } from '@/hooks/useLeitorPrefs';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import AbaTermos from './AbaTermos';
import AbaResumo from './AbaResumo';
import AbaChatPagina from './AbaChatPagina';

interface Props {
  open: boolean;
  onClose: () => void;
  paginaMd: string;
  livroTitulo: string;
  capituloTitulo: string;
  paginaNum: number;
  livroId: string;
  tema: Tema;
  fonteFamily: string;
  /** Desktop: abre como painel lateral (direita → esquerda) em vez de bottom sheet */
  lateral?: boolean;
}

type Aba = 'menu' | 'termos' | 'resumo' | 'chat';

const TABS: Array<{ id: Aba; label: string; icon: typeof BookOpenText }> = [
  { id: 'termos', label: 'Termos', icon: BookOpenText },
  { id: 'resumo', label: 'Resumo', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
];

export default function AssistenteIA({
  open,
  onClose,
  paginaMd,
  livroTitulo,
  capituloTitulo,
  paginaNum,
  livroId,
  tema,
  fonteFamily,
  lateral = false,
}: Props) {
  const [aba, setAba] = useState<Aba>('menu');
  const dark = tema.isDark;

  // Trava scroll do body quando aberto
  useBodyScrollLock(open);
  
  useEffect(() => {
    if (open) {
      setAba('menu');
    }
  }, [open]);

  const cacheKeyTermos = useMemo(() => `ia-termos:${livroId}:${paginaNum}`, [livroId, paginaNum]);
  const cacheKeyResumo = useMemo(() => `ia-resumo:${livroId}:${paginaNum}`, [livroId, paginaNum]);
  const chaveContexto = useMemo(() => `ia-chat:${livroId}:${paginaNum}`, [livroId, paginaNum]);

  const conteudo = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[1400] ${lateral ? 'bg-black/25' : 'bg-black/50 backdrop-blur-sm'}`}
            onClick={onClose}
          />
          <motion.div
            initial={lateral ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
            animate={lateral ? { opacity: 1, x: 0, scale: 1 } : { y: 0 }}
            exit={lateral ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={
              lateral
                ? 'fixed z-[1401] flex flex-col rounded-3xl shadow-2xl overflow-hidden'
                : 'fixed inset-x-0 bottom-0 z-[1401] flex flex-col rounded-t-3xl shadow-2xl overflow-hidden'
            }
            style={
              lateral
                ? {
                    background: tema.bg,
                    color: tema.text,
                    right: 'max(16px, env(safe-area-inset-right, 0px))',
                    top: 'calc(env(safe-area-inset-top, 0px) + 5.25rem)',
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                    width: 'min(440px, calc(100vw - 32px))',
                    border: `1px solid ${tema.border}`,
                  }
                : {
                    background: tema.bg,
                    color: tema.text,
                    height: '88dvh',
                    maxHeight: '88dvh',
                    borderTop: `1px solid ${tema.border}`,
                  }
            }
          >
            {/* Handle (só bottom sheet) */}
            {!lateral && (
              <div className="pt-2 pb-1 flex justify-center shrink-0">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' }}
                />
              </div>
            )}

            {/* Header */}
            <div
              className="px-4 pt-2 pb-3 flex items-start gap-3 shrink-0 border-b"
              style={{ borderColor: tema.border }}
            >
              {aba !== 'menu' && (
                <button
                  onClick={() => setAba('menu')}
                  className="mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
                  style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                >
                  <ArrowLeft className="w-4 h-4 opacity-70" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] opacity-60">
                  Assistente de leitura
                </p>
                <h2 className="text-[15px] font-semibold truncate mt-0.5" style={{ fontFamily: fonteFamily }}>
                  {capituloTitulo}
                </h2>
                <p className="text-[11px] opacity-60 mt-0.5">Página {paginaNum}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
                style={{
                  background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  color: tema.text,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs (segmented control) */}
            {aba !== 'menu' && (
              <div className="px-4 pt-3 pb-2 shrink-0">
              <div
                className="flex p-1 rounded-full"
                style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
              >
                {TABS.map((t) => {
                  const ativo = aba === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setAba(t.id)}
                      className="relative flex-1 h-9 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      style={{
                        color: ativo ? 'hsl(var(--primary-foreground))' : tema.text,
                        opacity: ativo ? 1 : 0.75,
                      }}
                    >
                      {ativo && (
                        <motion.div
                          layoutId="assistente-tab-pill"
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'hsl(var(--primary))' }}
                          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* Conteúdo da aba */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {aba === 'menu' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <button
                    onClick={() => setAba('termos')}
                    className="w-full min-h-[68px] rounded-2xl p-4 text-left flex items-center gap-4 transition-all active:scale-[0.99]"
                    style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                  >
                    <BookOpenText className="w-6 h-6 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[15px] tracking-wide">EXPLICAR TERMOS</div>
                      <div className="text-[13px] opacity-70 leading-snug mt-0.5">Identifica e explica termos técnicos ou latim da página.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                  </button>

                  <button
                    onClick={() => setAba('resumo')}
                    className="w-full min-h-[68px] rounded-2xl p-4 text-left flex items-center gap-4 transition-all active:scale-[0.99]"
                    style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                  >
                    <FileText className="w-6 h-6 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[15px] tracking-wide">RESUMIR PÁGINA</div>
                      <div className="text-[13px] opacity-70 leading-snug mt-0.5">Gera um resumo rápido com os pontos principais.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                  </button>

                  <button
                    onClick={() => setAba('chat')}
                    className="w-full min-h-[68px] rounded-2xl p-4 text-left flex items-center gap-4 transition-all active:scale-[0.99]"
                    style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                  >
                    <MessageCircle className="w-6 h-6 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[15px] tracking-wide">TIRAR DÚVIDA (CHAT)</div>
                      <div className="text-[13px] opacity-70 leading-snug mt-0.5">Converse com a IA sobre o conteúdo desta página.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                  </button>
                </div>
              )}
              {aba === 'termos' && (
                <div className="h-full overflow-y-auto">
                  <AbaTermos
                    paginaMd={paginaMd}
                    livroTitulo={livroTitulo}
                    capituloTitulo={capituloTitulo}
                    paginaNum={paginaNum}
                    cacheKey={cacheKeyTermos}
                    tema={tema}
                  />
                </div>
              )}
              {aba === 'resumo' && (
                <div className="h-full overflow-y-auto">
                  <AbaResumo
                    paginaMd={paginaMd}
                    livroTitulo={livroTitulo}
                    capituloTitulo={capituloTitulo}
                    paginaNum={paginaNum}
                    cacheKey={cacheKeyResumo}
                    tema={tema}
                    fonteFamily={fonteFamily}
                  />
                </div>
              )}
              {aba === 'chat' && (
                <AbaChatPagina
                  paginaMd={paginaMd}
                  livroTitulo={livroTitulo}
                  capituloTitulo={capituloTitulo}
                  paginaNum={paginaNum}
                  chaveContexto={chaveContexto}
                  tema={tema}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document === 'undefined' ? conteudo : createPortal(conteudo, document.body);
}
