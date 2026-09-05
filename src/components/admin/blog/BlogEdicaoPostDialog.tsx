import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wand2 } from 'lucide-react';
import { BancoPost } from './blogEdicaoTypes';

interface BlogEdicaoPostDialogProps {
  editingPost: BancoPost | null;
  setEditingPost: React.Dispatch<React.SetStateAction<BancoPost | null>>;
  salvarPostEditado: () => Promise<void>;
  savingPost: boolean;
  handleCapaUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  regerarCapa: (postId: string) => void;
}

export function BlogEdicaoPostDialog({
  editingPost,
  setEditingPost,
  salvarPostEditado,
  savingPost,
  handleCapaUpload,
  regerarCapa,
}: BlogEdicaoPostDialogProps) {
  return (
    <Dialog open={!!editingPost} onOpenChange={(o) => !o && setEditingPost(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingPost?.id ? 'Editar Artigo' : 'Criar Artigo'}</DialogTitle>
        </DialogHeader>
        {editingPost && (
          <div className="space-y-4 pt-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">Título</span>
              <input
                type="text"
                value={editingPost.titulo}
                onChange={(e) => setEditingPost({ ...editingPost, titulo: e.target.value })}
                className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 font-semibold"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Conteúdo (Markdown)</span>
                  <textarea
                    value={editingPost.conteudo_md}
                    onChange={(e) => setEditingPost({ ...editingPost, conteudo_md: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm font-mono"
                    rows={20}
                  />
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Capa Atual</span>
                  {editingPost.imagem_url ? (
                    <img
                      src={editingPost.imagem_url}
                      alt="Capa"
                      className="w-full h-auto mt-1 rounded-lg object-cover aspect-video border border-border/50"
                    />
                  ) : (
                    <div className="w-full mt-1 aspect-video rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">URL da Imagem</span>
                  <input
                    type="text"
                    value={editingPost.imagem_url || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, imagem_url: e.target.value })}
                    className="w-full mt-1 rounded-lg bg-secondary px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </label>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground block mb-2">Upload de nova imagem</span>
                  <input type="file" accept="image/*" onChange={handleCapaUpload} className="text-sm" />
                </div>
                {editingPost.id && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        regerarCapa(editingPost.id);
                        setEditingPost(null);
                      }}
                      className="w-full p-2 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" /> Regerar Capa com IA
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t border-border/50 mt-4">
              <button
                onClick={() => setEditingPost(null)}
                className="flex-1 rounded-xl bg-secondary font-semibold py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPostEditado}
                disabled={savingPost}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm"
              >
                {savingPost ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
