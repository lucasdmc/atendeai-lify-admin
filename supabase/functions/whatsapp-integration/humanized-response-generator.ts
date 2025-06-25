
import { ConversationMemoryManager, ConversationMemory } from './conversation-memory.ts';
import { SentimentAnalyzer } from './sentiment-analyzer.ts';
import { ResponseContextBuilder } from './response-context-builder.ts';
import { TimeContextManager } from './time-context-manager.ts';
import { ResponsePromptGenerator } from './response-prompt-generator.ts';
import { LiaPersonality } from './lia-personality.ts';

export class HumanizedResponseGenerator {
  static async generateHumanizedResponse(
    userMessage: string,
    phoneNumber: string,
    supabase: any,
    contextData: any[],
    conversationHistory: any[]
  ): Promise<string> {
    try {
      console.log('🧠 Iniciando geração de resposta humanizada da Lia...');
      
      // Criar um mock funcional do supabase se necessário
      const workingSupabase = supabase || this.createSupabaseMock();
      
      // Carregar memória do usuário
      const memory = await ConversationMemoryManager.loadMemory(phoneNumber, workingSupabase);
      console.log('📝 Memória carregada:', !!memory);
      
      // Verificar se é primeiro contato
      const isFirstContact = LiaPersonality.isFirstContact(memory);
      console.log('👋 Primeiro contato:', isFirstContact);
      
      if (isFirstContact) {
        console.log('🎯 Gerando saudação inicial da Lia...');
        const greetingMessage = LiaPersonality.getGreetingMessage();
        
        // Marcar como não sendo mais primeiro contato
        LiaPersonality.updateFirstContactMemory(memory);
        await ConversationMemoryManager.saveMemory(phoneNumber, memory, workingSupabase);
        
        return greetingMessage;
      }
      
      // Para conversas continuadas, usar respostas diretas da Lia quando apropriado
      const isSimpleResponse = this.isSimpleMessage(userMessage);
      if (isSimpleResponse) {
        console.log('⚡ Usando resposta direta da Lia...');
        const directResponse = LiaPersonality.getFollowUpResponse(userMessage);
        
        // Atualizar memória
        ConversationMemoryManager.adaptPersonality(memory, userMessage);
        await ConversationMemoryManager.saveMemory(phoneNumber, memory, workingSupabase);
        
        return directResponse;
      }
      
      // Analisar sentimento da mensagem
      const sentiment = SentimentAnalyzer.analyzeSentiment(userMessage);
      console.log('🎭 Sentimento analisado:', sentiment.primaryEmotion);
      
      // Adaptar personalidade baseado na mensagem
      ConversationMemoryManager.adaptPersonality(memory, userMessage);
      
      // Obter contexto temporal
      const timeContext = TimeContextManager.getCurrentTimeContext();
      
      // Gerar contexto de resposta
      const responseContext = ResponseContextBuilder.buildContext(
        memory,
        sentiment,
        timeContext,
        userMessage
      );
      
      // Gerar prompt contextualizado da Lia
      const contextualPrompt = ResponsePromptGenerator.generateContextualPrompt(responseContext);
      
      // Atualizar histórico de interação
      ConversationMemoryManager.updateInteractionHistory(
        memory, 
        memory.conversationContext?.currentTopic || 'general',
        sentiment.primaryEmotion,
        'in_progress'
      );
      
      // Evoluir relacionamento baseado nas interações
      ConversationMemoryManager.evolveRelationship(memory);
      
      // Salvar memória atualizada
      await ConversationMemoryManager.saveMemory(phoneNumber, memory, workingSupabase);
      
      console.log('✅ Prompt da Lia gerado com sucesso');
      return contextualPrompt;
      
    } catch (error) {
      console.error('❌ Erro na geração de resposta da Lia:', error);
      
      // Fallback para resposta da Lia (sem desculpas)
      return this.generateLiaFallbackResponse(userMessage, contextData);
    }
  }

  private static isSimpleMessage(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Mensagens simples que merecem respostas diretas
    const simplePatterns = [
      /^(oi|olá|hi|hello)[\s!.]*$/,
      /^(agend|consulta|marcar)/,
      /^(psicolog|cardio|dermat)/,
      /^(obrigad|valeu|ok)[\s!.]*$/
    ];
    
    return simplePatterns.some(pattern => pattern.test(lowerMessage));
  }

  private static generateLiaFallbackResponse(userMessage: string, contextData: any[]): string {
    console.log('🔄 Usando resposta de fallback da Lia (sem desculpas)');
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Respostas da Lia baseadas na mensagem (SEM desculpas)
    if (lowerMessage.includes('ola') || lowerMessage.includes('oi') || lowerMessage.includes('olá')) {
      return `Oi! Que bom ter você aqui! 😊\nSou a Lia, assistente aqui da clínica.\nCom quem eu tenho o prazer de falar? E como você está hoje? 💙\nMe conta como posso te ajudar!`;
    }
    
    if (lowerMessage.includes('agend')) {
      return `Perfeito! Vou te ajudar com o agendamento 😊\nPara qual especialidade você gostaria de agendar?\nE qual data seria melhor para você? 💙`;
    }
    
    if (lowerMessage.includes('psicolog')) {
      return `Ótima escolha! Psicologia é muito importante 😊\nQual data você tem disponibilidade?\nVou verificar os horários da nossa psicóloga para você! 💙`;
    }
    
    if (lowerMessage.includes('horario') || lowerMessage.includes('horário')) {
      return `Nossos horários são de segunda a sexta, das 8h às 18h 😊\nQual dia seria melhor para você?\nVou verificar nossa disponibilidade! 💙`;
    }
    
    if (lowerMessage.includes('doutor') || lowerMessage.includes('medico') || lowerMessage.includes('médico')) {
      return `Temos profissionais excelentes! 😊\nPara qual especialidade você precisa?\nVou verificar qual médico está disponível para você 💙`;
    }

    if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
      return `Fico muito feliz em ajudar! 😊\nSe precisar de mais alguma coisa, é só me chamar.\nEstou sempre aqui para você! 💙`;
    }
    
    // Resposta padrão da Lia (SEM desculpas)
    return `Entendi! 😊\nMe conta um pouquinho mais sobre o que você precisa?\nAssim posso te ajudar da melhor forma possível 💙`;
  }

  private static createSupabaseMock() {
    return {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
          })
        }),
        upsert: (data: any, options?: any) => Promise.resolve({ data: null, error: null })
      })
    };
  }
}
