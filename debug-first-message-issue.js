import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFirstMessageIssue() {
  console.log('🔍 DEBUG: Verificando problema da primeira mensagem');
  
  const phoneNumber = '554730915628'; // Número do exemplo
  
  try {
    // 1. Verificar se há registros na conversation_memory para hoje
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    console.log('\n📅 Verificando interações de hoje:', startOfDay.toISOString());
    
    const { data: todayInteractions, error: todayError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber)
      .gte('last_interaction', startOfDay.toISOString())
      .order('last_interaction', { ascending: false });

    if (todayError) {
      console.error('❌ Erro ao buscar interações de hoje:', todayError);
      return;
    }

    console.log(`📊 Interações encontradas hoje: ${todayInteractions?.length || 0}`);
    
    if (todayInteractions && todayInteractions.length > 0) {
      console.log('📋 Últimas interações de hoje:');
      todayInteractions.forEach((interaction, index) => {
        console.log(`  ${index + 1}. ${interaction.last_interaction} - ${interaction.memory_data?.history?.length || 0} mensagens`);
      });
    }

    // 2. Verificar se isFirstConversationOfDay está funcionando corretamente
    const isFirstConversationOfDay = !todayInteractions || todayInteractions.length === 0;
    console.log(`\n🎯 isFirstConversationOfDay: ${isFirstConversationOfDay}`);

    // 3. Verificar configurações do agente
    console.log('\n🏥 Verificando configurações da clínica...');
    
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('whatsapp_phone', phoneNumber)
      .single();

    if (clinicError) {
      console.error('❌ Erro ao buscar clínica:', clinicError);
      return;
    }

    if (clinicData && clinicData.contextualization_json) {
      const context = clinicData.contextualization_json;
      const agentConfig = context.agente_ia?.configuracao || {};
      
      console.log('🔧 Configurações do agente:');
      console.log(`  - Nome: ${agentConfig.nome || 'NÃO CONFIGURADO'}`);
      console.log(`  - Saudação inicial: ${agentConfig.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
      console.log(`  - Mensagem despedida: ${agentConfig.mensagem_despedida ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
      console.log(`  - Mensagem fora horário: ${agentConfig.mensagem_fora_horario ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
      
      if (agentConfig.saudacao_inicial) {
        console.log(`\n📝 Saudação configurada: "${agentConfig.saudacao_inicial}"`);
      }
    }

    // 4. Simular o método isFirstConversationOfDay
    console.log('\n🧪 Simulando isFirstConversationOfDay...');
    
    const { data: firstConversationCheck, error: firstError } = await supabase
      .from('conversation_memory')
      .select('last_interaction')
      .eq('phone_number', phoneNumber)
      .gte('last_interaction', startOfDay.toISOString())
      .order('last_interaction', { ascending: false })
      .limit(1);

    if (firstError) {
      console.error('❌ Erro na verificação de primeira conversa:', firstError);
      return;
    }

    const isFirstConversationOfDaySimulated = !firstConversationCheck || firstConversationCheck.length === 0;
    console.log(`🎯 Resultado da simulação: ${isFirstConversationOfDaySimulated}`);
    console.log(`📊 Dados encontrados: ${firstConversationCheck?.length || 0}`);

    // 5. Verificar se há problema na lógica
    if (todayInteractions && todayInteractions.length > 0 && isFirstConversationOfDaySimulated) {
      console.log('\n⚠️ PROBLEMA DETECTADO: Há interações hoje mas isFirstConversationOfDay retorna true!');
      console.log('🔍 Isso explica por que a saudação está sendo aplicada em todas as mensagens.');
    } else if (todayInteractions && todayInteractions.length > 0 && !isFirstConversationOfDaySimulated) {
      console.log('\n✅ LÓGICA CORRETA: Há interações hoje e isFirstConversationOfDay retorna false.');
      console.log('🔍 O problema pode estar em outro lugar.');
    } else if (!todayInteractions || todayInteractions.length === 0) {
      console.log('\n✅ PRIMEIRA CONVERSA DO DIA: Não há interações hoje.');
      console.log('🔍 A saudação deve ser aplicada corretamente.');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugFirstMessageIssue().then(() => {
  console.log('\n✅ Debug concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 