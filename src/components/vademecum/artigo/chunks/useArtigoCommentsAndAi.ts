import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invalidateCache, anotacoesKey } from '@/lib/artigoFuncoesPrefetch';
import type { ArtigoLei } from '@/data/mockData';
import type { Highlight } from '@/hooks/useHighlights';
import type { ModificationInfo } from '../artigoConstants';

interface UseArtigoCommentsAndAiProps {
  artigo: ArtigoLei | null;
  tabelaNome?: string;
  isPremium: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showTermosSheet: boolean;
  modificationInfo?: ModificationInfo;
  highlights: Highlight[];
  updateHighlightComment: (id: string, text: string) => void;
  updateHighlightTags: (id: string, tags: string[]) => void;
  setAnotacoesCount: React.Dispatch<React.SetStateAction<number>>;
  setAnotacoesRefreshTick: React.Dispatch<React.SetStateAction<number>>;
}

export function useArtigoCommentsAndAi({
  artigo,
  tabelaNome,
  isPremium,
  activeTab,
  setActiveTab,
  showTermosSheet,
  modificationInfo,
  highlights,
  updateHighlightComment,
  updateHighlightTags,
  setAnotacoesCount,
  setAnotacoesRefreshTick,
}: UseArtigoCommentsAndAiProps) {
  // Item 1: Prevenção de Race Condition na troca rápida de artigos via navegação/gesto
  const activeArtigoIdRef = useRef<string | null>(artigo?.id ?? null);
  const activeAbortCtrlRef = useRef<AbortController | null>(null);

  // Item 5: Cancelamento de requisições de IA ao fechar modal ou trocar artigo/aba
  const activeAiAbortCtrlRef = useRef<AbortController | null>(null);
  const activeTermosAbortCtrlRef = useRef<AbortController | null>(null);
  const activeNoteAbortCtrlRef = useRef<AbortController | null>(null);

  // Aborta todas as requisições ativas de IA no desmonte do hook/modal
  useEffect(() => {
    return () => {
      activeAbortCtrlRef.current?.abort();
      activeAiAbortCtrlRef.current?.abort();
      activeTermosAbortCtrlRef.current?.abort();
      activeNoteAbortCtrlRef.current?.abort();
    };
  }, []);

  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);
  const [aiContent, setAiContent] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiGeneratingMode, setAiGeneratingMode] = useState<null | 'explicacao' | 'exemplo' | 'termos'>(null);
  const [aiGeneratingStep, setAiGeneratingStep] = useState(0);

  const splitSections = useCallback((text: string, marker: string) => {
    const parts = text.split(marker).filter((s) => s.trim());
    return parts.map((part, i) => {
      const lines = part.trim().split('\n');
      const titleLine = lines.find((l) => l.startsWith('## ') || l.startsWith('**'));
      const title = titleLine
        ? titleLine.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
        : `Seção ${i + 1}`;
      const body = lines.filter((l) => l !== titleLine).join('\n').trim();
      return { title, body: body || part.trim() };
    });
  }, []);

  const handleGerarAnotacaoIa = useCallback(
    async (commentPrompt: { id: string } | null, setCommentText: (txt: string) => void) => {
      if (!commentPrompt) return;
      const currentHl = highlights.find((h) => h.id === commentPrompt.id);
      const trecho = currentHl?.text || artigo?.caput;
      if (!trecho) return;
      setIsGeneratingAiNote(true);

      // Item 5: Aborta requisição de anotação de IA anterior
      activeNoteAbortCtrlRef.current?.abort();
      const noteAbortCtrl = new AbortController();
      activeNoteAbortCtrlRef.current = noteAbortCtrl;

      try {
        const { data, error } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            mode: 'perguntar',
            artigoTexto: `Trecho da lei: "${trecho}"\nArtigo ${artigo?.numero || ''} da norma ${tabelaNome || ''}`,
            artigoNumero: artigo?.numero,
            leiNome: tabelaNome || '',
            messages: [
              {
                role: 'user',
                content: `Aja como um professor de direito para OAB/concursos. Escreva uma anotação de estudo rápida, didática e direta (máximo 2 a 3 frases) explicando o significado prático ou pegadinha desse trecho da lei: "${trecho}". Sem cumprimentos, vá direto à anotação.`,
              },
            ],
          },
          // @ts-ignore
          signal: noteAbortCtrl.signal,
        });
        if (noteAbortCtrl.signal.aborted) return;
        if (error) throw error;
        const reply = data?.reply || data?.text || data?.content;
        if (reply) {
          setCommentText(reply.trim());
          toast.success('Anotação gerada pela IA!');
        } else {
          toast.error('Não foi possível gerar a anotação.');
        }
      } catch (err: any) {
        if (noteAbortCtrl.signal.aborted || err?.name === 'AbortError') return;
        console.error(err);
        toast.error('Erro ao conectar com a IA');
      } finally {
        setIsGeneratingAiNote(false);
      }
    },
    [highlights, artigo?.caput, artigo?.numero, tabelaNome]
  );

  const handleSaveComment = useCallback(
    async (
      commentPrompt: { id: string } | null,
      commentText: string,
      commentTags: string[],
      cleanup: () => void
    ) => {
      if (commentPrompt) {
        const text = commentText.trim();
        if (text) {
          updateHighlightComment(commentPrompt.id, text);
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user && tabelaNome && artigo?.numero) {
              const currentHl = highlights.find((h) => h.id === commentPrompt.id);
              const anotacaoText = currentHl?.text ? `[Grifo]: "${currentHl.text}"\n${text}` : text;
              await supabase.from('artigos_anotacoes').insert({
                user_id: user.id,
                tabela_codigo: tabelaNome,
                numero_artigo: String(artigo.numero),
                artigo_id: `${tabelaNome}::${artigo.numero}`,
                anotacao: anotacaoText,
              });
              invalidateCache(anotacoesKey(tabelaNome, String(artigo.numero), user.id));
              setAnotacoesRefreshTick((t) => t + 1);
              setAnotacoesCount((c) => c + 1);
              toast.success('Anotação salva');
            } else {
              toast.success('Anotação salva localmente');
            }
          } catch (e) {
            console.warn('Erro ao sincronizar anotação com Supabase:', e);
            toast.success('Anotação salva localmente');
          }
        }
        updateHighlightTags(commentPrompt.id, commentTags);
      }
      cleanup();
    },
    [
      updateHighlightComment,
      updateHighlightTags,
      highlights,
      tabelaNome,
      artigo?.numero,
      setAnotacoesCount,
      setAnotacoesRefreshTick,
    ]
  );

  // Pre-load all cached AI content when artigo changes (Item 1: Protegido contra race conditions)
  useEffect(() => {
    const currentId = artigo?.id;
    activeArtigoIdRef.current = currentId ?? null;

    // Aborta requisições de IA anteriores em andamento
    if (activeAbortCtrlRef.current) {
      activeAbortCtrlRef.current.abort();
    }
    activeAbortCtrlRef.current = new AbortController();

    setAiContent({});
    setAiLoading({});
    setActiveTab('artigo');

    if (!artigo || !tabelaNome) return;

    const modes = ['explicacao', 'exemplo', 'termos'];
    (async () => {
      const { getLocalAiCache } = await import('@/lib/aiCacheLocal');
      if (activeArtigoIdRef.current !== currentId) return;
      const local: Record<string, string> = {};
      for (const m of modes) {
        const v = getLocalAiCache(tabelaNome, artigo.numero, m);
        if (v) local[m] = v;
      }
      if (activeArtigoIdRef.current === currentId && Object.keys(local).length) {
        setAiContent((prev) => ({ ...local, ...prev }));
      }
    })();

    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    supabase
      .from('artigo_ai_cache')
      .select('tipo, conteudo')
      .eq('tabela_codigo', tabelaNome)
      .eq('numero_artigo', artigo.numero)
      .in('tipo', modes)
      .then(({ data }) => {
        if (activeArtigoIdRef.current !== currentId) return;
        if (data && data.length > 0) {
          const cached: Record<string, string> = {};
          import('@/lib/aiCacheLocal').then(({ setLocalAiCache }) => {
            if (activeArtigoIdRef.current !== currentId) return;
            data.forEach((row: any) => {
              cached[row.tipo] = row.conteudo;
              setLocalAiCache(tabelaNome, artigo.numero, row.tipo, row.conteudo);
            });
            setAiContent((prev) => ({ ...prev, ...cached }));
          });
        }
      });

    return () => {
      if (activeAbortCtrlRef.current) {
        activeAbortCtrlRef.current.abort();
      }
    };
  }, [artigo?.id]);

  // Fetch AI content on activeTab (Item 1: Protegido contra race conditions)
  useEffect(() => {
    if (activeTab === 'artigo' || !artigo) return;
    if (!isPremium) return;
    if (aiContent[activeTab] || aiLoading[activeTab]) return;
    if (modificationInfo && activeTab !== 'explicacao') return;

    const currentId = artigo.id;
    const cacheKey = { tabela: tabelaNome || 'unknown', numero: artigo.numero, modo: activeTab };
    setAiLoading((prev) => ({ ...prev, [activeTab]: true }));

    import('@/lib/aiCacheLocal').then(({ getLocalAiCache, setLocalAiCache }) => {
      if (activeArtigoIdRef.current !== currentId) return;
      const localVal = getLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo);
      if (localVal) {
        if (activeArtigoIdRef.current === currentId) {
          setAiContent((prev) => ({ ...prev, [activeTab]: localVal }));
          setAiLoading((prev) => ({ ...prev, [activeTab]: false }));
        }
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (activeArtigoIdRef.current === currentId) {
          setAiContent((prev) => ({
            ...prev,
            [activeTab]: 'Sem internet — este conteúdo ainda não foi gerado. Conecte-se para gerar.',
          }));
          setAiLoading((prev) => ({ ...prev, [activeTab]: false }));
        }
        return;
      }

      supabase
        .from('artigo_ai_cache')
        .select('conteudo')
        .eq('tabela_codigo', cacheKey.tabela)
        .eq('numero_artigo', cacheKey.numero)
        .eq('tipo', cacheKey.modo)
        .maybeSingle()
        .then(({ data: cached }) => {
          if (activeArtigoIdRef.current !== currentId) return;
          if (cached?.conteudo) {
            setLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo, cached.conteudo as string);
            setAiContent((prev) => ({ ...prev, [activeTab]: cached.conteudo as string }));
            setAiLoading((prev) => ({ ...prev, [activeTab]: false }));
            return;
          }

          const mode = activeTab as 'explicacao' | 'exemplo';
          setAiGeneratingMode(mode);
          setAiGeneratingStep(0);

          // Item 5: Aborta requisição de IA anterior e associa novo controller
          activeAiAbortCtrlRef.current?.abort();
          const aiAbortCtrl = new AbortController();
          activeAiAbortCtrlRef.current = aiAbortCtrl;

          stepInterval = setInterval(() => {
            if (aiAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) {
              if (stepInterval) clearInterval(stepInterval);
              return;
            }
            setAiGeneratingStep((prev) => (prev < 2 ? prev + 1 : prev));
          }, 1800);

          supabase.functions
            .invoke('assistente-juridica', {
              body: {
                mode: activeTab,
                artigoTexto: artigo.caput,
                artigoNumero: artigo.numero,
                leiNome: tabelaNome || '',
              },
              // @ts-ignore
              signal: aiAbortCtrl.signal,
            })
            .then(({ data, error }) => {
              if (stepInterval) clearInterval(stepInterval);
              if (aiAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) return;
              if (!error && data?.reply) {
                setAiGeneratingStep(3);
                setAiContent((prev) => ({ ...prev, [activeTab]: data.reply }));
                setLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo, data.reply);
                supabase
                  .from('artigo_ai_cache')
                  .upsert(
                    {
                      tabela_codigo: cacheKey.tabela,
                      numero_artigo: cacheKey.numero,
                      tipo: cacheKey.modo,
                      conteudo: data.reply,
                    },
                    { onConflict: 'tabela_codigo,numero_artigo,tipo' }
                  )
                  .then(() => {});
              } else {
                setAiContent((prev) => ({
                  ...prev,
                  [activeTab]: 'Não foi possível gerar o conteúdo. Tente novamente.',
                }));
              }
              setAiLoading((prev) => ({ ...prev, [activeTab]: false }));
              setTimeout(() => {
                if (activeArtigoIdRef.current === currentId) {
                  setAiGeneratingMode(null);
                }
              }, 500);
            })
            .catch((err: any) => {
              if (stepInterval) clearInterval(stepInterval);
              if (aiAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) return;
              setAiLoading((prev) => ({ ...prev, [activeTab]: false }));
              setAiGeneratingMode(null);
            });
        });
    });

    return () => {
      activeAiAbortCtrlRef.current?.abort();
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [activeTab, artigo?.id]);

  // Fetch termos (Item 1 & Item 5: Protegido contra race conditions e com cancelamento via AbortController)
  useEffect(() => {
    if (!showTermosSheet || !artigo) return;
    if (aiContent.termos || aiLoading.termos) return;
    const currentId = artigo.id;
    const cacheKey = { tabela: tabelaNome || 'unknown', numero: artigo.numero };
    setAiLoading((prev) => ({ ...prev, termos: true }));
    let stepInterval: ReturnType<typeof setInterval> | null = null;

    import('@/lib/aiCacheLocal').then(({ getLocalAiCache, setLocalAiCache }) => {
      if (activeArtigoIdRef.current !== currentId) return;
      const localVal = getLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos');
      if (localVal) {
        if (activeArtigoIdRef.current === currentId) {
          setAiContent((prev) => ({ ...prev, termos: localVal }));
          setAiLoading((prev) => ({ ...prev, termos: false }));
        }
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (activeArtigoIdRef.current === currentId) {
          setAiContent((prev) => ({ ...prev, termos: 'Sem internet — termos ainda não gerados.' }));
          setAiLoading((prev) => ({ ...prev, termos: false }));
        }
        return;
      }
      supabase
        .from('artigo_ai_cache')
        .select('conteudo')
        .eq('tabela_codigo', cacheKey.tabela)
        .eq('numero_artigo', cacheKey.numero)
        .eq('tipo', 'termos')
        .maybeSingle()
        .then(({ data: cached }) => {
          if (activeArtigoIdRef.current !== currentId) return;
          if (cached?.conteudo) {
            setLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos', cached.conteudo as string);
            setAiContent((prev) => ({ ...prev, termos: cached.conteudo as string }));
            setAiLoading((prev) => ({ ...prev, termos: false }));
            return;
          }
          setAiGeneratingMode('termos');
          setAiGeneratingStep(0);

          // Item 5: Aborta chamada de termos anterior e associa novo controller
          activeTermosAbortCtrlRef.current?.abort();
          const termosAbortCtrl = new AbortController();
          activeTermosAbortCtrlRef.current = termosAbortCtrl;

          stepInterval = setInterval(() => {
            if (termosAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) {
              if (stepInterval) clearInterval(stepInterval);
              return;
            }
            setAiGeneratingStep((prev) => (prev < 2 ? prev + 1 : prev));
          }, 1800);

          supabase.functions
            .invoke('assistente-juridica', {
              body: {
                mode: 'termos',
                artigoTexto: artigo.caput,
                artigoNumero: artigo.numero,
                leiNome: tabelaNome || '',
              },
              // @ts-ignore
              signal: termosAbortCtrl.signal,
            })
            .then(({ data, error }) => {
              if (stepInterval) clearInterval(stepInterval);
              if (termosAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) return;
              if (!error && data?.reply) {
                setAiGeneratingStep(3);
                setAiContent((prev) => ({ ...prev, termos: data.reply }));
                setLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos', data.reply);
                supabase
                  .from('artigo_ai_cache')
                  .upsert(
                    {
                      tabela_codigo: cacheKey.tabela,
                      numero_artigo: cacheKey.numero,
                      tipo: 'termos',
                      conteudo: data.reply,
                    },
                    { onConflict: 'tabela_codigo,numero_artigo,tipo' }
                  )
                  .then(() => {});
              } else {
                setAiContent((prev) => ({
                  ...prev,
                  termos: 'Não foi possível gerar os termos. Tente novamente.',
                }));
              }
              setAiLoading((prev) => ({ ...prev, termos: false }));
              setTimeout(() => {
                if (activeArtigoIdRef.current === currentId) {
                  setAiGeneratingMode(null);
                }
              }, 500);
            })
            .catch((err: any) => {
              if (stepInterval) clearInterval(stepInterval);
              if (termosAbortCtrl.signal.aborted || activeArtigoIdRef.current !== currentId) return;
              setAiLoading((prev) => ({ ...prev, termos: false }));
              setAiGeneratingMode(null);
            });
        });
    });

    return () => {
      activeTermosAbortCtrlRef.current?.abort();
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [showTermosSheet, artigo?.id]);

  return {
    isGeneratingAiNote,
    handleGerarAnotacaoIa,
    handleSaveComment,
    aiContent,
    aiLoading,
    aiGeneratingMode,
    aiGeneratingStep,
    splitSections,
  };
}
