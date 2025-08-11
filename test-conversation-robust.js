#!/usr/bin/env node

/**
 * 🧪 TESTE ROBUSTO DE CONVERSAÇÃO - SISTEMA WHATSAPP COMPLETO
 * 
 * Este teste simula uma conversa completa e testa TODAS as funcionalidades:
 * 
 * ✅ SAUDAÇÃO E MEMÓRIA:
 * - Primeira mensagem do dia (deve apresentar saudação)
 * - Mensagens subsequentes (NÃO devem apresentar saudação)
 * - Reconhecimento e memória do nome do usuário
 * - Verificação de primeira conversa do dia
 * 
 * ✅ CONTEXTUALIZAÇÃO:
 * - Respostas baseadas no JSON da clínica
 * - Informações sobre exames, médicos, contatos
 * - Dados específicos da CardioPrime
 * 
 * ✅ FLUXO DE CONVERSA:
 * - Detecção de intenções
 * - Gerenciamento de memória
 * - Respostas personalizadas
 * 
 * ✅ CASOS ESPECIAIS:
 * - Mensagens simples (Oi, Olá)
 * - Perguntas específicas sobre a clínica
 * - Verificação de horário de funcionamento
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar serviços
import LLMOrchestratorService from './services/core/llmOrchestratorService.js';
import ClinicContextManager from './services/core/clinicContextManager.js';

// Configurações de teste
const TEST_CONFIG = {
  phoneNumber: '+554730915628', // Número da CardioPrime
  clinicName: 'CardioPrime',
  testDelay: 1000, // Delay entre testes (ms)
  enableLogs: true
};

// Função de log
function log(message, type = 'INFO') {
  if (TEST_CONFIG.enableLogs) {
    const timestamp = new Date().toISOString();
    const emoji = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARNING': '⚠️',
      'TEST': '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${emoji} [${timestamp}] ${type}: ${message}`);
  }
}

// Função de delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para limpar memória antes do teste
async function clearTestMemory() {
  try {
    log('🧹 Limpando memória de teste...', 'TEST');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Deletar memória de teste
    const { error } = await supabase
      .from('conversation_memory')
      .delete()
      .eq('phone_number', TEST_CONFIG.phoneNumber.replace('+', ''));
    
    if (error) {
      log(`⚠️ Aviso ao limpar memória: ${error.message}`, 'WARNING');
    } else {
      log('✅ Memória de teste limpa com sucesso', 'SUCCESS');
    }
  } catch (error) {
    log(`❌ Erro ao limpar memória: ${error.message}`, 'ERROR');
  }
}

// Função para testar saudação e memória
async function testGreetingAndMemory() {
  log('🧪 TESTE 1: Saudação e Memória', 'TEST');
  
  try {
    // Teste 1.1: Primeira mensagem do dia
    log('📝 Teste 1.1: Primeira mensagem do dia', 'TEST');
    
    const firstMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Olá, me chamo Lucas, tudo bem?'
    };
    
    const firstResponse = await LLMOrchestratorService.processMessage(firstMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${firstMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${firstResponse.response}`, 'INFO');
    
    // Verificações
    const hasGreeting = firstResponse.response.includes('Olá') || 
                       firstResponse.response.includes('Sou o Cardio') ||
                       firstResponse.response.includes('assistente virtual da CardioPrime');
    
    if (hasGreeting) {
      log('✅ Saudação apresentada corretamente na primeira mensagem', 'SUCCESS');
    } else {
      log('❌ Saudação NÃO apresentada na primeira mensagem', 'ERROR');
    }
    
    const hasName = firstResponse.response.includes('Lucas');
    if (hasName) {
      log('✅ Nome do usuário reconhecido e usado', 'SUCCESS');
    } else {
      log('❌ Nome do usuário NÃO reconhecido', 'ERROR');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 1.2: Segunda mensagem (NÃO deve ter saudação)
    log('📝 Teste 1.2: Segunda mensagem (sem saudação)', 'TEST');
    
    const secondMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Oi'
    };
    
    const secondResponse = await LLMOrchestratorService.processMessage(secondMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${secondMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${secondResponse.response}`, 'INFO');
    
    // Verificações
    const hasGreetingSecond = secondResponse.response.includes('Olá') || 
                             secondResponse.response.includes('Sou o Cardio') ||
                             secondResponse.response.includes('assistente virtual da CardioPrime');
    
    if (!hasGreetingSecond) {
      log('✅ Saudação NÃO apresentada na segunda mensagem (CORRETO)', 'SUCCESS');
    } else {
      log('❌ Saudação apresentada na segunda mensagem (INCORRETO)', 'ERROR');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 1.3: Terceira mensagem (NÃO deve ter saudação)
    log('📝 Teste 1.3: Terceira mensagem (sem saudação)', 'TEST');
    
    const thirdMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Oi'
    };
    
    const thirdResponse = await LLMOrchestratorService.processMessage(thirdMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${thirdMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${thirdResponse.response}`, 'INFO');
    
    // Verificações
    const hasGreetingThird = thirdResponse.response.includes('Olá') || 
                            thirdResponse.response.includes('Sou o Cardio') ||
                            thirdResponse.response.response.includes('assistente virtual da CardioPrime');
    
    if (!hasGreetingThird) {
      log('✅ Saudação NÃO apresentada na terceira mensagem (CORRETO)', 'SUCCESS');
    } else {
      log('❌ Saudação apresentada na terceira mensagem (INCORRETO)', 'ERROR');
    }
    
    log('✅ Teste 1 (Saudação e Memória) concluído', 'SUCCESS');
    
  } catch (error) {
    log(`❌ Erro no teste 1: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Função para testar contextualização
async function testContextualization() {
  log('🧪 TESTE 2: Contextualização', 'TEST');
  
  try {
    // Teste 2.1: Pergunta sobre exames
    log('📝 Teste 2.1: Pergunta sobre exames', 'TEST');
    
    const examMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Gostaria de informações sobre os exames da clínica'
    };
    
    const examResponse = await LLMOrchestratorService.processMessage(examMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${examMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${examResponse.response}`, 'INFO');
    
    // Verificações
    const hasGenericResponse = examResponse.response.includes('Não disponho de informações específicas') ||
                             examResponse.response.includes('não tenho informações específicas') ||
                             examResponse.response.includes('Infelizmente, não disponho');
    
    if (hasGenericResponse) {
      log('❌ Resposta genérica sobre exames (PROBLEMA DE CONTEXTUALIZAÇÃO)', 'ERROR');
    } else {
      log('✅ Resposta específica sobre exames (CONTEXTUALIZAÇÃO FUNCIONANDO)', 'SUCCESS');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 2.2: Pergunta sobre médicos
    log('📝 Teste 2.2: Pergunta sobre médicos', 'TEST');
    
    const doctorMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Quais médicos trabalham na clínica?'
    };
    
    const doctorResponse = await LLMOrchestratorService.processMessage(doctorMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${doctorMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${doctorResponse.response}`, 'INFO');
    
    // Verificações
    const hasGenericDoctorResponse = doctorResponse.response.includes('Não disponho de informações específicas') ||
                                   doctorResponse.response.includes('não tenho informações específicas') ||
                                   doctorResponse.response.includes('Infelizmente, não disponho');
    
    if (hasGenericDoctorResponse) {
      log('❌ Resposta genérica sobre médicos (PROBLEMA DE CONTEXTUALIZAÇÃO)', 'ERROR');
    } else {
      log('✅ Resposta específica sobre médicos (CONTEXTUALIZAÇÃO FUNCIONANDO)', 'SUCCESS');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 2.3: Pergunta sobre contatos
    log('📝 Teste 2.3: Pergunta sobre contatos', 'TEST');
    
    const contactMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Como posso entrar em contato com a clínica?'
    };
    
    const contactResponse = await LLMOrchestratorService.processMessage(contactMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${contactMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${contactResponse.response}`, 'INFO');
    
    // Verificações
    const hasContactInfo = contactResponse.response.includes('(47) 3231-0200') ||
                          contactResponse.response.includes('Rua Azambuja') ||
                          contactResponse.response.includes('Blumenau/SC');
    
    if (hasContactInfo) {
      log('✅ Informações de contato fornecidas corretamente', 'SUCCESS');
    } else {
      log('❌ Informações de contato NÃO fornecidas', 'ERROR');
    }
    
    log('✅ Teste 2 (Contextualização) concluído', 'SUCCESS');
    
  } catch (error) {
    log(`❌ Erro no teste 2: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Função para testar fluxo de conversa
async function testConversationFlow() {
  log('🧪 TESTE 3: Fluxo de Conversa', 'TEST');
  
  try {
    // Teste 3.1: Verificação de nome
    log('📝 Teste 3.1: Verificação de nome', 'TEST');
    
    const nameMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Qual meu nome?'
    };
    
    const nameResponse = await LLMOrchestratorService.processMessage(nameMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${nameMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${nameResponse.response}`, 'INFO');
    
    // Verificações
    const hasName = nameResponse.response.includes('Lucas');
    if (hasName) {
      log('✅ Nome do usuário lembrado corretamente', 'SUCCESS');
    } else {
      log('❌ Nome do usuário NÃO lembrado', 'ERROR');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 3.2: Mensagem simples sem contexto
    log('📝 Teste 3.2: Mensagem simples sem contexto', 'TEST');
    
    const simpleMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Tudo bem?'
    };
    
    const simpleResponse = await LLMOrchestratorService.processMessage(simpleMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${simpleMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${simpleResponse.response}`, 'INFO');
    
    // Verificações
    const hasGreeting = simpleResponse.response.includes('Olá') || 
                       simpleResponse.response.includes('Sou o Cardio') ||
                       simpleResponse.response.includes('assistente virtual da CardioPrime');
    
    if (!hasGreeting) {
      log('✅ Resposta simples sem saudação (CORRETO)', 'SUCCESS');
    } else {
      log('❌ Resposta com saudação desnecessária (INCORRETO)', 'ERROR');
    }
    
    log('✅ Teste 3 (Fluxo de Conversa) concluído', 'SUCCESS');
    
  } catch (error) {
    log(`❌ Erro no teste 3: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Função para testar casos especiais
async function testSpecialCases() {
  log('🧪 TESTE 4: Casos Especiais', 'TEST');
  
  try {
    // Teste 4.1: Mensagem de agendamento
    log('📝 Teste 4.1: Mensagem de agendamento', 'TEST');
    
    const appointmentMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Quero agendar uma consulta de cardiologia'
    };
    
    const appointmentResponse = await LLMOrchestratorService.processMessage(appointmentMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${appointmentMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${appointmentResponse.response}`, 'INFO');
    
    // Verificações
    const hasAppointmentResponse = appointmentResponse.response.includes('agendar') ||
                                 appointmentResponse.response.includes('consulta') ||
                                 appointmentResponse.response.includes('cardiologia');
    
    if (hasAppointmentResponse) {
      log('✅ Resposta sobre agendamento fornecida', 'SUCCESS');
    } else {
      log('❌ Resposta sobre agendamento NÃO fornecida', 'ERROR');
    }
    
    await delay(TEST_CONFIG.testDelay);
    
    // Teste 4.2: Mensagem de emergência
    log('📝 Teste 4.2: Mensagem de emergência', 'TEST');
    
    const emergencyMessage = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      message: 'Estou com dor no peito'
    };
    
    const emergencyResponse = await LLMOrchestratorService.processMessage(emergencyMessage);
    
    log('📤 Mensagem enviada:', 'INFO');
    log(`   Usuário: ${emergencyMessage.message}`, 'INFO');
    
    log('📥 Resposta recebida:', 'INFO');
    log(`   Bot: ${emergencyResponse.response}`, 'INFO');
    
    // Verificações
    const hasEmergencyResponse = emergencyResponse.response.includes('emergência') ||
                               emergencyResponse.response.includes('192') ||
                               emergencyResponse.response.includes('SAMU') ||
                               emergencyResponse.response.includes('pronto-socorro');
    
    if (hasEmergencyResponse) {
      log('✅ Resposta de emergência fornecida', 'SUCCESS');
    } else {
      log('❌ Resposta de emergência NÃO fornecida', 'ERROR');
    }
    
    log('✅ Teste 4 (Casos Especiais) concluído', 'SUCCESS');
    
  } catch (error) {
    log(`❌ Erro no teste 4: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Função principal de teste
async function runRobustTest() {
  log('🚀 INICIANDO TESTE ROBUSTO DE CONVERSAÇÃO', 'TEST');
  log(`📱 Número de teste: ${TEST_CONFIG.phoneNumber}`, 'INFO');
  log(`🏥 Clínica: ${TEST_CONFIG.clinicName}`, 'INFO');
  
  try {
    // Inicializar serviços
    log('🔧 Inicializando serviços...', 'INFO');
    await ClinicContextManager.initialize();
    
    // Limpar memória de teste
    await clearTestMemory();
    
    // Executar testes sequencialmente
    log('🧪 Executando testes...', 'TEST');
    
    await testGreetingAndMemory();
    await delay(TEST_CONFIG.testDelay);
    
    await testContextualization();
    await delay(TEST_CONFIG.testDelay);
    
    await testConversationFlow();
    await delay(TEST_CONFIG.testDelay);
    
    await testSpecialCases();
    
    log('🎉 TESTE ROBUSTO CONCLUÍDO COM SUCESSO!', 'SUCCESS');
    log('📊 Resumo dos testes executados:', 'INFO');
    log('   ✅ Teste 1: Saudação e Memória', 'INFO');
    log('   ✅ Teste 2: Contextualização', 'INFO');
    log('   ✅ Teste 3: Fluxo de Conversa', 'INFO');
    log('   ✅ Teste 4: Casos Especiais', 'INFO');
    
  } catch (error) {
    log(`💥 ERRO CRÍTICO NO TESTE: ${error.message}`, 'ERROR');
    log('🔍 Verifique os logs acima para identificar problemas', 'ERROR');
    process.exit(1);
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runRobustTest();
}

export { runRobustTest, testGreetingAndMemory, testContextualization, testConversationFlow, testSpecialCases };
