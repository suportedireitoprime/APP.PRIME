import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Search, Headphones } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { directImg } from '@/lib/cdnImg';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';

export default function PilulasLista() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'codigos';
  const [searchTerm, setSearchTerm] = useState('');

  const fastPillsItems = [
    { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'), text: 'CP', fullName: 'Código Penal' },
    { image: '/pilulas/cf_portrait.jpg', text: 'CF88', fullName: 'Constituição Federal' },
    { image: '/pilulas/cc_portrait.png', text: 'CC', fullName: 'Código Civil' },
    { image: '/pilulas/cpp_portrait.jpg', text: 'CPP', fullName: 'Cód. Proc. Penal' },
    { image: '/pilulas/clt_portrait.jpg', text: 'CLT', fullName: 'Leis Trabalhistas' },
  ];

  const ministrosPillsItems = [
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
  ];

  const baseItems = tipo === 'ministros' ? ministrosPillsItems : fastPillsItems;
  const filteredItems = baseItems.filter(item => 
    item.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const title = tipo === 'ministros' ? 'P�lulas dos Ministros do STF' : 'P�lulas de C�digos';

  const handleItemClick = (item: any) => {
    haptic.selection();
    if (tipo === 'ministros') {
      navigate('/ferramentas/stf/biografias');
    } else {
      if (item.text === 'CP') navigate('/pilulas/cp');
      else if (item.text === 'CF88') navigate('/pilulas/cf');
      else if (item.text === 'CC') navigate('/pilulas/cc');
      else if (item.text === 'CPP') navigate('/pilulas/cpp');
      else if (item.text === 'CLT') navigate('/pilulas/clt');
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
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
          title={title}
          onBack={() => navigate(-1)}
          rightAction={<div className="w-8" />}
        />
        
        <div className="px-4 pt-6 space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              className="group flex items-stretch p-3.5 rounded-2xl bg-[#1A1A1A] border border-white/5 active:scale-[0.98] transition-all text-left relative overflow-hidden"
            >
              {/* Left side: Image (vertical aspect ratio) */}
              <div className="w-[72px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                <img src={item.image} alt={item.fullName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              
              {/* Right side: Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between pl-4 py-1">
                <div>
                  <h3 className="text-white font-black text-[17px] uppercase tracking-wider truncate">{item.text}</h3>
                  <p className="text-zinc-400 text-[13px] mt-0.5 truncate">{item.fullName}</p>
                </div>
                
                {/* Bottom row: Action */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-3.5 h-3.5 text-red-500 ml-0.5" />
                  </div>
                  <span className="text-red-500 text-[10px] font-bold tracking-widest uppercase">
                    Acessar
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-zinc-500">Nenhum item encontrado.</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
