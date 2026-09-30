const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: exp } = await supabase.from('expenses').select('id');
  const { data: loc } = await supabase.from('global_locations').select('id');
  console.log("Expenses:", exp ? exp.length : 0);
  console.log("Locations:", loc ? loc.length : 0);
}
test();
