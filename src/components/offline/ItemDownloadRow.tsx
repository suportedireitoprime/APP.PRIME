import { useEffect, useState } from 'react';
import { Check, Download, Loader2, Trash2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  suportaAudioOffline,
  assinarAudioOffline,
  type AudioOffline,
} from '@/lib/nativo/audioOffline';

export interface ItemAudio {
  id: string;
  titulo: string;
  subtitulo?: string;
  url: string;
}

interface Props {
  item: ItemAudio;
  categoria: AudioOffline['categoria'];
  /** Sem internet: itens não baixados ficam esmaecidos. */
  offline?: boolean;
}

/** Linha padrão de download: selo "Disponível offline" ou botão "Baixar". */
export default function ItemDownloadRow({ item, categoria, offline }: Props) {
  const [baixado, setBaixado] = useState(false);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    const checar = () => { void estaBaixado(item.id).then(setBaixado); };
    checar();
    return assinarAudioOffline(checar);
  }, [item.id]);

  const alternar = async () => {
    if (baixado) {
      await removerAudioOffline(item.id);
      toast.success('Download removido');
      return;
    }
    if (!suportaAudioOffline()) {
      toast.error('Download offline disponível apenas no aplicativo');
      return;
    }
    setBaixando(true);
    const ok = await baixarAudioOffline({
      id: item.id,
      url: item.url,
      titulo: item.titulo,
      subtitulo: item.subtitulo,
      categoria,
    });
    setBaixando(false);
    toast[ok ? 'success' : 'error'](ok ? 'Disponível offline' : 'Não foi possível baixar');
  };

  const indisponivel = Boolean(offline) && !baixado;

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 ${indisponivel ? 'opacity-50' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground">{item.titulo}</p>
        {item.subtitulo && <p className="text-[11px] text-muted-foreground">{item.subtitulo}</p>}
        {baixado ? (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <Check className="h-3 w-3" /> Disponível offline
          </p>
        ) : indisponivel ? (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <WifiOff className="h-3 w-3" /> precisa de internet
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => void alternar()}
        disabled={baixando || indisponivel}
        aria-label={baixado ? 'Remover download' : 'Baixar'}
        className={`h-11 w-11 shrink-0 rounded-full border border-border flex items-center justify-center active:scale-95 transition disabled:opacity-50 ${
          baixado ? 'text-destructive' : 'text-primary'
        }`}
      >
        {baixando ? <Loader2 className="h-5 w-5 animate-spin" />
          : baixado ? <Trash2 className="h-5 w-5" />
          : <Download className="h-5 w-5" />}
      </button>
    </div>
  );
}
