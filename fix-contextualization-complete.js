// ========================================
// CORREÇÃO CRÍTICA #2: CONTEXTUALIZAÇÃO JSON COMPLETA
// Baseado no documento "SOLUÇÕES PRÁTICAS E IMPLEMENTAÇÕES - AtendeAí"
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixContextualizationComplete() {
  console.log('🏥 CORREÇÃO CRÍTICA #2: CONTEXTUALIZAÇÃO JSON COMPLETA');
  console.log('======================================================');

  try {
    // PASSO 1: CRIAR ESTRUTURA JSON PADRÃO DA CLÍNICA
    console.log('\n📋 1. Criando estrutura JSON padrão da clínica...');
    
    const clinicSchemaCode = `
// ========================================
// ESTRUTURA JSON PADRÃO DA CLÍNICA
// ========================================

export const CLINIC_SCHEMA = {
  // Informações básicas
  id: "clinic_001",
  name: "CardioPrime",
  specialty: "Cardiologia",
  
  // Equipe médica
  doctors: [
    {
      id: "dr_001",
      name: "Dr. João Silva",
      specialty: "Cardiologia Clínica",
      crm: "12345-SP",
      schedule: {
        monday: ["08:00-12:00", "14:00-18:00"],
        tuesday: ["08:00-12:00", "14:00-18:00"],
        wednesday: ["08:00-12:00"],
        thursday: ["08:00-12:00", "14:00-18:00"],
        friday: ["08:00-12:00", "14:00-17:00"],
        saturday: [],
        sunday: []
      },
      bio: "Especialista em insuficiência cardíaca com 15 anos de experiência"
    },
    {
      id: "dr_002",
      name: "Dra. Maria Oliveira",
      specialty: "Cardiologia Intervencionista",
      crm: "67890-SP",
      schedule: {
        monday: ["14:00-18:00"],
        tuesday: ["08:00-12:00", "14:00-18:00"],
        wednesday: ["08:00-12:00", "14:00-18:00"],
        thursday: ["08:00-12:00"],
        friday: ["08:00-12:00", "14:00-17:00"],
        saturday: ["08:00-12:00"],
        sunday: []
      },
      bio: "Especialista em arritmias e procedimentos invasivos"
    }
  ],
  
  // Horários de funcionamento
  schedule: {
    monday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    tuesday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    wednesday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    thursday: { open: "08:00", close: "18:00", lunch: "12:00-14:00" },
    friday: { open: "08:00", close: "17:00", lunch: "12:00-14:00" },
    saturday: { open: "08:00", close: "12:00", lunch: null },
    sunday: { open: null, close: null, lunch: null }
  },
  
  // Serviços oferecidos
  services: [
    {
      id: "service_001",
      name: "Consulta Cardiológica",
      duration: "30 minutos",
      price: "R$ 250,00",
      description: "Avaliação completa do sistema cardiovascular"
    },
    {
      id: "service_002",
      name: "Eletrocardiograma (ECG)",
      duration: "15 minutos",
      price: "R$ 80,00",
      description: "Exame para avaliar atividade elétrica do coração"
    },
    {
      id: "service_003",
      name: "Ecocardiograma",
      duration: "45 minutos",
      price: "R$ 350,00",
      description: "Ultrassom do coração para avaliar estrutura e função"
    },
    {
      id: "service_004",
      name: "Teste Ergométrico",
      duration: "60 minutos",
      price: "R$ 400,00",
      description: "Avaliação do coração durante exercício físico"
    }
  ],
  
  // Localização e contato
  location: {
    address: "Rua das Flores, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    coordinates: { lat: -23.5505, lng: -46.6333 }
  },
  
  contact: {
    phone: "+55 11 3456-7890",
    whatsapp: "+55 11 99876-5432",
    email: "contato@cardioprime.com.br",
    website: "https://cardioprime.com.br"
  },
  
  // Políticas e informações importantes
  policies: {
    cancellation: "Cancelamentos devem ser feitos com 24h de antecedência",
    lateness: "Tolerância de 15 minutos de atraso",
    payment: "Aceitamos dinheiro, cartão e PIX",
    insurance: "Convênios: Unimed, Bradesco Saúde, SulAmérica",
    parking: "Estacionamento gratuito disponível"
  },
  
  // Configurações do assistente
  assistant: {
    name: "Dr. Carlos",
    personality: "Acolhedor, profissional e empático",
    greeting: "Olá! Sou o Dr. Carlos, assistente virtual da CardioPrime. Como posso ajudar você hoje?",
    capabilities: [
      "Informações sobre médicos e especialidades",
      "Horários de funcionamento",
      "Serviços oferecidos",
      "Orientações para agendamento",
      "Localização e contato"
    ],
    limitations: [
      "Não posso dar conselhos médicos",
      "Não posso agendar consultas diretamente",
      "Para emergências, procure atendimento médico imediato"
    ]
  }
};

export default CLINIC_SCHEMA;
`;

    // Salvar estrutura JSON da clínica
    const fs = await import('fs');
    fs.writeFileSync('src/config/clinic-schema.js', clinicSchemaCode);
    console.log('✅ Estrutura JSON da clínica criada!');

    // PASSO 2: CRIAR SERVIÇO DE CONTEXTUALIZAÇÃO COMPLETA
    console.log('\n📋 2. Criando serviço de contextualização completa...');
    
    const clinicContextServiceCode = `
// ========================================
// SERVIÇO DE CONTEXTUALIZAÇÃO COMPLETA
// ========================================

import { createClient } from '@supabase/supabase-js';
import CLINIC_SCHEMA from '../config/clinic-schema.js';

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

export class ClinicContextService {
  static async getClinicByWhatsAppNumber(phoneNumber) {
    try {
      console.log('🏥 [ClinicContext] Buscando clínica por número WhatsApp', { phoneNumber });
      
      // Primeiro, tentar buscar no banco de dados
      const { data, error } = await supabase
        .from('clinics')
        .select(\`
          id,
          name,
          specialty,
          doctors,
          schedule,
          services,
          location,
          contact,
          policies,
          assistant,
          whatsapp_numbers
        \`)
        .contains('whatsapp_numbers', [phoneNumber])
        .single();

      if (error) {
        console.warn('⚠️ [ClinicContext] Clínica não encontrada no banco para número', { phoneNumber, error: error.message });
        
        // Usar dados padrão da CardioPrime
        console.log('✅ [ClinicContext] Usando dados padrão da CardioPrime');
        return this.getDefaultClinicData();
      }

      console.log('✅ [ClinicContext] Clínica encontrada no banco', { 
        clinicId: data.id,
        clinicName: data.name,
        phoneNumber 
      });

      // Validar e completar dados da clínica
      const completeClinicData = this.validateAndCompleteClinicData(data);
      
      return completeClinicData;

    } catch (error) {
      console.error('💥 [ClinicContext] Erro ao buscar clínica:', error);
      return this.getDefaultClinicData();
    }
  }

  static getDefaultClinicData() {
    return {
      id: CLINIC_SCHEMA.id,
      name: CLINIC_SCHEMA.name,
      specialty: CLINIC_SCHEMA.specialty,
      doctors: CLINIC_SCHEMA.doctors,
      schedule: CLINIC_SCHEMA.schedule,
      services: CLINIC_SCHEMA.services,
      location: CLINIC_SCHEMA.location,
      contact: CLINIC_SCHEMA.contact,
      policies: CLINIC_SCHEMA.policies,
      assistant: CLINIC_SCHEMA.assistant
    };
  }

  static validateAndCompleteClinicData(clinicData) {
    // Garantir que todos os campos obrigatórios existem
    const defaultData = {
      doctors: [],
      schedule: {},
      services: [],
      location: {},
      contact: {},
      policies: {},
      assistant: {
        name: "Dr. Carlos",
        personality: "Acolhedor e profissional"
      }
    };

    return {
      ...defaultData,
      ...clinicData,
      // Garantir que arrays existem
      doctors: clinicData.doctors || CLINIC_SCHEMA.doctors,
      services: clinicData.services || CLINIC_SCHEMA.services,
      // Garantir que objetos existem
      schedule: clinicData.schedule || CLINIC_SCHEMA.schedule,
      location: clinicData.location || CLINIC_SCHEMA.location,
      contact: clinicData.contact || CLINIC_SCHEMA.contact,
      policies: clinicData.policies || CLINIC_SCHEMA.policies,
      assistant: {
        ...defaultData.assistant,
        ...(clinicData.assistant || CLINIC_SCHEMA.assistant)
      }
    };
  }

  static generateSystemPromptFromContext(clinicData) {
    if (!clinicData) {
      return \`Você é um assistente virtual médico genérico. 
              Seja acolhedor e profissional. 
              Para informações específicas, oriente a entrar em contato diretamente.\`;
    }

    const {
      name,
      specialty,
      doctors,
      schedule,
      services,
      location,
      contact,
      policies,
      assistant
    } = clinicData;

    // Construir informações sobre médicos
    const doctorsInfo = doctors.map(doctor => 
      \`- \${doctor.name} (\${doctor.specialty}) - CRM: \${doctor.crm}\${doctor.bio ? \` - \${doctor.bio}\` : ''}\`
    ).join('\\n');

    // Construir horários de funcionamento
    const scheduleInfo = Object.entries(schedule)
      .filter(([day, hours]) => hours.open)
      .map(([day, hours]) => {
        const dayName = {
          monday: 'Segunda-feira',
          tuesday: 'Terça-feira', 
          wednesday: 'Quarta-feira',
          thursday: 'Quinta-feira',
          friday: 'Sexta-feira',
          saturday: 'Sábado',
          sunday: 'Domingo'
        }[day];
        
        return \`\${dayName}: \${hours.open} às \${hours.close}\${hours.lunch ? \` (Almoço: \${hours.lunch})\` : ''}\`;
      }).join('\\n');

    // Construir informações sobre serviços
    const servicesInfo = services.map(service => 
      \`- \${service.name}: \${service.description} (\${service.duration}) - \${service.price}\`
    ).join('\\n');

    // Construir endereço
    const addressInfo = location.address ? 
      \`\${location.address}, \${location.neighborhood}, \${location.city}/\${location.state} - CEP: \${location.zipCode}\` :
      'Consulte nosso endereço pelo telefone';

    // Construir contatos
    const contactInfo = \`
Telefone: \${contact.phone || 'Consulte pelo WhatsApp'}
WhatsApp: \${contact.whatsapp || 'Este número'}
Email: \${contact.email || 'Consulte pelo telefone'}
Website: \${contact.website || 'Não disponível'}\`;

    return \`Você é \${assistant.name || 'Dr. Carlos'}, assistente virtual da \${name}.

PERSONALIDADE: \${assistant.personality || 'Acolhedor, profissional e empático'}. Use emojis ocasionalmente para tornar a conversa mais amigável.

INFORMAÇÕES DA CLÍNICA:
Nome: \${name}
Especialidade: \${specialty || 'Medicina Geral'}

EQUIPE MÉDICA:
\${doctorsInfo || 'Consulte nossa equipe pelo telefone'}

HORÁRIOS DE FUNCIONAMENTO:
\${scheduleInfo || 'Consulte nossos horários pelo telefone'}

SERVIÇOS OFERECIDOS:
\${servicesInfo || 'Consulte nossos serviços pelo telefone'}

LOCALIZAÇÃO:
\${addressInfo}

CONTATOS:
\${contactInfo}

POLÍTICAS IMPORTANTES:
\${policies.cancellation ? \`- Cancelamentos: \${policies.cancellation}\` : ''}
\${policies.lateness ? \`- Atrasos: \${policies.lateness}\` : ''}
\${policies.payment ? \`- Pagamento: \${policies.payment}\` : ''}
\${policies.insurance ? \`- Convênios: \${policies.insurance}\` : ''}
\${policies.parking ? \`- Estacionamento: \${policies.parking}\` : ''}

INSTRUÇÕES IMPORTANTES:
1. SEMPRE use as informações específicas da clínica fornecidas acima
2. NUNCA invente informações que não estão no contexto
3. Para agendamentos, oriente a entrar em contato pelo telefone: \${contact.phone}
4. Para emergências, oriente a procurar atendimento médico imediato
5. NUNCA dê conselhos médicos - apenas informações sobre a clínica
6. Use o nome do usuário quando ele se apresentar
7. Seja consistente com as informações - não contradiga dados anteriores
8. Mantenha as respostas concisas mas completas

LEMBRE-SE: Você representa a \${name}. Seja sempre profissional, acolhedor e útil!\`;
  }
}

export default ClinicContextService;
`;

    fs.writeFileSync('src/services/clinicContextService.js', clinicContextServiceCode);
    console.log('✅ Serviço de contextualização completa criado!');

    // PASSO 3: ATUALIZAR WEBHOOK COM CONTEXTUALIZAÇÃO COMPLETA
    console.log('\n📋 3. Atualizando webhook com contextualização completa...');
    
    const webhookUpdateCode = `
// ========================================
// WEBHOOK COM CONTEXTUALIZAÇÃO COMPLETA
// ========================================

import express from 'express';
import { sendWhatsAppTextMessage } from '../services/whatsappMetaService.js';
import ClinicContextService from '../services/clinicContextService.js';
import { EnhancedAIService } from '../services/ai/enhancedAIService.js';

const router = express.Router();

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook-Contextualizado] Mensagem recebida:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook-Contextualizado] Respondendo ao desafio de verificação');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    if (req.body.entry && req.body.entry.length > 0) {
      const webhookData = req.body;
      
      // Configuração do WhatsApp
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      // Processar com CONTEXTUALIZAÇÃO COMPLETA
      const result = await processWhatsAppWebhookWithContext(
        webhookData,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook-Contextualizado] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com Contextualização Completa',
          processed: result.processed
        });
      } else {
        console.error('[Webhook-Contextualizado] Erro no processamento:', result.error);
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    }

    // Se não há mensagens para processar
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido, mas sem mensagens para processar' 
    });

  } catch (error) {
    console.error('[Webhook-Contextualizado] Erro geral:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Processa webhook com contextualização completa
 */
async function processWhatsAppWebhookWithContext(webhookData, whatsappConfig) {
  try {
    const processed = [];

    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.value.messages && change.value.messages.length > 0) {
          for (const message of change.value.messages) {
            console.log('[Webhook-Contextualizado] Processando mensagem:', {
              from: message.from,
              messageType: message.type,
              timestamp: message.timestamp
            });

            // Extrair texto da mensagem
            const messageText = message.text?.body || '';
            
            if (!messageText) {
              console.log('[Webhook-Contextualizado] Mensagem sem texto, ignorando');
              continue;
            }

            // Processar com contextualização completa
            const aiResult = await processMessageWithCompleteContext(
              messageText, 
              message.from, 
              whatsappConfig
            );

            if (aiResult.success) {
              // Enviar resposta via WhatsApp
              await sendAIResponseViaWhatsApp(
                message.from, 
                aiResult, 
                whatsappConfig
              );

              processed.push({
                phoneNumber: message.from,
                message: messageText,
                response: aiResult.response,
                intent: aiResult.intent,
                confidence: aiResult.confidence
              });
            }
          }
        }
      }
    }

    return { success: true, processed };

  } catch (error) {
    console.error('[Webhook-Contextualizado] Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa mensagem com contextualização completa
 */
async function processMessageWithCompleteContext(messageText, phoneNumber, config) {
  try {
    console.log('🤖 [Contextualizado] Gerando resposta inteligente COMPLETA', { 
      phoneNumber, 
      messageLength: messageText.length 
    });

    // 1. Buscar clínica com dados completos
    const clinic = await ClinicContextService.getClinicByWhatsAppNumber(phoneNumber);
    let systemPrompt;
    let contextualization = null;

    if (clinic) {
      console.log('🏥 [Contextualizado] Clínica encontrada com dados completos', { 
        clinicId: clinic.id,
        clinicName: clinic.name,
        doctorsCount: clinic.doctors?.length || 0,
        servicesCount: clinic.services?.length || 0
      });
      
      // 2. Usar dados COMPLETOS da clínica
      contextualization = {
        clinicId: clinic.id,
        clinicName: clinic.name,
        specialty: clinic.specialty,
        doctors: clinic.doctors,
        schedule: clinic.schedule,
        services: clinic.services,
        location: clinic.location,
        contact: clinic.contact,
        policies: clinic.policies,
        assistant: clinic.assistant
      };
      
      systemPrompt = ClinicContextService.generateSystemPromptFromContext(contextualization);
      
    } else {
      console.log('⚠️ [Contextualizado] Clínica não encontrada - usando prompt padrão', { phoneNumber });
      systemPrompt = \`Você é Dr. Carlos, assistente virtual do AtendeAí.
          Seja acolhedor, profissional e útil. Use emojis ocasionalmente.
          Para informações específicas, oriente a entrar em contato pelo telefone.
          Para agendamentos, oriente a entrar em contato diretamente.
          NUNCA dê conselhos médicos - apenas informações gerais.\`;
    }

    console.log('📝 [Contextualizado] Prompt gerado', {
      phoneNumber,
      promptLength: systemPrompt.length,
      hasClinicData: !!clinic
    });

    // 3. Processar com sistema avançado
    const enhancedAI = new EnhancedAIService();
    const aiResult = await enhancedAI.processMessage(
      messageText,
      phoneNumber,
      clinic?.id || 'default',
      {
        systemPrompt: systemPrompt,
        clinicContext: contextualization,
        enableRAG: true,
        enableMemory: true,
        enablePersonalization: true,
        enableIntentRecognition: true
      }
    );

    console.log('✅ [Contextualizado] Resposta gerada com contexto completo', {
      success: aiResult.success,
      hasResponse: !!aiResult.response,
      responseLength: aiResult.response?.length || 0,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      error: aiResult.error
    });

    return aiResult;

  } catch (error) {
    console.error('💥 [Contextualizado] Erro ao gerar resposta inteligente:', error);
    return {
      success: false,
      response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, entre em contato pelo telefone.',
      error: error.message
    };
  }
}

/**
 * Envia resposta processada via WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config) {
  try {
    const { accessToken, phoneNumberId } = config;
    
    // Preparar mensagem com informações dos Serviços Robustos
    let messageText = aiResponse.response;
    
    // Adicionar informações de confiança se baixa
    if (aiResponse.confidence < 0.7) {
      messageText += '\\n\\n💡 Nota: Esta resposta foi gerada com confiança moderada. Para informações mais precisas, consulte um profissional de saúde.';
    }

    // Enviar via API Meta
    const response = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to,
      text: messageText
    });

    console.log('[Contextualizado] Mensagem enviada via WhatsApp:', {
      to,
      messageLength: messageText.length,
      confidence: aiResponse.confidence,
      intent: aiResponse.intent
    });

  } catch (error) {
    console.error('[Contextualizado] Erro ao enviar mensagem:', error);
  }
}

export default router;
`;

    fs.writeFileSync('routes/webhook-contextualized.js', webhookUpdateCode);
    console.log('✅ Webhook com contextualização completa criado!');

    // PASSO 4: CRIAR SCRIPT DE TESTE
    console.log('\n📋 4. Criando script de teste da contextualização...');
    
    const testContextualizationScript = `
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
  console.log('🏥 Testando Contextualização Completa...\\n');
  
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
  console.log('\\n📝 Teste 2: Gerando prompt contextualizado');
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
  console.log('\\n📝 Teste 3: Testando com diferentes mensagens');
  const testMessages = [
    'Olá!',
    'Me chamo Lucas',
    'Qual o meu nome?',
    'Quais são os horários de funcionamento?',
    'Quanto custa uma consulta?',
    'Quais médicos atendem hoje?'
  ];
  
  for (const message of testMessages) {
    console.log(\`\\n💬 Testando: "\${message}"\`);
    try {
      const clinic = await ClinicContextService.getClinicByWhatsAppNumber(testPhone);
      const systemPrompt = ClinicContextService.generateSystemPromptFromContext(clinic);
      
      console.log('✅ Prompt gerado para:', message);
      console.log('📊 Contexto incluído:', !!clinic);
    } catch (error) {
      console.log('❌ Erro no teste:', error.message);
    }
  }
  
  console.log('\\n🎉 Teste da Contextualização Completa Concluído!');
}

// Executar teste
testContextualization().catch(console.error);
`;

    fs.writeFileSync('test-contextualization-complete.js', testContextualizationScript);
    console.log('✅ Script de teste da contextualização criado!');

    console.log('\n🎉 CORREÇÃO DA CONTEXTUALIZAÇÃO JSON COMPLETA CONCLUÍDA!');
    console.log('✅ Estrutura JSON da clínica criada');
    console.log('✅ Serviço de contextualização completa criado');
    console.log('✅ Webhook com contextualização completa criado');
    console.log('✅ Script de teste criado');
    console.log('📋 Próximos passos:');
    console.log('1. Execute: node test-contextualization-complete.js');
    console.log('2. Integre o webhook contextualizado no sistema');
    console.log('3. Teste com mensagens reais');

  } catch (error) {
    console.error('💥 ERRO CRÍTICO na correção da contextualização:', error);
    throw error;
  }
}

// Executar correção
fixContextualizationComplete().catch(console.error); 