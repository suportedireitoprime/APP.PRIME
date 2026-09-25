import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user making the request
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Verify admin email
    const { data: adminCheck } = await supabaseClient.rpc('is_admin_email');
    if (!adminCheck) {
      const adminEmails = [
        'wn7corporation@gmail.com', 'adayltoncosta37680@gmail.com', 
        'lailsonrodriguesn01@gmail.com', 'felipe.dls1203@gmail.com', 'm10292723@gmail.com'
      ];
      if (!adminEmails.includes(user.email || '')) {
         return new Response(JSON.stringify({ error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
      }
    }

    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL is not set');
    }
    
    // Connect to postgres directly to fetch all users in < 1 second
    const pool = new postgres.Pool(dbUrl, 3, true);
    const connection = await pool.connect();
    
    let allUsers = [];
    try {
      const result = await connection.queryObject`
        SELECT 
          u.id, 
          u.email, 
          u.created_at, 
          u.last_sign_in_at,
          u.raw_user_meta_data as user_metadata,
          p.display_name as profile_display_name,
          COALESCE(p.is_premium, false) as is_premium,
          a.last_seen_at as activity_last_seen_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        LEFT JOIN (
          SELECT user_id, MAX(last_seen_at) as last_seen_at 
          FROM public.user_activity_log 
          GROUP BY user_id
        ) a ON a.user_id = u.id
        ORDER BY COALESCE(a.last_seen_at, u.last_sign_in_at, u.created_at) DESC
      `;
      allUsers = result.rows;
    } finally {
      connection.release();
      await pool.end();
    }

    return new Response(JSON.stringify(allUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
