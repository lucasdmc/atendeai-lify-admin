import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAgendamentoGoogleCalendar() {
  console.log('🧪 Testando sistema de agendamento com Google Calendar...\n');

  try {
    // 1. Verificar se existe usuário admin
    console.log('1️⃣ Verificando usuário admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.log('   ❌ Usuário admin não encontrado');
      console.log('   💡 Crie um usuário admin primeiro');
      return;
    }
    console.log(`   ✅ Usuário admin encontrado: ${adminUser.email}`);

    // 2. Verificar se o usuário admin tem calendário conectado
    console.log('\n2️⃣ Verificando calendário do usuário admin...');
    const { data: userCalendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', adminUser.id)
      .eq('google_calendar_id', 'primary')
      .single();

    if (calendarError || !userCalendar) {
      console.log('   ❌ Calendário não encontrado para o usuário admin');
      console.log('   💡 Conecte o Google Calendar do usuário admin primeiro');
      return;
    }
    console.log('   ✅ Calendário encontrado e conectado');

    // 3. Verificar se as tabelas de agendamento existem
    console.log('\n3️⃣ Verificando tabelas de agendamento...');
    
    const tables = [
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

    // 4. Testar criação de agendamento completo
    console.log('\n4️⃣ Testando criação de agendamento completo...');
    
    // Criar paciente de teste
    const { data: paciente, error: pacienteError } = await supabase
      .from('pacientes')
      .insert({
        nome: 'Teste Google Calendar',
        telefone: '5511999999999'
      })
      .select()
      .single();

    if (pacienteError) {
      console.log('   ❌ Erro ao criar paciente:', pacienteError.message);
      return;
    }
    console.log('   ✅ Paciente criado:', paciente.id);

    // Criar agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert({
        paciente_id: paciente.id,
        profissional_id: 'prof_001',
        servico_id: 'exam_001',
        data: '2025-01-10',
        horario: '14:00',
        status: 'agendado'
      })
      .select()
      .single();

    if (agendamentoError) {
      console.log('   ❌ Erro ao criar agendamento:', agendamentoError.message);
      return;
    }
    console.log('   ✅ Agendamento criado:', agendamento.id);

    // 5. Testar criação de evento no Google Calendar
    console.log('\n5️⃣ Testando criação de evento no Google Calendar...');
    
    const eventData = {
      summary: 'Endoscopia Digestiva Alta - Teste Google Calendar',
      description: `Paciente: Teste Google Calendar
Telefone: 5511999999999
Serviço: Endoscopia Digestiva Alta
Profissional: Dr. Carlos Eduardo Silva
Valor: R$ 450.00

Agendamento via WhatsApp - ESADI`,
      start: {
        dateTime: '2025-01-10T14:00:00-03:00',
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: '2025-01-10T14:30:00-03:00',
        timeZone: 'America/Sao_Paulo'
      },
      location: 'ESADI - Clínica de Gastroenterologia',
      attendees: [
        {
          email: 'atendimento@esadi.com.br',
          displayName: 'ESADI'
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 }
        ]
      }
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userCalendar.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (response.ok) {
        const createdEvent = await response.json();
        console.log('   ✅ Evento criado no Google Calendar:', createdEvent.id);
        
        // Atualizar agendamento com o ID do evento do Google
        await supabase
          .from('agendamentos')
          .update({ google_event_id: createdEvent.id })
          .eq('id', agendamento.id);
        
        console.log('   ✅ Agendamento atualizado com ID do Google Calendar');
      } else {
        const errorData = await response.text();
        console.log('   ❌ Erro ao criar evento no Google Calendar:', response.status, errorData);
      }
    } catch (error) {
      console.log('   ❌ Erro ao criar evento no Google Calendar:', error.message);
    }

    // 6. Limpar dados de teste
    console.log('\n6️⃣ Limpando dados de teste...');
    
    await supabase
      .from('agendamentos')
      .delete()
      .eq('id', agendamento.id);
    
    await supabase
      .from('pacientes')
      .delete()
      .eq('id', paciente.id);
    
    console.log('   ✅ Dados de teste removidos');

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Teste o chatbot via WhatsApp');
    console.log('2. Envie mensagens para agendar');
    console.log('3. Confirme o agendamento');
    console.log('4. Verifique se o evento foi criado no Google Calendar');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAgendamentoGoogleCalendar(); 