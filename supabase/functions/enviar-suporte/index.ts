import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.13"

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

    const GMAIL_USER = Deno.env.get('GMAIL_USER') || 'suporte.direitoprime@gmail.com'
    const GMAIL_PASS = Deno.env.get('GMAIL_PASS') || 'ukbpuzsgwefmdnet'

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"Suporte App Prime" <${GMAIL_USER}>`,
      replyTo: email,
      to: 'suporte.direitoprime@gmail.com',
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
