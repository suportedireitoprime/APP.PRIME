-- Habilitar a extensão pgvector
create extension if not exists vector with schema public;

-- Adicionar a coluna de embedding na tabela de artigos
alter table public.vade_mecum_artigos 
add column if not exists embedding vector(1536);

-- Criar um index para otimizar buscas de similaridade (Cosine Distance)
-- Nota: HNSW é recomendado em tabelas grandes para performance.
create index if not exists vade_mecum_artigos_embedding_idx 
on public.vade_mecum_artigos 
using hnsw (embedding vector_cosine_ops);

-- Função de match (busca semântica)
create or replace function public.match_leis (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  lei_id uuid,
  numero text,
  texto text,
  similarity float
)
language sql stable
as $$
  select
    vma.id,
    vma.lei_id,
    vma.numero,
    vma.texto,
    1 - (vma.embedding <=> query_embedding) as similarity
  from public.vade_mecum_artigos vma
  where 1 - (vma.embedding <=> query_embedding) > match_threshold
  order by vma.embedding <=> query_embedding
  limit match_count;
$$;
