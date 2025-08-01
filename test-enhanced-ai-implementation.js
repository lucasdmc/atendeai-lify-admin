const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testEnhancedAIImplementation() {
  try {
    console.log('🧪 TESTANDO IMPLEMENTAÇÃO DO ENHANCED AI SERVICE');
    console.log('================================================');

    // 1. TESTAR CONECTIVIDADE COM BACKEND
    console.log('\n1️⃣ Testando conectividade com backend...');
    
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        console.log('✅ Backend está funcionando');
      } else {
        console.log('❌ Backend não está respondendo');
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com backend:', error.message);
    }

    // 2. TESTAR WEBHOOK
    console.log('\n2️⃣ Testando webhook...');
    
    try {
      const webhookResponse = await fetch('http://localhost:3001/webhook/whatsapp/test');
      if (webhookResponse.ok) {
        const data = await webhookResponse.json();
        console.log('✅ Webhook funcionando:', data.message);
      } else {
        console.log('❌ Webhook não está respondendo');
      }
    } catch (error) {
      console.log('❌ Erro ao testar webhook:', error.message);
    }

    // 3. TESTAR ENVIO DE MENSAGEM SIMULADA
    console.log('\n3️⃣ Testando envio de mensagem simulada...');
    
    try {
      const testMessage = {
        to: '554730915628',
        message: 'Olá! Teste do Enhanced AI Service',
        clinicId: 'cardioprime',
        userId: 'test-user'
      };

      const messageResponse = await fetch('http://localhost:3001/webhook/whatsapp/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });

      if (messageResponse.ok) {
        const data = await messageResponse.json();
        console.log('✅ Mensagem processada com sucesso!');
        console.log('🤖 Resposta AI:', data.aiResponse?.text || 'N/A');
        console.log('📊 Confiança:', data.aiResponse?.confidence || 'N/A');
        console.log('🎯 Modelo usado:', data.aiResponse?.modelUsed || 'N/A');
      } else {
        console.log('❌ Erro ao processar mensagem');
      }
    } catch (error) {
      console.log('❌ Erro ao testar mensagem:', error.message);
    }

    // 4. VERIFICAR LOGS DO BACKEND
    console.log('\n4️⃣ Verificando logs do backend...');
    
    try {
      const { exec } = require('child_process');
      exec('pm2 logs atendeai-backend --lines 10', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Erro ao verificar logs:', error.message);
        } else {
          console.log('📋 Últimos logs do backend:');
          console.log(stdout);
        }
      });
    } catch (error) {
      console.log('❌ Erro ao verificar logs:', error.message);
    }

    // 5. TESTAR FUNÇÃO GET_CLINIC_CONTEXTUALIZATION
    console.log('\n5️⃣ Testando função get_clinic_contextualization...');
    
    try {
      const { data: contextData, error: contextError } = await supabase.rpc('get_clinic_contextualization', {
        p_whatsapp_phone: '554730915628'
      });

      if (contextError) {
        console.error('❌ Erro na função get_clinic_contextualization:', contextError);
      } else {
        console.log('✅ Função funcionando!');
        console.log('🏥 Clínica:', contextData?.[0]?.clinic_name);
        console.log('🎯 Tem contextualização:', contextData?.[0]?.has_contextualization);
      }
    } catch (e) {
      console.log('❌ Erro ao testar função:', e.message);
    }

    // 6. VERIFICAR TABELAS DE MEMÓRIA
    console.log('\n6️⃣ Verificando tabelas de memória...');
    
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(5);

    if (memoryError) {
      console.error('❌ Erro na tabela conversation_memory:', memoryError);
    } else {
      console.log('✅ Tabela conversation_memory funcionando!');
      console.log('📊 Registros encontrados:', memoryData?.length || 0);
    }

    console.log('\n🎯 TESTE CONCLUÍDO!');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Enviar mensagem real para o WhatsApp');
    console.log('2. Verificar se as respostas estão melhoradas');
    console.log('3. Monitorar logs para confirmar funcionamento');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

testEnhancedAIImplementation(); 