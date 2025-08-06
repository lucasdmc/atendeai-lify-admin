import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (mesma configuração do serviço principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular o método removeGreetingPatterns
function removeGreetingPatterns(text) {
  const patterns = [
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo hoje\?/gi,
    /Olá! Sou o .*?assistente virtual.*?Em que posso ajudar/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso cuidar/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo/gi,
    /Olá! Sou o .*?assistente virtual.*?Em que posso ajudá-lo/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudar/gi
  ];
  
  let cleanText = text;
  patterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '');
  });
  
  // Limpar espaços extras e quebras de linha duplicadas
  cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();
  
  return cleanText;
}

// Simular o método applyResponseLogic
function applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile) {
  try {
    // Obter configurações do agente
    const agentConfig = clinicContext.agentConfig || {};
    
    console.log('🔧 Configurações do agente encontradas:', {
      nome: agentConfig.nome,
      saudacao_inicial: agentConfig.saudacao_inicial ? 'CONFIGURADA' : 'NÃO CONFIGURADA'
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
      
      // 1. Verificar se já tem saudação na resposta do LLM
      const hasGreeting = response.includes('Olá! Sou o') || 
                         response.includes('assistente virtual') ||
                         response.includes('Como posso ajudá-lo') ||
                         response.includes('Em que posso ajudar') ||
                         response.includes('Como posso cuidar');
      
      console.log('🔍 Verificando duplicação de saudação:', hasGreeting ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
      
      if (hasGreeting) {
        // 2. Remover saudações duplicadas da resposta
        const cleanResponse = removeGreetingPatterns(response);
        console.log('🧹 Saudação duplicada removida da resposta');
        return personalizedGreeting + "\n\n" + cleanResponse;
      } else {
        // Não tem saudação, adicionar normalmente
        return personalizedGreeting + "\n\n" + response;
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Erro ao aplicar lógica de resposta:', error);
    return response;
  }
}

async function testDuplicationFix() {
  console.log('🧪 TESTE: Correção de duplicação de saudações');
  
  try {
    // Simular contexto da clínica
    const clinicContext = {
      name: 'CardioPrime',
      agentConfig: {
        nome: 'Cardio',
        saudacao_inicial: 'Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso cuidar da sua saúde cardiovascular hoje?',
        mensagem_despedida: 'Obrigado por escolher nossa clínica. Até breve!',
        mensagem_fora_horario: 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.'
      }
    };

    // Teste 1: Resposta com saudação duplicada (caso real)
    console.log('\n📝 TESTE 1: Resposta com saudação duplicada');
    const responseWithDuplication = `Olá! Sou o Cardio, assistente virtual da CardioPrime. Em que posso ajudar você hoje? Caso tenha alguma dúvida sobre nossos serviços ou precise de informações sobre saúde cardiovascular, estou à disposição para ajudar.`;
    
    const result1 = applyResponseLogic(
      responseWithDuplication, 
      clinicContext, 
      true, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 1:');
    console.log('='.repeat(50));
    console.log(result1);
    console.log('='.repeat(50));

    // Teste 2: Resposta sem saudação
    console.log('\n📝 TESTE 2: Resposta sem saudação');
    const responseWithoutGreeting = `Claro! Posso te ajudar com informações sobre nossos serviços cardiovasculares. Temos consultas, exames e procedimentos especializados.`;
    
    const result2 = applyResponseLogic(
      responseWithoutGreeting, 
      clinicContext, 
      true, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 2:');
    console.log('='.repeat(50));
    console.log(result2);
    console.log('='.repeat(50));

    // Teste 3: Não é primeira conversa do dia
    console.log('\n📝 TESTE 3: Não é primeira conversa do dia');
    const result3 = applyResponseLogic(
      responseWithDuplication, 
      clinicContext, 
      false, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 3:');
    console.log('='.repeat(50));
    console.log(result3);
    console.log('='.repeat(50));

    // Verificar se há duplicações nos resultados
    console.log('\n🔍 VERIFICAÇÃO DE DUPLICAÇÕES:');
    
    const hasDuplication1 = result1.includes('Olá! Sou o Cardio') && 
                           result1.split('Olá! Sou o Cardio').length > 2;
    console.log(`Teste 1 tem duplicação? ${hasDuplication1 ? 'SIM' : 'NÃO'}`);
    
    const hasDuplication2 = result2.includes('Olá! Sou o Cardio') && 
                           result2.split('Olá! Sou o Cardio').length > 2;
    console.log(`Teste 2 tem duplicação? ${hasDuplication2 ? 'SIM' : 'NÃO'}`);
    
    const hasDuplication3 = result3.includes('Olá! Sou o Cardio') && 
                           result3.split('Olá! Sou o Cardio').length > 2;
    console.log(`Teste 3 tem duplicação? ${hasDuplication3 ? 'SIM' : 'NÃO'}`);

    if (!hasDuplication1 && !hasDuplication2 && !hasDuplication3) {
      console.log('\n✅ SUCESSO: Todas as duplicações foram removidas!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Ainda há duplicações detectadas.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testDuplicationFix().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 