import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from "npm:xlsx@0.18.5";

const SHEET_ID = '1cFFzWZURvR0FDiSrqKPqV4NEmrRwZThEAPuSpD7xpa0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

serve(async (req) => {
  try {
    console.log('Fetching Google Sheet as XLSX...');
    const res = await fetch(SHEET_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet: ${res.statusText}`);
    }
    
    const arrayBuffer = await res.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    
    let allPautasToInsert: any[] = [];

    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      let headerRow = -1;
      for(let i = 0; i < rawData.length; i++) {
         if(Array.isArray(rawData[i]) && (rawData[i].includes('Processo / Paradigma') || rawData[i].includes('Processo'))) {
            headerRow = i;
            break;
         }
      }

      if (headerRow !== -1) {
        const headers = rawData[headerRow] as string[];
        const rows = rawData.slice(headerRow + 1);

        for (const row of rows) {
          if (!Array.isArray(row) || row.length === 0) continue;
          
          // Helper to get value by header name
          const getValue = (headerName: string) => {
             const idx = headers.findIndex(h => typeof h === 'string' && h.includes(headerName));
             if (idx === -1) return '';
             return row[idx] || '';
          };

          const processo = getValue('Processo / Paradigma') || getValue('Processo');
          if (!processo || String(processo).trim() === '') continue;

          let modalidadeText = getValue('Modalidade') || 'Presencial';
          let modalidade = 'Presencial';
          if (modalidadeText.toLowerCase().includes('virtual')) modalidade = 'Virtual';
          else if (modalidadeText.toLowerCase().includes('repercussão')) modalidade = 'Repercussão Geral';

          allPautasToInsert.push({
            modalidade: modalidade,
            data_sessao: String(getValue('Data/Período da Sessão') || ''),
            orgao_julgador: String(getValue('Órgão Julgador') || ''),
            processo: String(processo),
            relator: String(getValue('Relator(a)') || ''),
            partes: String(getValue('Partes / Envolvidos') || ''),
            tema_repercussao: String(getValue('Tema de Repercussão Geral') || ''),
            resumo: String(getValue('Assunto / Controvérsia Constitucional Detalhada') || ''),
            status: String(getValue('Status / Fase do Julgamento') || '')
          });
        }
      }
    }

    console.log(`Parsed ${allPautasToInsert.length} total rows from all sheets.`);

    if (allPautasToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No valid rows found' }), { status: 200 });
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: delError } = await supabase.from('stf_pautas').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    if (delError) throw delError;

    const { error: insError } = await supabase.from('stf_pautas').insert(allPautasToInsert);
    if (insError) throw insError;

    return new Response(
      JSON.stringify({ success: true, count: allPautasToInsert.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
