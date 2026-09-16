import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Papa from 'https://esm.sh/papaparse@5.4.1';

const SHEET_ID = '1cFFzWZURvR0FDiSrqKPqV4NEmrRwZThEAPuSpD7xpa0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

serve(async (req) => {
  try {
    console.log('Fetching Google Sheet...');
    const res = await fetch(SHEET_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet: ${res.statusText}`);
    }
    
    const csvText = await res.text();
    
    // As 2 primeiras linhas parecem ser título/vazias. O header real começa na linha 3 (índice 2).
    // Mas o papaparse pode ter problemas se tiver linhas vazias. Vamos limpar.
    const lines = csvText.split('\n');
    let startIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Data/Período da Sessão') || lines[i].includes('Modalidade')) {
        startIdx = i;
        break;
      }
    }
    const cleanCsv = lines.slice(startIdx).join('\n');

    const parsed = Papa.parse(cleanCsv, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;
    console.log(`Parsed ${rows.length} rows.`);

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map rows to our DB schema
    const pautasToInsert = rows.map((row: any) => {
      // Map columns based on CSV headers
      // "Data/Período da Sessão","Órgão Julgador","Modalidade","Processo / Paradigma","Relator(a)","Partes / Envolvidos","Tema de Repercussão Geral","Assunto / Controvérsia Constitucional Detalhada","Status / Fase do Julgamento"
      
      let modalidadeText = row['Modalidade'] || 'Presencial';
      let modalidade = 'Presencial';
      if (modalidadeText.toLowerCase().includes('virtual')) modalidade = 'Virtual';
      else if (modalidadeText.toLowerCase().includes('repercussão')) modalidade = 'Repercussão Geral';

      return {
        modalidade: modalidade,
        data_sessao: row['Data/Período da Sessão'] || '',
        orgao_julgador: row['Órgão Julgador'] || '',
        processo: row['Processo / Paradigma'] || '',
        relator: row['Relator(a)'] || '',
        partes: row['Partes / Envolvidos'] || '',
        tema_repercussao: row['Tema de Repercussão Geral'] || '',
        resumo: row['Assunto / Controvérsia Constitucional Detalhada'] || '',
        status: row['Status / Fase do Julgamento'] || ''
      };
    }).filter((p: any) => p.processo && p.processo.trim() !== '');

    if (pautasToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No valid rows found' }), { status: 200 });
    }

    // Since this is a full sync, we could delete old ones and insert new, or just insert them if we assume a truncate approach.
    // Let's delete all existing and insert new ones to keep it perfectly synced with the Sheet.
    const { error: delError } = await supabase.from('stf_pautas').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
    if (delError) throw delError;

    const { error: insError } = await supabase.from('stf_pautas').insert(pautasToInsert);
    
    if (insError) throw insError;

    return new Response(
      JSON.stringify({ success: true, count: pautasToInsert.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
