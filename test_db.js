const { createClient } = require('@supabase/supabase-js');
const url = 'https://nbbzqoeubzfwyvwwygkr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYnpxb2V1Ynpmd3l2d3d5Z2tyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg1NjM1NCwiZXhwIjoyMTA2NDMyMzU0fQ.n9Js0hgOh_9sdWTvBqtO2Womoit8TB2tyiQ6IKZzros';

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('bot_state').upsert({ chat_id: 123456789, step: 'NAME', name: null, class_name: null, updated_at: new Date().toISOString() });
  console.log("Upsert Error:", error);
  console.log("Upsert Data:", data);
}

test();
