import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import HorusCapabilitiesRow from '@/components/horus/HorusCapabilitiesRow';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
  </svg>
);

interface HorusMainTabProps {
  statusLoading: boolean;
  displayName: string;
  isVerified: boolean;
  lastDigits: string;
  isPremium: boolean;
  handleWhatsAppClick: () => void;
  onRequestVerify: () => void;
}

export function HorusMainTab({
  statusLoading, displayName, isVerified, lastDigits, isPremium,
  handleWhatsAppClick, onRequestVerify
}: HorusMainTabProps) {
  return (
    <motion.div
      key="main"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-6"
    >
      {/* Hero com spotlight cinza degradê atrás do Horus e do texto */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        className="relative p-5 pr-[140px]"
        style={{ minHeight: 200 }}
      >
        <div
          className="absolute -right-10 top-6 w-[320px] h-[280px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 60% 55%, hsl(0 0% 100% / 0.22) 0%, hsl(0 0% 100% / 0.08) 35%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          className="absolute -right-6 top-14 w-[220px] h-[200px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 55% 55%, hsl(0 0% 100% / 0.18) 0%, transparent 65%)',
            filter: 'blur(4px)',
          }}
        />

        {/* Floating juridical icons */}
        {[
          { className: 'top-3 left-4', delay: 0 },
          { className: 'bottom-3 left-8', delay: 0.8 },
          { className: 'top-8 left-1/2', delay: 1.4 },
        ].map((f, i) => (
          <motion.div
            key={i}
            className={`absolute ${f.className} pointer-events-none text-white/10`}
            animate={{ y: [0, -6, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
          >
            <Gavel className="w-5 h-5" />
          </motion.div>
        ))}

        {/* Owl mascot */}
        <motion.img
          src={horusOwl}
          alt="Horus"
          width={400}
          height={400}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute -right-3 -bottom-10 w-[160px] h-[160px] object-contain drop-shadow-xl pointer-events-none select-none z-10"
          initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        />

        <div className="relative">
          <p className="font-display text-sm sm:text-base font-black tracking-[0.14em] text-white/70 uppercase">
            Assistente jurídico
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white leading-[0.95] mt-1.5 tracking-tight">
            {displayName ? `Olá, ${displayName.split(' ')[0]}!` : (statusLoading ? 'Olá!' : 'Olá! Eu sou o Horus')}
          </h2>
          <p className="font-body text-base sm:text-lg font-medium text-white/95 leading-snug mt-2.5 max-w-[300px]">
            Seu assistente jurídico 24h no WhatsApp. Tire dúvidas de Direito para seus estudos a qualquer momento, sem fila e sem complicação.
          </p>
        </div>
      </motion.div>

      <div className="px-5 pb-6 flex flex-col gap-6">
        <motion.button
          type="button"
          onClick={handleWhatsAppClick}
          data-track="horus_whatsapp_cta_click"
          className="relative overflow-hidden mx-auto w-full max-w-sm h-14 rounded-full active:scale-[0.98] transition-transform flex items-center justify-center gap-2.5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            boxShadow: '0 8px 24px -6px rgba(37, 211, 102, 0.55)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
              backgroundSize: '250% 100%',
              animation: 'horus-btn-shimmer 3.2s ease-in-out infinite',
              mixBlendMode: 'overlay',
            }}
          />
          <motion.span
            className="relative flex items-center gap-2.5"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: 'center' }}
          >
            <WhatsAppIcon className="w-6 h-6 text-white" />
            <span className="font-display text-base font-bold" style={{ color: '#ffffff' }}>Falar com Horus</span>
          </motion.span>
        </motion.button>

        <AnimatePresence mode="wait" initial={false}>
          {statusLoading ? (
            <motion.div
              key="badge-skeleton"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto h-7 w-[150px] rounded-full bg-white/5 border border-white/10 relative overflow-hidden"
              aria-hidden
            >
              <span
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)',
                  backgroundSize: '250% 100%',
                  animation: 'horus-btn-shimmer 1.4s ease-in-out infinite',
                }}
              />
            </motion.div>
          ) : isVerified ? (
            <motion.button
              key="badge-verified"
              onClick={() => { haptic.selection(); onRequestVerify(); }}
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="mx-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-body text-[11px] font-medium text-emerald-300 leading-none">Verificado •••• {lastDigits}</span>
            </motion.button>
          ) : (
            <motion.button
              key="badge-link"
              onClick={() => { haptic.selection(); onRequestVerify(); }}
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="mx-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/15 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-body text-[11px] font-semibold text-amber-300 leading-none">Vincular WhatsApp</span>
              <ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>

        <HorusCapabilitiesRow
          isVerified={isVerified}
          isPremium={isPremium}
          onRequestVerify={onRequestVerify}
        />
      </div>
    </motion.div>
  );
}
