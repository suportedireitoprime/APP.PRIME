import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoBack } from '@/hooks/useGoBack';

import {
  View,
  TITLE_FOR_VIEW,
  AnotacoesAudioHub,
  AnotacoesAudioGravar,
  AnotacoesAudioImportar,
  AnotacoesAudioLista,
} from '@/components/anotacoesAudio/chunks';

export default function AnotacoesAudio() {
  const goBack = useGoBack();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as View) || 'hub';
  const [view, setView] = useState<View>(initialView);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const goto = (v: View) => {
    setView(v);
    setSearchParams(v === 'hub' ? {} : { view: v });
  };

  const back = () => (view === 'hub' ? goBack() : goto('hub'));

  // Desktop drag-and-drop: quando um áudio é solto na janela, cai aqui.
  useEffect(() => {
    const onDrop = (e: Event) => {
      const detail = (e as CustomEvent).detail as { file: File; target: string } | undefined;
      if (!detail || detail.target !== 'audio') return;
      setDroppedFile(detail.file);
      goto('celular');
      toast.success('Áudio pronto pra transcrever', { description: detail.file.name });
    };
    window.addEventListener('desktop:file-drop', onDrop);
    return () => window.removeEventListener('desktop:file-drop', onDrop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={TITLE_FOR_VIEW[view] || 'Gravar aula'} onBack={back} />
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-[calc(7rem+var(--sai-bottom))] lg:max-w-[1200px] lg:px-12 lg:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {view === 'hub' && <AnotacoesAudioHub goto={goto} />}
            {view === 'gravar' && <AnotacoesAudioGravar onDone={() => goto('lista')} />}
            {view === 'lista' && <AnotacoesAudioLista />}
            {view === 'resumo' && <AnotacoesAudioLista soPendentes />}
            {view === 'celular' && (
              <AnotacoesAudioImportar
                source="celular"
                onDone={() => goto('lista')}
                initialFile={droppedFile}
                onInitialConsumed={() => setDroppedFile(null)}
              />
            )}
            {view === 'whatsapp' && (
              <AnotacoesAudioImportar source="whatsapp" onDone={() => goto('lista')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
