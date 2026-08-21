import { useState, useEffect, useMemo } from 'react';
import { 
  carregarResumoVideoaulas, 
  RESUMO_VAZIO, 
  resumoVideoaulasSincrono, 
  type ResumoVideoaulas 
} from '@/lib/videoaulasResumo';
import { 
  getCachedCatalogo, 
  subscribeVideoaulas, 
  warmVideoaulasCache 
} from '@/lib/videoaulasStore';
import { CATALOGOS, slugify } from '@/lib/videoaulasCatalogos';
import { AulaHit } from '@/types/videoaula';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const normalizeTexto = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function useVideoaulas() {
  const [data, setData] = useState<ResumoVideoaulas>(() => resumoVideoaulasSincrono() ?? RESUMO_VAZIO);
  const [loading, setLoading] = useState(() => !resumoVideoaulasSincrono());
  const [filtro, setFiltro] = useState<'todas' | 'andamento'>('todas');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [drawerBusca, setDrawerBusca] = useState(false);
  const [showDesempenho, setShowDesempenho] = useState(false);
  const [drawerCategoria, setDrawerCategoria] = useState('Todos');
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (!drawerBusca) {
      setBusca('');
      setDrawerCategoria('Todos');
    }
  }, [drawerBusca]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    let id: number | undefined;
    const start = setTimeout(() => {
      id = window.setInterval(() => {
        setHeroIdx((i) => (i + 1) % 6); // 6 is HERO_ILLUSTRATIONS.length
      }, 4500);
    }, 1200);
    return () => {
      clearTimeout(start);
      if (id) clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const atualizar = () => {
      carregarResumoVideoaulas().then((r) => {
        if (!alive) return;
        setData(r);
        setLoading(false);
      });
    };
    atualizar();
    warmVideoaulasCache();
    
    const off = subscribeVideoaulas(() => {
      const sync = resumoVideoaulasSincrono();
      if (alive && sync) {
        setData(sync);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  const areasDireito = useMemo(
    () => data.areas.filter((a) => a.catalogo === 'areas'),
    [data.areas],
  );

  const emAndamentoCount = useMemo(
    () => areasDireito.filter((a) => a.pct > 0).length,
    [areasDireito],
  );

  const lista = useMemo(() => {
    const l = [...areasDireito].sort((a, b) => {
      const ai = a.pct > 0 ? 0 : 1;
      const bi = b.pct > 0 ? 0 : 1;
      if (ai !== bi) return ai - bi;
      if (ai === 0 && b.pct !== a.pct) return b.pct - a.pct;
      return a.area.localeCompare(b.area, 'pt-BR');
    });
    let result = filtro === 'andamento' ? l.filter((a) => a.pct > 0) : l;
    if (buscaDebounced.trim()) {
      const termos = normalizeTexto(buscaDebounced).split(/\s+/).filter(Boolean);
      result = result.filter(a => {
        const areaNormalizada = normalizeTexto(a.area);
        return termos.every(t => areaNormalizada.includes(t));
      });
    }
    return result;
  }, [areasDireito, filtro, buscaDebounced]);

  const buscaAulas = useMemo(() => {
    if (!buscaDebounced.trim()) return [];
    const termos = normalizeTexto(buscaDebounced).split(/\s+/).filter(Boolean);
    const hits: AulaHit[] = [];
    for (const cat of CATALOGOS) {
      const cache = getCachedCatalogo(cat.id);
      if (!cache) continue;
      for (const row of cache) {
        const area = cat.temAreas ? String(row.area ?? '').trim() : cat.titulo;
        const textoBusca = normalizeTexto(`${String(row.titulo ?? '')} ${area}`);
        if (termos.every(t => textoBusca.includes(t))) {
          hits.push({
            catalogoId: cat.id,
            videoId: String(row.video_id ?? ''),
            titulo: String(row.titulo ?? ''),
            area,
            slugArea: cat.temAreas ? slugify(area) : 'aulas',
          });
        }
        if (hits.length >= 300) break;
      }
      if (hits.length >= 300) break;
    }
    return hits;
  }, [buscaDebounced]);

  const areasDosResultados = useMemo(() => {
    if (!buscaAulas.length) return [];
    const areas = new Set(buscaAulas.map(a => a.area));
    return ['Todos', ...Array.from(areas).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [buscaAulas]);

  const aulasFiltradas = useMemo(() => {
    if (drawerCategoria === 'Todos') return buscaAulas;
    return buscaAulas.filter(a => a.area === drawerCategoria);
  }, [buscaAulas, drawerCategoria]);

  return {
    data,
    loading,
    filtro,
    setFiltro,
    busca,
    setBusca,
    drawerBusca,
    setDrawerBusca,
    showDesempenho,
    setShowDesempenho,
    drawerCategoria,
    setDrawerCategoria,
    heroIdx,
    areasDireito,
    emAndamentoCount,
    lista,
    buscaAulas,
    areasDosResultados,
    aulasFiltradas,
  };
}
