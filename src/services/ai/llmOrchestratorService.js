// src/services/ai/llmOrchestratorService.js
// Versão JavaScript para compatibilidade com Node.js

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

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
      
      // Detectar intenção básica
      const intent = await this.detectIntent(message);
      
      // Buscar contexto da clínica
      const clinicContext = await this.getClinicContext();
      
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

      const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

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
          userProfile: { name: 'Usuário' },
          conversationContext: { lastIntent: intent.name }
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

  static async loadConversationMemory(phoneNumber) {
    try {
      console.log('🔍 Carregando memória para:', phoneNumber);
      
      const { data } = await supabase
        .from('conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      console.log('✅ Memória carregada:', data ? 'encontrada' : 'não encontrada');
      if (data?.memory_data) {
        console.log('  - Histórico:', data.memory_data.history?.length || 0, 'mensagens');
        console.log('  - UserProfile:', data.memory_data.userProfile?.name || 'sem nome');
      }

      return data?.memory_data || { history: [], userProfile: {} };
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
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  static async detectIntent(message) {
    try {
      const prompt = `Analise a mensagem e classifique a intenção principal.

Mensagem: "${message}"

Classifique em uma das seguintes categorias:
- GREETING: Saudações, olá, bom dia, etc.
- APPOINTMENT: Agendamento, consulta, marcação, etc.
- INFORMATION: Informações sobre serviços, horários, localização, etc.
- SUPPORT: Ajuda, suporte, problemas, etc.
- GOODBYE: Despedidas, tchau, até logo, etc.

Responda apenas com o nome da categoria.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
      });

      const intentName = completion.choices[0]?.message?.content?.trim() || 'GREETING';

      return {
        name: intentName,
        confidence: 0.8,
        entities: {},
        requiresAction: false,
        category: this.getCategoryFromIntent(intentName)
      };

    } catch (error) {
      console.error('Error detecting intent:', error);
      return {
        name: 'GREETING',
        confidence: 0.5,
        entities: {},
        requiresAction: false,
        category: 'general'
      };
    }
  }

  static getCategoryFromIntent(intentName) {
    const categories = {
      'GREETING': 'general',
      'APPOINTMENT': 'appointment',
      'INFORMATION': 'information',
      'SUPPORT': 'support',
      'GOODBYE': 'general'
    };
    return categories[intentName] || 'general';
  }

  static async getClinicContext() {
    try {
      const { data } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .single();

      return {
        name: data?.name || 'Clínica Médica',
        address: data?.address || '',
        phone: data?.phone || '',
        services: []
      };
    } catch (error) {
      return {
        name: 'Clínica Médica',
        address: '',
        phone: '',
        services: []
      };
    }
  }

  static prepareSystemPrompt(clinicContext, userProfile = null) {
    let prompt = `Você é uma recepcionista virtual da ${clinicContext.name}.
Sua personalidade é: profissional, empática e prestativa

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empática
3. Para agendamentos, oriente o usuário sobre o processo
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. NUNCA invente informações ou dê conselhos médicos
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa
8. Se o usuário perguntar sobre seu nome e você souber, responda com o nome dele

INFORMAÇÕES DA CLÍNICA:
- Nome: ${clinicContext.name}
- Endereço: ${clinicContext.address}
- Telefone: ${clinicContext.phone}`;

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
      const recentHistory = memory.history.slice(-6);
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
} 