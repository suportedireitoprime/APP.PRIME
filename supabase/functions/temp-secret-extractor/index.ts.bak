Deno.serve(async (req) => {
  return new Response(JSON.stringify({
    service_account: Deno.env.get('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON'),
    sheet_id: Deno.env.get('AUDIOAULAS_SHEET_ID'),
    folder_id: Deno.env.get('DRIVE_ROOT_FOLDER_ID'),
    gemini_api_key: Deno.env.get('GEMINI_API_KEY'),
  }), { headers: { 'Content-Type': 'application/json' } });
});
