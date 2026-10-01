const { createClient } = require('@supabase/supabase-js');
const url = 'https://nbbzqoeubzfwyvwwygkr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYnpxb2V1Ynpmd3l2d3d5Z2tyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg1NjM1NCwiZXhwIjoyMTA2NDMyMzU0fQ.n9Js0hgOh_9sdWTvBqtO2Womoit8TB2tyiQ6IKZzros';

const supabase = createClient(url, key);

async function test() {
  console.log("1. Testing Storage Upload...");
  const dummyBlob = new Blob(["hello world"], { type: "text/plain" });
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('homework')
    .upload(`files/test_${Date.now()}.txt`, dummyBlob);
    
  if (storageError) {
    console.error("Storage Error:", storageError);
  } else {
    console.log("Storage Success:", storageData);
  }
  
  console.log("2. Testing Submissions Insert...");
  const { error: dbError } = await supabase
    .from('submissions')
    .insert([
      {
        first_name: "Test",
        last_name: "User",
        class_name: "9/1",
        file_url: "https://example.com/file.txt"
      }
    ]);
    
  if (dbError) {
    console.error("DB Insert Error:", dbError);
  } else {
    console.log("DB Insert Success!");
  }
}

test();
