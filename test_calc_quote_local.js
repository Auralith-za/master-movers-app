import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { calculateQuote } from './src/features/inventory/store/moveStore.js';
import { INVENTORY_ITEMS } from './src/features/inventory/data/mockItems';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
supabase.from('quotes')
  .select('*')
  .eq('id', 'ff6d8aad-36b6-4f05-a850-dc45cd01d8cb')
  .single()
  .then(res => {
    const quote = res.data;
    const items = quote.items_json?.items || quote.items_json || {};
    const specialWrapping = quote.items_json?.special_wrapping || {};
    const moveDetails = {
      pickupAddress: quote.pickup_address,
      dropoffAddress: quote.dropoff_address,
      pickupCity: quote.pickup_address,
      dropoffCity: quote.dropoff_address,
      distanceKm: quote.distance_km,
      totalBillableDistance: quote.distance_km,
      moveDate: quote.move_date,
      packagingOption: quote.packaging_option,
      st7Boxes: quote.st7_boxes,
      linenBoxes: quote.linen_boxes,
      insuranceEnabled: quote.insurance_enabled,
      isSharedLoad: quote.is_shared_load,
      paymentMethod: quote.payment_method
    };
    
    const resultNormal = calculateQuote(items, moveDetails, quote.access_details, INVENTORY_ITEMS, quote.manual_service_charges || {}, 0, specialWrapping, false);
    const resultAdmin = calculateQuote(items, moveDetails, quote.access_details, INVENTORY_ITEMS, quote.manual_service_charges || {}, 0, specialWrapping, true);
    
    console.log("Database Total Price:", quote.total_price);
    console.log("Result Normal Total:", resultNormal.total);
    console.log("Result Admin Total:", resultAdmin.total);
    console.log("Result Normal Breakdown:", JSON.stringify(resultNormal.breakdown, null, 2));
    console.log("Result Admin Breakdown:", JSON.stringify(resultAdmin.breakdown, null, 2));
  });
