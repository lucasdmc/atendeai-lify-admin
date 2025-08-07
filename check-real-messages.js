import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function checkRealMessages() {
  console.log('🔍 Verificando mensagens reais do WhatsApp...');
  
  const { data: messages, error } = await supabase
    .from('whatsapp_messages_improved')
    .select('*')
    .eq('sender_phone', '5547997192447')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ Encontradas ${messages.length} mensagens do seu número:`);
  messages.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.content} (${msg.created_at})`);
  });
}

checkRealMessages(); 