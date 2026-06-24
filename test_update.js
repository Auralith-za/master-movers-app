import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
supabase.from('quotes').update({ team_notes: 'test', customer_comments: 'test' }).eq('id', '00000000-0000-0000-0000-000000000000').then(res => console.log(JSON.stringify(res, null, 2)));
