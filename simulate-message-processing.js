import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular o método isFirstConversationOfDay
const isFirstConversationOfDay = async (phoneNumber) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Primeiro, verificar se há registros antigos que precisam ser atualizados
    const { data: existingRecord } = await supabase
      .from('conversation_memory')
      .select('last_interaction')
      .eq('phone_number', phoneNumber)
      .single();

    // Se há um registro antigo (de dias anteriores), atualizar para hoje
    if (existingRecord && existingRecord.last_interaction) {
      const recordDate = new Date(existingRecord.last_interaction);
      if (recordDate < startOfDay) {
        console.log('🔄 Atualizando registro antigo para hoje...');
        
        await supabase
          .from('conversation_memory')
          .update({
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber);
      }
    }
    
    // Agora verificar se há interações hoje
    const { data } = await supabase
      .from('conversation_memory')
      .select('last_interaction')
      .eq('phone_number', phoneNumber)
      .gte('last_interaction', startOfDay.toISOString())
      .order('last_interaction', { ascending: false })
      .limit(1);

    // Se não há interações hoje, é primeira conversa
    return !data || data.length === 0;
  } catch (error) {
    console.error('❌ Erro ao verificar primeira conversa do dia:', error);
    return true; // Por segurança, assume que é primeira conversa
  }
};

// Simular o método applyResponseLogic
const applyResponseLogic = async (response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile) => {
  try {
    // Obter configurações do agente
    const agentConfig = clinicContext.agentConfig || {};
    
    console.log('🔧 Configurações do agente encontradas:', {
      nome: agentConfig.nome,
      saudacao_inicial: agentConfig.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      mensagem_despedida: agentConfig.mensagem_despedida ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      mensagem_fora_horario: agentConfig.mensagem_fora_horario ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
    });
    
    // Se está fora do horário, usar mensagem fora do horário
    if (!isWithinBusinessHours) {
      const outOfHoursMessage = agentConfig.mensagem_fora_horario || 
        'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
      
      console.log('🕒 Aplicando mensagem fora do horário');
      return outOfHoursMessage;
    }

    // Se é primeira conversa do dia, adicionar saudação inicial
    if (isFirstConversationOfDay) {
      const initialGreeting = agentConfig.saudacao_inicial || 
        `Olá! Sou o ${agentConfig.nome || 'Assistente Virtual'}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
      
      console.log('👋 Aplicando saudação inicial:', initialGreeting.substring(0, 50) + '...');
      
      // Personalizar saudação com nome do usuário se disponível
      let personalizedGreeting = initialGreeting;
      if (userProfile?.name) {
        personalizedGreeting = initialGreeting.replace('Como posso ajudá-lo hoje?', `Como posso ajudá-lo hoje, ${userProfile.name}?`);
      }
      
      return personalizedGreeting + "\n\n" + response;
    }

    return response;
  } catch (error) {
    console.error('❌ Erro ao aplicar lógica de resposta:', error);
    return response;
  }
};

const simulateMessageProcessing = async () => {
  console.log('🧪 SIMULAÇÃO: Processamento de mensagem');
  
  const phoneNumber = '554730915628';
  const message = 'Olá!';
  
  try {
    // 1. Verificar se é primeira conversa do dia
    console.log('\n📅 Verificando se é primeira conversa do dia...');
    const isFirstConversationOfDayResult = await isFirstConversationOfDay(phoneNumber);
    console.log(`🎯 isFirstConversationOfDay: ${isFirstConversationOfDayResult}`);

    // 2. Simular contexto da clínica
    console.log('\n🏥 Simulando contexto da clínica...');
    const clinicContext = {
      name: 'CardioPrime',
      agentConfig: {
        nome: 'Cardio',
        saudacao_inicial: 'Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso cuidar da sua saúde cardiovascular hoje?',
        mensagem_despedida: 'Obrigado por escolher nossa clínica. Até breve!',
        mensagem_fora_horario: 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.'
      }
    };

    // 3. Simular resposta do LLM
    console.log('\n🤖 Simulando resposta do LLM...');
    const llmResponse = 'Olá, Lucas! Como posso ajudar você hoje com suas dúvidas ou necessidades relacionadas à saúde cardiovascular? Fique à vontade para perguntar!';

    // 4. Aplicar lógica de resposta
    console.log('\n🔧 Aplicando lógica de resposta...');
    const isWithinBusinessHours = true; // Simular que está dentro do horário
    const userProfile = { name: 'Lucas' };
    
    const finalResponse = await applyResponseLogic(
      llmResponse, 
      clinicContext, 
      isFirstConversationOfDayResult, 
      isWithinBusinessHours, 
      userProfile
    );

    console.log('\n📝 RESPOSTA FINAL:');
    console.log('='.repeat(50));
    console.log(finalResponse);
    console.log('='.repeat(50));

    // 5. Verificar se a resposta contém saudação
    const hasGreeting = finalResponse.includes('Olá! Sou o Cardio, assistente virtual da CardioPrime');
    console.log(`\n🔍 Contém saudação? ${hasGreeting ? 'SIM' : 'NÃO'}`);

    if (hasGreeting && !isFirstConversationOfDayResult) {
      console.log('❌ PROBLEMA: Saudação foi aplicada mesmo não sendo primeira conversa do dia!');
    } else if (!hasGreeting && isFirstConversationOfDayResult) {
      console.log('❌ PROBLEMA: Saudação não foi aplicada sendo primeira conversa do dia!');
    } else {
      console.log('✅ CORRETO: Lógica funcionando como esperado!');
    }

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
};

// Executar simulação
simulateMessageProcessing().then(() => {
  console.log('\n✅ Simulação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 