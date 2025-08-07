import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllConversations() {
  console.log('🗑️ LIMPANDO TODO HISTÓRICO DE CONVERSAS');
  console.log('==========================================');

  try {
    // 1. Verificar dados existentes antes da limpeza
    console.log('\n1️⃣ Verificando dados existentes...');
    
    const { data: oldConversations } = await supabase
      .from('whatsapp_conversations')
      .select('*');
    
    const { data: newConversations } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*');
    
    const { data: oldMessages } = await supabase
      .from('whatsapp_messages')
      .select('*');
    
    const { data: newMessages } = await supabase
      .from('whatsapp_messages_improved')
      .select('*');
    
    const { data: memoryData } = await supabase
      .from('conversation_memory')
      .select('*');
    
    const { data: whatsappMemory } = await supabase
      .from('whatsapp_conversation_memory')
      .select('*');

    console.log(`📊 DADOS EXISTENTES:`);
    console.log(`   - Conversas antigas: ${oldConversations?.length || 0}`);
    console.log(`   - Conversas novas: ${newConversations?.length || 0}`);
    console.log(`   - Mensagens antigas: ${oldMessages?.length || 0}`);
    console.log(`   - Mensagens novas: ${newMessages?.length || 0}`);
    console.log(`   - Memória de conversas: ${memoryData?.length || 0}`);
    console.log(`   - Memória WhatsApp: ${whatsappMemory?.length || 0}`);

    // 2. Confirmar limpeza
    console.log('\n2️⃣ Iniciando limpeza...');
    
    // Limpar mensagens novas primeiro (devido à foreign key)
    console.log('\n🗑️ Limpando mensagens novas...');
    const { error: deleteNewMessagesError } = await supabase
      .from('whatsapp_messages_improved')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

    if (deleteNewMessagesError) {
      console.error('❌ Erro ao deletar mensagens novas:', deleteNewMessagesError);
    } else {
      console.log('✅ Mensagens novas deletadas');
    }

    // Limpar conversas novas
    console.log('\n🗑️ Limpando conversas novas...');
    const { error: deleteNewConversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

    if (deleteNewConversationsError) {
      console.error('❌ Erro ao deletar conversas novas:', deleteNewConversationsError);
    } else {
      console.log('✅ Conversas novas deletadas');
    }

    // Limpar mensagens antigas
    console.log('\n🗑️ Limpando mensagens antigas...');
    const { error: deleteOldMessagesError } = await supabase
      .from('whatsapp_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

    if (deleteOldMessagesError) {
      console.error('❌ Erro ao deletar mensagens antigas:', deleteOldMessagesError);
    } else {
      console.log('✅ Mensagens antigas deletadas');
    }

    // Limpar conversas antigas
    console.log('\n🗑️ Limpando conversas antigas...');
    const { error: deleteOldConversationsError } = await supabase
      .from('whatsapp_conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

    if (deleteOldConversationsError) {
      console.error('❌ Erro ao deletar conversas antigas:', deleteOldConversationsError);
    } else {
      console.log('✅ Conversas antigas deletadas');
    }

    // Limpar memória de conversas
    console.log('\n🗑️ Limpando memória de conversas...');
    const { error: deleteMemoryError } = await supabase
      .from('conversation_memory')
      .delete()
      .neq('id', 0); // Deletar tudo

    if (deleteMemoryError) {
      console.error('❌ Erro ao deletar memória de conversas:', deleteMemoryError);
    } else {
      console.log('✅ Memória de conversas deletada');
    }

    // Limpar memória WhatsApp
    console.log('\n🗑️ Limpando memória WhatsApp...');
    const { error: deleteWhatsappMemoryError } = await supabase
      .from('whatsapp_conversation_memory')
      .delete()
      .neq('id', 0); // Deletar tudo

    if (deleteWhatsappMemoryError) {
      console.error('❌ Erro ao deletar memória WhatsApp:', deleteWhatsappMemoryError);
    } else {
      console.log('✅ Memória WhatsApp deletada');
    }

    // 3. Verificar limpeza
    console.log('\n3️⃣ Verificando limpeza...');
    
    const { data: finalOldConversations } = await supabase
      .from('whatsapp_conversations')
      .select('*');
    
    const { data: finalNewConversations } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*');
    
    const { data: finalOldMessages } = await supabase
      .from('whatsapp_messages')
      .select('*');
    
    const { data: finalNewMessages } = await supabase
      .from('whatsapp_messages_improved')
      .select('*');
    
    const { data: finalMemory } = await supabase
      .from('conversation_memory')
      .select('*');
    
    const { data: finalWhatsappMemory } = await supabase
      .from('whatsapp_conversation_memory')
      .select('*');

    console.log(`\n📊 DADOS APÓS LIMPEZA:`);
    console.log(`   - Conversas antigas: ${finalOldConversations?.length || 0}`);
    console.log(`   - Conversas novas: ${finalNewConversations?.length || 0}`);
    console.log(`   - Mensagens antigas: ${finalOldMessages?.length || 0}`);
    console.log(`   - Mensagens novas: ${finalNewMessages?.length || 0}`);
    console.log(`   - Memória de conversas: ${finalMemory?.length || 0}`);
    console.log(`   - Memória WhatsApp: ${finalWhatsappMemory?.length || 0}`);

    console.log('\n✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('====================================');
    console.log('🎯 Sistema limpo e pronto para testes do zero!');
    console.log('📋 Próximos passos:');
    console.log('1. Teste o frontend - deve estar vazio');
    console.log('2. Envie mensagens de teste');
    console.log('3. Verifique se as conversas aparecem corretamente');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
  }
}

clearAllConversations(); 