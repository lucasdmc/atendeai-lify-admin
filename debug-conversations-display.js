import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugConversationsDisplay() {
  console.log('🔍 DEBUGANDO EXIBIÇÃO DE CONVERSAS');
  console.log('===================================');

  try {
    // 1. Verificar todas as conversas
    console.log('🔍 Buscando todas as conversas...');
    const { data: allConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas:', conversationsError);
      return;
    }

    console.log('✅ Total de conversas encontradas:', allConversations.length);
    allConversations.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
    });

    // 2. Verificar conversas específicas do seu número
    console.log('\n🔍 Buscando conversas do seu número...');
    const { data: userConversations, error: userConversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .eq('patient_phone_number', '5547997192447')
      .order('last_message_at', { ascending: false });

    if (userConversationsError) {
      console.error('❌ Erro ao buscar conversas do usuário:', userConversationsError);
      return;
    }

    console.log('✅ Conversas do seu número encontradas:', userConversations.length);
    userConversations.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview} | ID: ${conv.id}`);
    });

    // 3. Verificar mensagens da conversa específica
    if (userConversations.length > 0) {
      const conversationId = userConversations[0].id;
      console.log('\n🔍 Buscando mensagens da conversa:', conversationId);
      
      const { data: conversationMessages, error: messagesError } = await supabase
        .from('whatsapp_messages_improved')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Erro ao buscar mensagens da conversa:', messagesError);
        return;
      }

      console.log('✅ Mensagens da conversa encontradas:', conversationMessages.length);
      conversationMessages.forEach((msg, index) => {
        const date = new Date(msg.created_at);
        const time = date.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        const sender = msg.sender_phone === '5547997192447' ? 'Lucas Cantoni' : '~554730915628';
        console.log(`   ${index + 1}. [${time}] ${sender}: ${msg.content}`);
      });
    }

    // 4. Simular o que a tela de conversas deveria mostrar
    console.log('\n📱 SIMULANDO TELA DE CONVERSAS:');
    console.log('=================================');
    
    // Simular a query que a tela de conversas faz
    const { data: displayConversations, error: displayError } = await supabase
      .from('whatsapp_conversations_improved')
      .select(`
        id,
        clinic_id,
        patient_phone_number,
        clinic_whatsapp_number,
        patient_name,
        last_message_preview,
        unread_count,
        last_message_at,
        created_at,
        updated_at
      `)
      .order('last_message_at', { ascending: false });

    if (displayError) {
      console.error('❌ Erro ao simular tela de conversas:', displayError);
      return;
    }

    console.log('✅ Conversas que a tela deveria mostrar:', displayConversations.length);
    displayConversations.forEach((conv, index) => {
      const date = new Date(conv.last_message_at);
      const displayName = conv.patient_name || conv.patient_phone_number;
      console.log(`   ${index + 1}. ${displayName} | ${conv.last_message_preview} | ${date.toLocaleString('pt-BR')}`);
    });

    // 5. Verificar se há problemas de dados
    console.log('\n🔍 VERIFICANDO PROBLEMAS DE DADOS:');
    console.log('===================================');
    
    if (userConversations.length === 0) {
      console.log('❌ NENHUMA conversa encontrada para o seu número');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Mensagens não estão sendo salvas corretamente');
      console.log('   2. Número de telefone incorreto no banco');
      console.log('   3. Conversa não foi criada');
    } else if (conversationMessages && conversationMessages.length === 0) {
      console.log('❌ Conversa existe mas NENHUMA mensagem encontrada');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Mensagens não estão sendo salvas na conversa correta');
      console.log('   2. conversation_id incorreto');
      console.log('   3. Problema na estrutura de dados');
    } else {
      console.log('✅ Dados encontrados corretamente');
      console.log('✅ A tela deveria mostrar as conversas');
    }

    // 6. Verificar se há mensagens recentes que não aparecem
    console.log('\n🔍 VERIFICANDO MENSAGENS RECENTES:');
    console.log('===================================');
    
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    const { data: recentMessages, error: recentError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .gte('created_at', lastHour.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Erro ao buscar mensagens recentes:', recentError);
      return;
    }

    console.log('✅ Mensagens da última hora:', recentMessages.length);
    recentMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 7. Análise final
    console.log('\n🎯 ANÁLISE FINAL:');
    console.log('==================');
    
    if (userConversations.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma conversa encontrada para o seu número');
      console.log('🔧 SOLUÇÃO: Verificar se o webhook está salvando conversas corretamente');
    } else if (conversationMessages && conversationMessages.length === 0) {
      console.log('❌ PROBLEMA: Conversa existe mas sem mensagens');
      console.log('🔧 SOLUÇÃO: Verificar se o webhook está salvando mensagens corretamente');
    } else {
      console.log('✅ DADOS CORRETOS: Conversas e mensagens encontradas');
      console.log('🔧 PROBLEMA: Pode ser na interface ou na query da tela');
      console.log('🔧 SOLUÇÃO: Verificar o código da tela de conversas');
    }

  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugConversationsDisplay(); 