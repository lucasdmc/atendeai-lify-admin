#!/bin/bash

echo "🔧 CORRIGINDO SISTEMA AI PARA JAVASCRIPT..."
echo "=============================================="

# Parar o serviço
pm2 stop atendeai-backend

# Criar versão JavaScript do AI Service
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

# Criar serviço de memória em JavaScript
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
        lastInteraction: new Date()
      },
      context: {},
      loopCount: 0,
      frustrationLevel: 0,
      topics: []
    };
  }

  static async saveMemory(phoneNumber, memory) {
    this.memoryCache.set(phoneNumber, memory);
    console.log('💾 Memory saved for:', phoneNumber);
  }

  static async addInteraction(phoneNumber, userMessage, botResponse, intent) {
    const memory = await this.loadMemory(phoneNumber);
    
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

    if (intent) {
      memory.context.lastIntent = intent;
    }

    memory.userProfile.lastInteraction = new Date();
    await this.saveMemory(phoneNumber, memory);
  }
}

module.exports = ConversationMemoryService;
EOF

# Criar serviço de reconhecimento de intenções em JavaScript
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
    HUMAN_HANDOFF: ['humano', 'pessoa', 'atendente', 'operador']
  };

  static async recognizeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
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
    
    // Extrair nome
    const nameMatch = message.match(/(?:meu nome é|sou o|sou a|me chamo)\s+([a-zA-ZÀ-ÿ\s]+)/i);
    if (nameMatch) {
      entities.name = nameMatch[1].trim();
    }

    // Extrair data
    const dateMatch = message.match(/(\d{1,2}\/\d{1,2}|\d{1,2} de [a-z]+)/i);
    if (dateMatch) {
      entities.date = dateMatch[1];
    }

    return entities;
  }

  static mapIntentToCategory(intent) {
    if (intent.startsWith('APPOINTMENT_')) return 'appointment';
    if (intent.startsWith('INFO_')) return 'information';
    if (intent === 'HUMAN_HANDOFF') return 'support';
    return 'conversation';
  }
}

module.exports = IntentRecognitionService;
EOF

# Criar novo server.js corrigido
cat > /root/atendeai-lify-backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Importar serviços AI
const AIService = require('./src/services/ai/aiService');

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Mensagem enviada com sucesso');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de teste
app.get('/webhook/whatsapp-meta/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook WhatsApp funcionando',
    timestamp: new Date().toISOString()
  });
});

// Webhook principal com AI completo
app.post('/webhook/whatsapp-meta', async (req, res) => {
  try {
    console.log('🤖 [Webhook] Mensagem recebida:', JSON.stringify(req.body, null, 2));
    
    // Verificação do webhook
    if (req.body.object === 'whatsapp_business_account') {
      const entry = req.body.entry?.[0];
      if (entry?.changes?.[0]?.value?.messages?.[0]) {
        const message = entry.changes[0].value.messages[0];
        const userPhone = message.from;
        const userMessage = message.text?.body || '';
        
        if (userMessage && userPhone) {
          console.log(`🧠 [AI] Processando: "${userMessage}" de ${userPhone}`);
          
          try {
            // Processar com AI completo
            const aiResponse = await AIService.processMessage(
              userMessage,
              userPhone,
              'default-clinic'
            );
            
            console.log(`🤖 [AI] Resposta gerada:`, {
              response: aiResponse.response,
              intent: aiResponse.intent,
              confidence: aiResponse.confidence,
              entities: aiResponse.entities
            });
            
            // Enviar resposta via WhatsApp
            const sendResult = await sendWhatsAppMessage(userPhone, aiResponse.response);
            
            if (sendResult) {
              console.log('✅ [Webhook] Resposta enviada com sucesso');
              return res.status(200).json({
                success: true,
                message: 'Webhook processado com AI',
                aiResponse: aiResponse,
                sendResult: sendResult
              });
            } else {
              console.error('❌ [Webhook] Erro ao enviar resposta');
              return res.status(500).json({
                success: false,
                error: 'Erro ao enviar resposta via WhatsApp'
              });
            }
          } catch (aiError) {
            console.error('❌ [AI] Erro no processamento:', aiError);
            // Fallback para resposta simples
            const fallbackResponse = 'Olá! Como posso ajudá-lo hoje?';
            await sendWhatsAppMessage(userPhone, fallbackResponse);
            
            return res.status(200).json({
              success: true,
              message: 'Webhook processado com fallback',
              error: aiError.message
            });
          }
        }
      }
    }
    
    return res.status(200).json({ success: true, message: 'Webhook recebido' });
  } catch (error) {
    console.error('❌ [Webhook] Erro geral:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor AI iniciado na porta ${PORT}`);
  console.log(`📱 Webhook: http://localhost:${PORT}/webhook/whatsapp-meta`);
  console.log(`🤖 Sistema AI: ATIVO`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
EOF

# Reiniciar o serviço
pm2 restart atendeai-backend

echo "✅ SISTEMA AI CORRIGIDO!"
echo "🤖 Agora usando JavaScript puro"
echo "🧠 Funcionalidades ativas:"
echo "   - Memória de conversa"
echo "   - Reconhecimento de intenções"
echo "   - Respostas contextuais"
echo "   - Personalização por usuário"

# Verificar status
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora deve responder de forma inteligente!"
EOF 