#!/bin/bash

echo "🔧 ATUALIZANDO AI SERVICE COM CONTEXTUALIZAÇÃO COMPLETA..."
echo "=============================================="

# Parar PM2
echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

# Atualizar aiService.js com contextualização completa
echo "📝 Atualizando aiService.js com contextualização completa..."
cat > /root/atendeai-lify-backend/src/services/ai/aiService.js << 'EOF'
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
      const clinicName = this.getClinicName(clinicInfo);
      const agentName = this.getAgentName(clinicInfo);
      const greeting = this.getAgentGreeting(clinicInfo);
      
      return {
        response: greeting || `Olá! Seja bem-vindo à ${clinicName}! 🏥\n\nSou o ${agentName}, seu assistente virtual inteligente. Posso ajudá-lo com:\n\n📋 Agendamento de consultas\n🕐 Horários de funcionamento\n📍 Localização da clínica\n👨‍⚕️ Informações sobre especialidades médicas\n💰 Preços e convênios\n\nComo posso ser útil hoje? 😊`
      };
    }
    
    // RESPOSTAS CONTEXTUAIS INTELIGENTES
    switch (intent.name) {
      case 'GREETING':
        if (userName) {
          const clinicName = this.getClinicName(clinicInfo);
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
        const agentName = this.getAgentName(clinicInfo);
        return { response: `Meu nome é ${agentName}! Sou o assistente virtual da clínica, criado para ajudar com informações e agendamentos. 😊` };
        
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
        const farewell = this.getAgentFarewell(clinicInfo);
        return { response: farewell || 'Até logo! Foi um prazer atendê-lo. Se precisar de mais alguma coisa, estamos aqui! 👋' };
        
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

  // Métodos auxiliares para extrair informações do JSON
  getClinicName(clinicInfo) {
    return clinicInfo?.clinica?.informacoes_basicas?.nome || 'nossa clínica';
  }

  getAgentName(clinicInfo) {
    return clinicInfo?.agente_ia?.configuracao?.nome || 'AtendeAI';
  }

  getAgentGreeting(clinicInfo) {
    return clinicInfo?.agente_ia?.configuracao?.saudacao_inicial;
  }

  getAgentFarewell(clinicInfo) {
    return clinicInfo?.agente_ia?.configuracao?.mensagem_despedida;
  }

  generateAppointmentResponse(intent, memory, context, clinicInfo) {
    const userName = memory.userProfile.name || intent.entities.name;
    const clinicName = this.getClinicName(clinicInfo);
    
    // Verificar se já estava no processo de agendamento
    if (context.lastIntent === 'APPOINTMENT_CREATE') {
      const specialties = this.getSpecialties(clinicInfo);
      return `Perfeito ${userName}! Vamos continuar com o agendamento na ${clinicName}. Qual especialidade você gostaria de marcar? Temos disponibilidade para: ${specialties.join(', ')}.`;
    }
    
    if (userName) {
      const specialties = this.getSpecialties(clinicInfo);
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento na ${clinicName}. Para qual especialidade você gostaria de marcar? Temos disponibilidade para: ${specialties.join(', ')}.`;
    }
    
    return 'Perfeito! Vou ajudá-lo com o agendamento. Primeiro, preciso saber seu nome. Pode me informar?';
  }

  getSpecialties(clinicInfo) {
    const specialties = [];
    
    // Adicionar especialidade principal
    if (clinicInfo?.clinica?.informacoes_basicas?.especialidade_principal) {
      specialties.push(clinicInfo.clinica.informacoes_basicas.especialidade_principal);
    }
    
    // Adicionar especialidades secundárias
    if (clinicInfo?.clinica?.informacoes_basicas?.especialidades_secundarias) {
      specialties.push(...clinicInfo.clinica.informacoes_basicas.especialidades_secundarias);
    }
    
    // Se não houver especialidades definidas, usar padrão
    if (specialties.length === 0) {
      return ['Cardiologia', 'Dermatologia', 'Ginecologia', 'Ortopedia', 'Pediatria'];
    }
    
    return specialties;
  }

  generateHoursResponse(clinicInfo) {
    const hours = clinicInfo?.clinica?.horario_funcionamento;
    if (hours) {
      const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
      
      let response = 'Nossa clínica funciona:\n';
      
      days.forEach((day, index) => {
        if (hours[day] && hours[day].abertura && hours[day].fechamento) {
          response += `• ${dayNames[index]}: ${hours[day].abertura} às ${hours[day].fechamento}\n`;
        } else if (day === 'domingo') {
          response += `• ${dayNames[index]}: Fechado\n`;
        }
      });
      
      return response + '🕐';
    }
    
    return 'Nossa clínica funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. 🕐';
  }

  generateLocationResponse(clinicInfo) {
    const address = clinicInfo?.clinica?.localizacao?.endereco_principal;
    if (address) {
      const fullAddress = `${address.logradouro}, ${address.numero}`;
      const complement = address.complemento ? ` - ${address.complemento}` : '';
      const neighborhood = address.bairro ? `, ${address.bairro}` : '';
      const cityState = `${address.cidade} - ${address.estado}`;
      const cep = address.cep ? `, CEP: ${address.cep}` : '';
      
      return `Estamos localizados em: ${fullAddress}${complement}${neighborhood}, ${cityState}${cep}. 📍`;
    }
    
    return 'Estamos localizados na Rua das Flores, 123, Centro. Ficamos próximos à Praça Central. 📍';
  }

  generateServicesResponse(clinicInfo) {
    const specialties = this.getSpecialties(clinicInfo);
    return `Oferecemos as seguintes especialidades: ${specialties.join(', ')}! 👨‍⚕️`;
  }

  generateDoctorsResponse(intent, context, clinicInfo) {
    const specialty = intent.entities.specialty;
    const professionals = clinicInfo?.profissionais;
    
    if (specialty && professionals) {
      const doctorsInSpecialty = professionals.filter(prof => 
        prof.especialidades && prof.especialidades.some(esp => 
          esp.toLowerCase().includes(specialty.toLowerCase())
        )
      );
      
      if (doctorsInSpecialty.length > 0) {
        const doctorNames = doctorsInSpecialty.map(doc => doc.nome_completo).join(', ');
        return `👨‍⚕️ Nossos ${specialty.charAt(0).toUpperCase() + specialty.slice(1)}:\n\n${doctorNames}\n\nGostaria de agendar uma consulta?`;
      }
    }
    
    if (professionals && professionals.length > 0) {
      const allDoctors = professionals
        .filter(prof => prof.ativo)
        .map(prof => `${prof.nome_completo} (${prof.especialidades?.join(', ') || 'Especialista'})`)
        .join('\n');
      return `👨‍⚕️ Nossos médicos:\n\n${allDoctors}\n\nPara qual especialidade você gostaria de saber mais?`;
    }
    
    return 'Nossos médicos são altamente qualificados em suas respectivas especialidades. Para qual especialidade você gostaria de saber mais?';
  }

  generatePricesResponse(clinicInfo) {
    const services = clinicInfo?.servicos?.consultas;
    const paymentMethods = clinicInfo?.formas_pagamento;
    const insurance = clinicInfo?.convenios;
    
    let response = 'Nossos preços: ';
    
    if (services && services.length > 0) {
      const activeServices = services.filter(service => service.ativo);
      if (activeServices.length > 0) {
        response += `\n• ${activeServices[0].nome}: R$ ${activeServices[0].preco_particular.toFixed(2)}`;
      }
    }
    
    if (insurance && insurance.length > 0) {
      const activeInsurance = insurance.filter(ins => ins.ativo).map(ins => ins.nome).join(', ');
      response += `\n• Aceitamos os convênios: ${activeInsurance}`;
    }
    
    if (paymentMethods) {
      const methods = [];
      if (paymentMethods.pix) methods.push('PIX');
      if (paymentMethods.cartao_credito) methods.push('Cartão de Crédito');
      if (paymentMethods.cartao_debito) methods.push('Cartão de Débito');
      if (paymentMethods.dinheiro) methods.push('Dinheiro');
      
      if (methods.length > 0) {
        response += `\n• Formas de pagamento: ${methods.join(', ')}`;
      }
    }
    
    return response + ' 💰';
  }
}

module.exports = new AIService();
EOF

echo "✅ AI Service atualizado com contextualização completa!"

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "📊 Verificando status..."
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ CONTEXTUALIZAÇÃO COMPLETA IMPLEMENTADA!"
echo "🎯 Funcionalidades implementadas:"
echo "   - ✅ Contextualização completa por clínica"
echo "   - ✅ Informações específicas de médicos"
echo "   - ✅ Horários personalizados"
echo "   - ✅ Endereços específicos"
echo "   - ✅ Preços e convênios"
echo "   - ✅ Personalidade do agente IA"
echo "   - ✅ Respostas contextuais inteligentes"
echo ""
echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora usa contextualização completa!"
echo ""
echo "✅ Script de contextualização aplicado com sucesso!" 