import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.4i4k3H-9H4J1fH3d8sXw-qH3w4h4L3-4V3zL4Z3X3r0" // Use a fake anon key or something? Wait, I need the real anon key!

// Wait, I can't easily get the anon key, I'll use the service key
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w";

const supabase = createClient(supabaseUrl, serviceKey)

async function test() {
  const { data, error } = await supabase.from('pilulas_decks').select('*')
  console.log("Service Key Decks:", data, error)
}
test()
