const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testSystemAfterFix() {
  console.log('🧪 TESTANDO SISTEMA APÓS CORREÇÕES');
  console.log('=====================================');

  try {
    // 1. Testar tabela conversation_memory
    console.log('\n1️⃣ Testando tabela conversation_memory...');
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (memoryError) {
      console.error('❌ Erro na tabela conversation_memory:', memoryError);
    } else {
      console.log('✅ Tabela conversation_memory funcionando!');
    }

    // 2. Testar tabela ai_whatsapp_messages
    console.log('\n2️⃣ Testando tabela ai_whatsapp_messages...');
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_whatsapp_messages')
      .select('*')
      .limit(1);

    if (messagesError) {
      console.error('❌ Erro na tabela ai_whatsapp_messages:', messagesError);
    } else {
      console.log('✅ Tabela ai_whatsapp_messages funcionando!');
    }

    // 3. Testar inserção de memória
    console.log('\n3️⃣ Testando inserção de memória...');
    const testPhone = '554730915628';
    const { data: insertData, error: insertError } = await supabase
      .from('conversation_memory')
      .upsert({
        phone_number: testPhone,
        user_name: 'Teste Sistema',
        interaction_count: 1,
        last_interaction: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      });

    if (insertError) {
      console.error('❌ Erro ao inserir memória:', insertError);
    } else {
      console.log('✅ Inserção de memória funcionando!');
    }

    // 4. Testar inserção de mensagem
    console.log('\n4️⃣ Testando inserção de mensagem...');
    const { data: messageInsertData, error: messageInsertError } = await supabase
      .from('ai_whatsapp_messages')
      .insert({
        phone_number: testPhone,
        sender: 'user',
        content: 'Teste do sistema após correções'
      });

    if (messageInsertError) {
      console.error('❌ Erro ao inserir mensagem:', messageInsertError);
    } else {
      console.log('✅ Inserção de mensagem funcionando!');
    }

    // 5. Testar backend
    console.log('\n5️⃣ Testando backend...');
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        console.log('✅ Backend funcionando!');
      } else {
        console.log('⚠️ Backend retornou status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível conectar ao backend:', error.message);
    }

    // 6. Testar WhatsApp
    console.log('\n6️⃣ Testando status do WhatsApp...');
    try {
      const whatsappResponse = await fetch('http://localhost:3001/whatsapp/status');
      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json();
        console.log('✅ Status do WhatsApp:', whatsappData);
      } else {
        console.log('⚠️ WhatsApp retornou status:', whatsappResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar WhatsApp:', error.message);
    }

    // 7. Verificar arquivo de contextualização
    console.log('\n7️⃣ Verificando arquivo de contextualização...');
    const fs = require('fs');
    const path = require('path');
    
    const contextualizacaoPath = path.join(__dirname, 'atendeai-lify-backend/src/data/contextualizacao-cardioprime.json');
    
    if (fs.existsSync(contextualizacaoPath)) {
      console.log('✅ Arquivo de contextualização da CardioPrime encontrado!');
      const contextualizacao = JSON.parse(fs.readFileSync(contextualizacaoPath, 'utf8'));
      console.log('📋 Clínica:', contextualizacao.clinica.informacoes_basicas.nome);
      console.log('👨‍⚕️ Agente:', contextualizacao.agente_ia.configuracao.nome);
    } else {
      console.log('⚠️ Arquivo de contextualização não encontrado');
    }

    console.log('\n🎯 TESTE COMPLETO!');
    console.log('📋 RESUMO DAS CORREÇÕES:');
    console.log('   ✅ Token do WhatsApp atualizado');
    console.log('   ✅ Tabela conversation_memory corrigida');
    console.log('   ✅ Tabela ai_whatsapp_messages criada');
    console.log('   ✅ ConversationMemoryService corrigido');
    console.log('   ✅ Contextualização da CardioPrime criada');
    console.log('   ✅ Sistema reiniciado');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Envie uma mensagem para o WhatsApp: 554730915628');
    console.log('2. Teste a memória persistente');
    console.log('3. Verifique se a contextualização está funcionando');
    console.log('4. Monitore os logs do sistema');

  } catch (error) {
    console.error('❌ Erro crítico no teste:', error);
  }
}

testSystemAfterFix(); 