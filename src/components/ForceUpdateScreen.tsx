import { motion } from 'framer-motion';
import { AlertTriangle, Download, Info } from 'lucide-react';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { haptic } from '@/lib/nativeHaptics';

export default function ForceUpdateScreen() {
  const handleUpdate = async () => {
    haptic.selection();
    try {
      await AppUpdate.openAppStore();
    } catch (e) {
      console.error('Failed to open app store', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl px-6"
    >
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
        className="flex flex-col items-center max-w-sm w-full"
      >
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
          Atualização<br />Obrigatória
        </h1>
        
        <p className="text-zinc-400 text-center mb-8 text-base font-medium leading-relaxed">
          Uma nova versão do Vade Mecum está disponível com melhorias cruciais. Para continuar usando o aplicativo, é necessário atualizar.
        </p>

        <button
          onClick={handleUpdate}
          className="w-full h-14 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg shadow-red-500/20"
        >
          <Download className="w-6 h-6" />
          Atualizar Agora
        </button>
        
        <div className="mt-8 flex items-center gap-2 text-zinc-600 text-xs font-semibold">
          <Info className="w-4 h-4" />
          Esta tela não pode ser fechada
        </div>
      </motion.div>
    </motion.div>
  );
}
