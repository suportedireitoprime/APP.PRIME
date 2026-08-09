import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assunto, mensagem, email } = await req.json()

    if (!assunto || !mensagem || !email) {
      throw new Error('Faltam parâmetros obrigatórios.')
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY não configurada.')

    // Enviar o e-mail via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Suporte App Prime <onboarding@resend.dev>',
        reply_to: email, // Quando a equipe responder, vai para o usuário
        to: ['suporte.direitoprime@gmail.com'], // O destino final do suporte
        subject: `[SUPORTE] ${assunto} - ${email}`,
        html: `
          <h3>Nova mensagem de Suporte - Direito Prime</h3>
          <p><strong>Usuário (Email):</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${assunto}</p>
          <hr />
          <p><strong>Mensagem:</strong></p>
          <p style="white-space: pre-wrap;">${mensagem}</p>
        `
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Erro no Resend: ${errorText}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
