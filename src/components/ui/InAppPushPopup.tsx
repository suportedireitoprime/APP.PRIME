import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ChevronRight } from 'lucide-react';
import { useInAppPushStore } from '@/store/inAppPushStore';
import { useNavigate } from 'react-router-dom';

export default function InAppPushPopup() {
  const { currentPush, dismissPush } = useInAppPushStore();
  const navigate = useNavigate();

  const handleAction = () => {
    if (currentPush?.actionUrl) {
      if (currentPush.actionUrl.startsWith('http')) {
        window.location.href = currentPush.actionUrl;
      } else {
        const path = currentPush.actionUrl.startsWith('/') ? currentPush.actionUrl : `/${currentPush.actionUrl}`;
        navigate(path);
      }
    }
    dismissPush();
  };

  return (
    <AnimatePresence>
      {currentPush && (
        <div className="fixed inset-x-0 top-0 z-[9999] p-4 pointer-events-none flex justify-center pt-[calc(3rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-sm bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            // Swipe up to dismiss
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.5, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -30 || info.velocity.y < -300) {
                dismissPush();
              }
            }}
          >
            <div className="p-4 flex flex-col gap-3" onClick={handleAction}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider">
                  <Bell className="w-3.5 h-3.5 text-blue-500" />
                  <span>Novo Alerta</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); dismissPush(); }}
                  className="p-1 rounded-full bg-white/5 text-white/50 hover:text-white/90 hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex gap-3 items-center cursor-pointer">
                {currentPush.imageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/50">
                    <img src={currentPush.imageUrl} alt="Capa" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
                    {currentPush.title}
                  </h3>
                  <p className="text-white/60 text-xs line-clamp-2 leading-snug">
                    {currentPush.body}
                  </p>
                </div>
                <div className="flex-shrink-0 text-white/30">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* Action Bar (Optional, can just rely on clicking the card) */}
            <div 
              className="bg-blue-600/10 hover:bg-blue-600/20 transition cursor-pointer border-t border-white/5 p-3 flex justify-center items-center gap-2"
              onClick={handleAction}
            >
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Entendi</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
