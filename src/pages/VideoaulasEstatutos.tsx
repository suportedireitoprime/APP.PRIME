import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Landmark, Shield, Users, HeartHandshake, Building, Award, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { haptic } from '@/lib/nativeHaptics';
import { pushRecente } from '@/lib/leisRecentes';

const ICONES_ESTATUTOS: Record<string, any> = {
  eoab: Award,
  eca: Users,
  ei: HeartHandshake,
  epd: Shield,
  eir: Users,
  ec: Building,
  ed: Shield,
  et: Landmark,
  ej: Users,
  em: Shield,
};

export default function VideoaulasEstatutos() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  // Filtra apenas as leis que são do tipo 'estatuto' do catálogo
  const estatutos = useMemo(() => {
    const todos = LEIS_CATALOG.filter((l) => l.tipo === 'estatuto');
    if (!q.trim()) return todos;

    const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return todos.filter((e) => {
      const nome = (e.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sigla = (e.sigla || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const desc = (e.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nome.includes(query) || sigla.includes(query) || desc.includes(query);
    });
  }, [q]);

  return (
    <div className="min-h-screen bg-background pb-36">
      <PageHeader
        title="Estatutos em Vídeo"
        description="Aulas e explicações artigo por artigo dos principais Estatutos do Brasil"
        onBack={() => navigate('/videoaulas')}
        theme="green"
      />

      <div className="px-4 mt-6 space-y-4">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar estatuto (ex: OAB, ECA, Idoso)..."
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-emerald-500/40 text-[15px]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Contador */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {estatutos.length} {estatutos.length === 1 ? 'estatuto' : 'estatutos'}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Escolha para ver os artigos em vídeo
          </span>
        </div>

        {/* Lista de Estatutos */}
        <div className="space-y-2.5">
          {estatutos.map((est) => {
            const Icon = ICONES_ESTATUTOS[est.id] || Landmark;
            const corIcone = est.iconColor || '#10b981';

            return (
              <button
                key={est.id}
                onClick={() => {
                  haptic.selection();
                  pushRecente({
                    tipo: est.tipo,
                    leiId: est.id,
                    nome: est.nome,
                    descricao: est.descricao,
                    tabela_nome: est.tabela_nome,
                  });
                  navigate(`/videoaulas/lei-seca/lei/${est.id}`);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-card border border-border/80 text-left hover:border-emerald-500/50 transition-all active:scale-[0.98] group shadow-sm"
              >
                <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                  <Icon className="w-7 h-7" strokeWidth={1.4} style={{ color: corIcone }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {est.sigla || 'Estatuto'}
                    </span>
                  </div>
                  <p className="text-foreground font-bold text-[15px] truncate mt-0.5">
                    {est.nome}
                  </p>
                  <p className="text-muted-foreground text-xs truncate mt-0.5">
                    {est.descricao}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}

          {estatutos.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Nenhum estatuto encontrado.</p>
              <button
                onClick={() => setQ('')}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
