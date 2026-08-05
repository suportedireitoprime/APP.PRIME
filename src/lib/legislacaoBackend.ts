// Backend unificado (projeto "dnjrgpldcwcpoywamorr") onde vivem TODAS as leis,
// artigos, súmulas, narrações e edge functions do Vade Mecum.
//
// IMPORTANTE: NÃO usar `import.meta.env.VITE_SUPABASE_URL` como fallback aqui.
// O `.env` deste projeto (Lovable Cloud) aponta para o backend próprio do app
// (usuários, boards, dicionário...), que NÃO contém as tabelas
// `vade_mecum_leis` / `vade_mecum_artigos`. Se usarmos o env, as chamadas
// batem no projeto errado e voltam vazias (Constituição/Códigos sem artigos).
export const LEIS_SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
export const LEIS_SUPABASE_PROJECT_ID = 'dnjrgpldcwcpoywamorr';
export const LEIS_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

export const leisAuthHeaders = () => ({
  apikey: LEIS_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${LEIS_SUPABASE_ANON_KEY}`,
});