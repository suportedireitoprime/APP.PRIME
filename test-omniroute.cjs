const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function run() {
  console.log("Fetching OmniRoute API key via Edge Function...");
  const { data, error } = await supabase.functions.invoke('get-omniroute-key');
  
  if (error) {
    console.error("Error fetching key:", error);
    return;
  }
  
  const apiKey = data?.key;
  if (!apiKey) {
    console.error("No API key returned");
    return;
  }
  console.log("Key fetched successfully. Calling OmniRoute...");
  
  const GATEWAY = "https://omniroute-production-fb57.up.railway.app/v1/chat/completions";
  const MODEL = "antigravity/gemini-3.7-flash-high";
  
  const start = Date.now();
  
  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: 'Escreva um parágrafo longo sobre o princípio da insignificância.' }
        ]
      })
    });
    
    const time = Date.now() - start;
    console.log(`Request completed in ${time}ms`);
    
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const json = await res.json();
    console.log("Response:");
    console.log(json.choices[0].message.content);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
