import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Scale,
  CheckCircle2,
  Clock,
  Gavel,
  Users,
  FileText,
  ExternalLink,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Landmark,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import { useIsDesktop } from '@/hooks/use-desktop';
import {
  fetchUltimasProposicoesCamara,
  fetchEmendasRecentes,
  fetchProposicoesProximasLei,
  fetchProposicoesSenado,
  fetchDeputados,
  fetchSenadores,
  fetchProposicoesDoDeputado,
  fetchProposicoesDoSenador,
  fetchProposicaoTramitacoes,
  type RadarProposicao,
  type RadarTriagemStage,
  type RadarAutor,
} from '@/services/radarService';

const TRIAGEM_CONFIG: Record<
  RadarTriagemStage,
  { label: string; shortLabel: string; desc: string; badgeClass: string; icon: typeof Gavel }
> = {
  sanction_veto: {
    label: 'Aguardando Sanção / Veto',
    shortLabel: 'Sanção / Veto',
    desc: 'Aprovadas no Congresso, dependendo apenas da decisão presidencial',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Gavel,
  },
  approved_house: {
    label: 'Aprovado na Casa',
    shortLabel: 'Aprovadas',
    desc: 'Avançaram em plenário ou comissões e seguem para a etapa final',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'Em Tramitação',
    shortLabel: 'Em Análise',
    desc: 'Projetos e emendas recentes em discussão nas comissões',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: Clock,
  },
};

function AutorAvatar({ autor, size = 'md' }: { autor?: RadarAutor; size?: 'sm' | 'md' | 'lg' }) {
  const [imgErr, setImgErr] = useState(false);
  const dim =
    size === 'lg' ? 'w-14 h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-xs';
  const initials = (autor?.nome || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  if (autor?.foto_url && !imgErr) {
    return (
      <img
        src={autor.foto_url}
        alt={autor.nome}
        loading="lazy"
        decoding="async"
        onError={() => setImgErr(true)}
        className={`${dim} rounded-full object-cover border border-white/15 bg-zinc-800 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function Radar360() {
  const goBack = useGoBack();
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');

  // Dados principais
  const [ultimasCamara, setUltimasCamara] = useState<RadarProposicao[]>([]);
  const [emendas, setEmendas] = useState<RadarProposicao[]>([]);
  const [proximasLei, setProximasLei] = useState<RadarProposicao[]>([]);
  const [senadoProps, setSenadoProps] = useState<RadarProposicao[]>([]);
  const [deputados, setDeputados] = useState<any[]>([]);
  const [senadores, setSenadores] = useState<any[]>([]);

  // Filtros de seção
  const [triagemAtiva, setTriagemAtiva] = useState<RadarTriagemStage>('sanction_veto');
  const [tipoAlta, setTipoAlta] = useState<'TODAS' | 'PL' | 'PEC' | 'PLP' | 'EMD' | 'SENADO'>('TODAS');
  const [casaParlamentar, setCasaParlamentar] = useState<'camara' | 'senado'>('camara');

  // Modais
  const [propSelecionada, setPropSelecionada] = useState<RadarProposicao | null>(null);
  const [tramitacoes, setTramitacoes] = useState<any[]>([]);
  const [loadingTram, setLoadingTram] = useState(false);

  const [parlamentarSelecionado, setParlamentarSelecionado] = useState<{
    id: string | number;
    nome: string;
    partido?: string;
    uf?: string;
    foto_url?: string;
    casa: 'camara' | 'senado';
  } | null>(null);
  const [propsParlamentar, setPropsParlamentar] = useState<RadarProposicao[]>([]);
  const [loadingParlamentar, setLoadingParlamentar] = useState(false);

  const carregarTudo = async () => {
    try {
      const [cam, emd, prox, sen, deps, sens] = await Promise.all([
        fetchUltimasProposicoesCamara({ itens: 12 }),
        fetchEmendasRecentes(8),
        fetchProposicoesProximasLei(),
        fetchProposicoesSenado(10),
        fetchDeputados(),
        fetchSenadores(),
      ]);

      setUltimasCamara(cam);
      setEmendas(emd);
      setProximasLei(prox);
      setSenadoProps(sen);
      setDeputados(deps.slice(0, 40));
      setSenadores(sens.slice(0, 40));

      // Seleciona automaticamente a aba de triagem que tiver itens primeiro
      const allTriagem = [...prox, ...cam, ...sen];
      if (allTriagem.some((p) => p.triagem === 'sanction_veto')) {
        setTriagemAtiva('sanction_veto');
      } else if (allTriagem.some((p) => p.triagem === 'approved_house')) {
        setTriagemAtiva('approved_house');
      } else {
        setTriagemAtiva('in_progress');
      }
    } catch (err) {
      console.warn('[Radar360] Falha ao carregar dados legislativos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    haptic.selection();
    setRefreshing(true);
    carregarTudo();
  };

  // Abrir detalhe de proposição + buscar tramitações
  const abrirProposicao = async (prop: RadarProposicao) => {
    haptic.selection();
    setPropSelecionada(prop);
    setTramitacoes([]);
    if (prop.casa === 'camara') {
      setLoadingTram(true);
      try {
        const list = await fetchProposicaoTramitacoes(prop.id);
        setTramitacoes(list.slice(-8).reverse());
      } finally {
        setLoadingTram(false);
      }
    }
  };

  // Abrir perfil do parlamentar + propostas dele
  const abrirParlamentar = async (p: {
    id: string | number;
    nome: string;
    partido?: string;
    uf?: string;
    foto_url?: string;
    casa: 'camara' | 'senado';
  }) => {
    haptic.selection();
    setParlamentarSelecionado(p);
    setPropsParlamentar([]);
    setLoadingParlamentar(true);
    try {
      const list =
        p.casa === 'camara'
          ? await fetchProposicoesDoDeputado(Number(p.id))
          : await fetchProposicoesDoSenador(p.id);
      setPropsParlamentar(list);
    } finally {
      setLoadingParlamentar(false);
    }
  };

  const q = busca.trim().toLowerCase();

  // Carrossel de últimas propostas + emendas com foto dos autores
  const carrosselUltimas = useMemo(() => {
    const combined = [...ultimasCamara, ...emendas];
    if (!q) return combined.slice(0, 14);
    return combined.filter(
      (p) =>
        p.ementa.toLowerCase().includes(q) ||
        `${p.siglaTipo} ${p.numero}`.toLowerCase().includes(q) ||
        p.autores.some((a) => a.nome.toLowerCase().includes(q))
    );
  }, [ultimasCamara, emendas, q]);

  // Triagem consolidada (Próximas a acontecer)
  const triagemMap = useMemo(() => {
    const all = [...proximasLei, ...ultimasCamara, ...senadoProps];
    const unique = new Map<string, RadarProposicao>();
    all.forEach((p) => {
      if (!unique.has(p.id)) unique.set(p.id, p);
    });
    const list = Array.from(unique.values()).filter((p) => {
      if (!q) return true;
      return (
        p.ementa.toLowerCase().includes(q) ||
        `${p.siglaTipo} ${p.numero}`.toLowerCase().includes(q) ||
        p.autores.some((a) => a.nome.toLowerCase().includes(q))
      );
    });

    return {
      sanction_veto: list.filter((p) => p.triagem === 'sanction_veto'),
      approved_house: list.filter((p) => p.triagem === 'approved_house'),
      in_progress: list.filter((p) => p.triagem === 'in_progress'),
    };
  }, [proximasLei, ultimasCamara, senadoProps, q]);

  // Leis em alta filtradas
  const leisEmAlta = useMemo(() => {
    let base: RadarProposicao[] = [];
    if (tipoAlta === 'SENADO') base = senadoProps;
    else if (tipoAlta === 'EMD') base = emendas;
    else if (tipoAlta === 'TODAS') base = [...proximasLei, ...ultimasCamara, ...senadoProps];
    else base = [...proximasLei, ...ultimasCamara].filter((p) => p.siglaTipo === tipoAlta);

    const unique = new Map<string, RadarProposicao>();
    base.forEach((p) => {
      if (!unique.has(p.id)) unique.set(p.id, p);
    });

    let list = Array.from(unique.values());
    if (q) {
      list = list.filter(
        (p) =>
          p.ementa.toLowerCase().includes(q) ||
          `${p.siglaTipo} ${p.numero}`.toLowerCase().includes(q) ||
          p.autores.some((a) => a.nome.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 12);
  }, [tipoAlta, proximasLei, ultimasCamara, senadoProps, emendas, q]);

  // Parlamentares filtrados
  const parlamentaresFiltrados = useMemo(() => {
    const raw = casaParlamentar === 'camara' ? deputados : senadores;
    if (!q) return raw.slice(0, 18);
    return raw
      .filter(
        (p: any) =>
          (p.nome || '').toLowerCase().includes(q) ||
          (p.sigla_partido || '').toLowerCase().includes(q) ||
          (p.sigla_uf || '').toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [casaParlamentar, deputados, senadores, q]);

  return (
    <div className="min-h-dvh bg-[#09090B] text-white pb-24 overflow-x-hidden">
      <div className="bg-gradient-to-b from-rose-950/35 via-[#09090B] to-[#09090B] pb-4 border-b border-white/[0.06]">
        <PageHeader
          title="Radar Legislativo"
          subtitle="Câmara dos Deputados & Senado Federal"
          onBack={() => goBack()}
          rightAction={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 disabled:opacity-50 cursor-pointer"
              aria-label="Atualizar Radar"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          }
        />

        {/* Barra de Busca */}
        <div className="px-4 pt-2 max-w-5xl mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por PL, PEC, emenda, tema ou deputado/senador..."
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-zinc-900/90 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/50"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className={`mx-auto px-4 pt-5 space-y-8 ${isDesktop ? 'max-w-[1380px] px-8' : 'max-w-3xl'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
            <p className="text-sm font-medium">Conectando à Câmara dos Deputados e Senado Federal...</p>
          </div>
        ) : (
          <>
            {/* ── 1. CARROSSEL: ÚLTIMAS PROPOSTAS & EMENDAS COM FOTO DOS AUTORES ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-rose-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Últimas Propostas & Emendas
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {carrosselUltimas.length} recentes
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {carrosselUltimas.map((prop) => {
                  const autorPrincipal = prop.autores[0];
                  const tri = TRIAGEM_CONFIG[prop.triagem];
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => abrirProposicao(prop)}
                      className="snap-start shrink-0 w-[285px] sm:w-[310px] rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-rose-500/40 p-4 flex flex-col justify-between gap-3 text-left transition-all active:scale-[0.98] cursor-pointer shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <AutorAvatar autor={autorPrincipal} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {autorPrincipal?.nome || 'Parlamentar'}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {autorPrincipal?.partido && autorPrincipal?.uf
                              ? `${autorPrincipal.partido}-${autorPrincipal.uf}`
                              : prop.casa === 'camara'
                              ? 'Câmara dos Deputados'
                              : 'Senado Federal'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold shrink-0">
                          {prop.siglaTipo} {prop.numero}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                        {prop.ementa}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tri.badgeClass}`}>
                          {tri.shortLabel}
                        </span>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
                          Detalhes <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 2. TRIAGEM: PODE ACONTECER / PRÓXIMAS A VIRAR LEI ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-300">
                    Triagem • Pode Acontecer
                  </h2>
                </div>
              </div>

              {/* Abas de Triagem */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TRIAGEM_CONFIG) as RadarTriagemStage[]).map((stage) => {
                  const cfg = TRIAGEM_CONFIG[stage];
                  const Icon = cfg.icon;
                  const count = triagemMap[stage].length;
                  const active = triagemAtiva === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setTriagemAtiva(stage);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-white/10 border-rose-500/50 shadow-md'
                          : 'bg-zinc-900/60 border-white/10 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-zinc-400'}`} />
                        <span className="text-xs font-mono font-bold text-white">{count}</span>
                      </div>
                      <p className="text-[11px] sm:text-xs font-bold text-white leading-tight line-clamp-1">
                        {cfg.shortLabel}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-zinc-400 px-1">
                {TRIAGEM_CONFIG[triagemAtiva].desc}
              </p>

              <div className="rounded-2xl bg-zinc-900/80 border border-white/10 divide-y divide-white/[0.06] overflow-hidden">
                {triagemMap[triagemAtiva].length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    Nenhuma proposição classificada neste estágio no momento.
                  </div>
                ) : (
                  triagemMap[triagemAtiva].slice(0, 6).map((prop) => {
                    const autor = prop.autores[0];
                    return (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => abrirProposicao(prop)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-white/[0.03] text-left transition-colors cursor-pointer"
                      >
                        <AutorAvatar autor={autor} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-white">
                              {prop.siglaTipo} {prop.numero}/{prop.ano}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 truncate max-w-[200px]">
                              {prop.situacao}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {prop.ementa}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 mt-1" />
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* ── 3. LEIS EM ALTA & EMENDAS ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-rose-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Leis em Alta & Emendas
                  </h2>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(
                  [
                    { id: 'TODAS', label: 'Todas' },
                    { id: 'PL', label: 'PL' },
                    { id: 'PEC', label: 'PEC' },
                    { id: 'PLP', label: 'PLP' },
                    { id: 'EMD', label: 'Emendas' },
                    { id: 'SENADO', label: 'Senado' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setTipoAlta(f.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      tipoAlta === f.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-900 text-zinc-300 border border-white/10 hover:bg-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leisEmAlta.map((prop) => {
                  const autor = prop.autores[0];
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => abrirProposicao(prop)}
                      className="rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-rose-500/40 p-4 text-left flex flex-col gap-2.5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <AutorAvatar autor={autor} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {autor?.nome || (prop.casa === 'senado' ? 'Senado Federal' : 'Câmara')}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {autor?.partido ? `${autor.partido}-${autor.uf}` : prop.casa.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white shrink-0">
                          {prop.siglaTipo} {prop.numero}/{prop.ano}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {prop.ementa}
                      </p>

                      {prop.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {prop.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 4. DEPUTADOS & SENADORES — O QUE ESTÃO PROPONDO ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-rose-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    Parlamentares & Propostas
                  </h2>
                </div>

                <div className="flex rounded-xl bg-zinc-900 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCasaParlamentar('camara')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      casaParlamentar === 'camara' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Deputados
                  </button>
                  <button
                    type="button"
                    onClick={() => setCasaParlamentar('senado')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      casaParlamentar === 'senado' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Senadores
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {parlamentaresFiltrados.map((p: any) => {
                  const pId = casaParlamentar === 'camara' ? p.id : p.codigo;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() =>
                        abrirParlamentar({
                          id: pId,
                          nome: p.nome,
                          partido: p.sigla_partido,
                          uf: p.sigla_uf,
                          foto_url: p.foto_url,
                          casa: casaParlamentar,
                        })
                      }
                      className="rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-rose-500/40 p-3 flex flex-col items-center text-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <AutorAvatar
                        autor={{
                          id: pId,
                          nome: p.nome,
                          partido: p.sigla_partido,
                          uf: p.sigla_uf,
                          foto_url: p.foto_url,
                          casa: casaParlamentar,
                        }}
                        size="lg"
                      />
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-bold text-white truncate">{p.nome}</p>
                        <p className="text-[10px] text-zinc-400">
                          {p.sigla_partido} • {p.sigla_uf}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── MODAL DE DETALHE DA PROPOSIÇÃO ── */}
      {propSelecionada && (
        <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-xl max-h-[85dvh] bg-[#141417] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm text-white">
                  {propSelecionada.siglaTipo} {propSelecionada.numero}/{propSelecionada.ano}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPropSelecionada(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Autores */}
              {propSelecionada.autores.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {propSelecionada.autores.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2"
                    >
                      <AutorAvatar autor={a} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-white">{a.nome}</p>
                        <p className="text-[10px] text-zinc-400">
                          {a.partido ? `${a.partido}-${a.uf}` : a.tipo || propSelecionada.casa.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Situação */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Situação Atual
                </p>
                <p className="text-xs font-semibold text-amber-300">
                  {propSelecionada.situacao || 'Em tramitação'}
                </p>
              </div>

              {/* Ementa */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Ementa
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">{propSelecionada.ementa}</p>
              </div>

              {/* Tramitações recentes */}
              {propSelecionada.casa === 'camara' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Últimas Tramitações
                  </p>
                  {loadingTram ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando histórico...
                    </div>
                  ) : tramitacoes.length === 0 ? (
                    <p className="text-xs text-zinc-500">Sem tramitações recentes registradas.</p>
                  ) : (
                    <div className="space-y-2">
                      {tramitacoes.map((t: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>{t.siglaOrgao || 'Órgão'}</span>
                            <span>
                              {t.dataHora ? new Date(t.dataHora).toLocaleDateString('pt-BR') : ''}
                            </span>
                          </div>
                          <p className="text-zinc-200 leading-snug">{t.descricaoTramitacao || t.despacho}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(propSelecionada.urlOficial || propSelecionada.urlInteiroTeor) && (
              <div className="p-4 border-t border-white/[0.06] flex gap-2">
                {propSelecionada.urlInteiroTeor && (
                  <a
                    href={propSelecionada.urlInteiroTeor}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                  >
                    <FileText className="w-4 h-4" /> Inteiro Teor
                  </a>
                )}
                {propSelecionada.urlOficial && (
                  <a
                    href={propSelecionada.urlOficial}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
                  >
                    <ExternalLink className="w-4 h-4" /> Ver Oficial
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DE PROPOSTAS DO PARLAMENTAR ── */}
      {parlamentarSelecionado && (
        <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-xl max-h-[85dvh] bg-[#141417] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <AutorAvatar autor={parlamentarSelecionado} size="md" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">
                    {parlamentarSelecionado.nome}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {parlamentarSelecionado.partido} • {parlamentarSelecionado.uf} (
                    {parlamentarSelecionado.casa === 'camara' ? 'Deputado(a)' : 'Senador(a)'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setParlamentarSelecionado(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Propostas e Emendas Recentes
              </p>
              {loadingParlamentar ? (
                <div className="flex items-center justify-center py-10 gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-500" /> Buscando proposições...
                </div>
              ) : propsParlamentar.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  Nenhuma proposição recente encontrada para este parlamentar.
                </p>
              ) : (
                propsParlamentar.map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => {
                      setParlamentarSelecionado(null);
                      abrirProposicao(prop);
                    }}
                    className="w-full rounded-2xl bg-white/[0.03] border border-white/10 hover:border-rose-500/40 p-3.5 text-left space-y-1.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-300">
                        {prop.siglaTipo} {prop.numero}/{prop.ano}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {prop.ementa}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
