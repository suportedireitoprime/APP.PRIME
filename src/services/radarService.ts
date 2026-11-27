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

  let query = (supabase as any)
    .from('radar_deputados')
    .select('id,camara_id,nome,sigla_partido,sigla_uf,foto_url,email')
    .order('nome');
    
  if (busca) query = query.ilike('nome', `%${busca}%`);
  if (partido) query = query.eq('sigla_partido', partido);
  if (uf) query = query.eq('sigla_uf', uf);

  const { data, error } = await query;
  if (error || !data) return [];
  
  const mappedData = data.map((d: any) => ({
    ...d,
    id: d.camara_id // O frontend espera que id seja o ID da câmara
  }));
  
  setCache(cacheKey, mappedData);
  return mappedData;
}

export async function fetchDeputadoDetalhe(id: number) {
  try {
    const cacheKey = `depDetalheSupabase:${id}`;
    const hit = cached<any>(cacheKey);
    if (hit) return hit;

    const { data, error } = await (supabase as any)
      .from('radar_deputados')
      .select('dados_json')
      .eq('camara_id', id)
      .maybeSingle();

    if (error || !data?.dados_json?.detalhe) return null;

    const result = data.dados_json.detalhe;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Erro no fetchDeputadoDetalhe:", error);
    return null;
  }
}

export async function fetchDeputadoDespesas(id: number) {
  try {
    const cacheKey = `depDespesasSupabase:${id}`;
    const hit = cached<any[]>(cacheKey);
    if (hit) return hit;

    const { data, error } = await (supabase as any)
      .from('radar_deputados')
      .select('dados_json')
      .eq('camara_id', id)
      .maybeSingle();

    if (error || !data?.dados_json?.despesas) return [];

    const result = data.dados_json.despesas;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Erro no fetchDeputadoDespesas:", error);
    return [];
  }
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
    if (dataInicio) url += `&dataApresentacaoInicio=${dataInicio}`;
    if (dataFim) url += `&dataApresentacaoFim=${dataFim}`;
    
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

// ============================================================================
// NOVO RADAR LEGISLATIVO (Câmara dos Deputados + Senado Federal)
// ============================================================================

export type RadarTriagemStage = 'sanction_veto' | 'approved_house' | 'in_progress';

export interface RadarAutor {
  id?: number | string;
  nome: string;
  tipo?: string;
  partido?: string;
  uf?: string;
  foto_url?: string;
  casa: 'camara' | 'senado';
}

export interface RadarProposicao {
  id: string;
  casa: 'camara' | 'senado';
  siglaTipo: string;
  numero: string | number;
  ano: number;
  ementa: string;
  dataApresentacao?: string;
  situacao?: string;
  triagem: RadarTriagemStage;
  autores: RadarAutor[];
  urlInteiroTeor?: string;
  urlOficial?: string;
  tags: string[];
}

export function classificarTriagem(situacao?: string | null, despacho?: string | null): RadarTriagemStage {
  const txt = `${situacao || ''} ${despacho || ''}`.toLowerCase();
  if (
    txt.includes('sanção') ||
    txt.includes('sancao') ||
    txt.includes('veto') ||
    txt.includes('transformada no') ||
    txt.includes('aguardando sanção') ||
    txt.includes('enviada à sanção') ||
    txt.includes('promulgação') ||
    txt.includes('pronta para sanção')
  ) {
    return 'sanction_veto';
  }
  if (
    txt.includes('aprovad') ||
    txt.includes('remetida ao senado') ||
    txt.includes('remetida à câmara') ||
    txt.includes('apreciad') ||
    txt.includes('pronta para pauta') ||
    txt.includes('urgência') ||
    txt.includes('plenário')
  ) {
    return 'approved_house';
  }
  return 'in_progress';
}

function extrairIdDeputadoUri(uri?: string | null): number | undefined {
  if (!uri) return undefined;
  const match = uri.match(/\/deputados\/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function fotoDeputadoUrl(id?: number): string | undefined {
  if (!id) return undefined;
  return `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`;
}

function normName(s?: string | null): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function mapInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const res = await Promise.all(chunk.map(fn));
    out.push(...res);
  }
  return out;
}

async function enriquecerAutoresCamara(
  propId: string,
  deputadosMap: Map<number, any>,
  deputadosByName?: Map<string, any>
): Promise<{ autores: RadarAutor[]; situacao?: string; despacho?: string; urlInteiroTeor?: string }> {
  try {
    const [detRes, autRes] = await Promise.all([
      fetch(`${CAMARA_API}/proposicoes/${propId}`, { headers: { Accept: 'application/json' } }),
      fetch(`${CAMARA_API}/proposicoes/${propId}/autores`, { headers: { Accept: 'application/json' } }),
    ]);

    const detJson = detRes.ok ? await detRes.json() : null;
    const autJson = autRes.ok ? await autRes.json() : null;

    const det = detJson?.dados;
    const statusProp = det?.statusProposicao;
    const situacao = statusProp?.descricaoSituacao || statusProp?.descricaoTramitacao || undefined;
    const despacho = statusProp?.despacho || undefined;
    const urlInteiroTeor = det?.urlInteiroTeor || undefined;

    const autoresRaw: any[] = autJson?.dados || [];
    const autores: RadarAutor[] = autoresRaw.slice(0, 3).map((a) => {
      const depId = extrairIdDeputadoUri(a.uri);
      const depCache =
        (depId ? deputadosMap.get(depId) : undefined) ||
        (deputadosByName && a.nome ? deputadosByName.get(normName(a.nome)) : undefined);
      const resolvedId = depId || (depCache?.id ? Number(depCache.id) : undefined);
      return {
        id: resolvedId,
        nome: a.nome || depCache?.nome || 'Câmara dos Deputados',
        tipo: a.tipo,
        partido: depCache?.sigla_partido,
        uf: depCache?.sigla_uf,
        foto_url: depCache?.foto_url || fotoDeputadoUrl(resolvedId),
        casa: 'camara',
      };
    });

    return { autores, situacao, despacho, urlInteiroTeor };
  } catch {
    return { autores: [] };
  }
}

/**
 * Busca últimas proposições na Câmara dos Deputados com autores, fotos e triagem.
 */
export async function fetchUltimasProposicoesCamara(opts?: {
  siglaTipo?: string;
  itens?: number;
  pagina?: number;
}): Promise<RadarProposicao[]> {
  const siglaTipo = opts?.siglaTipo || 'PL,PEC,PLP,MPV';
  const itens = opts?.itens ?? 10;
  const pagina = opts?.pagina ?? 1;
  const cacheKey = `radar_v2:camara:${siglaTipo}:${itens}:${pagina}`;
  const hit = cached<RadarProposicao[]>(cacheKey);
  if (hit) return hit;

  try {
    const deps = await fetchDeputados();
    const depMap = new Map<number, any>();
    const depByName = new Map<string, any>();
    deps.forEach((d: any) => {
      if (d.id) depMap.set(Number(d.id), d);
      if (d.nome) depByName.set(normName(d.nome), d);
    });

    const anoAtual = new Date().getFullYear();
    const url = `${CAMARA_API}/proposicoes?siglaTipo=${encodeURIComponent(siglaTipo)}&ano=${anoAtual}&ordem=DESC&ordenarPor=id&itens=${itens}&pagina=${pagina}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    const rawList: any[] = json?.dados || [];

    const enriched = await mapInBatches(rawList, 4, async (p) => {
      const idStr = String(p.id);
      const extra = await enriquecerAutoresCamara(idStr, depMap, depByName);
      return {
        id: idStr,
        casa: 'camara' as const,
        siglaTipo: p.siglaTipo,
        numero: p.numero,
        ano: p.ano,
        ementa: p.ementa || 'Sem ementa disponível.',
        situacao: extra.situacao || 'Em tramitação na Câmara',
        triagem: classificarTriagem(extra.situacao, extra.despacho),
        autores: extra.autores,
        urlInteiroTeor: extra.urlInteiroTeor,
        urlOficial: `https://www.camara.leg.br/propostas-legislativas/${idStr}`,
        tags: extractTags(p.ementa),
      } satisfies RadarProposicao;
    });

    setCache(cacheKey, enriched);
    return enriched;
  } catch (err) {
    console.warn('[radarService] Erro em fetchUltimasProposicoesCamara:', err);
    return [];
  }
}

/**
 * Busca emendas recentes apresentadas na Câmara dos Deputados.
 */
export async function fetchEmendasRecentes(itens = 10): Promise<RadarProposicao[]> {
  return fetchUltimasProposicoesCamara({
    siglaTipo: 'EMD,EMC,EMP',
    itens,
    pagina: 1,
  });
}

/**
 * Busca proposições em estágio avançado (Aprovadas / Aguardando Sanção ou Veto) via tramitação recente.
 */
export async function fetchProposicoesProximasLei(): Promise<RadarProposicao[]> {
  const cacheKey = 'radar_v2:proximas_lei';
  const hit = cached<RadarProposicao[]>(cacheKey);
  if (hit) return hit;

  try {
    const deps = await fetchDeputados();
    const depMap = new Map<number, any>();
    deps.forEach((d: any) => {
      if (d.id) depMap.set(Number(d.id), d);
    });

    // Busca votações recentes na Câmara para encontrar proposições que avançaram / foram aprovadas
    const votRes = await fetch(`${CAMARA_API}/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro&itens=20`, {
      headers: { Accept: 'application/json' },
    });
    const votJson = votRes.ok ? await votRes.json() : { dados: [] };
    const votacoes: any[] = votJson?.dados || [];

    const propIds = new Set<string>();
    for (const v of votacoes) {
      const uri = v.uriProposicaoObjeto as string | undefined;
      const m = uri?.match(/\/proposicoes\/(\d+)/);
      if (m) propIds.add(m[1]);
      if (propIds.size >= 10) break;
    }

    const list = await Promise.all(
      Array.from(propIds).map(async (idStr) => {
        const extra = await enriquecerAutoresCamara(idStr, depMap);
        const detRes = await fetch(`${CAMARA_API}/proposicoes/${idStr}`, { headers: { Accept: 'application/json' } });
        const det = detRes.ok ? (await detRes.json())?.dados : null;
        if (!det) return null;
        const statusProp = det.statusProposicao;
        const sit = extra.situacao || statusProp?.descricaoSituacao || 'Votada em Plenário';
        return {
          id: idStr,
          casa: 'camara' as const,
          siglaTipo: det.siglaTipo,
          numero: det.numero,
          ano: det.ano,
          ementa: det.ementa || 'Proposição em fase decisória.',
          situacao: sit,
          triagem: classificarTriagem(sit, statusProp?.despacho),
          autores: extra.autores,
          urlInteiroTeor: det.urlInteiroTeor,
          urlOficial: `https://www.camara.leg.br/propostas-legislativas/${idStr}`,
          tags: extractTags(det.ementa),
        } satisfies RadarProposicao;
      })
    );

    const valid = list.filter(Boolean) as RadarProposicao[];
    setCache(cacheKey, valid);
    return valid;
  } catch (err) {
    console.warn('[radarService] Erro em fetchProposicoesProximasLei:', err);
    return [];
  }
}

/**
 * Busca matérias recentes atualizadas no Senado Federal.
 */
export async function fetchProposicoesSenado(limit = 12): Promise<RadarProposicao[]> {
  const cacheKey = `radar_v2:senado:${limit}`;
  const hit = cached<RadarProposicao[]>(cacheKey);
  if (hit) return hit;

  try {
    const [res, sens] = await Promise.all([
      fetch(`${SENADO_API}/materia/atualizadas.json?numdias=15`, {
        headers: { Accept: 'application/json' },
      }),
      fetchSenadores(),
    ]);
    if (!res.ok) return [];
    const json = await res.json();
    const materiasRaw: any[] = json?.ListaMateriasAtualizadas?.Materias?.Materia || [];

    const senByName = new Map<string, any>();
    sens.forEach((s: any) => {
      if (s.nome) senByName.set(normName(s.nome), s);
    });

    const mapped: RadarProposicao[] = materiasRaw.slice(0, limit).map((m: any) => {
      const id = String(m.Codigo || m.IdentificacaoMateria?.CodigoMateria || '');
      const sigla = m.Sigla || m.IdentificacaoMateria?.SiglaSubtipoMateria || 'PLS';
      const num = m.Numero || m.IdentificacaoMateria?.NumeroMateria || '';
      const ano = Number(m.Ano || m.IdentificacaoMateria?.AnoMateria || new Date().getFullYear());
      const ementa = m.Ementa || m.DadosBasicosMateria?.EmentaMateria || 'Matéria legislativa do Senado Federal.';
      const sit = m.SituacaoAtual?.Autuacoes?.Autuacao?.Situacao?.DescricaoSituacao || 'Em tramitação no Senado';
      const autorNome = m.Autor || m.DadosBasicosMateria?.AutorPrincipal || 'Senado Federal';

      // Tenta encontrar foto do senador cruzando pelo nome
      const firstAuthor = String(autorNome).split(',')[0].replace(/Senador(a)?\s+/i, '').trim();
      const senMatch = senByName.get(normName(firstAuthor));

      return {
        id: `sen-${id}`,
        casa: 'senado',
        siglaTipo: sigla,
        numero: num,
        ano,
        ementa,
        dataApresentacao: m.DataUltimaAtualizacao,
        situacao: sit,
        triagem: classificarTriagem(sit),
        autores: [
          {
            id: senMatch?.codigo,
            nome: firstAuthor || autorNome,
            partido: senMatch?.sigla_partido,
            uf: senMatch?.sigla_uf,
            foto_url: senMatch?.foto_url,
            casa: 'senado',
          },
        ],
        urlOficial: id ? `https://www25.senado.leg.br/web/atividade/materias/-/materia/${id}` : undefined,
        tags: extractTags(ementa),
      };
    });

    setCache(cacheKey, mapped);
    return mapped;
  } catch (err) {
    console.warn('[radarService] Erro em fetchProposicoesSenado:', err);
    return [];
  }
}

/**
 * Busca proposições apresentadas por um deputado específico na Câmara.
 */
export async function fetchProposicoesDoDeputado(camaraId: number): Promise<RadarProposicao[]> {
  const cacheKey = `radar_v2:dep_props:${camaraId}`;
  const hit = cached<RadarProposicao[]>(cacheKey);
  if (hit) return hit;

  try {
    const url = `${CAMARA_API}/proposicoes?idDeputadoAutor=${camaraId}&ordem=DESC&ordenarPor=id&itens=15`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: any[] = json?.dados || [];

    const mapped: RadarProposicao[] = raw.map((p) => ({
      id: String(p.id),
      casa: 'camara',
      siglaTipo: p.siglaTipo,
      numero: p.numero,
      ano: p.ano,
      ementa: p.ementa || 'Proposição legislativa.',
      situacao: 'Proposição do parlamentar',
      triagem: 'in_progress',
      autores: [{ id: camaraId, nome: 'Autor', foto_url: fotoDeputadoUrl(camaraId), casa: 'camara' }],
      urlOficial: `https://www.camara.leg.br/propostas-legislativas/${p.id}`,
      tags: extractTags(p.ementa),
    }));

    setCache(cacheKey, mapped);
    return mapped;
  } catch {
    return [];
  }
}

/**
 * Busca matérias de autoria de um senador específico no Senado Federal.
 */
export async function fetchProposicoesDoSenador(codigoSenador: string | number): Promise<RadarProposicao[]> {
  const cacheKey = `radar_v2:sen_props:${codigoSenador}`;
  const hit = cached<RadarProposicao[]>(cacheKey);
  if (hit) return hit;

  try {
    const res = await fetch(`${SENADO_API}/senador/${codigoSenador}/autorias.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const autorias: any[] = json?.MateriasAutoriaParlamentar?.Parlamentar?.Autorias?.Autoria || [];

    const mapped: RadarProposicao[] = autorias.slice(0, 15).map((a: any) => {
      const m = a.Materia || {};
      const id = String(m.Codigo || '');
      return {
        id: `sen-${id}`,
        casa: 'senado',
        siglaTipo: m.Sigla || 'PLS',
        numero: m.Numero || '',
        ano: Number(m.Ano || new Date().getFullYear()),
        ementa: m.Ementa || 'Matéria de autoria do senador.',
        situacao: a.IndicadorAutorPrincipal === 'Sim' ? 'Autor principal' : 'Coautor / Emenda',
        triagem: 'in_progress',
        autores: [{ id: codigoSenador, nome: 'Senador(a)', casa: 'senado' }],
        urlOficial: id ? `https://www25.senado.leg.br/web/atividade/materias/-/materia/${id}` : undefined,
        tags: extractTags(m.Ementa),
      };
    });

    setCache(cacheKey, mapped);
    return mapped;
  } catch {
    return [];
  }
}
