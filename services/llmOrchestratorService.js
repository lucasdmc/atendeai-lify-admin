// src/services/ai/llmOrchestratorService.js
// Versão JavaScript para compatibilidade com Node.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMOrchestratorService {
  static async processMessage(request) {
    try {
      console.log('🤖 LLMOrchestrator processing:', request);

      const { phoneNumber, message, conversationId, userId } = request;

      // Sistema de memória simples
      const memory = await this.loadConversationMemory(phoneNumber);
      
      // Extrair nome do usuário se presente na mensagem
      const extractedName = this.extractUserName(message);
      if (extractedName && !memory.userProfile?.name) {
        memory.userProfile = memory.userProfile || {};
        memory.userProfile.name = extractedName;
        console.log(`👤 Nome extraído e salvo: ${extractedName}`);
        
        // Salvar nome na tabela conversation_memory
        await this.saveUserName(phoneNumber, extractedName);
      }
      
      // Buscar contexto da clínica (contextualização dinâmica)
      const clinicContext = await this.getClinicContext(phoneNumber);
      
      // Detectar intenção avançada com histórico e contexto
      const conversationHistory = memory.history || [];
      const intent = await this.detectIntent(message, conversationHistory, clinicContext);
      
      // Verificar se é primeira conversa do dia
      const isFirstConversationOfDay = await this.isFirstConversationOfDay(phoneNumber);
      console.log('📅 Primeira conversa do dia:', isFirstConversationOfDay);
      
      // Verificar horário de funcionamento
      const isWithinBusinessHours = this.isWithinBusinessHours(clinicContext);
      console.log('🕒 Dentro do horário de funcionamento:', isWithinBusinessHours);
      
      // Preparar prompt do sistema com perfil do usuário
      const systemPrompt = this.prepareSystemPrompt(clinicContext, memory.userProfile);
      
      // Construir mensagens para o LLM
      const messages = this.buildMessages(systemPrompt, memory, message);
      
      // Chamar OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      let response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

      // Aplicar lógica de saudação e horário
      response = await this.applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, memory.userProfile);

      // Salvar na memória
      await this.saveConversationMemory(phoneNumber, message, response, intent);

      return {
        response: response,
        intent: intent,
        toolsUsed: [],
        metadata: {
          confidence: intent.confidence,
          modelUsed: 'gpt-4o',
          memoryUsed: true,
          userProfile: memory.userProfile || { name: 'Usuário' },
          conversationContext: { 
            lastIntent: intent.name,
            isFirstConversationOfDay: isFirstConversationOfDay,
            isWithinBusinessHours: isWithinBusinessHours
          }
        }
      };

    } catch (error) {
      console.error('❌ LLMOrchestrator error:', error);
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes.',
        intent: {
          name: 'ERROR',
          confidence: 0,
          entities: {},
          requiresAction: false,
          category: 'support'
        },
        toolsUsed: [],
        metadata: {
          confidence: 0,
          modelUsed: 'fallback',
          error: error.message
        }
      };
    }
  }

  /**
   * Extrai nome do usuário da mensagem
   */
  static extractUserName(message) {
    const namePatterns = [
      /me chamo ([^,\.!?]+)/i,
      /meu nome é ([^,\.!?]+)/i,
      /sou o ([^,\.!?]+)/i,
      /sou a ([^,\.!?]+)/i,
      /eu sou ([^,\.!?]+)/i,
      /chamo-me ([^,\.!?]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        const name = match[1].trim();
        // Verificar se o nome não é muito longo (provavelmente pegou texto extra)
        if (name.length <= 50 && !name.includes('tudo bem') && !name.includes('qual')) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Salva o nome do usuário na tabela conversation_memory
   */
  static async saveUserName(phoneNumber, name) {
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          user_name: JSON.stringify({
            name: name,
            extracted_at: new Date().toISOString()
          }),
          last_interaction: new Date().toISOString()
        }, { onConflict: 'phone_number' });

      if (error) {
        console.error('❌ Erro ao salvar nome:', error);
      } else {
        console.log(`✅ Nome salvo para ${phoneNumber}: ${name}`);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao salvar nome:', error);
    }
  }

  static async loadConversationMemory(phoneNumber) {
    try {
      console.log('🔍 Carregando memória para:', phoneNumber);
      
      const { data } = await supabase
        .from('conversation_memory')
        .select('memory_data, user_name')
        .eq('phone_number', phoneNumber)
        .single();

      console.log('✅ Memória carregada:', data ? 'encontrada' : 'não encontrada');
      
      let userProfile = {};
      
      // Extrair nome do usuário (lidar com string JSON)
      if (data?.user_name) {
        try {
          // Se user_name é uma string JSON, fazer parse
          if (typeof data.user_name === 'string') {
            // Verificar se é JSON válido
            if (data.user_name.startsWith('{') && data.user_name.endsWith('}')) {
              const parsedUserName = JSON.parse(data.user_name);
              userProfile.name = parsedUserName.name;
            } else {
              // Se não é JSON, usar como nome direto
              userProfile.name = data.user_name;
            }
          } else if (data.user_name.name) {
            // Se já é um objeto
            userProfile.name = data.user_name.name;
          }
        } catch (error) {
          console.error('Error parsing user_name:', error);
          // Se falhar o parse, usar como string direta
          userProfile.name = data.user_name;
        }
      }
      
      if (data?.memory_data) {
        console.log('  - Histórico:', data.memory_data.history?.length || 0, 'mensagens');
        console.log('  - UserProfile:', userProfile.name || 'sem nome');
        
        // Mesclar com dados existentes da memória
        if (data.memory_data.userProfile) {
          userProfile = { ...data.memory_data.userProfile, ...userProfile };
        }
      }

      return {
        ...data?.memory_data,
        userProfile: userProfile
      } || { history: [], userProfile: userProfile };
    } catch (error) {
      console.log('❌ Erro ao carregar memória para:', phoneNumber, error.message);
      return { history: [], userProfile: {} };
    }
  }

  static async saveConversationMemory(phoneNumber, userMessage, botResponse, intent) {
    try {
      const { data: existingMemory } = await supabase
        .from('conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      const memoryData = existingMemory?.memory_data || { history: [], userProfile: {} };
      
      // Garantir que history existe
      if (!memoryData.history) {
        memoryData.history = [];
      }
      
      // Adicionar nova interação
      memoryData.history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });
      
      memoryData.history.push({
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toISOString()
      });

      // Manter apenas últimas 10 interações
      if (memoryData.history.length > 10) {
        memoryData.history = memoryData.history.slice(-10);
      }

      // Upsert na tabela
      await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: memoryData,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  static async detectIntent(message, conversationHistory = [], clinicContext = {}) {
    try {
      console.log('🎯 [LLMOrchestrator] Detectando intenção avançada:', { 
        messageLength: message.length,
        historyLength: conversationHistory.length,
        hasClinicContext: !!clinicContext
      });

      const prompt = `You are an intent recognition system for a medical clinic's WhatsApp chatbot.
Analyze the user message and conversation history to identify the intent.

Available intents:
- APPOINTMENT_CREATE: User wants to schedule an appointment
- APPOINTMENT_RESCHEDULE: User wants to change an existing appointment
- APPOINTMENT_CANCEL: User wants to cancel an appointment
- APPOINTMENT_LIST: User wants to see their appointments
- INFO_HOURS: Asking about clinic hours
- INFO_LOCATION: Asking about clinic address/location
- INFO_SERVICES: Asking about available services/specialties
- INFO_DOCTORS: Asking about doctors/professionals
- INFO_PRICES: Asking about prices/insurance
- INFO_GENERAL: General information questions
- GREETING: Greeting messages
- FAREWELL: Goodbye messages
- HUMAN_HANDOFF: User wants to speak with a human
- UNCLEAR: Intent is not clear

Extract entities like: dates, times, doctor names, services, symptoms, etc.

Current message: "${message}"

Conversation history:
${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}

Clinic context:
- Services: ${JSON.stringify(clinicContext.services || [])}
- Doctors: ${JSON.stringify(clinicContext.professionals || [])}

Return a JSON with: { "intent": "INTENT_NAME", "confidence": 0.0-1.0, "entities": {}, "reasoning": "brief explanation" }`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      console.log('🤖 [LLMOrchestrator] Resposta do LLM:', response);

      let intentData;
      try {
        // Limpar a resposta removendo markdown e extraindo apenas o JSON
        let cleanResponse = response;
        
        // Remover ```json e ``` se presentes
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Se ainda não for JSON válido, tentar extrair JSON do texto
        if (!cleanResponse.trim().startsWith('{')) {
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
          }
        }
        
        intentData = JSON.parse(cleanResponse.trim());
      } catch (parseError) {
        console.error('❌ [LLMOrchestrator] Erro ao fazer parse da resposta:', parseError);
        console.error('❌ [LLMOrchestrator] Resposta original:', response);
        return this.fallbackIntentRecognition(message);
      }

      console.log('✅ [LLMOrchestrator] Intenção detectada:', {
        intent: intentData.intent,
        confidence: intentData.confidence,
        entities: intentData.entities,
        reasoning: intentData.reasoning
      });

      return {
        name: intentData.intent,
        confidence: intentData.confidence || 0.8,
        entities: intentData.entities || {},
        requiresAction: this.isAppointmentIntent(intentData.intent),
        category: this.mapIntentToCategory(intentData.intent)
      };

    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro na detecção de intenção:', error);
      return this.fallbackIntentRecognition(message);
    }
  }

  static fallbackIntentRecognition(message) {
    console.log('🔄 [LLMOrchestrator] Usando fallback para detecção de intenção');
    
    const lowerMessage = message.toLowerCase();
    
    // Detecção por palavras-chave
    if (this.containsAppointmentKeywords(lowerMessage)) {
      return {
        name: 'APPOINTMENT_CREATE',
        confidence: 0.6,
        entities: {},
        requiresAction: true,
        category: 'appointment'
      };
    }
    
    if (this.containsInfoKeywords(lowerMessage)) {
      return {
        name: 'INFO_GENERAL',
        confidence: 0.6,
        entities: {},
        requiresAction: false,
        category: 'information'
      };
    }
    
    if (this.containsGreetingKeywords(lowerMessage)) {
      return {
        name: 'GREETING',
        confidence: 0.8,
        entities: {},
        requiresAction: false,
        category: 'conversation'
      };
    }
    
    return {
      name: 'UNCLEAR',
      confidence: 0.3,
      entities: {},
      requiresAction: false,
      category: 'conversation'
    };
  }

  static containsAppointmentKeywords(message) {
    const keywords = [
      'agendar', 'agendamento', 'consulta', 'marcar',
      'remarcar', 'reagendar', 'cancelar', 'desmarcar',
      'horário', 'disponibilidade', 'agenda'
    ];
    return keywords.some(k => message.includes(k));
  }

  static containsInfoKeywords(message) {
    const keywords = [
      'endereço', 'localização', 'onde fica', 'como chegar',
      'horário', 'funciona', 'abre', 'fecha',
      'preço', 'valor', 'quanto custa', 'convênio',
      'médico', 'doutor', 'especialista', 'atende'
    ];
    return keywords.some(k => message.includes(k));
  }

  static containsGreetingKeywords(message) {
    const keywords = [
      'oi', 'olá', 'bom dia', 'boa tarde', 'boa noite',
      'hello', 'hi', 'hey'
    ];
    return keywords.some(k => message.includes(k));
  }

  static isAppointmentIntent(intentName) {
    return intentName && intentName.startsWith('APPOINTMENT_');
  }

  static mapIntentToCategory(intentName) {
    if (intentName && intentName.startsWith('APPOINTMENT_')) return 'appointment';
    if (intentName && intentName.startsWith('INFO_')) return 'information';
    if (['GREETING', 'FAREWELL', 'UNCLEAR'].includes(intentName)) return 'conversation';
    if (intentName === 'HUMAN_HANDOFF') return 'support';
    return 'conversation';
  }



  static async getClinicContext(phoneNumber = null) {
    try {
      console.log(`🏥 [LLMOrchestrator] Buscando contextualização para: ${phoneNumber || 'sem telefone'}`);
      
      let data;
      
      if (phoneNumber) {
        // ✅ BUSCA DINÂMICA - Buscar clínica específica pelo telefone
        console.log(`🔍 [LLMOrchestrator] Buscando clínica por WhatsApp: ${phoneNumber}`);
        
        // Tentar buscar com e sem o '+' para compatibilidade
        let clinicData, error;
        
        // Primeira tentativa: buscar exatamente como fornecido
        const result1 = await supabase
          .from('clinics')
          .select('*')
          .eq('whatsapp_phone', phoneNumber)
          .single();
        
        if (result1.error) {
          // Segunda tentativa: adicionar '+' se não tiver
          const phoneWithPlus = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
          const result2 = await supabase
            .from('clinics')
            .select('*')
            .eq('whatsapp_phone', phoneWithPlus)
            .single();
          
          if (result2.error) {
            // Terceira tentativa: remover '+' se tiver
            const phoneWithoutPlus = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
            const result3 = await supabase
              .from('clinics')
              .select('*')
              .eq('whatsapp_phone', phoneWithoutPlus)
              .single();
            
            clinicData = result3.data;
            error = result3.error;
          } else {
            clinicData = result2.data;
            error = result2.error;
          }
        } else {
          clinicData = result1.data;
          error = result1.error;
        }

        if (error) {
          console.log(`⚠️ [LLMOrchestrator] Clínica não encontrada para WhatsApp: ${phoneNumber}`);
          // Fallback para busca genérica
          const { data: fallbackData } = await supabase
            .from('clinics')
            .select('*')
            .eq('has_contextualization', true)
            .single();
          data = fallbackData;
        } else {
          data = clinicData;
        }
      } else {
        // Fallback para busca genérica (compatibilidade)
        console.log('⚠️ [LLMOrchestrator] Sem telefone fornecido, usando busca genérica');
        const { data: fallbackData } = await supabase
          .from('clinics')
          .select('*')
          .eq('has_contextualization', true)
          .single();
        data = fallbackData;
      }

      if (!data || !data.contextualization_json) {
        console.log('⚠️ [LLMOrchestrator] Clínica sem contextualização JSON');
        return {
          name: data?.name || 'Clínica Médica',
          address: '',
          phone: '',
          services: []
        };
      }

      const context = data.contextualization_json;
      console.log('📋 [LLMOrchestrator] Contextualização encontrada:', Object.keys(context));

      // Extrair informações básicas da clínica
      const clinica = context.clinica || {};
      const localizacao = clinica.localizacao || {};
      const contatos = clinica.contatos || {};
      const servicos = context.servicos || {};
      const profissionais = context.profissionais || [];

      // Construir endereço completo
      let enderecoCompleto = '';
      if (localizacao.endereco_principal) {
        const end = localizacao.endereco_principal;
        enderecoCompleto = `${end.logradouro || ''}, ${end.numero || ''}${end.complemento ? ` - ${end.complemento}` : ''}, ${end.bairro || ''}, ${end.cidade || ''} - ${end.estado || ''}, CEP: ${end.cep || ''}`.trim();
      }

      // Extrair telefone principal
      const telefone = contatos.telefone_principal || contatos.whatsapp || '';

      // Extrair serviços
      const servicosList = [];
      if (servicos.consultas) {
        servicosList.push(...servicos.consultas.map(s => s.nome));
      }
      if (servicos.exames) {
        servicosList.push(...servicos.exames.map(s => s.nome));
      }

      // Extrair profissionais
      const profissionaisList = profissionais.map(p => p.nome_completo);

      console.log('✅ [LLMOrchestrator] Dados extraídos:', {
        nome: clinica.informacoes_basicas?.nome || data.name,
        endereco: enderecoCompleto,
        telefone: telefone,
        servicos: servicosList.length,
        profissionais: profissionaisList.length,
        whatsapp_phone: data.whatsapp_phone
      });

      return {
        name: clinica.informacoes_basicas?.nome || data.name || 'Clínica Médica',
        address: enderecoCompleto,
        phone: telefone,
        services: servicosList,
        professionals: profissionaisList,
        specialties: clinica.informacoes_basicas?.especialidades_secundarias || [],
        description: clinica.informacoes_basicas?.descricao || '',
        mission: clinica.informacoes_basicas?.missao || '',
        values: clinica.informacoes_basicas?.valores || [],
        differentiators: clinica.informacoes_basicas?.diferenciais || [],
        workingHours: clinica.horario_funcionamento || {},
        paymentMethods: context.formas_pagamento || {},
        insurance: context.convenios || [],
        insuranceDetails: context.convenios || [],
        emails: contatos.emails_departamentos || {},
        website: contatos.website || '',
        mainEmail: contatos.email_principal || '',
        bookingPolicies: context.politicas?.agendamento || {},
        servicePolicies: context.politicas?.atendimento || {},
        additionalInfo: context.informacoes_adicionais || {},
        professionalsDetails: context.profissionais || [],
        servicesDetails: context.servicos || {},
        agentConfig: context.agente_ia?.configuracao || {},
        agentBehavior: context.agente_ia?.comportamento || {},
        agentRestrictions: context.agente_ia?.restricoes || {}
      };
    } catch (error) {
      console.error('❌ [LLMOrchestrator] Erro ao obter contexto da clínica:', error);
      return {
        name: 'Clínica Médica',
        address: '',
        phone: '',
        services: []
      };
    }
  }

  static prepareSystemPrompt(clinicContext, userProfile = null) {
    // Configurações do agente IA do JSON
    const agentConfig = clinicContext.agentConfig || {};
    const agentBehavior = clinicContext.agentBehavior || {};
    const agentRestrictions = clinicContext.agentRestrictions || {};
    
    // Nome do agente (padrão ou do JSON)
    const agentName = agentConfig.nome || 'Assistente Virtual';
    
    // Personalidade do agente (padrão ou do JSON)
    const agentPersonality = agentConfig.personalidade || 'profissional, empática e prestativa';
    
    // Tom de comunicação (padrão ou do JSON)
    const communicationTone = agentConfig.tom_comunicacao || 'Formal mas acessível';
    
    // Nível de formalidade (padrão ou do JSON)
    const formalityLevel = agentConfig.nivel_formalidade || 'Médio';
    
    // Saudação inicial (padrão ou do JSON)
    const initialGreeting = agentConfig.saudacao_inicial || `Olá! Sou o ${agentName}, assistente virtual da ${clinicContext.name}. Como posso ajudá-lo hoje?`;
    
    // Mensagem de despedida (padrão ou do JSON)
    const farewellMessage = agentConfig.mensagem_despedida || 'Obrigado por escolher nossa clínica. Até breve!';
    
    // Mensagem fora do horário (padrão ou do JSON)
    const outOfHoursMessage = agentConfig.mensagem_fora_horario || 'No momento estamos fora do horário de atendimento. Retornaremos seu contato no próximo horário comercial.';
    
    // Restrições específicas
    const restrictions = [];
    if (agentRestrictions.nao_pode_diagnosticar) {
      restrictions.push('NUNCA faça diagnósticos médicos');
    }
    if (agentRestrictions.nao_pode_prescrever) {
      restrictions.push('NUNCA prescreva medicamentos');
    }
    
    // Emergências cardíacas (se configuradas)
    const cardiacEmergencies = agentRestrictions.emergencias_cardiacas || [];
    
    let prompt = `Você é ${agentName}, assistente virtual da ${clinicContext.name}.
Sua personalidade é: ${agentPersonality}
Tom de comunicação: ${communicationTone}
Nível de formalidade: ${formalityLevel}

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empático
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. ${restrictions.length > 0 ? restrictions.join(', ') : 'NUNCA invente informações ou dê conselhos médicos'}
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome, responda com: "${agentName}"

\nINFORMAÇÕES COMPLETAS DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address || 'Não informado'}
- Telefone: ${clinicContext.phone || 'Não informado'}`;

    // Adicionar email principal se disponível
    if (clinicContext.mainEmail) {
      prompt += `\n- Email: ${clinicContext.mainEmail}`;
    }

    // Adicionar website se disponível
    if (clinicContext.website) {
      prompt += `\n- Website: ${clinicContext.website}`;
    }

    // Adicionar descrição se disponível
    if (clinicContext.description) {
      prompt += `\n- Descrição: ${clinicContext.description}`;
    }

    // Adicionar missão se disponível
    if (clinicContext.mission) {
      prompt += `\n- Missão: ${clinicContext.mission}`;
    }

    // Adicionar valores se disponível
    if (clinicContext.values && clinicContext.values.length > 0) {
      prompt += `\n- Valores: ${clinicContext.values.join(', ')}`;
    }

    // Adicionar diferenciais se disponível
    if (clinicContext.differentiators && clinicContext.differentiators.length > 0) {
      prompt += `\n- Diferenciais: ${clinicContext.differentiators.join(', ')}`;
    }

    // Adicionar especialidades se disponível
    if (clinicContext.specialties && clinicContext.specialties.length > 0) {
      prompt += `\n- Especialidades: ${clinicContext.specialties.join(', ')}`;
    }

    // Adicionar serviços se disponível
    if (clinicContext.services && clinicContext.services.length > 0) {
      prompt += `\n- Serviços oferecidos: ${clinicContext.services.join(', ')}`;
    }

    // Adicionar profissionais se disponível
    if (clinicContext.professionals && clinicContext.professionals.length > 0) {
      prompt += `\n- Profissionais: ${clinicContext.professionals.join(', ')}`;
    }

    // Adicionar convênios se disponível
    if (clinicContext.insurance && clinicContext.insurance.length > 0) {
      const convenios = clinicContext.insurance.map(c => c.nome).join(', ');
      prompt += `\n- Convênios aceitos: ${convenios}`;
    }

    // Adicionar formas de pagamento se disponível
    if (clinicContext.paymentMethods) {
      const formas = [];
      if (clinicContext.paymentMethods.dinheiro) formas.push('Dinheiro');
      if (clinicContext.paymentMethods.cartao_credito) formas.push('Cartão de Crédito');
      if (clinicContext.paymentMethods.cartao_debito) formas.push('Cartão de Débito');
      if (clinicContext.paymentMethods.pix) formas.push('PIX');
      
      if (formas.length > 0) {
        prompt += `\n- Formas de pagamento: ${formas.join(', ')}`;
      }

      // Adicionar informações de parcelamento
      if (clinicContext.paymentMethods.parcelamento && clinicContext.paymentMethods.parcelamento.disponivel) {
        prompt += `\n- Parcelamento: Disponível em até ${clinicContext.paymentMethods.parcelamento.max_parcelas} parcelas`;
      }

      // Adicionar informações de desconto
      if (clinicContext.paymentMethods.desconto_a_vista && clinicContext.paymentMethods.desconto_a_vista.disponivel) {
        prompt += `\n- Desconto à vista: ${clinicContext.paymentMethods.desconto_a_vista.percentual}%`;
      }
    }

    // Adicionar horário de funcionamento se disponível
    if (clinicContext.workingHours && Object.keys(clinicContext.workingHours).length > 0) {
      prompt += `\n- Horário de funcionamento:`;
      const dias = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira', 
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
      };
      
      Object.entries(clinicContext.workingHours).forEach(([dia, horario]) => {
        if (horario && horario.abertura && horario.fechamento) {
          prompt += `\n  • ${dias[dia]}: ${horario.abertura} às ${horario.fechamento}`;
        } else if (horario) {
          prompt += `\n  • ${dias[dia]}: Fechado`;
        }
      });
    }

    // Adicionar emails específicos por departamento se disponível
    if (clinicContext.emails && Object.keys(clinicContext.emails).length > 0) {
      prompt += `\n- Emails por departamento:`;
      Object.entries(clinicContext.emails).forEach(([dept, email]) => {
        prompt += `\n  • ${dept}: ${email}`;
      });
    }

    // Adicionar políticas de agendamento se disponível
    if (clinicContext.bookingPolicies) {
      prompt += `\n- Políticas de agendamento:`;
      if (clinicContext.bookingPolicies.antecedencia_minima_horas) {
        prompt += `\n  • Antecedência mínima: ${clinicContext.bookingPolicies.antecedencia_minima_horas}h`;
      }
      if (clinicContext.bookingPolicies.antecedencia_maxima_dias) {
        prompt += `\n  • Antecedência máxima: ${clinicContext.bookingPolicies.antecedencia_maxima_dias} dias`;
      }
      if (clinicContext.bookingPolicies.reagendamento_permitido !== undefined) {
        prompt += `\n  • Reagendamento: ${clinicContext.bookingPolicies.reagendamento_permitido ? 'Permitido' : 'Não permitido'}`;
      }
      if (clinicContext.bookingPolicies.cancelamento_antecedencia_horas) {
        prompt += `\n  • Cancelamento: ${clinicContext.bookingPolicies.cancelamento_antecedencia_horas}h de antecedência`;
      }
    }

    // Adicionar políticas de atendimento se disponível
    if (clinicContext.servicePolicies) {
      prompt += `\n- Políticas de atendimento:`;
      if (clinicContext.servicePolicies.tolerancia_atraso_minutos) {
        prompt += `\n  • Tolerância atraso: ${clinicContext.servicePolicies.tolerancia_atraso_minutos} min`;
      }
      if (clinicContext.servicePolicies.acompanhante_permitido !== undefined) {
        prompt += `\n  • Acompanhante: ${clinicContext.servicePolicies.acompanhante_permitido ? 'Permitido' : 'Não permitido'}`;
      }
      if (clinicContext.servicePolicies.documentos_obrigatorios && clinicContext.servicePolicies.documentos_obrigatorios.length > 0) {
        prompt += `\n  • Documentos obrigatórios: ${clinicContext.servicePolicies.documentos_obrigatorios.join(', ')}`;
      }
    }

    // Adicionar informações adicionais se disponível
    if (clinicContext.additionalInfo && clinicContext.additionalInfo.parcerias && clinicContext.additionalInfo.parcerias.length > 0) {
      prompt += `\n- Parcerias:`;
      clinicContext.additionalInfo.parcerias.forEach(parceria => {
        prompt += `\n  • ${parceria.nome} (${parceria.tipo}): ${parceria.descricao}`;
      });
    }

    // Adicionar emergências cardíacas se configuradas
    if (cardiacEmergencies && cardiacEmergencies.length > 0) {
      prompt += `\n\nEMERGÊNCIAS CARDÍACAS - ORIENTAÇÕES:`;
      cardiacEmergencies.forEach(emergencia => {
        prompt += `\n• ${emergencia}`;
      });
    }

    // Adicionar informações detalhadas dos profissionais se disponível
    if (clinicContext.professionalsDetails && clinicContext.professionalsDetails.length > 0) {
      prompt += `\n- Detalhes dos profissionais:`;
      clinicContext.professionalsDetails.forEach(prof => {
        prompt += `\n  • ${prof.nome_completo} (${prof.crm}): ${prof.especialidades?.join(', ')} - ${prof.experiencia}`;
        if (prof.horarios_disponibilidade) {
          const horarios = Object.entries(prof.horarios_disponibilidade)
            .filter(([dia, horarios]) => horarios && horarios.length > 0)
            .map(([dia, horarios]) => `${dia}: ${horarios.map(h => `${h.inicio}-${h.fim}`).join(', ')}`)
            .join('; ');
          if (horarios) {
            prompt += `\n    Horários: ${horarios}`;
          }
        }
      });
    }

    // Adicionar informações detalhadas dos serviços se disponível
    if (clinicContext.servicesDetails) {
      if (clinicContext.servicesDetails.consultas && clinicContext.servicesDetails.consultas.length > 0) {
        prompt += `\n- Detalhes das consultas:`;
        clinicContext.servicesDetails.consultas.forEach(consulta => {
          // Formatar preço para aceitar ambos os formatos
          const precoFormatado = consulta.preco_particular ? 
            (consulta.preco_particular % 1 === 0 ? 
              `R$ ${consulta.preco_particular},00` : 
              `R$ ${consulta.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${consulta.nome}: ${consulta.descricao} - ${consulta.duracao_minutos}min - ${precoFormatado}`;
          if (consulta.convenios_aceitos && consulta.convenios_aceitos.length > 0) {
            prompt += ` (Convênios: ${consulta.convenios_aceitos.join(', ')})`;
          }
        });
      }

      if (clinicContext.servicesDetails.exames && clinicContext.servicesDetails.exames.length > 0) {
        prompt += `\n- Detalhes dos exames:`;
        clinicContext.servicesDetails.exames.forEach(exame => {
          // Formatar preço para aceitar ambos os formatos
          const precoFormatado = exame.preco_particular ? 
            (exame.preco_particular % 1 === 0 ? 
              `R$ ${exame.preco_particular},00` : 
              `R$ ${exame.preco_particular.toFixed(2).replace('.', ',')}`) : 
            'Preço sob consulta';
          
          prompt += `\n  • ${exame.nome}: ${exame.descricao} - ${exame.duracao_minutos}min - ${precoFormatado}`;
          if (exame.preparacao) {
            prompt += `\n    Preparação: ${exame.preparacao.instrucoes_especiais}`;
          }
          if (exame.resultado_prazo_dias) {
            prompt += `\n    Resultado: ${exame.resultado_prazo_dias} dia(s)`;
          }
        });
      }
    }

    // Adicionar informações detalhadas dos convênios se disponível
    if (clinicContext.insuranceDetails && clinicContext.insuranceDetails.length > 0) {
      prompt += `\n- Detalhes dos convênios:`;
      clinicContext.insuranceDetails.forEach(conv => {
        prompt += `\n  • ${conv.nome}: ${conv.copagamento ? `Copagamento R$ ${conv.valor_copagamento}` : 'Sem copagamento'}`;
        if (conv.autorizacao_necessaria) {
          prompt += ` (Autorização necessária)`;
        }
      });
    }

    if (userProfile && userProfile.name) {
      prompt += `\n\nINFORMAÇÕES DO USUÁRIO:
- Nome: ${userProfile.name}`;
    }

    return prompt;
  }

  static buildMessages(systemPrompt, memory, userMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    console.log('🧠 Construindo mensagens com memória...');
    console.log('  - Histórico disponível:', memory.history?.length || 0, 'mensagens');

    // Adicionar histórico relevante
    if (memory.history && memory.history.length > 0) {
      const recentHistory = memory.history.slice(-15);
      console.log('  - Usando últimas:', recentHistory.length, 'mensagens');
      
      recentHistory.forEach((h, index) => {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
          console.log(`    ${index + 1}. ${h.role}: ${h.content.substring(0, 30)}...`);
        }
      });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: userMessage });
    console.log('  - Mensagem atual: user:', userMessage.substring(0, 30) + '...');
    console.log('  - Total de mensagens:', messages.length);

    return messages;
  }

  /**
   * Verifica se é a primeira conversa do dia
   */
  static async isFirstConversationOfDay(phoneNumber) {
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
  }

  /**
   * Verifica se está dentro do horário de funcionamento
   */
  static isWithinBusinessHours(clinicContext) {
    try {
      console.log('🔍 [DEBUG] Verificando horário de funcionamento...');
      console.log('🔍 [DEBUG] clinicContext.workingHours:', clinicContext.workingHours);
      
      if (!clinicContext.workingHours) {
        console.log('⚠️ [DEBUG] Sem horários configurados, assumindo aberto');
        return true; // Se não há horário configurado, assume que está aberto
      }

      // Usar timezone do Brasil para garantir consistência
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const currentDay = this.getDayOfWeek(brazilTime.getDay());
      const currentTime = brazilTime.getHours() * 100 + brazilTime.getMinutes(); // Formato HHMM

      console.log('🔍 [DEBUG] Data atual:', now.toLocaleString());
      console.log('🔍 [DEBUG] Data Brasil:', brazilTime.toLocaleString());
      console.log('🔍 [DEBUG] Dia da semana:', currentDay);
      console.log('🔍 [DEBUG] Horário atual (HHMM):', currentTime);
      console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
      console.log('🔍 [DEBUG] TZ:', process.env.TZ);

      const todaySchedule = clinicContext.workingHours[currentDay];
      console.log('🔍 [DEBUG] Horário para hoje:', todaySchedule);
      
      if (!todaySchedule || !todaySchedule.abertura || !todaySchedule.fechamento) {
        console.log('❌ [DEBUG] Sem horário configurado para hoje, considerando fechado');
        return false; // Fechado se não há horário configurado
      }

      const openingTime = this.parseTime(todaySchedule.abertura);
      const closingTime = this.parseTime(todaySchedule.fechamento);

      console.log('🔍 [DEBUG] Horário de abertura (HHMM):', openingTime);
      console.log('🔍 [DEBUG] Horário de fechamento (HHMM):', closingTime);
      console.log('🔍 [DEBUG] Está dentro do horário?', currentTime >= openingTime && currentTime <= closingTime);

      return currentTime >= openingTime && currentTime <= closingTime;
    } catch (error) {
      console.error('❌ Erro ao verificar horário de funcionamento:', error);
      return true; // Por segurança, assume que está aberto
    }
  }

  /**
   * Converte string de tempo para formato HHMM
   */
  static parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Obtém o dia da semana em formato string
   */
  static getDayOfWeek(dayNumber) {
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return days[dayNumber];
  }

  /**
   * Aplica lógica de resposta baseada em saudação e horário
   */
  static async applyResponseLogic(response, clinicContext, isFirstConversationOfDay, isWithinBusinessHours, userProfile) {
    try {
      // Obter configurações do agente (corrigido para usar agentConfig)
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
        console.log('🔍 [DEBUG] Valor de isWithinBusinessHours:', isWithinBusinessHours);
        console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
        console.log('🔍 [DEBUG] Mensagem fora do horário:', outOfHoursMessage);
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
          const cleanResponse = this.removeGreetingPatterns(response);
          console.log('🧹 Saudação duplicada removida da resposta');
          return personalizedGreeting + "\n\n" + cleanResponse;
        } else {
          // Não tem saudação, adicionar normalmente
          return personalizedGreeting + "\n\n" + response;
        }
      }

      // Para todas as respostas (primeira conversa ou não), verificar duplicações gerais
      const cleanedResponse = this.removeDuplicateContent(response);
      if (cleanedResponse !== response) {
        console.log('🧹 Conteúdo duplicado removido da resposta');
      }

      // Verificar se há duplicações reais que precisam ser tratadas
      if (this.hasRealDuplications(cleanedResponse)) {
        console.log('⚠️ Duplicações reais detectadas, aplicando limpeza adicional');
        return this.removeGreetingPatterns(cleanedResponse);
      }

      return cleanedResponse;
    } catch (error) {
      console.error('❌ Erro ao aplicar lógica de resposta:', error);
      return response;
    }
  }

  /**
   * Remove padrões de saudação duplicados da resposta
   */
  static removeGreetingPatterns(text) {
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

  /**
   * Remove conteúdo duplicado de forma geral da resposta
   */
  static removeDuplicateContent(text) {
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
        const similarity = this.calculateSimilarity(normalizedSentence, seen);
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

  /**
   * Calcula a similaridade entre duas strings usando algoritmo de similaridade de Jaccard
   */
  static calculateSimilarity(str1, str2) {
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

  /**
   * Detecta se há duplicações reais no texto (não apenas palavras comuns repetidas)
   */
  static hasRealDuplications(text) {
    // Padrões de duplicações reais que queremos detectar
    const duplicationPatterns = [
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
    
    // Verificar se há padrões de duplicação
    for (const pattern of duplicationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        return true;
      }
    }
    
    return false;
  }
} 