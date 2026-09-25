import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useEmAltaConfig } from '@/hooks/useEmAltaConfig';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { Reorder } from 'framer-motion';
import { X, GripVertical, Check, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { haptic } from '@/lib/nativeHaptics';

interface HomeEmAltaCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrder: string[];
}

export function HomeEmAltaCustomizer({ isOpen, onClose, defaultOrder }: HomeEmAltaCustomizerProps) {
  const { config, updateConfig, isUpdating } = useEmAltaConfig();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('codigo');

  useEffect(() => {
    if (isOpen) {
      if (config && config.length > 0) {
        setSelectedIds(config);
      } else {
        setSelectedIds(defaultOrder);
      }
    }
  }, [isOpen, config, defaultOrder]);

  const handleSave = () => {
    haptic.selection();
    updateConfig(selectedIds, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleToggle = (id: string) => {
    haptic.selection();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const categories = Array.from(new Set(LEIS_CATALOG.map(l => l.tipo)));
  
  // Agrupar itens não selecionados por categoria para a lista de baixo
  const availableItems = LEIS_CATALOG.filter(l => !selectedIds.includes(l.id));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-[32px]">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl font-display font-bold">Personalizar Em Alta</SheetTitle>
          <p className="text-sm text-muted-foreground font-body">
            Selecione e arraste para organizar seus atalhos favoritos.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top section: Selected items (Reorderable) */}
          <div className="px-6 py-4 border-b border-white/5 bg-secondary/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sua Ordem</h4>
            {selectedIds.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">Nenhum item selecionado.</p>
            ) : (
              <ScrollArea className="h-[180px] pr-3">
                <Reorder.Group axis="y" values={selectedIds} onReorder={setSelectedIds} className="space-y-2">
                  {selectedIds.map(id => {
                    const item = LEIS_CATALOG.find(l => l.id === id);
                    if (!item) return null;
                    return (
                      <Reorder.Item key={id} value={id} className="flex items-center gap-3 bg-secondary/50 border border-white/10 rounded-xl p-3 select-none">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 bg-black/40 rounded text-white">{item.sigla}</span>
                          <span className="text-sm font-semibold truncate text-white">{item.nome}</span>
                        </div>
                        <button onClick={() => handleToggle(id)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </ScrollArea>
            )}
          </div>

          {/* Bottom section: Available catalog grouped by tabs */}
          <div className="flex-1 flex flex-col overflow-hidden p-6 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Adicionar ao Em Alta</h4>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-none mb-4">
                <TabsList className="w-max inline-flex">
                  <TabsTrigger value="codigo" className="text-xs">Códigos</TabsTrigger>
                  <TabsTrigger value="estatuto" className="text-xs">Estatutos</TabsTrigger>
                  <TabsTrigger value="constituicao" className="text-xs">Constituição</TabsTrigger>
                  <TabsTrigger value="lei" className="text-xs">Leis Esparsas</TabsTrigger>
                </TabsList>
              </ScrollArea>
              
              <div className="flex-1 overflow-hidden relative">
                {['codigo', 'estatuto', 'constituicao', 'lei'].map(tab => (
                  <TabsContent key={tab} value={tab} className="absolute inset-0 mt-0 outline-none data-[state=inactive]:hidden overflow-y-auto pb-20 [scrollbar-width:none] pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LEIS_CATALOG.filter(l => l.tipo === tab && !selectedIds.includes(l.id)).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleToggle(item.id)}
                          className="flex items-center gap-3 bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-white/5 rounded-xl p-3 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.nome}</p>
                            <p className="text-[10px] text-muted-foreground">{item.sigla}</p>
                          </div>
                        </button>
                      ))}
                      {LEIS_CATALOG.filter(l => l.tipo === tab && !selectedIds.includes(l.id)).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-full py-4 text-center">Todos adicionados.</p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/5 bg-[#0D0F12] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="w-full h-[52px] rounded-xl font-bold text-[15px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {isUpdating ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
