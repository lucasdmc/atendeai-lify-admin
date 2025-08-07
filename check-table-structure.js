import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
  console.log('=====================================');

  try {
    // Verificar estrutura da tabela whatsapp_conversations_improved
    console.log('\n📋 Estrutura da tabela whatsapp_conversations_improved:');
    const { data: conversationsStructure, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .limit(1);

    if (conversationsError) {
      console.error('❌ Erro ao verificar estrutura de conversas:', conversationsError);
    } else {
      console.log('✅ Tabela existe. Colunas disponíveis:');
      if (conversationsStructure && conversationsStructure.length > 0) {
        console.log(Object.keys(conversationsStructure[0]));
      } else {
        console.log('Tabela vazia, mas existe');
      }
    }

    // Verificar estrutura da tabela whatsapp_messages_improved
    console.log('\n📋 Estrutura da tabela whatsapp_messages_improved:');
    const { data: messagesStructure, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .limit(1);

    if (messagesError) {
      console.error('❌ Erro ao verificar estrutura de mensagens:', messagesError);
    } else {
      console.log('✅ Tabela existe. Colunas disponíveis:');
      if (messagesStructure && messagesStructure.length > 0) {
        console.log(Object.keys(messagesStructure[0]));
      } else {
        console.log('Tabela vazia, mas existe');
      }
    }

    // Tentar inserir uma linha de teste para ver a estrutura
    console.log('\n🧪 Testando inserção para descobrir estrutura:');
    try {
      const { data: testInsert, error: testError } = await supabase
        .from('whatsapp_conversations_improved')
        .insert({
          // Tentar com diferentes nomes de colunas
          from_number: 'test',
          to_number: 'test',
          last_message: 'test',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testError) {
        console.log('❌ Erro na inserção de teste:', testError.message);
        console.log('Dica: Verificar nomes corretos das colunas');
      } else {
        console.log('✅ Inserção de teste bem-sucedida:', testInsert);
      }
    } catch (error) {
      console.log('❌ Erro geral na inserção de teste:', error.message);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkTableStructure(); 