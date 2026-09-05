import { useEffect, useMemo, useState } from 'react';
import { LEIS_SUPABASE_URL } from "@/lib/legislacaoBackend";
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Crown } from 'lucide-react';
import GeracaoAnimacaoOverlay from '@/components/vademecum/overlays/GeracaoAnimacaoOverlay';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useGoBack } from '@/hooks/useGoBack';
import {
  readJurisCache,
  writeJurisCache,
  type JurisCategoriaCache,
} from '@/lib/jurisprudenciaCache';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';

import {
  JurisItem,
  JurisCategoria,
  JurisprudenciaArtigoProps,
  OVERLAY_STEPS,
  prettyLeiName,
  horusOwl,
  JurisUnsupportedCard,
  JurisFiltrosBar,
  JurisCategoriaList,
  JurisCategoriaSheet,
  JurisDetalheSheet,
} from '@/components/vademecum/jurisprudencia/chunks';

const SB_URL = LEIS_SUPABASE_URL;

export default function JurisprudenciaArtigo({
  slugLeiProp,
  numeroArtigoProp,
  embedded,
  onBack,
}: JurisprudenciaArtigoProps = {}) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const params = useParams<{ slugLei: string; numeroArtigo: string }>();
  const slugLei = slugLeiProp ?? params.slugLei;
  const numeroArtigo = numeroArtigoProp ?? params.numeroArtigo;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      goBack();
    } else if (slugLei) {
      navigate(`/vademecum/${slugLei}`);
    } else {
      navigate('/');
    }
  };

  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leiInfo, setLeiInfo] = useState<{ corpus_lei_id: number; nome_exibicao: string } | null>(null);
  const [categorias, setCategorias] = useState<JurisCategoria[]>([]);
  const [totalItens, setTotalItens] = useState(0);
  const [tab, setTab] = useState<'todos' | 'favoritos'>('todos');
  const [tribunalFiltro, setTribunalFiltro] = useState<string>('todos');
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [descobrindo, setDescobrindo] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [detalhe, setDetalhe] = useState<{ item: JurisItem; cat: JurisCategoria; mode?: 'tese' | 'ementa' | 'ambos' } | null>(null);
  const [catAberta, setCatAberta] = useState<JurisCategoria | null>(null);
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [explicandoLoading, setExplicandoLoading] = useState(false);
  const voice = useVoiceInput((text) => setBusca((prev) => (prev ? prev + ' ' : '') + text));
  const [revalidating, setRevalidating] = useState(false);

  const numeroLabel = useMemo(() => {
    if (!numeroArtigo) return '';
    const raw = decodeURIComponent(numeroArtigo);
    return `Art. ${raw}`;
  }, [numeroArtigo]);

  const descobrirLei = async (): Promise<{ corpus_lei_id: number; nome_exibicao: string } | null> => {
    if (!slugLei) return null;
    const { data: lei } = await supabase
      .from('vade_mecum_leis')
      .select('slug, nome, numero_lei, ano_lei')
      .eq('slug', slugLei)
      .maybeSingle();

    const resp = await fetch(`${SB_URL}/functions/v1/corpus927-descobrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug_local: slugLei,
        nome: lei?.nome || slugLei,
        numero_lei: lei?.numero_lei || null,
        ano_lei: lei?.ano_lei || null,
        apply: true,
      }),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json?.error || 'Falha na descoberta');
    if (!json.confident || !json.matched) return null;
    return { corpus_lei_id: json.matched.corpus_lei_id, nome_exibicao: lei?.nome || json.matched.nome };
  };

  const buscarJurisprudencia = async (corpus_lei_id: number, force: boolean) => {
    if (corpus_lei_id === -1) {
      setCategorias([]);
      setTotalItens(0);
      return;
    }
    const resp = await fetch(`${SB_URL}/functions/v1/corpus927-fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corpus_lei_id,
        numero_artigo: decodeURIComponent(numeroArtigo!),
        force,
      }),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json?.error || 'Erro ao consultar jurisprudência');
    setCategorias(json.categorias || []);
    setTotalItens(json.total_itens || 0);
  };

  const carregar = async (force = false) => {
    if (!slugLei || !numeroArtigo) return;
    setError(null);
    const numeroDec = decodeURIComponent(numeroArtigo);
    const cache = !force ? readJurisCache(slugLei, numeroDec) : null;
    if (cache) {
      if (cache.leiInfo) setLeiInfo(cache.leiInfo);
      setCategorias(cache.categorias);
      setTotalItens(cache.totalItens);
      setLoading(false);
      setRevalidating(true);
    } else {
      force ? setRefreshing(true) : setLoading(true);
    }
    try {
      let usouDescoberta = false;
      const mapaPromise = supabase
        .from('jurisprudencia_leis_map')
        .select('corpus_lei_id, nome_exibicao, ativo')
        .eq('slug_local', slugLei)
        .maybeSingle();
      const favPromise = supabase
        .from('jurisprudencia_favoritos')
        .select('corpus_item_id')
        .eq('slug_local', slugLei)
        .eq('numero_artigo', numeroDec);

      let { data: mapa, error: errMapa } = await mapaPromise;
      if (errMapa) throw errMapa;

      if (!mapa || !mapa.ativo) {
        usouDescoberta = true;
        if (!cache) {
          setLoading(false);
          setDescobrindo(true);
          setStepIdx(0);
        }
        try {
          const descoberta = await descobrirLei();
          if (!descoberta) {
            if (!cache) setError('Não foi possível localizar esta lei automaticamente no Corpus927. Peça ao admin para mapear.');
            setDescobrindo(false);
            setRevalidating(false);
            return;
          }
          setStepIdx(1);
          mapa = { corpus_lei_id: descoberta.corpus_lei_id, nome_exibicao: descoberta.nome_exibicao, ativo: true };
        } catch (e: any) {
          if (!cache) setError(String(e?.message || e));
          setDescobrindo(false);
          setRevalidating(false);
          return;
        }
      }

      setLeiInfo({ corpus_lei_id: mapa.corpus_lei_id, nome_exibicao: mapa.nome_exibicao });
      if (usouDescoberta && !cache) setStepIdx(2);

      await buscarJurisprudencia(mapa.corpus_lei_id, force);

      const { data: fav } = await favPromise;
      setFavoritos(new Set((fav || []).map((f: any) => String(f.corpus_item_id))));

      try {
        setCategorias((cs) => {
          setTotalItens((t) => {
            writeJurisCache(slugLei, numeroDec, {
              leiInfo: { corpus_lei_id: mapa!.corpus_lei_id, nome_exibicao: mapa!.nome_exibicao },
              categorias: cs as JurisCategoriaCache[],
              totalItens: t,
              savedAt: Date.now(),
            });
            return t;
          });
          return cs;
        });
      } catch {}

      if (usouDescoberta && !cache) {
        setStepIdx(3);
        setDescobrindo(false);
      }
    } catch (e: any) {
      if (!cache) {
        setError(String(e?.message || e));
        setCategorias([]);
        setTotalItens(0);
      }
      setDescobrindo(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setRevalidating(false);
    }
  };

  useEffect(() => {
    if (!loadingSubscription && !isPremium) {
      setLoading(false);
      return;
    }
    if (slugLei && numeroArtigo) {
      carregar(false);
    }
  }, [slugLei, numeroArtigo, isPremium, loadingSubscription]);

  const toggleFav = async (cat: JurisCategoria, item: JurisItem) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      toast.error('Faça login para favoritar');
      return;
    }
    const key = String(item.id);
    if (favoritos.has(key)) {
      await supabase.from('jurisprudencia_favoritos').delete().eq('user_id', uid).eq('corpus_item_id', Number(item.id));
      setFavoritos((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    } else {
      await supabase.from('jurisprudencia_favoritos').insert({
        user_id: uid,
        corpus_item_id: Number(item.id),
        categoria: cat.label,
        titulo: item.titulo || '',
        conteudo: item.conteudo || '',
        url_origem: item.url_origem || '',
        slug_local: slugLei!,
        numero_artigo: decodeURIComponent(numeroArtigo!),
      });
      setFavoritos((s) => new Set(s).add(key));
      toast.success('Adicionado aos favoritos');
    }
  };

  const filtroBusca = (item: JurisItem) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (item.titulo || '').toLowerCase().includes(q) ||
      (item.numero_processo || '').toLowerCase().includes(q) ||
      (item.conteudo || '').toLowerCase().includes(q)
    );
  };

  const tribunaisDisponiveis = useMemo(() => {
    const map = new Map<string, number>();
    categorias.forEach((c) => {
      map.set(c.tribunal, (map.get(c.tribunal) || 0) + c.itens.length);
    });
    return Array.from(map.entries()).map(([tribunal, count]) => ({ tribunal, count }));
  }, [categorias]);

  const categoriasVisiveis = useMemo(() => {
    const base = tab === 'favoritos'
      ? categorias.map((c) => ({ ...c, itens: c.itens.filter((i) => favoritos.has(String(i.id)) && filtroBusca(i)) }))
      : categorias.map((c) => ({ ...c, itens: c.itens.filter(filtroBusca) }));
    const porTribunal = tribunalFiltro === 'todos'
      ? base
      : base.filter((c) => c.tribunal === tribunalFiltro);
    return porTribunal.filter((c) => c.itens.length > 0);
  }, [categorias, tab, favoritos, busca, tribunalFiltro]);

  const isUnsupported = leiInfo?.corpus_lei_id === -1;
  const artigoNumero = numeroArtigo ? decodeURIComponent(numeroArtigo) : '';
  const leiNomeBusca = leiInfo?.nome_exibicao || slugLei || '';

  return (
    <div className={embedded ? 'h-full bg-background flex flex-col' : 'min-h-screen bg-background flex flex-col'}>
      <GeracaoAnimacaoOverlay
        open={descobrindo}
        titulo="Localizando jurisprudência"
        steps={OVERLAY_STEPS}
        stepIdx={stepIdx}
        estTotalSec={12}
        onCancel={() => {
          setDescobrindo(false);
          handleBack();
        }}
      />
      <PageHeader
        title="Jurisprudência"
        subtitle={leiInfo ? `${prettyLeiName(leiInfo.nome_exibicao)} — ${numeroLabel}` : numeroLabel}
        onBack={handleBack}
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => carregar(true)} disabled={refreshing} title="Atualizar cache">
            {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </Button>
        }
      />

      <div
        className={
          embedded
            ? 'flex-1 w-full overflow-y-auto px-4 pb-10 pt-4'
            : 'flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-24 pt-4 lg:max-w-[1400px] lg:px-12 lg:pb-12 lg:pt-6 2xl:px-16'
        }
      >
        {!loadingSubscription && !isPremium ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-500/20 to-primary/20 p-2 border border-amber-500/30 flex items-center justify-center mb-4 shadow-xl shadow-primary/25">
              <img src={horusOwl} alt="Horus" className="w-16 h-16 object-contain" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Jurisprudência é Exclusivo Prime
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Consulte súmulas vinculantes, teses de repercussão geral, recursos repetitivos e acórdãos do STF e STJ vinculados diretamente a cada artigo da lei.
            </p>
            <Button
              onClick={() => setShowPremiumGate(true)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 fill-current" />
              Começar 3 dias grátis
            </Button>
            <PremiumGate open={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature="jurisprudencia" />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Consultando Corpus927…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : isUnsupported ? (
          <JurisUnsupportedCard
            nomeExibicao={leiInfo?.nome_exibicao}
            numeroLabel={numeroLabel}
            artigoNumero={artigoNumero}
            leiNomeBusca={leiNomeBusca}
          />
        ) : (
          <>
            <JurisFiltrosBar
              totalItens={totalItens}
              revalidating={revalidating}
              favoritosCount={favoritos.size}
              tribunaisDisponiveis={tribunaisDisponiveis}
              tab={tab}
              setTab={setTab}
              tribunalFiltro={tribunalFiltro}
              setTribunalFiltro={setTribunalFiltro}
              busca={busca}
              setBusca={setBusca}
              voice={voice}
            />

            <JurisCategoriaList
              categoriasVisiveis={categoriasVisiveis}
              tab={tab}
              onSelectCategoria={(cat) => setCatAberta(cat)}
            />
          </>
        )}
      </div>

      {/* Sheet: itens de uma categoria */}
      <JurisCategoriaSheet
        catAberta={catAberta}
        onClose={() => setCatAberta(null)}
        favoritos={favoritos}
        onToggleFav={toggleFav}
        onOpenDetalhe={(item, cat, mode) => setDetalhe({ item, cat, mode })}
      />

      {/* Sheet: detalhe e IA */}
      <JurisDetalheSheet
        detalhe={detalhe}
        onClose={() => setDetalhe(null)}
        leiInfo={leiInfo}
        numeroLabel={numeroLabel}
        explicacao={explicacao}
        setExplicacao={setExplicacao}
        explicandoLoading={explicandoLoading}
        setExplicandoLoading={setExplicandoLoading}
      />
    </div>
  );
}
