import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const quoteId = 'f08f524e-bc23-4af2-a6a5-3fb49fffe9be';
  
  // Update it
  await supabase.from('quotes').update({ team_notes: 'new note ' + Date.now() }).eq('id', quoteId);
  
  // Select it back
  const { data } = await supabase.from('quotes').select('team_notes').eq('id', quoteId).single();
  console.log("Team Notes after update:", data?.team_notes);
}
test();
