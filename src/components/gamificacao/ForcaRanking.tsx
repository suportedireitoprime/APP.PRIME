import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RankingEntry {
  user_id: string;
  xp_total: number;
  level: number;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    capa_id: string | null;
  } | null;
}

interface ForcaRankingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForcaRanking({ isOpen, onClose }: ForcaRankingProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'Mensal' | 'Geral'>('Mensal');

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchRanking() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('forca_progresso')
          .select(`
            user_id,
            xp_total,
            level,
            profiles (
              id,
              display_name,
              avatar_url,
              capa_id
            )
          `)
          .order('xp_total', { ascending: false })
          .limit(50);

        if (error) {
          console.error("Erro ao buscar ranking:", error);
        } else if (data) {
          const formatted = data.map((item: Record<string, unknown>) => ({
            user_id: item.user_id as string,
            xp_total: item.xp_total as number,
            level: item.level as number,
            profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
          })) as RankingEntry[];
          
          setRanking(formatted);
        }
      } catch (err) {
        console.error("Exceção no ranking:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRanking();
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  // Helper function to safely get avatar, fallback to capa_id or default
  const getAvatar = (entry: RankingEntry) => {
    return entry.profile?.avatar_url || entry.profile?.capa_id || undefined;
  };

  const getName = (entry: RankingEntry) => {
    return entry.profile?.display_name || 'Usuário Anônimo';
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 bg-[#0d0f12] text-zinc-100 overflow-y-auto w-full h-full"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0d0f12]/90 backdrop-blur-md pt-safe flex items-center justify-between px-4 h-16 border-b border-white/5">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold tracking-tight">Ranking</h1>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1">
              Forca Prime 🐭
            </span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mt-4">
          <div className="bg-white/5 p-1 rounded-full flex gap-1">
            <button 
              onClick={() => setTab('Mensal')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'Mensal' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Mensal
            </button>
            <button 
              onClick={() => setTab('Geral')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'Geral' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Geral
            </button>
          </div>
        </div>

        {/* Podium */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex justify-center items-end gap-2 md:gap-4 mt-12 mb-8 px-4 h-56 relative">
            
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center w-28 animate-fade-in relative z-10" style={{ animationDelay: '100ms' }}>
                <div className="relative mb-3">
                  <Avatar className="w-16 h-16 border-[3px] border-zinc-400 ring-2 ring-transparent shadow-[0_0_15px_rgba(161,161,170,0.3)]">
                    <AvatarImage src={getAvatar(top3[1])} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-lg font-black">{getName(top3[1]).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs font-bold text-center line-clamp-1">{getName(top3[1])}</span>
                <span className="text-lg font-black mt-1">{top3[1].xp_total}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">xp</span>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="flex flex-col items-center w-32 -mb-8 relative z-20 animate-fade-in">
                <div className="relative mb-3">
                  <Avatar className="w-20 h-20 border-4 border-amber-400 ring-4 ring-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                    <AvatarImage src={getAvatar(top3[0])} />
                    <AvatarFallback className="bg-amber-900/50 text-amber-400 text-2xl font-black">{getName(top3[0]).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-sm font-bold text-center line-clamp-1 text-amber-50">{getName(top3[0])}</span>
                <span className="text-xl font-black mt-1 text-amber-400">{top3[0].xp_total}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">xp</span>
                
                {/* Podium Base for 1st Place */}
                <div className="w-24 h-20 mt-4 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg flex justify-center pt-3 border-t border-white/20">
                  <img src="/icon-192.png" alt="App Logo" className="w-6 h-6 grayscale opacity-70" />
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center w-28 animate-fade-in relative z-10" style={{ animationDelay: '200ms' }}>
                <div className="relative mb-3">
                  <Avatar className="w-16 h-16 border-[3px] border-[#cd7f32] ring-2 ring-transparent shadow-[0_0_15px_rgba(205,127,50,0.3)]">
                    <AvatarImage src={getAvatar(top3[2])} />
                    <AvatarFallback className="bg-[#cd7f32]/20 text-[#cd7f32] text-lg font-black">{getName(top3[2]).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs font-bold text-center line-clamp-1">{getName(top3[2])}</span>
                <span className="text-lg font-black mt-1">{top3[2].xp_total}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">xp</span>
              </div>
            )}
          </div>
        )}

        {/* Separator Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

        {/* Others List */}
        {!isLoading && others.length > 0 && (
          <div className="px-4 pb-20 max-w-lg mx-auto w-full">
            <h3 className="text-sm font-bold text-zinc-500 mb-4 px-2">Demais posições</h3>
            
            <div className="flex flex-col gap-1">
              {others.map((entry, idx) => {
                const pos = idx + 4; // since 0,1,2 are top3
                return (
                  <div key={entry.user_id} className="flex items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
                    <span className="w-8 text-center text-sm font-mono font-black text-zinc-600 mr-2">
                      {pos.toString().padStart(2, '0')}
                    </span>
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={getAvatar(entry)} />
                      <AvatarFallback className="bg-white/10 text-xs font-black">{getName(entry).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold flex-1 truncate text-sm">{getName(entry)}</span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-sm">{entry.xp_total}</span>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">xp</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
