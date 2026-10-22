import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';

interface BlogFavoritesFabProps {
  count: number;
  onClick: () => void;
}

export const BlogFavoritesFab: React.FC<BlogFavoritesFabProps> = ({ count, onClick }) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        haptic.impact();
        onClick();
      }}
      className="fixed bottom-6 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-xl shadow-rose-600/40 border border-white/20 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:shadow-sm transition-shadow group"
      aria-label="Abrir artigos favoritos"
      title="Meus Favoritos"
    >
      <Heart className="w-6 h-6 fill-white drop-shadow-sm group-hover:scale-110 transition-transform" />

      {/* Contador numérico de favoritos */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white text-rose-700 font-bold text-[11px] shadow-md border border-rose-200">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </motion.button>
  );
};
export default BlogFavoritesFab;
