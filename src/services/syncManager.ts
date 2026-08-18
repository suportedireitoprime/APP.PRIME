import { supabase } from '@/integrations/supabase/client';
import { saveOfflinePackage } from './downloadManager';

export async function syncTableToOffline(tableName: string, id: string, name: string, filter?: {col: string, val: string}) {
  const step = 1000;
  let from = 0;
  const rows = [];
  
  while (true) {
    let q = supabase.from(tableName).select('*').range(from, from + step - 1);
    if (filter) q = q.eq(filter.col, filter.val);
    
    const { data, error } = await q;
    if (error) throw error;
    
    if (!data || data.length === 0) break;
    rows.push(...data);
    
    if (data.length < step) break;
    from += step;
  }
  
  await saveOfflinePackage(id, name, rows);
  return rows.length;
}

export async function downloadJsonBundle(id: string, name: string) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/offline-bundles/${id}.json`);
  if (!res.ok) throw new Error(`Falha ao baixar pacote ${id}.json`);
  const data = await res.json();
  await saveOfflinePackage(id, name, data);
  return data.length;
}
