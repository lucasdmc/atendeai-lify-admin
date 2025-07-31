// Exportar todos os serviços AI
export { default as MedicalValidationService } from './sprint1-medical-validation';
export { default as ModelEnsembleService } from './sprint2-model-ensemble';
export { default as CacheStreamingService } from './sprint3-cache-streaming';
export { default as AdvancedFeaturesService } from './sprint4-advanced-features';
export { default as AIOrchestrator } from './ai-orchestrator';

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