import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    if (!dbUrl) throw new Error('SUPABASE_DB_URL is not set');

    const pool = new postgres.Pool(dbUrl, 3, true);
    const connection = await pool.connect();

    try {
      // 1. Buscar usuário por email
      const result = await connection.queryObject`
        SELECT u.id, u.email, u.created_at, p.is_premium
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.email ILIKE '%batatais%'
           OR u.email = 'tgbatatais@gmail.com'
           OR u.email = 'batatais.tg02047@gmail.com'
           OR u.id = '23852c99-2429-4164-8c82-7ea4fc2e618f'
      `;

      const users = result.rows;

      const actionsDone = [];

      for (const u of users) {
        // Conceder vitalício em public.profiles
        await connection.queryObject`
          INSERT INTO public.profiles (id, is_premium, updated_at)
          VALUES (${u.id}, true, NOW())
          ON CONFLICT (id) DO UPDATE
          SET is_premium = true, updated_at = NOW()
        `;

        // Conceder vitalício em asaas_subscriptions
        await connection.queryObject`
          INSERT INTO public.asaas_subscriptions (
            user_id, asaas_customer_id, asaas_subscription_id, plano, status, origem, started_at, expires_at, updated_at
          )
          VALUES (
            ${u.id}, 'cus_000178665530', 'pay_nuiej7kbmxufj2gw', 'vitalicio', 'ACTIVE', 'asaas', '2026-05-27 00:00:00+00', NULL, NOW()
          )
          ON CONFLICT (user_id) DO UPDATE
          SET plano = 'vitalicio', status = 'ACTIVE', origem = 'asaas', expires_at = NULL, updated_at = NOW()
        `;

        actionsDone.push({
          userId: u.id,
          email: u.email,
          status: 'VITALICIO_CONCEDIDO'
        });
      }

      // Buscar status final dos perfis
      const verify = await connection.queryObject`
        SELECT u.id, u.email, p.is_premium, s.plano, s.status, s.expires_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        LEFT JOIN public.asaas_subscriptions s ON s.user_id = u.id
        WHERE u.email ILIKE '%batatais%'
           OR u.email = 'tgbatatais@gmail.com'
           OR u.email = 'batatais.tg02047@gmail.com'
           OR u.id = '23852c99-2429-4164-8c82-7ea4fc2e618f'
      `;

      return new Response(JSON.stringify({
        success: true,
        usersFound: users,
        actionsDone,
        verifyRows: verify.rows
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } finally {
      connection.release();
    }
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
