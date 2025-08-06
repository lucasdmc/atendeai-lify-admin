// Exportações dos serviços AI robustos
export { LLMOrchestratorService } from './llmOrchestratorService';
export { AIOrchestrator } from './ai-orchestrator';
export { IntentRecognitionService } from './intentRecognitionService';
export { RAGEngineService } from './ragEngineService';
export { ConversationMemoryService } from './conversationMemoryService';
export { PersonalizationService } from './personalizationService';
export { ToolCallingService } from './toolCallingService';

// Exportações dos clientes
export { AnthropicClient } from './clients/anthropic-client';
export { OpenAIClient } from './clients/openai-client';

// Exportações dos sprints
export { MedicalValidationService } from './sprint1-medical-validation';
export { ModelEnsembleService } from './sprint2-model-ensemble';
export { CacheStreamingService } from './sprint3-cache-streaming';
export { AdvancedFeaturesService } from './sprint4-advanced-features';

// Exportações dos serviços especializados
export { EmotionDetectionService } from './emotionDetectionService';
export { AdvancedPromptService } from './advancedPromptService';
export { ConfidenceService } from './confidenceService';
export { SystemPromptGenerator } from './systemPromptGenerator';

// Exportar tipos
export type {
  MedicalValidationResult,
  LGPDLogEntry,
  ConfidenceScore
} from './sprint1-medical-validation';

export type {
  ModelEnsembleEntry,
  PromptEntry,
  RateLimitEntry
} from './sprint2-model-ensemble';

export type {
  CacheEntry,
  StreamingMetrics,
  InteractionEntry
} from './sprint3-cache-streaming';

export type {
  EmotionAnalysis,
  ProactiveSuggestion,
  MultimodalAnalysis,
  VoiceInput,
  VoiceResponse
} from './sprint4-advanced-features';

export type {
  AIRequest,
  AIResponse
} from './ai-orchestrator';

// Re-export para facilitar importação
export * from './sprint1-medical-validation';
export * from './sprint2-model-ensemble';
export * from './sprint3-cache-streaming';
export * from './sprint4-advanced-features';
export * from './ai-orchestrator';
export * from './llmOrchestratorService';
export * from './conversationMemoryService';
export * from './ragEngineService';
export * from './personalizationService';
export * from './intentRecognitionService';
export * from './toolCallingService'; 