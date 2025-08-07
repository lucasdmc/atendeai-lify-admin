import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRailwayWebhookVersion() {
  console.log('🔍 VERIFICANDO VERSÃO DO WEBHOOK NO RAILWAY');
  console.log('============================================');

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

    // 3. Análise crítica
    console.log('\n🎯 ANÁLISE CRÍTICA:');
    console.log('===================');
    
    if (recentMessages.length === 0) {
      console.log('❌ NENHUMA mensagem recente encontrada');
      console.log('❌ O webhook do Railway NÃO está salvando mensagens');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Webhook antigo no Railway (sem salvamento)');
      console.log('   2. Variáveis de ambiente incorretas no Railway');
      console.log('   3. Erro no código do webhook no Railway');
      console.log('   4. Permissões do Supabase incorretas no Railway');
    } else {
      console.log('✅ Mensagens recentes encontradas');
      console.log('✅ O webhook do Railway ESTÁ salvando mensagens');
      
      const messagesFromUser = recentMessages.filter(msg => 
        msg.sender_phone === '5547997192447' && 
        msg.message_type === 'received'
      );
      
      if (messagesFromUser.length === 0) {
        console.log('⚠️  Nenhuma mensagem do seu número encontrada');
        console.log('🔧 POSSÍVEIS CAUSAS:');
        console.log('   1. Webhook antigo no Railway (sem salvamento)');
        console.log('   2. Mensagens não estão sendo processadas pelo webhook');
        console.log('   3. Erro no processamento das mensagens');
      } else {
        console.log('✅ Mensagens do seu número encontradas');
        console.log('✅ Sistema funcionando corretamente');
      }
    }

    // 4. Verificar se o Railway precisa ser atualizado
    console.log('\n🔧 VERIFICANDO NECESSIDADE DE ATUALIZAÇÃO:');
    console.log('==========================================');
    
    if (recentMessages.length === 0) {
      console.log('❌ NENHUMA mensagem recente encontrada');
      console.log('❌ O Railway precisa ser atualizado');
      console.log('🔧 AÇÕES NECESSÁRIAS:');
      console.log('   1. Fazer deploy da versão atualizada do webhook');
      console.log('   2. Verificar variáveis de ambiente no Railway');
      console.log('   3. Verificar logs do Railway');
    } else {
      console.log('✅ Mensagens recentes encontradas');
      console.log('✅ Railway está funcionando corretamente');
    }

    // 5. Instruções para atualizar o Railway
    console.log('\n🚀 INSTRUÇÕES PARA ATUALIZAR O RAILWAY:');
    console.log('=========================================');
    console.log('1. Fazer commit das alterações:');
    console.log('   git add .');
    console.log('   git commit -m "Atualizar webhook com salvamento de mensagens"');
    console.log('   git push');
    console.log('');
    console.log('2. Verificar se o Railway fez deploy automaticamente');
    console.log('');
    console.log('3. Verificar logs do Railway para ver se há erros');
    console.log('');
    console.log('4. Testar enviando uma nova mensagem');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

checkRailwayWebhookVersion(); 