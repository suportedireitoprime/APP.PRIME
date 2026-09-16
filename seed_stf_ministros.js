import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ministros = [
  {
    nome: 'Luís Roberto Barroso',
    indicacao: 'Dilma Rousseff',
    data_posse: '2013-06-26',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/barroso.jpg',
    bio_resumo: 'Atual Presidente do STF (biênio 2023-2025). Professor titular de Direito Constitucional da UERJ e mestre por Yale.'
  },
  {
    nome: 'Edson Fachin',
    indicacao: 'Dilma Rousseff',
    data_posse: '2015-06-16',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/fachin.jpg',
    bio_resumo: 'Atual Vice-Presidente. Professor Titular de Direito Civil da UFPR e atuou extensamente em direito de família e arbitragem.'
  },
  {
    nome: 'Gilmar Mendes',
    indicacao: 'Fernando Henrique Cardoso',
    data_posse: '2002-06-20',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/gilmar.jpg',
    bio_resumo: 'O decano do STF. Doutor pela Universidade de Münster. Foi Advogado-Geral da União e Presidente do STF (2008-2010).'
  },
  {
    nome: 'Cármen Lúcia',
    indicacao: 'Luiz Inácio Lula da Silva',
    data_posse: '2006-06-21',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/carmen.jpg',
    bio_resumo: 'Presidente do TSE. Foi Presidente do STF (2016-2018). É professora titular da PUC Minas.'
  },
  {
    nome: 'Dias Toffoli',
    indicacao: 'Luiz Inácio Lula da Silva',
    data_posse: '2009-10-23',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/toffoli.jpg',
    bio_resumo: 'Foi Presidente do STF (2018-2020) e Advogado-Geral da União.'
  },
  {
    nome: 'Luiz Fux',
    indicacao: 'Dilma Rousseff',
    data_posse: '2011-03-03',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/fux.jpg',
    bio_resumo: 'Presidente do STF (2020-2022). Foi Ministro do STJ. Doutor pela UERJ.'
  },
  {
    nome: 'Alexandre de Moraes',
    indicacao: 'Michel Temer',
    data_posse: '2017-03-22',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/moraes.jpg',
    bio_resumo: 'Foi Presidente do TSE. Professor da USP e Mackenzie, e ex-Ministro da Justiça.'
  },
  {
    nome: 'Nunes Marques',
    indicacao: 'Jair Bolsonaro',
    data_posse: '2020-11-05',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/nunes.jpg',
    bio_resumo: 'Ex-Desembargador do TRF1 e membro do TRE-PI.'
  },
  {
    nome: 'André Mendonça',
    indicacao: 'Jair Bolsonaro',
    data_posse: '2021-12-16',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/mendonca.jpg',
    bio_resumo: 'Doutor em Direito pela Universidade de Salamanca. Foi Advogado-Geral da União e Ministro da Justiça.'
  },
  {
    nome: 'Cristiano Zanin',
    indicacao: 'Luiz Inácio Lula da Silva',
    data_posse: '2023-08-03',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/zanin.jpg',
    bio_resumo: 'Especialista em litígios complexos. Advogou em casos de grande repercussão nacional.'
  },
  {
    nome: 'Flávio Dino',
    indicacao: 'Luiz Inácio Lula da Silva',
    data_posse: '2024-02-22',
    foto_url: 'https://portal.stf.jus.br/assets/img/ministros/dino.jpg',
    bio_resumo: 'Ex-Governador do Maranhão, ex-Ministro da Justiça e Segurança Pública e ex-Juiz Federal.'
  }
];

async function seed() {
  console.log("Semeando ministros do STF...");
  for (const min of ministros) {
    const { data, error } = await supabase
      .from('radar_stf_ministros')
      .select('id')
      .eq('nome', min.nome)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Erro ao checar ministro ${min.nome}:`, error.message);
      continue;
    }

    if (!data) {
      const { error: insErr } = await supabase
        .from('radar_stf_ministros')
        .insert(min);
      if (insErr) {
        console.error(`Erro ao inserir ${min.nome}:`, insErr.message);
      } else {
        console.log(`Ministro inserido: ${min.nome}`);
      }
    } else {
      console.log(`Ministro já existe, atualizando foto: ${min.nome}`);
      await supabase
        .from('radar_stf_ministros')
        .update({ foto_url: min.foto_url, bio_resumo: min.bio_resumo })
        .eq('id', data.id);
    }
  }
  console.log("Concluído!");
}

seed();
