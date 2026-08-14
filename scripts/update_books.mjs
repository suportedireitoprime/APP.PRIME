import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const estimatedPages = {
  // biblioteca_classicos
  'A Riqueza das Nações': 2411,
  
  // biblioteca_oratoria
  'Líderes e discursos que revolucionaram o mundo por fernando s. almeida': 300,
  'As armas da persuasão por robert b. cialdini': 304,
  'Comunicação não-violenta': 288,
  
  // biblioteca_lideranca
  'Os 7 Hábitos das Pessoas Altamente Eficazes': 432,
  'Liderança: A Inteligência Emocional na Formação do Líder de Sucesso': 144,
  'O Monge e o Executivo: Uma História sobre a Essência da Liderança': 144,
  'Comece pelo Porquê': 256,
  'O Poder da Autorresponsabilidade': 160,
  'A Coragem para Liderar': 304,
  'Responsabilidade Extrema': 336,
  'Os 5 Desafios das Equipes': 208,
  'Radical Candor': 320,
  'As 21 Irrefutáveis Leis da Liderança': 336,
  
  // biblioteca_portugues
  'Redação para concursos': 150,
  'Colocação pronominal': 80,
  'Classes gramaticais': 120,
  'Pontuação': 90,
  'Regência verbal e nominal': 100,
  'Acentuação e crase': 80,
  'Classes gramaticais e tempos verbais': 140,
  'Concordância verbal e nominal': 110,
  'Orações coordenadas e subordinadas': 130,
  'Semântica': 90,
  'Interpretação de textos': 160,
  
  // biblioteca_pesquisa_cientifica
  'Metodologia Científica': 200,
  'Introdução à Metodologia Científica': 180,
  
  // biblioteca_fora_da_toga
  'Mentes ansiosas: o medo e a ansiedade': 240,
  'A arte do impossível por steven kotler': 336,
  'O ponto da virada por malcolm gladwell': 336,
  'Deconstruindo a ansiedade': 272,
  'O poder do foco por louise sallow': 288,
  'Inteligência positiva por shirzad chamine': 288,
  'Como se libertar das relações tóxicas': 256,
  'Cinco linguagens da valorização pessoal no ambiente de trabalho': 224,
  'O efeito facebook por david kirkpatrick': 416,
  'Holocausto nunca mais': 256,
  'Falando com estranhos por malcolm gladwell': 352,
  'Fora de série por malcolm gladwell': 336,
  'O mito da beleza por naomi wolf': 464,
  'Trabalhe 4 horas por timothy ferriss': 416,
  'Milagre do amanhã por hal elrod': 192,
  'Einstein - sua vida por walter isaacson': 688,
  'Por que fazemos o que fazemos por mario sergio cortella': 176,
  'Descartes: a paixão pela razão por mario sergio cortella': 144,
  'Por que o que nos torna curiosos por mario sergio cortella': 160,
  'A psicologia do sonho por sigmund freud': 128,
  'Filosofia e nós com isso? por mario sergio cortella': 160,
  'A interpretação dos sonhos por sigmund freud': 600,
  'A batalha das ideias por matt richtel': 304,
  'Superinteligência por nick bostrom': 432,
  'Neurociência para líderes: como liderar pessoas por nikolaos dimitriadis': 272,
  'Mentes maquiavélicas': 288,
  'Faça seu cérebro trabalhar por você': 208,
  'Mentes perigosas': 240,
  'Foco': 304,
  'A análise da inteligência': 256,
  'Fazendo as pazes com a ansiedade': 192,
  'A arte de ser feliz': 128,
  'A fascinante construção do eu': 224,
  '13 coisas autodestrutivas por mark manson': 256,
  'O poder do hábit por charles duhigg': 408,
  'Feitas para durar por jerry i. porras': 368,
  'A sutil arte de ligar o foda-se': 224,
  'À prova de estresse': 304,
  'Inteligência emocional': 384,
  'A estratégia do oceano azul por w. chan kim e renée mauborgne': 288,
  'Armadilhas da mente': 224,
  'O jeito disney de encantar os clientes por disney institute': 208,
  'Como lidar com pessoas manipuladoras por george k. simon': 240,
  'A autobiografia de martin luther king por clayborne carson (org)': 432,
  'Nome do livro: novo manual do fbi por robin dreeke e cameron stauth': 288
};

const tables = [
  'biblioteca_classicos',
  'biblioteca_oab',
  'biblioteca_estudos',
  'biblioteca_fora_da_toga',
  'biblioteca_oratoria',
  'biblioteca_lideranca',
  'biblioteca_portugues',
  'biblioteca_pesquisa_cientifica'
];

async function updateBooks() {
  let updatedCount = 0;
  for (const table of tables) {
    const isTema = ['biblioteca_estudos', 'biblioteca_oab'].includes(table);
    const titleField = isTema ? 'tema' : 'livro';
    
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${titleField}, paginas, minutos_leitura`)
      .or('paginas.is.null,minutos_leitura.is.null');

    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`Updating ${data.length} records in ${table}...`);
      for (const row of data) {
        const title = row[titleField] || '';
        let pag = row.paginas;
        let min = row.minutos_leitura;

        if (!pag) {
          pag = estimatedPages[title.trim()] || 45; // default 45 pages for study materials
        }
        if (!min) {
          min = Math.round(pag * 1.3); // 1.3 minutes per page
        }

        const { error: updErr } = await supabase
          .from(table)
          .update({ paginas: pag, minutos_leitura: min })
          .eq('id', row.id);

        if (updErr) {
          console.error(`Failed to update ${title}:`, updErr);
        } else {
          updatedCount++;
        }
      }
    }
  }
  console.log(`Successfully updated ${updatedCount} books.`);
}

updateBooks();
