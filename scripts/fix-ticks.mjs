import fs from 'fs';
let c = fs.readFileSync('supabase/functions/gerar-resumo-artigo/index.ts', 'utf8');
c = c.replace('entre `crases simples` (exemplo: `conceito importante`)', 'entre \\`crases simples\\` (exemplo: \\`conceito importante\\`)');
fs.writeFileSync('supabase/functions/gerar-resumo-artigo/index.ts', c);
