import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // First insert
  const { data: insertData, error: insertError } = await supabase
    .from('quotes')
    .insert([{ client_name: 'Test Person' }])
    .select();
  console.log('Insert:', { insertData, insertError });

  if (insertData && insertData.length > 0) {
    const id = insertData[0].id;
    // Now try to update
    const { data: updateData, error: updateError } = await supabase
      .from('quotes')
      .update({ client_name: 'Updated Person' })
      .eq('id', id)
      .select();
    console.log('Update:', { updateData, updateError });
    
    // Select
    const { data: selectData } = await supabase.from('quotes').select('*').eq('id', id);
    console.log('Select:', selectData);
  }
}
test();
