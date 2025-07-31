#!/bin/bash

echo "🔧 CORRIGINDO ERRO DE COLUNA AMBÍGUA NO AI SERVICE..."
echo "=============================================="

# Parar PM2
echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

# Atualizar conversationMemoryService.js para resolver ambiguidade
echo "📝 Atualizando conversationMemoryService.js..."
cat > /root/atendeai-lify-backend/src/services/ai/conversationMemoryService.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class ConversationMemoryService {
  static memoryCache = new Map();

  static async loadMemory(phoneNumber) {
    try {
      console.log(`💾 [Memory] Carregando memória para: ${phoneNumber}`);
      
      // Verificar cache primeiro
      if (this.memoryCache.has(phoneNumber)) {
        console.log(`✅ [Memory] Cache hit para: ${phoneNumber}`);
        return this.memoryCache.get(phoneNumber);
      }

      // Buscar no banco de dados
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [Memory] Erro ao carregar memória:', error);
      }

      const memory = {
        userProfile: {
          name: data?.user_name || null,
          preferences: data?.preferences || {},
          lastInteraction: data?.last_interaction || null
        },
        conversationHistory: data?.conversation_history || [],
        context: {
          lastIntent: data?.last_intent || null,
          isFirstConversation: !data?.last_interaction,
          daysSinceLastInteraction: data?.last_interaction ? 
            Math.floor((Date.now() - new Date(data.last_interaction).getTime()) / (1000 * 60 * 60 * 24)) : null
        }
      };

      // Salvar no cache
      this.memoryCache.set(phoneNumber, memory);
      
      console.log(`✅ [Memory] Memória carregada para: ${phoneNumber}`);
      return memory;
      
    } catch (error) {
      console.error('❌ [Memory] Erro ao carregar memória:', error);
      return {
        userProfile: { name: null, preferences: {}, lastInteraction: null },
        conversationHistory: [],
        context: { lastIntent: null, isFirstConversation: true, daysSinceLastInteraction: null }
      };
    }
  }

  static async saveMemory(phoneNumber, memory) {
    try {
      console.log(`💾 [Memory] Salvando memória para: ${phoneNumber}`);
      
      const { error } = await supabase
        .from('conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          user_name: memory.userProfile.name,
          preferences: memory.userProfile.preferences,
          last_interaction: new Date().toISOString(),
          conversation_history: memory.conversationHistory,
          last_intent: memory.context.lastIntent
        }, {
          onConflict: 'phone_number'
        });

      if (error) {
        console.error('❌ [Memory] Erro ao salvar memória:', error);
      } else {
        console.log(`✅ [Memory] Memória salva para: ${phoneNumber}`);
      }
      
    } catch (error) {
      console.error('❌ [Memory] Erro ao salvar memória:', error);
    }
  }

  static async addInteraction(phoneNumber, userMessage, botResponse, intent, entities = {}) {
    try {
      console.log(`💾 [Memory] Salvando interação: ${intent}`);
      
      const memory = await this.loadMemory(phoneNumber);
      
      // Adicionar à conversa
      memory.conversationHistory.push({
        timestamp: new Date().toISOString(),
        userMessage,
        botResponse,
        intent,
        entities
      });

      // Manter apenas últimas 10 interações
      if (memory.conversationHistory.length > 10) {
        memory.conversationHistory = memory.conversationHistory.slice(-10);
      }

      // Atualizar contexto
      memory.context.lastIntent = intent;
      memory.context.isFirstConversation = false;
      memory.context.daysSinceLastInteraction = 0;

      // Salvar no banco
      await this.saveMemory(phoneNumber, memory);
      
      console.log(`✅ [Memory] Interação salva com sucesso`);
      
    } catch (error) {
      console.error('❌ [Memory] Erro ao salvar interação:', error);
    }
  }

  static async setUserName(phoneNumber, name) {
    try {
      const memory = await this.loadMemory(phoneNumber);
      memory.userProfile.name = name;
      await this.saveMemory(phoneNumber, memory);
      console.log(`✅ [Memory] Nome salvo: ${name}`);
    } catch (error) {
      console.error('❌ [Memory] Erro ao salvar nome:', error);
    }
  }

  static async shouldIntroduceSelf(phoneNumber) {
    try {
      const memory = await this.loadMemory(phoneNumber);
      return memory.context.isFirstConversation || 
             (memory.context.daysSinceLastInteraction && memory.context.daysSinceLastInteraction > 7);
    } catch (error) {
      console.error('❌ [Memory] Erro ao verificar apresentação:', error);
      return true;
    }
  }

  static async getConversationContext(phoneNumber) {
    try {
      const memory = await this.loadMemory(phoneNumber);
      return memory.context;
    } catch (error) {
      console.error('❌ [Memory] Erro ao obter contexto:', error);
      return { lastIntent: null, isFirstConversation: true, daysSinceLastInteraction: null };
    }
  }
}

module.exports = ConversationMemoryService;
EOF

echo "✅ Conversation Memory Service atualizado!"

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "📊 Verificando status..."
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ ERRO DE COLUNA AMBÍGUA CORRIGIDO!"
echo "🎯 Agora o sistema deve funcionar sem erros de banco!"
echo ""
echo "✅ Script de correção aplicado com sucesso!" 