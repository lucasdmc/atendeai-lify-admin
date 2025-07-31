// ========================================
// CONFIGURAÇÃO DAS APIS AI
// ========================================

export interface AIConfig {
  openai: {
    apiKey: string;
    organization?: string;
    baseURL?: string;
  };
  anthropic: {
    apiKey: string;
    baseURL?: string;
  };
  google: {
    apiKey: string;
    projectId: string;
  };
  azure: {
    apiKey: string;
    endpoint: string;
    deploymentName: string;
  };
  whisper: {
    apiKey: string; // OpenAI Whisper
  };
  tts: {
    apiKey: string; // OpenAI TTS
  };
  embeddings: {
    apiKey: string; // OpenAI Embeddings
  };
}

// Configuração padrão
export const defaultAIConfig: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    organization: process.env.OPENAI_ORG_ID,
    baseURL: process.env.OPENAI_BASE_URL,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    baseURL: process.env.ANTHROPIC_BASE_URL,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    projectId: process.env.GOOGLE_PROJECT_ID || '',
  },
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
  },
  whisper: {
    apiKey: process.env.OPENAI_API_KEY || '', // Usa mesma chave do OpenAI
  },
  tts: {
    apiKey: process.env.OPENAI_API_KEY || '', // Usa mesma chave do OpenAI
  },
  embeddings: {
    apiKey: process.env.OPENAI_API_KEY || '', // Usa mesma chave do OpenAI
  },
};

// Modelos disponíveis
export const AI_MODELS = {
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  GEMINI_PRO: 'gemini-pro',
  GEMINI_FLASH: 'gemini-1.5-flash',
} as const;

// Configurações de rate limiting
export const RATE_LIMITS = {
  FREE: { requests: 10, window: 60000 }, // 10 requests/min
  BASIC: { requests: 100, window: 60000 }, // 100 requests/min
  PREMIUM: { requests: 1000, window: 60000 }, // 1000 requests/min
  ENTERPRISE: { requests: 10000, window: 60000 }, // 10000 requests/min
} as const;

// Configurações de cache
export const CACHE_CONFIG = {
  SIMILARITY_THRESHOLD: 0.85,
  MAX_CACHE_SIZE: 10000,
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 horas
} as const;

// Configurações de streaming
export const STREAMING_CONFIG = {
  CHUNK_SIZE: 50,
  DELAY_BETWEEN_CHUNKS: 100,
  MAX_TOKENS_PER_CHUNK: 100,
} as const;

// Configurações de validação médica
export const MEDICAL_VALIDATION_CONFIG = {
  DANGEROUS_KEYWORDS: [
    'diagnóstico', 'diagnose', 'diagnosticar',
    'tratamento', 'treatment', 'medicamento', 'medication',
    'receita', 'prescription', 'dosagem', 'dosage',
    'sintoma', 'symptom', 'doença', 'disease',
    'cura', 'cure', 'terapia', 'therapy',
  ],
  MEDICAL_PHRASES: [
    'você tem', 'you have', 'você deve', 'you should',
    'você precisa', 'you need', 'recomendo', 'i recommend',
    'aconselho', 'i advise', 'prescrevo', 'i prescribe',
  ],
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  } as const,
} as const;

// Configurações de análise de emoções
export const EMOTION_CONFIG = {
  EMOTIONS: {
    JOY: 'joy',
    SADNESS: 'sadness',
    ANGER: 'anger',
    FEAR: 'fear',
    SURPRISE: 'surprise',
    DISGUST: 'disgust',
    NEUTRAL: 'neutral',
  } as const,
  INTENSITY_LEVELS: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.9,
  } as const,
} as const;

// Configurações de voz
export const VOICE_CONFIG = {
  LANGUAGES: {
    'pt-BR': 'Portuguese (Brazil)',
    'en-US': 'English (US)',
    'es-ES': 'Spanish (Spain)',
  } as const,
  VOICES: {
    ALLOY: 'alloy',
    ECHO: 'echo',
    FABLE: 'fable',
    ONYX: 'onyx',
    NOVA: 'nova',
    SHIMMER: 'shimmer',
  } as const,
  AUDIO_FORMATS: {
    MP3: 'mp3',
    WAV: 'wav',
    FLAC: 'flac',
  } as const,
} as const;

// Configurações de multimodal
export const MULTIMODAL_CONFIG = {
  SUPPORTED_TYPES: {
    IMAGE: 'image',
    DOCUMENT: 'document',
    AUDIO: 'audio',
    VIDEO: 'video',
  } as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
    AUDIO: ['mp3', 'wav', 'flac', 'm4a'],
    VIDEO: ['mp4', 'avi', 'mov', 'mkv'],
  } as const,
} as const;

export default defaultAIConfig; 