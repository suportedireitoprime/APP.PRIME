import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useCategoriaTrilhaStore } from '@/lib/categoriaTrilhaStore';
import { getCatalogo } from '@/lib/videoaulasCatalogos';
import { loadCatalogo, getCachedCatalogo, loadProgresso, getCachedProgresso } from '@/lib/videoaulasStore';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';

import {
  CatalogoAula,
  CatalogoTrilhaSetupRitmo,
  CatalogoTrilhaMap,
} from '@/components/videoaulas/catalogoTrilha';

const VideoaulasCatalogoTrilha = () => {
  const navigate = useNavigate();
  const { catalogo: catalogoIdParam } = useParams();
  const catalogo = getCatalogo(catalogoIdParam);

  const [aulas, setAulas] = useState<CatalogoAula[]>([]);
  const [loading, setLoading] = useState(true);

  const { trilhasAtivas, setCategoriaTrilhaAtiva } = useCategoriaTrilhaStore();

  useEffect(() => {
    if (!catalogo) {
      setLoading(false);
      return;
    }
    let alive = true;

    (async () => {
      const cacheAulas = getCachedCatalogo(catalogo.id) as CatalogoAula[] | null;
      let aulasTemp = cacheAulas || [];
      if (aulasTemp.length > 0) {
        setAulas(aulasTemp);
        setLoading(false);
      }

      const rows = await loadCatalogo(catalogo.id);
      if (!alive) return;
      aulasTemp = rows as CatalogoAula[];

      const prog = getCachedProgresso() ?? (await loadProgresso());
      if (!alive) return;

      const progMap = new Map(prog.filter((p) => p.tabela === catalogo.tabela).map((p) => [p.video_id, p]));

      const aulasComProgresso = aulasTemp.map((a) => {
        const p = progMap.get(a.video_id);
        return {
          ...a,
          percentual: p?.percentual,
          concluida: p?.concluida,
        };
      });

      setAulas(aulasComProgresso);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [catalogo]);

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <PageHeader title="Erro" onBack={() => navigate('/videoaulas/categorias')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Catálogo não encontrado.</p>
        </div>
      </div>
    );
  }

  const hasTrilha = !!trilhasAtivas[catalogo.id];

  return (
    <div className="relative min-h-screen bg-[#0A0A0A]">
      <div className="relative z-10">
        <PageHeader
          title={catalogo.titulo}
          subtitle="Trilha Inteligente"
          onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!hasTrilha ? (
              <CatalogoTrilhaSetupRitmo
                key="ritmo"
                catalogoId={catalogo.id}
                titulo={catalogo.titulo}
                onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
                onFinish={(dias) => {
                  setCategoriaTrilhaAtiva(catalogo.id, {
                    catalogoId: catalogo.id,
                    diasMeta: dias,
                    diasConcluidos: [],
                    dataInicio: new Date().toISOString(),
                  });
                }}
              />
            ) : (
              <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CatalogoTrilhaMap
                  catalogoId={catalogo.id}
                  titulo={catalogo.titulo}
                  aulas={aulas}
                  onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasCatalogoTrilha;
