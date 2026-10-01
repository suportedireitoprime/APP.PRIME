require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROJECT_REF = 'dnjrgpldcwcpoywamorr';

async function setupCronJobs() {
  const jobs = [
    { name: 'boletim-juridico-0600', schedule: '0 6 * * *', endpoint: 'boletim-juridico-gerar', body: {} },
    { name: 'audioaula-matinal-0800', schedule: '0 8 * * *', endpoint: 'push-aleatorio-audio', body: { automation_key: 'push-aleatorio-audio-1' } },
    { name: 'videoaula-matinal-1000', schedule: '0 10 * * *', endpoint: 'push-aleatorio-video', body: { automation_key: 'push-aleatorio-video-1' } },
    { name: 'artigo-blog-1200', schedule: '0 12 * * *', endpoint: 'push-aleatorio-blog', body: { automation_key: 'push-aleatorio-blog' } },
    { name: 'livro-biblioteca-1400', schedule: '0 14 * * *', endpoint: 'push-aleatorio-livro', body: { automation_key: 'push-aleatorio-livro' } },
    { name: 'audioaula-tarde-1600', schedule: '0 16 * * *', endpoint: 'push-aleatorio-audio', body: { automation_key: 'push-aleatorio-audio-2' } },
    { name: 'videoaula-noite-1800', schedule: '0 18 * * *', endpoint: 'push-aleatorio-video', body: { automation_key: 'push-aleatorio-video-2' } },
    { name: 'audioaula-noturna-2000', schedule: '0 20 * * *', endpoint: 'push-aleatorio-audio', body: { automation_key: 'push-aleatorio-audio-3' } },
    { name: 'noticias-giro-2200', schedule: '0 22 * * *', endpoint: 'boletim-noticias-gerar', body: {} },
    { name: 'horus-coruja-0000', schedule: '0 0 * * *', endpoint: 'push-estudo-madrugada', body: { automation_key: 'push-estudo-madrugada' } },
  ];

  let sql = `
SELECT cron.unschedule('push-aleatorio-audio-old');
SELECT cron.unschedule('push-aleatorio-video-old');
SELECT cron.unschedule('push-aleatorio-audio');
SELECT cron.unschedule('push-aleatorio-video');
SELECT cron.unschedule('boletim-0600');
`;

  for (const job of jobs) {
    const url = `https://${PROJECT_REF}.supabase.co/functions/v1/${job.endpoint}`;
    sql += `
SELECT cron.unschedule('${job.name}');
SELECT cron.schedule(
  '${job.name}',
  '${job.schedule}',
  $$
    select net.http_post(
      url:='${url}',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb,
      body:='${JSON.stringify(job.body)}'::jsonb
    ) as request_id;
  $$
);
`;
  }

  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: { sql: sql, secret: 'super-secret-admin' }
  });

  if (error) {
    console.error("Error executing SQL via admin-sql:", error);
  } else {
    console.log("SQL executed successfully! Result:", JSON.stringify(data, null, 2));
  }
}

setupCronJobs();
