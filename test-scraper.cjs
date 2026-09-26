require('dotenv').config();
fetch("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/concursos_noticias?select=*", {
  headers: {
    apikey: process.env.VITE_SUPABASE_ANON_KEY
  }
})
.then(r => r.json())
.then(data => console.log(data.slice(0,3)));
