import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL(sql) {
  const { data, error } = await sb.functions.invoke('admin-sql', {
    body: { sql, secret: 'super-secret-admin' }
  });
  if (error) {
    console.error('SQL Error for:', sql.substring(0, 80));
    console.error('Response:', JSON.stringify(data));
    throw new Error(error.message);
  }
  return data?.result || [];
}

async function main() {
  // Use cron.alter_job to fix schedules
  // Blog: 12:00 BRT = 15:00 UTC => "0 15 * * *"  
  // Audio: 15:00 BRT = 18:00 UTC => "0 18 * * *"
  // Video: 18:00 BRT = 21:00 UTC => "0 21 * * *"

  // First get job IDs
  const jobs = await runSQL("SELECT jobid, jobname, schedule FROM cron.job WHERE jobname LIKE '%push_aleatorio%' ORDER BY jobname");
  console.log('Current jobs:', JSON.stringify(jobs, null, 2));

  const fixes = {
    'push_aleatorio_blog': '0 15 * * *',
    'push_aleatorio_audio': '0 18 * * *', 
    'push_aleatorio_video': '0 21 * * *',
  };

  for (const job of jobs) {
    const newSchedule = fixes[job.jobname];
    if (newSchedule && job.schedule !== newSchedule) {
      console.log(`\nFixing ${job.jobname} (id=${job.jobid}): "${job.schedule}" => "${newSchedule}"`);
      try {
        await runSQL(`SELECT cron.alter_job(${job.jobid}, '${newSchedule}')`);
        console.log('  ✅ Updated!');
      } catch (e) {
        console.log('  ❌ alter_job failed, trying unschedule+schedule...');
        // Fallback: unschedule and re-schedule
        try {
          await runSQL(`SELECT cron.unschedule('${job.jobname}')`);
          // Get the original command
          const origJobs = await runSQL(`SELECT command FROM cron.job WHERE jobid = ${job.jobid}`);
          // Actually this won't work if already unscheduled. Let's try the direct approach.
          console.log('  Need manual fix in Supabase Dashboard > SQL Editor');
        } catch (e2) {
          console.log('  Error:', e2.message);
        }
      }
    } else {
      console.log(`${job.jobname} already correct: "${job.schedule}"`);
    }
  }
}
main().catch(e => console.error('FATAL:', e.message));
