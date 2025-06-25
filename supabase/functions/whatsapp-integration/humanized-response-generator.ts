
import { ConversationMemoryManager, ConversationMemory } from './conversation-memory.ts';
import { SentimentAnalyzer } from './sentiment-analyzer.ts';
import { ResponseContextBuilder } from './response-context-builder.ts';
import { TimeContextManager } from './time-context-manager.ts';
import { ResponsePromptGenerator } from './response-prompt-generator.ts';

export class HumanizedResponseGenerator {
  static async generateHumanizedResponse(
    userMessage: string,
    phoneNumber: string,
    supabase: any,
    contextData: any[],
    conversationHistory: any[]
  ): Promise<string> {
    try {
      console.log('🧠 Iniciando geração de resposta humanizada...');
      
      // Criar um mock funcional do supabase se necessário
      const workingSupabase = supabase || this.createSupabaseMock();
      
      // Carregar memória do usuário
      const memory = await ConversationMemoryManager.loadMemory(phoneNumber, workingSupabase);
      console.log('📝 Memória carregada:', !!memory);
      
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
      
      // Gerar prompt contextualizado
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
      
      console.log('✅ Prompt humanizado gerado com sucesso');
      return contextualPrompt;
      
    } catch (error) {
      console.error('❌ Erro na geração de resposta humanizada:', error);
      
      // Fallback para prompt básico
      return this.generateBasicPrompt(userMessage, contextData);
    }
  }

  private static generateBasicPrompt(userMessage: string, contextData: any[]): string {
    console.log('🔄 Usando prompt básico como fallback');
    
    let systemPrompt = `Você é Dra. Ana, uma atendente virtual empática e experiente de uma clínica médica.

CONTEXTO DA CLÍNICA:`;

    if (contextData && contextData.length > 0) {
      contextData.forEach((item) => {
        if (item.answer) {
          systemPrompt += `\n- ${item.question}: ${item.answer}`;
        }
      });
    } else {
      systemPrompt += `\n- Esta é uma clínica médica que oferece diversos serviços de saúde.`;
    }

    systemPrompt += `\n\nCOMO RESPONDER:
✅ Seja natural e conversacional
✅ Demonstre empatia genuína
✅ Use tom acolhedor e profissional
✅ Responda de forma clara e direta
✅ Evite respostas mecânicas
✅ Mantenha foco no paciente

Responda à mensagem do paciente de forma humana e empática.`;

    return systemPrompt;
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
