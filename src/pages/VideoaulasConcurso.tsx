import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { ChevronRight, Folder } from 'lucide-react';
import { loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';
import { slugify } from '@/lib/videoaulasCatalogos';
import { haptic } from '@/lib/nativeHaptics';

const VideoaulasConcurso = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [concurso, setConcurso] = useState<ConcursoRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadConcursos().then((concursos) => {
      if (!alive) return;
      const found = concursos.find((c) => c.id === id);
      setConcurso(found || null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Carregando edital...</p>
      </div>
    );
  }

  if (!concurso) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Concurso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <PageHeader
        title={concurso.titulo}
        subtitle={`${concurso.disciplinas?.length || 0} disciplinas`}
        onBack={() => navigate('/videoaulas/categorias')}
      />

      <div className="mx-auto max-w-md px-4 pt-6 space-y-4">
        {/* Cover Image & Info */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
          <div className="h-40 w-full relative">
            <img 
              src={concurso.capa} 
              alt={concurso.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="bg-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mb-2 inline-block">
                {concurso.grupo === 'policial' ? 'Carreiras Policiais' : 'Tribunais'}
              </span>
              <p className="text-xs text-white/90 line-clamp-2">{concurso.descricao}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Folder className="h-4 w-4 text-primary" />
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            Disciplinas do Edital
          </h2>
        </div>

        {/* Disciplinas List */}
        <div className="space-y-2 pb-8">
          {concurso.disciplinas?.map((disciplina, i) => (
            <button
              key={`${disciplina}-${i}`}
              onClick={() => {
                haptic.selection();
                navigate(`/videoaulas/areas/${slugify(disciplina)}`);
              }}
              className="group flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-foreground">
                    {disciplina}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Acessar videoaulas mapeadas
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          ))}
          {(!concurso.disciplinas || concurso.disciplinas.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma disciplina mapeada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasConcurso;
