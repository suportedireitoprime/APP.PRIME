import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, HardDrive, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { useGoBack } from '@/hooks/useGoBack';
import {
  listarAudiosOffline,
  removerAudioOffline,
  limparAudiosOffline,
  tamanhoTotalOffline,
  formatarBytes,
  suportaAudioOffline,
  assinarAudioOffline,
  type AudioOffline,
} from '@/lib/nativo/audioOffline';
import { confirmar } from '@/lib/nativo/dialogos';

const ROTULOS: Record<AudioOffline['categoria'], string> = {
  'leis-cantadas': 'Leis cantadas',
  audioaulas: 'Audioaulas',
  narracao: 'Narração',
  outro: 'Áudio',
};

export default function MeusDownloads() {
  const voltar = useGoBack('/inicio');
  const [itens, setItens] = useState<AudioOffline[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    const [lista, bytes] = await Promise.all([listarAudiosOffline(), tamanhoTotalOffline()]);
    setItens(lista);
    setTotal(bytes);
    setCarregando(false);
  };

  useEffect(() => {
    void carregar();
    return assinarAudioOffline(() => void carregar());
  }, []);

  const remover = async (item: AudioOffline) => {
    await removerAudioOffline(item.id);
    toast.success('Download removido');
  };

  const limparTudo = async () => {
    const ok = await confirmar({
      titulo: 'Remover todos os downloads?',
      mensagem: 'Os áudios voltam a precisar de internet para tocar.',
      okTexto: 'Remover',
    });
    if (!ok) return;
    await limparAudiosOffline();
    toast.success('Downloads removidos');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Meus downloads" onBack={voltar} />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {itens.length} {itens.length === 1 ? 'áudio salvo' : 'áudios salvos'}
            </p>
            <p className="text-xs text-muted-foreground">{formatarBytes(total)} ocupados no aparelho</p>
          </div>
          {itens.length > 0 && (
            <Button variant="ghost" size="sm" onClick={limparTudo} className="text-destructive">
              Limpar
            </Button>
          )}
        </div>

        {!suportaAudioOffline() && (
          <p className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            O download offline funciona no aplicativo instalado (Android/iOS). No navegador, os áudios
            tocam direto da internet.
          </p>
        )}

        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Download className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nada baixado ainda. Toque em <strong>Baixar</strong> em uma lei cantada ou audioaula.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {itens.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
              >
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROTULOS[item.categoria]} · {formatarBytes(item.bytes)}
                  </p>
                </div>
                <button
                  onClick={() => void remover(item)}
                  aria-label={`Remover ${item.titulo}`}
                  className="p-2 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
