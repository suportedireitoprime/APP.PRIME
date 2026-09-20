import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getLocalLeituraNativa, cacheLeituraOnDemand } from '@/services/leituraNativaPrefetch';
import { pullLeituraProgress, pushLeituraProgress } from '@/lib/leituraProgressSync';
import { resolveLivroTabela, getCandidateTabelas } from '@/lib/bibliotecaColecoes';

export type Registro = {
  status: 'pendente' | 'processando' | 'pronto' | 'erro';
  conteudo_md: string | null;
  conteudo_md_refinado?: string | null;
  refino_status?: 'pendente' | 'processando' | 'pronto' | 'erro' | null;
  sumario_json: any[] | null;
  capitulos_json?: any[] | null;
  total_paginas: number | null;
  erro_detalhe: string | null;
  etapa: string | null;
  progresso: number;
  total_etapas: number;
};

export const LOCAL_KEY = (t: string, i: string) => `leitura-nativa:${t}:${i}`;

export function useLeitorData(livroTabela: string, livroId: string, pdfUrl: string, titulo: string, autor?: string | null, capa?: string | null) {
  const [status, setStatus] = useState<Registro['status']>('pendente');
  const [conteudo, setConteudo] = useState<string>('');
  const [sumario, setSumario] = useState<any[]>([]);
  const [capitulos, setCapitulos] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  
  const [etapa, setEtapa] = useState<string | null>('Iniciando');
  const [progresso, setProgresso] = useState<number>(0);
  const [totalEtapas, setTotalEtapas] = useState<number>(6);
  const [totalPaginas, setTotalPaginas] = useState<number | null>(null);
  const [refinoStatus, setRefinoStatus] = useState<Registro['refino_status']>(null);

  const [resumeOcrPage, setResumeOcrPage] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const canonicalTabela = resolveLivroTabela(livroTabela);
  const candidates = useMemo(() => getCandidateTabelas(livroTabela), [livroTabela]);

  const recarregar = useCallback(() => {
    setStatus('processando');
    setErro(null);
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    void pullLeituraProgress().catch(console.error);
  }, []);

  useEffect(() => {
    const key = LOCAL_KEY(canonicalTabela, livroId);
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(
        key,
        JSON.stringify({
          ...prev,
          index: typeof prev.index === 'number' ? prev.index : 0,
          updatedAt: Date.now(),
          titulo: titulo || prev.titulo || 'Continuar leitura',
          autor: autor ?? prev.autor ?? null,
          capa: capa ?? prev.capa ?? null,
        }),
      );
      window.dispatchEvent(new CustomEvent('biblioteca:tracking', { detail: { key } }));
    } catch {}
    pushLeituraProgress(canonicalTabela, livroId, 800);
  }, [canonicalTabela, livroId, titulo, autor, capa]);

  useEffect(() => {
    let cancelled = false;
    let pollingId: ReturnType<typeof setInterval> | null = null;
    let restoredIndex = false;

    const applyRow = async (data: any) => {
      if (!data || cancelled) return;
      if (data.etapa) setEtapa(data.etapa);
      if (typeof data.progresso === 'number') setProgresso(data.progresso);
      if (typeof data.total_etapas === 'number') setTotalEtapas(data.total_etapas);
      if (typeof data.total_paginas === 'number') setTotalPaginas(data.total_paginas);
      if (data.refino_status) {
        setRefinoStatus((prev) => {
          if (prev !== 'erro' && data.refino_status === 'erro') {
            toast.warning('Refinamento indisponível — mostrando texto original do OCR.');
          }
          return data.refino_status;
        });
      }

      let contentToUse = data.conteudo_md_refinado || data.conteudo_md || null;
      
      if (!contentToUse && (data.conteudo_md_refinado_url || data.conteudo_md_url)) {
        try {
          const url = data.conteudo_md_refinado_url || data.conteudo_md_url;
          const res = await fetch(url);
          if (res.ok) {
            contentToUse = await res.text();
          } else {
            console.error("Storage fetch falhou com status:", res.status);
            setStatus('erro');
            setErro('Não foi possível carregar o texto do livro (Erro ' + res.status + ').');
          }
        } catch (e) {
          console.error("Erro ao baixar conteudo do Storage no leitor nativo", e);
          setStatus('erro');
          setErro('Falha de rede ao carregar o texto do livro.');
        }
      }

      if (data.status === 'pronto' && contentToUse) {
        setStatus('pronto');
        setConteudo(contentToUse);
        setSumario((data.sumario_json as any[]) || []);
        setCapitulos((data.capitulos_json as any[]) || []);
        if (!restoredIndex) {
          restoredIndex = true;
          try {
            const saved =
              JSON.parse(localStorage.getItem(LOCAL_KEY(canonicalTabela, livroId)) || '{}') ||
              JSON.parse(localStorage.getItem(LOCAL_KEY(livroTabela, livroId)) || '{}');
            if (typeof saved.ocrPage === 'number' && saved.ocrPage > 0) {
              setResumeOcrPage(saved.ocrPage);
            } else if (typeof saved.index === 'number' && saved.index > 0) {
              setResumeOcrPage(-saved.index);
            }
          } catch {}
        }
        if (pollingId) {
          clearInterval(pollingId);
          pollingId = null;
        }
      } else if (data.status === 'erro') {
        setStatus('erro');
        setErro(data.erro_detalhe || 'Erro desconhecido');
        if (pollingId) {
          clearInterval(pollingId);
          pollingId = null;
        }
      }
    };

    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('biblioteca_leitura_nativa')
        .select('*')
        .in('livro_tabela', candidates)
        .eq('livro_id', String(livroId))
        .order('status', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) await applyRow(data);
      return data;
    };

    const startPolling = () => {
      if (pollingId) return;
      pollingId = setInterval(() => {
        if (!cancelled) void fetchLatest().catch(console.error);
      }, 2500);
    };

    const channel = supabase
      .channel(`leitura-nativa-${canonicalTabela}-${livroId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'biblioteca_leitura_nativa',
          filter: `livro_id=eq.${livroId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row: any = payload.new;
          if (candidates.includes(row?.livro_tabela)) applyRow(row);
        }
      )
      .subscribe();

    void (async () => {
      try {
        let local = await getLocalLeituraNativa(canonicalTabela, livroId);
        if (!local && canonicalTabela !== livroTabela) {
          local = await getLocalLeituraNativa(livroTabela, livroId);
        }

        if (cancelled) return;
        const hasLocalContent = !!local?.conteudo_md;
        const localPronto = hasLocalContent && (local as any).refino_status === 'pronto';
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

        if (localPronto) {
          setStatus('pronto');
          setConteudo(local!.conteudo_md);
          setSumario((local!.sumario_json as any) || []);
          setCapitulos(((local as any).capitulos_json as any[]) || []);
          setTotalPaginas(local!.total_paginas ?? null);
          try {
            const saved = JSON.parse(localStorage.getItem(LOCAL_KEY(canonicalTabela, livroId)) || '{}');
            if (typeof saved.ocrPage === 'number' && saved.ocrPage > 0) setResumeOcrPage(saved.ocrPage);
          } catch {}
          return;
        }

        if (offline) {
          if (hasLocalContent) {
            setStatus('pronto');
            setConteudo(local!.conteudo_md as string);
            setSumario((local!.sumario_json as any) || []);
            setCapitulos(((local as any).capitulos_json as any[]) || []);
            setTotalPaginas(local!.total_paginas ?? null);
            return;
          }
          setStatus('erro');
          setErro(
            'Este livro ainda não foi baixado para leitura offline. Conecte-se à internet para preparar a leitura, ou baixe-o na aba "Offline" da biblioteca.'
          );
          return;
        }

        const existing = await fetchLatest();
        if (cancelled) return;

        if (existing && (existing.status === 'pronto' || existing.conteudo_md_refinado || existing.conteudo_md || existing.conteudo_md_refinado_url || existing.conteudo_md_url)) {
          cacheLeituraOnDemand(canonicalTabela, livroId);
          if (existing.refino_status === 'processando') startPolling();
          return;
        }

        setStatus('processando');
        startPolling();

        const { error } = await supabase.functions.invoke('biblioteca-ocr-mistral', {
          body: { livro_id: String(livroId), livro_tabela: canonicalTabela, pdf_url: pdfUrl, titulo },
        });
        if (error) throw error;
        void fetchLatest().catch(console.error);
      } catch (e: any) {
        console.error('[LeitorNativo]', e);
        if (!cancelled) {
          const { data: check } = await supabase
            .from('biblioteca_leitura_nativa')
            .select('status')
            .in('livro_tabela', candidates)
            .eq('livro_id', String(livroId))
            .order('status', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (check?.status === 'processando') return;
          
          setStatus('erro');
          const raw = String(e?.message || e || '');
          const isNetwork =
            /Failed to (send|fetch)/i.test(raw) ||
            /NetworkError|network request failed/i.test(raw) ||
            (typeof navigator !== 'undefined' && navigator.onLine === false);
          setErro(
            isNetwork
              ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente. Se já baixou este livro offline, abra-o pela aba "Offline".'
              : (raw || 'Falha ao preparar a leitura. O livro pode ser muito grande.')
          );
        }
      }
    })().catch(console.error);

    return () => {
      cancelled = true;
      if (pollingId) clearInterval(pollingId);
      supabase.removeChannel(channel);
    };
  }, [livroId, canonicalTabela, livroTabela, candidates, pdfUrl, titulo, reloadTick]);

  return {
    status,
    conteudo,
    sumario,
    capitulos,
    erro,
    etapa,
    progresso,
    totalEtapas,
    totalPaginas,
    refinoStatus,
    resumeOcrPage,
    recarregar,
  };
}
