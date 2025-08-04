
// ========================================
// TESTE DA CONTEXTUALIZAÇÃO COMPLETA
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ClinicContextService from './src/services/clinicContextService.js';

dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function testContextualization() {
  console.log('🏥 Testando Contextualização Completa...\n');
  
  const testPhone = '+5547999999999';
  
  // Teste 1: Buscar clínica por número
  console.log('📝 Teste 1: Buscando clínica por número WhatsApp');
  try {
    const clinic = await ClinicContextService.getClinicByWhatsAppNumber(testPhone);
    
    if (clinic) {
      console.log('✅ Clínica encontrada:', clinic.name);
      console.log('📊 Dados da clínica:');
      console.log('- Especialidade:', clinic.specialty);
      console.log('- Médicos:', clinic.doctors?.length || 0);
      console.log('- Serviços:', clinic.services?.length || 0);
      console.log('- Contato:', clinic.contact?.phone);
    } else {
      console.log('❌ Clínica não encontrada');
    }
  } catch (error) {
    console.log('❌ Erro ao buscar clínica:', error.message);
  }
  
  // Teste 2: Gerar prompt contextualizado
  console.log('\n📝 Teste 2: Gerando prompt contextualizado');
  try {
    const clinic = await ClinicContextService.getClinicByWhatsAppNumber(testPhone);
    const systemPrompt = ClinicContextService.generateSystemPromptFromContext(clinic);
    
    console.log('✅ Prompt gerado com sucesso!');
    console.log('📊 Tamanho do prompt:', systemPrompt.length, 'caracteres');
    console.log('📋 Primeiros 200 caracteres:');
    console.log(systemPrompt.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Erro ao gerar prompt:', error.message);
  }
  
  // Teste 3: Testar com diferentes mensagens
  console.log('\n📝 Teste 3: Testando com diferentes mensagens');
  const testMessages = [
    'Olá!',
    'Me chamo Lucas',
    'Qual o meu nome?',
    'Quais são os horários de funcionamento?',
    'Quanto custa uma consulta?',
    'Quais médicos atendem hoje?'
  ];
  
  for (const message of testMessages) {
    console.log(`\n💬 Testando: "${message}"`);
    try {
      const clinic = await ClinicContextService.getClinicByWhatsAppNumber(testPhone);
      const systemPrompt = ClinicContextService.generateSystemPromptFromContext(clinic);
      
      console.log('✅ Prompt gerado para:', message);
      console.log('📊 Contexto incluído:', !!clinic);
    } catch (error) {
      console.log('❌ Erro no teste:', error.message);
    }
  }
  
  console.log('\n🎉 Teste da Contextualização Completa Concluído!');
}

// Executar teste
testContextualization().catch(console.error);
