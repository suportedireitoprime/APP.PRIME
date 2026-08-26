import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCheck, Library, Loader2, Trash2 } from 'lucide-react';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { toast } from 'sonner';
import { confirmar } from '@/lib/nativo/dialogos';
import { supabase } from '@/integrations/supabase/client';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { estimateAudiosSize, removeAllAudios, getDownloadedAudioIds, fetchNarracoesDisponiveis, downloadAudio } from '@/services/audioDownloadService';
import { formatBytes } from '@/data/offlineCatalog';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function ModoOfflineLeis() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const [audioStats, setAudioStats] = useState({ count: 0, bytes: 0 });
  const [totalNarracoesDisponiveis, setTotalNarracoesDisponiveis] = useState(0);
  const [loading, setLoading] = useState(true);
  const [baixandoTudo, setBaixandoTudo] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const refresh = async () => {
    setLoading(true);
    setAudioStats(await estimateAudiosSize());
    
    try {
      const { count } = await supabase
        .from('narracoes_artigos')
        .select('*', { count: 'exact', head: true });
        
      setTotalNarracoesDisponiveis(count || 0);
    } catch (e) {
      // offline
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleBaixarTudo = async () => {
    if (!online) {
      toast.error('Conecte-se à internet para baixar');
      return;
    }
    if (!(await confirmar({ mensagem: 'Baixar todas as narrações disponíveis? Pode levar alguns minutos.' }))) return;

    setBaixandoTudo(true);
    setProgresso(0);
    
    try {
      let baixadosSessao = 0;
      const todasNarracoes = [];
      
      for (const lei of LEIS_CATALOG) {
        const disponiveis = await fetchNarracoesDisponiveis(lei.tabela_nome);
        const baixadosSet = await getDownloadedAudioIds(lei.tabela_nome);
        const faltantes = disponiveis.filter(n => !baixadosSet.has(n.artigo_numero));
        todasNarracoes.push(...faltantes);
      }
      
      const totalParaBaixar = todasNarracoes.length;
      if (totalParaBaixar === 0) {
        toast.success('Todas as narrações já estão baixadas');
        setBaixandoTudo(false);
        return;
      }

      for (let i = 0; i < totalParaBaixar; i++) {
        await downloadAudio(todasNarracoes[i]);
        baixadosSessao++;
        setProgresso(Math.round((baixadosSessao / totalParaBaixar) * 100));
      }
      
      toast.success(`${baixadosSessao} narrações baixadas com sucesso!`);
    } catch (e) {
      toast.error('Ocorreu um erro durante o download');
    } finally {
      setBaixandoTudo(false);
      refresh();
    }
  };

  const handleClearAudios = async () => {
    if (!(await confirmar({ mensagem: 'Remover todos os áudios baixados? Você poderá baixá-los novamente quando quiser.' }))) return;
    await removeAllAudios();
    toast.success('Áudios removidos');
    refresh();
  };

  const mobileHeader = (
    <PageHeader
      title="Leis e narrações"
      subtitle="Textos e áudios offline"
      onBack={() => navigate('/modo-offline')}
    />
  );

  return (
    <DesktopPageLayout activeId="ferramentas" title="Leis e narrações" subtitle="Textos e áudios offline" mobileHeader={mobileHeader}>
      <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 lg:px-0 lg:py-0 space-y-5">

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Library className="h-7 w-7 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold leading-tight text-foreground break-words">
                {audioStats.count > 0 ? `${audioStats.count} de ${totalNarracoesDisponiveis || '...'} narrações baixadas` : 'Nenhuma narração baixada'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {audioStats.count > 0 ? formatBytes(audioStats.bytes) : 'Baixe agora para ouvir os artigos sem internet.'}
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
              onClick={() => void handleBaixarTudo()}
              disabled={baixandoTudo || totalNarracoesDisponiveis === 0 || !online}
              className="flex-1 min-w-[150px] h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {baixandoTudo ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {baixandoTudo ? `Baixando ${progresso}%` : 'Baixar tudo'}
            </button>
            {audioStats.count > 0 && (
              <button
                onClick={() => void handleClearAudios()}
                className="flex-1 min-w-[150px] h-11 rounded-xl border border-border text-xs font-semibold text-destructive flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Remover todas
              </button>
            )}
          </div>
        </section>

      </div>
    </DesktopPageLayout>
  );
}
