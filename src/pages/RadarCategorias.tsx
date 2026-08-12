import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Hash, Scale, BookOpen, AlertCircle, Book, Shield, Users, Activity, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import RadarBottomNav from '@/components/radar/RadarBottomNav';
import { fetchProposicoes } from '@/services/radarService';

// Uma função simples para extrair tags para a contagem, baseada na do ProposicoesPanel
function extractTags(ementa: string | null): string[] {
  if (!ementa) return [];
  const tags: string[] = [];
  const text = ementa.toLowerCase();

  if (text.includes('código penal') || text.includes('decreto-lei nº 2.848')) tags.push('Código Penal');
  if (text.includes('processo penal') || text.includes('decreto-lei nº 3.689')) tags.push('Cód. Processo Penal');
  if (text.includes('código civil') || text.includes('lei nº 10.406')) tags.push('Código Civil');
  if (text.includes('processo civil') || text.includes('lei nº 13.105')) tags.push('Cód. Processo Civil');
  if (text.includes('constituição') || text.includes('constituição federal') || text.match(/\bcf\b/)) tags.push('Constituição Federal');
  if (text.includes('consolidação das leis do trabalho') || text.match(/\bclt\b/)) tags.push('CLT');
  if (text.includes('código de defesa do consumidor') || text.includes('lei nº 8.078')) tags.push('CDC');
  if (text.includes('estatuto da criança e do adolescente') || text.includes('lei nº 8.069')) tags.push('ECA');
  if (text.includes('maria da penha') || text.includes('lei nº 11.340')) tags.push('Maria da Penha');
  if (text.includes('lei de drogas') || text.includes('lei nº 11.343')) tags.push('Lei de Drogas');
  if (text.includes('código de trânsito') || text.includes('lei nº 9.503')) tags.push('CTB');
  if (text.includes('estatuto da pessoa idosa') || text.includes('lei nº 10.741')) tags.push('Estatuto da Pessoa Idosa');

  return [...new Set(tags)];
}

const CATEGORY_META: Record<string, { icon: any, color: string, desc: string }> = {
  'Código Penal': { icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/20', desc: 'Crimes e Penas' },
  'Cód. Processo Penal': { icon: Scale, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', desc: 'Regras processuais penais' },
  'Código Civil': { icon: Book, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', desc: 'Direitos, Bens e Família' },
  'Cód. Processo Civil': { icon: Scale, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', desc: 'Regras processuais cíveis' },
  'Constituição Federal': { icon: BookOpen, color: 'text-green-500 bg-green-500/10 border-green-500/20', desc: 'Carta Magna' },
  'CLT': { icon: Users, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', desc: 'Leis Trabalhistas' },
  'CDC': { icon: Shield, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', desc: 'Defesa do Consumidor' },
  'ECA': { icon: Users, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', desc: 'Crianças e Adolescentes' },
  'Maria da Penha': { icon: Shield, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', desc: 'Violência Doméstica' },
  'Lei de Drogas': { icon: AlertCircle, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', desc: 'Prevenção e Repressão' },
  'CTB': { icon: Activity, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', desc: 'Trânsito Brasileiro' },
  'Estatuto da Pessoa Idosa': { icon: Heart, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', desc: 'Direitos dos Idosos' },
};

const RadarCategorias = () => {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      // Busca 3 páginas para ter uma boa amostra inicial de contagem
      const p1 = await fetchProposicoes(undefined, undefined, 1);
      const p2 = await fetchProposicoes(undefined, undefined, 2);
      const p3 = await fetchProposicoes(undefined, undefined, 3);
      if (!isMounted) return;
      
      const all = [...p1, ...p2, ...p3];
      const counts: Record<string, number> = {};
      
      all.forEach(p => {
        const ementa = p.ementa ?? p.dados_json?.ementa;
        const tags = extractTags(ementa);
        tags.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      
      // Inicializar com 0 as categorias que não vieram
      Object.keys(CATEGORY_META).forEach(k => {
        if (!counts[k]) counts[k] = 0;
      });

      setTagCounts(counts);
      setLoading(false);
    }
    
    loadStats();
    return () => { isMounted = false; };
  }, []);

  const entries = Object.entries(tagCounts)
    .filter(([name]) => name.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b[1] - a[1]); // Ordenar por quantidade decrescente

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
              className="w-full pl-11 h-12 text-[16px] rounded-xl bg-card border-border/50 shadow-sm"
            />
          </div>
        </div>
      </div>

      <main className="p-4 lg:mx-auto lg:max-w-[1100px]">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {entries.map(([name, count], i) => {
              const meta = CATEGORY_META[name] || { icon: Hash, color: 'text-primary bg-primary/10 border-primary/20', desc: 'Leis Gerais' };
              const Icon = meta.icon;
              return (
                <motion.button
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/radares?busca=${encodeURIComponent(name)}`)}
                  className="flex flex-col items-start p-4 text-left rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border mb-3 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 min-h-[40px]">
                    {name}
                  </h3>
                  
                  <div className="mt-auto w-full flex items-center justify-between pt-2">
                    <span className="text-[10px] text-muted-foreground truncate mr-2">{meta.desc}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {count} PLs
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
        
        {!loading && entries.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">Nenhuma categoria encontrada para a busca.</p>
          </div>
        )}
      </main>

      <RadarBottomNav />
    </div>
  );
};

export default RadarCategorias;
