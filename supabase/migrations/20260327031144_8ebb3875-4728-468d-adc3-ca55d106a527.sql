-- Create multiple cron jobs to process all 513 deputados in batches of 50
-- Each job runs at a different minute offset to avoid overlap

SELECT cron.schedule(
  'popular-radar-ranking-0',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 0, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-50',
  '5 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 50, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-100',
  '10 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 100, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-150',
  '15 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 150, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-200',
  '20 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 200, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-250',
  '25 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 250, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-300',
  '30 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 300, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-350',
  '35 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 350, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-400',
  '40 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 400, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-450',
  '45 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 450, "batchSize": 50}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'popular-radar-ranking-500',
  '50 */6 * * *',
  $$SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-radar-ranking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"offset": 500, "batchSize": 50}'::jsonb
  ) as request_id;$$
);