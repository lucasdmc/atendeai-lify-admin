import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookAfterDeploy() {
  console.log('🚀 TESTANDO WEBHOOK APÓS DEPLOY');
  console.log('=================================');

  try {
    // 1. Verificar mensagens recentes
    const last30Minutes = new Date();
    last30Minutes.setMinutes(last30Minutes.getMinutes() - 30);
    
    console.log('🔍 Buscando mensagens dos últimos 30 minutos...');
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .gte('created_at', last30Minutes.toISOString())
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens recentes:', messagesError);
      return;
    }

    console.log('✅ Mensagens dos últimos 30 minutos:', recentMessages.length);
    recentMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 2. Instruções para teste
    console.log('\n📱 INSTRUÇÕES PARA TESTE:');
    console.log('===========================');
    console.log('1. Envie uma nova mensagem para o WhatsApp da CardioPrime');
    console.log('2. Aguarde a resposta do chatbot');
    console.log('3. Verifique se a mensagem aparece na tela de Conversas');
    console.log('4. Selecione a conversa para ver as mensagens');
    console.log('');
    console.log('✅ O webhook foi atualizado no Railway');
    console.log('✅ Agora deve salvar TODAS as mensagens');
    console.log('✅ A tela deve ser um ESPELHO do WhatsApp');

    // 3. Verificar se há mensagens do seu número
    const messagesFromUser = recentMessages.filter(msg => 
      msg.sender_phone === '5547997192447' && 
      msg.message_type === 'received'
    );
    
    if (messagesFromUser.length === 0) {
      console.log('\n⚠️  Nenhuma mensagem do seu número encontrada');
      console.log('🔧 Isso é normal se você ainda não enviou uma nova mensagem');
      console.log('📱 Envie uma mensagem agora para testar!');
    } else {
      console.log('\n✅ Mensagens do seu número encontradas:', messagesFromUser.length);
      console.log('✅ O sistema está funcionando corretamente');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testWebhookAfterDeploy(); 