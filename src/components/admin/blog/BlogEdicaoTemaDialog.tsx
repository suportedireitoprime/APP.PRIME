import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tema } from './blogEdicaoTypes';

interface BlogEdicaoTemaDialogProps {
  editingTema: Tema | null;
  setEditingTema: React.Dispatch<React.SetStateAction<Tema | null>>;
  onTemaUpdated: (updated: Tema) => void;
}

export function BlogEdicaoTemaDialog({
  editingTema,
  setEditingTema,
  onTemaUpdated,
}: BlogEdicaoTemaDialogProps) {
  const handleSalvar = async () => {
    if (!editingTema) return;
    const { error } = await supabase
      .from('blog_edicao_temas')
      .update({
        titulo_sugerido: editingTema.titulo_sugerido,
        categoria: editingTema.categoria,
        resumo_briefing: editingTema.resumo_briefing,
      })
      .eq('id', editingTema.id);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Tema atualizado!');
    onTemaUpdated(editingTema);
    setEditingTema(null);
  };

  return (
    <Dialog open={!!editingTema} onOpenChange={(o) => !o && setEditingTema(null)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle>Editar Tema</DialogTitle>
        </DialogHeader>
        {editingTema && (
          <div className="space-y-4 pt-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">Título sugerido</span>
              <input
                type="text"
                value={editingTema.titulo_sugerido}
                onChange={(e) => setEditingTema({ ...editingTema, titulo_sugerido: e.target.value })}
                className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Categoria</span>
              <input
                type="text"
                value={editingTema.categoria}
                onChange={(e) => setEditingTema({ ...editingTema, categoria: e.target.value })}
                className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Resumo / Briefing</span>
              <textarea
                value={editingTema.resumo_briefing || ''}
                onChange={(e) => setEditingTema({ ...editingTema, resumo_briefing: e.target.value })}
                rows={5}
                className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm resize-y"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingTema(null)}
                className="flex-1 rounded-xl bg-secondary font-semibold py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
