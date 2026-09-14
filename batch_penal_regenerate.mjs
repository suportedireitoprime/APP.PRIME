import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Iniciando batch de limpeza e regeneração do Direito Penal...\n");
    
    const { data: area, error: areaErr } = await supabase.from('aprender_areas').select('id').ilike('nome', '%Direito Penal%').single();
    if (areaErr || !area) {
        console.error("Erro achando area:", areaErr);
        return;
    }
    const areaId = area.id;
    console.log(`[1] Area ID (Direito Penal): ${areaId}`);

    const { data: modulos, error: modErr } = await supabase.from('aprender_modulos').select('id, titulo').eq('area_id', areaId);
    if (modErr) {
        console.error("Erro achando modulos:", modErr);
        return;
    }
    console.log(`[2] Encontrados ${modulos.length} módulos.\n`);

    let feitos = 0;
    for (let i = 23; i < modulos.length; i++) {
        const mod = modulos[i];
        console.log(`---------------------------------`);
        console.log(`Processando [${i + 1}/${modulos.length}]: ${mod.titulo}`);
        
        const { error: delErr } = await supabase.from('aprender_aulas').delete().eq('modulo_id', mod.id);
        if (delErr) {
            console.error(`  -> Erro ao deletar aulas do modulo ${mod.titulo}:`, delErr);
            continue;
        }
        console.log(`  -> Aulas deletadas.`);

        const edgeUrl = `${supabaseUrl}/functions/v1/aprender-modulo-gerar-aulas`;
        try {
            const res = await fetch(edgeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ moduloId: mod.id })
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`  -> Sucesso:`, data.message);
            } else {
                console.error(`  -> Erro Edge Function:`, data);
            }
        } catch (e) {
            console.error(`  -> Exception chamando Edge:`, e);
        }
        
        feitos++;
        const progresso = Math.round((feitos / modulos.length) * 100);
        console.log(`  -> Progresso Total: ${progresso}%\n`);
        
        await sleep(3000); 
    }
    console.log(`=== CONCLUIDO === Todos os ${feitos} módulos foram processados.`);
}

run();
