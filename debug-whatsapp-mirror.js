import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWhatsAppMirror() {
  console.log('🔍 VERIFICANDO ESPELHO DO WHATSAPP');
  console.log('===================================');

  try {
    // 1. Buscar todas as mensagens da conversa com seu número
    console.log('🔍 Buscando mensagens da conversa...');
    const { data: allMessages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .or(`sender_phone.eq.5547997192447,receiver_phone.eq.5547997192447`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
      return;
    }

    console.log('✅ Total de mensagens encontradas:', allMessages.length);
    console.log('\n📱 MENSAGENS NO BANCO:');
    console.log('=======================');
    
    allMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      const time = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      const sender = msg.sender_phone === '5547997192447' ? 'Lucas Cantoni' : '~554730915628';
      console.log(`[${time}] ${sender}: ${msg.content}`);
    });

    // 2. Comparar com o que você vê no WhatsApp
    console.log('\n📱 COMPARAÇÃO COM WHATSAPP:');
    console.log('============================');
    console.log('✅ O que você vê no WhatsApp:');
    console.log('[20:40:06] Lucas Cantoni: Oi');
    console.log('[20:40:15] ~554730915628: No momento estamos fora do horário...');
    console.log('[20:48:41] Lucas Cantoni: Teste');
    console.log('[20:48:47] ~554730915628: No momento estamos fora do horário...');
    console.log('[20:54:07] Lucas Cantoni: Oi');
    console.log('[20:54:15] ~554730915628: No momento estamos fora do horário...');

    // 3. Verificar se há mensagens faltando
    console.log('\n🔍 VERIFICANDO MENSAGENS FALTANDO:');
    console.log('===================================');
    
    const expectedMessages = [
      { time: '20:40:06', sender: 'Lucas Cantoni', content: 'Oi' },
      { time: '20:40:15', sender: '~554730915628', content: 'No momento estamos fora do horário' },
      { time: '20:48:41', sender: 'Lucas Cantoni', content: 'Teste' },
      { time: '20:48:47', sender: '~554730915628', content: 'No momento estamos fora do horário' },
      { time: '20:54:07', sender: 'Lucas Cantoni', content: 'Oi' },
      { time: '20:54:15', sender: '~554730915628', content: 'No momento estamos fora do horário' }
    ];

    console.log('✅ Mensagens esperadas:', expectedMessages.length);
    console.log('✅ Mensagens no banco:', allMessages.length);

    if (allMessages.length < expectedMessages.length) {
      console.log('❌ FALTAM MENSAGENS NO BANCO!');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Webhook não está salvando todas as mensagens');
      console.log('   2. Mensagens foram perdidas durante processamento');
      console.log('   3. Erro no salvamento de algumas mensagens');
    } else if (allMessages.length > expectedMessages.length) {
      console.log('⚠️  HÁ MENSAGENS EXTRAS NO BANCO!');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Mensagens de teste não foram limpas');
      console.log('   2. Duplicação de mensagens');
    } else {
      console.log('✅ Número de mensagens correto');
    }

    // 4. Verificar conteúdo das mensagens
    console.log('\n🔍 VERIFICANDO CONTEÚDO DAS MENSAGENS:');
    console.log('=======================================');
    
    const userMessages = allMessages.filter(msg => msg.sender_phone === '5547997192447');
    const botMessages = allMessages.filter(msg => msg.sender_phone === '554730915628');

    console.log('✅ Mensagens do usuário:', userMessages.length);
    userMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      const time = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      console.log(`   ${index + 1}. [${time}] Lucas Cantoni: ${msg.content}`);
    });

    console.log('\n✅ Mensagens do bot:', botMessages.length);
    botMessages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      const time = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      console.log(`   ${index + 1}. [${time}] ~554730915628: ${msg.content.substring(0, 50)}...`);
    });

    // 5. Análise final
    console.log('\n🎯 ANÁLISE FINAL:');
    console.log('==================');
    
    if (allMessages.length === 0) {
      console.log('❌ NENHUMA MENSAGEM NO BANCO');
      console.log('❌ O webhook não está salvando mensagens');
      console.log('🔧 AÇÃO NECESSÁRIA: Atualizar webhook no Railway');
    } else if (allMessages.length < expectedMessages.length) {
      console.log('⚠️  MENSAGENS FALTANDO');
      console.log('⚠️  O banco não reflete exatamente o WhatsApp');
      console.log('🔧 AÇÃO NECESSÁRIA: Verificar por que algumas mensagens não foram salvas');
    } else if (allMessages.length > expectedMessages.length) {
      console.log('⚠️  MENSAGENS EXTRAS');
      console.log('⚠️  O banco tem mais mensagens que o WhatsApp');
      console.log('🔧 AÇÃO NECESSÁRIA: Limpar mensagens de teste');
    } else {
      console.log('✅ ESPELHO PERFEITO');
      console.log('✅ O banco reflete exatamente o WhatsApp');
    }

  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugWhatsAppMirror(); 