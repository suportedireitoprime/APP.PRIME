import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Scale,
  Landmark,
  Shield,
  BookMarked,
  HeartPulse,
  FileText,
  ScrollText,
  Gavel,
  ArrowRight,
  Clock,
  Heart,
} from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { getRecentes, pushRecente } from '@/lib/leisRecentes';

interface VadeMecumDesktopViewProps {
  onOpenSearch: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'constituicao', label: 'Constituição' },
  { id: 'codigo', label: 'Códigos' },
  { id: 'estatuto', label: 'Estatutos' },
  { id: 'lei-especial', label: 'Leis Especiais' },
  { id: 'previdenciario', label: 'Previdenciário' },
] as const;

const SPECIAL_LISTS = [
  {
    id: 'lei-ordinaria',
    label: 'Leis Ordinárias',
    desc: 'Acervo completo por ano de publicação',
    icon: FileText,
    route: '/legislacao/lei-ordinaria',
  },
  {
    id: 'decreto',
    label: 'Decretos',
    desc: 'Decretos federais regulamentadores',
    icon: ScrollText,
    route: '/legislacao/decreto',
  },
  {
    id: 'sumula',
    label: 'Súmulas e Jurisprudência',
    desc: 'STF, STJ, TST, TSE e vinculantes',
    icon: Gavel,
    route: '/legislacao/sumula',
  },
] as const;

const TIPO_ICON: Record<string, typeof Scale> = {
  constituicao: Landmark,
  codigo: Scale,
  estatuto: Shield,
  'lei-especial': BookMarked,
  previdenciario: HeartPulse,
};

export function VadeMecumDesktopView({ onOpenSearch }: VadeMecumDesktopViewProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterText, setFilterText] = useState('');
  const recentes = useMemo(() => getRecentes().slice(0, 3), []);

  const filteredLaws = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return LEIS_CATALOG.filter((lei) => {
      if (selectedCategory !== 'all' && lei.tipo !== selectedCategory) return false;
      if (!q) return true;
      return `${lei.nome} ${lei.sigla ?? ''} ${lei.descricao ?? ''}`.toLowerCase().includes(q);
    });
  }, [selectedCategory, filterText]);

  const openLaw = (lei: { id: string; tipo: string; nome: string; descricao: string; tabela_nome: string }) => {
    pushRecente({
      tipo: lei.tipo,
      leiId: lei.id,
      nome: lei.nome,
      descricao: lei.descricao,
      tabela_nome: lei.tabela_nome,
    });
    const slug = leiToSlug({ id: lei.id, nome: lei.nome });
    navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${slug}`);
  };

  return (
    <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
            Legislação Atualizada
          </p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Vade Mecum
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Constituição, Códigos, Estatutos, Leis Especiais, Decretos e Súmulas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="h-9 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar artigos e leis</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/vade-mecum/favoritos')}
            className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-zinc-400" />
            <span>Favoritos</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/vade-mecum/recentes')}
            className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Recentes</span>
          </button>
        </div>
      </section>

      {/* Recentes */}
      {recentes.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Acessadas recentemente</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentes.map((item) => (
              <button
                key={item.leiId}
                type="button"
                onClick={() =>
                  openLaw({
                    id: item.leiId,
                    tipo: item.tipo,
                    nome: item.nome,
                    descricao: item.descricao,
                    tabela_nome: item.tabela_nome,
                  })
                }
                className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.16] text-left transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-rose-300 transition-colors">
                    {item.nome}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{item.descricao || item.tipo}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Acervos Especiais (Leis Ordinárias, Decretos, Súmulas) */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-3">
          Acervos por espécie normativa
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SPECIAL_LISTS.map((sp) => {
            const Icon = sp.icon;
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => navigate(sp.route)}
                className="group flex items-center gap-3.5 p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.16] text-left transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-rose-500/30 group-hover:bg-rose-500/10 transition-colors">
                  <Icon className="w-4 h-4 text-zinc-300 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{sp.label}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{sp.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Filtros + Catálogo */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white text-zinc-950'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar código ou sigla (ex: CPC, CLT)..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#111114] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLaws.map((lei) => {
            const Icon = TIPO_ICON[lei.tipo] ?? Scale;
            return (
              <button
                key={lei.id}
                type="button"
                onClick={() => openLaw(lei)}
                className="group flex items-start gap-3 p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.16] hover:bg-[#151519] text-left transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{lei.nome}</p>
                    {lei.sigla && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 shrink-0">
                        {lei.sigla}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{lei.descricao}</p>
                </div>
              </button>
            );
          })}
        </div>

        {filteredLaws.length === 0 && (
          <div className="py-12 text-center rounded-xl border border-white/[0.06] bg-[#111114]">
            <p className="text-sm text-zinc-400">Nenhuma lei encontrada com esse filtro.</p>
          </div>
        )}
      </section>
    </div>
  );
}
