import { createClient } from '@supabase/supabase-js';

// Lovable Cloud project (separate from the external legislation Supabase used
// by `client.ts`). Tables like `jurisprudencia_prontas`, `artigos_grifos`,
// `artigos_anotacoes`, `artigo_ai_cache`, etc. live here.
const CLOUD_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const CLOUD_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

export const supabaseCloud = createClient<any>(CLOUD_URL, CLOUD_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: false,
    autoRefreshToken: false,
  },
});