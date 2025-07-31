#!/bin/bash

echo "🧠 IMPLEMENTANDO SISTEMA AI ROBUSTO E INTELIGENTE..."
echo "======================================================"

# Parar o serviço
pm2 stop atendeai-backend

# 1. MELHORAR SERVIÇO DE MEMÓRIA COM APRESENTAÇÃO AUTOMÁTICA
cat > /root/atendeai-lify-backend/src/services/ai/conversationMemoryService.js << 'EOF'
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
    console.log(`💾 Memory saved for: ${phoneNumber}`);
  }

  static async addInteraction(phoneNumber, userMessage, botResponse, intent) {
    const memory = await this.loadMemory(phoneNumber);
    
    // Adicionar à história
    memory.history.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    memory.history.push({
      role: 'assistant', 
      content: botResponse,
      timestamp: new Date()
    });

    // Atualizar estatísticas
    memory.userProfile.lastInteraction = new Date();
    memory.userProfile.interactionCount++;
    memory.context.lastIntent = intent;
    memory.metadata.totalInteractions++;
    memory.metadata.isFirstConversation = false;

    // Calcular dias desde última interação
    if (memory.history.length > 2) {
      const lastInteraction = memory.history[memory.history.length - 4]?.timestamp;
      if (lastInteraction) {
        const daysDiff = Math.floor((new Date() - new Date(lastInteraction)) / (1000 * 60 * 60 * 24));
        memory.metadata.daysSinceLastInteraction = daysDiff;
      }
    }

    // Manter apenas últimas 20 interações para performance
    if (memory.history.length > 40) {
      memory.history = memory.history.slice(-40);
    }

    await this.saveMemory(phoneNumber, memory);
  }

  static async shouldIntroduceSelf(phoneNumber) {
    const memory = await this.loadMemory(phoneNumber);
    
    // Primeira conversa
    if (memory.metadata.isFirstConversation) {
      return true;
    }
    
    // Dias desde última interação (mais de 3 dias)
    if (memory.metadata.daysSinceLastInteraction && memory.metadata.daysSinceLastInteraction > 3) {
      return true;
    }
    
    // Poucas interações (menos de 3)
    if (memory.metadata.totalInteractions < 3) {
      return true;
    }
    
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
    console.log(`👤 Name saved for ${phoneNumber}: ${name}`);
  }

  static async getConversationContext(phoneNumber) {
    const memory = await this.loadMemory(phoneNumber);
    return {
      isFirstConversation: memory.metadata.isFirstConversation,
      daysSinceLastInteraction: memory.metadata.daysSinceLastInteraction,
      userName: memory.userProfile.name,
      totalInteractions: memory.metadata.totalInteractions,
      lastIntent: memory.context.lastIntent
    };
  }
}

module.exports = ConversationMemoryService;
EOF

# 2. MELHORAR SERVIÇO DE RECONHECIMENTO DE INTENÇÕES (EXTREMAMENTE ROBUSTO)
cat > /root/atendeai-lify-backend/src/services/ai/intentRecognitionService.js << 'EOF'
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
    
    // EXTRAÇÃO DE NOMES - PADRÕES ROBUSTOS
    const namePatterns = [
      /(?:meu nome é|sou o|sou a|me chamo|chamo-me)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:eu sou|sou)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:nome|chamo)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:chamo-me|me chamo)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i,
      /(?:sou o|sou a)\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s|,|\.|$)/i
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
EOF

# 3. MELHORAR SERVIÇO AI PRINCIPAL COM APRESENTAÇÃO AUTOMÁTICA
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
      
      // Verificar se deve se apresentar
      const shouldIntroduce = await ConversationMemoryService.shouldIntroduceSelf(phoneNumber);
      const context = await ConversationMemoryService.getConversationContext(phoneNumber);
      
      console.log(`🎯 [AI] Contexto: Primeira conversa: ${context.isFirstConversation}, Dias desde última: ${context.daysSinceLastInteraction}`);
      
      // Reconhecer intenção
      const intent = await IntentRecognitionService.recognizeIntent(message);
      
      console.log(`🎯 [AI] Intenção detectada: ${intent.name} (confiança: ${intent.confidence})`);
      console.log(`🔍 [AI] Entidades extraídas:`, intent.entities);
      
      // Salvar nome na memória se extraído
      if (intent.entities.name && !memory.userProfile.name) {
        await ConversationMemoryService.setUserName(phoneNumber, intent.entities.name);
        console.log(`💾 [AI] Nome salvo na memória: ${intent.entities.name}`);
      }
      
      // Gerar resposta baseada na intenção
      const response = await this.generateResponse(message, intent, memory, clinicId, shouldIntroduce, context);
      
      // Salvar interação
      await ConversationMemoryService.addInteraction(
        phoneNumber,
        message,
        response.response,
        intent.name
      );

      console.log(`🤖 [AI] Resposta gerada: "${response.response}"`);

      return {
        response: response.response,
        intent: intent.name,
        confidence: intent.confidence,
        entities: intent.entities,
        context: memory.context
      };
    } catch (error) {
      console.error('❌ [AI] Erro no processamento:', error);
      return {
        response: 'Desculpe, estou com dificuldades técnicas. Pode tentar novamente?',
        intent: 'ERROR',
        confidence: 0,
        entities: {},
        context: {}
      };
    }
  }

  async generateResponse(message, intent, memory, clinicId, shouldIntroduce, context) {
    console.log(`🎯 [AI] Gerando resposta para intenção: ${intent.name}`);
    
    // APRESENTAÇÃO AUTOMÁTICA
    if (shouldIntroduce && intent.name === 'GREETING') {
      return this.generateIntroductionResponse(context);
    }
    
    // Respostas baseadas em intenção
    switch (intent.name) {
      case 'APPOINTMENT_CREATE':
        return {
          response: this.generateAppointmentResponse(intent, memory)
        };
      
      case 'APPOINTMENT_RESCHEDULE':
        return {
          response: 'Entendo que você quer remarcar sua consulta. Pode me informar qual consulta e qual nova data/horário você prefere?'
        };
      
      case 'APPOINTMENT_CANCEL':
        return {
          response: 'Vou ajudá-lo a cancelar sua consulta. Pode me informar qual consulta você gostaria de cancelar?'
        };
      
      case 'INFO_HOURS':
        return {
          response: 'Nossos horários de funcionamento são: Segunda a Sexta das 8h às 18h, Sábados das 8h às 12h. Gostaria de agendar um horário?'
        };
      
      case 'INFO_LOCATION':
        return {
          response: 'Estamos localizados na Rua das Flores, 123 - Centro. Fica próximo à Praça Central. Precisa de mais informações?'
        };
      
      case 'INFO_SERVICES':
        return {
          response: 'Oferecemos as seguintes especialidades: Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Neurologia, Psiquiatria e muito mais! Qual especialidade te interessa?'
        };
      
      case 'GREETING':
        const userName = memory.userProfile.name || intent.entities.name;
        if (userName) {
          return {
            response: `Olá ${userName}! É um prazer conversar com você novamente. Como posso ajudar hoje?`
          };
        }
        return {
          response: 'Olá! Seja bem-vindo à nossa clínica. Sou o assistente virtual e estou aqui para ajudar. Como posso ser útil?'
        };
      
      case 'NAME_QUESTION':
        const storedName = memory.userProfile.name;
        if (storedName) {
          return {
            response: `Seu nome é ${storedName}! 😊`
          };
        } else {
          return {
            response: 'Ainda não sei seu nome. Pode me dizer como você se chama?'
          };
        }
      
      case 'BOT_NAME_QUESTION':
        return {
          response: 'Meu nome é AtendeAI! Sou o assistente virtual da clínica, criado para ajudar com informações e agendamentos. 😊'
        };
      
      case 'BOT_CAPABILITIES':
        return {
          response: 'Posso ajudar você com: 📋 Agendamento de consultas, 🕐 Horários de funcionamento, 📍 Localização da clínica, 👨‍⚕️ Informações sobre especialidades médicas, 💰 Preços e convênios, e muito mais! O que você gostaria de saber?'
        };
      
      case 'HOW_ARE_YOU':
        return {
          response: 'Tudo bem, obrigado por perguntar! Estou funcionando perfeitamente e pronto para ajudar. E você, como está? 😊'
        };
      
      case 'THANKS':
        return {
          response: 'Por nada! Fico feliz em poder ajudar. Se precisar de mais alguma coisa, é só falar! 😊'
        };
      
      case 'FAREWELL':
        return {
          response: 'Até logo! Foi um prazer ajudá-lo. Se precisar de mais alguma coisa, estarei aqui! 👋'
        };
      
      case 'EMERGENCY':
        return {
          response: '🚨 EMERGÊNCIA: Para casos urgentes, ligue imediatamente para 192 (SAMU) ou vá ao hospital mais próximo. Não posso atender emergências médicas.'
        };
      
      case 'HUMAN_HANDOFF':
        return {
          response: 'Entendo que você gostaria de falar com um atendente humano. Vou transferir você agora. Aguarde um momento, por favor.'
        };
      
      default:
        return {
          response: 'Entendo sua mensagem. Como posso ajudá-lo com informações sobre nossa clínica ou agendamento de consultas?'
        };
    }
  }

  generateIntroductionResponse(context) {
    if (context.isFirstConversation) {
      return {
        response: `Olá! 👋 Sou o AtendeAI, o assistente virtual da clínica. É um prazer conhecê-lo! 

Posso ajudá-lo com:
📋 Agendamento de consultas
🕐 Horários de funcionamento  
📍 Localização da clínica
👨‍⚕️ Informações sobre especialidades
💰 Preços e convênios

Como posso ser útil hoje? 😊`
      };
    } else if (context.daysSinceLastInteraction > 3) {
      return {
        response: `Olá! 👋 Que bom vê-lo novamente! 

Faz ${context.daysSinceLastInteraction} dias que não conversamos. Como posso ajudá-lo hoje? 

Posso auxiliar com agendamentos, informações sobre a clínica ou qualquer outra dúvida que você tenha! 😊`
      };
    } else {
      return {
        response: 'Olá! Seja bem-vindo de volta! Como posso ajudá-lo hoje? 😊'
      };
    }
  }

  generateAppointmentResponse(intent, memory) {
    const userName = intent.entities.name || memory.userProfile.name;
    
    if (userName) {
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento. 

Para qual especialidade você gostaria de marcar? Temos disponibilidade para:
🫀 Cardiologia
🩺 Dermatologia  
👩‍⚕️ Ginecologia
🦴 Ortopedia
👶 Pediatria
🧠 Neurologia
🧠 Psiquiatria
👁️ Oftalmologia

Qual especialidade te interessa?`;
    }
    
    return `Perfeito! Vou ajudá-lo com o agendamento. 

Primeiro, preciso saber seu nome. Pode me informar como você se chama?

Depois posso te ajudar a escolher a especialidade e horário ideal! 😊`;
  }
}

module.exports = new AIService();
EOF

# Reiniciar o serviço
pm2 restart atendeai-backend

echo "✅ SISTEMA AI ROBUSTO IMPLEMENTADO!"
echo "🧠 Novas funcionalidades:"
echo "   - Apresentação automática para primeiras conversas"
echo "   - Apresentação para conversas após 3+ dias"
echo "   - 25+ intenções para conversação natural"
echo "   - Extraction de entidades robusta"
echo "   - Memória avançada com contexto"
echo "   - Respostas personalizadas e humanizadas"
echo "   - Detecção de emergências"
echo "   - Suporte a múltiplas especialidades"

# Verificar status
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "🎯 TESTE: Agora teste estas mensagens:"
echo "📱 'Olá' (primeira vez)"
echo "📱 'Me chamo Lucas'"
echo "📱 'Qual meu nome?'"
echo "📱 'Qual seu nome?'"
echo "📱 'O que você faz?'"
echo "📱 'Tudo bem?'"
echo "🤖 O sistema agora deve responder de forma muito mais inteligente e humanizada!"
EOF 