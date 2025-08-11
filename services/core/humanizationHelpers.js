/**
 * Sistema de Humanização de Mensagens - AtendeAI Lify
 * Arquivo: services/humanizationHelpers.js
 * 
 * Sistema completo para humanização de conversas em chatbots médicos
 * - Detecção emocional avançada
 * - Temperatura dinâmica baseada no contexto
 * - Variações linguísticas para evitar robotização
 * - Formatação otimizada para WhatsApp
 * - Personalização baseada no perfil do usuário
 */

import OpenAI from 'openai';

export default class HumanizationHelpers {
  
  /**
   * Calcula temperatura dinâmica baseada no contexto conversacional
   * @param {Object} intent - Intenção detectada pelo sistema
   * @param {Object} emotionalContext - Contexto emocional do usuário
   * @param {Object} conversationState - Estado atual da conversa
   * @returns {number} Temperatura otimizada (0.3-0.95)
   */
  static calculateDynamicTemperature(intent, emotionalContext, conversationState) {
    console.log('🌡️ Calculando temperatura dinâmica:', {
      intent: intent?.name || 'unknown',
      emotion: emotionalContext?.primary || 'neutral',
      state: conversationState?.phase || 'initial'
    });

    // Temperatura base por categoria de intenção
    let baseTemperature = 0.7;
    
    if (intent?.category) {
      switch (intent.category) {
        case 'conversation':
        case 'greeting':
          baseTemperature = 0.85; // Mais criativo para conversas
          break;
        case 'appointment':
        case 'scheduling':
          baseTemperature = 0.75; // Equilibrado para agendamentos
          break;
        case 'information':
        case 'medical_info':
          baseTemperature = 0.6; // Mais preciso para informações
          break;
        case 'support':
        case 'help':
          baseTemperature = 0.8; // Empático para suporte
          break;
        case 'emergency':
        case 'urgent':
          baseTemperature = 0.5; // Direto e claro para emergências
          break;
        default:
          baseTemperature = 0.7;
      }
    }

    // Ajustes baseados no contexto emocional
    if (emotionalContext?.primary) {
      switch (emotionalContext.primary) {
        case 'anxiety':
        case 'worried':
          baseTemperature = Math.min(baseTemperature + 0.15, 0.9); // Mais empático
          break;
        case 'urgency':
        case 'emergency':
          baseTemperature = Math.max(baseTemperature - 0.2, 0.4); // Mais direto
          break;
        case 'frustration':
        case 'angry':
          baseTemperature = Math.min(baseTemperature + 0.1, 0.85); // Mais compreensivo
          break;
        case 'satisfaction':
        case 'happy':
          baseTemperature = Math.min(baseTemperature + 0.05, 0.8); // Ligeiramente mais caloroso
          break;
        case 'confusion':
        case 'lost':
          baseTemperature = Math.max(baseTemperature - 0.1, 0.5); // Mais claro e didático
          break;
      }
    }

    // Ajustes baseados no estado da conversa
    if (conversationState) {
      if (conversationState.isFirstInteraction) {
        baseTemperature = Math.min(baseTemperature + 0.1, 0.9); // Mais acolhedor
      }
      if (conversationState.hasErrors) {
        baseTemperature = Math.min(baseTemperature + 0.1, 0.9); // Mais empático após erros
      }
      if (conversationState.isRepeatedQuestion) {
        baseTemperature = Math.min(baseTemperature + 0.15, 0.95); // Mais variado para evitar repetição
      }
      if (conversationState.phase === 'advanced') {
        baseTemperature = Math.max(baseTemperature - 0.05, 0.6); // Mais eficiente em conversas longas
      }
    }

    const finalTemperature = Math.max(0.3, Math.min(0.95, baseTemperature));
    
    console.log('🌡️ Temperatura calculada:', {
      base: baseTemperature,
      final: finalTemperature,
      reasoning: this.getTemperatureReasoning(intent, emotionalContext, conversationState)
    });

    return finalTemperature;
  }

  /**
   * Fornece explicação para a temperatura calculada
   */
  static getTemperatureReasoning(intent, emotionalContext, conversationState) {
    const reasons = [];
    
    if (intent?.category === 'emergency') reasons.push('emergência detectada');
    if (emotionalContext?.primary === 'anxiety') reasons.push('usuário ansioso');
    if (conversationState?.isFirstInteraction) reasons.push('primeira interação');
    if (conversationState?.hasErrors) reasons.push('erros anteriores');
    
    return reasons.length > 0 ? reasons.join(', ') : 'configuração padrão';
  }

  /**
   * Detecta contexto emocional da mensagem do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} memory - Memória da conversa
   * @returns {Object} Contexto emocional detectado
   */
  static async detectEmotionalContext(message, memory = {}) {
    try {
      console.log('🎭 Detectando contexto emocional para:', message.substring(0, 50) + '...');
      
      // Análise por palavras-chave (rápida)
      const keywordAnalysis = this.analyzeEmotionalKeywords(message);
      
      // Análise contextual com histórico
      const contextualAnalysis = this.analyzeEmotionalContext(message, memory);
      
      // Análise LLM para casos complexos ou baixa confiança
      let llmAnalysis = null;
      if (keywordAnalysis.confidence < 0.7 || contextualAnalysis.complexity > 0.8) {
        llmAnalysis = await this.performLLMEmotionalAnalysis(message, memory);
      }
      
      // Combinar análises para resultado final
      const finalContext = this.combineEmotionalAnalyses(
        keywordAnalysis, 
        contextualAnalysis, 
        llmAnalysis
      );
      
      console.log('🎭 Contexto emocional detectado:', {
        primary: finalContext.primary,
        confidence: finalContext.confidence,
        intensity: finalContext.intensity
      });
      
      return finalContext;
      
    } catch (error) {
      console.error('❌ Erro na detecção emocional:', error);
      return { 
        primary: 'neutral', 
        confidence: 0.5, 
        intensity: 0.5,
        error: error.message 
      };
    }
  }

  /**
   * Análise emocional baseada em palavras-chave e padrões
   */
  static analyzeEmotionalKeywords(message) {
    const emotionalPatterns = {
      anxiety: {
        keywords: [
          'preocupado', 'ansioso', 'nervoso', 'medo', 'receio',
          'apreensivo', 'inquieto', 'tenso', 'aflito', 'angustiado',
          'inseguro', 'assustado', 'temeroso'
        ],
        phrases: [
          'estou preocupado', 'tenho medo', 'fico ansioso',
          'me deixa nervoso', 'estou receoso', 'não sei o que fazer',
          'estou com medo', 'me sinto inseguro'
        ],
        weight: 0.9
      },
      urgency: {
        keywords: [
          'urgente', 'rápido', 'hoje', 'agora', 'imediato',
          'pressa', 'emergência', 'logo', 'quanto antes',
          'já', 'rapidinho', 'depressa'
        ],
        phrases: [
          'é urgente', 'preciso hoje', 'o mais rápido possível',
          'tenho pressa', 'é uma emergência', 'não pode esperar',
          'preciso agora', 'é para já'
        ],
        weight: 0.95
      },
      frustration: {
        keywords: [
          'não funciona', 'problema', 'difícil', 'complicado',
          'irritado', 'chateado', 'cansado', 'desistir',
          'ruim', 'péssimo', 'horrível', 'inútil'
        ],
        phrases: [
          'não está funcionando', 'está difícil', 'não consigo',
          'estou cansado de', 'vou desistir', 'isso é um problema',
          'que complicação', 'não aguento mais'
        ],
        weight: 0.85
      },
      satisfaction: {
        keywords: [
          'obrigado', 'ótimo', 'perfeito', 'excelente',
          'maravilhoso', 'adorei', 'gostei', 'satisfeito',
          'bom', 'legal', 'bacana', 'show'
        ],
        phrases: [
          'muito obrigado', 'ficou ótimo', 'adorei o atendimento',
          'estou satisfeito', 'superou expectativas', 'muito bom',
          'gostei muito', 'está perfeito'
        ],
        weight: 0.8
      },
      confusion: {
        keywords: [
          'não entendi', 'confuso', 'dúvida', 'como assim',
          'não sei', 'perdido', 'explicar melhor',
          'não compreendi', 'meio perdido'
        ],
        phrases: [
          'não entendi bem', 'estou confuso', 'pode explicar',
          'não sei como', 'estou perdido', 'não compreendi',
          'me explica melhor', 'como funciona'
        ],
        weight: 0.75
      },
      pain: {
        keywords: [
          'dor', 'doendo', 'machuca', 'sofrendo',
          'incomoda', 'lateja', 'queima', 'arde'
        ],
        phrases: [
          'estou com dor', 'está doendo', 'sinto dor',
          'dói muito', 'não aguento a dor'
        ],
        weight: 0.9
      }
    };

    const lowerMessage = message.toLowerCase();
    const detectedEmotions = {};

    Object.entries(emotionalPatterns).forEach(([emotion, pattern]) => {
      let score = 0;
      let matches = 0;

      // Verificar palavras-chave
      pattern.keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          score += pattern.weight;
          matches++;
        }
      });

      // Verificar frases (peso maior)
      pattern.phrases.forEach(phrase => {
        if (lowerMessage.includes(phrase)) {
          score += pattern.weight * 1.5;
          matches++;
        }
      });

      if (matches > 0) {
        detectedEmotions[emotion] = {
          score: score,
          matches: matches,
          confidence: Math.min(score / 2, 1)
        };
      }
    });

    // Encontrar emoção primária
    const primaryEmotion = Object.entries(detectedEmotions)
      .sort(([,a], [,b]) => b.score - a.score)[0];

    if (!primaryEmotion) {
      return { 
        primary: 'neutral', 
        confidence: 0.8, 
        intensity: 0.5,
        method: 'keyword_analysis'
      };
    }

    return {
      primary: primaryEmotion[0],
      confidence: primaryEmotion[1].confidence,
      intensity: Math.min(primaryEmotion[1].score / 3, 1),
      allEmotions: detectedEmotions,
      method: 'keyword_analysis'
    };
  }

  /**
   * Análise contextual considerando histórico da conversa
   */
  static analyzeEmotionalContext(message, memory) {
    const analysis = {
      complexity: 0.5,
      hasHistory: memory?.history?.length > 0,
      recentEmotions: [],
      contextualFactors: []
    };

    if (memory?.history?.length > 0) {
      // Analisar últimas 3 mensagens para padrões emocionais
      const recentMessages = memory.history.slice(-3);
      
      recentMessages.forEach(msg => {
        if (msg.role === 'user') {
          const quickAnalysis = this.analyzeEmotionalKeywords(msg.content);
          if (quickAnalysis.primary !== 'neutral') {
            analysis.recentEmotions.push(quickAnalysis.primary);
          }
        }
      });

      // Verificar se há padrão de frustração crescente
      if (analysis.recentEmotions.filter(e => e === 'frustration').length >= 2) {
        analysis.contextualFactors.push('escalating_frustration');
        analysis.complexity = 0.9;
      }

      // Verificar se há repetição de perguntas
      const userMessages = recentMessages.filter(m => m.role === 'user');
      if (userMessages.length >= 2) {
        const similarity = this.calculateMessageSimilarity(
          userMessages[userMessages.length - 1].content,
          userMessages[userMessages.length - 2].content
        );
        if (similarity > 0.7) {
          analysis.contextualFactors.push('repeated_question');
          analysis.complexity = 0.8;
        }
      }
    }

    // Verificar indicadores de urgência médica
    const urgencyIndicators = [
      'dor no peito', 'falta de ar', 'tontura', 'desmaio',
      'sangramento', 'febre alta', 'vômito', 'dor forte'
    ];
    
    if (urgencyIndicators.some(indicator => 
      message.toLowerCase().includes(indicator))) {
      analysis.contextualFactors.push('medical_urgency');
      analysis.complexity = 0.9;
    }

    return analysis;
  }

  /**
   * Análise LLM para casos complexos
   */
  static async performLLMEmotionalAnalysis(message, memory) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_API_BASE
      });
      
      const recentHistory = memory?.history?.slice(-3) || [];
      const historyText = recentHistory
        .map(h => `${h.role}: ${h.content}`)
        .join('\n');

      const prompt = `Analise o contexto emocional desta mensagem de um paciente contatando uma clínica médica.

Mensagem atual: "${message}"

Histórico recente da conversa:
${historyText || 'Sem histórico anterior'}

Retorne um JSON com:
{
  "primary_emotion": "anxiety|urgency|frustration|satisfaction|confusion|pain|neutral",
  "intensity": 0.0-1.0,
  "confidence": 0.0-1.0,
  "reasoning": "explicação breve",
  "medical_urgency": true/false,
  "response_tone": "empathetic|reassuring|efficient|celebratory|clarifying|professional|urgent"
}

Foque no contexto médico - pacientes podem estar preocupados com saúde, frustrados com processos, ou com urgência sobre sintomas.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Resposta vazia da API');
      }

      const analysis = JSON.parse(response);

      return {
        primary: analysis.primary_emotion,
        confidence: analysis.confidence,
        intensity: analysis.intensity,
        reasoning: analysis.reasoning,
        medicalUrgency: analysis.medical_urgency,
        recommendedTone: analysis.response_tone,
        method: 'llm_analysis'
      };

    } catch (error) {
      console.error('❌ Erro na análise LLM emocional:', error);
      return null;
    }
  }

  /**
   * Combina diferentes análises emocionais
   */
  static combineEmotionalAnalyses(keywordAnalysis, contextualAnalysis, llmAnalysis) {
    // Se temos análise LLM com alta confiança, priorizá-la
    if (llmAnalysis && llmAnalysis.confidence > 0.8) {
      return {
        ...llmAnalysis,
        contextualFactors: contextualAnalysis.contextualFactors
      };
    }

    // Se análise por palavras-chave tem alta confiança, usá-la
    if (keywordAnalysis.confidence > 0.8) {
      return {
        ...keywordAnalysis,
        contextualFactors: contextualAnalysis.contextualFactors
      };
    }

    // Combinar análises com pesos
    const finalAnalysis = { ...keywordAnalysis };
    
    // Ajustar baseado em fatores contextuais
    if (contextualAnalysis.contextualFactors.includes('escalating_frustration')) {
      finalAnalysis.primary = 'frustration';
      finalAnalysis.intensity = Math.min(finalAnalysis.intensity + 0.3, 1);
    }
    
    if (contextualAnalysis.contextualFactors.includes('medical_urgency')) {
      finalAnalysis.primary = 'urgency';
      finalAnalysis.intensity = Math.min(finalAnalysis.intensity + 0.4, 1);
    }

    // Usar análise LLM como backup se disponível
    if (llmAnalysis && finalAnalysis.confidence < 0.6) {
      return {
        ...llmAnalysis,
        contextualFactors: contextualAnalysis.contextualFactors
      };
    }

    return {
      ...finalAnalysis,
      contextualFactors: contextualAnalysis.contextualFactors
    };
  }

  /**
   * Calcula similaridade entre mensagens
   */
  static calculateMessageSimilarity(msg1, msg2) {
    const words1 = msg1.toLowerCase().split(/\s+/);
    const words2 = msg2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 2
    );
    
    const totalUniqueWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalUniqueWords;
  }

  /**
   * Sistema de variações linguísticas para evitar robotização
   */
  static getConversationalVariations() {
    return {
      greetings: {
        first_time: [
          "Oi! 😊 Eu sou o assistente virtual da {clinicName}!",
          "Olá! Tudo bem? Sou o assistente da {clinicName}!",
          "Oi, como vai? Assistente da {clinicName} aqui!",
          "Olá! Prazer em conhecê-lo! Sou da {clinicName}.",
          "Oi! 👋 Assistente da {clinicName} aqui para ajudar!"
        ],
        returning: [
          "Oi de novo! Como posso ajudar hoje?",
          "Olá! Que bom te ver por aqui novamente!",
          "Oi! Como você está? Em que posso ajudar?",
          "Olá! Espero que esteja bem! Como posso ajudar?",
          "Oi! Sempre um prazer falar com você!"
        ],
        time_based: {
          morning: [
            "Bom dia! ☀️ Como posso ajudar hoje?",
            "Oi! Bom dia! Em que posso ajudá-lo?",
            "Bom dia! Espero que tenha acordado bem!"
          ],
          afternoon: [
            "Boa tarde! Como está seu dia?",
            "Oi! Boa tarde! Como posso ajudar?",
            "Boa tarde! Em que posso ser útil?"
          ],
          evening: [
            "Boa noite! Como posso ajudar?",
            "Oi! Boa noite! Em que posso ajudá-lo?",
            "Boa noite! Espero que tenha tido um bom dia!"
          ]
        }
      },
      appointment_offers: {
        casual: [
          "Quer agendar uma consulta?",
          "Precisa marcar um horário?",
          "Vamos agendar sua consulta?",
          "Que tal marcarmos sua consulta?",
          "Posso ajudar com um agendamento?"
        ],
        empathetic: [
          "Vou te ajudar a agendar sua consulta!",
          "Claro! Vamos cuidar do seu agendamento!",
          "Fico feliz em ajudar com sua consulta!",
          "Vamos encontrar o melhor horário para você!",
          "Será um prazer agendar sua consulta!"
        ],
        urgent: [
          "Vou verificar os horários mais próximos!",
          "Entendo a urgência, vamos agendar rapidinho!",
          "Vou encontrar o primeiro horário disponível!",
          "Vamos resolver isso o quanto antes!"
        ]
      },
      confirmations: {
        positive: [
          "Perfeito! ✅",
          "Ótimo! 👍",
          "Excelente!",
          "Maravilha!",
          "Combinado! 🤝",
          "Show!",
          "Beleza!"
        ],
        understanding: [
          "Entendi!",
          "Compreendo!",
          "Certo!",
          "Ah, sim!",
          "Perfeito, entendi!",
          "Claro!",
          "Sim, entendi!"
        ]
      },
      empathy_expressions: {
        anxiety: [
          "Entendo sua preocupação...",
          "Compreendo que deve estar ansioso...",
          "É natural se sentir assim...",
          "Vamos resolver isso juntos...",
          "Sei que pode ser preocupante...",
          "Compreendo sua ansiedade..."
        ],
        frustration: [
          "Peço desculpas pela dificuldade...",
          "Entendo sua frustração...",
          "Vamos resolver isso de forma mais simples...",
          "Compreendo que deve ser chato...",
          "Sinto muito pelo inconveniente...",
          "Vou tentar facilitar para você..."
        ],
        urgency: [
          "Entendo que é urgente...",
          "Vou priorizar seu caso...",
          "Compreendo a pressa...",
          "Vamos resolver rapidamente...",
          "Sei que não pode esperar...",
          "Vou agilizar para você..."
        ],
        pain: [
          "Sinto muito que esteja sentindo dor...",
          "Compreendo que deve estar incomodando...",
          "Vamos cuidar disso rapidamente...",
          "Entendo que deve estar sofrendo...",
          "Vou te ajudar o mais rápido possível..."
        ]
      },
      transitions: [
        "Agora,",
        "Então,",
        "Bem,",
        "Certo,",
        "Perfeito,",
        "Ótimo,",
        "Beleza,"
      ],
      closings: [
        "Em que mais posso ajudar?",
        "Precisa de mais alguma coisa?",
        "Tem mais alguma dúvida?",
        "Posso ajudar com mais alguma coisa?",
        "Mais alguma coisa que posso fazer por você?"
      ]
    };
  }

  /**
   * Seleciona variação apropriada baseada no contexto
   */
  static selectVariation(category, subcategory, context = {}) {
    const variations = this.getConversationalVariations();
    let options = variations[category];
    
    if (subcategory && options[subcategory]) {
      options = options[subcategory];
    }
    
    if (!options || !Array.isArray(options)) {
      return null;
    }

    // Evitar repetições recentes
    const usedVariations = context.memory?.usedVariations || [];
    const availableOptions = options.filter(option => 
      !usedVariations.includes(option)
    );

    const finalOptions = availableOptions.length > 0 ? availableOptions : options;
    
    // Seleção inteligente baseada no contexto emocional
    let selectedIndex;
    if (context.emotionalContext?.primary === 'anxiety' && finalOptions.length > 2) {
      // Para ansiedade, preferir opções mais empáticas (últimas da lista)
      selectedIndex = Math.floor(Math.random() * 2) + Math.max(0, finalOptions.length - 2);
    } else if (context.emotionalContext?.primary === 'urgency' && finalOptions.length > 1) {
      // Para urgência, preferir opções mais diretas (primeiras da lista)
      selectedIndex = Math.floor(Math.random() * Math.min(2, finalOptions.length));
    } else {
      selectedIndex = Math.floor(Math.random() * finalOptions.length);
    }

    const selected = finalOptions[selectedIndex];
    
    // Registrar uso para evitar repetição
    if (!context.memory) context.memory = {};
    if (!context.memory.usedVariations) context.memory.usedVariations = [];
    
    context.memory.usedVariations.push(selected);
    
    // Manter apenas últimas 15 variações
    if (context.memory.usedVariations.length > 15) {
      context.memory.usedVariations = context.memory.usedVariations.slice(-15);
    }

    return selected;
  }

  /**
   * Formata resposta para otimização WhatsApp
   */
  static formatForWhatsApp(response, context = {}) {
    console.log('📱 Formatando para WhatsApp...');
    
    let formattedResponse = response;
    
    // 1. Limitar comprimento da mensagem
    formattedResponse = this.limitMessageLength(formattedResponse);
    
    // 2. Adicionar emojis contextuais
    formattedResponse = this.addContextualEmojis(formattedResponse, context);
    
    // 3. Otimizar quebras de linha
    formattedResponse = this.optimizeLineBreaks(formattedResponse);
    
    // 4. Adicionar elementos visuais
    formattedResponse = this.addVisualElements(formattedResponse);
    
    // 5. Verificação e correção final
    formattedResponse = this.finalFormatCheck(formattedResponse);
    
    console.log('📱 Formatação WhatsApp concluída');
    return formattedResponse;
  }

  /**
   * Limita comprimento da mensagem para WhatsApp
   */
  static limitMessageLength(response, maxLength = 450) {
    if (response.length <= maxLength) {
      return response;
    }
    
    // Tentar quebrar por sentenças
    const sentences = response.split(/[.!?]+/);
    let truncated = '';
    
    for (const sentence of sentences) {
      const potentialLength = truncated.length + sentence.length + 1;
      if (potentialLength > maxLength - 50) {
        break;
      }
      truncated += sentence.trim() + '. ';
    }
    
    // Se ficou muito curto, usar substring
    if (truncated.length < 100) {
      truncated = response.substring(0, maxLength - 50);
      // Tentar terminar em palavra completa
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > truncated.length - 20) {
        truncated = truncated.substring(0, lastSpace);
      }
    }
    
    // Adicionar indicação de continuação se necessário
    if (truncated.length < response.length) {
      truncated = truncated.trim();
      if (!truncated.endsWith('.') && !truncated.endsWith('!') && !truncated.endsWith('?')) {
        truncated += '.';
      }
      truncated += '\n\n💬 Quer saber mais alguma coisa?';
    }
    
    return truncated.trim();
  }

  /**
   * Adiciona emojis contextuais apropriados
   */
  static addContextualEmojis(response, context) {
    let formattedResponse = response;
    
    // Emojis baseados no contexto emocional
    if (context.emotionalContext?.primary) {
      const emojiMap = {
        anxiety: '🤗',
        satisfaction: '😊',
        urgency: '⚡',
        confusion: '💡',
        pain: '🩺',
        frustration: '😌'
      };
      
      const emoji = emojiMap[context.emotionalContext.primary];
      if (emoji && !formattedResponse.includes(emoji)) {
        // Adicionar emoji na saudação se houver
        if (formattedResponse.toLowerCase().match(/^(oi|olá|bom dia|boa tarde|boa noite)/)) {
          formattedResponse = formattedResponse.replace(
            /^(oi|olá|bom dia|boa tarde|boa noite)/i, 
            `$1 ${emoji}`
          );
        }
      }
    }
    
    // Emojis contextuais para palavras específicas
    const emojiReplacements = [
      { pattern: /\b(endereço|localização|onde fica)\b/gi, emoji: '📍' },
      { pattern: /\b(telefone|contato|ligar)\b/gi, emoji: '📞' },
      { pattern: /\b(horário|funcionamento|aberto)\b/gi, emoji: '🕒' },
      { pattern: /\b(agendamento|consulta|marcar)\b/gi, emoji: '📅' },
      { pattern: /\b(doutor|médico|doutora)\b/gi, emoji: '👨‍⚕️' },
      { pattern: /\b(exame|teste)\b/gi, emoji: '🔬' },
      { pattern: /\b(remédio|medicamento)\b/gi, emoji: '💊' }
    ];
    
    emojiReplacements.forEach(({ pattern, emoji }) => {
      formattedResponse = formattedResponse.replace(pattern, `${emoji} $&`);
    });
    
    return formattedResponse;
  }

  /**
   * Otimiza quebras de linha para mobile
   */
  static optimizeLineBreaks(response) {
    return response
      // Remover quebras excessivas
      .replace(/\n{3,}/g, '\n\n')
      // Adicionar quebra antes de listas
      .replace(/(\w)\n([•\-\d])/g, '$1\n\n$2')
      // Adicionar quebra após perguntas
      .replace(/\?\s*([A-Z])/g, '?\n\n$1')
      // Adicionar quebra antes de informações importantes
      .replace(/([.!])\s*(Endereço|Telefone|Horário|Importante|Atenção)/g, '$1\n\n$2');
  }

  /**
   * Adiciona elementos visuais para melhor legibilidade
   */
  static addVisualElements(response) {
    return response
      // Converter listas simples em bullets
      .replace(/^- /gm, '• ')
      // Converter listas numeradas em emojis
      .replace(/^(\d+)\.\s/gm, '$1️⃣ ')
      // Destacar informações importantes
      .replace(/\b(importante|atenção|obs|nota):/gi, '⚠️ $&')
      // Destacar valores monetários
      .replace(/R\$\s*(\d+(?:,\d{2})?)/g, '💰 R$ $1');
  }

  /**
   * Verificação e correção final da formatação
   */
  static finalFormatCheck(response) {
    return response
      // Normalizar espaços
      .replace(/[ \t]+/g, ' ')
      // Corrigir espaçamento antes de pontuação
      .replace(/\s+([.!?])/g, '$1')
      // Adicionar espaço após pontuação quando necessário
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      // Remover espaços no início e fim
      .trim();
  }

  /**
   * Aplica personalização baseada no perfil do usuário
   */
  static personalizeResponse(response, userProfile = {}, conversationHistory = []) {
    let personalizedResponse = response;

    // Personalização por nome
    if (userProfile?.name) {
      personalizedResponse = this.addNamePersonalization(personalizedResponse, userProfile.name);
    }

    // Personalização por histórico
    if (conversationHistory.length > 0) {
      personalizedResponse = this.addHistoryPersonalization(personalizedResponse, conversationHistory);
    }

    // Personalização por preferências (se disponível)
    if (userProfile?.preferences) {
      personalizedResponse = this.addPreferencePersonalization(personalizedResponse, userProfile.preferences);
    }

    return personalizedResponse;
  }

  /**
   * Adiciona personalização por nome
   */
  static addNamePersonalization(response, name) {
    const firstName = name.split(' ')[0];
    
    const namePatterns = [
      {
        pattern: /^(oi|olá)(!|\s)/i,
        replacement: `$1, ${firstName}$2`
      },
      {
        pattern: /(como posso ajudar|em que posso ajudar)(\?)?$/i,
        replacement: `$1 você, ${firstName}$2`
      },
      {
        pattern: /^(perfeito|ótimo|excelente)(!|\s)/i,
        replacement: `$1, ${firstName}$2`
      }
    ];

    let personalizedResponse = response;
    
    // Aplicar apenas um padrão para evitar repetição excessiva do nome
    for (const { pattern, replacement } of namePatterns) {
      if (pattern.test(personalizedResponse)) {
        personalizedResponse = personalizedResponse.replace(pattern, replacement);
        break; // Aplicar apenas o primeiro padrão que combinar
      }
    }

    return personalizedResponse;
  }

  /**
   * Adiciona personalização baseada no histórico
   */
  static addHistoryPersonalization(response, history) {
    const patterns = this.analyzeHistoryPatterns(history);
    let personalizedResponse = response;

    if (patterns.hasScheduledBefore) {
      personalizedResponse = personalizedResponse.replace(
        /vou te ajudar a agendar/i,
        'vou te ajudar a agendar novamente'
      );
    }

    if (patterns.hadIssues) {
      personalizedResponse = 'Espero que desta vez corra tudo bem! ' + personalizedResponse;
    }

    if (patterns.isFrequentUser) {
      personalizedResponse = personalizedResponse.replace(
        /^(oi|olá)/i,
        '$1! Que bom te ver por aqui novamente'
      );
    }

    if (patterns.hasAskedSameQuestion) {
      personalizedResponse = 'Como mencionei antes, ' + personalizedResponse.toLowerCase();
    }

    return personalizedResponse;
  }

  /**
   * Adiciona personalização por preferências
   */
  static addPreferencePersonalization(response, preferences) {
    let personalizedResponse = response;

    if (preferences.formalTreatment) {
      personalizedResponse = personalizedResponse
        .replace(/\bvocê\b/g, 'o senhor/a senhora')
        .replace(/\bteu\b/g, 'seu')
        .replace(/\boi\b/gi, 'Olá');
    }

    if (preferences.minimalEmojis) {
      personalizedResponse = personalizedResponse.replace(/[😊😌🤗👍✅🎉]/g, '');
    }

    return personalizedResponse;
  }

  /**
   * Analisa padrões no histórico da conversa
   */
  static analyzeHistoryPatterns(history) {
    const patterns = {
      hasScheduledBefore: false,
      hadIssues: false,
      isFrequentUser: false,
      hasAskedSameQuestion: false
    };

    if (!history || history.length === 0) {
      return patterns;
    }

    const userMessages = history.filter(h => h.role === 'user');
    
    // Verificar agendamentos anteriores
    patterns.hasScheduledBefore = userMessages.some(msg => 
      /agendar|marcar|consulta|horário/.test(msg.content.toLowerCase())
    );

    // Verificar problemas anteriores
    patterns.hadIssues = userMessages.some(msg => 
      /problema|erro|não funciona|difícil|frustrado/.test(msg.content.toLowerCase())
    );

    // Verificar se é usuário frequente
    patterns.isFrequentUser = userMessages.length > 8;

    // Verificar perguntas repetidas
    if (userMessages.length >= 2) {
      const lastMessage = userMessages[userMessages.length - 1].content;
      const previousMessages = userMessages.slice(0, -1);
      
      patterns.hasAskedSameQuestion = previousMessages.some(msg => 
        this.calculateMessageSimilarity(lastMessage, msg.content) > 0.8
      );
    }

    return patterns;
  }

  /**
   * Calcula tokens ótimos baseado no contexto
   */
  static calculateOptimalTokens(intent, emotionalContext) {
    let baseTokens = 350; // Padrão otimizado para WhatsApp
    
    // Ajustar por categoria de intenção
    if (intent?.category) {
      switch (intent.category) {
        case 'appointment':
        case 'scheduling':
          baseTokens = 400; // Mais espaço para agendamentos
          break;
        case 'information':
        case 'medical_info':
          baseTokens = 300; // Informações precisas e concisas
          break;
        case 'emergency':
        case 'urgent':
          baseTokens = 250; // Respostas diretas e rápidas
          break;
        case 'support':
        case 'help':
          baseTokens = 380; // Espaço para explicações detalhadas
          break;
      }
    }
    
    // Ajustar por contexto emocional
    if (emotionalContext?.primary) {
      switch (emotionalContext.primary) {
        case 'anxiety':
        case 'pain':
          baseTokens += 80; // Mais espaço para empatia e tranquilização
          break;
        case 'urgency':
          baseTokens -= 50; // Respostas mais diretas
          break;
        case 'confusion':
          baseTokens += 60; // Mais espaço para explicações claras
          break;
        case 'frustration':
          baseTokens += 40; // Espaço para acalmar e resolver
          break;
      }
    }
    
    // Limites para WhatsApp
    return Math.max(200, Math.min(500, baseTokens));
  }

  /**
   * Gera resposta de erro humanizada
   */
  static generateHumanizedErrorResponse(error, context = {}) {
    const errorResponses = {
      general: [
        "Ops! Tive um pequeno problema técnico. Pode tentar novamente? 😅",
        "Desculpe, algo deu errado aqui. Vamos tentar de novo?",
        "Eita! Parece que tive uma falha. Pode repetir sua mensagem?",
        "Opa! Algo não funcionou como esperado. Tenta mais uma vez?"
      ],
      api_error: [
        "Estou com dificuldade para processar sua mensagem. Pode tentar novamente?",
        "Houve um probleminha na comunicação. Vamos tentar de novo?",
        "Ops! Falha na conexão. Pode repetir, por favor?"
      ],
      timeout: [
        "Demorei um pouco para responder. Pode tentar novamente?",
        "Ops! Levei mais tempo que o esperado. Vamos tentar de novo?",
        "Desculpe a demora! Pode repetir sua mensagem?"
      ]
    };
    
    // Determinar tipo de erro
    let errorType = 'general';
    if (error.message?.includes('timeout')) errorType = 'timeout';
    if (error.message?.includes('API') || error.message?.includes('network')) errorType = 'api_error';
    
    const responses = errorResponses[errorType];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Adicionar contexto emocional se o usuário estava ansioso
    if (context.emotionalContext?.primary === 'anxiety') {
      return "Calma, não se preocupe! " + selectedResponse + " Estou aqui para ajudar! 🤗";
    }
    
    if (context.emotionalContext?.primary === 'urgency') {
      return "Desculpe pela demora! " + selectedResponse + " Vou resolver rapidinho! ⚡";
    }
    
    return selectedResponse;
  }

  /**
   * Valida e sanitiza entrada do usuário
   */
  static sanitizeUserInput(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .substring(0, 1000) // Limitar tamanho
      .replace(/[<>]/g, '') // Remover caracteres potencialmente perigosos
      .replace(/\s+/g, ' '); // Normalizar espaços
  }

  /**
   * Detecta idioma da mensagem (básico)
   */
  static detectLanguage(message) {
    const portugueseIndicators = [
      'oi', 'olá', 'bom dia', 'boa tarde', 'boa noite',
      'obrigado', 'obrigada', 'por favor', 'desculpa',
      'não', 'sim', 'como', 'quando', 'onde', 'que'
    ];
    
    const lowerMessage = message.toLowerCase();
    const matches = portugueseIndicators.filter(indicator => 
      lowerMessage.includes(indicator)
    ).length;
    
    return matches >= 2 ? 'pt-BR' : 'unknown';
  }

  /**
   * Gera estatísticas de uso para análise
   */
  static generateUsageStats(interactions = []) {
    const stats = {
      totalInteractions: interactions.length,
      emotionDistribution: {},
      temperatureAverage: 0,
      responseTimeAverage: 0,
      satisfactionScore: 0
    };

    if (interactions.length === 0) {
      return stats;
    }

    // Distribuição emocional
    interactions.forEach(interaction => {
      const emotion = interaction.emotionalContext?.primary || 'neutral';
      stats.emotionDistribution[emotion] = (stats.emotionDistribution[emotion] || 0) + 1;
    });

    // Temperatura média
    const temperatures = interactions
      .map(i => i.temperature)
      .filter(t => typeof t === 'number');
    
    if (temperatures.length > 0) {
      stats.temperatureAverage = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    }

    // Tempo de resposta médio
    const responseTimes = interactions
      .map(i => i.responseTime)
      .filter(t => typeof t === 'number');
    
    if (responseTimes.length > 0) {
      stats.responseTimeAverage = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    return stats;
  }
}

// Export padrão para ES modules

