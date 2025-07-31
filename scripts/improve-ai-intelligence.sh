#!/bin/bash

echo "🧠 MELHORANDO INTELIGÊNCIA DO SISTEMA AI..."
echo "=============================================="

# Parar o serviço
pm2 stop atendeai-backend

# Melhorar serviço de reconhecimento de intenções
cat > /root/atendeai-lify-backend/src/services/ai/intentRecognitionService.js << 'EOF'
class IntentRecognitionService {
  static INTENT_KEYWORDS = {
    APPOINTMENT_CREATE: ['agendar', 'marcar', 'consulta', 'agendamento', 'horário'],
    APPOINTMENT_RESCHEDULE: ['remarcar', 'alterar', 'mudar', 'reagendar'],
    APPOINTMENT_CANCEL: ['cancelar', 'desmarcar', 'cancelamento'],
    INFO_HOURS: ['horário', 'funcionamento', 'aberto', 'fechado', 'horários'],
    INFO_LOCATION: ['endereço', 'localização', 'onde', 'rua', 'bairro'],
    INFO_SERVICES: ['serviços', 'especialidades', 'médicos', 'tratamentos'],
    GREETING: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'],
    FAREWELL: ['tchau', 'até logo', 'obrigado', 'valeu'],
    HUMAN_HANDOFF: ['humano', 'pessoa', 'atendente', 'operador'],
    NAME_QUESTION: ['qual meu nome', 'meu nome', 'quem sou eu', 'como me chamo'],
    BOT_NAME_QUESTION: ['qual seu nome', 'como você se chama', 'quem é você', 'seu nome'],
    BOT_CAPABILITIES: ['o que você faz', 'para que serve', 'suas capacidades', 'pode fazer', 'funcionalidades'],
    CONVERSATION_TEST: ['testar', 'conversação', 'capacidade', 'inteligência'],
    THANKS: ['obrigado', 'valeu', 'agradeço', 'obrigada'],
    HOW_ARE_YOU: ['tudo bem', 'como vai', 'como está', 'tudo bom']
  };

  static async recognizeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Verificar intenções específicas primeiro
    for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return {
            name: intent,
            confidence: 0.8,
            entities: this.extractEntities(message),
            requiresAction: intent.startsWith('APPOINTMENT_'),
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
    
    // Extrair nome - padrões mais abrangentes
    const namePatterns = [
      /(?:meu nome é|sou o|sou a|me chamo|chamo-me)\s+([a-zA-ZÀ-ÿ\s]+)/i,
      /(?:eu sou|sou)\s+([a-zA-ZÀ-ÿ\s]+)/i,
      /(?:nome|chamo)\s+([a-zA-ZÀ-ÿ\s]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.name = match[1].trim();
        break;
      }
    }

    // Extrair data
    const dateMatch = message.match(/(\d{1,2}\/\d{1,2}|\d{1,2} de [a-z]+)/i);
    if (dateMatch) {
      entities.date = dateMatch[1];
    }

    // Extrair especialidade médica
    const specialties = ['cardiologia', 'dermatologia', 'ginecologia', 'ortopedia', 'pediatria'];
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
    if (intent === 'HUMAN_HANDOFF') return 'support';
    if (intent.includes('NAME_') || intent.includes('BOT_')) return 'conversation';
    return 'conversation';
  }
}

module.exports = IntentRecognitionService;
EOF

# Melhorar serviço AI principal
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
      
      // Reconhecer intenção
      const intent = await IntentRecognitionService.recognizeIntent(message);
      
      console.log(`🎯 [AI] Intenção detectada: ${intent.name} (confiança: ${intent.confidence})`);
      console.log(`🔍 [AI] Entidades extraídas:`, intent.entities);
      
      // Salvar nome na memória se extraído
      if (intent.entities.name && !memory.userProfile.name) {
        memory.userProfile.name = intent.entities.name;
        console.log(`💾 [AI] Nome salvo na memória: ${intent.entities.name}`);
      }
      
      // Gerar resposta baseada na intenção
      const response = await this.generateResponse(message, intent, memory, clinicId);
      
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

  async generateResponse(message, intent, memory, clinicId) {
    console.log(`🎯 [AI] Gerando resposta para intenção: ${intent.name}`);
    
    // Respostas baseadas em intenção
    switch (intent.name) {
      case 'APPOINTMENT_CREATE':
        return {
          response: this.generateAppointmentResponse(intent, memory)
        };
      
      case 'INFO_HOURS':
        return {
          response: 'Nossos horários de funcionamento são: Segunda a Sexta das 8h às 18h, Sábados das 8h às 12h. Gostaria de agendar um horário?'
        };
      
      case 'INFO_LOCATION':
        return {
          response: 'Estamos localizados na Rua das Flores, 123 - Centro. Fica próximo à Praça Central. Precisa de mais informações?'
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
          response: 'Posso ajudar você com: 📋 Agendamento de consultas, 🕐 Horários de funcionamento, 📍 Localização da clínica, 👨‍⚕️ Informações sobre especialidades médicas, e muito mais! O que você gostaria de saber?'
        };
      
      case 'CONVERSATION_TEST':
        return {
          response: 'Estou aqui para testar minha capacidade de conversação! Posso ajudar com informações da clínica, agendamentos e responder suas perguntas. Como posso ser útil? 🤖'
        };
      
      case 'HOW_ARE_YOU':
        return {
          response: 'Tudo bem, obrigado por perguntar! Estou funcionando perfeitamente e pronto para ajudar. E você, como está? 😊'
        };
      
      case 'THANKS':
        return {
          response: 'Por nada! Fico feliz em poder ajudar. Se precisar de mais alguma coisa, é só falar! 😊'
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

  generateAppointmentResponse(intent, memory) {
    const userName = intent.entities.name || memory.userProfile.name;
    
    if (userName) {
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento. Para qual especialidade você gostaria de marcar? Temos disponibilidade para: Cardiologia, Dermatologia, Ginecologia, Ortopedia e Pediatria.`;
    }
    
    return 'Perfeito! Vou ajudá-lo com o agendamento. Primeiro, preciso saber seu nome. Pode me informar?';
  }
}

module.exports = new AIService();
EOF

# Reiniciar o serviço
pm2 restart atendeai-backend

echo "✅ INTELIGÊNCIA MELHORADA!"
echo "🧠 Novas funcionalidades:"
echo "   - Detecção de perguntas sobre nome"
echo "   - Detecção de perguntas sobre o bot"
echo "   - Melhor extração de entidades"
echo "   - Memória ativa para nomes"
echo "   - Respostas mais inteligentes"

# Verificar status
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "🎯 TESTE: Agora teste estas mensagens:"
echo "📱 'Me chamo Lucas'"
echo "📱 'Qual meu nome?'"
echo "📱 'Qual seu nome?'"
echo "📱 'O que você faz?'"
echo "🤖 O sistema agora deve responder de forma muito mais inteligente!" 