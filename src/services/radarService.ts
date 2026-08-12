import { supabase } from '@/integrations/supabase/client';

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';

// ---- CACHE LAYER ----
const TTL = 10 * 60 * 1000; // 10 min
interface CacheEntry<T> { data: T; ts: number; }
const cache = new Map<string, CacheEntry<any>>();

function cached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < TTL) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

// ---- DEPUTADOS ----
export async function fetchDeputados(busca?: string, partido?: string, uf?: string) {
  const cacheKey = `deputados:${busca || ''}:${partido || ''}:${uf || ''}`;
  const hit = cached<any[]>(cacheKey);
  if (hit) return hit;
  let query = (supabase as any).from('radar_deputados').select('id,nome,sigla_partido,sigla_uf,foto_url,email').order('nome');
  if (busca) query = query.ilike('nome', `%${busca}%`);
  if (partido) query = query.eq('sigla_partido', partido);
  if (uf) query = query.eq('sigla_uf', uf);
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    // Fallback to API
    let url = `${CAMARA_API}/deputados?ordem=ASC&ordenarPor=nome&itens=100`;
    if (busca) url += `&nome=${encodeURIComponent(busca)}`;
    if (partido) url += `&siglaPartido=${partido}`;
    if (uf) url += `&siglaUf=${uf}`;
    
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.dados || []).map((d: any) => ({
      id: d.id,
      nome: d.nome,
      sigla_partido: d.siglaPartido,
      sigla_uf: d.siglaUf,
      foto_url: d.urlFoto,
      email: d.email,
      dados_json: d,
    }));
  }
  
  setCache(cacheKey, data);
  return data;
}

export async function fetchDeputadoDetalhe(id: number) {
  const cacheKey = `depDetalhe:${id}`;
  const hit = cached<any>(cacheKey);
  if (hit) return hit;
  const url = `${CAMARA_API}/deputados/${id}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json.dados;
  if (result) setCache(cacheKey, result);
  return result;
}

export async function fetchDeputadoDespesas(id: number) {
  const url = `${CAMARA_API}/deputados/${id}/despesas?ordem=DESC&ordenarPor=ano&itens=30`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.dados || [];
}

// ---- SENADORES ----
export async function fetchSenadores(busca?: string, partido?: string, uf?: string) {
  const cacheKey = `senadores:${busca || ''}:${partido || ''}:${uf || ''}`;
  const hit = cached<any[]>(cacheKey);
  if (hit) return hit;
  let query = (supabase as any).from('radar_senadores').select('codigo,nome,sigla_partido,sigla_uf,foto_url,dados_json').order('nome');
  if (busca) query = query.ilike('nome', `%${busca}%`);
  if (partido) query = query.eq('sigla_partido', partido);
  if (uf) query = query.eq('sigla_uf', uf);
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    const res = await fetch(`${SENADO_API}/senador/lista/atual.json`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    const parlamentares = json?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    return parlamentares
      .filter((p: any) => {
        const id = p.IdentificacaoParlamentar;
        if (busca && !id.NomeParlamentar?.toLowerCase().includes(busca.toLowerCase())) return false;
        if (partido && id.SiglaPartidoParlamentar !== partido) return false;
        if (uf && id.UfParlamentar !== uf) return false;
        return true;
      })
      .map((p: any) => {
        const id = p.IdentificacaoParlamentar;
        return {
          codigo: id.CodigoParlamentar,
          nome: id.NomeParlamentar,
          sigla_partido: id.SiglaPartidoParlamentar,
          sigla_uf: id.UfParlamentar,
          foto_url: id.UrlFotoParlamentar,
          dados_json: p,
        };
      });
  }
  
  setCache(cacheKey, data);
  return data;
}

// ---- PROPOSIÇÕES ----
export async function fetchProposicoes(tipo?: string, ano?: number, pagina = 1, dataInicio?: string, dataFim?: string) {
  let data = null;
  let error = null;
  
  if (!dataInicio && !dataFim) {
    const { data: sbData, error: sbError } = await (supabase as any).from('radar_proposicoes')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .range((pagina - 1) * 20, pagina * 20 - 1);
    data = sbData;
    error = sbError;
  }
  
  if (error || !data || data.length === 0) {
    let url = `${CAMARA_API}/proposicoes?ordem=DESC&ordenarPor=id&itens=20&pagina=${pagina}`;
    if (tipo) {
      if (tipo !== 'TODOS') url += `&siglaTipo=${tipo}`;
    } else {
      url += `&siglaTipo=PL,PEC,PLP`;
    }
    if (ano) url += `&ano=${ano}`;
    if (dataInicio) url += `&dataInicio=${dataInicio}`;
    if (dataFim) url += `&dataFim=${dataFim}`;
    
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.dados || []).map((d: any) => ({
      id_externo: String(d.id),
      fonte: 'camara',
      sigla_tipo: d.siglaTipo,
      numero: d.numero,
      ano: d.ano,
      ementa: d.ementa,
      dados_json: d,
    }));
  }
  
  return data;
}

export function extractTags(ementa: string | null): string[] {
  if (!ementa) return [];
  const tags: string[] = [];
  const text = ementa.toLowerCase();

  if (text.includes('código penal') || text.includes('decreto-lei nº 2.848') || text.includes('decreto-lei n° 2.848')) tags.push('Código Penal');
  if (text.includes('processo penal') || text.includes('decreto-lei nº 3.689') || text.includes('decreto-lei n° 3.689')) tags.push('Cód. Processo Penal');
  if (text.includes('código civil') || text.includes('lei nº 10.406') || text.includes('lei n° 10.406')) tags.push('Código Civil');
  if (text.includes('processo civil') || text.includes('lei nº 13.105') || text.includes('lei n° 13.105')) tags.push('Cód. Processo Civil');
  if (text.includes('constituição') || text.includes('constituição federal') || text.match(/\bcf\b/)) tags.push('Constituição Federal');
  if (text.includes('consolidação das leis do trabalho') || text.match(/\bclt\b/)) tags.push('CLT');
  if (text.includes('código de defesa do consumidor') || text.includes('lei nº 8.078') || text.includes('lei n° 8.078')) tags.push('CDC');
  if (text.includes('estatuto da criança e do adolescente') || text.includes('lei nº 8.069') || text.includes('lei n° 8.069')) tags.push('ECA');
  if (text.includes('maria da penha') || text.includes('lei nº 11.340') || text.includes('lei n° 11.340')) tags.push('Maria da Penha');
  if (text.includes('lei de drogas') || text.includes('lei nº 11.343') || text.includes('lei n° 11.343')) tags.push('Lei de Drogas');
  if (text.includes('código de trânsito') || text.includes('lei nº 9.503') || text.includes('lei n° 9.503')) tags.push('CTB');
  if (text.includes('estatuto da pessoa idosa') || text.includes('estatuto do idoso') || text.includes('lei nº 10.741')) tags.push('Estatuto da Pessoa Idosa');

  const leiMatch = text.match(/lei (?:complementar )?n[º°]\s*([\d.]+)/gi);
  if (leiMatch) {
    leiMatch.forEach(m => {
      const num = m.match(/n[º°]\s*([\d.]+)/i)?.[1];
      const isComp = m.toLowerCase().includes('complementar');
      if (num) {
        tags.push(`${isComp ? 'Lei Complementar' : 'Lei'} nº ${num}`);
      }
    });
  }

  const uniqueTags = [...new Set(tags)];
  const tagsFinais = uniqueTags.filter(t => {
    if (t === 'Lei nº 2.848' && uniqueTags.includes('Código Penal')) return false;
    if (t === 'Lei nº 3.689' && uniqueTags.includes('Cód. Processo Penal')) return false;
    if (t === 'Lei nº 10.406' && uniqueTags.includes('Código Civil')) return false;
    if (t === 'Lei nº 13.105' && uniqueTags.includes('Cód. Processo Civil')) return false;
    if (t === 'Lei nº 8.078' && uniqueTags.includes('CDC')) return false;
    if (t === 'Lei nº 8.069' && uniqueTags.includes('ECA')) return false;
    if (t === 'Lei nº 11.340' && uniqueTags.includes('Maria da Penha')) return false;
    if (t === 'Lei nº 11.343' && uniqueTags.includes('Lei de Drogas')) return false;
    if (t === 'Lei nº 9.503' && uniqueTags.includes('CTB')) return false;
    if (t === 'Lei nº 10.741' && uniqueTags.includes('Estatuto da Pessoa Idosa')) return false;
    return true;
  });

  return tagsFinais;
}

export async function fetchProposicaoDetalhe(id: string) {
  const cacheKey = `propDetalhe:${id}`;
  const hit = cached<any>(cacheKey);
  if (hit) return hit;
  const url = `${CAMARA_API}/proposicoes/${id}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json.dados;
  if (result) setCache(cacheKey, result);
  return result;
}

export async function fetchProposicaoTramitacoes(id: string) {
  const cacheKey = `propTram:${id}`;
  const hit = cached<any[]>(cacheKey);
  if (hit) return hit;
  const url = `${CAMARA_API}/proposicoes/${id}/tramitacoes`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  const result = json.dados || [];
  setCache(cacheKey, result);
  return result;
}

export async function fetchProposicaoAutores(id: string) {
  const cacheKey = `propAutores:${id}`;
  const hit = cached<any[]>(cacheKey);
  if (hit) return hit;
  const url = `${CAMARA_API}/proposicoes/${id}/autores`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  const result = json.dados || [];
  setCache(cacheKey, result);
  return result;
}

// ---- VOTAÇÕES ----
export async function fetchVotacoes() {
  const cacheKey = 'votacoes';
  const hit = cached<any[]>(cacheKey);
  if (hit) return hit;
  const { data, error } = await (supabase as any).from('radar_votacoes')
    .select('*')
    .order('data', { ascending: false })
    .limit(50);
  
  if (error || !data || data.length === 0) {
    const url = `${CAMARA_API}/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro&itens=50`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.dados || []).map((v: any) => ({
      id_externo: String(v.id),
      fonte: 'camara',
      data: v.dataHoraRegistro,
      descricao: v.descricao,
      resultado: v.aprovacao === 1 ? 'Aprovado' : v.aprovacao === 0 ? 'Rejeitado' : null,
      dados_json: v,
    }));
  }
  
  setCache(cacheKey, data);
  return data;
}

export async function fetchVotacaoVotos(id: string) {
  const url = `${CAMARA_API}/votacoes/${id}/votos`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.dados || [];
}



// ---- HELPER: UFs e Partidos ----
export const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];
