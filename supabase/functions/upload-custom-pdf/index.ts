import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { pdfId } = body;

    if (!pdfId) {
      return new Response(JSON.stringify({ error: 'Missing pdfId' }), { status: 400, headers: corsHeaders });
    }

    // Initialize Admin client to bypass RLS and generate Signed Upload URLs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const pdfPath = `${user.id}/${pdfId}.pdf`;
    const coverPath = `${user.id}/${pdfId}-cover.jpg`;

    // Generate signed upload URLs valid for 1 hour
    const { data: pdfUrlData, error: pdfErr } = await supabaseAdmin.storage
      .from('custom_pdfs')
      .createSignedUploadUrl(pdfPath);

    if (pdfErr) throw pdfErr;

    const { data: coverUrlData, error: coverErr } = await supabaseAdmin.storage
      .from('custom_pdfs')
      .createSignedUploadUrl(coverPath);

    if (coverErr) throw coverErr;

    // Get the public URLs for these files since the bucket is public
    const { data: pdfPublicUrl } = supabaseAdmin.storage.from('custom_pdfs').getPublicUrl(pdfPath);
    const { data: coverPublicUrl } = supabaseAdmin.storage.from('custom_pdfs').getPublicUrl(coverPath);

    return new Response(
      JSON.stringify({
        pdfUploadUrl: pdfUrlData.signedUrl,
        coverUploadUrl: coverUrlData.signedUrl,
        pdfPath,
        coverPath,
        pdfPublicUrl: pdfPublicUrl.publicUrl,
        coverPublicUrl: coverPublicUrl.publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
