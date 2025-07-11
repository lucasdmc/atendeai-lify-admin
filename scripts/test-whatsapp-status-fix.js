import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWhatsAppStatusFix() {
  console.log('🧪 Testando correção da Edge Function WhatsApp...\n');

  try {
    // 1. Testar endpoint de status
    console.log('1️⃣ Testando endpoint /status...');
    
    const statusResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-integration/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log(`   📊 Status Code: ${statusResponse.status}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('   ✅ Status endpoint funcionando!');
      console.log('   📋 Resposta:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('   ❌ Status endpoint com erro:', statusResponse.statusText);
    }

    // 2. Testar endpoint de inicialização
    console.log('\n2️⃣ Testando endpoint /initialize...');
    
    const initResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-integration/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log(`   📊 Status Code: ${initResponse.status}`);
    
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('   ✅ Initialize endpoint funcionando!');
      console.log('   📋 Resposta:', JSON.stringify(initData, null, 2));
    } else {
      console.log('   ❌ Initialize endpoint com erro:', initResponse.statusText);
    }

    // 3. Testar webhook
    console.log('\n3️⃣ Testando endpoint /webhook...');
    
    const webhookData = {
      event: 'message.received',
      data: {
        from: '47997192447',
        message: 'Olá, teste de webhook',
        timestamp: new Date().toISOString()
      }
    };

    const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-integration/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(webhookData)
    });

    console.log(`   📊 Status Code: ${webhookResponse.status}`);
    
    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json();
      console.log('   ✅ Webhook endpoint funcionando!');
      console.log('   📋 Resposta:', JSON.stringify(webhookResult, null, 2));
    } else {
      console.log('   ❌ Webhook endpoint com erro:', webhookResponse.statusText);
    }

    // 4. Verificar variáveis de ambiente
    console.log('\n4️⃣ Verificando variáveis de ambiente...');
    
    const secretsResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-integration/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (secretsResponse.ok) {
      const secretsData = await secretsResponse.json();
      if (secretsData.serverUrl) {
        console.log('   ✅ WHATSAPP_SERVER_URL configurada:', secretsData.serverUrl);
      } else {
        console.log('   ⚠️ WHATSAPP_SERVER_URL não encontrada na resposta');
      }
    }

    // 5. Resumo dos testes
    console.log('\n5️⃣ Resumo dos testes:');
    
    const endpoints = [
      { name: 'Status', response: statusResponse },
      { name: 'Initialize', response: initResponse },
      { name: 'Webhook', response: webhookResponse }
    ];

    let successCount = 0;
    endpoints.forEach(endpoint => {
      if (endpoint.response.ok) {
        console.log(`   ✅ ${endpoint.name}: OK`);
        successCount++;
      } else {
        console.log(`   ❌ ${endpoint.name}: ${endpoint.response.status} ${endpoint.response.statusText}`);
      }
    });

    console.log(`\n📊 Resultado: ${successCount}/${endpoints.length} endpoints funcionando`);

    if (successCount === endpoints.length) {
      console.log('\n🎉 Todos os endpoints estão funcionando!');
      console.log('\n📋 Próximos passos:');
      console.log('1. Teste a conexão no frontend');
      console.log('2. Verifique se o QR Code aparece');
      console.log('3. Teste o envio de mensagens no WhatsApp');
    } else {
      console.log('\n⚠️ Alguns endpoints ainda têm problemas');
      console.log('\n🔧 Possíveis soluções:');
      console.log('1. Verifique se o servidor WhatsApp está rodando');
      console.log('2. Confirme se a URL está correta');
      console.log('3. Verifique os logs no Supabase Dashboard');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testWhatsAppStatusFix(); 