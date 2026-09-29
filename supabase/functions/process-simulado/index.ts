import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as xlsx from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Process FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const banca = formData.get('banca') as string;
    const institution = formData.get('institution') as string;
    const yearStr = formData.get('year') as string;
    
    if (!file) throw new Error('No file uploaded');

    const year = parseInt(yearStr, 10);
    
    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(new Uint8Array(arrayBuffer), { type: 'array' });
    
    // Assume first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new Error('Spreadsheet is empty');
    }

    // 1. Insert Exam Metadata
    const { data: examData, error: examError } = await supabase
      .from('simulado_exams')
      .insert({
        title,
        banca,
        institution,
        year
      })
      .select()
      .single();

    if (examError) throw examError;

    const examId = examData.id;

    // 2. Map and Insert Questions
    const questions = data.map((row: any) => ({
      simulado_exam_id: examId,
      numero_questao: row['numero_questao'] || row['Numero'] || row['N'] || null,
      disciplina: row['disciplina'] || row['Disciplina'] || '',
      enunciado: row['enunciado'] || row['Enunciado'] || '',
      alternativa_a: row['alt_a'] || row['A'] || '',
      alternativa_b: row['alt_b'] || row['B'] || '',
      alternativa_c: row['alt_c'] || row['C'] || '',
      alternativa_d: row['alt_d'] || row['D'] || '',
      alternativa_e: row['alt_e'] || row['E'] || '',
      gabarito: row['gabarito'] || row['Gabarito'] || '',
      comentario_professor: row['comentario'] || row['Comentario'] || ''
    }));

    // Batch insert
    for (let i = 0; i < questions.length; i += 100) {
      const chunk = questions.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('simulado_questions')
        .insert(chunk);
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Simulado criado com ${questions.length} questões.`, 
      examId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
