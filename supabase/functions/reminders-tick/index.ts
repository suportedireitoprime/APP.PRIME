// deno-lint-ignore-file no-explicit-any
// Tick: encontra reminders vencidos e dispara. Roda a cada 1 min via pg_cron.
// - Faz até MAX_RETRIES tentativas por canal em caso de falha (retry imediato,
//   sem replanejar o next_fire_at — a 2ª tentativa acontece no mesmo tick).
// - Loga TODAS as tentativas em `reminder_dispatch_log` (auditoria).
// - Quando todos os canais falham, insere um aviso em `avisos` pro usuário.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { evolution } from '../_shared/evolution.ts';
import { sanitizeFirstName } from '../_shared/nomeSanitizer.ts';
import { generateLembreteText } from '../_shared/lembreteAiText.ts';
import { processarAdminAlertas } from '../_shared/adminAlertas.ts';


const MAX_RETRIES = 2;

const MSG_POOL: Record<string, { title: string; body: string }[]> = {
  padrao: [
    { title: '📖 Hora de ler', body: 'Ei {nome}, {livro} está te esperando. Só 10 minutos hoje já contam.' },
    { title: '📚 Sua sessão de leitura', body: 'Retome de onde parou em {livro}.' },
    { title: '📕 Lembrete de leitura', body: 'Pequenas doses diárias formam grandes leitores. Bora, {nome}?' },
  ],
  motivacional: [
    { title: '🔥 Não quebra o ritmo', body: '{nome}, mantenha a chama de {livro} acesa!' },
    { title: '💪 Foco total', body: '15 minutos em {livro} agora valem por 1 hora amanhã.' },
    { title: '🚀 Uma página por vez', body: 'Cada linha de {livro} te aproxima do próximo nível.' },
  ],
  bem_humorado: [
    { title: '👀 Cadê você?', body: '{livro} tá aqui olhando a hora. Não deixa ele no vácuo, {nome}.' },
    { title: '🍿 Sessão premium', body: 'Trocou o livro pelo TikTok de novo? Vem, {livro} tá bom demais.' },
  ],
  zen: [
    { title: '🌙 Momento seu', body: 'Respira. Abre {livro}. Só você e a página.' },
    { title: '🍃 Pausa consciente', body: 'Silencia o mundo por 10 minutos com {livro}.' },
  ],
};

function render(t: string, ctx: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? '').replace(/\s{2,}/g, ' ').trim();
}
function daySeed() { return Math.floor(Date.now() / 86400000); }
function pickMsg(estilo: string, ctx: { nome: string; livro: string }) {
  const pool = MSG_POOL[estilo] || MSG_POOL.padrao;
  const raw = pool[daySeed() % pool.length];
  return { title: render(raw.title, ctx), body: render(raw.body, ctx) };
}

function tzOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(at);
  const g = (t: string) => +parts.find(p => p.type === t)!.value;
  const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return Math.round((asUTC - at.getTime()) / 60000);
}

function computeNextFireAt(timeHHMM: string, timezone: string, dow: number[]): Date {
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const now = new Date();
  const tz = timezone || 'America/Sao_Paulo';
  for (let i = 0; i < 14; i++) {
    const probe = new Date(now.getTime() + i * 86400000);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    }).formatToParts(probe);
    const wk = parts.find(p => p.type === 'weekday')?.value || '';
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekdayLocal = map[wk] ?? 0;
    if (!dow.includes(weekdayLocal)) continue;
    const y = parts.find(p => p.type === 'year')!.value;
    const M = parts.find(p => p.type === 'month')!.value;
    const D = parts.find(p => p.type === 'day')!.value;
    const offsetMin = tzOffsetMinutes(tz, probe);
    const localMs = Date.UTC(+y, +M - 1, +D, hh, mm, 0) - offsetMin * 60000;
    const fire = new Date(localMs);
    if (fire.getTime() > now.getTime() - 30_000) return fire;
  }
  return new Date(now.getTime() + 86400000);
}

async function withRetries<T>(fn: () => Promise<T>): Promise<{ ok: boolean; value?: T; error?: string; attempts: number }> {
  let lastErr = '';
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const value = await fn();
      return { ok: true, value, attempts: attempt };
    } catch (e: any) {
      lastErr = e?.message || String(e);
      if (attempt <= MAX_RETRIES) await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
  return { ok: false, error: lastErr, attempts: MAX_RETRIES + 1 };
}

/** Distância em metros entre duas coordenadas (Haversine). */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const logDispatch = async (row: {
    reminder_id: string; user_id: string; canal: string; status: string;
    reminder_type: 'reading' | 'article_time' | 'location' | 'questoes';
    retry_attempt?: number; error?: string;
    livro_id?: string | null; livro_titulo?: string | null;
    article_ref?: string | null; article_titulo?: string | null;
  }) => {
    try { await admin.from('reminder_dispatch_log').insert(row); } catch {}
  };

  const notifyFailure = async (user_id: string, prefs: any, kind: string, label: string, err: string) => {
    if (prefs?.failure_alerts === false) return;
    try {
      await admin.from('avisos').insert({
        user_id,
        titulo: '⚠️ Lembrete não foi enviado',
        mensagem: `Não conseguimos enviar seu lembrete "${label}" (${kind}). Motivo: ${err}. Tentaremos novamente no próximo disparo.`,
        avisar_em: new Date().toISOString(),
        ativo: true,
      });
    } catch {}
  };

  const getPrefs = async (user_id: string) => {
    try {
      const { data } = await admin.from('user_reminder_preferences').select('*').eq('user_id', user_id).maybeSingle();
      return data;
    } catch { return null; }
  };

  const sendPushWithRetry = async (payload: any) => withRetries(async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SRK}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`push HTTP ${res.status}`);
    return await res.text();
  });

  const sendPushAudienceWithRetry = async (payload: any) => withRetries(async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SRK}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`send-push HTTP ${res.status}`);
    return await res.text();
  });

  // ---- Circuit breaker do WhatsApp (Evolution) --------------------------
  // A instância cai com frequência ("no active session found") e, até aqui,
  // cada lembrete tentava mesmo assim e morria sem fallback. Agora checamos
  // o estado UMA vez por execução e, ao primeiro erro de sessão/autorização,
  // marcamos o canal como fora do ar e mandamos tudo por push.
  let waState: 'unknown' | 'up' | 'down' = 'unknown';
  const WA_DOWN_RE = /no active session|not authorized|401|403|instance not found/i;

  const whatsappUsable = async (): Promise<boolean> => {
    if (waState !== 'unknown') return waState === 'up';
    try {
      const st = await evolution.connectionState();
      const s = JSON.stringify(st ?? {}).toLowerCase();
      waState = /"open"|connected/.test(s) ? 'up' : 'down';
    } catch {
      waState = 'down';
    }
    if (waState === 'down') console.warn('[reminders-tick] WhatsApp indisponível — usando push como canal');
    return waState === 'up';
  };

  const sendHorusWithRetry = async (phone: string, text: string) => {
    if (!(await whatsappUsable())) {
      return { ok: false, error: 'whatsapp_indisponivel (circuit breaker)', attempts: 0 };
    }
    const res = await withRetries(async () => {
      await evolution.sendText(phone, text);
    });
    if (!res.ok && WA_DOWN_RE.test(res.error || '')) waState = 'down';
    return res;
  };


  try {
    // ============ 0) alertas do admin (cadastro / trial) ============
    try { await processarAdminAlertas(admin); } catch (e) { console.error('[reminders-tick] admin alertas', e); }

    // ============ 1) reading_reminders ============

    const { data: needSchedule } = await admin.from('reading_reminders')
      .select('*').eq('enabled', true).is('next_fire_at', null).limit(200);
    for (const r of needSchedule || []) {
      const next = computeNextFireAt(r.time_of_day, r.timezone, r.days_of_week);
      await admin.from('reading_reminders').update({ next_fire_at: next.toISOString() }).eq('id', r.id);
    }

    const { data: due } = await admin.from('reading_reminders')
      .select('*').eq('enabled', true).lte('next_fire_at', now.toISOString()).limit(500);

    const fired: any[] = [];
    for (const r of due || []) {
      const [{ data: prof }, { data: horusUser }, { data: horusStats }, prefs] = await Promise.all([
        admin.from('profiles').select('display_name').eq('id', r.user_id).maybeSingle(),
        admin.from('horus_whatsapp_users').select('phone_e164, verified_at, nome_preferido, apelido, apelido_ativo').eq('user_id', r.user_id).maybeSingle(),
        admin.from('horus_user_stats').select('nome_preferido').eq('user_id', r.user_id).maybeSingle(),
        getPrefs(r.user_id),
      ]);
      const apelidoHorus = horusUser?.apelido_ativo ? sanitizeFirstName(horusUser?.apelido) : '';
      const nome =
        apelidoHorus ||
        sanitizeFirstName(prof?.display_name) ||
        sanitizeFirstName(horusUser?.nome_preferido) ||
        sanitizeFirstName(horusStats?.nome_preferido) ||
        '';
      const nomeParaMsg = nome || 'você';
      const livro = r.livro_titulo || 'seu livro';
      const base = pickMsg(r.message_style || 'padrao', { nome: nomeParaMsg, livro });

      // Tenta gerar uma versão mais fluida via IA — cai no template se falhar.
      const aiText = await generateLembreteText({
        primeiroNome: nome || undefined,
        tipo: 'leitura',
        tituloAlvo: livro,
        mensagemUsuario: r.message || undefined,
        hora: r.time_of_day,
        estilo: r.message_style || 'padrao',
      }).catch(() => null);

      const requested: string[] = r.channels || ['push'];
      // Dedup: quando o WhatsApp está disponível E verificado, ele vira o canal
      // principal e o push só entra como fallback caso o WhatsApp falhe.
      const horusRequested = requested.includes('horus_whatsapp');
      const pushRequested = requested.includes('push');
      const horusAvailable = horusRequested && !!horusUser?.phone_e164 && !!horusUser?.verified_at;

      const failures: string[] = [];
      let horusOk = false;

      if (horusAvailable) {
        const bodyHorus =
          aiText ||
          `${nome ? `${nome}, ` : ''}${base.body}`;
        const text = `*${base.title}*\n${bodyHorus}\n\n_Direito Prime · https://simply-sweet-calc-06.lovable.app/biblioteca_`;
        const res = await sendHorusWithRetry(horusUser!.phone_e164, text);
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'horus_whatsapp',
          status: res.ok ? 'sent' : 'error', error: res.error,
          retry_attempt: res.attempts - 1, reminder_type: 'reading',
          livro_id: r.livro_id, livro_titulo: r.livro_titulo,
        });
        if (res.ok) {
          horusOk = true;
          await admin.from('horus_outbound_log').insert({
            phone_e164: horusUser!.phone_e164.replace(/\D/g, ''),
            kind: 'reading_reminder', tipo: 'lembrete_leitura', status: 'sent',
            sent_at: new Date().toISOString(), payload: { text, reminder_id: r.id },
          });
        } else {
          failures.push(`horus: ${res.error}`);
        }
      }

      // Fallback: se o WhatsApp falhou, o push entra mesmo que não tenha sido pedido —
      // melhor entregar por outro canal do que perder o lembrete.
      const shouldPush = (pushRequested || (horusAvailable && !horusOk)) && !horusOk;
      if (shouldPush) {
        const body = aiText || `${nome ? `${nome}, ` : ''}${base.body}`;
        const res = await sendPushWithRetry({
          user_id: r.user_id, title: base.title, body,
          url: r.livro_id ? `/biblioteca?livro=${encodeURIComponent(r.livro_id)}` : '/biblioteca',
          tag: `lembrete-${r.id}`,
        });
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'push',
          status: res.ok ? 'sent' : 'error', error: res.error,
          retry_attempt: res.attempts - 1, reminder_type: 'reading',
          livro_id: r.livro_id, livro_titulo: r.livro_titulo,
        });
        if (!res.ok) failures.push(`push: ${res.error}`);
      }

      const attempted = (horusAvailable ? 1 : 0) + (shouldPush ? 1 : 0);
      if (attempted > 0 && failures.length === attempted) {
        await notifyFailure(r.user_id, prefs, 'leitura', r.livro_titulo || 'lembrete', failures.join(' · '));
      }

      const nextFire = computeNextFireAt(r.time_of_day, r.timezone, r.days_of_week);
      await admin.from('reading_reminders').update({
        last_fired_at: now.toISOString(), next_fire_at: nextFire.toISOString(),
      }).eq('id', r.id);
      fired.push({ id: r.id, requested, horusOk, next: nextFire.toISOString(), failures });
    }

    // ============ 2) article_time_reminders ============
    const artFired: any[] = [];
    const { data: artNeed } = await admin.from('article_time_reminders')
      .select('*').eq('active', true).is('next_fire_at', null).limit(500);
    for (const r of artNeed || []) {
      const next = computeNextFireAt(r.time_of_day, r.timezone, r.days_of_week);
      await admin.from('article_time_reminders').update({ next_fire_at: next.toISOString() }).eq('id', r.id);
    }
    const { data: artDue } = await admin.from('article_time_reminders')
      .select('*').eq('active', true).lte('next_fire_at', now.toISOString()).limit(500);
    for (const r of artDue || []) {
      const ch: string = r.channel || 'push';
      const prefs = await getPrefs(r.user_id);

      // Nome preferido do usuário (com sanitização anti "Direito").
      const [{ data: prof }, { data: wa }, { data: horusStats }] = await Promise.all([
        admin.from('profiles').select('display_name').eq('id', r.user_id).maybeSingle(),
        admin.from('horus_whatsapp_users').select('phone_e164, verified_at, nome_preferido, apelido, apelido_ativo').eq('user_id', r.user_id).maybeSingle(),
        admin.from('horus_user_stats').select('nome_preferido').eq('user_id', r.user_id).maybeSingle(),
      ]);
      const apelidoHorus = wa?.apelido_ativo ? sanitizeFirstName(wa?.apelido) : '';
      const nome =
        apelidoHorus ||
        sanitizeFirstName(prof?.display_name) ||
        sanitizeFirstName(wa?.nome_preferido) ||
        sanitizeFirstName(horusStats?.nome_preferido) ||
        '';

      const title = `⏰ ${r.label}`;
      const baseBody = (r.message && r.message.trim()) || `Hora de revisar ${r.artigo_titulo}`;

      // Texto fluido via IA — sempre citando o nome quando existir.
      const aiText = await generateLembreteText({
        primeiroNome: nome || undefined,
        tipo: 'artigo',
        tituloAlvo: r.artigo_titulo,
        mensagemUsuario: r.message || undefined,
        hora: r.time_of_day,
      }).catch(() => null);
      const body = aiText || `${nome ? `${nome}, ` : ''}${baseBody}`;

      const wantsPush = ch === 'push' || ch === 'both';
      const wantsHorus = ch === 'horus' || ch === 'both';
      const horusAvailable = wantsHorus && !!wa?.phone_e164 && !!wa?.verified_at;

      const failures: string[] = [];
      let horusOk = false;

      if (horusAvailable) {
        const text = `⏰ *${r.label}*\n${body}\n\n_${r.artigo_titulo}_`;
        const res = await sendHorusWithRetry(wa!.phone_e164, text);
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'horus',
          status: res.ok ? 'sent' : 'error', error: res.error,
          retry_attempt: res.attempts - 1, reminder_type: 'article_time',
          article_ref: r.artigo_ref, article_titulo: r.artigo_titulo,
        });
        if (res.ok) {
          horusOk = true;
          await admin.from('horus_outbound_log').insert({
            phone_e164: wa!.phone_e164.replace(/\D/g, ''),
            kind: 'article_time_reminder', tipo: 'lembrete_artigo_horario',
            status: 'sent', sent_at: new Date().toISOString(),
            payload: { text, reminder_id: r.id },
          });
        } else { failures.push(`horus: ${res.error}`); }
      } else if (wantsHorus) {
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'horus',
          status: 'skipped', error: 'WhatsApp não verificado',
          reminder_type: 'article_time', article_ref: r.artigo_ref, article_titulo: r.artigo_titulo,
        });
      }

      // Fallback para push quando o WhatsApp falha.
      const shouldPush = (wantsPush || (horusAvailable && !horusOk)) && !horusOk;
      if (shouldPush) {
        const res = await sendPushAudienceWithRetry({
          audience: { user_ids: [r.user_id] }, title, body, tag: `article-reminder-${r.id}`,
        });
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'push',
          status: res.ok ? 'sent' : 'error', error: res.error,
          retry_attempt: res.attempts - 1, reminder_type: 'article_time',
          article_ref: r.artigo_ref, article_titulo: r.artigo_titulo,
        });
        if (!res.ok) failures.push(`push: ${res.error}`);
      }

      const attempted = (horusAvailable ? 1 : 0) + (shouldPush ? 1 : 0);
      if (attempted > 0 && failures.length === attempted) {
        await notifyFailure(r.user_id, prefs, 'artigo', r.label, failures.join(' · '));
      }

      const next = computeNextFireAt(r.time_of_day, r.timezone, r.days_of_week);
      await admin.from('article_time_reminders').update({
        last_fired_at: now.toISOString(),
        next_fire_at: next.toISOString(),
        triggered_count: (r.triggered_count || 0) + 1,
      }).eq('id', r.id);
      artFired.push({ id: r.id, ch, horusOk, next: next.toISOString(), failures });
    }

    // ============ 3) location_reminders (geofence do lado do servidor) ============
    // Rede de segurança: mesmo com o app fechado, se a última posição conhecida
    // do usuário (enviada pelo watcher em background) estiver dentro do raio de
    // um lembrete ativo, disparamos o push por aqui.
    const locFired: any[] = [];
    try {
      const FRESH_MS = 25 * 60 * 1000;      // posição precisa ser recente
      const COOLDOWN_MS = 60 * 60 * 1000;   // no máximo 1 aviso por lembrete/hora

      const { data: locs } = await admin
        .from('user_last_location')
        .select('user_id, lat, lng, updated_at')
        .gte('updated_at', new Date(now.getTime() - FRESH_MS).toISOString())
        .limit(2000);

      if (locs && locs.length) {
        const { data: lrs } = await admin
          .from('location_reminders')
          .select('id,user_id,label,message,address,lat,lng,radius_m,channel,last_triggered_at,triggered_count,artigo_ref,target_route,origem')
          .eq('active', true)
          .in('user_id', locs.map((l: any) => l.user_id))
          .limit(5000);

        const byUser = new Map<string, any[]>();
        for (const r of lrs || []) {
          const arr = byUser.get(r.user_id) || [];
          arr.push(r);
          byUser.set(r.user_id, arr);
        }

        for (const loc of locs) {
          for (const r of byUser.get(loc.user_id) || []) {
            const last = r.last_triggered_at ? new Date(r.last_triggered_at).getTime() : 0;
            if (now.getTime() - last < COOLDOWN_MS) continue;

            const dist = haversineMeters(loc.lat, loc.lng, r.lat, r.lng);
            if (dist > (r.radius_m || 300)) continue;

            const ch = (r.channel || 'push') as string;
            const wantsPush = ch === 'push' || ch === 'both';
            const wantsHorus = ch === 'horus' || ch === 'both';
            const failures: string[] = [];
            let horusOk = false;

            if (wantsHorus) {
              const { data: wa } = await admin
                .from('horus_whatsapp_users')
                .select('phone_e164, verified_at')
                .eq('user_id', r.user_id)
                .maybeSingle();
              if (wa?.phone_e164 && wa?.verified_at) {
                const text = `📍 *${r.label}*\n${r.message}${r.address ? `\n\n_${r.address}_` : ''}`;
                const res = await sendHorusWithRetry(wa.phone_e164, text);
                await logDispatch({
                  reminder_id: r.id, user_id: r.user_id, canal: 'horus',
                  status: res.ok ? 'sent' : 'error', error: res.error,
                  retry_attempt: res.attempts - 1, reminder_type: 'location',
                });
                if (res.ok) horusOk = true; else failures.push(`horus: ${res.error}`);
              }
            }

            const shouldPush = (wantsPush || (wantsHorus && !horusOk)) && !horusOk;
            if (shouldPush) {
              const res = await sendPushAudienceWithRetry({
                audience: { user_ids: [r.user_id] },
                title: `📍 ${r.label}`,
                body: r.message,
                url: r.target_route || (r.artigo_ref ? `/lei?ref=${encodeURIComponent(r.artigo_ref)}` : '/lembretes-local'),
                tag: `location-reminder-${r.id}`,
              });
              await logDispatch({
                reminder_id: r.id, user_id: r.user_id, canal: 'push',
                status: res.ok ? 'sent' : 'error', error: res.error,
                retry_attempt: res.attempts - 1, reminder_type: 'location',
              });
              if (!res.ok) failures.push(`push: ${res.error}`);
            }

            if (horusOk || failures.length === 0) {
              await admin.from('location_reminders').update({
                last_triggered_at: now.toISOString(),
                triggered_count: (r.triggered_count || 0) + 1,
              }).eq('id', r.id);
              await admin.from('location_reminder_events').insert({
                reminder_id: r.id, user_id: r.user_id,
                distance_m: Math.round(dist), channel: ch, origin: 'server',
              });
              locFired.push({ id: r.id, dist: Math.round(dist), ch });
            }
          }
        }
      }
    } catch (e) {
      console.error('[reminders-tick] location', e);
    }


    // ============ 3b) questoes_lembretes (praticar questões no horário) ============
    const qFired: any[] = [];
    try {
      const DIA_IDX: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
      // Horário é interpretado no fuso de Brasília (UTC-3).
      const TZ_OFFSET_MIN = -180;
      const proximoDisparo = (dias: string[], horario: string): Date | null => {
        const idxs = (dias || []).map((d) => DIA_IDX[d]).filter((n) => n !== undefined);
        if (!idxs.length) return null;
        const [hh, mm] = String(horario).split(':').map(Number);
        for (let add = 0; add <= 8; add++) {
          const base = new Date(now.getTime() + TZ_OFFSET_MIN * 60000 + add * 86400000);
          const dow = base.getUTCDay();
          if (!idxs.includes(dow)) continue;
          const localMidnightUtc = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
          const fire = new Date(localMidnightUtc + (hh * 60 + mm) * 60000 - TZ_OFFSET_MIN * 60000);
          if (fire.getTime() > now.getTime()) return fire;
        }
        return null;
      };

      const { data: qrs } = await admin
        .from('questoes_lembretes')
        .select('id,user_id,ativo,dias,horario,meta_questoes,next_fire_at')
        .eq('ativo', true)
        .limit(5000);

      for (const r of qrs || []) {
        const next = proximoDisparo(r.dias || [], r.horario || '20:00');
        if (!r.next_fire_at) {
          if (next) await admin.from('questoes_lembretes').update({ next_fire_at: next.toISOString() }).eq('id', r.id);
          continue;
        }
        if (new Date(r.next_fire_at).getTime() > now.getTime()) continue;

        const meta = r.meta_questoes || 10;
        const res = await sendPushAudienceWithRetry({
          audience: { user_ids: [r.user_id] },
          title: '🎯 Hora de praticar questões',
          body: `Bora resolver ${meta} questões agora?`,
          url: '/questoes/praticar',
          tag: `questoes-lembrete-${r.id}`,
        });
        await logDispatch({
          reminder_id: r.id, user_id: r.user_id, canal: 'push',
          status: res.ok ? 'sent' : 'error', error: res.error,
          retry_attempt: res.attempts - 1, reminder_type: 'questoes',
        });
        if (next) await admin.from('questoes_lembretes').update({ next_fire_at: next.toISOString() }).eq('id', r.id);
        qFired.push({ id: r.id, ok: res.ok });
      }
    } catch (e) {
      console.error('[reminders-tick] questoes', e);
    }

    // ============ 4) manutenção horária: tokens de push mortos ============
    // Roda uma vez por hora (minuto 7) pra não pesar no cron de 1 min.
    let tokensInvalidados = 0;
    if (now.getUTCMinutes() === 7) {
      try {
        const cutoff = new Date(now.getTime() - 60 * 86400000).toISOString();
        const { data: stale } = await admin
          .from('device_tokens')
          .select('id, updated_at, last_success_at')
          .is('invalidated_at', null)
          .lt('updated_at', cutoff)
          .limit(500);
        const ids = (stale || [])
          .filter((t: any) => !t.last_success_at || t.last_success_at < cutoff)
          .map((t: any) => t.id);
        if (ids.length) {
          await admin.from('device_tokens')
            .update({ invalidated_at: now.toISOString(), invalid_reason: 'inativo_60d' })
            .in('id', ids);
          tokensInvalidados = ids.length;
        }
      } catch (e) {
        console.error('[reminders-tick] limpeza de tokens', e);
      }
    }

    return new Response(JSON.stringify({
      ok: true, fired: fired.length, backfilled: (needSchedule || []).length,
      article_fired: artFired.length, article_backfilled: (artNeed || []).length,
      location_fired: locFired.length,
      whatsapp: waState, tokens_invalidados: tokensInvalidados,
      details: fired, article_details: artFired, location_details: locFired,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[reminders-tick] fatal', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
