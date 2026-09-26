/**
 * Serviço de Narração de Leis e Automação Cron.
 * Gerencia catálogo de status, prévia de vozes, geração fatiada por blocos e fila de automação.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  parseArtigoEmNarracaoContinua,
  parseArtigoEmPartes,
  type ArtigoParte,
  type ArtigoEstruturado,
} from '@/utils/artigoPartesParser';
import { obterAliasesTabela, obterVariantesArtigoNumero } from '@/utils/narracaoLookup';
import { deleteCachedAudioVariantes } from '@/services/audioOfflineCache';
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
  { id: 'super_animado', label: 'Super Animado & Fluido (Padrão)', prompt: 'Super animado, vibrante, extremamente fluido, expressivo e cativante, tornando o estudo de Direito leve, envolvente e memorável' },
  { id: 'animado', label: 'Animado & Professoral', prompt: 'Animado e envolvente, como uma professora jovem apaixonada por Direito explicando aos seus alunos' },
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
  duracao_segundos?: number;
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
  leis_ativas?: string[];
  indice_lei_atual?: number;
}

/**
 * Artigos de altíssima relevância e frequência em exames (OAB, Concursos Públicos e Prática Forense)
 */
export const MAPA_TOP_PROVAS: Record<string, string[]> = {
  CP_CODIGO_PENAL: [
    '1', '2', '5', '13', '14', '18', '20', '21', '23', '24', '25', '28', '29', '59',
    '69', '70', '71', '107', '109', '121', '129', '147', '155', '157', '171', '213',
    '217-A', '288', '297', '299', '312', '316', '317', '319', '333',
  ],
  CC_CODIGO_CIVIL: [
    '1', '2', '3', '4', '5', '11', '12', '50', '104', '138', '145', '151', '156', '157',
    '158', '166', '186', '187', '205', '206', '389', '395', '421', '422', '927', '932',
    '944', '1196', '1228', '1238', '1240', '1511', '1694', '1784',
  ],
  CF88_CONSTITUICAO_FEDERAL: [
    '1', '2', '3', '4', '5', '6', '12', '14', '18', '21', '22', '24', '37', '38', '39',
    '40', '41', '102', '103', '105', '133', '144', '150',
  ],
  CPC_CODIGO_PROCESSO_CIVIL: [
    '1', '4', '6', '9', '10', '85', '219', '300', '311', '319', '335', '355', '356',
    '485', '487', '994', '1003', '1015', '1022',
  ],
  CPP_CODIGO_PROCESSO_PENAL: [
    '4', '5', '6', '24', '28', '155', '156', '157', '282', '283', '310', '311', '312',
    '315', '316', '396', '397', '406', '413', '414', '415', '581', '593', '647', '648',
  ],
  CLT_CONSOLIDACAO_LEIS_TRABALHO: [
    '2', '3', '7', '58', '59', '71', '442', '443', '468', '477', '482', '483', '840',
    '893', '895',
  ],
  CDC_CODIGO_DEFESA_CONSUMIDOR: [
    '2', '3', '6', '12', '14', '18', '26', '27', '39', '51', '66', '67',
  ],
  ECA_ESTATUTO_CRIANCA_ADOLESCENTE: [
    '1', '2', '3', '4', '18', '103', '104', '105', '112', '121', '122', '131', '225', '244-A',
  ],
  CTN_CODIGO_TRIBUTARIO_NACIONAL: [
    '3', '9', '97', '108', '113', '114', '121', '128', '142', '150', '151', '156', '173', '174',
  ],
  CTB_CODIGO_TRANSITO_BRASILEIRO: [
    '165', '165-A', '291', '302', '303', '306', '308', '309', '310', '311',
  ],
  EI_ESTATUTO_IDOSO: [
    '1', '2', '3', '4', '96', '97', '98', '99', '100', '102',
  ],
  EOAB_ESTATUTO_OAB: [
    '1', '2', '3', '7', '7-A', '7-B', '22', '34', '35', '36', '38',
  ],
};

/**
 * Calcula a prioridade combinada de um artigo:
 * Top Prova (+50.000 pontos) + extensão em caracteres
 */
export function calcularScoreArtigo(
  artigo: { numero?: string | number; texto?: string; caput?: string; titulo?: string },
  tabelaNome: string
): { score: number; isTopProva: boolean; lenChars: number } {
  const numLimpo = String(artigo.numero || '')
    .replace(/^[Aa]rt\.?\s*/i, '')
    .replace(/[º°]/g, '')
    .trim();
  const topList = MAPA_TOP_PROVAS[tabelaNome] || [];
  const isTopProva = topList.includes(numLimpo);
  const textoTotal = artigo.texto || `${artigo.titulo || ''} ${artigo.caput || ''}`;
  const lenChars = textoTotal.trim().length;
  const score = (isTopProva ? 50000 : 0) + lenChars;
  return { score, isTopProva, lenChars };
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
    const aliases = obterAliasesTabela(tabelaNome);
    const { data, error } = await supabase
      .from('narracoes_artigos')
      .select('artigo_numero, audio_url, word_timings, created_at')
      .in('tabela_nome', aliases);

    if (error) {
      console.warn('[narracaoLeisService] Erro ao buscar narracoes_artigos:', error);
      return {};
    }

    const mapa: Record<string, NarracaoArtigoRegistro> = {};
    (data || []).forEach((row: any) => {
      const num = String(row.artigo_numero).trim();
      const numDigitos = num.replace(/\D/g, '');
      let partes: ArtigoParte[] | undefined;
      let duracaoSegundos: number | undefined;
      if (row.word_timings && typeof row.word_timings === 'object') {
        if (Array.isArray(row.word_timings.partes)) {
          partes = row.word_timings.partes;
          const soma = partes.reduce((acc, p) => acc + (p.duracaoSegundos || 0), 0);
          if (soma > 0) duracaoSegundos = Math.round(soma * 10) / 10;
        }
        if (row.word_timings.duracao_segundos) {
          duracaoSegundos = Number(row.word_timings.duracao_segundos);
        }
      }
      const reg: NarracaoArtigoRegistro = {
        artigo_numero: num,
        audio_url: row.audio_url,
        partes,
        duracao_segundos: duracaoSegundos,
        created_at: row.created_at,
      };

      mapa[num] = reg;
      if (numDigitos) {
        mapa[numDigitos] = reg;
        mapa[`${numDigitos}º`] = reg;
        mapa[`${numDigitos}°`] = reg;
        mapa[`Art. ${numDigitos}`] = reg;
        mapa[`Art. ${numDigitos}º`] = reg;
      }
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

  let duracaoSegundos = 0;

  // 3. Faz upload para o bucket público 'audios'
  try {
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    const pcmBytes = Math.max(0, blob.size - 44);
    duracaoSegundos = Math.max(1, Math.round((pcmBytes / 48000) * 10) / 10);

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
    duracao_segundos: duracaoSegundos,
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
 * Apaga a narração de um artigo da tabela narracoes_artigos e remove todos os áudios do Storage.
 */
/**
 * Apaga a narração de um artigo da tabela narracoes_artigos, remove os áudios do Storage
 * e invalida todo o cache local offline (IndexedDB) para garantir que áudios antigos nunca voltem a tocar.
 */
export async function apagarNarracaoArtigo(tabelaNome: string, artigoNumero: string): Promise<void> {
  const aliasesTabela = obterAliasesTabela(tabelaNome);
  const variantes = obterVariantesArtigoNumero(artigoNumero);

  // 1. Limpa o cache persistente local (IndexedDB) de todas as variantes imediatamente
  await deleteCachedAudioVariantes(aliasesTabela, variantes);

  // 2. Invoca a Edge Function narracao (com service_role) para exclusão segura no DB e Storage
  try {
    const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('narracao', {
      body: {
        fn: 'apagar_narracao',
        tabela_nome: tabelaNome,
        artigo_numero: artigoNumero,
      },
    });

    if (!edgeErr && edgeRes?.success) {
      return;
    }
    if (edgeErr) {
      console.warn('[apagarNarracaoArtigo] Edge function avisou:', edgeErr);
    }
  } catch (invErr) {
    console.warn('[apagarNarracaoArtigo] Falha ao invocar edge function:', invErr);
  }

  // 3. Fallback direto no cliente (caso a Edge function oscile)
  const { data: rows } = await supabase
    .from('narracoes_artigos')
    .select('audio_url, word_timings')
    .in('tabela_nome', aliasesTabela)
    .in('artigo_numero', variantes);

  const storagePaths: string[] = [];

  (rows || []).forEach((row: any) => {
    if (row.audio_url && typeof row.audio_url === 'string' && row.audio_url.includes('/audios/')) {
      const match = row.audio_url.match(/\/audios\/([^?]+)/);
      if (match?.[1]) storagePaths.push(decodeURIComponent(match[1]));
    }
    if (row?.word_timings && typeof row.word_timings === 'object' && Array.isArray(row.word_timings.partes)) {
      const partes = row.word_timings.partes;
      for (const p of partes) {
        if (p.audioUrl && p.audioUrl.includes('/audios/')) {
          const match = p.audioUrl.match(/\/audios\/([^?]+)/);
          if (match?.[1]) storagePaths.push(decodeURIComponent(match[1]));
        }
      }
    }
  });

  const numLimpo = String(artigoNumero).replace(/^[Aa]rt\.?\s*/i, '').trim();
  const numDigitos = numLimpo.replace(/\D/g, '');

  const safeNums = Array.from(new Set([
    numLimpo.replace(/[^a-zA-Z0-9]/g, '_'),
    numDigitos,
  ].filter(Boolean)));

  for (const t of aliasesTabela) {
    for (const s of safeNums) {
      storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_completo.wav`);
      storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_1.wav`);
      storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_2.wav`);
      storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_parte_3.wav`);
      storagePaths.push(`narracoes/${t}/fatiado/${s}_art_${s}_caput.wav`);
      storagePaths.push(`narracoes/${t}/${s}.wav`);
    }
  }

  const pathsUnicos = Array.from(new Set(storagePaths.filter(Boolean)));
  if (pathsUnicos.length > 0) {
    try {
      await supabase.storage.from('audios').remove(pathsUnicos);
    } catch (err) {
      console.warn('[apagarNarracaoArtigo] Erro ao remover do storage:', err);
    }
  }

  // Deleta da tabela narracoes_artigos
  const { error } = await supabase
    .from('narracoes_artigos')
    .delete()
    .in('tabela_nome', aliasesTabela)
    .in('artigo_numero', variantes);

  if (error) {
    console.warn('[apagarNarracaoArtigo] Aviso ao deletar narracoes_artigos:', error);
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
 * Concatena múltiplos arquivos de áudio WAV (mesmo formato PCM 24kHz 16-bit mono) em um único WAV contínuo.
 */
export function concatenarWavs(blobsOrBuffers: Uint8Array[]): Uint8Array {
  if (blobsOrBuffers.length === 0) return new Uint8Array(0);
  if (blobsOrBuffers.length === 1) return blobsOrBuffers[0];

  const pcmChunks: Uint8Array[] = [];
  let totalPcmBytes = 0;

  for (const wav of blobsOrBuffers) {
    if (wav.length <= 44) continue;
    // Varre procurando o subchunk 'data'
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    let pcmOffset = 44;
    let pcmLength = wav.byteLength - 44;

    let offset = 12;
    while (offset < wav.byteLength - 8) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 'data') {
        pcmOffset = offset + 8;
        pcmLength = Math.min(chunkSize, wav.byteLength - pcmOffset);
        break;
      }
      offset += 8 + chunkSize;
    }

    const pcm = wav.subarray(pcmOffset, pcmOffset + pcmLength);
    pcmChunks.push(pcm);
    totalPcmBytes += pcm.length;
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const outBuffer = new ArrayBuffer(44 + totalPcmBytes);
  const view = new DataView(outBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalPcmBytes, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, totalPcmBytes, true);

  const outBytes = new Uint8Array(outBuffer);
  let offset = 44;
  for (const chunk of pcmChunks) {
    outBytes.set(chunk, offset);
    offset += chunk.length;
  }

  return outBytes;
}

/**
 * Gera a narração contínua de um artigo (com introdução contextual da Lei e Capítulo/Título)
 * fatiando de forma inteligente em no máximo ~1 minuto (~850 caracteres) por chamada de TTS,
 * e unificando todas as partes em 1 único arquivo de áudio WAV contínuo para reprodução fluida.
 */
export async function gerarNarracaoArtigoFatiada(
  artigo: ArtigoLei,
  tabelaNome: string,
  leiNome: string,
  voz: string,
  estilo: string,
  onProgress?: (parteAtual: number, totalPartes: number, rotuloParte: string) => void
): Promise<{ audioUrl: string; partes: ArtigoParte[]; duracaoSegundos: number }> {
  // Novo modelo contínuo com introdução da Lei/Capítulo e teto de ~1 minuto
  const estruturado: ArtigoEstruturado = parseArtigoEmNarracaoContinua(artigo, {
    leiNome,
    tabelaNome,
    maxCharsPorParte: 850,
  });
  const partesResultado: ArtigoParte[] = [];
  const rawAudioBytes: Uint8Array[] = [];

  for (let i = 0; i < estruturado.partes.length; i++) {
    const parte = estruturado.partes[i];
    onProgress?.(i + 1, estruturado.partes.length, parte.rotulo);

    // Gera áudio desta parte específica (com retry e delay para robustez)
    let data: any = null;
    let lastError: string | null = null;
    const MAX_RETRIES = 3;

    for (let tentativa = 0; tentativa < MAX_RETRIES; tentativa++) {
      if (tentativa > 0) {
        const delayMs = 2500 * Math.pow(2, tentativa - 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        const timeoutPromise = new Promise<{ error: { message: string }; data: null }>((resolve) =>
          setTimeout(() => resolve({ error: { message: 'Timeout na síntese de voz (45s)' }, data: null }), 45000)
        );

        const res = await Promise.race([
          supabase.functions.invoke('narracao', {
            body: {
              fn: 'blog_preview',
              texto: parte.textoTTS.slice(0, 1500),
              voz,
              estilo,
            },
          }),
          timeoutPromise,
        ]);

        if (!res.error && res.data?.audio_data_url) {
          data = res.data;
          lastError = null;
          break;
        }

        lastError = res.error?.message || res.data?.error || 'Sem áudio gerado';
      } catch (callErr: unknown) {
        lastError = callErr instanceof Error ? callErr.message : String(callErr);
      }
      console.warn(`[gerarNarracaoArtigoFatiada] Tentativa ${tentativa + 1}/${MAX_RETRIES} falhou para ${parte.rotulo}: ${lastError}`);
    }

    if (!data?.audio_data_url) {
      throw new Error(`Falha ao gerar parte ${parte.rotulo}: ${lastError || 'Sem áudio gerado'}`);
    }

    // Delay de 1.5s entre partes se houver mais de uma
    if (i < estruturado.partes.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const audioDataUrl = data.audio_data_url;
    let finalAudioUrl = audioDataUrl;
    let duracaoParteSegundos = 0;

    // Faz upload para o bucket audios
    try {
      const resp = await fetch(audioDataUrl);
      const blob = await resp.blob();
      const arrayBuf = await blob.arrayBuffer();
      const pcmLen = Math.max(0, arrayBuf.byteLength - 44);
      duracaoParteSegundos = Math.max(1, Math.round((pcmLen / 48000) * 10) / 10);
      rawAudioBytes.push(new Uint8Array(arrayBuf));

      const safeNum = String(artigo.numero).replace(/[^a-zA-Z0-9]/g, '_');
      const storagePath = `narracoes/${tabelaNome}/fatiado/${safeNum}_${parte.id}.wav`;

      const { error: upErr } = await supabase.storage
        .from('audios')
        .upload(storagePath, blob, { contentType: 'audio/wav', upsert: true });

      if (upErr) {
        console.error('[gerarNarracaoArtigoFatiada] Erro no upload da parte para storage:', upErr);
        throw new Error(`Falha no upload para o Storage: ${upErr.message}`);
      }

      const { data: pubData } = supabase.storage
        .from('audios')
        .getPublicUrl(storagePath);

      if (pubData?.publicUrl) {
        finalAudioUrl = pubData.publicUrl;
      } else {
        const { data: signed } = await supabase.storage
          .from('audios')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 5);
        if (signed?.signedUrl) {
          finalAudioUrl = signed.signedUrl;
        }
      }
    } catch (e: any) {
      console.error('[gerarNarracaoArtigoFatiada] Falha ao persistir parte no storage:', e);
      throw new Error(`Falha ao persistir áudio da parte ${parte.rotulo}: ${e?.message || e}`);
    }

    partesResultado.push({
      ...parte,
      audioUrl: finalAudioUrl,
      duracaoSegundos: duracaoParteSegundos,
    });
  }

  let audioPrincipal = partesResultado[0]?.audioUrl || '';

  // Se o artigo possui mais de 1 parte, concatena todas em 1 único arquivo WAV unificado
  if (rawAudioBytes.length > 1) {
    try {
      const wavUnificado = concatenarWavs(rawAudioBytes);
      const safeNum = String(artigo.numero).replace(/[^a-zA-Z0-9]/g, '_');
      const storagePathUnificado = `narracoes/${tabelaNome}/fatiado/${safeNum}_art_${safeNum}_completo.wav`;
      const blobUnificado = new Blob([wavUnificado.buffer as ArrayBuffer], { type: 'audio/wav' });

      const { error: upErr } = await supabase.storage
        .from('audios')
        .upload(storagePathUnificado, blobUnificado, { contentType: 'audio/wav', upsert: true });

      if (!upErr) {
        const { data: pubData } = supabase.storage
          .from('audios')
          .getPublicUrl(storagePathUnificado);

        if (pubData?.publicUrl) {
          audioPrincipal = pubData.publicUrl;
        } else {
          const { data: signed } = await supabase.storage
            .from('audios')
            .createSignedUrl(storagePathUnificado, 60 * 60 * 24 * 365 * 5);
          if (signed?.signedUrl) {
            audioPrincipal = signed.signedUrl;
          }
        }
      } else {
        console.warn('[gerarNarracaoArtigoFatiada] Erro ao subir áudio unificado no storage:', upErr);
      }
    } catch (concatErr) {
      console.warn('[gerarNarracaoArtigoFatiada] Falha ao concatenar WAVs unificados:', concatErr);
    }
  }

  // Prevenção absoluta: nunca persistir áudio em Data URL Base64 no banco de dados para evitar estouro de timeout
  if (audioPrincipal.startsWith('data:') || partesResultado.some((p) => p.audioUrl?.startsWith('data:'))) {
    throw new Error('Falha no armazenamento: o áudio não foi salvo no Storage e URLs em base64 não são permitidas no banco.');
  }

  // Persiste no banco de dados na tabela narracoes_artigos com redundância para garantir busca instantânea
  const aliasesTabela = obterAliasesTabela(tabelaNome);
  const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/i, '').trim();
  const numDigitos = numLimpo.replace(/\D/g, '');

  const numsVariantes = Array.from(new Set([
    numLimpo,
    `Art. ${numLimpo}`,
    String(artigo.numero).trim(),
    ...(numDigitos ? [numDigitos, `${numDigitos}º`, `Art. ${numDigitos}`, `Art. ${numDigitos}º`] : []),
  ])).filter(Boolean);

  const tabs = Array.from(new Set([tabelaNome, ...aliasesTabela])).slice(0, 4);

  const duracaoTotalSegundos = partesResultado.reduce((acc, p) => acc + (p.duracaoSegundos || 0), 0);
  const duracaoTotalArredondada = Math.max(1, Math.round(duracaoTotalSegundos * 10) / 10);

  const rowsParaSalvar = [];
  const chavesUnicas = new Set<string>();

  for (const t of tabs) {
    for (const n of numsVariantes) {
      const key = `${t}::${n}`;
      if (!chavesUnicas.has(key)) {
        chavesUnicas.add(key);
        rowsParaSalvar.push({
          tabela_nome: t,
          artigo_numero: n,
          lei_nome: leiNome,
          titulo_artigo: artigo.titulo || null,
          audio_url: audioPrincipal,
          word_timings: {
            partes: partesResultado,
            duracao_segundos: duracaoTotalArredondada,
          } as any,
        });
      }
    }
  }

  const { error: dbErr } = await supabase.from('narracoes_artigos').upsert(
    rowsParaSalvar,
    { onConflict: 'tabela_nome,artigo_numero' }
  );

  if (dbErr) {
    console.error('[gerarNarracaoArtigoFatiada] Falha crítica ao persistir em narracoes_artigos:', dbErr);
    throw new Error(`Falha ao registrar áudio no banco de dados: ${dbErr.message || 'Erro de permissão'}`);
  }

  // Limpa cache offline antigo no IndexedDB para que o Vade Mecum use o áudio recém-gerado imediatamente
  await deleteCachedAudioVariantes(tabs, numsVariantes);

  // Sincroniza narracao_url na base unificada vade_mecum_artigos
  try {
    const { data: leis } = await supabase
      .from('vade_mecum_leis')
      .select('id')
      .in('slug', aliasesTabela)
      .limit(2);

    if (leis && leis.length > 0) {
      const leiIds = leis.map((l: { id: string }) => l.id);
      await supabase
        .from('vade_mecum_artigos')
        .update({ narracao_url: audioPrincipal })
        .in('lei_id', leiIds)
        .in('numero', numsVariantes);
    }
  } catch (vmErr) {
    console.warn('[gerarNarracaoArtigoFatiada] Aviso ao sincronizar vade_mecum_artigos:', vmErr);
  }

  return {
    audioUrl: audioPrincipal,
    partes: partesResultado,
    duracaoSegundos: duracaoTotalArredondada,
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
      estilo_tom: 'Super animado, vibrante, extremamente fluido, expressivo e cativante, tornando o estudo de Direito leve, envolvente e memorável',
      lote_tamanho: 1,
      artigos_gerados_total: 0,
      ultimo_disparo: null,
      ultimo_artigo_gerado: null,
      ultimo_status: null,
      leis_ativas: ['CP_CODIGO_PENAL'],
      indice_lei_atual: 0,
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
