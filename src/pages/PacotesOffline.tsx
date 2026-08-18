import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Database, Loader2, CloudDownload, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { useGoBack } from '@/hooks/useGoBack';
import {
  listDownloadedPackages,
  removeOfflinePackage,
  getTotalOfflineStorageBytes,
  type OfflinePackageMetadata
} from '@/services/downloadManager';
import { syncTableToOffline } from '@/services/syncManager';
import { formatarBytes } from '@/lib/nativo/audioOffline';
import { confirmar } from '@/lib/nativo/dialogos';
import { supabase } from '@/integrations/supabase/client';

export default function PacotesOffline() {
  const voltar = useGoBack('/modo-offline');
  const [pkgs, setPkgs] = useState<OfflinePackageMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const carregar = async () => {
    const [lista, bytes] = await Promise.all([
      listDownloadedPackages(),
      getTotalOfflineStorageBytes()
    ]);
    setPkgs(lista);
    setTotal(bytes);
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const baixarPacote = async (id: string, name: string, table: string, col?: string, val?: string) => {
    if (syncingId) return;
    setSyncingId(id);
    const toastId = toast.loading(`Baixando pacote ${name}...`);
    try {
      const filter = col && val ? { col, val } : undefined;
      const count = await syncTableToOffline(table, id, name, filter);
      toast.success(`Baixado com sucesso! (${count} itens)`, { id: toastId });
      await carregar();
    } catch (e: any) {
      toast.error('Erro ao baixar pacote', { description: e.message, id: toastId });
    } finally {
      setSyncingId(null);
    }
  };

  const baixarResumos = () => baixarPacote('resumos', 'Resumos Jurídicos Completos', 'resumos_juridicos');
  const baixarLeis = () => baixarPacote('leis', 'Vade Mecum Base', 'leis'); // Precisamos ver se "leis" é a tabela correta. Vamos ajustar depois.
  const baixarFlashcardsDecks = () => baixarPacote('flashcards-decks', 'Decks de Flashcards', 'flashcards_decks');
  
  const remover = async (id: string) => {
    await removeOfflinePackage(id);
    toast.success('Pacote removido');
    await carregar();
  };

  const limparTudo = async () => {
    const ok = await confirmar({
      titulo: 'Remover todos os dados?',
      mensagem: 'Isso vai excluir os bancos de Resumos, Flashcards e Leis do seu aparelho. Você precisará de internet para acessá-los.',
      okTexto: 'Excluir',
    });
    if (!ok) return;
    for (const pkg of pkgs) {
      await removeOfflinePackage(pkg.id);
    }
    toast.success('Dados apagados');
    await carregar();
  };

  const isDownloaded = (id: string) => pkgs.some((p) => p.id === id);

  const pacotesDisponiveis = [
    { id: 'resumos', name: 'Banco de Resumos Jurídicos', table: 'resumos_juridicos' },
    { id: 'flashcards-decks', name: 'Decks de Flashcards Base', table: 'flashcards_decks' },
    { id: 'tematica-obras', name: 'Catálogo da Biblioteca', table: 'tematica_juridica_obras' },
    { id: 'questoes-areas', name: 'Áreas de Questões (Categorias)', table: 'questoes', rpc: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Banco de Dados Offline" onBack={voltar} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {formatarBytes(total)} ocupados
            </p>
            <p className="text-xs text-muted-foreground">Pacotes de dados sincronizados</p>
          </div>
          {pkgs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={limparTudo} className="text-destructive">
              Limpar Tudo
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm px-1">PACOTES PRINCIPAIS</h2>
          {pacotesDisponiveis.map((p, i) => {
            const downloaded = isDownloaded(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${downloaded ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {downloaded ? 'Sincronizado e disponível offline' : 'Requer download para uso offline'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {downloaded ? (
                    <button
                      onClick={() => void remover(p.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remover pacote do aparelho"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => !p.rpc && baixarPacote(p.id, p.name, p.table)}
                      disabled={syncingId === p.id || p.rpc}
                      className="gap-2 rounded-xl"
                    >
                      {syncingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CloudDownload className="h-4 w-4" />
                      )}
                      Baixar
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
