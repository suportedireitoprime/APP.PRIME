/**
 * Serviço de Radar Legislativo do Código Penal
 * Mapeia e monitora em tempo real os Projetos de Lei (PLs) e Proposições
 * que tramitam na Câmara dos Deputados visando alterar, incluir ou revogar dispositivos do Código Penal.
 */

export interface ProposicaoRadarCP {
  id: string | number;
  siglaTipo: string;
  numero: number | string;
  ano: number;
  proposicaoDisplay: string;
  autorNome: string;
  autorPartidoUf?: string;
  autorCargo?: string;
  artigosAfetados: string[];
  artigoPrincipalNumero?: string;
  oQueQuerFazer: string;
  ementaOficial: string;
  situacaoTramitacao: string;
  dataApresentacao: string;
  dataDisplay: string;
  linkCamara: string;
  tipoMudanca: 'Aumento de Pena' | 'Nova Qualificadora' | 'Nova Tipificação' | 'Proteção à Mulher' | 'Crimes Cibernéticos e IA' | 'Patrimônio e Fraudes' | 'Segurança Pública';
}

// Base curada de Proposições Reais de 2026 e 2025 ativas na Câmara dos Deputados
export const SEED_PROPOSICOES_CP: ProposicaoRadarCP[] = [
  {
    id: '2646236',
    siglaTipo: 'PL',
    numero: 5320,
    ano: 2026,
    proposicaoDisplay: 'PL 5320/2026',
    autorNome: 'Dep. Delegado da Cunha',
    autorPartidoUf: 'PP/SP',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 157 (Roubo)'],
    artigoPrincipalNumero: '157',
    oQueQuerFazer: 'Qualificar expressamente o roubo praticado mediante destruição ou rompimento de vidro ou de outro componente de veículo automotor ocupado (modalidade popularmente conhecida como "quebra de vidro" ou "saidinha no trânsito"), elevando as penas aplicáveis.',
    ementaOficial: 'Altera o art. 157 do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal), para qualificar o roubo praticado mediante destruição ou rompimento de vidro ou de outro componente de veículo automotor ocupado.',
    situacaoTramitacao: 'Aguardando Parecer na Comissão de Constituição e Justiça (CCJC)',
    dataApresentacao: '2026-09-10',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646236',
    tipoMudanca: 'Nova Qualificadora',
  },
  {
    id: '2645219',
    siglaTipo: 'PL',
    numero: 5262,
    ano: 2026,
    proposicaoDisplay: 'PL 5262/2026',
    autorNome: 'Dep. Paulo Soares',
    autorPartidoUf: 'REPUBLICANOS/RJ',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 171 (Estelionato)'],
    artigoPrincipalNumero: '171',
    oQueQuerFazer: 'Majorar as penas do crime de estelionato comum e eletrônico, duplicando as sanções quando o crime envolver vulneráveis, golpes via PIX ou transações financeiras digitais.',
    ementaOficial: 'Altera o artigo 171 do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal) para majorar as penas do crime de estelionato.',
    situacaoTramitacao: 'Em tramitação na Comissão de Segurança Pública (CSP)',
    dataApresentacao: '2026-09-02',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2645219',
    tipoMudanca: 'Aumento de Pena',
  },
  {
    id: '2645943',
    siglaTipo: 'PL',
    numero: 5294,
    ano: 2026,
    proposicaoDisplay: 'PL 5294/2026',
    autorNome: 'Dep. Fred Linhares',
    autorPartidoUf: 'REPUBLICANOS/DF',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 155, § 5º (Furto de Veículo)'],
    artigoPrincipalNumero: '155',
    oQueQuerFazer: 'Incluir expressamente o Distrito Federal na qualificadora de furto de veículo transportado para outro Estado ou exterior, sanando lacuna técnica do texto legal.',
    ementaOficial: 'Altera o § 5º do art. 155 do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 - Código Penal, para incluir expressamente o Distrito Federal na qualificadora do crime de furto de veículo automotor.',
    situacaoTramitacao: 'Aguardando Designação de Relator na CCJC',
    dataApresentacao: '2026-09-05',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2645943',
    tipoMudanca: 'Patrimônio e Fraudes',
  },
  {
    id: '2646258',
    siglaTipo: 'PL',
    numero: 5323,
    ano: 2026,
    proposicaoDisplay: 'PL 5323/2026',
    autorNome: 'Dep. Julio Cesar Ribeiro',
    autorPartidoUf: 'REPUBLICANOS/DF',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 129, § 9º e § 13 (Lesão Corporal)'],
    artigoPrincipalNumero: '129',
    oQueQuerFazer: 'Agravar severamente as penas aplicáveis às lesões corporais praticadas no âmbito de violência doméstica e familiar contra a mulher e criar novas causas de aumento de pena quando houver descumprimento de medida protetiva.',
    ementaOficial: 'Altera o artigo 129 do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal), para agravar as penas aplicáveis às lesões corporais praticadas no âmbito de violência doméstica e familiar contra a mulher.',
    situacaoTramitacao: 'Pronto para Pauta na Comissão de Defesa dos Direitos da Mulher (CMULHER)',
    dataApresentacao: '2026-09-11',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646258',
    tipoMudanca: 'Proteção à Mulher',
  },
  {
    id: '2646413',
    siglaTipo: 'PL',
    numero: 5366,
    ano: 2026,
    proposicaoDisplay: 'PL 5366/2026',
    autorNome: 'Dep. Bruno Ganem',
    autorPartidoUf: 'PODE/SP',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 216-B e Art. 218-C (Crimes Sexuais e IA)'],
    artigoPrincipalNumero: '216',
    oQueQuerFazer: 'Criminalizar expressamente a criação e simulação de imagens sintéticas de conteúdo sexual infantil ou vulnerável geradas por Inteligência Artificial (deepfakes), classificando a conduta no rol de crimes hediondos.',
    ementaOficial: 'Altera a Lei nº 8.069/1990 (ECA), o Decreto-Lei nº 2.848/1940 (Código Penal) e a Lei nº 8.072/1990 (Crimes Hediondos), para tipificar a violência sexual gerada por inteligência artificial.',
    situacaoTramitacao: 'Em análise conjunta na CCJC e Comissão de Comunicação',
    dataApresentacao: '2026-09-15',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646413',
    tipoMudanca: 'Crimes Cibernéticos e IA',
  },
  {
    id: '2646260',
    siglaTipo: 'PL',
    numero: 5325,
    ano: 2026,
    proposicaoDisplay: 'PL 5325/2026',
    autorNome: 'Dep. Augusto Coutinho',
    autorPartidoUf: 'REPUBLICANOS/PE',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 149-A (Tráfico de Pessoas e Aliciamento)'],
    artigoPrincipalNumero: '149',
    oQueQuerFazer: 'Tipificar como crime penal autônomo o aliciamento ou recrutamento de pessoas em território brasileiro com a finalidade de atuar como combatente em conflitos armados no exterior.',
    ementaOficial: 'Altera o art. 149-A do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 – Código Penal, para tornar crime o aliciamento ou recrutamento de pessoa com a finalidade de combate em conflito armado.',
    situacaoTramitacao: 'Aguardando Parecer na Comissão de Relações Exteriores e de Defesa Nacional (CREDN)',
    dataApresentacao: '2026-09-11',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646260',
    tipoMudanca: 'Nova Tipificação',
  },
  {
    id: '2646387',
    siglaTipo: 'PL',
    numero: 5356,
    ano: 2026,
    proposicaoDisplay: 'PL 5356/2026',
    autorNome: 'Dep. General Pazuello',
    autorPartidoUf: 'PL/RJ',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 359-I (Estado Democrático de Direito)'],
    artigoPrincipalNumero: '359',
    oQueQuerFazer: 'Modificar os elementos objetivos do caput e parágrafos do art. 359-I, adicionando circunstâncias atenuantes e limitadoras de dosimetria penal nos crimes contra o Estado Democrático de Direito.',
    ementaOficial: 'Altera a redação do caput e dos parágrafos 1º e 2º e acrescenta os incisos I, II e III ao artigo 359-I do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal).',
    situacaoTramitacao: 'Aguardando inclusão na Ordem do Dia da CCJC',
    dataApresentacao: '2026-09-14',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646387',
    tipoMudanca: 'Segurança Pública',
  },
  {
    id: '2646428',
    siglaTipo: 'PL',
    numero: 5371,
    ano: 2026,
    proposicaoDisplay: 'PL 5371/2026',
    autorNome: 'Dep. Lincoln Portela',
    autorPartidoUf: 'PL/MG',
    autorCargo: 'Deputado Federal',
    artigosAfetados: ['Art. 317 e Art. 333 (Corrupção e Integridade Privada)'],
    artigoPrincipalNumero: '317',
    oQueQuerFazer: 'Instituir novos tipos penais relativos à corrupção no setor privado empresarial, responsabilizando dirigentes e intermediários de vantagens indevidas.',
    ementaOficial: 'Institui o Estatuto Nacional de Integridade e Responsabilidade Anticorrupção no Setor Privado e altera o Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal).',
    situacaoTramitacao: 'Em análise preliminar pela Mesa Diretora da Câmara',
    dataApresentacao: '2026-09-16',
    dataDisplay: 'Set/2026',
    linkCamara: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2646428',
    tipoMudanca: 'Nova Tipificação',
  }
];

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const CACHE_KEY = 'prime_radar_cp_proposicoes';

/**
 * Busca proposições atualizadas na API de Dados Abertos da Câmara dos Deputados
 * com fallback imediato para o catálogo curado.
 */
export async function getProposicoesRadarCP(): Promise<ProposicaoRadarCP[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.data && Array.isArray(parsed.data) && Date.now() - parsed.timestamp < 1000 * 60 * 30) {
          return parsed.data;
        }
      } catch (e) {
        console.warn('Falha no cache local do radar:', e);
      }
    }

    // Tenta enriquecer a lista com as proposições mais recentes da Câmara
    const url = `${CAMARA_API}/proposicoes?siglaTipo=PL,PEC&codTema=43&ano=2026,2025&ordem=DESC&ordenarPor=id&itens=50`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Câmara API: ${res.status}`);

    const json = await res.json();
    const rawList = (json.dados || []).filter((d: any) =>
      /2\.?848|c[oó]digo penal/i.test(d.ementa)
    );

    if (rawList.length > 0) {
      const dynamicList: ProposicaoRadarCP[] = await Promise.all(
        rawList.slice(0, 12).map(async (d: any) => {
          // Busca autor se disponível
          let autorNome = 'Deputado Federal';
          try {
            const aRes = await fetch(`${CAMARA_API}/proposicoes/${d.id}/autores`, { headers: { Accept: 'application/json' } });
            if (aRes.ok) {
              const aJson = await aRes.json();
              if (aJson.dados && aJson.dados[0]) {
                autorNome = `Dep. ${aJson.dados[0].nome}`;
              }
            }
          } catch {
            // mantém fallback
          }

          // Extrai artigo(s) visado(s) da ementa
          const artigosAfetados: string[] = [];
          const matchArt = d.ementa.match(/art(?:igo|\.)?\s*(\d+[A-Za-z-–—\d]*)/gi);
          if (matchArt) {
            matchArt.forEach((m: string) => {
              const num = m.replace(/[^0-9A-Za-z-]/g, '').trim();
              if (num && !artigosAfetados.includes(`Art. ${num}`)) {
                artigosAfetados.push(`Art. ${num}`);
              }
            });
          }

          const artigoPrincipal = artigosAfetados[0] ? artigosAfetados[0].replace(/[^0-9]/g, '') : undefined;

          // Cria síntese pedagógica do que o projeto quer fazer
          let oQueQuerFazer = d.ementa;
          const matchPara = d.ementa.match(/,\s*para\s+([^.]+)/i) || d.ementa.match(/,\s*a\s+fim\s+de\s+([^.]+)/i);
          if (matchPara) {
            oQueQuerFazer = matchPara[1].charAt(0).toUpperCase() + matchPara[1].slice(1).trim();
          }

          return {
            id: String(d.id),
            siglaTipo: d.siglaTipo || 'PL',
            numero: d.numero,
            ano: d.ano || 2026,
            proposicaoDisplay: `${d.siglaTipo || 'PL'} ${d.numero}/${d.ano || 2026}`,
            autorNome,
            autorCargo: 'Deputado Federal',
            artigosAfetados: artigosAfetados.length > 0 ? artigosAfetados : ['Código Penal (Geral)'],
            artigoPrincipalNumero: artigoPrincipal,
            oQueQuerFazer,
            ementaOficial: d.ementa,
            situacaoTramitacao: 'Em tramitação na Câmara dos Deputados',
            dataApresentacao: d.dataApresentacao ? d.dataApresentacao.slice(0, 10) : '2026-09-01',
            dataDisplay: `${d.ano || 2026}`,
            linkCamara: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${d.id}`,
            tipoMudanca: 'Nova Tipificação',
          };
        })
      );

      // Mescla com o seed para garantir enriquecimento completo
      const seenIds = new Set<string>();
      const combined: ProposicaoRadarCP[] = [];

      for (const item of SEED_PROPOSICOES_CP) {
        seenIds.add(String(item.id));
        combined.push(item);
      }
      for (const item of dynamicList) {
        if (!seenIds.has(String(item.id))) {
          seenIds.add(String(item.id));
          combined.push(item);
        }
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: combined, timestamp: Date.now() }));
      return combined;
    }
  } catch (err) {
    console.warn('API da Câmara inacessível, utilizando catálogo curado:', err);
  }

  return SEED_PROPOSICOES_CP;
}
