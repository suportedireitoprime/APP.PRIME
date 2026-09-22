import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supa = createClient(url, key);

async function run() {
  const { data, error } = await supa.from("push_campaigns").select("*").gte("created_at", new Date().toISOString().split("T")[0]);
  console.log("push_campaigns today:", data?.map(d => ({id: d.id, title: d.title, status: d.status, automation_key: d.automation_key})));
  
  const { data: bData } = await supa.from("boletins_juridicos").select("*").gte("created_at", new Date().toISOString().split("T")[0]);
  console.log("boletins today:", bData?.map(d => ({id: d.id, titulo: d.titulo, status: d.status})));
}

run().catch(console.error);
