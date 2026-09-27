const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error, count } = await supabase
    .from('concursos_noticias')
    .select('*').limit(1);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Total records: ${count}`);

  if (data && data.length > 0) {
    const dates = data.map(d => new Date(d.data_criacao || d.created_at));
    const validDates = dates.filter(d => !isNaN(d.getTime()));
    
    if (validDates.length > 0) {
      const minDate = new Date(Math.min(...validDates));
      const maxDate = new Date(Math.max(...validDates));
      console.log(`Earliest date: ${minDate.toISOString()}`);
      console.log(`Latest date: ${maxDate.toISOString()}`);
    } else {
      console.log('No valid dates found.');
    }
  }
}

checkData();



