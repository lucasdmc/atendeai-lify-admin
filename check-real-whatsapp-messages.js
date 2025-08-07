import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function checkRealWhatsAppMessages() {
  console.log('🔍 VERIFICANDO MENSAGENS REAIS DO WHATSAPP');
  console.log('============================================');

  // 1. Verificar mensagens com whatsapp_message_id que não são simuladas
  console.log('\n1️⃣ Verificando mensagens com whatsapp_message_id real...');
  try {
    const { data: realMessages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .not('whatsapp_message_id', 'is', null)
      .not('whatsapp_message_id', 'like', 'test-%')
      .not('whatsapp_message_id', 'like', 'debug-%')
      .not('whatsapp_message_id', 'like', 'local-%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar mensagens reais:', error);
    } else {
      console.log(`✅ Encontradas ${realMessages.length} mensagens com ID real do WhatsApp`);
      realMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.content} (${msg.created_at}) - ID: ${msg.whatsapp_message_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 2. Verificar mensagens do seu número específico
  console.log('\n2️⃣ Verificando mensagens do seu número (5547997192447)...');
  try {
    const { data: yourMessages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('sender_phone', '5547997192447')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar suas mensagens:', error);
    } else {
      console.log(`✅ Encontradas ${yourMessages.length} mensagens do seu número`);
      yourMessages.forEach((msg, index) => {
        const isReal = !msg.whatsapp_message_id?.startsWith('test-') && 
                      !msg.whatsapp_message_id?.startsWith('debug-') &&
                      !msg.whatsapp_message_id?.startsWith('local-');
        console.log(`${index + 1}. ${msg.content} (${msg.created_at}) - Tipo: ${msg.message_type} - Real: ${isReal ? 'SIM' : 'NÃO'} - ID: ${msg.whatsapp_message_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 3. Verificar mensagens recebidas (que deveriam ser suas)
  console.log('\n3️⃣ Verificando mensagens recebidas (message_type = received)...');
  try {
    const { data: receivedMessages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('message_type', 'received')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar mensagens recebidas:', error);
    } else {
      console.log(`✅ Encontradas ${receivedMessages.length} mensagens recebidas`);
      receivedMessages.forEach((msg, index) => {
        const isReal = !msg.whatsapp_message_id?.startsWith('test-') && 
                      !msg.whatsapp_message_id?.startsWith('debug-') &&
                      !msg.whatsapp_message_id?.startsWith('local-');
        console.log(`${index + 1}. De: ${msg.sender_phone} | ${msg.content} (${msg.created_at}) - Real: ${isReal ? 'SIM' : 'NÃO'} - ID: ${msg.whatsapp_message_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  // 4. Verificar mensagens enviadas (respostas do chatbot)
  console.log('\n4️⃣ Verificando mensagens enviadas (message_type = sent)...');
  try {
    const { data: sentMessages, error } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('message_type', 'sent')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar mensagens enviadas:', error);
    } else {
      console.log(`✅ Encontradas ${sentMessages.length} mensagens enviadas`);
      sentMessages.forEach((msg, index) => {
        const isReal = !msg.whatsapp_message_id?.startsWith('test-') && 
                      !msg.whatsapp_message_id?.startsWith('debug-') &&
                      !msg.whatsapp_message_id?.startsWith('local-');
        console.log(`${index + 1}. Para: ${msg.receiver_phone} | ${msg.content} (${msg.created_at}) - Real: ${isReal ? 'SIM' : 'NÃO'} - ID: ${msg.whatsapp_message_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkRealWhatsAppMessages(); 