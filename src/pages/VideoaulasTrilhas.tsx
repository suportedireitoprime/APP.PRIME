import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useTrilhaStore } from '@/lib/trilhasStore';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';
import { loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';

import {
  SetupEdital,
  SetupRitmo,
  TrilhaMap,
  TrilhasDashboard,
} from '@/components/videoaulas/trilhas';

const VideoaulasTrilhas = () => {
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState<ConcursoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { trilhaAtiva, setTrilhaAtiva } = useTrilhaStore();
  const { trilhasAtivas } = useAreaTrilhaStore();

  const hasAnyTrail = !!trilhaAtiva || Object.keys(trilhasAtivas).length > 0;

  // Estados de navegação local
  const [view, setView] = useState<'dashboard' | 'setup_edital' | 'setup_ritmo' | 'mapa'>(
    hasAnyTrail ? 'dashboard' : 'setup_edital',
  );

  const [selectedEdital, setSelectedEdital] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadConcursos().then((c) => {
      if (!alive) return;
      setConcursos(c.filter((x) => x.disciplinas?.length > 0)); // Apenas concursos com disciplinas
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PageHeader
        title="Trilhas"
        subtitle="Cronogramas Inteligentes"
        onBack={() => {
          if (view === 'setup_edital' && hasAnyTrail) {
            setView('dashboard');
          } else {
            navigate(-1);
          }
        }}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TrilhasDashboard
                concursos={concursos}
                onCreateNova={() => setView('setup_edital')}
                onOpenEdital={() => setView('mapa')}
              />
            </motion.div>
          )}

          {view === 'setup_edital' && (
            <SetupEdital
              key="edital"
              concursos={concursos}
              onSelect={(id) => {
                setSelectedEdital(id);
                setView('setup_ritmo');
              }}
            />
          )}

          {view === 'setup_ritmo' && (
            <SetupRitmo
              key="ritmo"
              editalId={selectedEdital!}
              concursos={concursos}
              onBack={() => setView('setup_edital')}
              onFinish={(dias) => {
                setTrilhaAtiva({
                  editalId: selectedEdital!,
                  diasMeta: dias,
                  diasConcluidos: [],
                  dataInicio: new Date().toISOString(),
                });
                setView('mapa');
              }}
            />
          )}

          {view === 'mapa' && trilhaAtiva && (
            <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TrilhaMap
                concursos={concursos}
                onBack={() => setView('dashboard')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasTrilhas;
