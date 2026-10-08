import fs from 'fs';

let content = fs.readFileSync('supabase/functions/gerar-resumo-artigo/index.ts', 'utf8');

content = content.replace(
  'A explica\u00E7\u00E3o deve ser did\u00E1tica, mas extremamente rica e completa em detalhes, focando em tudo o que \u00E9 relevante para provas e pr\u00E1tica.',
  'DICA DE FORMATA\u00C7\u00C3O (MUITO IMPORTANTE): Sempre que voc\u00EA quiser destacar a palavra, express\u00E3o ou conceito-chave principal de um par\u00E1grafo/bullet, coloque-o entre `crases simples` (exemplo: `conceito importante`). O sistema vai pintar isso de amarelo para o aluno. Grife apenas os trechos exatos e curtos mais vitais. A explica\u00E7\u00E3o deve ser did\u00E1tica, extremamente rica e completa em detalhes.'
);

content = content.replace(
  `"exemplos": "2 a 4 exemplos pr\u00E1ticos de aplica\u00E7\u00E3o da lei. Formate como uma lista limpa, ex: '1. **T\u00EDtulo do Exemplo:** Explica\u00E7\u00E3o...'. CUIDADO: NUNCA quebre a formata\u00E7\u00E3o do negrito em m\u00FAltiplas linhas e evite usar '**' soltos.",`,
  `"exemplos": "Gere EXATAMENTE 3 exemplos pr\u00E1ticos de aplica\u00E7\u00E3o da lei. Formate OBRIGATORIAMENTE usando lista numerada limpa, ex: '1. **T\u00EDtulo do Exemplo:** Explica\u00E7\u00E3o... 2. **T\u00EDtulo do Exemplo:** Explica\u00E7\u00E3o...'.",`
);

fs.writeFileSync('supabase/functions/gerar-resumo-artigo/index.ts', content, 'utf8');
