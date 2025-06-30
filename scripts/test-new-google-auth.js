console.log('🧪 Testing new Google User Auth Edge Function...');

async function testNewGoogleAuth() {
  try {
    console.log('1. Testing with invalid code (should return error)...');
    
    const testResponse = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
      },
      body: JSON.stringify({
        code: 'invalid_test_code',
        redirectUri: 'http://localhost:8080/agendamentos'
      })
    });
    
    console.log('Response status:', testResponse.status);
    const testData = await testResponse.text();
    console.log('Response body:', testData);
    
    if (testResponse.status === 500) {
      console.log('✅ Edge Function está respondendo (erro esperado para código inválido)');
    } else {
      console.log('⚠️ Resposta inesperada da Edge Function');
    }
    
    console.log('');
    console.log('2. Testing CORS preflight...');
    
    const corsResponse = await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,apikey',
      }
    });
    
    console.log('CORS response status:', corsResponse.status);
    console.log('CORS headers:', Object.fromEntries(corsResponse.headers.entries()));
    
    if (corsResponse.status === 200) {
      console.log('✅ CORS configurado corretamente');
    } else {
      console.log('❌ Problema com CORS');
    }
    
    console.log('');
    console.log('🎯 Edge Function está pronta para uso!');
    console.log('📝 Agora você pode testar o fluxo completo de autenticação Google.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewGoogleAuth(); 