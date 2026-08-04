import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, Loader2, Trash2, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ItemDownloadRow, { type ItemAudio } from '@/components/offline/ItemDownloadRow';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  listarAudiosOffline,
  assinarAudioOffline,
  formatarBytes,
  suportaAudioOffline,
  type AudioOffline,
} from '@/lib/nativo/audioOffline';

interface Props {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  categoria: AudioOffline['categoria'];
  carregar: () => Promise<ItemAudio[]>;
  /** Rótulo do que está sendo baixado (plural). */
  rotulo: string;
}

/** Página genérica de seleção de áudios para uso offline. */
export default function AudioOfflinePage({ titulo, subtitulo, icon: Icon, categoria, carregar, rotulo }: Props) {
  const navigate = useNavigate();
  const voltar = () => navigate('/modo-offline');
  const online = useOnlineStatus();
  const [itens, setItens] = useState<ItemAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [baixandoTudo, setBaixandoTudo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [baixados, setBaixados] = useState<AudioOffline[]>([]);

  useEffect(() => {
    let vivo = true;
    void carregar()
      .then(l => { if (vivo) setItens(l); })
      .catch(() => { if (vivo) setItens([]); })
      .finally(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [carregar]);

  useEffect(() => {
    const ler = () => { void listarAudiosOffline().then(l => setBaixados(l.filter(i => i.categoria === categoria))); };
    ler();
    return assinarAudioOffline(ler);
  }, [categoria]);

  const bytes = useMemo(() => baixados.reduce((s, i) => s + (i.bytes || 0), 0), [baixados]);

  const baixarTudo = async () => {
    if (!suportaAudioOffline()) {
      toast.error('Download offline disponível apenas no aplicativo');
      return;
    }
    const pendentes: ItemAudio[] = [];
    for (const i of itens) {
      if (!(await estaBaixado(i.id))) pendentes.push(i);
    }
    if (pendentes.length === 0) {
      toast.success('Tudo já está baixado');
      return;
    }
    if (!confirm(`Baixar ${pendentes.length} ${rotulo}? Use Wi-Fi para economizar dados.`)) return;

    setBaixandoTudo(true);
    setProgresso(0);
    let ok = 0;
    for (let i = 0; i < pendentes.length; i++) {
      const r = await baixarAudioOffline({
        id: pendentes[i].id,
        url: pendentes[i].url,
        titulo: pendentes[i].titulo,
        subtitulo: pendentes[i].subtitulo,
        categoria,
      });
      if (r) ok++;
      setProgresso(Math.round(((i + 1) / pendentes.length) * 100));
    }
    setBaixandoTudo(false);
    toast[ok > 0 ? 'success' : 'error'](ok > 0 ? `${ok} ${rotulo} disponíveis offline` : 'Não foi possível baixar');
  };

  const removerTudo = async () => {
    if (baixados.length === 0) return;
    if (!confirm(`Remover ${baixados.length} ${rotulo} baixados?`)) return;
    for (const b of baixados) await removerAudioOffline(b.id);
    toast.success('Downloads removidos');
  };

  const mobileHeader = <PageHeader title={titulo} subtitle={subtitulo} onBack={voltar} />;

  return (
    <DesktopPageLayout activeId="ferramentas" title={titulo} subtitle={subtitulo} mobileHeader={mobileHeader}>
      <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 lg:px-0 lg:py-0 space-y-4">

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Icon className="h-7 w-7 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold leading-tight text-foreground break-words">
                {baixados.length > 0 ? `${baixados.length} de ${itens.length} baixados` : `Nenhum ${rotulo.replace(/s$/, '')} baixado`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {baixados.length > 0 ? formatarBytes(bytes) : 'Baixe agora para ouvir sem internet depois.'}
              </p>
            </div>
          </div>

          {baixandoTudo && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full bg-primary" animate={{ width: `${progresso}%` }} transition={{ duration: 0.2 }} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void baixarTudo()}
              disabled={baixandoTudo || itens.length === 0 || !online}
              className="flex-1 min-w-[150px] h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {baixandoTudo ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {baixandoTudo ? `Baixando ${progresso}%` : 'Baixar tudo'}
            </button>
            {baixados.length > 0 && (
              <button
                onClick={() => void removerTudo()}
                className="flex-1 min-w-[150px] h-11 rounded-xl border border-border text-xs font-semibold text-destructive flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Remover todos
              </button>
            )}
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : itens.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nada disponível por aqui ainda.</p>
        ) : (
          <div className="grid gap-1.5">
            {itens.map(i => (
              <ItemDownloadRow key={i.id} item={i} categoria={categoria} offline={!online} />
            ))}
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
