const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export type FnHandler = (req: Request) => Promise<Response> | Response;

/**
 * Roteador simples para funções unificadas.
 * O alvo vem de `?fn=` na URL ou do campo `fn` no corpo JSON.
 * O corpo é preservado integralmente para o handler de destino.
 */
export function createRouter(routes: Record<string, FnHandler>, fallback?: string) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const url = new URL(req.url);
    let target = url.searchParams.get('fn') ?? '';
    let forwarded = req;

    if (!target && req.method !== 'GET' && req.method !== 'HEAD') {
      const raw = await req.text();
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed.fn === 'string') target = parsed.fn;
      } catch {
        // corpo não-JSON: segue para o fallback
      }
      forwarded = new Request(req.url, { method: req.method, headers: req.headers, body: raw });
    }

    if (!target && fallback) target = fallback;

    const handler = routes[target];
    if (!handler) {
      return new Response(
        JSON.stringify({ error: `fn inválido: "${target}"`, disponiveis: Object.keys(routes) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return await handler(forwarded);
  };
}
