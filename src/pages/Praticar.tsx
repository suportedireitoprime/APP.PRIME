import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Loader2, Target, Layers, FileQuestion, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import PraticarHeroPanel from '@/components/praticar/PraticarHeroPanel';
import { agruparPorArea, getPraticarAreaCover, LeiSimples } from '@/lib/praticarAreas';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';

const PRATICAR_FUNCTIONS = [
  {
    id: 'flashcards',
    title: 'Flashcards',
    subtitle: 'Revisão ativa',
    icon: Layers,
    color: '#3b82f6', // blue
    image: '/assets/praticar-flashcards.webp',
    path: '/flashcards',
  },
  {
    id: 'questoes',
    title: 'Questões',
    subtitle: 'Teste de fixação',
    icon: FileQuestion,
    color: '#10b981', // emerald
    image: '/assets/praticar-questoes.webp',
    path: '/questoes',
  },
  {
    id: 'simulados',
    title: 'Simulados',
    subtitle: 'Treino real',
    icon: Timer,
    color: '#8b5cf6', // violet
    image: '/assets/praticar-simulados.webp',
    path: '/simulados',
  },
  {
    id: 'leiseca',
    title: 'Lei Seca',
    subtitle: 'Tiro ao alvo',
    icon: Target,
    color: '#f43f5e', // rose
    image: '/assets/praticar-leiseca.webp',
    path: '#leiseca',
  }
];

export default function Praticar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = isAdminEmail(user?.email);
  const [leis, setLeis] = useState<LeiSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vade_mecum_leis')
        .select('id, nome, slug')
        .order('nome', { ascending: true })
        .limit(500);
      setLeis((data as LeiSimples[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return leis;
    return leis.filter((l) => l.nome.toLowerCase().includes(term));
  }, [leis, q]);

  const grupos = useMemo(() => agruparPorArea(filtradas), [filtradas]);

  if (!allowed) return <Navigate to="/" replace />;

  const header = (
    <PageHeader
      title="Praticar"
      subtitle="Tiro ao alvo na lei seca"
      onBack={() => navigate('/')}
    />
  );

  return (
    <DesktopPageLayout wide activeId="praticar" title="Praticar" subtitle="Tiro ao alvo na lei seca" mobileHeader={header}>
      <PraticarHeroPanel
        totalLeis={leis.length}
        artigosDominados={0}
        streakDias={0}
        onPraticarAleatorio={() => {
          const l = leis[Math.floor(Math.random() * leis.length)];
          if (l) navigate(`/praticar/${l.slug ?? l.id}/sessao`);
        }}
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Funções Principais (Cards) */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {PRATICAR_FUNCTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic.selection();
                if (item.path.startsWith('#')) {
                  const el = document.getElementById(item.path.replace('#', ''));
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  navigate(item.path);
                }
              }}
              className="relative flex flex-col shadow-md rounded-2xl group transition-all duration-300 w-full h-[116px] sm:h-[122px] text-left cursor-pointer overflow-hidden focus-visible:outline-none hover:-translate-y-1"
            >
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 shadow-md group-hover:opacity-100 opacity-95"
                style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${shade(item.color, -0.3)} 100%)` }}
              >
                <item.icon
                  className="absolute -right-2 -bottom-2 w-20 h-20 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                  strokeWidth={1.3}
                />
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
              </div>

              {item.image && (
                <div className="absolute right-0 w-auto h-[105px] max-w-none pointer-events-none z-10 transition-all duration-300 origin-bottom group-hover:scale-[1.06] -top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:-top-5 group-hover:drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-auto object-contain"
                  />
                </div>
              )}

              <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                <div className="flex justify-between items-start">
                  <item.icon
                    className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                    strokeWidth={1.8}
                  />
                </div>
                
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col">
                    <span className="font-display text-white text-[16px] sm:text-[18px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none">
                      {item.title}
                    </span>
                    <span className="text-white/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar lei ou código..."
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-red-500/60"
          />
        </div>

        {/* Se pesquisando: mostra leis diretas */}
        {q.trim() ? (
          <div className="space-y-2">
            {filtradas.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/praticar/${l.slug ?? l.id}`)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-red-500/50 transition-all group text-left"
              >
                <Target className="w-5 h-5 text-red-500 shrink-0" />
                <p className="flex-1 font-medium text-foreground group-hover:text-red-500 transition-colors">
                  {l.nome}
                </p>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))}
            {filtradas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nada encontrado.
              </p>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <h2 id="leiseca" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pt-3 border-t border-border/50">
              Por área do direito
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {grupos.map((g, i) => {
                const cover = getPraticarAreaCover(g.area);
                return (
                  <motion.button
                    key={g.area.slug}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.03 }}
                    onClick={() => navigate(`/praticar/area/${g.area.slug}`)}
                    className="relative overflow-hidden rounded-2xl aspect-[4/5] border border-border text-left group"
                    style={{ background: g.area.tint }}
                  >
                    {cover && (
                      <img
                        src={cover}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-55 transition-opacity"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-end">
                      <h3 className="font-display text-sm font-black text-white leading-tight drop-shadow-md">
                        {g.area.nome}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-medium text-white/85">
                        {g.leis.length} {g.leis.length === 1 ? 'lei' : 'leis'}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                        <div className="h-full rounded-full bg-white/90" style={{ width: '0%' }} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DesktopPageLayout>
  );
}
