import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LayoutGrid, Play, Video, ShieldAlert, Scale, GraduationCap, BookOpen, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { CATALOGOS } from '@/lib/videoaulasCatalogos';
import {
  carregarResumoVideoaulas,
  RESUMO_VAZIO,
  type ResumoVideoaulas,
} from '@/lib/videoaulasResumo';
import { haptic } from '@/lib/nativeHaptics';
import { prefetchCatalogo, loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';

const GridSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="mb-8">
    <div className="mb-3 px-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
    </div>
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
      }}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 px-4"
    >
      {children}
    </motion.div>
  </div>
);

const VideoaulasCategorias = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResumoVideoaulas>(RESUMO_VAZIO);
  const [concursos, setConcursos] = useState<ConcursoRow[]>([]);

  useEffect(() => {
    let alive = true;
    carregarResumoVideoaulas().then((r) => alive && setData(r));
    loadConcursos().then((c) => alive && setConcursos(c));
    return () => {
      alive = false;
    };
  }, []);

  const policiais = concursos.filter(c => c.grupo === 'policial');
  const tribunais = concursos.filter(c => c.grupo === 'tribunais');
  const magistratura = concursos.filter(c => c.grupo === 'magistratura');

  const jornadasPadrao = CATALOGOS.filter(c => !c.id.startsWith('oab'));
  const oabList = CATALOGOS.filter(c => c.id.startsWith('oab'));

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Categorias"
        subtitle="Escolha por onde estudar"
      />

      <div className="w-full pb-32 pt-4">
        
        {/* Jornadas Padrão (CATALOGOS) */}
        <GridSection title="Jornadas Padrão" icon={GraduationCap}>
          {jornadasPadrao.map((c) => {
            const info = data.porCatalogo[c.id];
            return (
              <button
                key={c.id}
                onPointerDown={() => prefetchCatalogo(c.id)}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${c.id}`);
                }}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
              >
                <div className="relative w-full h-[85px] sm:h-[100px] overflow-hidden bg-black/10">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<Play className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full border border-white/25 bg-black/40 p-3 backdrop-blur-sm transition-transform scale-90 group-hover:scale-100">
                      <Play className="h-6 w-6 fill-current text-primary-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-3">
                  <h3 className="truncate text-[13px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground flex-1">
                    {c.descricao}
                  </p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Video className="h-3.5 w-3.5" />
                      {info?.total ? `${info.total.toLocaleString('pt-BR')} aulas` : '—'}
                    </span>
                    {info?.concluidas ? <span className="text-[10px] text-muted-foreground font-medium">{info.pct}% assistido</span> : null}
                  </div>
                  
                  {info?.total ? (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--aprender-accent))]"
                        style={{ width: `${info.pct}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </GridSection>

        {/* Exame da OAB */}
        <GridSection title="Exame da OAB" icon={BookOpen}>
          {oabList.map((c) => {
            const info = data.porCatalogo[c.id];
            return (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                key={c.id}
                onPointerDown={() => prefetchCatalogo(c.id)}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/${c.id}`);
                }}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
              >
                <div className="relative w-full h-[85px] sm:h-[100px] overflow-hidden bg-black/10">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<Play className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full border border-white/25 bg-black/40 p-3 backdrop-blur-sm transition-transform scale-90 group-hover:scale-100">
                      <Play className="h-6 w-6 fill-current text-primary-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-3">
                  <h3 className="truncate text-[13px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground flex-1">
                    {c.descricao}
                  </p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Video className="h-3.5 w-3.5" />
                      {info?.total ? `${info.total.toLocaleString('pt-BR')} aulas` : '—'}
                    </span>
                    {info?.concluidas ? <span className="text-[10px] text-muted-foreground font-medium">{info.pct}% assistido</span> : null}
                  </div>
                  
                  {info?.total ? (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--aprender-accent))]"
                        style={{ width: `${info.pct}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </GridSection>

        {/* Carreiras Policiais */}
        {policiais.length > 0 && (
          <GridSection title="Carreiras Policiais" icon={ShieldAlert}>
            {policiais.map((c) => (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                key={c.id}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/concurso/${c.id}`);
                }}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
              >
                <div className="relative w-full h-[85px] sm:h-[100px] overflow-hidden bg-black/10">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<ShieldAlert className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Edital
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-3">
                  <h3 className="truncate text-[13px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground flex-1">
                    {c.descricao}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-[10px] font-semibold">{c.disciplinas?.length || 0} Disciplinas</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            ))}
          </GridSection>
        )}

        {/* Tribunais */}
        {tribunais.length > 0 && (
          <GridSection title="Tribunais & TJs" icon={Scale}>
            {tribunais.map((c) => (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                key={c.id}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/concurso/${c.id}`);
                }}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
              >
                <div className="relative w-full h-[85px] sm:h-[100px] overflow-hidden bg-black/10">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<Scale className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Edital
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-3">
                  <h3 className="truncate text-[13px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground flex-1">
                    {c.descricao}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-[10px] font-semibold">{c.disciplinas?.length || 0} Disciplinas</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            ))}
          </GridSection>
        )}

        {/* Magistratura */}
        {magistratura.length > 0 && (
          <GridSection title="Magistratura" icon={Briefcase}>
            {magistratura.map((c) => (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                key={c.id}
                onClick={() => {
                  haptic.selection();
                  navigate(`/videoaulas/concurso/${c.id}`);
                }}
                className="group flex flex-col w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/50 active:scale-[0.98]"
              >
                <div className="relative w-full h-[85px] sm:h-[100px] overflow-hidden bg-black/10">
                  <ThumbImg
                    src={c.capa}
                    alt={c.titulo}
                    fallback={<Briefcase className="h-8 w-8 text-primary/40" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Magistratura
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-3">
                  <h3 className="truncate text-[13px] font-bold leading-tight">{c.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground flex-1">
                    {c.descricao}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-[10px] font-semibold">{c.disciplinas?.length || 0} Disciplinas</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            ))}
          </GridSection>
        )}

      </div>
      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasCategorias;
