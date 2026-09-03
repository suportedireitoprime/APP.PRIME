import { useNavigate } from 'react-router-dom';
import { useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, PlayCircle, Pill, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { directImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { AnimatedDivider } from '@/components/ui/AnimatedDivider';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Capacitor } from '@capacitor/core';
import { NativePilulasPlugin } from '@/plugins/NativePilulasPlugin';
import { useEffect } from 'react';

type TabType = 'Todos' | 'Pílulas Rápidas' | 'Só Pílulas' | 'Códigos' | 'Ministros';

export default function PilulasHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Todos');
  const tabs: TabType[] = ['Todos', 'Pílulas Rápidas', 'Só Pílulas', 'Códigos', 'Ministros'];
  
  usePilulasWarmup();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const launch = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          await NativePilulasPlugin.openPilulasDashboard({
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token
          });
          navigate(-1);
        } catch (e) {
          console.error(e);
          navigate(-1);
        }
      };
      launch();
    }
  }, [navigate]);

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
  };

  const handleTabClick = (tab: TabType) => {
    haptic.selection();
    setActiveTab(tab);
  };

  const fastPillsItems = useMemo(() => [
    { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.webp'), text: 'CP', fullName: 'Código Penal' },
    { image: '/pilulas/cf_portrait.webp', text: 'CF88', fullName: 'Constituição Federal' },
    { image: '/pilulas/cc_portrait.webp', text: 'CC', fullName: 'Código Civil' },
    { image: '/pilulas/cpp_portrait.webp', text: 'CPP', fullName: 'Cód. Proc. Penal' },
    { image: '/pilulas/clt_portrait.webp', text: 'CLT', fullName: 'Leis Trabalhistas' },
  ], []);

  const ministrosPillsItems = useMemo(() => [
    { image: "/pilulas/ministros/moraes.webp", text: "Moraes", fullName: "Alexandre de Moraes" },
    { image: "/pilulas/ministros/mendonca.webp", text: "Mendonça", fullName: "André Mendonça" },
    { image: "/pilulas/ministros/carmen.webp", text: "Cármen", fullName: "Cármen Lúcia" },
    { image: "/pilulas/ministros/zanin.webp", text: "Zanin", fullName: "Cristiano Zanin" },
    { image: "/pilulas/ministros/toffoli.webp", text: "Toffoli", fullName: "Dias Toffoli" },
    { image: "/pilulas/ministros/fachin.webp", text: "Fachin", fullName: "Edson Fachin" },
    { image: "/pilulas/ministros/dino.webp", text: "Dino", fullName: "Flávio Dino" },
    { image: "/pilulas/ministros/mendes.webp", text: "Mendes", fullName: "Gilmar Mendes" },
    { image: "/pilulas/ministros/fux.webp", text: "Fux", fullName: "Luiz Fux" },
    { image: "/pilulas/ministros/marques.webp", text: "Marques", fullName: "Nunes Marques" },
    { image: "/pilulas/ministros/barroso.webp", text: "Barroso", fullName: "Roberto Barroso" }
  ], []);

  const classicosPillsItems = useMemo(() => [
    { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.webp', text: 'A Luta pelo\nDireito', fullName: 'Rudolf von Ihering' },
    { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.webp', text: 'Sobre a\nLiberdade', fullName: 'John Stuart Mill' },
    { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.webp', text: 'A Arte da\nGuerra', fullName: 'Sun Tzu' },
    { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.webp', text: 'O Espírito\ndas Leis', fullName: 'Montesquieu' },
    { image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.webp', text: 'O Mundo Assombrado\npelos Demônios', fullName: 'Carl Sagan' }
  ], []);

  const handleItemClick = useCallback((item: any) => {
    haptic.selection();
    if (item.text === 'CP') navigate('/pilulas/cp');
    if (item.text === 'CF88') navigate('/pilulas/cf');
    if (item.text === 'CC') navigate('/pilulas/cc');
    if (item.text === 'CPP') navigate('/pilulas/cpp');
    if (item.text === 'CLT') navigate('/pilulas/clt');
  }, [navigate]);

  const handleMinistroClick = useCallback((item: any) => {
    haptic.selection();
    navigate('/ferramentas/stf/biografias'); // Temporarily route to biografias
  }, [navigate]);


  const showRapidas = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas';
  const showSoPilulas = activeTab === 'Todos' || activeTab === 'Só Pílulas';
  const showCodigos = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas' || activeTab === 'Códigos';
  const showMinistros = activeTab === 'Todos' || activeTab === 'Só Pílulas' || activeTab === 'Ministros';



  return (
    <div className="min-h-screen bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Pílulas Jurídicas"
          onBack={() => navigate('/')}
          rightAction={<div className="w-8" />}
        />

        {/* Menu de Alternância */}
        <div className="flex px-4 py-4 gap-2 overflow-x-auto no-scrollbar snap-x sticky top-[60px] z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500'
                  : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

      <div className="px-4 pt-6 space-y-6">
        
        {showRapidas && (
          <div className="flex items-center w-full mb-6">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Pílulas Rápidas</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>
        )}

        {/* Pílulas de Códigos */}
        {showCodigos && (
          <div className="space-y-4">
            <div className="flex items-start justify-between px-1 mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas de Códigos</h2>
                <p className="text-[13px] text-zinc-400 truncate">
                  Áudios curtos e diretos sobre os artigos mais cobrados e essenciais da lei seca.
                </p>
              </div>
              
              <button
                onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=codigos'); }}
                className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
              >
                Ver em lista
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
              {fastPillsItems.map((item, idx) => (
                <button key={idx} onClick={() => handleItemClick(item)} className="snap-start flex-shrink-0 w-[140px] flex flex-col gap-2 group text-left">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 relative">
                    <img src={item.image} alt={item.text} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                      <span className="text-white font-bold text-lg">{item.text}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider with Text for Bottom Section */}
        {(showSoPilulas || showMinistros) && (
          <AnimatedDivider text="Pílulas de Análise" />
        )}

        {/* Pílulas dos Ministros */}
        {showMinistros && (
          <div className="space-y-4 mb-8">
            <div className="flex items-start justify-between px-1 mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas dos Ministros do STF</h2>
                <p className="text-[13px] text-zinc-400 truncate">
                  Principais posicionamentos e histórico dos Ministros do STF.
                </p>
              </div>

              <button
                onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=ministros'); }}
                className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
              >
                Ver em lista
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
              {ministrosPillsItems.map((item, idx) => (
                <button key={idx} onClick={() => handleMinistroClick(item)} className="snap-start flex-shrink-0 w-[140px] flex flex-col gap-2 group text-left">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 relative">
                    <img src={item.image} alt={item.text} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                      <span className="text-white font-bold text-lg">{item.text}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showSoPilulas && (
          <div className="space-y-4 mb-8">
            <AnimatedDivider text="Clássicos do Direito" />

            <div className="flex items-start justify-between px-1 mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Clássicos do Direito</h2>
                <p className="text-[13px] text-zinc-400 truncate">
                  As obras fundamentais do pensamento jurídico mundial.
                </p>
              </div>

              <button
                onClick={handleSelectClassicos}
                className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
              >
                Ver em lista
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
              {classicosPillsItems.map((item, idx) => (
                <button key={idx} onClick={() => handleSelectClassicos()} className="snap-start flex-shrink-0 w-[140px] flex flex-col gap-2 group text-left">
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 relative">
                    <img src={item.image} alt={item.text} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                      <span className="text-white font-bold text-lg">{item.text}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
