import { useNavigate } from 'react-router-dom';
import { useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, PlayCircle, Pill, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { directImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import CircularGallery from '@/components/ui/CircularGallery';

type TabType = 'Todos' | 'Pílulas Rápidas' | 'Só Pílulas' | 'Códigos' | 'Ministros';

export default function PilulasHome() {
  const navigate = useNavigate();
  const galleryRef = useRef<any>(null);
  const ministrosGalleryRef = useRef<any>(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchMinistro, setSearchMinistro] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Todos');
  const tabs: TabType[] = ['Todos', 'Pílulas Rápidas', 'Só Pílulas', 'Códigos', 'Ministros'];
  
  usePilulasWarmup();

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
  };

  const handleTabClick = (tab: TabType) => {
    haptic.selection();
    setActiveTab(tab);
  };

  const fastPillsItems = useMemo(() => [
    { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'), text: 'CP', fullName: 'Código Penal' },
    { image: '/pilulas/cf_portrait.jpg', text: 'CF88', fullName: 'Constituição Federal' },
    { image: '/pilulas/cc_portrait.png', text: 'CC', fullName: 'Código Civil' },
    { image: '/pilulas/cpp_portrait.jpg', text: 'CPP', fullName: 'Cód. Proc. Penal' },
    { image: '/pilulas/clt_portrait.jpg', text: 'CLT', fullName: 'Leis Trabalhistas' },
  ], []);

  const ministrosPillsItems = useMemo(() => [
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=2921", text: "Moraes", fullName: "Alexandre de Moraes" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3102", text: "Mendonça", fullName: "André Mendonça" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3041", text: "Cármen", fullName: "Cármen Lúcia" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3161", text: "Zanin", fullName: "Cristiano Zanin" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=2662", text: "Toffoli", fullName: "Dias Toffoli" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=2901", text: "Fachin", fullName: "Edson Fachin" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3181", text: "Dino", fullName: "Flávio Dino" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=701", text: "Mendes", fullName: "Gilmar Mendes" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=2741", text: "Fux", fullName: "Luiz Fux" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3062", text: "Marques", fullName: "Nunes Marques" },
    { image: "https://portal.stf.jus.br/util/imagem.asp?id=3141", text: "Barroso", fullName: "Roberto Barroso" }
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toUpperCase();
    setSearchCode(term);
    
    // Auto-scroll when match is found
    if (term.length >= 2) {
      const index = fastPillsItems.findIndex(item => item.text.startsWith(term));
      if (index !== -1 && galleryRef.current) {
        galleryRef.current.scrollToIndex(index);
      }
    }
  };

  const handleSearchMinistro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchMinistro(term);
    
    if (term.length >= 3) {
      const index = ministrosPillsItems.findIndex(item => 
        item.text.toLowerCase().includes(term.toLowerCase()) || 
        item.fullName.toLowerCase().includes(term.toLowerCase())
      );
      if (index !== -1 && ministrosGalleryRef.current) {
        ministrosGalleryRef.current.scrollToIndex(index);
      }
    }
  };

  const showRapidas = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas';
  const showSoPilulas = activeTab === 'Todos' || activeTab === 'Só Pílulas';
  const showCodigos = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas' || activeTab === 'Códigos';
  const showMinistros = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas' || activeTab === 'Ministros';

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
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
            <div className="flex flex-col px-1 mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas de Códigos</h2>
                <p className="text-[13px] text-zinc-400 truncate">
                  Áudios curtos e diretos sobre os artigos mais cobrados e essenciais da lei seca.
                </p>
              </div>
              
              {/* Search Bar & List Button */}
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={searchCode}
                    onChange={handleSearch}
                    placeholder="Ex: CC"
                    maxLength={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all uppercase"
                  />
                </div>
                <button
                  onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=codigos'); }}
                  className="flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver em lista
                </button>
              </div>
            </div>

            <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
              <CircularGallery
                ref={galleryRef}
                items={fastPillsItems}
                bend={1.5}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollEase={0.02}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        )}

        {/* Pílulas dos Ministros */}
        {showMinistros && (
          <div className="space-y-4 mt-8">
            <div className="flex flex-col px-1 mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas dos Ministros do STF</h2>
                <p className="text-[13px] text-zinc-400 truncate">
                  Principais posicionamentos e histórico dos Ministros do STF.
                </p>
              </div>

              {/* Search Bar & List Button */}
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={searchMinistro}
                    onChange={handleSearchMinistro}
                    placeholder="Buscar ministro..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=ministros'); }}
                  className="flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver em lista
                </button>
              </div>
            </div>

            <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
              <CircularGallery
                ref={ministrosGalleryRef}
                items={ministrosPillsItems}
                bend={1.5}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollEase={0.02}
                onItemClick={handleMinistroClick}
              />
            </div>
          </div>
        )}

        {/* Divider with Text for Bottom Section */}
        {showSoPilulas && (
          <>
            <div className="flex items-center w-full mt-10 mb-6">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Pílulas de Análise</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div>
              <h2 className="text-[22px] font-black text-white uppercase tracking-widest">Escolha um Tema</h2>
              <p className="mt-1 text-[14px] text-zinc-400 truncate">
                Aprenda conceitos jurídicos complexos em minutos. Ouça pílulas de conhecimento extraídas da essência das principais obras e legislações.
              </p>
            </div>

            {/* Clássicos do Direito */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleSelectClassicos}
              className="w-full group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img src="/pilulas/classicos_cover.jpg" alt="Clássicos do Direito" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
                <div className="flex justify-between items-end w-full">
                  <div>
                    <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                      Clássicos do Direito
                    </h3>
                    <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                      As obras fundamentais do pensamento jurídico mundial.
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mb-1 border border-white/20">
                    <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </motion.button>
          </>
        )}

      </div>
      </div>
    </div>
  );
}
