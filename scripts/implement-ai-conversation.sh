#!/bin/bash

echo "🤖 Implementando conversação AI real..."

# Parar o serviço
pm2 stop atendeai-backend

# Criar novo server.js com AI real
cat > /root/atendeai-lify-backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Contexto de conversação
const conversationContexts = new Map();

// Função para gerar resposta AI
async function generateAIResponse(message, userId, context) {
  try {
    const systemPrompt = `Você é um assistente virtual de uma clínica médica. 
    Seja natural, prestativo e profissional. 
    Contexto do usuário: ${JSON.stringify(context)}
    Histórico: ${context.conversationHistory?.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n') || 'Nenhum'}
    
    Responda de forma natural e útil. Se o usuário mencionar agendamento, ofereça ajuda com isso.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na AI:', error.message);
    return 'Desculpe, estou com dificuldades técnicas. Como posso ajudá-lo?';
  }
}

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
    console.log('✅ Mensagem enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    return null;
  }
}

// Função para extrair nome do usuário
function extractUserName(message) {
  const namePatterns = [
    /meu nome é (\w+)/i,
    /sou o (\w+)/i,
    /sou a (\w+)/i,
    /chamo-me (\w+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Função para detectar intenção
function detectIntent(message) {
  const intents = {
    'agendamento': ['agendar', 'marcar', 'consulta', 'agendamento', 'horário'],
    'horários': ['horário', 'funcionamento', 'aberto', 'fechado'],
    'informações': ['informação', 'dúvida', 'pergunta'],
    'ajuda': ['ajuda', 'ajudar', 'preciso']
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return 'conversa';
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

// Webhook para WhatsApp
app.post('/webhook/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook] Mensagem recebida:', JSON.stringify(req.body, null, 2));
    
    if (req.body.entry && req.body.entry.length > 0) {
      const entry = req.body.entry[0];
      
      if (entry.changes && entry.changes.length > 0) {
        const change = entry.changes[0];
        
        if (change.value && change.value.messages && change.value.messages.length > 0) {
          const message = change.value.messages[0];
          const userPhone = message.from;
          const userMessage = message.text?.body || '';
          
          console.log(`[Webhook] Processando: "${userMessage}" de ${userPhone}`);
          
          // Inicializar contexto se não existir
          if (!conversationContexts.has(userPhone)) {
            conversationContexts.set(userPhone, {
              userName: null,
              currentIntent: null,
              conversationHistory: [],
              userPreferences: {}
            });
          }
          
          const context = conversationContexts.get(userPhone);
          
          // Extrair nome se mencionado
          const extractedName = extractUserName(userMessage);
          if (extractedName && !context.userName) {
            context.userName = extractedName;
            console.log(`[Context] Nome extraído: ${extractedName}`);
          }
          
          // Detectar intenção
          const intent = detectIntent(userMessage);
          context.currentIntent = intent;
          
          // Adicionar à conversa
          context.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          });
          
          // Gerar resposta AI
          const aiResponse = await generateAIResponse(userMessage, userPhone, context);
          
          // Adicionar resposta à conversa
          context.conversationHistory.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          });
          
          console.log(`[AI] Resposta gerada: ${aiResponse}`);
          
          // Enviar resposta
          const sendResult = await sendWhatsAppMessage(userPhone, aiResponse);
          
          if (sendResult) {
            console.log('[Webhook] ✅ Resposta enviada com sucesso');
            return res.status(200).json({
              success: true,
              message: 'Webhook processado e resposta enviada',
              aiResponse: aiResponse,
              context: {
                userName: context.userName,
                intent: context.currentIntent,
                conversationLength: context.conversationHistory.length
              }
            });
          } else {
            console.error('[Webhook] ❌ Erro ao enviar resposta');
            return res.status(500).json({
              success: false,
              error: 'Erro ao enviar resposta via WhatsApp'
            });
          }
        }
      }
    }
    
    return res.status(200).json({ success: true, message: 'Webhook recebido' });
  } catch (error) {
    console.error('[Webhook] ❌ Erro:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Rota de teste
app.get('/webhook/whatsapp-meta/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook WhatsApp funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota para ver contexto
app.get('/context/:phone', (req, res) => {
  const phone = req.params.phone;
  const context = conversationContexts.get(phone);
  
  if (context) {
    res.json({
      success: true,
      context: context
    });
  } else {
    res.json({
      success: false,
      message: 'Contexto não encontrado'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`📱 Webhook: http://localhost:${PORT}/webhook/whatsapp-meta`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
EOF

# Atualizar .env com OpenAI
cat >> /root/atendeai-lify-backend/.env << 'EOF'

# OpenAI API
OPENAI_API_KEY=sua_chave_openai_aqui
EOF

echo "✅ Servidor atualizado com AI real!"
echo "⚠️  IMPORTANTE: Adicione sua chave OpenAI no arquivo .env"
echo "🔑 Obtenha em: https://platform.openai.com/api-keys"

# Reiniciar o serviço
pm2 restart atendeai-backend

echo "🔄 Serviço reiniciado!"
echo "📊 Verificando status..."

sleep 3

# Verificar se está funcionando
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ AI implementada!"
echo "🎯 Agora o sistema terá conversas mais naturais!" 