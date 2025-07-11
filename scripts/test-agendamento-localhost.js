import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAgendamentoLocalhost() {
  console.log('🧪 Testando sistema de agendamento no localhost...\n');

  try {
    // 1. Testar conexão com o Supabase
    console.log('1️⃣ Testando conexão com o Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.log('   ❌ Erro na conexão:', testError.message);
      return;
    }
    console.log('   ✅ Conexão com Supabase OK');

    // 2. Verificar se as tabelas de agendamento existem
    console.log('\n2️⃣ Verificando tabelas de agendamento...');
    
    const tables = [
      'appointment_sessions',
      'appointment_steps',
      'appointments',
      'services',
      'professionals'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Tabela ${table}: ${err.message}`);
      }
    }

    // 3. Testar criação de uma sessão de agendamento
    console.log('\n3️⃣ Testando criação de sessão de agendamento...');
    
    const testSession = {
      user_phone: '5511999999999',
      current_step: 'collect_patient_info',
      patient_info: {
        name: 'João Silva',
        phone: '5511999999999',
        email: 'joao@teste.com'
      },
      service_id: null,
      professional_id: null,
      preferred_date: null,
      preferred_time: null,
      status: 'active'
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('appointment_sessions')
      .insert(testSession)
      .select()
      .single();

    if (sessionError) {
      console.log('   ❌ Erro ao criar sessão:', sessionError.message);
    } else {
      console.log('   ✅ Sessão criada com sucesso!');
      console.log(`   📋 ID da sessão: ${sessionData.id}`);
      
      // Limpar a sessão de teste
      await supabase
        .from('appointment_sessions')
        .delete()
        .eq('id', sessionData.id);
      console.log('   🧹 Sessão de teste removida');
    }

    // 4. Testar Edge Function de WhatsApp
    console.log('\n4️⃣ Testando Edge Function de WhatsApp...');
    
    const whatsappTest = {
      event: 'message.received',
      data: {
        from: '5511999999999',
        message: 'Olá, gostaria de agendar uma consulta',
        timestamp: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify(whatsappTest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Edge Function respondeu com sucesso!');
        console.log('   📋 Resposta:', result);
      } else {
        console.log(`   ❌ Erro na Edge Function: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('   ❌ Erro ao chamar Edge Function:', error.message);
    }

    // 5. Instruções para testar no navegador
    console.log('\n5️⃣ Instruções para testar no navegador:');
    console.log('   🌐 Acesse: http://localhost:8080');
    console.log('   📱 Vá para a página de Agendamentos');
    console.log('   🔗 Teste a conexão com WhatsApp');
    console.log('   💬 Envie mensagens para testar o chatbot');
    console.log('   📅 Teste o fluxo de agendamento');

    console.log('\n🎉 Teste local concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Abra http://localhost:8080 no navegador');
    console.log('2. Faça login com Google');
    console.log('3. Vá para Agendamentos > Conectar WhatsApp');
    console.log('4. Escaneie o QR Code');
    console.log('5. Envie mensagens para testar o agendamento');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAgendamentoLocalhost(); 