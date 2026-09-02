import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { directImg } from '@/lib/cdnImg';
import { motion } from 'framer-motion';

export default function PilulasLista() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'codigos';

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

  const items = tipo === 'ministros' ? ministrosPillsItems : fastPillsItems;
  const title = tipo === 'ministros' ? 'Pílulas dos Ministros do STF' : 'Pílulas de Códigos';

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
    <div className="min-h-dvh bg-zinc-950 pb-20">
      <PageHeader
        title={title}
        onBack={() => navigate(-1)}
        rightAction={<div className="w-8" />}
      />
      <div className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <motion.button
              key={item.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              className="group relative flex flex-col items-center justify-end aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 active:scale-[0.98] transition-all"
            >
              <img src={item.image} alt={item.fullName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
              <div className="relative z-10 w-full p-3 text-center">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{item.text}</h3>
                <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-widest truncate">{item.fullName}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
