import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Verify it's an UPDATE on profiles
    if (payload.type !== 'UPDATE' || payload.table !== 'profiles') {
      return new Response('Ignoring non-update or non-profiles event', { status: 200 });
    }

    const { record, old_record } = payload;

    // Check if onboarding_completed_at was just set
    const justCompleted = record.onboarding_completed_at && !old_record.onboarding_completed_at;

    if (!justCompleted) {
      return new Response('Onboarding already completed or not completed yet, ignoring', { status: 200 });
    }

    const userId = record.id;
    const persona = record.status_perfil;
    const rawName = record.display_name || 'Estudante';
    const first = rawName.split(/\s+/)[0];
    const nome = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();

    // Prepare push payload based on persona
    let title = `Bem-vindo, ${nome}!`;
    let body = 'Tudo pronto para alavancar seus estudos. Que tal explorar os conteúdos?';
    
    if (persona === 'estudante_oab') {
      title = `OAB, aí vamos nós, ${nome}!`;
      body = 'Seu perfil OAB foi configurado com sucesso. Venha conhecer a ferramenta de questões!';
    } else if (persona === 'concurso') {
      title = `Futuro concursado, ${nome}!`;
      body = 'Perfil para concursos ativado. Sua rotina de estudos agradece.';
    } else if (persona === 'advogado') {
      title = `Doutor(a) ${nome}!`;
      body = 'Ferramentas práticas para a advocacia ativadas e prontas para uso.';
    } else if (persona === 'academico') {
      title = `Olá, Acadêmico ${nome}!`;
      body = 'Sua jornada na universidade acaba de ganhar um super upgrade.';
    }

    // Call send-push edge function using supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient.functions.invoke('send-push', {
      body: {
        title,
        body,
        emoji: '🎉',
        audience: {
          user_ids: [userId]
        },
        personalize: false, // We already personalized it here
        mirror_canal: false, // Don't post to whatsapp canal
      }
    });

    if (error) {
      console.error('Error triggering send-push:', error);
      throw new Error(`Failed to send push: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Push triggered successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
