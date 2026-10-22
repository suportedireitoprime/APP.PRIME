const fs = require('fs');

const driveSubfolders = JSON.parse(fs.readFileSync('scripts/drive_subfolders.json', 'utf8'));

// Mapa manual para garantir tabela_nome e lei_nome perfeitos
const MANUAL_OVERRIDES = {
  // Códigos
  'CC - Código Civil': { tabela: 'CC_CODIGO_CIVIL', sigla: 'CC' },
  'CDC - Código de Defesa do Consumidor': { tabela: 'CDC_CODIGO_DEFESA_CONSUMIDOR', sigla: 'CDC' },
  'CE - Código Eleitoral': { tabela: 'CE_CODIGO_ELEITORAL', sigla: 'CE' },
  'CLT - Consolidação das Leis do Trabalho': { tabela: 'CLT_CONSOLIDACAO_LEIS_TRABALHO', sigla: 'CLT' },
  'CP - Código Penal': { tabela: 'CP_CODIGO_PENAL', sigla: 'CP' },
  'CPC - Código de Processo Civil': { tabela: 'CPC_CODIGO_PROCESSO_CIVIL', sigla: 'CPC' },
  'CPM - Código Penal Militar': { tabela: 'CPM_CODIGO_PENAL_MILITAR', sigla: 'CPM' },
  'CPP - Código de Processo Penal': { tabela: 'CPP_CODIGO_PROCESSO_PENAL', sigla: 'CPP' },
  'CPPM - Código de Processo Penal Militar': { tabela: 'CPPM_CODIGO_PROCESSO_PENAL_MILITAR', sigla: 'CPPM' },
  'CTB - Código de Trânsito Brasileiro': { tabela: 'CTB_CODIGO_TRANSITO_BRASILEIRO', sigla: 'CTB' },
  'CTN - Código Tributário Nacional': { tabela: 'CTN_CODIGO_TRIBUTARIO_NACIONAL', sigla: 'CTN' },

  // Estatutos
  'EC - Estatuto da Cidade': { tabela: 'EC_ESTATUTO_CIDADE', sigla: 'EC' },
  'ECA - Estatuto da Criança e do Adolescente': { tabela: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE', sigla: 'ECA' },
  'ED - Estatuto do Desarmamento': { tabela: 'ED_ESTATUTO_DESARMAMENTO', sigla: 'ED' },
  'EGGM - Estatuto Geral das Guardas Municipais': { tabela: 'EGGM_ESTATUTO_GUARDAS_MUNICIPAIS', sigla: 'EGGM' },
  'EI - Estatuto do Índio': { tabela: 'EIND_ESTATUTO_INDIO', sigla: 'EIND' },
  'EIR - Estatuto da Igualdade Racial': { tabela: 'EIR_ESTATUTO_IGUALDADE_RACIAL', sigla: 'EIR' },
  'EJ - Estatuto da Juventude': { tabela: 'EJ_ESTATUTO_JUVENTUDE', sigla: 'EJ' },
  'EM - Estatuto dos Militares': { tabela: 'EM_ESTATUTO_MILITARES', sigla: 'EM' },
  'EMET - Estatuto da Metrópole': { tabela: 'EMET_ESTATUTO_METROPOLE', sigla: 'EMET' },
  'EMOT - Estatuto do Motorista': { tabela: 'EMOT_ESTATUTO_MOTORISTA', sigla: 'EMOT' },
  'EOAB - Estatuto da Advocacia e da OAB': { tabela: 'EOAB_ESTATUTO_OAB', sigla: 'EOAB' },
  'EPC - Estatuto da Pessoa com Câncer': { tabela: 'EPC_ESTATUTO_PESSOA_CANCER', sigla: 'EPC' },
  'EPD - Estatuto da Pessoa com Deficiência': { tabela: 'EPD_ESTATUTO_PESSOA_DEFICIENCIA', sigla: 'EPD' },
  'EPI - Estatuto da Pessoa Idosa': { tabela: 'EI_ESTATUTO_IDOSO', sigla: 'EI' },
  'ER - Estatuto dos Refugiados': { tabela: 'EREF_ESTATUTO_REFUGIADO', sigla: 'EREF' },
  'ESP - Estatuto da Segurança Privada': { tabela: 'ESP_ESTATUTO_SEGURANCA_PRIVADA', sigla: 'ESP' },
  'ESPF - Estatuto dos Servidores Públicos Federais': { tabela: 'L8112_SERVIDORES_FEDERAIS', sigla: 'L8112' },
  'ET - Estatuto do Torcedor': { tabela: 'ET_ESTATUTO_TORCEDOR', sigla: 'ET' },
  'ETERRA - Estatuto da Terra': { tabela: 'ETERRA_ESTATUTO_TERRA', sigla: 'ETERRA' },
  'ME-EPP - Estatuto da Microempresa e da Empresa de Pequeno Porte': { tabela: 'EME_ESTATUTO_MICROEMPRESA', sigla: 'EME' },

  // Leis Especiais
  'Código Florestal (12.651/2012)': { tabela: 'CFLOR_CODIGO_FLORESTAL', sigla: 'CFLOR' },
  'LDB (9.394/1996)': { tabela: 'LDB_DIRETRIZES_EDUCACAO', sigla: 'LDB' },
  'Lei Anticorrupção (12.846/2013)': { tabela: 'LACE_ANTICORRUPCAO', sigla: 'LACE' },
  'Lei Antiterrorismo (13.260/2016)': { tabela: 'LAT_ANTITERRORISMO', sigla: 'LAT' },
  'Lei Carolina Dieckmann (12.737/2012)': { tabela: 'LCI_CRIMES_INFORMATICOS', sigla: 'LCI' },
  'Lei da Ação Civil Pública (7.347/1985)': { tabela: 'LACP_ACAO_CIVIL_PUBLICA', sigla: 'LACP' },
  'Lei da Ação Popular (4.717/1965)': { tabela: 'LAP_ACAO_POPULAR', sigla: 'LAP' },
  'Lei das Organizações Criminosas (12.850/2013)': { tabela: 'LOC_ORGANIZACAO_CRIMINOSA', sigla: 'LOC' },
  'Lei de Abuso de Autoridade (13.869/2019)': { tabela: 'LAA_ABUSO_AUTORIDADE', sigla: 'LAA' },
  'Lei de Acesso à Informação (12.527/2011)': { tabela: 'LAI_ACESSO_INFORMACAO', sigla: 'LAI' },
  'Lei de Alienação Parental (12.318/2010)': { tabela: 'LALP_ALIENACAO_PARENTAL', sigla: 'LALP' },
  'Lei de Alimentos (5.478/1968)': { tabela: 'LALIM_ALIMENTOS', sigla: 'LALIM' },
  'Lei de Arbitragem (9.307/1996)': { tabela: 'LA_ARBITRAGEM', sigla: 'LA' },
  'Lei de Contravenções Penais (3.688/1941)': { tabela: 'LCP_CONTRAVENCOES_PENAIS', sigla: 'LCP' },
  'Lei de Crimes Ambientais (9.605/1998)': { tabela: 'LCA_CRIMES_AMBIENTAIS', sigla: 'LCA' },
  'Lei de Crimes contra a Ordem Tributária (8.137/1990)': { tabela: 'LCOT_CRIMES_ORDEM_TRIBUTARIA', sigla: 'LCOT' },
  'Lei de Crimes contra o Sistema Financeiro (7.492/1986)': { tabela: 'LCSF_CRIMES_SISTEMA_FINANCEIRO', sigla: 'LCSF' },
  'Lei de Crimes Hediondos (8.072/1990)': { tabela: 'LCH_CRIMES_HEDIONDOS', sigla: 'LCH' },
  'Lei de Defesa do Estado Democrático (14.197/2021)': { tabela: 'LDED_DEFESA_ESTADO_DEMOCRATICO', sigla: 'LDED' },
  'Lei de Drogas (11.343/2006)': { tabela: 'LD_LEI_DROGAS', sigla: 'LD' },
  'Lei de Execução Fiscal (6.830/1980)': { tabela: 'LEF_EXECUCAO_FISCAL', sigla: 'LEF' },
  'Lei de Execução Penal (7.210/1984)': { tabela: 'LEP_EXECUCAO_PENAL', sigla: 'LEP' },
  'Lei de Falências e Recuperação de Empresas (11.101/2005)': { tabela: 'LF_FALENCIAS', sigla: 'LF' },
  'Lei de Importunação Sexual (13.718/2018)': { tabela: 'LIS_IMPORTUNACAO_SEXUAL', sigla: 'LIS' },
  'Lei de Improbidade Administrativa (8.429/1992)': { tabela: 'LIA_IMPROBIDADE_ADMINISTRATIVA', sigla: 'LIA' },
  'Lei de Interceptação Telefônica (9.296/1996)': { tabela: 'LIT_INTERCEPTACAO_TELEFONICA', sigla: 'LIT' },
  'Lei de Lavagem de Dinheiro (9.613/1998)': { tabela: 'LLAV_LAVAGEM_DINHEIRO', sigla: 'LLAV' },
  'Lei de Licitações (14.133/2021)': { tabela: 'NLL_LICITACOES', sigla: 'NLL' },
  'Lei de Locações (8.245/1991)': { tabela: 'LI_INQUILINATO', sigla: 'LI' },
  'Lei de Mediação (13.140/2015)': { tabela: 'LMED_MEDIACAO', sigla: 'LMED' },
  'Lei de Migração (13.445/2017)': { tabela: 'EMIG_ESTATUTO_MIGRACAO', sigla: 'EMIG' },
  'Lei de Prisão Temporária (7.960/1989)': { tabela: 'LPT_PRISAO_TEMPORARIA', sigla: 'LPT' },
  'Lei de Racismo - Lei Caó (7.716/1989)': { tabela: 'LRAC_RACISMO', sigla: 'LRAC' },
  'Lei de Registros Públicos (6.015/1973)': { tabela: 'LRP_REGISTROS_PUBLICOS', sigla: 'LRP' },
  'Lei de Responsabilidade Fiscal (LC 101/2000)': { tabela: 'LRF_RESPONSABILIDADE_FISCAL', sigla: 'LRF' },
  'Lei de Stalking (14.132/2021)': { tabela: 'LSTK_STALKING', sigla: 'LSTK' },
  'Lei de Tortura (9.455/1997)': { tabela: 'LTORT_TORTURA', sigla: 'LTORT' },
  'Lei do Feminicídio (13.104/2015)': { tabela: 'LFEM_FEMINICIDIO', sigla: 'LFEM' },
  'Lei do Mandado de Segurança (12.016/2009)': { tabela: 'LMS_MANDADO_SEGURANCA', sigla: 'LMS' },
  'Lei do Pacote Anticrime (13.964/2019)': { tabela: 'LPAC_PACOTE_ANTICRIME', sigla: 'LPAC' },
  'Lei do Processo Administrativo Federal (9.784/1999)': { tabela: 'LPAF_PROCESSO_ADMINISTRATIVO', sigla: 'LPAF' },
  'Lei do SUS (8.080/1990)': { tabela: 'LSUS_SISTEMA_UNICO_SAUDE', sigla: 'LSUS' },
  'Lei dos Juizados Especiais (9.099/1995)': { tabela: 'LJE_JUIZADOS_ESPECIAIS', sigla: 'LJE' },
  'Lei dos Juizados Especiais Federais (10.259/2001)': { tabela: 'LJEF_JUIZADOS_ESPECIAIS_FEDERAIS', sigla: 'LJEF' },
  'Lei Maria da Penha (11.340/2006)': { tabela: 'LMP_MARIA_PENHA', sigla: 'LMP' },
  'LGPD (13.709/2018)': { tabela: 'LGPD_PROTECAO_DADOS', sigla: 'LGPD' },
  'LINDB (4.657/1942)': { tabela: 'LINDB_INTRODUCAO_NORMAS', sigla: 'LINDB' },
  'Marco Civil da Internet (12.965/2014)': { tabela: 'MCI_MARCO_CIVIL_INTERNET', sigla: 'MCI' }
};

async function fetchFolderItems(folderId, retries = 3) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
      if (!match) return [];

      const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      const data = JSON.parse(hexDecoded);
      const items = [];

      function extract(arr) {
        if (!Array.isArray(arr)) return;
        if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
          items.push({
            id: arr[0],
            name: arr[2],
            mime: arr[3]
          });
        }
        for (const el of arr) {
          if (Array.isArray(el)) extract(el);
        }
      }

      extract(data);
      return items;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

async function scanRecursive(folderId, lawMeta, subfolderBreadcrumb = '') {
  const items = await fetchFolderItems(folderId);
  const audioFiles = [];

  for (const item of items) {
    if (item.mime === 'application/vnd.google-apps.folder') {
      const crumb = subfolderBreadcrumb ? `${subfolderBreadcrumb} > ${item.name}` : item.name;
      const childAudios = await scanRecursive(item.id, lawMeta, crumb);
      audioFiles.push(...childAudios);
    } else if (item.name.toLowerCase().endsWith('.mp3') || item.mime === 'audio/mpeg') {
      // Extrair número do artigo
      // Padrões: 'Art. 0001.mp3', 'Art. 0001-A.mp3', 'Artigo 1.mp3', '0001.mp3', etc.
      let artNum = '';
      const m = item.name.match(/(?:Art\.?|Artigo)?\s*0*([0-9]+(?:\-[A-Za-z0-9]+)?)/i);
      if (m) {
        artNum = m[1];
      } else {
        artNum = item.name.replace(/\.[^.]+$/, '').trim();
      }

      audioFiles.push({
        driveId: item.id,
        fileName: item.name,
        artigoNumero: artNum,
        category: lawMeta.category,
        lawName: lawMeta.name,
        tabelaNome: lawMeta.tabela,
        sigla: lawMeta.sigla,
        subfolder: subfolderBreadcrumb
      });
    }
  }

  return audioFiles;
}

async function main() {
  console.log('=== Inciando varredura recursiva de áudios no Google Drive ===');

  const allLaws = [];
  for (const cat of ['código', 'estatutos', 'leis especiais']) {
    const list = driveSubfolders[cat] || [];
    for (const f of list) {
      const meta = MANUAL_OVERRIDES[f.name] || {
        tabela: f.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        sigla: f.name.split('-')[0].trim()
      };
      allLaws.push({
        id: f.id,
        name: f.name,
        category: cat,
        tabela: meta.tabela,
        sigla: meta.sigla
      });
    }
  }

  console.log(`Total de leis a escanear: ${allLaws.length}`);

  const allAudios = [];
  let completedLaws = 0;

  for (const law of allLaws) {
    process.stdout.write(`[${++completedLaws}/${allLaws.length}] Escaneando "${law.name}"... `);
    try {
      const audios = await scanRecursive(law.id, law);
      console.log(`✓ ${audios.length} áudios`);
      allAudios.push(...audios);
    } catch (err) {
      console.log(`✗ Erro: ${err.message}`);
    }
  }

  console.log(`\n=== CONCLUÍDO! Total de arquivos de áudio encontrados: ${allAudios.length} ===`);
  fs.writeFileSync('scripts/all_drive_audios.json', JSON.stringify(allAudios, null, 2), 'utf8');
  console.log('Catálogo completo salvo em scripts/all_drive_audios.json');
}

main().catch(console.error);
