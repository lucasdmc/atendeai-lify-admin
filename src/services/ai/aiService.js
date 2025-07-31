const ConversationMemoryService = require('./conversationMemoryService');
const IntentRecognitionService = require('./intentRecognitionService');

class AIService {
  constructor() {
    this.config = {
      models: {
        primary: 'gpt-4o',
        fallback: 'gpt-3.5-turbo'
      }
    };
  }

  async processMessage(message, phoneNumber, clinicId) {
    try {
      console.log(`🧠 [AI] Processando mensagem: "${message}" de ${phoneNumber}`);
      
      // Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      
      // Buscar contextualização da clínica
      const clinicContext = await this.getClinicContextualization(phoneNumber);
      
      // Verificar se deve se apresentar
      const shouldIntroduce = await ConversationMemoryService.shouldIntroduceSelf(phoneNumber);
      const context = await ConversationMemoryService.getConversationContext(phoneNumber);
      
      console.log(`🎯 [AI] Contexto: Primeira conversa: ${context.isFirstConversation}, Dias desde última: ${context.daysSinceLastInteraction}, Última intenção: ${context.lastIntent}`);
      console.log(`🏥 [AI] Clínica: ${clinicContext.clinic_name}, Contextualização: ${clinicContext.has_contextualization ? 'Ativa' : 'Genérica'}`);
      
      // Reconhecer intenção
      const intent = await IntentRecognitionService.recognizeIntent(message);
      
      console.log(`🎯 [AI] Intenção detectada: ${intent.name} (confiança: ${intent.confidence})`);
      console.log(`🔍 [AI] Entidades extraídas:`, intent.entities);
      
      // Salvar nome se extraído
      if (intent.entities.name && !memory.userProfile.name) {
        memory.userProfile.name = intent.entities.name;
        await ConversationMemoryService.setUserName(phoneNumber, intent.entities.name);
        console.log(`💾 [AI] Nome salvo na memória: ${intent.entities.name}`);
      }
      
      // Gerar resposta com contexto da clínica
      const response = await this.generateContextualResponse(message, intent, memory, clinicId, shouldIntroduce, context, clinicContext);
      
      console.log(`🎯 [AI] Gerando resposta para intenção: ${intent.name}`);
      
      // Salvar interação
      await ConversationMemoryService.addInteraction(phoneNumber, message, response.response, intent.name, intent.entities);
      
      console.log(`💾 Memory saved for: ${phoneNumber}`);
      
      return {
        response: response.response,
        intent: intent.name,
        confidence: intent.confidence,
        entities: intent.entities
      };
      
    } catch (error) {
      console.error('❌ [AI] Erro no processamento:', error);
      return {
        response: 'Desculpe, tive um problema técnico. Como posso ajudá-lo?',
        intent: 'ERROR',
        confidence: 0.1,
        entities: {}
      };
    }
  }

  async getClinicContextualization(phoneNumber) {
    try {
      const { data, error } = await ConversationMemoryService.supabase.rpc('get_clinic_contextualization', {
        p_whatsapp_phone: phoneNumber
      });
      
      if (error || !data || data.length === 0) {
        return {
          clinic_name: 'Clínica Genérica',
          contextualization_json: {},
          has_contextualization: false
        };
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ [AI] Erro ao buscar contextualização:', error);
      return {
        clinic_name: 'Clínica Genérica',
        contextualization_json: {},
        has_contextualization: false
      };
    }
  }

  async generateContextualResponse(message, intent, memory, clinicId, shouldIntroduce, context, clinicContext) {
    const userName = memory.userProfile.name || intent.entities.name;
    const clinicInfo = clinicContext.contextualization_json;
    
    // APRESENTAÇÃO AUTOMÁTICA
    if (shouldIntroduce && intent.name === 'GREETING') {
      const clinicName = clinicInfo.nome_clinica || clinicContext.clinic_name;
      return {
        response: `Olá! Seja bem-vindo à ${clinicName}! 🏥\n\nSou o AtendeAI, seu assistente virtual inteligente. Posso ajudá-lo com:\n\n📋 Agendamento de consultas\n🕐 Horários de funcionamento\n📍 Localização da clínica\n👨‍⚕️ Informações sobre especialidades médicas\n💰 Preços e convênios\n\nComo posso ser útil hoje? 😊`
      };
    }
    
    // RESPOSTAS CONTEXTUAIS INTELIGENTES
    switch (intent.name) {
      case 'GREETING':
        if (userName) {
          const clinicName = clinicInfo.nome_clinica || clinicContext.clinic_name;
          if (context.lastIntent === 'APPOINTMENT_CREATE') {
            return { response: `Olá ${userName}! Vi que você estava interessado em agendamento na ${clinicName}. Gostaria de continuar com o agendamento ou tem alguma outra dúvida? 😊` };
          }
          return { response: `Olá ${userName}! É um prazer conversar com você novamente. Como posso ajudar hoje? 😊` };
        }
        return { response: 'Olá! Seja bem-vindo à nossa clínica. Sou o assistente virtual e estou aqui para ajudar. Como posso ser útil?' };
        
      case 'NAME_QUESTION':
        const storedName = memory.userProfile.name;
        if (storedName) {
          return { response: `Seu nome é ${storedName}! 😊` };
        } else {
          return { response: 'Ainda não sei seu nome. Pode me dizer como você se chama?' };
        }
        
      case 'BOT_NAME_QUESTION':
        return { response: 'Meu nome é AtendeAI! Sou o assistente virtual da clínica, criado para ajudar com informações e agendamentos. 😊' };
        
      case 'BOT_CAPABILITIES':
        return { response: 'Posso ajudar você com: 📋 Agendamento de consultas, 🕐 Horários de funcionamento, 📍 Localização da clínica, 👨‍⚕️ Informações sobre especialidades médicas, 💰 Preços e convênios, e muito mais! O que você gostaria de saber?' };
        
      case 'CONVERSATION_TEST':
        return { response: 'Estou aqui para testar minha capacidade de conversação! Posso ajudar com informações da clínica, agendamentos e responder suas perguntas. Como posso ser útil? 🤖' };
        
      case 'HOW_ARE_YOU':
        return { response: 'Tudo bem, obrigado por perguntar! Estou funcionando perfeitamente e pronto para ajudar. E você, como está? 😊' };
        
      case 'THANKS':
        return { response: 'Por nada! Fico feliz em poder ajudar. Se precisar de mais alguma coisa, é só falar! 😊' };
        
      case 'APPOINTMENT_CREATE':
        return { response: this.generateAppointmentResponse(intent, memory, context, clinicInfo) };
        
      case 'INFO_HOURS':
        return { response: this.generateHoursResponse(clinicInfo) };
        
      case 'INFO_LOCATION':
        return { response: this.generateLocationResponse(clinicInfo) };
        
      case 'INFO_SERVICES':
        return { response: this.generateServicesResponse(clinicInfo) };
        
      case 'INFO_DOCTORS':
        return { response: this.generateDoctorsResponse(intent, context, clinicInfo) };
        
      case 'INFO_PRICES':
        return { response: this.generatePricesResponse(clinicInfo) };
        
      case 'FAREWELL':
        return { response: 'Até logo! Foi um prazer atendê-lo. Se precisar de mais alguma coisa, estamos aqui! 👋' };
        
      case 'EMERGENCY':
        return { response: '🚨 EMERGÊNCIA: Para casos urgentes, ligue imediatamente para (47) 99999-9999 ou vá ao hospital mais próximo. Não aguarde!' };
        
      default:
        // Verificar contexto anterior para respostas mais inteligentes
        if (context.lastIntent === 'APPOINTMENT_CREATE') {
          return { response: 'Vejo que você estava interessado em agendamento. Gostaria de continuar com o agendamento ou tem alguma outra dúvida? 😊' };
        }
        return { response: 'Entendo sua mensagem. Como posso ajudá-lo com informações sobre nossa clínica ou agendamento de consultas?' };
    }
  }

  generateAppointmentResponse(intent, memory, context, clinicInfo) {
    const userName = memory.userProfile.name || intent.entities.name;
    const clinicName = clinicInfo.nome_clinica || 'nossa clínica';
    
    // Verificar se já estava no processo de agendamento
    if (context.lastIntent === 'APPOINTMENT_CREATE') {
      const specialties = clinicInfo.especialidades || ['Cardiologia', 'Dermatologia', 'Ginecologia', 'Ortopedia', 'Pediatria'];
      return `Perfeito ${userName}! Vamos continuar com o agendamento na ${clinicName}. Qual especialidade você gostaria de marcar? Temos disponibilidade para: ${specialties.join(', ')}.`;
    }
    
    if (userName) {
      const specialties = clinicInfo.especialidades || ['Cardiologia', 'Dermatologia', 'Ginecologia', 'Ortopedia', 'Pediatria'];
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento na ${clinicName}. Para qual especialidade você gostaria de marcar? Temos disponibilidade para: ${specialties.join(', ')}.`;
    }
    
    return 'Perfeito! Vou ajudá-lo com o agendamento. Primeiro, preciso saber seu nome. Pode me informar?';
  }

  generateHoursResponse(clinicInfo) {
    if (clinicInfo.horarios) {
      const hours = clinicInfo.horarios;
      return `Nossa clínica funciona: ${hours.segunda_sexta || 'Segunda a sexta, das 8h às 18h'}, ${hours.sabado || 'Sábados das 8h às 12h'}. 🕐`;
    }
    return 'Nossa clínica funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. 🕐';
  }

  generateLocationResponse(clinicInfo) {
    if (clinicInfo.endereco) {
      return `Estamos localizados em: ${clinicInfo.endereco}. 📍`;
    }
    return 'Estamos localizados na Rua das Flores, 123, Centro. Ficamos próximos à Praça Central. 📍';
  }

  generateServicesResponse(clinicInfo) {
    if (clinicInfo.especialidades) {
      return `Oferecemos as seguintes especialidades: ${clinicInfo.especialidades.join(', ')}! 👨‍⚕️`;
    }
    return 'Oferecemos as seguintes especialidades: Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Neurologia, Psiquiatria, Oftalmologia e muito mais! 👨‍⚕️';
  }

  generateDoctorsResponse(intent, context, clinicInfo) {
    const specialty = intent.entities.specialty;
    
    if (specialty && clinicInfo.medicos && clinicInfo.medicos[specialty.toLowerCase()]) {
      const doctors = clinicInfo.medicos[specialty.toLowerCase()];
      return `👨‍⚕️ Nossos ${specialty.charAt(0).toUpperCase() + specialty.slice(1)}:\n\n${doctors.join('\n')}\n\nGostaria de agendar uma consulta?`;
    }
    
    if (clinicInfo.medicos) {
      const allDoctors = Object.entries(clinicInfo.medicos)
        .map(([specialty, doctors]) => `${specialty.charAt(0).toUpperCase() + specialty.slice(1)}: ${doctors.join(', ')}`)
        .join('\n');
      return `👨‍⚕️ Nossos médicos:\n\n${allDoctors}\n\nPara qual especialidade você gostaria de saber mais?`;
    }
    
    return 'Nossos médicos são altamente qualificados em suas respectivas especialidades. Para qual especialidade você gostaria de saber mais?';
  }

  generatePricesResponse(clinicInfo) {
    if (clinicInfo.precos) {
      const prices = clinicInfo.precos;
      let response = 'Nossos preços: ';
      
      if (prices.consulta_particular) {
        response += `Consulta particular: ${prices.consulta_particular}. `;
      }
      
      if (prices.convênios) {
        response += `Aceitamos os convênios: ${prices.convênios.join(', ')}. `;
      }
      
      return response + '💰';
    }
    
    return 'Nossos preços variam conforme a especialidade. Consultas particulares a partir de R$ 150,00. Aceitamos os principais convênios médicos. 💰';
  }
}

module.exports = new AIService(); 