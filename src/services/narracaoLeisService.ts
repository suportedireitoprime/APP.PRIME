/**
 * Serviço de Narração de Leis e Automação Cron.
 * Gerencia catálogo de status, prévia de vozes, geração fatiada por blocos e fila de automação.
 */

import { supabase } from '@/integrations/supabase/client';
import { parseArtigoEmPartes, type ArtigoParte, type ArtigoEstruturado } from '@/utils/artigoPartesParser';
import type { ArtigoLei } from '@/data/mockData';

export interface VozTTS {
  id: string;
  nome: string;
  genero: 'F' | 'M';
  descricao: string;
  destaque?: boolean;
}

export const VOZES_DISPONIVEIS: VozTTS[] = [
  { id: 'Kore', nome: 'Kore', genero: 'F', descricao: 'Feminina · Firme, confiante e professoral', destaque: true },
  { id: 'Sulafat', nome: 'Sulafat', genero: 'F', descricao: 'Feminina · Calorosa, envolvente e didática', destaque: true },
  { id: 'Aoede', nome: 'Aoede', genero: 'F', descricao: 'Feminina · Leve, clara e pausada' },
  { id: 'Leda', nome: 'Leda', genero: 'F', descricao: 'Feminina · Jovem, enérgica e dinâmica' },
  { id: 'Zephyr', nome: 'Zephyr', genero: 'F', descricao: 'Feminina · Brilhante e articulada' },
  { id: 'Puck', nome: 'Puck', genero: 'M', descricao: 'Masculina · Dinâmico, animado e engajador', destaque: true },
  { id: 'Charon', nome: 'Charon', genero: 'M', descricao: 'Masculina · Grave, solene e judiciária', destaque: true },
  { id: 'Fenrir', nome: 'Fenrir', genero: 'M', descricao: 'Masculina · Energética e vigorosa' },
  { id: 'Orus', nome: 'Orus', genero: 'M', descricao: 'Masculina · Firme, equilibrada e institucional' },
  { id: 'Enceladus', nome: 'Enceladus', genero: 'M', descricao: 'Masculina · Calma, explicativa e pausada' },
  { id: 'Iapetus', nome: 'Iapetus', genero: 'M', descricao: 'Masculina · Séria e acadêmica' },
];

export const ESTILOS_TOM = [
  { id: 'animado', label: 'Animado & Professoral (Padrão)', prompt: 'Animado e envolvente, como uma professora jovem apaixonada por Direito explicando aos seus alunos' },
  { id: 'solene', label: 'Solene & Formal (Judiciário)', prompt: 'Solene, formal, respeitoso e pausado, com dicção jurídica tradicional' },
  { id: 'didatico', label: 'Didático para Concursos (Pausado)', prompt: 'Didático, pausado e muito claro, enfatizando os artigos, incisos e penas para fixação' },
  { id: 'acelerado', label: 'Direto & Dinâmico (Revisão Rápida)', prompt: 'Dinâmico, direto e ágil para revisão rápida de legislação' },
];

export const AMOSTRAS_TESTE = [
  {
    titulo: 'Art. 121 CP (Homicídio Simples)',
    texto: 'Artigo cento e vinte e um. Matar alguém: Pena - reclusão, de seis a vinte anos.',
  },
  {
    titulo: 'Art. 155, § 4º, I CP (Furto Qualificado)',
    texto: 'Parágrafo quarto. A pena é de reclusão de dois a oito anos, e multa, se o crime é cometido: Inciso primeiro. Com destruição ou rompimento de obstáculo à subtração da coisa.',
  },
  {
    titulo: 'Art. 171 CP (Estelionato)',
    texto: 'Artigo cento e setenta e um. Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou mantendo alguém em erro, mediante artifício, ardil, ou qualquer outro meio fraudulento.',
  },
  {
    titulo: 'Art. 5º CF/88 (Direitos Fundamentais)',
    texto: 'Artigo quinto. Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade e à igualdade.',
  },
];

export interface NarracaoArtigoRegistro {
  artigo_numero: string;
  audio_url: string;
  partes?: ArtigoParte[];
  created_at?: string;
}

export interface ConfigAutomacao {
  id: number;
  ativa: boolean;
  intervalo_minutos: number;
  lei_id: string;
  tabela_nome: string;
  prioridade: 'artigos_maiores' | 'ordem' | 'mais_curtos';
  voz_padrao: string;
  estilo_tom: string;
  lote_tamanho: number;
  artigos_gerados_total: number;
  ultimo_disparo: string | null;
  ultimo_artigo_gerado: string | null;
  ultimo_status: string | null;
}

export interface LogAutomacao {
  id: string;
  timestamp: string;
  tabela_nome: string;
  artigo_numero: string;
  partes_geradas: number;
  status: 'sucesso' | 'erro';
  mensagem: string | null;
  duracao_ms: number | null;
}

/**
 * Consulta quais artigos de uma lei já possuem narração salva no banco de dados.
 */
export async function buscarStatusNarracoes(tabelaNome: string): Promise<Record<string, NarracaoArtigoRegistro>> {
  try {
    const { data, error } = await supabase
      .from('narracoes_artigos')
      .select('artigo_numero, audio_url, word_timings, created_at')
      .eq('tabela_nome', tabelaNome);

    if (error) {
      console.warn('[narracaoLeisService] Erro ao buscar narracoes_artigos:', error);
      return {};
    }

    const mapa: Record<string, NarracaoArtigoRegistro> = {};
    (data || []).forEach((row: any) => {
      const num = String(row.artigo_numero).trim();
      let partes: ArtigoParte[] | undefined;
      if (row.word_timings && typeof row.word_timings === 'object' && Array.isArray(row.word_timings.partes)) {
        partes = row.word_timings.partes;
      }
      mapa[num] = {
        artigo_numero: num,
        audio_url: row.audio_url,
        partes,
        created_at: row.created_at,
      };
    });

    return mapa;
  } catch (err) {
    console.error('[narracaoLeisService] Exceção ao consultar narracoes_artigos:', err);
    return {};
  }
}

export interface TesteAudioRegistro {
  id: string;
  voz: string;
  estilo_id: string;
  estilo_nome?: string;
  texto: string;
  texto_hash: string;
  audio_url: string;
  storage_path: string;
  duracao_segundos?: number;
  created_at?: string;
}

/**
 * Gera hash determinístico e compacto do texto para chave de cache.
 */
export function gerarTextoHash(texto: string): string {
  const limpo = texto.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < limpo.length; i++) {
    const char = limpo.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const prefixo = limpo.slice(0, 15).replace(/[^a-z0-9]/g, '_');
  return `${prefixo}_${Math.abs(hash)}_${limpo.length}`;
}

/**
 * Busca prévias de áudio em cache no Supabase para a voz e texto informados.
 */
export async function buscarTestesCache(voz: string, texto: string): Promise<Record<string, TesteAudioRegistro>> {
  if (!texto.trim()) return {};
  const hash = gerarTextoHash(texto);

  try {
    const { data, error } = await supabase
      .from('narracao_testes_cache')
      .select('*')
      .eq('voz', voz)
      .eq('texto_hash', hash);

    if (error) {
      console.warn('[narracaoLeisService] Erro ao buscar narracao_testes_cache:', error);
      return {};
    }

    const mapa: Record<string, TesteAudioRegistro> = {};
    (data || []).forEach((item: any) => {
      if (item.estilo_id) {
        mapa[item.estilo_id] = item as TesteAudioRegistro;
      }
    });
    return mapa;
  } catch (err) {
    console.warn('[narracaoLeisService] Exceção ao consultar narracao_testes_cache:', err);
    return {};
  }
}

/**
 * Gera e salva a prévia de áudio no Supabase Storage e na tabela narracao_testes_cache.
 * Se já existir em cache, reaproveita sem gastar cota.
 */
export async function gerarESalvarPreviaAudio(
  texto: string,
  voz: string,
  estiloId: string,
  estiloPrompt: string,
  estiloLabel: string
): Promise<TesteAudioRegistro> {
  const hash = gerarTextoHash(texto);
  const cacheId = `${voz}_${estiloId}_${hash}`;

  // 1. Verifica se já está salvo no banco
  try {
    const { data: existente } = await supabase
      .from('narracao_testes_cache')
      .select('*')
      .eq('id', cacheId)
      .maybeSingle();

    if (existente?.audio_url) {
      return existente as TesteAudioRegistro;
    }
  } catch (e) {
    console.warn('[gerarESalvarPreviaAudio] Aviso ao checar cache:', e);
  }

  // 2. Dispara geração via Edge Function
  const { data, error } = await supabase.functions.invoke('narracao', {
    body: { fn: 'blog_preview', texto: texto.slice(0, 1500), voz, estilo: estiloPrompt },
  });

  if (error || !data?.audio_data_url) {
    throw new Error(error?.message || data?.error || 'Erro ao gerar prévia de áudio');
  }

  const dataUrl: string = data.audio_data_url;
  let finalAudioUrl = dataUrl;
  const storagePath = `narracoes/testes_vozes/${voz.toLowerCase()}/${estiloId}_${hash}.wav`;

  // 3. Faz upload para o bucket público 'audios'
  try {
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();

    const { error: upErr } = await supabase.storage
      .from('audios')
      .upload(storagePath, blob, { contentType: 'audio/wav', upsert: true });

    if (!upErr) {
      const { data: publicData } = supabase.storage.from('audios').getPublicUrl(storagePath);
      if (publicData?.publicUrl) {
        finalAudioUrl = publicData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[gerarESalvarPreviaAudio] Aviso ao salvar no storage audios:', err);
  }

  // 4. Salva no banco de dados na tabela narracao_testes_cache
  const registro: TesteAudioRegistro = {
    id: cacheId,
    voz,
    estilo_id: estiloId,
    estilo_nome: estiloLabel,
    texto: texto.slice(0, 1500),
    texto_hash: hash,
    audio_url: finalAudioUrl,
    storage_path: storagePath,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('narracao_testes_cache').upsert(registro);
  } catch (dbErr) {
    console.warn('[gerarESalvarPreviaAudio] Erro ao persistir registro no banco:', dbErr);
  }

  return registro;
}

/**
 * Apaga a prévia de áudio da tabela narracao_testes_cache e do Supabase Storage.
 */
export async function apagarPreviaAudio(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try {
      await supabase.storage.from('audios').remove([storagePath]);
    } catch (err) {
      console.warn('[apagarPreviaAudio] Erro ao remover do storage:', err);
    }
  }

  const { error } = await supabase.from('narracao_testes_cache').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Falha ao excluir prévia do banco');
  }
}

/**
 * Apaga a narração de um artigo da tabela narracoes_artigos e remove os áudios do Storage.
 */
export async function apagarNarracaoArtigo(tabelaNome: string, artigoNumero: string): Promise<void> {
  // Busca o registro para obter partes com paths do storage
  const { data: rows } = await supabase
    .from('narracoes_artigos')
    .select('word_timings')
    .eq('tabela_nome', tabelaNome)
    .eq('artigo_numero', artigoNumero)
    .limit(1);

  // Remove áudios do storage
  const row = rows?.[0];
  if (row?.word_timings && typeof row.word_timings === 'object' && Array.isArray((row.word_timings as any).partes)) {
    const partes = (row.word_timings as any).partes as ArtigoParte[];
    const storagePaths: string[] = [];
    for (const p of partes) {
      if (p.audioUrl && p.audioUrl.includes('/audios/')) {
        // Extrai o path relativo do storage a partir da URL
        const match = p.audioUrl.match(/\/audios\/([^?]+)/);
        if (match?.[1]) {
          storagePaths.push(decodeURIComponent(match[1]));
        }
      }
    }
    if (storagePaths.length > 0) {
      try {
        await supabase.storage.from('audios').remove(storagePaths);
      } catch (err) {
        console.warn('[apagarNarracaoArtigo] Erro ao remover do storage:', err);
      }
    }
  }

  // Remove registro do banco
  const { error } = await supabase
    .from('narracoes_artigos')
    .delete()
    .eq('tabela_nome', tabelaNome)
    .eq('artigo_numero', artigoNumero);

  if (error) {
    throw new Error(error.message || 'Falha ao excluir narração do banco');
  }
}

/**
 * Gera áudio de prévia para testar voz e tom instantaneamente.
 */
export async function testarVozAudio(texto: string, voz: string, estilo: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('narracao', {
    body: { fn: 'blog_preview', texto: texto.slice(0, 1500), voz, estilo },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao gerar prévia de áudio');
  }

  const url = (data as any)?.audio_data_url;
  if (!url) {
    throw new Error((data as any)?.error || 'Resposta sem áudio');
  }

  return url;
}

/**
 * Gera a narração de um artigo fatiada em partes (Caput, Pena, Parágrafos, Incisos).
 */
export async function gerarNarracaoArtigoFatiada(
  artigo: ArtigoLei,
  tabelaNome: string,
  leiNome: string,
  voz: string,
  estilo: string,
  onProgress?: (parteAtual: number, totalPartes: number, rotuloParte: string) => void
): Promise<{ audioUrl: string; partes: ArtigoParte[] }> {
  const estruturado: ArtigoEstruturado = parseArtigoEmPartes(artigo);
  const partesResultado: ArtigoParte[] = [];

  for (let i = 0; i < estruturado.partes.length; i++) {
    const parte = estruturado.partes[i];
    onProgress?.(i + 1, estruturado.partes.length, parte.rotulo);

    // Gera áudio desta parte específica (com retry e delay entre partes para evitar rate limit)
    let data: any = null;
    let lastError: string | null = null;
    const MAX_RETRIES = 3;

    for (let tentativa = 0; tentativa < MAX_RETRIES; tentativa++) {
      if (tentativa > 0) {
        // Backoff exponencial: 3s, 6s, 12s
        const delayMs = 3000 * Math.pow(2, tentativa - 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      const res = await supabase.functions.invoke('narracao', {
        body: {
          fn: 'blog_preview',
          texto: parte.textoTTS.slice(0, 1500),
          voz,
          estilo,
        },
      });

      if (!res.error && res.data?.audio_data_url) {
        data = res.data;
        lastError = null;
        break;
      }

      lastError = res.error?.message || res.data?.error || 'Sem áudio gerado';
      console.warn(`[gerarNarracaoArtigoFatiada] Tentativa ${tentativa + 1}/${MAX_RETRIES} falhou para ${parte.rotulo}: ${lastError}`);
    }

    if (!data?.audio_data_url) {
      throw new Error(`Falha ao gerar parte ${parte.rotulo}: ${lastError || 'Sem áudio gerado'}`);
    }

    // Delay de 1.5s entre partes para evitar rate limit do Gemini
    if (i < estruturado.partes.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const audioDataUrl = data.audio_data_url;
    let finalAudioUrl = audioDataUrl;

    // Faz upload para o bucket audios
    try {
      const resp = await fetch(audioDataUrl);
      const blob = await resp.blob();
      const safeNum = String(artigo.numero).replace(/[^a-zA-Z0-9]/g, '_');
      const storagePath = `narracoes/${tabelaNome}/fatiado/${safeNum}_${parte.id}.wav`;

      const { error: upErr } = await supabase.storage
        .from('audios')
        .upload(storagePath, blob, { contentType: 'audio/wav', upsert: true });

      if (!upErr) {
        const { data: signed } = await supabase.storage
          .from('audios')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 5);
        if (signed?.signedUrl) {
          finalAudioUrl = signed.signedUrl;
        }
      }
    } catch (e) {
      console.warn('[gerarNarracaoArtigoFatiada] Falha ao persistir parte no storage, usando data URL:', e);
    }

    partesResultado.push({
      ...parte,
      audioUrl: finalAudioUrl,
    });
  }

  const audioPrincipal = partesResultado[0]?.audioUrl || '';

  // Persiste no banco de dados na tabela narracoes_artigos
  const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
  const { error: dbErr } = await supabase.from('narracoes_artigos').upsert(
    {
      tabela_nome: tabelaNome,
      artigo_numero: numLimpo,
      lei_nome: leiNome,
      titulo_artigo: artigo.titulo || null,
      audio_url: audioPrincipal,
      word_timings: { partes: partesResultado } as any,
    },
    { onConflict: 'tabela_nome,artigo_numero' }
  );

  if (dbErr) {
    console.warn('[gerarNarracaoArtigoFatiada] Aviso ao salvar narracoes_artigos:', dbErr);
  }

  return {
    audioUrl: audioPrincipal,
    partes: partesResultado,
  };
}

/**
 * Lê a configuração atual da automação cron
 */
export async function obterConfigAutomacao(): Promise<ConfigAutomacao> {
  const { data, error } = await supabase
    .from('narracao_leis_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return {
      id: 1,
      ativa: false,
      intervalo_minutos: 10,
      lei_id: 'cp',
      tabela_nome: 'CP_CODIGO_PENAL',
      prioridade: 'artigos_maiores',
      voz_padrao: 'Kore',
      estilo_tom: 'Animado e envolvente, como professora jovem de Direito',
      lote_tamanho: 1,
      artigos_gerados_total: 0,
      ultimo_disparo: null,
      ultimo_artigo_gerado: null,
      ultimo_status: null,
    };
  }

  return data as ConfigAutomacao;
}

/**
 * Salva as configurações de automação no banco
 */
export async function salvarConfigAutomacao(cfg: Partial<ConfigAutomacao>): Promise<boolean> {
  const { error } = await supabase
    .from('narracao_leis_config')
    .update({ ...cfg, updated_at: new Date().toISOString() })
    .eq('id', 1);

  return !error;
}

/**
 * Dispara ou agenda o cron job no Supabase (pg_cron)
 */
export async function dispararDeployCron(intervaloMin: number, habilitar: boolean): Promise<any> {
  const { data, error } = await supabase.rpc('admin_deploy_narracao_cron', {
    intervalo_min: intervaloMin,
    habilitar,
  });

  if (error) {
    throw new Error(error.message || 'Falha ao agendar cron no Supabase');
  }

  return data;
}

/**
 * Dispara imediatamente a geração de 1 lote da automação (artigo de maior prioridade)
 */
export async function dispararAutomacaoLoteManual(params?: {
  tabelaNome?: string;
  prioridade?: string;
  voz?: string;
}): Promise<any> {
  const { data, error } = await supabase.functions.invoke('narracao-leis-automacao', {
    body: {
      manual: true,
      tabela_nome: params?.tabelaNome,
      prioridade: params?.prioridade || 'artigos_maiores',
      voz: params?.voz,
    },
  });

  if (error) {
    throw new Error(error.message || 'Falha ao executar ciclo manual de automação');
  }

  return data;
}

/**
 * Busca o histórico de logs da automação
 */
export async function buscarLogsAutomacao(limit = 25): Promise<LogAutomacao[]> {
  const { data, error } = await supabase
    .from('narracao_leis_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as LogAutomacao[];
}
