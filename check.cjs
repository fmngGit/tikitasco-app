const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function test() {
  const { data: e } = await supabase.from('expenses').select('*');
  console.log("Expenses:", JSON.stringify(e, null, 2));
  const { data: g } = await supabase.from('games').select('id, group_id');
  console.log("Games count:", g ? g.length : 0);
  const { data: v } = await supabase.from('votes').select('*');
  console.log("Votes count:", v ? v.length : 0);
}
test();
