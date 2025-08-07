import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRailwayWebhook() {
  console.log('🔍 VERIFICANDO WEBHOOK DO RAILWAY');
  console.log('==================================');

  try {
    // 1. Verificar se há mensagens das últimas horas
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    console.log('🔍 Buscando mensagens da última hora...');
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .gte('created_at', lastHour.toISOString())
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens recentes:', messagesError);
      return;
    }

    console.log('✅ Mensagens da última hora:', recentMessages.length);
    recentMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. ${date.toLocaleString('pt-BR')} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Tipo: ${msg.message_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 2. Verificar se há mensagens específicas que você enviou
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

    // 3. Análise
    console.log('\n📊 ANÁLISE DO RAILWAY:');
    console.log('=======================');
    
    if (recentMessages.length === 0) {
      console.log('❌ NENHUMA mensagem recente encontrada');
      console.log('❌ O webhook do Railway NÃO está processando mensagens');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Webhook não está configurado no Meta/Facebook');
      console.log('   2. URL do webhook está incorreta');
      console.log('   3. Token de verificação está incorreto');
      console.log('   4. Railway não está rodando');
      console.log('   5. Variáveis de ambiente incorretas no Railway');
    } else {
      console.log('✅ Mensagens recentes encontradas');
      console.log('✅ O webhook do Railway ESTÁ processando mensagens');
      
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
        console.log('   4. URL do webhook no Meta está incorreta');
      } else {
        console.log('✅ Mensagens do seu número encontradas');
        console.log('✅ Sistema funcionando corretamente');
      }
    }

    // 4. Verificar configuração do webhook
    console.log('\n🔧 CONFIGURAÇÃO NECESSÁRIA:');
    console.log('============================');
    console.log('1. URL do webhook no Meta/Facebook deve ser:');
    console.log('   https://seu-app.railway.app/webhook/whatsapp-meta');
    console.log('');
    console.log('2. Token de verificação deve ser:');
    console.log('   atendeai-lify-backend');
    console.log('');
    console.log('3. Eventos que devem estar ativos:');
    console.log('   - messages');
    console.log('   - message_deliveries');
    console.log('   - message_reads');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

checkRailwayWebhook(); 