import { useState, useMemo } from 'react';
import { X, ChevronRight, Book, ChevronDown, Search, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { getLeisPorTipo, LEIS_CATALOG } from '@/data/leisCatalog';
import { KNOWN_LEIS_DATAS } from '@/data/leiAlteracoesScraped';
import { LEI_ICON_MAP, LEI_ICON_DEFAULT_COLOR } from '@/lib/leiIcons';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { isFavorito } from '@/lib/leisFavoritos';
import { PrimeBottomSheet } from '../overlays/PrimeBottomSheet';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export type SheetType = 'codigos' | 'estatutos' | 'sumulas' | 'mais' | 'novidades' | null;

interface MaisMenuItem {
  id: string;
  label: string;
  to: string;
  icon: React.ElementType;
  desc: string;
  color: string;
}

interface Props {
  activeSheet: SheetType;
  onClose: () => void;
  maisMenu: MaisMenuItem[];
}

export default function VadeMecumCategoriesSheet({ activeSheet, onClose, maisMenu }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'favoritos' | 'recentes'>('todos');
  
  const voiceSearch = useVoiceInput((text) => setQuery(text));

  const handleNavigate = (path: string) => {
    haptic.selection();
    onClose();
    navigate(path);
  };

  const getHeaderProps = () => {
    switch (activeSheet) {
      case 'codigos': return { title: 'CÓDIGOS', color: 'bg-red-700' };
      case 'estatutos': return { title: 'ESTATUTOS', color: 'bg-blue-700' };
      case 'sumulas': return { title: 'SÚMULAS E JURISPRUDÊNCIA', color: 'bg-emerald-700' };
      case 'novidades': return { title: 'NOVIDADES LEGISLATIVAS', color: 'bg-yellow-600' };
      case 'mais': return { title: 'MAIS CATEGORIAS', color: 'bg-orange-700' };
      default: return { title: '', color: 'bg-zinc-800' };
    }
  };

  const header = getHeaderProps();

  const getList = () => {
    if (activeSheet === 'mais') return maisMenu;
    if (activeSheet === 'codigos') return getLeisPorTipo('codigo');
    if (activeSheet === 'estatutos') return getLeisPorTipo('estatuto');
    if (activeSheet === 'sumulas') return [
      { id: 'vinculantes', nome: 'Súmulas Vinculantes', sigla: '', descricao: 'STF com efeito vinculante', tipo: 'sumula', tabela_nome: '' },
      { id: 'stf', nome: 'Súmulas do STF', sigla: 'STF', descricao: 'Supremo Tribunal Federal', tipo: 'sumula', tabela_nome: '' },
      { id: 'stj', nome: 'Súmulas do STJ', sigla: 'STJ', descricao: 'Superior Tribunal de Justiça', tipo: 'sumula', tabela_nome: '' },
      { id: 'tst', nome: 'Súmulas do TST', sigla: 'TST', descricao: 'Tribunal Superior do Trabalho', tipo: 'sumula', tabela_nome: '' },
      { id: 'tse', nome: 'Súmulas do TSE', sigla: 'TSE', descricao: 'Tribunal Superior Eleitoral', tipo: 'sumula', tabela_nome: '' },
    ];
    if (activeSheet === 'novidades') {
      return LEIS_CATALOG.filter(lei => !!KNOWN_LEIS_DATAS[lei.id]);
    }
    return [];
  };

  const fullList = getList();
  
  const filteredList = useMemo(() => {
    let list = fullList as any[];
    if (query.trim().length > 0) {
      const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      list = list.filter(item => {
        const text = ('nome' in item ? `${item.nome} ${item.sigla} ${item.descricao}` : `${item.label} ${item.desc}`).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return text.includes(q);
      });
    }

    if (activeTab === 'favoritos' && activeSheet !== 'mais' && activeSheet !== 'sumulas') {
      list = list.filter(item => 'id' in item && isFavorito(item.id));
    }
    
    return list;
  }, [fullList, query, activeTab, activeSheet]);

  const renderItem = (item: ReturnType<typeof getList>[number]) => {
    if ('label' in item) {
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          onClick={() => handleNavigate(item.to)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition active:scale-[0.98] text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <Icon className="w-7 h-7 shrink-0" style={{ color: item.color }} strokeWidth={1.5} />
            <div className="min-w-0">
              <h3 className="font-display font-bold text-[16px] text-foreground truncate">{item.label}</h3>
              <p className="font-body text-sm text-muted-foreground truncate">{item.desc}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>
      );
    } else {
      const lei = item;
      const Icon = LEI_ICON_MAP[lei.id] || Book;
      const slug = leiToSlug({ id: lei.id, nome: lei.nome });
      let base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
      if (lei.tipo === 'sumula') {
        base = lei.id === 'vinculantes' ? '/vade-mecum/sumulas/vinculantes' : `/jurisprudencia/${lei.id}`;
      }
      
      const iconColor = activeSheet === 'sumulas' ? 
        (lei.id === 'stf' ? '#1d4ed8' : lei.id === 'stj' ? '#0369a1' : lei.id === 'tst' ? '#be123c' : lei.id === 'tse' ? '#15803d' : '#eab308') 
        : (lei.iconColor ?? LEI_ICON_DEFAULT_COLOR);

      return (
        <button
          key={lei.id}
          onClick={() => handleNavigate(base)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition active:scale-[0.98] text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${iconColor}18`,
                color: iconColor,
              }}
            >
              {activeSheet === 'sumulas' && lei.id !== 'vinculantes' ? (
                <span className="font-bold text-[12px]">{lei.sigla}</span>
              ) : (
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {lei.sigla ? `${lei.sigla} · ` : ''}{lei.nome}
              </p>
              <p className="text-[12px] text-muted-foreground truncate">{lei.descricao}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
        </button>
      );
    }
  };

  return (
    <PrimeBottomSheet open={!!activeSheet} onClose={onClose} zIndex={100}>
      <div className="flex flex-col h-[90vh] bg-background rounded-t-3xl overflow-hidden">
        
        {/* Header */}
        <div className={`${header.color} text-white pt-[calc(1.5rem+var(--sai-top,0px))] px-4 pb-4 shadow-lg shrink-0 rounded-b-3xl relative overflow-hidden transition-colors duration-300`}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <ChevronDown className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">{header.title}</h2>
            <div className="w-10" />
          </div>

          <div className="relative z-10 mb-4 flex items-center">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-12 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/15 transition-colors font-body"
            />
            <button 
              onClick={voiceSearch.toggle}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors cursor-pointer ${
                voiceSearch.listening ? 'bg-red-500 text-white animate-pulse' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex p-1 bg-black/20 rounded-xl backdrop-blur-sm">
            {(['todos', 'favoritos', 'recentes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg capitalize transition-all duration-200 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-[calc(2.5rem+var(--sai-bottom))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filteredList.length > 0 ? (
            filteredList.map(renderItem)
          ) : (
            <div className="text-center py-10 text-muted-foreground font-body">
              Nenhum resultado encontrado.
            </div>
          )}
        </div>

      </div>
    </PrimeBottomSheet>
  );
}
