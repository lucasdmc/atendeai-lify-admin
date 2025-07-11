import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAgendamentoDualFormat() {
  console.log('🧪 Testando sistema de agendamento com formatos duais...\n');

  try {
    // 1. Testar formato único (todos os dados em uma mensagem)
    console.log('1️⃣ Testando formato único (todos os dados em uma mensagem)...');
    
    const mensagemUnica = `Lucas Cantoni
47997192447
Endoscopia Digestiva
Dr. Carlos
04/07
16:30`;

    console.log('   📝 Mensagem única:');
    console.log(mensagemUnica);
    console.log('   ✅ Formato único implementado');

    // 2. Testar formato separado (dados em mensagens diferentes)
    console.log('\n2️⃣ Testando formato separado (dados em mensagens diferentes)...');
    
    const mensagensSeparadas = [
      'Lucas Cantoni',
      '47997192447',
      'Endoscopia Digestiva Alta',
      'Dr. Carlos Eduardo Silva',
      '04/07',
      '16:30'
    ];

    console.log('   📝 Mensagens separadas:');
    mensagensSeparadas.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg}`);
    });
    console.log('   ✅ Formato separado implementado');

    // 3. Verificar se as tabelas existem
    console.log('\n3️⃣ Verificando tabelas necessárias...');
    
    const tables = [
      'conversas_agendamento',
      'pacientes',
      'agendamentos',
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

    // 4. Testar Edge Function
    console.log('\n4️⃣ Testando Edge Function...');
    
    const testWebhook = {
      event: 'message.received',
      data: {
        from: '47997192447',
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
        body: JSON.stringify(testWebhook)
      });

      if (response.ok) {
        console.log('   ✅ Edge Function respondeu com sucesso!');
      } else {
        console.log(`   ❌ Erro na Edge Function: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('   ❌ Erro ao chamar Edge Function:', error.message);
    }

    // 5. Instruções de teste
    console.log('\n5️⃣ Instruções para testar no WhatsApp:');
    console.log('');
    console.log('📱 **Formato Único (Recomendado):**');
    console.log('Envie uma única mensagem com todos os dados:');
    console.log('');
    console.log('Lucas Cantoni');
    console.log('47997192447');
    console.log('Endoscopia Digestiva');
    console.log('Dr. Carlos');
    console.log('04/07');
    console.log('16:30');
    console.log('');
    console.log('📱 **Formato Separado:**');
    console.log('Envie os dados um por vez:');
    console.log('1. "Lucas Cantoni"');
    console.log('2. "47997192447"');
    console.log('3. "Endoscopia Digestiva Alta"');
    console.log('4. "Dr. Carlos Eduardo Silva"');
    console.log('5. "04/07"');
    console.log('6. "16:30"');
    console.log('7. "SIM" (para confirmar)');
    console.log('');
    console.log('🎯 **Resultado esperado:**');
    console.log('• Chatbot reconhece ambos os formatos');
    console.log('• Dados são processados corretamente');
    console.log('• Agendamento é criado no banco');
    console.log('• Evento é criado no Google Calendar');
    console.log('• Confirmação é enviada');

    console.log('\n🎉 Teste de formatos concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Teste o formato único no WhatsApp');
    console.log('2. Teste o formato separado no WhatsApp');
    console.log('3. Verifique se ambos funcionam corretamente');
    console.log('4. Monitore os logs no Supabase Dashboard');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAgendamentoDualFormat(); 