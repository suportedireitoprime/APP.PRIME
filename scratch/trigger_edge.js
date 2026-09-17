import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.VITE_SUPABASE_ANON_KEY;
fetch('https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/sync-stf-streams', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.text())
.then(data => console.log(data))
.catch(err => console.error(err));
