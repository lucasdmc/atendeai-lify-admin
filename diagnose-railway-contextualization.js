// ========================================
// DIAGNÓSTICO DE CONTEXTUALIZAÇÃO RAILWAY
// ========================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv com caminho explícito
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Verificando variáveis de ambiente...');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function diagnoseRailwayContextualization() {
  console.log('🔍 DIAGNÓSTICO DE CONTEXTUALIZAÇÃO RAILWAY');
  console.log('==========================================\n');

  try {
    // 1. Verificar variáveis de ambiente
    console.log('📋 1. Verificando variáveis de ambiente...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'WHATSAPP_META_ACCESS_TOKEN',
      'WHATSAPP_META_PHONE_NUMBER_ID'
    ];

    const missingVars = [];
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      console.error('❌ Variáveis de ambiente ausentes:', missingVars);
      return;
    } else {
      console.log('✅ Todas as variáveis de ambiente estão configuradas');
    }

    // 2. Testar conectividade com Supabase
    console.log('\n📋 2. Testando conectividade com Supabase...');
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Erro na conexão com Supabase:', error.message);
      } else {
        console.log('✅ Conexão com Supabase funcionando');
        console.log(`   - Tabela clinics: ${data?.length || 0} registros encontrados`);
      }
    } catch (error) {
      console.error('❌ Erro crítico na conexão com Supabase:', error.message);
    }

    // 3. Testar ClinicContextService
    console.log('\n📋 3. Testando ClinicContextService...');
    try {
      const ClinicContextService = await import('./src/services/clinicContextService.js');
      const testPhoneNumber = '5511999999999';
      const clinic = await ClinicContextService.default.getClinicByWhatsAppNumber(testPhoneNumber);
      
      if (clinic) {
        console.log('✅ ClinicContextService funcionando');
        console.log(`   - Clínica: ${clinic.clinica?.informacoes_basicas?.nome || 'N/A'}`);
        console.log(`   - Profissionais: ${clinic.profissionais?.length || 0}`);
        console.log(`   - Serviços: ${clinic.servicos?.consultas?.length || 0} consultas, ${clinic.servicos?.exames?.length || 0} exames`);
      } else {
        console.error('❌ ClinicContextService não retornou dados da clínica');
      }
    } catch (error) {
      console.error('❌ Erro no ClinicContextService:', error.message);
    }

    // 4. Testar geração de prompt
    console.log('\n📋 4. Testando geração de prompt...');
    try {
      const ClinicContextService = await import('./src/services/clinicContextService.js');
      const testPhoneNumber = '5511999999999';
      const clinic = await ClinicContextService.default.getClinicByWhatsAppNumber(testPhoneNumber);
      const systemPrompt = ClinicContextService.default.generateSystemPromptFromContext(clinic);
      
      console.log('✅ Prompt gerado com sucesso');
      console.log(`   - Tamanho do prompt: ${systemPrompt.length} caracteres`);
      console.log(`   - Contém dados da clínica: ${systemPrompt.includes('CardioPrime') ? 'Sim' : 'Não'}`);
      console.log(`   - Contém informações de contato: ${systemPrompt.includes('Telefone:') ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.error('❌ Erro na geração de prompt:', error.message);
    }

    // 5. Testar LLMOrchestratorService
    console.log('\n📋 5. Testando LLMOrchestratorService...');
    try {
      const { LLMOrchestratorService } = await import('./src/services/ai/llmOrchestratorService.js');
      
      const testMessage = 'Olá, gostaria de saber sobre consultas de cardiologia';
      const testPhoneNumber = '5511999999999';
      
      const request = {
        phoneNumber: testPhoneNumber,
        message: testMessage,
        conversationId: `test-${Date.now()}`,
        userId: testPhoneNumber
      };

      const result = await LLMOrchestratorService.processMessage(request);

      if (result.response) {
        console.log('✅ LLMOrchestratorService funcionando');
        console.log(`   - Resposta gerada: ${result.response?.substring(0, 100)}...`);
        console.log(`   - Intent: ${result.intent?.name || 'N/A'}`);
        console.log(`   - Confidence: ${result.intent?.confidence || 'N/A'}`);
      } else {
        console.error('❌ LLMOrchestratorService falhou:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro no LLMOrchestratorService:', error.message);
    }

    // 6. Testar webhook completo
    console.log('\n📋 6. Testando webhook completo...');
    try {
      const testWebhookData = {
        object: "whatsapp_business_account",
        entry: [{
          id: "test",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "5511999999999",
                phone_number_id: "test"
              },
              contacts: [{
                profile: { name: "Test" },
                wa_id: "5511999999999"
              }],
              messages: [{
                from: "5511999999999",
                id: "test",
                timestamp: "1704067200",
                text: { body: "Olá, gostaria de saber sobre consultas de cardiologia" },
                type: "text"
              }]
            },
            field: "messages"
          }]
        }]
      };

      // Simular processamento do webhook
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      // Importar função do webhook
      const { processWhatsAppWebhookWithContext } = await import('./routes/webhook-contextualized.js');
      
      const result = await processWhatsAppWebhookWithContext(testWebhookData, whatsappConfig);
      
      if (result.success) {
        console.log('✅ Webhook processado com sucesso');
        console.log(`   - Mensagens processadas: ${result.processed?.length || 0}`);
      } else {
        console.error('❌ Erro no processamento do webhook:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro no teste do webhook:', error.message);
    }

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO');
    console.log('==========================');

  } catch (error) {
    console.error('💥 Erro crítico no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseRailwayContextualization(); 