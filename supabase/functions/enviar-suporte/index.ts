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
    const { assunto, mensagem, email, isReply } = await req.json()

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

    if (isReply) {
      // Admin está respondendo ao usuário (enviar PARA o usuário)
      await transporter.sendMail({
        from: `"Suporte App Prime" <${GMAIL_USER}>`,
        to: email,
        subject: `[Direito Prime] Nova resposta no seu ticket: ${assunto}`,
        html: `
          <h3>Nova mensagem no seu ticket</h3>
          <p>Olá,</p>
          <p>Nossa equipe acabou de responder ao seu chamado sobre <strong>${assunto}</strong>.</p>
          <hr />
          <p><strong>Resposta da equipe:</strong></p>
          <p style="white-space: pre-wrap; background: #f4f4f5; padding: 16px; border-radius: 8px;">${mensagem}</p>
          <br/>
          <p>Você pode continuar essa conversa diretamente pelo aplicativo na aba <strong>Conversas</strong> do Suporte.</p>
        `
      })
    } else {
      // Usuário abriu ticket (enviar PARA o suporte)
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

      // Enviar confirmação para o e-mail do usuário
      await transporter.sendMail({
        from: `"Suporte App Prime" <${GMAIL_USER}>`,
        to: email,
        subject: `[Direito Prime] Recebemos seu contato: ${assunto}`,
        html: `
          <h3>Olá! Recebemos sua mensagem.</h3>
          <p>Este é um e-mail automático para confirmar que nossa equipe recebeu sua solicitação sobre <strong>${assunto}</strong>.</p>
          <p>Nós responderemos o mais rápido possível. Você também pode acompanhar o andamento ou responder diretamente pela aba <strong>Conversas</strong> no painel de Suporte do aplicativo.</p>
          <br/>
          <p>Atenciosamente,</p>
          <p><strong>Equipe Direito Prime</strong></p>
        `
      })
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
