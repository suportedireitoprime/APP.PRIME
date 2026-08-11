import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { BookOpen, Route, RotateCcw, TrendingUp } from 'lucide-react';

export type CargoTab = 'livre' | 'trilhas' | 'revisao' | 'desempenho';

interface FlashcardsCargoBottomNavProps {
  activeTab: CargoTab;
  onChangeTab: (tab: CargoTab) => void;
}

export default function FlashcardsCargoBottomNav({ activeTab, onChangeTab }: FlashcardsCargoBottomNavProps) {
  const tabs = [
    { id: 'livre', label: 'Livre', icon: BookOpen },
    { id: 'trilhas', label: 'Trilhas', icon: Route },
    { id: 'revisao', label: 'Revisão', icon: RotateCcw },
    { id: 'desempenho', label: 'Desempenho', icon: TrendingUp },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-24 md:hidden" />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
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
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="cargo-nav-indicator"
                    className="absolute inset-x-4 top-0 h-0.5 bg-primary rounded-b-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className={`p-1.5 rounded-full transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
