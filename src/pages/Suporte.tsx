import { useState } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { InicioTab } from '@/components/suporte/InicioTab';
import { ConversasTab } from '@/components/suporte/ConversasTab';
import { NovidadesTab } from '@/components/suporte/NovidadesTab';
import { SugerirTab } from '@/components/suporte/SugerirTab';
import { AjudaTab } from '@/components/suporte/AjudaTab';
import { Home, MessageSquare, Bell, Lightbulb, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';

type Tab = 'inicio' | 'conversas' | 'novidades' | 'sugerir' | 'ajuda';

export default function Suporte() {
  const goBack = useGoBack();
  const [activeTab, setActiveTab] = useState<Tab>('inicio');

  const tabs = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'conversas', label: 'Conversas', icon: MessageSquare },
    { id: 'novidades', label: 'Novidades', icon: Bell },
    { id: 'sugerir', label: 'Sugerir', icon: Lightbulb },
    { id: 'ajuda', label: 'Ajuda', icon: HelpCircle },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#14171A] pb-[100px]">
      <PageHeader title="Fale com o Suporte" onBack={() => goBack()} />
      
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl lg:max-w-3xl w-full mx-auto">
        {activeTab === 'inicio' && <InicioTab onTicketCreated={() => setActiveTab('conversas')} />}
        {activeTab === 'conversas' && <ConversasTab />}
        {activeTab === 'novidades' && <NovidadesTab />}
        {activeTab === 'sugerir' && <SugerirTab />}
        {activeTab === 'ajuda' && <AjudaTab />}
      </div>

      {/* Bottom Navigation */}
      <motion.nav
        aria-label="Navegação Suporte"
        initial={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
      >
        <div className="bg-[#1A1D21]/95 backdrop-blur-md border-t border-border/40 rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--safe-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
          <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.selection();
                    setActiveTab(tab.id as Tab);
                  }}
                  className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-white/80'
                  }`}
                  aria-label={tab.label}
                >
                  {active && (
                    <motion.span
                      layoutId="suporte-nav-active-pill"
                      className="absolute inset-0 rounded-2xl bg-primary/10 ring-1 ring-primary/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}

                  <Icon className="relative w-7 h-7 sm:w-8 sm:h-8" strokeWidth={active ? 1.9 : 1.5} />
                  <span
                    className={`relative text-[10px] sm:text-[11px] leading-none ${
                      active ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
