import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Video } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { CATALOGOS, limparTitulo, slugify, ytThumb } from '@/lib/videoaulasCatalogos';
import { loadFavoritos, loadProgresso } from '@/lib/videoaulasStore';
import { useGoBack } from '@/hooks/useGoBack';

type Filtro = 'andamento' | 'favoritas';

type Item = {
  video_id: string;
  tabela: string;
  titulo?: string | null;
  area?: string | null;
  thumb?: string | null;
  percentual?: number | null;
  concluida?: boolean | null;
};

function rotaDaAula(r: Item) {
  const cat = CATALOGOS.find((c) => c.tabela === r.tabela) ?? CATALOGOS[0];
  const area = cat.temAreas ? slugify(r.area || 'Outros') : 'todas';
  return `/videoaulas/${cat.id}/${area}/${r.video_id}`;
}

/** Lista das videoaulas do usuário: em andamento e favoritas. */
export default function MinhasVideoaulas() {
  const navigate = useNavigate();
  const voltar = useGoBack('/inicio');
  const [filtro, setFiltro] = useState<Filtro>('andamento');
  const [progresso, setProgresso] = useState<Item[]>([]);
  const [favoritos, setFavoritos] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      const [prog, favs] = await Promise.all([loadProgresso(), loadFavoritos()]);
      if (!ativo) return;
      setProgresso(prog as unknown as Item[]);
      setFavoritos(favs as unknown as Item[]);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const itens = useMemo(
    () => (filtro === 'favoritas' ? favoritos : progresso.slice(0, 80)),
    [filtro, favoritos, progresso],
  );

  const abas: { id: Filtro; label: string }[] = [
    { id: 'andamento', label: 'Em andamento' },
    { id: 'favoritas', label: 'Favoritas' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Minhas videoaulas"
        subtitle={carregando ? 'Carregando…' : `${itens.length} ${itens.length === 1 ? 'aula' : 'aulas'}`}
        onBack={voltar}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <div className="flex gap-2">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setFiltro(a.id)}
              className={`h-11 px-4 rounded-xl border text-[13px] font-semibold transition ${
                filtro === a.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/60'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {!carregando && itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <Video className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {filtro === 'favoritas'
                ? 'Você ainda não favoritou videoaulas.'
                : 'Nenhuma videoaula em andamento. Comece uma aula para ela aparecer aqui.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {itens.map((r, i) => (
              <motion.li
                key={`${r.tabela}-${r.video_id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.24) }}
              >
                <button
                  onClick={() => navigate(rotaDaAula(r))}
                  className="w-full flex gap-3 items-center rounded-2xl border border-border/60 bg-card p-3 text-left active:scale-[0.99] transition"
                >
                  <div className="relative w-[112px] shrink-0 aspect-video rounded-xl overflow-hidden bg-muted">
                    <img
                      src={r.thumb || ytThumb(r.video_id)}
                      alt={`Capa da aula ${limparTitulo(r.titulo || 'videoaula')}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      {filtro === 'favoritas' ? (
                        <Star className="h-5 w-5 text-primary fill-current" />
                      ) : (
                        <Play className="h-5 w-5 text-primary-foreground fill-current" />
                      )}
                    </span>
                    {typeof r.percentual === 'number' && r.percentual > 0 && (
                      <span
                        className="absolute bottom-0 left-0 h-1 bg-primary"
                        style={{ width: `${Math.min(100, r.percentual)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-foreground text-[15px] font-bold leading-tight line-clamp-2">
                      {limparTitulo(r.titulo || 'Videoaula')}
                    </p>
                    {r.area && (
                      <p className="font-body text-muted-foreground text-[12px] truncate mt-0.5">
                        {r.area}
                      </p>
                    )}
                    {typeof r.percentual === 'number' && r.percentual > 0 && (
                      <p className="font-body text-primary text-[12px] mt-0.5">
                        {r.concluida ? 'Concluída' : `${Math.min(100, r.percentual)}% assistido`}
                      </p>
                    )}
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
