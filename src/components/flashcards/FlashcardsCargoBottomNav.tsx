import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { BookOpen, Route, RotateCcw, TrendingUp, FileText } from 'lucide-react';

export type CargoTab = 'livre' | 'trilhas' | 'edital' | 'revisao' | 'desempenho';

interface FlashcardsCargoBottomNavProps {
  activeTab: CargoTab;
  onChangeTab: (tab: CargoTab) => void;
}

export default function FlashcardsCargoBottomNav({ activeTab, onChangeTab }: FlashcardsCargoBottomNavProps) {
  const tabs = [
    { id: 'livre', label: 'Livre', icon: BookOpen },
    { id: 'trilhas', label: 'Trilhas', icon: Route },
    { id: 'edital', label: 'Edital', icon: FileText },
    { id: 'revisao', label: 'Revisão', icon: RotateCcw },
    { id: 'desempenho', label: 'Desempenho', icon: TrendingUp },
  ];

  return (
    <>
      <nav
        aria-label="Navegação de Cargos"
        data-bottom-nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black transition-all duration-300 ease-out translate-y-0 opacity-100"
      >
        <div
          aria-hidden="true"
          className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"
        />
        <div className="relative z-10 bg-[#18181b] border-t border-white/10 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)]">
          <div className="max-w-2xl mx-auto px-2 py-2">
            <div className="grid grid-cols-5 items-stretch">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!isActive) {
                        haptic.selection();
                        onChangeTab(tab.id as CargoTab);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all relative ${
                      isActive ? 'text-white/90 bg-white/15 ring-1 ring-white/25' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-8 h-8 transition-transform text-white/90 drop-shadow-md ${isActive ? 'scale-110' : ''}`} strokeWidth={1.2} />
                    <span className="font-body text-[12px] font-medium leading-tight text-center text-white/90 drop-shadow-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="bg-black h-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]" />
      </nav>
    </>
  );
}
