
// ========================================
// CONFIGURAÇÃO DE AMBIENTE PRODUÇÃO
// ========================================

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'WHATSAPP_META_ACCESS_TOKEN',
  'WHATSAPP_META_PHONE_NUMBER_ID',
  'WEBHOOK_VERIFY_TOKEN'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`);
  }
  
  console.log('✅ Todas as variáveis de ambiente estão configuradas');
  return true;
}

export function getEnvironmentConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: process.env.SUPABASE_ANON_KEY
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    whatsapp: {
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID,
      verifyToken: process.env.WEBHOOK_VERIFY_TOKEN
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      enableConsole: process.env.NODE_ENV !== 'production'
    }
  };
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

export default {
  validateEnvironment,
  getEnvironmentConfig,
  isProduction,
  isDevelopment
};
