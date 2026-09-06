import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, LocateFixed } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLocaisPhotos } from '@/hooks/useLocaisPhotos';
import { CATEGORIAS_LOCAIS, type CategoriaLocal } from '@/lib/locaisCategorias';
import { toast } from 'sonner';
import { LocalTransporteDialog } from '@/components/locais/LocalTransporteDialog';
import { copiarTexto } from '@/lib/nativo/copiar';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import {
  type Local,
  type Contagens,
  LocaisCategoriasView,
  LocaisListaView,
  LocalDetailSheet,
} from '@/components/locais/chunks';
import type { SortOption } from '@/components/locais/LocaisFiltroBar';
import {
  getSyncContagens,
  isContagensFresh,
  saveContagens,
  getPersistedLocaisCategoria,
  saveLocaisCategoria,
} from '@/services/locaisCache';

export default function LocaisJuridicos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location, loading: geoLoading, request } = useUserLocation(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaLocal | null>(null);
  const [contagens, setContagens] = useState<Contagens>(() => getSyncContagens() ?? {});
  const [carregandoContagens, setCarregandoContagens] = useState(() => !getSyncContagens());
  const [locais, setLocais] = useState<Local[]>([]);
  const [carregandoLocais, setCarregandoLocais] = useState(false);
  const [locaisProximosGeral, setLocaisProximosGeral] = useState<Local[]>([]);
  const [carregandoGeral, setCarregandoGeral] = useState(false);
  const [selecionado, setSelecionado] = useState<Local | null>(null);
  const [wikiInfo, setWikiInfo] = useState<{ extract: string; url?: string } | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('locais_favoritos');
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const toggleFavorito = useCallback((id: string) => {
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success('Removido dos favoritos');
      } else {
        next.add(id);
        toast.success('Adicionado aos favoritos');
      }
      try {
        localStorage.setItem('locais_favoritos', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const autoLocPedidoRef = useRef(false);
  const [sort, setSort] = useState<SortOption>('proximo');
  const [buscaCoords, setBuscaCoords] = useState<{ lat: number; lng: number; endereco: string } | null>(null);
  const [transporteAberto, setTransporteAberto] = useState(false);
  const coordsAtivas = buscaCoords ?? (location ? { lat: location.lat, lng: location.lng } : null);

  // Busca resumo específico sobre o local via Gemini + Google Search grounding
  useEffect(() => {
    if (!selecionado) {
      setWikiInfo(null);
      return;
    }
    let cancel = false;
    const cacheKey = `local_sobre_${selecionado.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { extract: string; url?: string };
        setWikiInfo(parsed);
        setWikiLoading(false);
        return;
      }
    } catch {}
    setWikiLoading(true);
    setWikiInfo(null);
    (async () => {
      try {
        const { withOnlineGuard } = await import('@/lib/onlineGuard');
        const { data, error } = await withOnlineGuard(
          () =>
            supabase.functions.invoke('local-info', {
              body: {
                fn: 'sobre',
                nome: selecionado.nome,
                categoria: selecionado.categoria,
                endereco: selecionado.endereco,
                cidade: selecionado.cidade,
                uf: selecionado.uf,
              },
            }),
          { fallback: () => ({ data: null, error: null } as any) },
        );
        if (cancel) return;
        if (error || !data?.extract) {
          setWikiInfo(null);
        } else {
          const info = { extract: data.extract as string, url: data.fontes?.[0] as string | undefined };
          setWikiInfo(info);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(info));
          } catch {}
        }
      } catch (e) {
        console.error('local-sobre', e);
        if (!cancel) setWikiInfo(null);
      } finally {
        if (!cancel) setWikiLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [selecionado]);

  const categoriaMeta = useMemo(
    () => CATEGORIAS_LOCAIS.find((categoria) => categoria.id === categoriaAtiva) ?? null,
    [categoriaAtiva],
  );

  const totalCategoriasPopuladas = useMemo(
    () => Object.values(contagens).filter((total) => (total ?? 0) > 0).length,
    [contagens],
  );

  // Hidrata fotos dos locais exibidos e do local selecionado no modal
  const idsParaFoto = useMemo(() => {
    const ids = locais.slice(0, 50).map((l) => l.id);
    const idsGerais = locaisProximosGeral.map((l) => l.id);
    ids.push(...idsGerais);
    if (selecionado && !ids.includes(selecionado.id)) {
      ids.push(selecionado.id);
    }
    return [...new Set(ids)];
  }, [locais, selecionado, locaisProximosGeral]);
  const photos = useLocaisPhotos(idsParaFoto);

  const carregarContagens = useCallback(async () => {
    // Se as contagens já estão em cache e frescas (TTL 7 dias), não consome requisições Supabase
    if (isContagensFresh()) {
      setCarregandoContagens(false);
      return;
    }
    setCarregandoContagens(true);
    const { data, error } = await supabase.from('locais_juridicos').select('categoria');
    if (error) {
      console.error(error);
      if (Object.keys(contagens).length === 0) {
        toast.error('Falha ao carregar categorias de locais.');
      }
      setCarregandoContagens(false);
      return;
    }
    const proximasContagens: Contagens = {};
    for (const row of data ?? []) {
      const categoria = row.categoria as CategoriaLocal;
      proximasContagens[categoria] = (proximasContagens[categoria] ?? 0) + 1;
    }
    setContagens(proximasContagens);
    void saveContagens(proximasContagens);
    setCarregandoContagens(false);
  }, [contagens]);

  const carregarLocais = useCallback(
    async (categoria: CategoriaLocal) => {
      // SWR: Tenta carregar cache prévio imediatamente (0ms de resposta)
      const cached = await getPersistedLocaisCategoria(categoria);
      if (cached && cached.length > 0) {
        setLocais(cached);
        setCarregandoLocais(false);
      } else {
        setCarregandoLocais(true);
        setLocais([]);
      }

      if (coordsAtivas) {
        const { data, error } = await supabase.rpc('locais_proximos', {
          _lat: coordsAtivas.lat,
          _lng: coordsAtivas.lng,
          _categorias: [categoria],
          _limite: 80,
          _raio_km: 300,
        });
        if (error) {
          console.error(error);
          if (!cached || cached.length === 0) {
            toast.error('Falha ao carregar locais próximos.');
          }
          setCarregandoLocais(false);
          return;
        }
        const lista = (data as Local[]) ?? [];
        setLocais(lista);
        void saveLocaisCategoria(categoria, lista);
        setCarregandoLocais(false);
        return;
      }

      const { data, error } = await supabase
        .from('locais_juridicos')
        .select('id, osm_id, categoria, nome, endereco, cidade, uf, lat, lng, telefone, site, horario, fonte')
        .eq('categoria', categoria)
        .order('uf', { ascending: true, nullsFirst: false })
        .order('cidade', { ascending: true, nullsFirst: false })
        .order('nome', { ascending: true })
        .limit(100);
      if (error) {
        console.error(error);
        if (!cached || cached.length === 0) {
          toast.error('Falha ao carregar locais desta categoria.');
        }
        setCarregandoLocais(false);
        return;
      }
      const lista = ((data as Local[]) ?? []).map((l) => ({ ...l, dist_km: null }));
      setLocais(lista);
      void saveLocaisCategoria(categoria, lista);
      setCarregandoLocais(false);
    },
    [coordsAtivas?.lat, coordsAtivas?.lng],
  );

  useEffect(() => {
    carregarContagens();
  }, [carregarContagens]);

  // Pede localização automaticamente logo que a tela abre
  useEffect(() => {
    if (!location && !autoLocPedidoRef.current) {
      autoLocPedidoRef.current = true;
      request();
    }
  }, [location, request]);

  useEffect(() => {
    if (!coordsAtivas || categoriaAtiva) return;
    let cancel = false;
    setCarregandoGeral(true);
    const todasCategorias = CATEGORIAS_LOCAIS.map((c) => c.id);
    supabase
      .rpc('locais_proximos', {
        _lat: coordsAtivas.lat,
        _lng: coordsAtivas.lng,
        _categorias: todasCategorias,
        _limite: 12,
        _raio_km: 200,
      })
      .then(({ data, error }) => {
        if (cancel) return;
        if (!error) setLocaisProximosGeral((data as Local[]) ?? []);
        setCarregandoGeral(false);
      });
    return () => {
      cancel = true;
    };
  }, [coordsAtivas?.lat, coordsAtivas?.lng, categoriaAtiva]);

  useEffect(() => {
    if (!categoriaAtiva) return;
    carregarLocais(categoriaAtiva);
  }, [categoriaAtiva, carregarLocais]);

  // Deep link: /ferramentas/locais?categoria=tribunais abre a categoria direto
  const categoriaParamRef = useRef(false);
  useEffect(() => {
    if (categoriaParamRef.current) return;
    const param = searchParams.get('categoria') as CategoriaLocal | null;
    if (!param) return;
    categoriaParamRef.current = true;
    if (!CATEGORIAS_LOCAIS.some((c) => c.id === param)) return;
    setCategoriaAtiva(param);
  }, [searchParams]);

  const abrirCategoria = (categoria: CategoriaLocal) => {
    setCategoriaAtiva(categoria);
  };

  const compartilhar = async (local: Local) => {
    const texto = `${local.nome}\n${local.endereco ?? ''}\nhttps://www.google.com/maps?q=${local.lat},${local.lng}`;
    if (podeCompartilhar()) {
      try {
        await compartilharNativo({ title: local.nome, text: texto });
      } catch {
        /* cancelado */
      }
    } else {
      await copiarTexto(texto);
      toast.success('Informações copiadas.');
    }
  };

  const voltar = () => {
    if (categoriaAtiva) {
      setCategoriaAtiva(null);
      setLocais([]);
      setSelecionado(null);
      if (searchParams.get('categoria')) setSearchParams({}, { replace: true });
      return;
    }
    navigate('/');
  };

  const mobileHeader = (
    <PageHeader
      title={categoriaMeta?.label ?? 'Locais Jurídicos'}
      subtitle={
        categoriaMeta
          ? `${contagens[categoriaMeta.id] ?? 0} disponíveis`
          : `${totalCategoriasPopuladas} categorias disponíveis`
      }
      onBack={voltar}
      rightAction={
        categoriaAtiva ? (
          <button
            onClick={() => request()}
            aria-label="Usar minha localização"
            className="w-11 h-11 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
          >
            {geoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
          </button>
        ) : undefined
      }
    />
  );

  const locaisOrdenados = useMemo(() => {
    const arr = [...locais];
    if (sort === 'melhor') {
      arr.sort((a, b) => (photos[b.id]?.rating ?? 0) - (photos[a.id]?.rating ?? 0));
    } else if (sort === 'mais_visitado') {
      arr.sort((a, b) => (photos[b.id]?.user_ratings_total ?? 0) - (photos[a.id]?.user_ratings_total ?? 0));
    } else if (sort === 'aberto') {
      const now = new Date();
      const dia = (now.getDay() + 6) % 7;
      const min = now.getHours() * 60 + now.getMinutes();
      const abertoAgora = (l: Local) => {
        const periods = (l as any)?.horario_places?.periods;
        if (!Array.isArray(periods)) return null;
        return periods.some((p: any) => {
          if (!p?.open) return false;
          if (p.open.day !== dia) return false;
          const openM = p.open.hour * 60 + (p.open.minute ?? 0);
          const closeM = p.close ? p.close.hour * 60 + (p.close.minute ?? 0) : 24 * 60;
          return min >= openM && min <= closeM;
        });
      };
      arr.sort((a, b) => Number(abertoAgora(b) === true) - Number(abertoAgora(a) === true));
    }
    return arr;
  }, [locais, sort, photos]);

  const destaques = locaisOrdenados.slice(0, 10);
  const resto = locaisOrdenados.slice(destaques.length);

  return (
    <DesktopPageLayout
      wide
      activeId="ferramentas"
      title="Locais Jurídicos"
      subtitle="Tribunais, cartórios, delegacias, museus e mais"
      mobileHeader={mobileHeader}
    >
      {categoriaAtiva ? (
        <LocaisListaView
          sort={sort}
          setSort={setSort}
          buscaCoords={buscaCoords}
          setBuscaCoords={setBuscaCoords}
          coordsAtivas={coordsAtivas}
          geoLoading={geoLoading}
          carregandoLocais={carregandoLocais}
          locais={locais}
          destaques={destaques}
          resto={resto}
          photos={photos}
          hasLocation={Boolean(location)}
          onSelectLocal={setSelecionado}
        />
      ) : (
        <LocaisCategoriasView
          locaisProximosGeral={locaisProximosGeral}
          categoriaAtiva={categoriaAtiva}
          carregandoGeral={carregandoGeral}
          carregandoContagens={carregandoContagens}
          contagens={contagens}
          photos={photos}
          onSelectLocal={setSelecionado}
          onAbrirCategoria={abrirCategoria}
        />
      )}

      <LocalDetailSheet
        selecionado={selecionado}
        onClose={() => setSelecionado(null)}
        meta={selecionado ? photos[selecionado.id] : null}
        wikiInfo={wikiInfo}
        wikiLoading={wikiLoading}
        favoritos={favoritos}
        onToggleFavorito={toggleFavorito}
        onCompartilhar={compartilhar}
        onAbrirTransporte={() => setTransporteAberto(true)}
      />

      {selecionado && (
        <LocalTransporteDialog
          open={transporteAberto}
          onClose={() => setTransporteAberto(false)}
          origem={coordsAtivas}
          destino={{ lat: selecionado.lat, lng: selecionado.lng, nome: selecionado.nome }}
        />
      )}
    </DesktopPageLayout>
  );
}
