const fs = require('fs');
const { execSync } = require('child_process');

const funcs = [
  "gerar-estudo",
  "grifo-foto",
  "identificar-artigos-foto",
  "visual-juridico-gerar",
  "vademecum-sync-alteracoes",
  "reextrair-lei-planalto",
  "radar-leis-notify",
  "radar-detectar-impacto-leis",
  "questao-acao-ia",
  "processar-pdf",
  "praticar-gerar-desafios",
  "popular-radar-proposicoes",
  "lei-seca-gerar",
  "jurisprudencia-explicar",
  "jurisprudencia-refinar",
  "gerar-resumo-artigo",
  "grifar-por-voz",
  "gerar-videoaula-conteudo",
  "gerar-resumo-cornell-card",
  "gerar-resumo",
  "gerar-global",
  "gerar-aula-do-livro",
  "explicar-passo",
  "extrair-reviews-concorrente",
  "boletim-juridico-gerar",
  "boletim-noticias-gerar",
  "blog-edicao-runner",
  "blog-edicao-gerar-temas",
  "biblioteca-enriquecer",
  "biblioteca-ocr-mistral",
  "audioaulas-gerar",
  "gerar-metodologia",
  "admin-flashcards-leis",
  "horus",
  "vademecum-compare-ia",
  "tematica-porque-assistir",
  "popular-texto-resenha",
  "peticao",
  "narracao",
  "narrar-artigo",
  "local-info",
  "laboratorio-gerar-cena",
  "home-curiosidade-runner",
  "hero-home-runner",
  "chat-aula",
  "gerar-avaliacao-inteligente"
];

console.log('Deploying ' + funcs.length + ' functions: ' + funcs.join(', '));

for (const func of funcs) {
  console.log('Deploying ' + func + '...');
  try {
    const out = execSync('cmd /c .\\node_modules\\.bin\\supabase.cmd functions deploy ' + func + ' --project-ref dnjrgpldcwcpoywamorr', { stdio: 'pipe' });
    console.log('Success: ' + func);
  } catch (err) {
    console.log('Failed: ' + func + ' - ' + err.message);
  }
}
