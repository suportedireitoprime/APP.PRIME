import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(supabaseUrl, supabaseKey);

const IGNORED_EVENTS = new Set([
  'purchase', 'login', 'logout', 'page_view', 'session_start', 'app_open', 
  'permission_prompt_shown', 'permission_denied', 'permission_granted',
  'descoberta_lembretes_local_exibida', 'trial_click', 'start_trial', 'assinatura_aberta',
  'tela_inicial', 'onboarding_start', 'onboarding_complete', 'install',
  'app_updated', 'push_notification_received'
]);

async function run() {
  const { data: freeUsers } = await supabase
    .from('profiles')
    .select('id, is_premium')
    .eq('is_premium', false);
  
  if (!freeUsers || freeUsers.length === 0) return;
  const freeUserIds = new Set(freeUsers.map(u => u.id));

  // Limit to more events to get a good sample
  const { data: events } = await supabase
    .from('app_events')
    .select('event_name, user_id, metadata')
    .order('created_at', { ascending: false })
    .limit(50000);

  const counts = {};
  for (const ev of events || []) {
    if (freeUserIds.has(ev.user_id) && !IGNORED_EVENTS.has(ev.event_name)) {
        let name = ev.event_name;
        
        // Detailed sub-functions mapping
        if (name === 'ferramenta_abrir') {
            const fName = ev.metadata?.ferramenta || ev.metadata?.nome || ev.metadata?.id || 'desconhecida';
            name = `Ferramenta: ${fName}`;
        } else if (name === 'vade_mecum_abrir_lei') {
            name = `Vade Mecum (Lei): ${ev.metadata?.lei_nome || 'desconhecida'}`;
        } else if (name === 'biblioteca_abrir_livro') {
            name = `Biblioteca (Livro): ${ev.metadata?.livro_nome || 'desconhecido'}`;
        } else if (name === 'me_explique_ask') {
            name = `Chat Jurídico (Me Explique)`;
        } else if (name === 'questao_responder') {
            name = `Resolução de Questões`;
        } else if (name === 'pesquisa_realizada') {
            name = `Busca (Pesquisa no app)`;
        } else if (name === 'noticia_abrir') {
            name = `Notícias (Ler notícia)`;
        }
        
        counts[name] = (counts[name] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log('--- TOP 10 FUNÇÕES MAIS ACESSADAS POR USUÁRIOS GRATUITOS ---');
  for (let i = 0; i < Math.min(10, sorted.length); i++) {
    console.log(`${i+1}. ${sorted[i][0]}: ${sorted[i][1]} acessos`);
  }
}

run();
