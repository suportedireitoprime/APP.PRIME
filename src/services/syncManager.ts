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
