import { useState } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { InicioTab } from '@/components/suporte/InicioTab';
import { ConversasTab } from '@/components/suporte/ConversasTab';
import { NovidadesTab } from '@/components/suporte/NovidadesTab';
import { SugerirTab } from '@/components/suporte/SugerirTab';
import { AjudaTab } from '@/components/suporte/AjudaTab';
import { Home, MessageSquare, Bell, Lightbulb, HelpCircle } from 'lucide-react';

type Tab = 'inicio' | 'conversas' | 'novidades' | 'sugerir' | 'ajuda';

export default function Suporte() {
  const goBack = useGoBack();
  const [activeTab, setActiveTab] = useState<Tab>('inicio');

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-20">
      <PageHeader title="Fale com o Suporte" onBack={() => goBack()} />
      
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl lg:max-w-3xl w-full mx-auto">
        {activeTab === 'inicio' && <InicioTab onTicketCreated={() => setActiveTab('conversas')} />}
        {activeTab === 'conversas' && <ConversasTab />}
        {activeTab === 'novidades' && <NovidadesTab />}
        {activeTab === 'sugerir' && <SugerirTab />}
        {activeTab === 'ajuda' && <AjudaTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        <NavButton icon={Home} label="Início" isActive={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
        <NavButton icon={MessageSquare} label="Conversas" isActive={activeTab === 'conversas'} onClick={() => setActiveTab('conversas')} />
        <NavButton icon={Bell} label="Novidades" isActive={activeTab === 'novidades'} onClick={() => setActiveTab('novidades')} />
        <NavButton icon={Lightbulb} label="Sugerir" isActive={activeTab === 'sugerir'} onClick={() => setActiveTab('sugerir')} />
        <NavButton icon={HelpCircle} label="Ajuda" isActive={activeTab === 'ajuda'} onClick={() => setActiveTab('ajuda')} />
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
