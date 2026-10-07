import { X, ChevronRight, Book, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { getLeisPorTipo } from '@/data/leisCatalog';
import { LEI_ICON_MAP, LEI_ICON_DEFAULT_COLOR } from '@/lib/leiIcons';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

export type SheetType = 'codigos' | 'estatutos' | 'sumulas' | 'mais' | null;

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

  if (!activeSheet) return null;

  const handleNavigate = (path: string) => {
    haptic.selection();
    onClose();
    navigate(path);
  };

  const renderMais = () => (
    <div className="space-y-2">
      {maisMenu.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.to)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:bg-secondary/80 active:scale-[0.98] transition-all shadow-sm cursor-pointer text-left"
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
      })}
    </div>
  );

  const renderLeisList = (tipo: string) => {
    const leis = getLeisPorTipo(tipo);
    return (
      <div className="space-y-2 pb-4">
        {leis.map((lei) => {
          const Icon = LEI_ICON_MAP[lei.id] || Book;
          const slug = leiToSlug({ id: lei.id, nome: lei.nome });
          const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
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
                    backgroundColor: `${lei.iconColor ?? LEI_ICON_DEFAULT_COLOR}18`,
                    color: lei.iconColor ?? LEI_ICON_DEFAULT_COLOR,
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
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
        })}
      </div>
    );
  };

  const renderSumulasList = () => {
    const sumulas = [
      { id: 'stf', nome: 'Súmulas do STF', sigla: 'STF', desc: 'Supremo Tribunal Federal', color: '#1d4ed8' },
      { id: 'stj', nome: 'Súmulas do STJ', sigla: 'STJ', desc: 'Superior Tribunal de Justiça', color: '#0369a1' },
      { id: 'tst', nome: 'Súmulas do TST', sigla: 'TST', desc: 'Tribunal Superior do Trabalho', color: '#be123c' },
      { id: 'tse', nome: 'Súmulas do TSE', sigla: 'TSE', desc: 'Tribunal Superior Eleitoral', color: '#15803d' },
    ];
    
    return (
      <div className="space-y-2 pb-4">
        {/* Adiciona o menu de Súmulas Vinculantes */}
        <button
          onClick={() => handleNavigate('/vade-mecum/sumulas/vinculantes')}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition active:scale-[0.98] text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <Book className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-foreground truncate">Súmulas Vinculantes</p>
              <p className="text-[12px] text-muted-foreground truncate">STF com efeito vinculante</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
        </button>

        {sumulas.map((s) => (
          <button
            key={s.id}
            onClick={() => handleNavigate(`/jurisprudencia/${s.id}`)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition active:scale-[0.98] text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}18`, color: s.color }}
              >
                <span className="font-bold text-[12px]">{s.sigla}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-foreground truncate">{s.nome}</p>
                <p className="text-[12px] text-muted-foreground truncate">{s.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
          </button>
        ))}
      </div>
    );
  };

  const getTitle = () => {
    switch (activeSheet) {
      case 'codigos': return 'Códigos';
      case 'estatutos': return 'Estatutos';
      case 'sumulas': return 'Súmulas e Jurisprudência';
      case 'mais': return 'Mais Categorias';
      default: return '';
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 z-[60] transition-opacity duration-200"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border rounded-t-3xl pb-[calc(2.5rem+var(--sai-bottom))] pt-6 px-4 shadow-2xl max-h-[85vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-transform duration-200"
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {activeSheet === 'mais' && renderMais()}
        {activeSheet === 'codigos' && renderLeisList('codigo')}
        {activeSheet === 'estatutos' && renderLeisList('estatuto')}
        {activeSheet === 'sumulas' && renderSumulasList()}
      </div>
    </>
  );
}
