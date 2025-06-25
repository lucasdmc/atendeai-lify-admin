
interface SentimentAnalysis {
  primaryEmotion: 'joy' | 'anxiety' | 'frustration' | 'urgency' | 'satisfaction' | 'neutral' | 'concern';
  intensity: 'low' | 'medium' | 'high';
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  medicalConcern: boolean;
  emotionalState: 'calm' | 'worried' | 'stressed' | 'excited' | 'confused';
  responseTone: 'supportive' | 'reassuring' | 'professional' | 'urgent' | 'empathetic';
}

export class SentimentAnalyzer {
  private static urgentWords = [
    'urgente', 'emergência', 'dor forte', 'muito mal', 'não consigo', 
    'preciso agora', 'imediato', 'grave', 'sério', 'preocupado'
  ];

  private static anxietyWords = [
    'preocupado', 'ansioso', 'nervoso', 'medo', 'receio', 
    'inseguro', 'aflito', 'tenso', 'angustiado'
  ];

  private static frustrationWords = [
    'irritado', 'chateado', 'decepcionado', 'cansado', 'estressado',
    'não funciona', 'problema', 'dificuldade', 'complicado'
  ];

  private static satisfactionWords = [
    'obrigado', 'muito bom', 'excelente', 'perfeito', 'adorei',
    'satisfeito', 'feliz', 'melhor', 'ótimo', 'maravilhoso'
  ];

  private static medicalConcernWords = [
    'dor', 'sintoma', 'doente', 'mal-estar', 'febre', 'médico',
    'consulta', 'remédio', 'tratamento', 'exame', 'resultado'
  ];

  static analyzeSentiment(message: string): SentimentAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // Detectar urgência
    const urgencyLevel = this.detectUrgency(lowerMessage);
    
    // Detectar emoção primária
    const primaryEmotion = this.detectPrimaryEmotion(lowerMessage);
    
    // Detectar intensidade
    const intensity = this.detectIntensity(lowerMessage, primaryEmotion);
    
    // Detectar preocupação médica
    const medicalConcern = this.detectMedicalConcern(lowerMessage);
    
    // Determinar estado emocional
    const emotionalState = this.determineEmotionalState(primaryEmotion, intensity);
    
    // Determinar tom de resposta apropriado
    const responseTone = this.determineResponseTone(primaryEmotion, urgencyLevel, medicalConcern);

    return {
      primaryEmotion,
      intensity,
      urgencyLevel,
      medicalConcern,
      emotionalState,
      responseTone
    };
  }

  private static detectUrgency(message: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentMatches = this.urgentWords.filter(word => message.includes(word)).length;
    const hasExclamation = (message.match(/!/g) || []).length;
    const hasAllCaps = /[A-Z]{3,}/.test(message);

    if (urgentMatches >= 2 || hasAllCaps || hasExclamation >= 3) {
      return 'urgent';
    } else if (urgentMatches >= 1 || hasExclamation >= 2) {
      return 'high';
    } else if (hasExclamation >= 1) {
      return 'medium';
    }
    return 'low';
  }

  private static detectPrimaryEmotion(message: string): SentimentAnalysis['primaryEmotion'] {
    const anxietyScore = this.anxietyWords.filter(word => message.includes(word)).length;
    const frustrationScore = this.frustrationWords.filter(word => message.includes(word)).length;
    const satisfactionScore = this.satisfactionWords.filter(word => message.includes(word)).length;
    const urgencyScore = this.urgentWords.filter(word => message.includes(word)).length;

    if (satisfactionScore > 0 && satisfactionScore >= Math.max(anxietyScore, frustrationScore)) {
      return 'satisfaction';
    } else if (urgencyScore > 0 && urgencyScore >= Math.max(anxietyScore, frustrationScore)) {
      return 'urgency';
    } else if (anxietyScore > 0 && anxietyScore >= frustrationScore) {
      return 'anxiety';
    } else if (frustrationScore > 0) {
      return 'frustration';
    } else if (message.includes('?') && message.split('?').length > 2) {
      return 'concern';
    }

    return 'neutral';
  }

  private static detectIntensity(message: string, emotion: string): 'low' | 'medium' | 'high' {
    const intensifiers = ['muito', 'super', 'extremamente', 'bastante', 'demais', 'insuportável'];
    const hasIntensifier = intensifiers.some(word => message.includes(word));
    const hasRepetition = /(.)\1{2,}/.test(message); // letras repetidas
    const hasMultipleExclamation = (message.match(/!/g) || []).length >= 2;

    if (emotion === 'urgency' || emotion === 'frustration') {
      return hasIntensifier || hasRepetition || hasMultipleExclamation ? 'high' : 'medium';
    }

    if (hasIntensifier && (hasRepetition || hasMultipleExclamation)) {
      return 'high';
    } else if (hasIntensifier || hasRepetition || hasMultipleExclamation) {
      return 'medium';
    }

    return 'low';
  }

  private static detectMedicalConcern(message: string): boolean {
    return this.medicalConcernWords.some(word => message.includes(word));
  }

  private static determineEmotionalState(
    emotion: SentimentAnalysis['primaryEmotion'], 
    intensity: 'low' | 'medium' | 'high'
  ): SentimentAnalysis['emotionalState'] {
    switch (emotion) {
      case 'anxiety':
      case 'concern':
        return intensity === 'high' ? 'stressed' : 'worried';
      case 'frustration':
        return intensity === 'high' ? 'stressed' : 'confused';
      case 'urgency':
        return 'stressed';
      case 'satisfaction':
      case 'joy':
        return 'excited';
      default:
        return 'calm';
    }
  }

  private static determineResponseTone(
    emotion: SentimentAnalysis['primaryEmotion'],
    urgency: 'low' | 'medium' | 'high' | 'urgent',
    medicalConcern: boolean
  ): SentimentAnalysis['responseTone'] {
    if (urgency === 'urgent' || emotion === 'urgency') {
      return 'urgent';
    } else if (medicalConcern && (emotion === 'anxiety' || emotion === 'concern')) {
      return 'reassuring';
    } else if (emotion === 'frustration') {
      return 'supportive';
    } else if (emotion === 'anxiety' || emotion === 'concern') {
      return 'empathetic';
    } else {
      return 'professional';
    }
  }

  static generateEmpatheticResponse(sentiment: SentimentAnalysis): string {
    const empathyPhrases = {
      anxiety: [
        "Entendo sua preocupação,",
        "Sei que isso pode ser angustiante,",
        "É normal se sentir assim,"
      ],
      frustration: [
        "Percebo que isso está sendo frustrante para você,",
        "Compreendo sua situação,",
        "Vamos resolver isso juntos,"
      ],
      urgency: [
        "Vou te ajudar imediatamente,",
        "Entendo que é urgente,",
        "Vamos cuidar disso agora,"
      ],
      satisfaction: [
        "Fico feliz em saber disso!",
        "Que bom que está satisfeito!",
        "É um prazer ajudar!"
      ],
      concern: [
        "Sua preocupação é compreensível,",
        "Vamos esclarecer isso,",
        "Estou aqui para ajudar,"
      ]
    };

    const phrases = empathyPhrases[sentiment.primaryEmotion] || [""];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}
