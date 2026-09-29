import fs from 'fs';
import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const workbook = xlsx.readFile('juiz_direito.xlsx');

async function importAll() {
  try {
    const examName = 'Juiz Substituto';
    console.log('Upserting exam...');
    let examId;
    const { data: examData, error: examError } = await supabase
      .from('simulado_exams')
      .select('id')
      .eq('name', examName)
      .single();
    
    if (examData) {
      examId = examData.id;
    } else {
      const { data: newExam } = await supabase
        .from('simulado_exams')
        .insert({ name: examName })
        .select()
        .single();
      examId = newExam.id;
    }

    console.log('Exam ID:', examId);

    const sheetNames = workbook.SheetNames;
    
    for (const sheetName of sheetNames) {
      const year = parseInt(sheetName);
      if (isNaN(year)) continue;

      console.log(`\nProcessing sheet: ${sheetName} (Year ${year})`);
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      if (data.length === 0) {
        console.log(`No data in sheet ${sheetName}`);
        continue;
      }
      
      console.log(`Parsed ${data.length} rows.`);

      // we just take the first row's URLs for the whole simulado
      const firstRow = data[0];
      const prova_url = firstRow.prova || '';
      const gabarito_url = firstRow.gabarito || '';
      const edital_url = firstRow.edital || '';

      let simuladoId;
      const { data: existingSim } = await supabase
        .from('simulados')
        .select('id')
        .eq('exam_id', examId)
        .eq('year', year)
        .single();

      if (existingSim) {
        simuladoId = existingSim.id;
        console.log(`Simulado for ${year} already exists (${simuladoId}). Deleting old questions...`);
        await supabase
          .from('simulado_questions')
          .delete()
          .eq('simulado_id', simuladoId);
      } else {
        const { data: newSim, error: simError } = await supabase
          .from('simulados')
          .insert({
            exam_id: examId,
            year: year,
            prova_url,
            gabarito_url,
            edital_url
          })
          .select()
          .single();
        
        if (simError) throw simError;
        simuladoId = newSim.id;
      }

      console.log(`Simulado ID for ${year}:`, simuladoId);

      const formattedQuestions = data.map(q => ({
        simulado_id: simuladoId,
        text: q.texto_questao || '',
        disciplina: q.disciplina || '',
        assunto: q.assunto || '',
        options: {
          A: q.alternativa_a || '',
          B: q.alternativa_b || '',
          C: q.alternativa_c || '',
          D: q.alternativa_d || '',
          E: q.alternativa_e || ''
        },
        correct_comment: q.comentario_correta || '',
        incorrect_comment: q.comentario_incorretas || '',
        image_url: q.figura || q.texto_apoio || '',
        gabarito: q.resposta_correta || ''
      }));

      const { error: qError } = await supabase
        .from('simulado_questions')
        .insert(formattedQuestions);

      if (qError) {
        console.error(`Error inserting questions for ${year}:`, qError);
      } else {
        console.log(`Inserted ${formattedQuestions.length} questions for ${year}.`);
      }
    }

    console.log('\nImport finished.');
  } catch (e) {
    console.error(e);
  }
}

importAll();
