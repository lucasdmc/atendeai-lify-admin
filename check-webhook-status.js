import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebhookStatus() {
  console.log('🔍 VERIFICANDO STATUS DO WEBHOOK');
  console.log('==================================');

  try {
    // 1. Verificar se há mensagens recentes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    console.log('🔍 Buscando mensagens das últimas 24 horas...');
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens recentes:', messagesError);
      return;
    }

    console.log('✅ Mensagens recentes encontradas:', recentMessages.length);
    recentMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 2. Verificar se há conversas recentes
    console.log('\n🔍 Buscando conversas recentes...');
    const { data: recentConversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas recentes:', conversationsError);
      return;
    }

    console.log('✅ Conversas recentes encontradas:', recentConversations.length);
    recentConversations.forEach((conv, index) => {
      const date = new Date(conv.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
    });

    // 3. Verificar se as mensagens que você enviou estão no banco
    console.log('\n🔍 Verificando mensagens específicas...');
    const { data: specificMessages, error: specificError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .or(`content.ilike.%Oi%,content.ilike.%Teste%`)
      .order('created_at', { ascending: false });

    if (specificError) {
      console.error('❌ Erro ao buscar mensagens específicas:', specificError);
      return;
    }

    console.log('✅ Mensagens com "Oi" ou "Teste" encontradas:', specificMessages.length);
    specificMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Conteúdo: ${msg.content}`);
    });

    // 4. Análise
    console.log('\n📊 ANÁLISE:');
    console.log('============');
    
    if (recentMessages.length === 0) {
      console.log('❌ NENHUMA mensagem recente encontrada');
      console.log('❌ O webhook NÃO está processando mensagens');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Webhook não está ativo no Meta/Facebook');
      console.log('   2. Webhook não está configurado corretamente');
      console.log('   3. Servidor não está rodando');
      console.log('   4. URL do webhook está incorreta');
    } else {
      console.log('✅ Mensagens recentes encontradas');
      console.log('✅ O webhook ESTÁ processando mensagens');
      
      const messagesFromUser = recentMessages.filter(msg => 
        msg.sender_phone === '5547997192447' && 
        msg.message_type === 'received'
      );
      
      if (messagesFromUser.length === 0) {
        console.log('⚠️  Nenhuma mensagem do seu número encontrada');
        console.log('🔧 POSSÍVEIS CAUSAS:');
        console.log('   1. Mensagens não estão sendo enviadas para o webhook');
        console.log('   2. Webhook não está configurado para o número correto');
        console.log('   3. Problema na configuração do Meta/Facebook');
      } else {
        console.log('✅ Mensagens do seu número encontradas');
        console.log('✅ Sistema funcionando corretamente');
      }
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

checkWebhookStatus(); 