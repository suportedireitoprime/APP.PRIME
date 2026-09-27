import { supabase } from '@/integrations/supabase/client';
import { resenhaSelect, RESENHA_LIST_SELECT } from '@/lib/resenhaBackend';
import { fetchProposicoes } from '@/services/radarService';

export let cacheLeis: any[] | null = null;
export let cacheNoticias: any[] | null = null;
export let cacheBoletins: any[] | null = null;
export let cachePls: any[] | null = null;
export let cacheConcursos: any[] | null = null;
let loadPromise: Promise<void> | null = null;

export const prefetchGiroJuridico = () => {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all([
    resenhaSelect({ select: RESENHA_LIST_SELECT, order: 'data_dou.desc', limit: '10' }).then(res => { if (res) cacheLeis = res; }),
    supabase.from('noticias_juridicas').select('*').order('data_publicacao', { ascending: false }).limit(10).then(res => { if (res.data) cacheNoticias = res.data; }),
    supabase.from('boletins_juridicos').select('id, data_ref, titulo, subtitulo, tipo').in('status', ['pronto', 'sem_leis']).order('data_ref', { ascending: false }).limit(10).then(res => { if (res.data) cacheBoletins = res.data; }),
    fetchProposicoes().then(res => { if (res) cachePls = res.slice(0, 10); }),
    supabase.from('concursos_noticias').select('*').order('data_publicacao', { ascending: false }).limit(50).then(res => { if (res.data) cacheConcursos = res.data; })
  ]).then(() => {}).catch(() => {});
  return loadPromise;
};
