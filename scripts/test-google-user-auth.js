import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function testGoogleUserAuth() {
  console.log('🔍 Testing Google User Auth Edge Function...');
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // First, let's check if we can authenticate
    console.log('1. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    console.log('✅ Session found, access token length:', session.access_token.length);
    
    // Test the Edge Function with check-env action
    console.log('2. Testing Edge Function with check-env...');
    const checkEnvResponse = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        action: 'check-env'
      })
    });
    
    console.log('Check-env response status:', checkEnvResponse.status);
    const checkEnvData = await checkEnvResponse.text();
    console.log('Check-env response:', checkEnvData);
    
    if (checkEnvResponse.ok) {
      console.log('✅ Environment check successful');
    } else {
      console.error('❌ Environment check failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGoogleUserAuth(); 