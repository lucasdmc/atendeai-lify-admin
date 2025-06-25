
import { ResponseContext } from './response-context-builder.ts';
import { SentimentAnalyzer } from './sentiment-analyzer.ts';
import { PersonalityAdapter } from './personality-adapter.ts';
import { TimeContextManager } from './time-context-manager.ts';
import { MedicalContextManager } from './medical-context-manager.ts';
import { ResponseContextBuilder } from './response-context-builder.ts';
import { LiaPersonality } from './lia-personality.ts';

export class ResponsePromptGenerator {
  static generateContextualPrompt(context: ResponseContext): string {
    const { memory, sentiment, timeContext, userMessage } = context;
    
    // Verificar se é primeiro contato
    const isFirstContact = LiaPersonality.isFirstContact(memory);
    
    if (isFirstContact) {
      // Atualizar memória para indicar que não é mais primeiro contato
      LiaPersonality.updateFirstContactMemory(memory);
      
      // Retornar prompt específico para primeiro contato
      return this.generateFirstContactPrompt();
    }

    const empathyPhrase = LiaPersonality.generateEmpatheticResponse(sentiment.primaryEmotion);
    const personalityAdaptation = PersonalityAdapter.getPersonalityAdaptation(memory);
    const relationshipContext = PersonalityAdapter.getRelationshipContext(memory);
    const timeContextStr = TimeContextManager.getTimeContextDescription(timeContext);
    const medicalContext = MedicalContextManager.getMedicalContext(memory);
    const specificContext = ResponseContextBuilder.getSpecificContext(memory, userMessage);

    return `${LiaPersonality.getLiaInstructions()}

CONTEXTO PESSOAL DO PACIENTE:
${relationshipContext}

PERSONALIDADE E ESTILO ADAPTADO:
${personalityAdaptation}

CONTEXTO TEMPORAL:
${timeContextStr}

CONTEXTO MÉDICO E HISTÓRICO:
${medicalContext}

ANÁLISE EMOCIONAL DA MENSAGEM:
- Emoção primária: ${sentiment.primaryEmotion}
- Intensidade: ${sentiment.intensity}
- Urgência: ${sentiment.urgencyLevel}
- Tom de resposta apropriado: ${sentiment.responseTone}
- Estado emocional: ${sentiment.emotionalState}
${sentiment.medicalConcern ? '- ATENÇÃO: Preocupação médica detectada' : ''}

RESPOSTA EMPÁTICA SUGERIDA:
${empathyPhrase}

DIRETRIZES ESPECÍFICAS DA LIA:
✅ Responda como a Lia - assistente carinhosa da clínica
✅ Use tom natural e acolhedor
✅ Faça uma pergunta por vez quando necessário
✅ Use emojis com moderação (😊, 💙, 🙏)
✅ Mantenha frases curtas e claras
✅ Demonstre interesse genuíno
✅ Se não souber algo, ofereça verificar com a equipe
✅ JAMAIS revele que é uma IA

CONTEXTO ESPECÍFICO DESTA CONVERSA:
${specificContext}

Responda como a Lia responderia - natural, empática e profissional, mantendo a fluidez da conversa.`;
  }

  private static generateFirstContactPrompt(): string {
    return `${LiaPersonality.getLiaInstructions()}

SITUAÇÃO: PRIMEIRO CONTATO
Esta é a primeira vez que este paciente entra em contato conosco.

INSTRUÇÃO ESPECÍFICA:
Responda EXATAMENTE com uma das mensagens de saudação da Lia:
- Cumprimente com simpatia
- Se apresente como Lia
- Pergunte o nome da pessoa
- Pergunte como ela está se sentindo
- Ofereça ajuda

Use uma das variações de saudação preparadas ou crie uma similar seguindo o padrão estabelecido.

EXEMPLO:
"Oi, bom dia! 😊
Sou a Lia, assistente aqui da clínica.
Com quem eu tenho o prazer de falar? E como você está hoje? 💙
Me conta como posso te ajudar!"

Responda como a Lia faria no primeiro contato.`;
  }
}
