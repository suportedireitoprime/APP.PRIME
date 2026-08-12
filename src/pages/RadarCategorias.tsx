import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Scale, BookOpen, AlertCircle, Book, Shield, Users, Heart, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import RadarBottomNav from '@/components/radar/RadarBottomNav';

const CATEGORIES = [
  { name: 'Código Penal', icon: AlertCircle, color: '#ef4444', desc: 'Crimes e Penas', count: '+500' },
  { name: 'Cód. Processo Penal', icon: Scale, color: '#f97316', desc: 'Regras processuais penais', count: '+300' },
  { name: 'Código Civil', icon: Book, color: '#3b82f6', desc: 'Direitos, Bens e Família', count: '+400' },
  { name: 'Cód. Processo Civil', icon: Scale, color: '#06b6d4', desc: 'Regras processuais cíveis', count: '+250' },
  { name: 'Constituição Federal', icon: BookOpen, color: '#22c55e', desc: 'Carta Magna', count: '+600' },
  { name: 'CLT', icon: Users, color: '#f59e0b', desc: 'Leis Trabalhistas', count: '+350' },
  { name: 'CDC', icon: Shield, color: '#a855f7', desc: 'Defesa do Consumidor', count: '+150' },
  { name: 'ECA', icon: Users, color: '#ec4899', desc: 'Crianças e Adolescentes', count: '+200' },
  { name: 'Maria da Penha', icon: Shield, color: '#f43f5e', desc: 'Violência Doméstica', count: '+80' },
  { name: 'Lei de Drogas', icon: AlertCircle, color: '#a1a1aa', desc: 'Prevenção e Repressão', count: '+120' },
  { name: 'CTB', icon: Car, color: '#eab308', desc: 'Trânsito Brasileiro', count: '+180' },
  { name: 'Estatuto da Pessoa Idosa', icon: Heart, color: '#10b981', desc: 'Direitos dos Idosos', count: '+90' },
];

const RadarCategorias = () => {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const filtered = CATEGORIES.filter(c => c.name.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-h-dvh bg-background text-foreground pb-[100px]">
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4">
        <PageHeader
          title="Categorias"
          subtitle="Projetos por Temas Principais"
          onBack={() => goBack()}
        />

        <div className="px-4 lg:mx-auto lg:max-w-[1100px] mt-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar categorias..."
              className="w-full pl-11 h-12 text-[16px] rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <main className="p-4 lg:mx-auto lg:max-w-[1100px]">
        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
            <Search className="w-12 h-12 mb-4 text-muted-foreground" />
            <p>Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, ease: 'easeOut', duration: 0.3 }}
                  onClick={() => navigate(`/radar/proposicoes?busca=${encodeURIComponent(cat.name)}`)}
                  className="group relative flex flex-col items-center p-5 text-center rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
                >
                  <div 
                    className="absolute inset-0 opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.08]" 
                    style={{ backgroundColor: cat.color }} 
                  />
                  
                  <Icon 
                    className="w-12 h-12 mb-4 transition-transform duration-300 group-hover:scale-110" 
                    style={{ color: cat.color, filter: `drop-shadow(0px 4px 12px ${cat.color}40)` }} 
                  />
                  
                  <h3 className="font-extrabold text-[13px] uppercase tracking-wide leading-tight text-foreground line-clamp-2 min-h-[32px] w-full">
                    {cat.name}
                  </h3>
                  
                  <span className="text-[11px] text-muted-foreground mt-1 mb-3 line-clamp-1 w-full">
                    {cat.desc}
                  </span>
                  
                  <div className="mt-auto w-full pt-3 border-t border-border/50 flex justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                      {cat.count} PLs
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <RadarBottomNav />
    </div>
  );
};

export default RadarCategorias;
