const { createClient } = require('@supabase/supabase-js');
const url = 'https://nbbzqoeubzfwyvwwygkr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYnpxb2V1Ynpmd3l2d3d5Z2tyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg1NjM1NCwiZXhwIjoyMTA2NDMyMzU0fQ.n9Js0hgOh_9sdWTvBqtO2Womoit8TB2tyiQ6IKZzros';

const supabase = createClient(url, key);

async function setup() {
  console.log("Checking buckets...");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Error listing buckets:", bucketError);
  } else {
    const hasHomework = buckets.find(b => b.name === 'homework');
    if (!hasHomework) {
      console.log("Creating 'homework' bucket...");
      const { error } = await supabase.storage.createBucket('homework', { public: true });
      if (error) console.error("Error creating bucket:", error);
      else console.log("Bucket created successfully.");
    } else {
      console.log("Bucket 'homework' already exists.");
      // Ensure it's public
      const { error } = await supabase.storage.updateBucket('homework', { public: true });
      if (error) console.log("Error updating bucket to public:", error);
    }
  }
}

setup();
