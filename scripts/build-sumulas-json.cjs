const fs = require('fs');

const SV_TITULOS = {
  1: 'FGTS e Transação Extrajudicial',
  2: 'Loterias e Bingos (Competência da União)',
  3: 'TCU, Contraditório e Registro de Aposentadoria',
  4: 'Salário Mínimo como Indexador de Vantagem',
  5: 'Falta de Advogado no Processo Disciplinar (PAD)',
  6: 'Não Cumulatividade de Gratificações Militares',
  7: 'Norma do Art. 192, § 3º da CF (Taxa de Juros)',
  8: 'Prescrição e Decadência Tributária (CTN vs Lei Ordinária)',
  10: 'Cláusula de Reserva de Plenário (Art. 97 CF)',
  11: 'Uso Excepcional de Algemas (Súmula das Algemas)',
  12: 'Competência da Justiça do Trabalho para Indenização Acidentária',
  13: 'Vedação ao Nepotismo na Administração Pública',
  14: 'Direito do Advogado de Acesso aos Autos do Inquérito',
  15: 'Cálculo de Gratificações sem Efeito Cascata',
  16: 'Remuneração Total Superior ao Salário Mínimo',
  17: 'Juros de Mora no Período Constitucional de Precatórios',
  18: 'Vencimentos de Militares e Salário Mínimo',
  19: 'Taxa de Coleta de Lixo Domiciliar e Constitucionalidade',
  20: 'Gratificação GDATA aos Servidores Inativos',
  21: 'Inconstitucionalidade do Depósito Prévio em Recurso Administrativo',
  22: 'Competência da JT para Interdito Proibitório em Greve',
  23: 'Competência da JT para Execução das Contribuições Sociais da Sentença',
  24: 'Crimes Contra a Ordem Tributária e Lançamento Definitivo',
  25: 'Ilicitude da Prisão Civil de Depositário Infiel',
  26: 'Exame Criminológico e Progressão de Regime Prisional',
  27: 'Incorporação de Gratificações Funcionais (GDATA)',
  28: 'Inconstitucionalidade do ICMS Superior à Energia/Telecomunicações',
  29: 'Cálculo de Taxas por Fração de Imóvel ou Serviços',
  31: 'Inconstitucionalidade do ISS sobre Locação de Bens Móveis',
  32: 'Acumulação de Proventos e Vencimentos (EC 20/98)',
  33: 'Aposentadoria Especial do Servidor Público (Atividade de Risco)',
  34: 'Competência da JT para Cobrança de Honorários Advocatícios',
  35: 'Homologação de Acordo na Transação Penal e Não Extinção da Punibilidade',
  36: 'Competência da Justiça Federal para Crimes a Bordo de Aeronave',
  37: 'Vedação ao Judiciário de Aumentar Vencimentos por Isonomia',
  38: 'Competência do Município para Fixar Horário de Funcionamento Bancário',
  39: 'Cobrança da Taxa de Iluminação Pública (COSIP)',
  40: 'Contribuição Confederativa Aplicável Apenas a Filiados',
  41: 'Negociação Coletiva e Trabalho Portuário',
  42: 'Competência da Justiça Estadual para Crimes Falimentares',
  43: 'Inconstitucionalidade de Provimento Derivado (Ascensão e Transposição)',
  44: 'Critério de Escolha de Reitor de Universidade Pública',
  45: 'Competência da JT para Crimes contra a Organização do Trabalho',
  46: 'Competência Privativa da União para Crimes de Responsabilidade',
  47: 'Honorários Advocatícios e Crédito de Natureza Alimentar',
  48: 'Imunidade Tributária da ECT (Empresa de Correios e Telégrafos)',
  49: 'Não Incidência de ICMS no Deslocamento de Bens entre Estabelecimentos',
  50: 'Natureza Jurídica do Pedágio',
  51: 'Renúncia a Fração de Precatório para Pagamento em RPV',
  52: 'Imunidade Recíproca das Sociedades de Economia Mista Prestadoras de Serviço',
  53: 'Execução de Ofício das Contribuições Sociais pela Justiça do Trabalho',
  54: 'Concessão de Asilo Político e Extradição',
  55: 'Direito à Nomeação de Candidato Aprovado em Concurso Dentro das Vagas',
  56: 'Falta de Vagas em Estabelecimento Adequado e Prisão Albergue/Domiciliar',
  57: 'Imunidade Tributária de Livros Eletrônicos (E-books e E-readers)',
  58: 'Inexistência de Direito a Crédito de ICMS em Entrada Isenta/Não Tributada',
  59: 'Precatórios e Correção Monetária pelo IPCA-E',
  60: 'Imunidade Tributária de Bens Imóveis de Templos de Qualquer Culto',
  61: 'Inconstitucionalidade da Cobrança de ISS sobre Veículos Usados',
  62: 'Regime Constitucional de Licenciamento Ambiental e Competências',
  63: 'Imunidade Tributária para Exportação e PIS/Cofins'
};

const parsed = JSON.parse(fs.readFileSync('scripts/parsed_sumulas_files.json', 'utf8'));
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

const nums = Object.keys(parsed.grouped).map(Number).sort((a,b)=>a-b);
console.log('Generating topicos for ' + nums.length + ' Súmulas...');

const topicos = [];
for (const num of nums) {
  const g = parsed.grouped[num];
  const padNum = num.toString().padStart(2, '0');
  const tema = SV_TITULOS[num] || 'Tema e Aplicação Prática';
  const titulo = `Súmula Vinculante ${padNum} - ${tema}`;
  
  const audioFile = g.mp3 ? g.mp3.name : `SV ${padNum} - Áudio.mp3`;
  const pdfFile = g.pdf ? g.pdf.name : `SV ${padNum} - Ficha.pdf`;
  const srtFile = g.srt ? g.srt.name : `SV ${padNum} - Legenda.srt`;
  const txtFile = g.txt ? g.txt.name : `SV ${padNum} - Roteiro.txt`;

  topicos.push({
    id: `sumulas-vinculantes_SV_${padNum}`,
    baseSlug: `SV ${padNum}`,
    numero: num,
    titulo: titulo,
    subtitulo: tema,
    audioUrl: `${R2_DOMAIN}/pilulas/sumulas/sumulas-vinculantes/${encodeURIComponent(audioFile)}`,
    srtUrl: `${R2_DOMAIN}/pilulas/sumulas/sumulas-vinculantes/${encodeURIComponent(srtFile)}`,
    pdfUrl: `${R2_DOMAIN}/pilulas/sumulas/sumulas-vinculantes/${encodeURIComponent(pdfFile)}`,
    roteiroUrl: `${R2_DOMAIN}/pilulas/sumulas/sumulas-vinculantes/${encodeURIComponent(txtFile)}`,
    driveMp3Id: g.mp3 ? g.mp3.id : null,
    driveSrtId: g.srt ? g.srt.id : null,
    drivePdfId: g.pdf ? g.pdf.id : null,
    driveTxtId: g.txt ? g.txt.id : null,
    r2Mp3Key: `pilulas/sumulas/sumulas-vinculantes/${audioFile}`,
    r2SrtKey: `pilulas/sumulas/sumulas-vinculantes/${srtFile}`,
    r2PdfKey: `pilulas/sumulas/sumulas-vinculantes/${pdfFile}`,
    r2TxtKey: `pilulas/sumulas/sumulas-vinculantes/${txtFile}`
  });
}

const sumulasData = [
  {
    id: 'sumulas-vinculantes',
    folderIndex: 1,
    titulo: 'Súmulas Vinculantes',
    folderName: 'Súmulas Vinculantes',
    slug: 'sumulas-vinculantes',
    totalTopicos: topicos.length,
    topicos: topicos
  }
];

fs.writeFileSync('src/data/pilulas/sumulas.json', JSON.stringify(sumulasData, null, 2), 'utf8');
console.log('src/data/pilulas/sumulas.json written with ' + topicos.length + ' topicos!');
console.log('Sample topico 1:', topicos[0]);
console.log('Sample SV 11:', topicos.find(t => t.numero === 11));
