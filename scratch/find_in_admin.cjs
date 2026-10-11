const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function find() {
  const { data, error } = await sb.rpc('admin_lista_dia', { _tipo: 'online', _dia: '2026-10-11' });
  console.log('Online count:', data ? data.length : error);
  if (data) {
    const leandro = data.find(u => (u.email || '').includes('leandro') || (u.title || '').includes('Leandro'));
    console.log('Leandro in online:', leandro);
    const wagner = data.find(u => (u.email || '').includes('wagner') || (u.title || '').includes('wagner'));
    console.log('Wagner in online:', wagner);
  }

  // Also check online5m
  const { data: data5m } = await sb.rpc('admin_lista_dia', { _tipo: 'online5m', _dia: '2026-10-11' });
  if (data5m) {
    const l5 = data5m.find(u => (u.email || '').includes('leandro'));
    console.log('Leandro in 5m:', l5);
  }

  // Also check cadastros or paywall
  const { data: paywall } = await sb.rpc('admin_lista_dia', { _tipo: 'paywall', _dia: '2026-10-11' });
  if (paywall) {
    const lp = paywall.find(u => (u.email || '').includes('leandro'));
    console.log('Leandro in paywall:', lp);
  }
}

find().catch(console.error);
