import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Scale,
  GraduationCap,
  ListChecks,
  Layers,
  Library,
  Bird,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';

import DesktopRadarLeisCarousel from '@/components/vademecum/desktop/DesktopRadarLeisCarousel';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import DesktopEstudosGrid from '@/components/desktop/DesktopEstudosGrid';
import NoticiasJuridicasCarousel from '@/components/vademecum/blog/NoticiasJuridicasCarousel';
const HomeAnimacoesCarousel = lazyWithRetry(() => import('@/components/animacoes/HomeAnimacoesCarousel'));

import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente, getRecentes, type LeiRecente } from '@/lib/leisRecentes';
import { warmCoverCache } from '@/lib/coverLoader';
import { useHomeWarmup } from '@/hooks/useHomeWarmup';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import heroImageAsset from '@/assets/hero-vademecum.webp';

const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlay'));

const QUICK_ACCESS = [
  {
    id: 'vademecum',
    label: 'Vade Mecum',
    desc: 'Constituição, Códigos e Leis atualizadas',
    icon: Scale,
    route: '/vade-mecum',
  },
  {
    id: 'aulas',
    label: 'Aulas em Trilha',
    desc: 'Estudo guiado por etapas e progresso',
    icon: GraduationCap,
    route: '/aulas',
  },
  {
    id: 'questoes',
    label: 'Questões Comentadas',
    desc: 'Pratique por disciplina e banca',
    icon: ListChecks,
    route: '/questoes',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    desc: 'Memorização ativa e revisão espaçada',
    icon: Layers,
    route: '/flashcards',
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    desc: 'Livros, doutrina e obras clássicas',
    icon: Library,
    route: '/bibliotecas',
  },
  {
    id: 'horus',
    label: 'Assistente Hórus',
    desc: 'Tire dúvidas jurídicas com IA',
    icon: Bird,
    route: null,
  },
] as const;

const ESSENTIAL_LAWS = [
  {
    tipo: 'constituicao',
    leiId: 'cf-88',
    nome: 'Constituição Federal',
    descricao: 'CRFB/1988 — Texto constitucional atualizado',
    tabela_nome: 'CF88',
  },
  {
    tipo: 'codigo',
    leiId: 'codigo-civil',
    nome: 'Código Civil',
    descricao: 'Lei nº 10.406/2002',
    tabela_nome: 'CC_2002',
  },
  {
    tipo: 'codigo',
    leiId: 'codigo-penal',
    nome: 'Código Penal',
    descricao: 'Decreto-Lei nº 2.848/1940',
    tabela_nome: 'CP_1940',
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const IndexDesktop = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profileSummary } = useProfileSummary();

  const [searchOpen, setSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [recentes, setRecentes] = useState<LeiRecente[]>(() => getRecentes().slice(0, 3));

  useEffect(() => {
    warmCoverCache();
    const onRecentesUpdated = () => setRecentes(getRecentes().slice(0, 3));
    window.addEventListener('recentes-updated', onRecentesUpdated);
    return () => window.removeEventListener('recentes-updated', onRecentesUpdated);
  }, []);

  useHomeWarmup([heroImageAsset], queryClient, true);

  const handleSearchSelectLei = useCallback(
    (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
      pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
      const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
      const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
      navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
    },
    [navigate]
  );

  const firstName = useMemo(() => {
    const full = profileSummary?.displayName || user?.email?.split('@')[0] || '';
    return full.trim().split(' ')[0];
  }, [profileSummary?.displayName, user?.email]);

  const greeting = useMemo(() => getGreeting(), []);

  const continueItems = recentes.length > 0 ? recentes : ESSENTIAL_LAWS;

  return (
    <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-8 space-y-10">
      <DesktopOnboardingOverlay />

      {/* 1. Cabeçalho Minimalista + Ações */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-white/[0.06]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
            Direito Prime · Workspace
          </p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Acesse códigos, aulas, questões e jurisprudência em segundos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm text-zinc-300 flex items-center gap-2.5 transition-colors"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span>Buscar na legislação e acervo</span>
          </button>

          <button
            type="button"
            onClick={() => setAssistenteOpen(true)}
            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Bird className="w-4 h-4" />
            <span>Hórus IA</span>
          </button>
        </div>
      </section>

      {/* 2. Continuar de onde parou / Leis Essenciais */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {recentes.length > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Continuar de onde parou</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span>Leis essenciais</span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate('/vade-mecum')}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Abrir Vade Mecum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {continueItems.map((item) => {
            const slug = leiToSlug({ id: item.leiId, nome: item.nome });
            const url = `/legislacao/${tipoToSlug(item.tipo)}/${slug}`;
            return (
              <button
                key={item.leiId}
                type="button"
                onClick={() => {
                  pushRecente({
                    tipo: item.tipo,
                    leiId: item.leiId,
                    nome: item.nome,
                    descricao: item.descricao,
                    tabela_nome: item.tabela_nome,
                  });
                  navigate(url);
                }}
                className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.16] hover:bg-[#151519] text-left transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-rose-300 transition-colors">
                    {item.nome}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {item.descricao || item.tipo}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Acesso Rápido Principal */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-3.5">
          Acesso rápido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.route) {
                    navigate(item.route);
                  } else {
                    setAssistenteOpen(true);
                  }
                }}
                className="group flex items-start gap-3.5 p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.16] hover:bg-[#151519] text-left transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-rose-500/30 group-hover:bg-rose-500/10 transition-colors">
                  <Icon className="w-4 h-4 text-zinc-300 group-hover:text-rose-400 transition-colors" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Radar Legislativo, Notícias Jurídicas & Animações */}
      <div className="space-y-8">
        <DesktopRadarLeisCarousel />
        <NoticiasJuridicasCarousel />
        <Suspense fallback={null}>
          <HomeAnimacoesCarousel />
        </Suspense>
      </div>

      {/* 5. Catálogo Completo de Estudos & Prática */}
      <DesktopEstudosGrid
        onChatClick={() => setAssistenteOpen(true)}
        onFerramentasClick={() => navigate('/ferramentas')}
      />

      {/* Overlays */}
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectLei={handleSearchSelectLei}
          />
        </Suspense>
      )}

      {assistenteOpen && (
        <Suspense fallback={null}>
          <AssistenteOverlay
            open={assistenteOpen}
            onClose={() => setAssistenteOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default IndexDesktop;
