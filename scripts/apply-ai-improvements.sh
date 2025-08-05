#!/bin/bash
echo "🔧 APLICANDO MELHORIAS NO SISTEMA AI..."
echo "=============================================="

ssh root@atendeai-backend-production.up.railway.app << 'EOF'

echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

echo "📝 Atualizando intentRecognitionService.js..."
cat > /root/atendeai-lify-backend/src/services/ai/intentRecognitionService.js << 'INTENT_EOF'
class IntentRecognitionService {
  static INTENT_KEYWORDS = {
    // AGENDAMENTOS
    APPOINTMENT_CREATE: ['agendar', 'marcar', 'consulta', 'agendamento', 'horário', 'marcação', 'agenda'],
    APPOINTMENT_RESCHEDULE: ['remarcar', 'alterar', 'mudar', 'reagendar', 'trocar', 'modificar'],
    APPOINTMENT_CANCEL: ['cancelar', 'desmarcar', 'cancelamento', 'desmarcação'],
    APPOINTMENT_LIST: ['minhas consultas', 'meus agendamentos', 'consultas marcadas', 'agendamentos'],
    
    // INFORMAÇÕES
    INFO_HOURS: ['horário', 'funcionamento', 'aberto', 'fechado', 'horários', 'atendimento', 'expediente'],
    INFO_LOCATION: ['endereço', 'localização', 'onde', 'rua', 'bairro', 'cidade', 'como chegar', 'mapa'],
    INFO_SERVICES: ['serviços', 'especialidades', 'médicos', 'tratamentos', 'procedimentos', 'exames'],
    INFO_DOCTORS: ['doutor', 'médico', 'especialista', 'dr', 'dra', 'profissional'],
    INFO_PRICES: ['preço', 'valor', 'quanto custa', 'convênio', 'plano', 'custo', 'pagamento'],
    
    // CONVERSAÇÃO
    GREETING: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'fala'],
    FAREWELL: ['tchau', 'até logo', 'obrigado', 'valeu', 'até mais', 'adeus', 'bye'],
    THANKS: ['obrigado', 'valeu', 'agradeço', 'obrigada', 'grato', 'gratidão'],
    HOW_ARE_YOU: ['tudo bem', 'como vai', 'como está', 'tudo bom', 'beleza', 'tranquilo'],
    
    // PERGUNTAS SOBRE NOME
    NAME_QUESTION: ['qual meu nome', 'meu nome', 'quem sou eu', 'como me chamo', 'sabe meu nome'],
    BOT_NAME_QUESTION: ['qual seu nome', 'como você se chama', 'quem é você', 'seu nome', 'como te chamas'],
    BOT_CAPABILITIES: ['o que você faz', 'para que serve', 'suas capacidades', 'pode fazer', 'funcionalidades', 'habilidades'],
    BOT_IDENTITY: ['você é', 'é um bot', 'é humano', 'é real', 'é artificial'],
    
    // TESTE E CONVERSAÇÃO
    CONVERSATION_TEST: ['testar', 'conversação', 'capacidade', 'inteligência', 'teste', 'prova'],
    SMALL_TALK: ['clima', 'tempo', 'futebol', 'música', 'filme', 'série', 'hobby', 'passatempo'],
    
    // SUPORTE
    HUMAN_HANDOFF: ['humano', 'pessoa', 'atendente', 'operador', 'real', 'físico', 'vivo'],
    COMPLAINT: ['reclamação', 'problema', 'erro', 'falha', 'defeito', 'insatisfeito'],
    PRAISE: ['elogio', 'parabéns', 'excelente', 'ótimo', 'maravilhoso', 'fantástico'],
    
    // URGÊNCIA
    EMERGENCY: ['emergência', 'urgente', 'grave', 'crítico', 'socorro', 'ajuda'],
    URGENT_APPOINTMENT: ['urgente', 'emergência', 'grave', 'crítico', 'imediato']
  };

  static async recognizeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Verificar intenções específicas primeiro (mais específicas primeiro)
    for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return {
            name: intent,
            confidence: 0.8,
            entities: this.extractEntities(message),
            requiresAction: intent.startsWith('APPOINTMENT_') || intent === 'EMERGENCY',
            category: this.mapIntentToCategory(intent)
          };
        }
      }
    }

    return {
      name: 'UNCLEAR',
      confidence: 0.3,
      entities: {},
      requiresAction: false,
      category: 'conversation'
    };
  }

  static extractEntities(message) {
    const entities = {};
    
    // EXTRAÇÃO DE NOMES - PADRÕES MAIS ROBUSTOS
    const namePatterns = [
      /(?:meu nome é|sou o|sou a|me chamo|chamo-me)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:eu sou|sou)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:nome|chamo)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:chamo-me|me chamo)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:sou o|sou a)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      // NOVO: Padrão mais flexível para "me chamo"
      /me\s+chamo\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      // NOVO: Padrão para "me chamo" no final da frase
      /me\s+chamo\s+([a-zA-ZÀ-ÿ\s]+)$/i,
      // NOVO: Padrão para "me chamo" seguido de vírgula
      /me\s+chamo\s+([a-zA-ZÀ-ÿ\s]+),/i,
      // NOVO: Padrão para "me chamo" seguido de ponto
      /me\s+chamo\s+([a-zA-ZÀ-ÿ\s]+)\./i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.name = match[1].trim();
        break;
      }
    }

    // EXTRAÇÃO DE DATAS
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(\d{1,2} de [a-z]+)/i,
      /(?:dia|data)\s+(\d{1,2})/i,
      /(?:dia|data)\s+(\d{1,2}\/\d{1,2})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.date = match[1];
        break;
      }
    }

    // EXTRAÇÃO DE HORÁRIOS
    const timePatterns = [
      /(\d{1,2}:\d{2})/i,
      /(\d{1,2}h\s*\d{0,2})/i,
      /(?:às|as)\s+(\d{1,2}:\d{2})/i
    ];
    
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.time = match[1];
        break;
      }
    }

    // EXTRAÇÃO DE ESPECIALIDADES MÉDICAS
    const specialties = [
      'cardiologia', 'dermatologia', 'ginecologia', 'ortopedia', 'pediatria',
      'neurologia', 'psiquiatria', 'oftalmologia', 'otorrinolaringologia',
      'urologia', 'gastroenterologia', 'endocrinologia', 'reumatologia'
    ];
    
    for (const specialty of specialties) {
      if (message.toLowerCase().includes(specialty)) {
        entities.specialty = specialty;
        break;
      }
    }

    return entities;
  }

  static mapIntentToCategory(intent) {
    if (intent.startsWith('APPOINTMENT_')) return 'appointment';
    if (intent.startsWith('INFO_')) return 'information';
    if (intent === 'EMERGENCY' || intent === 'URGENT_APPOINTMENT') return 'emergency';
    if (intent === 'HUMAN_HANDOFF' || intent === 'COMPLAINT') return 'support';
    if (intent.includes('NAME_') || intent.includes('BOT_')) return 'conversation';
    if (intent === 'GREETING' || intent === 'FAREWELL' || intent === 'THANKS' || intent === 'HOW_ARE_YOU') return 'conversation';
    return 'conversation';
  }
}

module.exports = IntentRecognitionService;
INTENT_EOF

echo "📝 Atualizando conversationMemoryService.js..."
cat > /root/atendeai-lify-backend/src/services/ai/conversationMemoryService.js << 'MEMORY_EOF'
class ConversationMemoryService {
  static memoryCache = new Map();

  static async loadMemory(phoneNumber) {
    const existing = this.memoryCache.get(phoneNumber);
    if (existing) {
      return existing;
    }

    return {
      phoneNumber,
      history: [],
      userProfile: {
        phone: phoneNumber,
        lastInteraction: new Date(),
        firstInteraction: new Date(),
        interactionCount: 0,
        name: null,
        email: null,
        preferences: {}
      },
      context: {
        lastIntent: null,
        conversationFlow: [],
        topics: [],
        appointmentData: {},
        frustrationLevel: 0,
        loopCount: 0
      },
      metadata: {
        isFirstConversation: true,
        daysSinceLastInteraction: null,
        totalInteractions: 0,
        averageResponseTime: 0
      }
    };
  }

  static async saveMemory(phoneNumber, memory) {
    this.memoryCache.set(phoneNumber, memory);
  }

  static async addInteraction(phoneNumber, userMessage, botResponse, intent) {
    const memory = await this.loadMemory(phoneNumber);
    
    memory.history.push({
      type: 'user',
      message: userMessage,
      timestamp: new Date(),
      intent: intent
    });
    
    memory.history.push({
      type: 'bot',
      message: botResponse,
      timestamp: new Date(),
      intent: intent
    });
    
    memory.userProfile.lastInteraction = new Date();
    memory.userProfile.interactionCount++;
    memory.context.lastIntent = intent;
    memory.metadata.totalInteractions++;
    memory.metadata.isFirstConversation = false;

    // Calculate days since last interaction
    if (memory.history.length > 2) {
      const lastInteraction = memory.history[memory.history.length - 4]?.timestamp;
      if (lastInteraction) {
        const daysDiff = Math.floor((new Date() - new Date(lastInteraction)) / (1000 * 60 * 60 * 24));
        memory.metadata.daysSinceLastInteraction = daysDiff;
      }
    }
    
    // Keep only last 20 interactions
    if (memory.history.length > 40) {
      memory.history = memory.history.slice(-40);
    }
    
    await this.saveMemory(phoneNumber, memory);
  }

  static async shouldIntroduceSelf(phoneNumber) {
    const memory = await this.loadMemory(phoneNumber);
    if (memory.metadata.isFirstConversation) return true;
    if (memory.metadata.daysSinceLastInteraction && memory.metadata.daysSinceLastInteraction > 3) return true;
    if (memory.metadata.totalInteractions < 3) return true;
    return false;
  }

  static async getUserName(phoneNumber) {
    const memory = await this.loadMemory(phoneNumber);
    return memory.userProfile.name;
  }

  static async setUserName(phoneNumber, name) {
    const memory = await this.loadMemory(phoneNumber);
    memory.userProfile.name = name;
    await this.saveMemory(phoneNumber, memory);
  }

  static async getConversationContext(phoneNumber) {
    const memory = await this.loadMemory(phoneNumber);
    return {
      isFirstConversation: memory.metadata.isFirstConversation,
      daysSinceLastInteraction: memory.metadata.daysSinceLastInteraction,
      totalInteractions: memory.metadata.totalInteractions,
      userName: memory.userProfile.name,
      lastIntent: memory.context.lastIntent
    };
  }
}

module.exports = ConversationMemoryService;
MEMORY_EOF

echo "📝 Atualizando aiService.js..."
cat > /root/atendeai-lify-backend/src/services/ai/aiService.js << 'AI_EOF'
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
      
      // Verificar se deve se apresentar
      const shouldIntroduce = await ConversationMemoryService.shouldIntroduceSelf(phoneNumber);
      const context = await ConversationMemoryService.getConversationContext(phoneNumber);
      
      console.log(`🎯 [AI] Contexto: Primeira conversa: ${context.isFirstConversation}, Dias desde última: ${context.daysSinceLastInteraction}`);
      
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
      
      // Gerar resposta
      const response = await this.generateResponse(message, intent, memory, clinicId, shouldIntroduce);
      
      console.log(`🎯 [AI] Gerando resposta para intenção: ${intent.name}`);
      
      // Salvar interação
      await ConversationMemoryService.addInteraction(phoneNumber, message, response.response, intent.name);
      
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

  async generateResponse(message, intent, memory, clinicId, shouldIntroduce) {
    const userName = memory.userProfile.name || intent.entities.name;
    
    // APRESENTAÇÃO AUTOMÁTICA
    if (shouldIntroduce && intent.name === 'GREETING') {
      return {
        response: `Olá! Seja bem-vindo à nossa clínica! 🏥\n\nSou o AtendeAI, seu assistente virtual inteligente. Posso ajudá-lo com:\n\n📋 Agendamento de consultas\n🕐 Horários de funcionamento\n📍 Localização da clínica\n👨‍⚕️ Informações sobre especialidades médicas\n💰 Preços e convênios\n\nComo posso ser útil hoje? 😊`
      };
    }
    
    switch (intent.name) {
      case 'GREETING':
        if (userName) {
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
        return { response: this.generateAppointmentResponse(intent, memory) };
        
      case 'INFO_HOURS':
        return { response: 'Nossa clínica funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. 🕐' };
        
      case 'INFO_LOCATION':
        return { response: 'Estamos localizados na Rua das Flores, 123, Centro. Ficamos próximos à Praça Central. 📍' };
        
      case 'INFO_SERVICES':
        return { response: 'Oferecemos as seguintes especialidades: Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Neurologia, Psiquiatria, Oftalmologia e muito mais! 👨‍⚕️' };
        
      case 'INFO_PRICES':
        return { response: 'Nossos preços variam conforme a especialidade. Consultas particulares a partir de R$ 150,00. Aceitamos os principais convênios médicos. 💰' };
        
      case 'FAREWELL':
        return { response: 'Até logo! Foi um prazer atendê-lo. Se precisar de mais alguma coisa, estamos aqui! 👋' };
        
      case 'EMERGENCY':
        return { response: '🚨 EMERGÊNCIA: Para casos urgentes, ligue imediatamente para (47) 99999-9999 ou vá ao hospital mais próximo. Não aguarde!' };
        
      default:
        return { response: 'Entendo sua mensagem. Como posso ajudá-lo com informações sobre nossa clínica ou agendamento de consultas?' };
    }
  }

  generateAppointmentResponse(intent, memory) {
    const userName = memory.userProfile.name || intent.entities.name;
    
    if (userName) {
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento. Para qual especialidade você gostaria de marcar? Temos disponibilidade para: Cardiologia, Dermatologia, Ginecologia, Ortopedia e Pediatria.`;
    }
    
    return 'Perfeito! Vou ajudá-lo com o agendamento. Primeiro, preciso saber seu nome. Pode me informar?';
  }
}

module.exports = new AIService();
AI_EOF

echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "✅ MELHORIAS APLICADAS!"
echo "🎯 Funcionalidades implementadas:"
echo "   - ✅ Extraction de entidades melhorada"
echo "   - ✅ Apresentação automática na primeira conversa"
echo "   - ✅ Memória de conversa aprimorada"
echo "   - ✅ Respostas mais inteligentes"
echo "   - ✅ Detecção de nomes aprimorada"

sleep 3
echo "📊 Verificando status..."
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""
echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora deve responder de forma muito mais inteligente!"

EOF

echo "✅ Script de melhorias aplicado com sucesso!" 