import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular os métodos do LLMOrchestratorService
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Dividir em palavras
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  // Filtrar palavras muito comuns que não indicam duplicação
  const commonWords = new Set(['a', 'o', 'e', 'de', 'da', 'do', 'em', 'para', 'com', 'que', 'se', 'não', 'é', 'são', 'tem', 'está', 'pode', 'posso', 'te', 'você', 'nossa', 'nossos', 'sua', 'seus']);
  
  const filteredWords1 = new Set([...words1].filter(word => !commonWords.has(word.toLowerCase())));
  const filteredWords2 = new Set([...words2].filter(word => !commonWords.has(word.toLowerCase())));
  
  // Se após filtrar não há palavras significativas, usar comparação original
  if (filteredWords1.size === 0 && filteredWords2.size === 0) {
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  
  // Calcular interseção e união das palavras filtradas
  const intersection = new Set([...filteredWords1].filter(x => filteredWords2.has(x)));
  const union = new Set([...filteredWords1, ...filteredWords2]);
  
  return intersection.size / union.size;
}

function removeDuplicateContent(text) {
  // Dividir o texto em frases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Array para armazenar frases únicas
  const uniqueSentences = [];
  const seenPhrases = new Set();
  
  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (cleanSentence.length === 0) continue;
    
    // Normalizar a frase para comparação (remover espaços extras, converter para minúsculas)
    const normalizedSentence = cleanSentence.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Verificar se a frase já foi vista (com tolerância para pequenas variações)
    const isDuplicate = Array.from(seenPhrases).some(seen => {
      const similarity = calculateSimilarity(normalizedSentence, seen);
      return similarity > 0.9; // Aumentar para 90% de similaridade para ser mais rigoroso
    });
    
    if (!isDuplicate) {
      uniqueSentences.push(cleanSentence);
      seenPhrases.add(normalizedSentence);
    }
  }
  
  // Reconstruir o texto sem duplicações
  let result = uniqueSentences.join('. ');
  
  // Garantir que termina com pontuação
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  // Limpar espaços extras e quebras de linha
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

function removeGreetingPatterns(text) {
  const patterns = [
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo hoje\?/gi,
    /Olá! Sou o .*?assistente virtual.*?Em que posso ajudar/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso cuidar/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudá-lo/gi,
    /Olá! Sou o .*?assistente virtual.*?Em que posso ajudá-lo/gi,
    /Olá! Sou o .*?assistente virtual.*?Como posso ajudar/gi,
    // Padrões mais específicos para o caso real
    /Olá! Sou o Cardio, assistente virtual da CardioPrime\. Em que posso ajudar você hoje\?/gi,
    /Olá! Sou o Cardio, assistente virtual da CardioPrime\. Como posso cuidar da sua saúde cardiovascular hoje\?/gi,
    /Olá! Sou o Cardio, assistente virtual da CardioPrime\. Como posso ajudá-lo hoje\?/gi
  ];
  
  let cleanText = text;
  patterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '');
  });
  
  // Limpar espaços extras e quebras de linha duplicadas
  cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();
  
  // Remover frases soltas que podem ter ficado
  cleanText = cleanText.replace(/^você hoje\?\s*/gi, '');
  cleanText = cleanText.replace(/^Em que posso ajudar\s*/gi, '');
  cleanText = cleanText.replace(/^Como posso ajudá-lo\s*/gi, '');
  
  return cleanText;
}

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

    // Para todas as respostas (primeira conversa ou não), verificar duplicações gerais
    const cleanedResponse = removeDuplicateContent(response);
    if (cleanedResponse !== response) {
      console.log('🧹 Conteúdo duplicado removido da resposta');
    }

    return cleanedResponse;
  } catch (error) {
    console.error('❌ Erro ao aplicar lógica de resposta:', error);
    return response;
  }
}

async function testGeneralDuplicationFix() {
  console.log('🧪 TESTE: Correção de duplicações gerais');
  
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

    // Teste 2: Resposta com frases duplicadas
    console.log('\n📝 TESTE 2: Resposta com frases duplicadas');
    const responseWithRepeatedPhrases = `A CardioPrime é uma clínica especializada em cardiologia. A CardioPrime oferece serviços de qualidade. A CardioPrime está localizada em Blumenau. A CardioPrime tem equipamentos modernos.`;
    
    const result2 = applyResponseLogic(
      responseWithRepeatedPhrases, 
      clinicContext, 
      false, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 2:');
    console.log('='.repeat(50));
    console.log(result2);
    console.log('='.repeat(50));

    // Teste 3: Resposta com frases similares mas não idênticas
    console.log('\n📝 TESTE 3: Resposta com frases similares');
    const responseWithSimilarPhrases = `Posso te ajudar com informações sobre nossos serviços. Posso te ajudar com agendamentos. Posso te ajudar com dúvidas sobre exames.`;
    
    const result3 = applyResponseLogic(
      responseWithSimilarPhrases, 
      clinicContext, 
      false, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 3:');
    console.log('='.repeat(50));
    console.log(result3);
    console.log('='.repeat(50));

    // Teste 4: Resposta normal sem duplicações
    console.log('\n📝 TESTE 4: Resposta normal sem duplicações');
    const responseNormal = `A CardioPrime oferece consultas cardiovasculares especializadas. Nossos exames incluem ecocardiograma e teste ergométrico. Estamos localizados no Hospital Santa Catarina.`;
    
    const result4 = applyResponseLogic(
      responseNormal, 
      clinicContext, 
      false, // isFirstConversationOfDay
      true, // isWithinBusinessHours
      { name: 'Lucas' }
    );

    console.log('\n📝 RESULTADO TESTE 4:');
    console.log('='.repeat(50));
    console.log(result4);
    console.log('='.repeat(50));

    // Verificar se há duplicações nos resultados
    console.log('\n🔍 VERIFICAÇÃO DE DUPLICAÇÕES:');
    
    // Função para verificar duplicações de forma mais inteligente
    function checkForDuplications(text, phrase) {
      const occurrences = text.split(phrase).length - 1;
      return occurrences > 1;
    }
    
    const hasDuplication1 = checkForDuplications(result1, 'Olá! Sou o Cardio');
    console.log(`Teste 1 tem duplicação? ${hasDuplication1 ? 'SIM' : 'NÃO'}`);
    
    const hasDuplication2 = checkForDuplications(result2, 'A CardioPrime');
    console.log(`Teste 2 tem duplicação? ${hasDuplication2 ? 'SIM' : 'NÃO'}`);
    
    const hasDuplication3 = checkForDuplications(result3, 'Posso te ajudar');
    console.log(`Teste 3 tem duplicação? ${hasDuplication3 ? 'SIM' : 'NÃO'}`);
    
    const hasDuplication4 = checkForDuplications(result4, 'CardioPrime');
    console.log(`Teste 4 tem duplicação? ${hasDuplication4 ? 'SIM' : 'NÃO'}`);

    if (!hasDuplication1 && !hasDuplication2 && !hasDuplication3 && !hasDuplication4) {
      console.log('\n✅ SUCESSO: Todas as duplicações foram removidas!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Ainda há duplicações detectadas.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testGeneralDuplicationFix().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 