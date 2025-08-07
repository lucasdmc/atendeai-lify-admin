import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function checkConversations() {
  console.log('🔍 Verificando conversas no banco...');
  
  const { data: conversations, error } = await supabase
    .from('whatsapp_conversations_improved')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ Encontradas ${conversations.length} conversas:`);
  conversations.forEach((conv, index) => {
    console.log(`${index + 1}. ID: ${conv.id}`);
    console.log(`   Paciente: ${conv.patient_phone_number}`);
    console.log(`   Clínica: ${conv.clinic_whatsapp_number}`);
    console.log(`   Última mensagem: ${conv.last_message_preview}`);
    console.log(`   Criado: ${conv.created_at}`);
    console.log('---');
  });
}

checkConversations(); 