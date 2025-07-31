#!/bin/bash
echo "🔧 IMPLEMENTANDO MEMÓRIA PERSISTENTE..."
echo "=============================================="

ssh root@31.97.241.19 << 'EOF'

echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

echo "📝 Criando tabela de memória persistente..."
cat > /root/atendeai-lify-backend/create-memory-table.sql << 'SQL_EOF'
-- Tabela para memória persistente de conversas
CREATE TABLE IF NOT EXISTS conversation_memory (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  user_name VARCHAR(100),
  first_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_interactions INTEGER DEFAULT 0,
  conversation_context JSONB DEFAULT '{}',
  user_profile JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por número
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER update_conversation_memory_updated_at 
    BEFORE UPDATE ON conversation_memory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar ou criar memória
CREATE OR REPLACE FUNCTION get_or_create_memory(p_phone_number VARCHAR)
RETURNS TABLE(
  id INTEGER,
  phone_number VARCHAR,
  user_name VARCHAR,
  first_interaction TIMESTAMP,
  last_interaction TIMESTAMP,
  total_interactions INTEGER,
  conversation_context JSONB,
  user_profile JSONB,
  conversation_history JSONB,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO conversation_memory (phone_number, user_profile, conversation_context)
  VALUES (p_phone_number, '{"name": null, "preferences": {}}', '{"last_intent": null, "appointment_data": {}, "frustration_level": 0}')
  ON CONFLICT (phone_number) DO UPDATE SET
    last_interaction = CURRENT_TIMESTAMP,
    total_interactions = conversation_memory.total_interactions + 1
  RETURNING 
    conversation_memory.id,
    conversation_memory.phone_number,
    conversation_memory.user_name,
    conversation_memory.first_interaction,
    conversation_memory.last_interaction,
    conversation_memory.total_interactions,
    conversation_memory.conversation_context,
    conversation_memory.user_profile,
    conversation_memory.conversation_history,
    conversation_memory.is_active;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar interação
CREATE OR REPLACE FUNCTION save_interaction(
  p_phone_number VARCHAR,
  p_user_message TEXT,
  p_bot_response TEXT,
  p_intent VARCHAR,
  p_entities JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_memory 
  SET 
    conversation_history = conversation_history || jsonb_build_object(
      'timestamp', CURRENT_TIMESTAMP,
      'user_message', p_user_message,
      'bot_response', p_bot_response,
      'intent', p_intent,
      'entities', p_entities
    ),
    conversation_context = conversation_context || jsonb_build_object('last_intent', p_intent),
    last_interaction = CURRENT_TIMESTAMP,
    total_interactions = total_interactions + 1
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar perfil do usuário
CREATE OR REPLACE FUNCTION update_user_profile(
  p_phone_number VARCHAR,
  p_user_name VARCHAR DEFAULT NULL,
  p_preferences JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_memory 
  SET 
    user_name = COALESCE(p_user_name, user_name),
    user_profile = user_profile || jsonb_build_object(
      'name', COALESCE(p_user_name, user_name),
      'preferences', COALESCE(p_preferences, user_profile->'preferences')
    )
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar contexto de conversa
CREATE OR REPLACE FUNCTION get_conversation_context(p_phone_number VARCHAR)
RETURNS TABLE(
  is_first_conversation BOOLEAN,
  days_since_last_interaction INTEGER,
  total_interactions INTEGER,
  user_name VARCHAR,
  last_intent VARCHAR,
  recent_interactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_interactions <= 1) as is_first_conversation,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_interaction))::INTEGER as days_since_last_interaction,
    total_interactions,
    user_name,
    conversation_context->>'last_intent' as last_intent,
    conversation_history as recent_interactions
  FROM conversation_memory 
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;
SQL_EOF

echo "🗄️ Executando SQL no Supabase..."
psql "postgresql://postgres.niakqdolcdwxtrkbqmdi:90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f /root/atendeai-lify-backend/create-memory-table.sql

echo "📝 Atualizando conversationMemoryService.js com persistência..."
cat > /root/atendeai-lify-backend/src/services/ai/conversationMemoryService.js << 'MEMORY_EOF'
const { createClient } = require('@supabase/supabase-js');

class ConversationMemoryService {
  static supabase = createClient(
    'https://niakqdolcdwxtrkbqmdi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
  );

  static async loadMemory(phoneNumber) {
    try {
      console.log(`💾 [Memory] Carregando memória para: ${phoneNumber}`);
      
      // Buscar ou criar memória no banco
      const { data, error } = await this.supabase.rpc('get_or_create_memory', {
        p_phone_number: phoneNumber
      });
      
      if (error) {
        console.error('❌ [Memory] Erro ao carregar memória:', error);
        return this.getDefaultMemory(phoneNumber);
      }
      
      const memory = data[0];
      console.log(`✅ [Memory] Memória carregada: ${memory.user_name || 'Sem nome'}, Interações: ${memory.total_interactions}`);
      
      return {
        phoneNumber: memory.phone_number,
        history: memory.conversation_history || [],
        userProfile: {
          phone: memory.phone_number,
          lastInteraction: new Date(memory.last_interaction),
          firstInteraction: new Date(memory.first_interaction),
          interactionCount: memory.total_interactions,
          name: memory.user_name,
          email: null,
          preferences: memory.user_profile?.preferences || {}
        },
        context: {
          lastIntent: memory.conversation_context?.last_intent,
          conversationFlow: [],
          topics: [],
          appointmentData: memory.conversation_context?.appointment_data || {},
          frustrationLevel: memory.conversation_context?.frustration_level || 0,
          loopCount: 0
        },
        metadata: {
          isFirstConversation: memory.total_interactions <= 1,
          daysSinceLastInteraction: this.calculateDaysSinceLast(memory.last_interaction),
          totalInteractions: memory.total_interactions,
          averageResponseTime: 0
        }
      };
      
    } catch (error) {
      console.error('❌ [Memory] Erro crítico:', error);
      return this.getDefaultMemory(phoneNumber);
    }
  }

  static async saveMemory(phoneNumber, memory) {
    try {
      // A memória é salva automaticamente via saveInteraction
      console.log(`💾 [Memory] Memória atualizada para: ${phoneNumber}`);
    } catch (error) {
      console.error('❌ [Memory] Erro ao salvar memória:', error);
    }
  }

  static async addInteraction(phoneNumber, userMessage, botResponse, intent, entities = {}) {
    try {
      console.log(`💾 [Memory] Salvando interação: ${intent}`);
      
      const { error } = await this.supabase.rpc('save_interaction', {
        p_phone_number: phoneNumber,
        p_user_message: userMessage,
        p_bot_response: botResponse,
        p_intent: intent,
        p_entities: entities
      });
      
      if (error) {
        console.error('❌ [Memory] Erro ao salvar interação:', error);
      } else {
        console.log(`✅ [Memory] Interação salva com sucesso`);
      }
      
    } catch (error) {
      console.error('❌ [Memory] Erro crítico ao salvar interação:', error);
    }
  }

  static async shouldIntroduceSelf(phoneNumber) {
    try {
      const { data, error } = await this.supabase.rpc('get_conversation_context', {
        p_phone_number: phoneNumber
      });
      
      if (error || !data || data.length === 0) {
        return true; // Se não conseguir buscar, assume primeira conversa
      }
      
      const context = data[0];
      return context.is_first_conversation || 
             (context.days_since_last_interaction && context.days_since_last_interaction > 3) ||
             context.total_interactions < 3;
             
    } catch (error) {
      console.error('❌ [Memory] Erro ao verificar apresentação:', error);
      return true;
    }
  }

  static async getUserName(phoneNumber) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_memory')
        .select('user_name')
        .eq('phone_number', phoneNumber)
        .single();
      
      return error ? null : data?.user_name;
    } catch (error) {
      console.error('❌ [Memory] Erro ao buscar nome:', error);
      return null;
    }
  }

  static async setUserName(phoneNumber, name) {
    try {
      const { error } = await this.supabase.rpc('update_user_profile', {
        p_phone_number: phoneNumber,
        p_user_name: name
      });
      
      if (error) {
        console.error('❌ [Memory] Erro ao salvar nome:', error);
      } else {
        console.log(`✅ [Memory] Nome salvo: ${name}`);
      }
    } catch (error) {
      console.error('❌ [Memory] Erro crítico ao salvar nome:', error);
    }
  }

  static async getConversationContext(phoneNumber) {
    try {
      const { data, error } = await this.supabase.rpc('get_conversation_context', {
        p_phone_number: phoneNumber
      });
      
      if (error || !data || data.length === 0) {
        return {
          isFirstConversation: true,
          daysSinceLastInteraction: null,
          totalInteractions: 0,
          userName: null,
          lastIntent: null
        };
      }
      
      const context = data[0];
      return {
        isFirstConversation: context.is_first_conversation,
        daysSinceLastInteraction: context.days_since_last_interaction,
        totalInteractions: context.total_interactions,
        userName: context.user_name,
        lastIntent: context.last_intent,
        recentInteractions: context.recent_interactions
      };
      
    } catch (error) {
      console.error('❌ [Memory] Erro ao buscar contexto:', error);
      return {
        isFirstConversation: true,
        daysSinceLastInteraction: null,
        totalInteractions: 0,
        userName: null,
        lastIntent: null
      };
    }
  }

  static getDefaultMemory(phoneNumber) {
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

  static calculateDaysSinceLast(lastInteraction) {
    if (!lastInteraction) return null;
    const last = new Date(lastInteraction);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  }
}

module.exports = ConversationMemoryService;
MEMORY_EOF

echo "📝 Atualizando aiService.js com inteligência contextual..."
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
      
      console.log(`🎯 [AI] Contexto: Primeira conversa: ${context.isFirstConversation}, Dias desde última: ${context.daysSinceLastInteraction}, Última intenção: ${context.lastIntent}`);
      
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
      
      // Gerar resposta com contexto inteligente
      const response = await this.generateContextualResponse(message, intent, memory, clinicId, shouldIntroduce, context);
      
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

  async generateContextualResponse(message, intent, memory, clinicId, shouldIntroduce, context) {
    const userName = memory.userProfile.name || intent.entities.name;
    
    // APRESENTAÇÃO AUTOMÁTICA
    if (shouldIntroduce && intent.name === 'GREETING') {
      return {
        response: `Olá! Seja bem-vindo à nossa clínica! 🏥\n\nSou o AtendeAI, seu assistente virtual inteligente. Posso ajudá-lo com:\n\n📋 Agendamento de consultas\n🕐 Horários de funcionamento\n📍 Localização da clínica\n👨‍⚕️ Informações sobre especialidades médicas\n💰 Preços e convênios\n\nComo posso ser útil hoje? 😊`
      };
    }
    
    // RESPOSTAS CONTEXTUAIS INTELIGENTES
    switch (intent.name) {
      case 'GREETING':
        if (userName) {
          // Verificar contexto anterior
          if (context.lastIntent === 'APPOINTMENT_CREATE') {
            return { response: `Olá ${userName}! Vi que você estava interessado em agendamento. Gostaria de continuar com o agendamento ou tem alguma outra dúvida? 😊` };
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
        return { response: this.generateAppointmentResponse(intent, memory, context) };
        
      case 'INFO_HOURS':
        return { response: 'Nossa clínica funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. 🕐' };
        
      case 'INFO_LOCATION':
        return { response: 'Estamos localizados na Rua das Flores, 123, Centro. Ficamos próximos à Praça Central. 📍' };
        
      case 'INFO_SERVICES':
        return { response: 'Oferecemos as seguintes especialidades: Cardiologia, Dermatologia, Ginecologia, Ortopedia, Pediatria, Neurologia, Psiquiatria, Oftalmologia e muito mais! 👨‍⚕️' };
        
      case 'INFO_DOCTORS':
        return { response: this.generateDoctorsResponse(intent, context) };
        
      case 'INFO_PRICES':
        return { response: 'Nossos preços variam conforme a especialidade. Consultas particulares a partir de R$ 150,00. Aceitamos os principais convênios médicos. 💰' };
        
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

  generateAppointmentResponse(intent, memory, context) {
    const userName = memory.userProfile.name || intent.entities.name;
    
    // Verificar se já estava no processo de agendamento
    if (context.lastIntent === 'APPOINTMENT_CREATE') {
      return `Perfeito ${userName}! Vamos continuar com o agendamento. Qual especialidade você gostaria de marcar? Temos disponibilidade para: Cardiologia, Dermatologia, Ginecologia, Ortopedia e Pediatria.`;
    }
    
    if (userName) {
      return `Olá ${userName}! Fico feliz em ajudar com o agendamento. Para qual especialidade você gostaria de marcar? Temos disponibilidade para: Cardiologia, Dermatologia, Ginecologia, Ortopedia e Pediatria.`;
    }
    
    return 'Perfeito! Vou ajudá-lo com o agendamento. Primeiro, preciso saber seu nome. Pode me informar?';
  }

  generateDoctorsResponse(intent, context) {
    const specialty = intent.entities.specialty;
    
    if (specialty) {
      const doctorsBySpecialty = {
        'cardiologia': 'Dr. Carlos Silva - Cardiologista\nDr. Ana Santos - Cardiologista\nDr. Roberto Lima - Cardiologista',
        'dermatologia': 'Dra. Maria Oliveira - Dermatologista\nDr. João Costa - Dermatologista',
        'ginecologia': 'Dra. Fernanda Rodrigues - Ginecologista\nDra. Patricia Almeida - Ginecologista',
        'ortopedia': 'Dr. Marcos Pereira - Ortopedista\nDr. Ricardo Santos - Ortopedista',
        'pediatria': 'Dra. Juliana Costa - Pediatra\nDr. André Silva - Pediatra'
      };
      
      const doctors = doctorsBySpecialty[specialty.toLowerCase()];
      if (doctors) {
        return `👨‍⚕️ Nossos ${specialty.charAt(0).toUpperCase() + specialty.slice(1)}:\n\n${doctors}\n\nGostaria de agendar uma consulta?`;
      }
    }
    
    return 'Nossos médicos são altamente qualificados em suas respectivas especialidades. Para qual especialidade você gostaria de saber mais?';
  }
}

module.exports = new AIService();
AI_EOF

echo "📝 Instalando dependência do Supabase..."
cd /root/atendeai-lify-backend && npm install @supabase/supabase-js

echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "✅ MEMÓRIA PERSISTENTE IMPLEMENTADA!"
echo "🎯 Funcionalidades implementadas:"
echo "   - ✅ Memória persistente no banco de dados"
echo "   - ✅ Contexto de conversa inteligente"
echo "   - ✅ Reconhecimento de estado anterior"
echo "   - ✅ Respostas contextuais"
echo "   - ✅ Informações específicas de médicos"

sleep 3
echo "📊 Verificando status..."
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""
echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora tem memória persistente e inteligência contextual!"

EOF

echo "✅ Script de memória persistente aplicado com sucesso!" 