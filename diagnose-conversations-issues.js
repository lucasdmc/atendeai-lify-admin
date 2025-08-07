import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseConversationsIssues() {
  console.log('🔍 DIAGNÓSTICO: Problemas das Conversas WhatsApp');
  console.log('==================================================');

  try {
    // 1. Verificar dados das clínicas
    console.log('\n1️⃣ Verificando dados das clínicas...');
    
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
    } else {
      console.log(`✅ Clínicas encontradas: ${clinics?.length || 0}`);
      clinics?.forEach((clinic, index) => {
        console.log(`   ${index + 1}. ${clinic.name} (${clinic.id})`);
        console.log(`      WhatsApp: ${clinic.whatsapp_phone_number || 'Não configurado'}`);
      });
    }

    // 2. Verificar números de WhatsApp por clínica
    console.log('\n2️⃣ Verificando números de WhatsApp por clínica...');
    
    const { data: clinicNumbers, error: clinicNumbersError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    if (clinicNumbersError) {
      console.error('❌ Erro ao buscar números de clínica:', clinicNumbersError);
    } else {
      console.log(`✅ Números de clínica encontrados: ${clinicNumbers?.length || 0}`);
      clinicNumbers?.forEach((number, index) => {
        console.log(`   ${index + 1}. Clínica: ${number.clinic_id} | Número: ${number.whatsapp_number} | Ativo: ${number.is_active}`);
      });
    }

    // 3. Verificar conversas melhoradas
    console.log('\n3️⃣ Verificando conversas melhoradas...');
    
    const { data: improvedConversations, error: improvedConvError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (improvedConvError) {
      console.error('❌ Erro ao buscar conversas melhoradas:', improvedConvError);
    } else {
      console.log(`✅ Conversas melhoradas encontradas: ${improvedConversations?.length || 0}`);
      improvedConversations?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
      });
    }

    // 4. Verificar conversas antigas
    console.log('\n4️⃣ Verificando conversas antigas...');
    
    const { data: oldConversations, error: oldConvError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (oldConvError) {
      console.error('❌ Erro ao buscar conversas antigas:', oldConvError);
    } else {
      console.log(`✅ Conversas antigas encontradas: ${oldConversations?.length || 0}`);
      oldConversations?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Número: ${conv.phone_number} | Nome: ${conv.name} | Última: ${conv.last_message_preview}`);
      });
    }

    // 5. Verificar mensagens melhoradas
    console.log('\n5️⃣ Verificando mensagens melhoradas...');
    
    const { data: improvedMessages, error: improvedMsgError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (improvedMsgError) {
      console.error('❌ Erro ao buscar mensagens melhoradas:', improvedMsgError);
    } else {
      console.log(`✅ Mensagens melhoradas encontradas: ${improvedMessages?.length || 0}`);
      improvedMessages?.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type}`);
      });
    }

    // 6. Verificar mensagens antigas
    console.log('\n6️⃣ Verificando mensagens antigas...');
    
    const { data: oldMessages, error: oldMsgError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (oldMsgError) {
      console.error('❌ Erro ao buscar mensagens antigas:', oldMsgError);
    } else {
      console.log(`✅ Mensagens antigas encontradas: ${oldMessages?.length || 0}`);
      oldMessages?.forEach((msg, index) => {
        console.log(`   ${index + 1}. Conversa: ${msg.conversation_id} | Conteúdo: ${msg.content?.substring(0, 50)}...`);
      });
    }

    // 7. Verificar se há dados para o número específico mencionado
    console.log('\n7️⃣ Verificando dados para o número 5547997192447...');
    
    const targetNumber = '5547997192447';
    
    // Verificar em conversas melhoradas
    const { data: targetImprovedConv, error: targetImprovedError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .eq('patient_phone_number', targetNumber);

    if (targetImprovedError) {
      console.error('❌ Erro ao buscar conversa melhorada:', targetImprovedError);
    } else {
      console.log(`✅ Conversas melhoradas para ${targetNumber}: ${targetImprovedConv?.length || 0}`);
      targetImprovedConv?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
      });
    }

    // Verificar em conversas antigas
    const { data: targetOldConv, error: targetOldError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', targetNumber);

    if (targetOldError) {
      console.error('❌ Erro ao buscar conversa antiga:', targetOldError);
    } else {
      console.log(`✅ Conversas antigas para ${targetNumber}: ${targetOldConv?.length || 0}`);
      targetOldConv?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Nome: ${conv.name} | Última: ${conv.last_message_preview}`);
      });
    }

    // 8. Verificar mensagens para o número
    const { data: targetMessages, error: targetMsgError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .or(`sender_phone.eq.${targetNumber},receiver_phone.eq.${targetNumber}`)
      .order('created_at', { ascending: false });

    if (targetMsgError) {
      console.error('❌ Erro ao buscar mensagens:', targetMsgError);
    } else {
      console.log(`✅ Mensagens para ${targetNumber}: ${targetMessages?.length || 0}`);
      targetMessages?.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type} | Conteúdo: ${msg.content?.substring(0, 50)}...`);
      });
    }

    // 9. Análise dos problemas
    console.log('\n🔍 ANÁLISE DOS PROBLEMAS:');
    console.log('==========================');
    
    const hasImprovedConversations = improvedConversations && improvedConversations.length > 0;
    const hasOldConversations = oldConversations && oldConversations.length > 0;
    const hasClinicNumbers = clinicNumbers && clinicNumbers.length > 0;
    const hasTargetConversation = (targetImprovedConv && targetImprovedConv.length > 0) || (targetOldConv && targetOldConv.length > 0);

    console.log(`📊 Status atual:`);
    console.log(`   - Conversas melhoradas: ${hasImprovedConversations ? '✅' : '❌'}`);
    console.log(`   - Conversas antigas: ${hasOldConversations ? '✅' : '❌'}`);
    console.log(`   - Números de clínica configurados: ${hasClinicNumbers ? '✅' : '❌'}`);
    console.log(`   - Conversa para ${targetNumber}: ${hasTargetConversation ? '✅' : '❌'}`);

    if (!hasClinicNumbers) {
      console.log('\n❌ PROBLEMA 1: Nenhum número de WhatsApp configurado para clínicas');
      console.log('   Solução: Configurar números na tabela clinic_whatsapp_numbers');
    }

    if (!hasImprovedConversations && !hasOldConversations) {
      console.log('\n❌ PROBLEMA 2: Nenhuma conversa encontrada no sistema');
      console.log('   Solução: Verificar se o webhook está processando mensagens corretamente');
    }

    if (!hasTargetConversation) {
      console.log('\n❌ PROBLEMA 3: Conversa do número 5547997192447 não encontrada');
      console.log('   Solução: Verificar se a mensagem foi processada pelo webhook');
    }

    // 10. Sugestões de correção
    console.log('\n🔧 SUGESTÕES DE CORREÇÃO:');
    console.log('==========================');
    
    if (!hasClinicNumbers) {
      console.log('1. Configurar números de WhatsApp para clínicas:');
      console.log('   - Inserir dados na tabela clinic_whatsapp_numbers');
      console.log('   - Associar números às clínicas corretas');
    }

    if (!hasImprovedConversations) {
      console.log('2. Verificar processamento de webhook:');
      console.log('   - Verificar se o webhook está ativo');
      console.log('   - Verificar logs do webhook');
      console.log('   - Testar envio de mensagem de teste');
    }

    if (!hasTargetConversation) {
      console.log('3. Processar mensagem de teste:');
      console.log('   - Simular mensagem recebida do número 5547997192447');
      console.log('   - Verificar se é salva corretamente');
    }

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseConversationsIssues().then(() => {
  console.log('\n✅ Diagnóstico finalizado!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 