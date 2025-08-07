import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestConversations() {
  console.log('🔍 VERIFICANDO CONVERSAS DE TESTE');
  console.log('==================================');

  try {
    // 1. Buscar todas as conversas
    console.log('\n1️⃣ Buscando todas as conversas...');
    
    const { data: allConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas:', conversationsError);
      return;
    }

    console.log(`📊 Total de conversas encontradas: ${allConversations?.length || 0}`);

    // 2. Identificar possíveis conversas de teste
    console.log('\n2️⃣ Analisando conversas...');
    
    const testPatterns = [
      'teste',
      'test',
      'simulação',
      'simulacao',
      'demo',
      'exemplo',
      'example',
      'fake',
      'mock',
      'dummy'
    ];

    const suspiciousConversations = [];

    for (const conversation of allConversations || []) {
      const displayName = conversation.patient_name || conversation.patient_phone_number;
      const lastMessage = conversation.last_message_preview || '';
      
      // Verificar se contém padrões de teste
      const isTest = testPatterns.some(pattern => 
        displayName.toLowerCase().includes(pattern) ||
        lastMessage.toLowerCase().includes(pattern)
      );

      // Verificar números que parecem ser de teste (sequências repetidas, números muito redondos)
      const phoneNumber = conversation.patient_phone_number;
      const isTestNumber = 
        phoneNumber.includes('999999') ||
        phoneNumber.includes('000000') ||
        phoneNumber.includes('111111') ||
        phoneNumber.includes('123456') ||
        phoneNumber.includes('654321') ||
        phoneNumber.match(/(\d)\1{5,}/) || // 6 ou mais dígitos iguais
        phoneNumber.match(/^55\d{2}999999/) || // Números terminando em 999999
        phoneNumber.match(/^55\d{2}000000/); // Números terminando em 000000

      if (isTest || isTestNumber) {
        suspiciousConversations.push({
          ...conversation,
          reason: isTest ? 'Padrão de teste detectado' : 'Número suspeito de teste'
        });
      }
    }

    // 3. Mostrar resultados
    console.log(`\n3️⃣ Conversas suspeitas encontradas: ${suspiciousConversations.length}`);
    
    if (suspiciousConversations.length > 0) {
      console.log('\n📋 Lista de conversas suspeitas:');
      suspiciousConversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. ID: ${conv.id}`);
        console.log(`   📱 Paciente: ${conv.patient_phone_number}`);
        console.log(`   👤 Nome: ${conv.patient_name || 'N/A'}`);
        console.log(`   🏥 Clínica: ${conv.clinic_whatsapp_number}`);
        console.log(`   💬 Última mensagem: ${conv.last_message_preview || 'N/A'}`);
        console.log(`   ⏰ Data: ${conv.last_message_at}`);
        console.log(`   🚨 Motivo: ${conv.reason}`);
      });

      console.log('\n⚠️ RECOMENDAÇÕES:');
      console.log('- Revise cada conversa antes de remover');
      console.log('- Algumas podem ser conversas reais com nomes que contêm "teste"');
      console.log('- Use o script remove-simulation-conversations.js para remover específicas');
    } else {
      console.log('✅ Nenhuma conversa suspeita encontrada!');
    }

    // 4. Estatísticas gerais
    console.log('\n4️⃣ Estatísticas gerais:');
    console.log(`📊 Total de conversas: ${allConversations?.length || 0}`);
    
    if (allConversations && allConversations.length > 0) {
      const withNames = allConversations.filter(c => c.patient_name && c.patient_name.trim());
      const withoutNames = allConversations.length - withNames.length;
      
      console.log(`👤 Com nomes: ${withNames.length}`);
      console.log(`📱 Apenas números: ${withoutNames}`);
      
      // Conversas recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentConversations = allConversations.filter(c => 
        c.last_message_at && new Date(c.last_message_at) > sevenDaysAgo
      );
      
      console.log(`🕒 Ativas nos últimos 7 dias: ${recentConversations.length}`);
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('==========================');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkTestConversations(); 