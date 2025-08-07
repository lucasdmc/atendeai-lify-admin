import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function validateSupabaseTables() {
  console.log('🔍 VALIDANDO TABELAS DO SUPABASE');
  console.log('==================================');

  // 1. Verificar estrutura da tabela de conversas
  console.log('\n1️⃣ Verificando estrutura da tabela whatsapp_conversations_improved...');
  try {
    const { data: conversations, error } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar conversas:', error);
    } else {
      console.log(`✅ Encontradas ${conversations.length} conversas`);
      if (conversations.length > 0) {
        console.log('📋 Estrutura da primeira conversa:', Object.keys(conversations[0]));
        console.log('📋 Dados da primeira conversa:', conversations[0]);
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 2. Verificar estrutura da tabela de mensagens
  console.log('\n2️⃣ Verificando estrutura da tabela whatsapp_messages_improved...');
  try {
    const { data: messages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
    } else {
      console.log(`✅ Encontradas ${messages.length} mensagens`);
      if (messages.length > 0) {
        console.log('📋 Estrutura da primeira mensagem:', Object.keys(messages[0]));
        console.log('📋 Dados da primeira mensagem:', messages[0]);
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 3. Verificar se há mensagens reais do seu número
  console.log('\n3️⃣ Verificando mensagens reais do seu número...');
  try {
    const { data: realMessages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('sender_phone', '5547997192447')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar mensagens reais:', error);
    } else {
      console.log(`✅ Encontradas ${realMessages.length} mensagens do seu número`);
      realMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.content} (${msg.created_at}) - Tipo: ${msg.message_type}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 4. Verificar se há mensagens com whatsapp_message_id (reais)
  console.log('\n4️⃣ Verificando mensagens com whatsapp_message_id (reais)...');
  try {
    const { data: realMessagesWithId, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .not('whatsapp_message_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar mensagens com ID:', error);
    } else {
      console.log(`✅ Encontradas ${realMessagesWithId.length} mensagens com whatsapp_message_id`);
      realMessagesWithId.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.content} (${msg.created_at}) - ID: ${msg.whatsapp_message_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 5. Verificar tabela antiga (se existe)
  console.log('\n5️⃣ Verificando tabela antiga whatsapp_messages...');
  try {
    const { data: oldMessages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(5);

    if (error) {
      console.log('ℹ️  Tabela antiga não encontrada ou vazia');
    } else {
      console.log(`✅ Encontradas ${oldMessages.length} mensagens na tabela antiga`);
      if (oldMessages.length > 0) {
        console.log('📋 Estrutura da primeira mensagem antiga:', Object.keys(oldMessages[0]));
      }
    }
  } catch (error) {
    console.log('ℹ️  Tabela antiga não existe');
  }
}

validateSupabaseTables(); 