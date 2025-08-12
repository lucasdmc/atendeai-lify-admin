import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente uma única vez
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    const message = `Config error: missing required env vars: ${missing.join(', ')}`;
    throw new Error(message);
  }
}

// Executa validação no carregamento do módulo
validateEnv();

// Constantes e padrões não sensíveis
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const OPENAI_BASE_URL = process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL || undefined;
const HTTP_DEFAULT_TIMEOUT_MS = Number(process.env.HTTP_DEFAULT_TIMEOUT_MS || 15000);

// Expor uma factory para o cliente do Supabase (evita compartilhar estado indesejado)
function getSupabaseClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL,
  WHATSAPP_API_VERSION,
  HTTP_DEFAULT_TIMEOUT_MS,
  getSupabaseClient,
};

export default config;
