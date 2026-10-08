import fs from 'fs';

const API_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/gerar-resumo-artigo';

async function startRobot() {
    console.log('🤖 Robô Gerador de Explicações (Omniroute Sandbox) Iniciado!\n');
    console.log('Carregando public/laws-bundle/cc.json...');
    
    try {
        const fileContent = fs.readFileSync('public/laws-bundle/cc.json', 'utf8');
        const data = JSON.parse(fileContent);
        
        // Filtrar apenas os blocos que são "artigos" (ignora LIVRO, TÍTULO, CAPÍTULO...)
        // O json no APP.PRIME não tem o campo 'tipo', então verificamos se 'numero' começa com dígito
        const artigos = data.filter(b => b.numero && /^[0-9]/.test(b.numero));
        
        console.log(`\n✅ Total de artigos encontrados: ${artigos.length}\n`);

        for (let i = 0; i < artigos.length; i++) {
            const artigo = artigos[i];
            const progresso = `[${i + 1}/${artigos.length}]`;
            
            process.stdout.write(`${progresso} Processando Artigo ${artigo.numero}... `);
            
            const payload = {
                tabela_codigo: "CC_CODIGO_CIVIL",
                numero_artigo: String(artigo.numero),
                area: "Direito Civil",
                lei_nome: "Código Civil",
                texto: artigo.texto
            };
            
            try {
                const apiRes = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const json = await apiRes.json();
                
                if (!apiRes.ok) {
                    if (apiRes.status === 429) {
                        console.log('❌ Rate limit atingido. Aguardando 15 segundos...');
                        await new Promise(r => setTimeout(r, 15000));
                        i--; // Tentar de novo
                        continue;
                    }
                    throw new Error(json.error || `HTTP ${apiRes.status}`);
                }
                
                if (json.cached) {
                    console.log('⏭️ Já existia no banco de dados (Pulando).');
                } else {
                    console.log('✅ Gerado e Salvo com SUCESSO no Supabase!');
                    // Respeita o limite do Gemini (apenas p/ segurança para não tomar 429 rápido)
                    await new Promise(r => setTimeout(r, 2000)); 
                }
            } catch (e) {
                console.log(`❌ ERRO: ${e.message}`);
            }
        }
        
        console.log('\n🎉 Finalizado o processamento de todo o Código Civil!');
        
    } catch (error) {
        console.error('\n❌ Erro global:', error.message);
    }
}

startRobot();
