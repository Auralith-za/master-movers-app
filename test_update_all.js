import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', 'f08f524e-bc23-4af2-a6a5-3fb49fffe9be').single();
  const payload = {
      client_name: quote.client_name,
      client_phone: quote.client_phone,
      client_email: quote.client_email,
      pickup_address: quote.pickup_address,
      dropoff_address: quote.dropoff_address,
      move_date: quote.move_date,
      status: quote.status,
      rejection_reason: quote.rejection_reason,
      team_notes: quote.team_notes,
      items_json: quote.items_json,
      total_price: quote.total_price,
      total_volume: quote.total_volume,
      customer_comments: quote.customer_comments,
      access_details: quote.access_details,
      packaging_option: quote.packaging_option,
      st7_boxes: quote.st7_boxes,
      linen_boxes: quote.linen_boxes,
      insurance_enabled: quote.insurance_enabled,
      is_shared_load: quote.is_shared_load,
      custom_products: quote.custom_products
  };
  const res = await supabase.from('quotes').update(payload).eq('id', quote.id);
  console.log(JSON.stringify(res, null, 2));
}
test();
