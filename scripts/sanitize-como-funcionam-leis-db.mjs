import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function sanitizeMarkdown(md) {
  if (!md) return '';
  let text = md.replace(/\r\n/g, '\n');

  // Garante que bullets comecem com '- ' e nao '* '
  text = text.replace(/^(\s*)\*\s+(\*\*|[A-Za-z0-9])/gm, '$1- $2');

  // Garante linha vazia antes de um bloco de lista se precedido por paragrafo comum
  text = text.replace(/([^\n])\n(- [^\n]+)/g, '$1\n\n$2');

  // Garante linha vazia depois de um bloco de lista se seguido por paragrafo comum
  text = text.replace(/(- [^\n]+)\n([^\n\-\*\#\>])/g, '$1\n\n$2');

  // Garante linha vazia antes de blockquote
  text = text.replace(/([^\n])\n(> [^\n]+)/g, '$1\n\n$2');

  // Garante linha vazia depois de blockquote
  text = text.replace(/(> [^\n]+)\n([^\n\>])/g, '$1\n\n$2');

  // Garante linha vazia antes e depois de titulos ## e ###
  text = text.replace(/([^\n])\n(#{1,4} [^\n]+)/g, '$1\n\n$2');
  text = text.replace(/(#{1,4} [^\n]+)\n([^\n])/g, '$1\n\n$2');

  // Garante linha vazia antes e depois de divisores horizontais '---' (para nunca virar cabeçalho Setext)
  text = text.replace(/([^\n])\n---/g, '$1\n\n---');
  text = text.replace(/\n---\n([^\n])/g, '\n---\n\n$1');

  // Remove quebras triplas ou maiores
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

async function run() {
  const { data: posts, error } = await supabase
    .from('blog_edicao_posts')
    .select('id, titulo, conteudo_md')
    .ilike('id', 'edicao-como-funcionam-leis-%')
    .order('id');

  if (error) {
    console.error('Erro ao buscar posts:', error);
    process.exit(1);
  }

  console.log(`Encontrados ${posts.length} artigos para sanitizacao.`);

  for (const post of posts) {
    const sanitized = sanitizeMarkdown(post.conteudo_md);
    const { error: updErr } = await supabase
      .from('blog_edicao_posts')
      .update({
        conteudo_md: sanitized
      })
      .eq('id', post.id);

    if (updErr) {
      console.error(`Erro ao atualizar ${post.id}:`, updErr);
    } else {
      console.log(`✓ ${post.id} sanitizado com sucesso.`);
    }
  }

  console.log('Todos os 10 artigos foram sanitizados no Supabase!');
}

run().catch(console.error);
