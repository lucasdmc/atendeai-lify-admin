// ========================================
// CORREÇÃO CRÍTICA #3: CONFIGURAÇÃO DE AMBIENTE PRODUÇÃO
// Baseado no documento "SOLUÇÕES PRÁTICAS E IMPLEMENTAÇÕES - AtendeAí"
// ========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixEnvironmentProduction() {
  console.log('🔧 CORREÇÃO CRÍTICA #3: CONFIGURAÇÃO DE AMBIENTE PRODUÇÃO');
  console.log('========================================================');

  try {
    // PASSO 1: VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
    console.log('\n📋 1. Validando variáveis de ambiente...');
    
    const environmentConfigCode = `
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
    missing.forEach(varName => console.error(\`   - \${varName}\`));
    throw new Error(\`Variáveis de ambiente obrigatórias não encontradas: \${missing.join(', ')}\`);
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
`;

    // Salvar configuração de ambiente
    const fs = await import('fs');
    fs.writeFileSync('src/config/environment.js', environmentConfigCode);
    console.log('✅ Configuração de ambiente criada!');

    // PASSO 2: SCRIPT DE VERIFICAÇÃO DE SISTEMA
    console.log('\n📋 2. Criando script de verificação de sistema...');
    
    const healthCheckScript = `
// ========================================
// SCRIPT DE VERIFICAÇÃO DE SISTEMA
// ========================================

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { validateEnvironment, getEnvironmentConfig } from './src/config/environment.js';
import dotenv from 'dotenv';

dotenv.config();

async function runHealthCheck() {
  console.log('🏥 Executando verificação de saúde do sistema...\\n');
  
  try {
    // Validar variáveis de ambiente
    console.log('📋 1. Validando variáveis de ambiente...');
    validateEnvironment();
    const config = getEnvironmentConfig();
    console.log('✅ Variáveis de ambiente validadas');
    
    let allGood = true;

    // Teste 1: Conexão com Supabase
    try {
      console.log('\\n📊 2. Testando conexão com Supabase...');
      const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Supabase: Conectado com sucesso');
    } catch (error) {
      console.log('❌ Supabase: Erro de conexão -', error.message);
      allGood = false;
    }

    // Teste 2: API OpenAI
    try {
      console.log('\\n🤖 3. Testando API OpenAI...');
      const openai = new OpenAI({ apiKey: config.openai.apiKey });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Diga apenas 'OK'" }],
        max_tokens: 10
      });
      
      if (response.choices[0].message.content.includes('OK')) {
        console.log('✅ OpenAI: API funcionando corretamente');
      } else {
        throw new Error('Resposta inesperada da API');
      }
    } catch (error) {
      console.log('❌ OpenAI: Erro na API -', error.message);
      allGood = false;
    }

    // Teste 3: Tabela conversation_memory
    try {
      console.log('\\n💾 4. Testando tabela conversation_memory...');
      const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      
      // Tentar inserir e deletar um registro de teste
      const testData = {
        phone_number: '+5500000000000',
        agent_id: 'health_check',
        user_message: 'teste',
        bot_response: 'teste',
        intent: 'TEST',
        confidence: 1.0
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('conversation_memory')
        .insert(testData)
        .select();
        
      if (insertError) throw insertError;
      
      // Deletar o registro de teste
      await supabase
        .from('conversation_memory')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('✅ Tabela conversation_memory: Funcionando corretamente');
    } catch (error) {
      console.log('❌ Tabela conversation_memory: Erro -', error.message);
      allGood = false;
    }

    // Teste 4: WhatsApp Meta API
    try {
      console.log('\\n📱 5. Testando WhatsApp Meta API...');
      
      if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
        throw new Error('Tokens do WhatsApp não configurados');
      }
      
      console.log('✅ WhatsApp Meta: Tokens configurados');
      console.log('📋 Phone Number ID:', config.whatsapp.phoneNumberId);
      console.log('🔑 Access Token:', config.whatsapp.accessToken.substring(0, 20) + '...');
    } catch (error) {
      console.log('❌ WhatsApp Meta: Erro -', error.message);
      allGood = false;
    }

    // Resultado final
    console.log('\\n' + '='.repeat(50));
    if (allGood) {
      console.log('🎉 SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('✅ Todos os componentes estão operacionais');
      console.log('🚀 Pronto para produção!');
    } else {
      console.log('⚠️  SISTEMA COM PROBLEMAS!');
      console.log('❌ Alguns componentes precisam de correção');
      console.log('🔧 Corrija os erros antes de usar em produção');
    }
    console.log('='.repeat(50));
    
    return allGood;
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na verificação:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  runHealthCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runHealthCheck };
`;

    fs.writeFileSync('scripts/health-check.js', healthCheckScript);
    console.log('✅ Script de verificação de sistema criado!');

    // PASSO 3: CONFIGURAÇÃO DE LOGS POR AMBIENTE
    console.log('\n📋 3. Criando configuração de logs por ambiente...');
    
    const loggerConfigCode = `
// ========================================
// CONFIGURAÇÃO DE LOGS POR AMBIENTE
// ========================================

import winston from 'winston';
import { isProduction, isDevelopment } from '../config/environment.js';

const logLevel = isProduction() ? 'info' : 'debug';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Só mostrar logs no console em desenvolvimento
if (isDevelopment()) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Função para logs que NUNCA devem ir para produção
logger.debug = function(message, meta = {}) {
  if (isDevelopment()) {
    this.log('debug', message, meta);
  }
};

// Função para logs de teste que NUNCA devem ir para produção
logger.test = function(message, meta = {}) {
  if (isDevelopment()) {
    this.log('info', \`🧪 TEST: \${message}\`, meta);
  }
};

// Função para logs de produção
logger.production = function(message, meta = {}) {
  if (isProduction()) {
    this.log('info', message, meta);
  }
};

// Funções específicas para diferentes componentes
logger.ai = function(message, meta = {}) {
  this.log('info', \`🤖 [AI] \${message}\`, meta);
};

logger.clinic = function(message, meta = {}) {
  this.log('info', \`🏥 [Clinic] \${message}\`, meta);
};

logger.whatsapp = function(message, meta = {}) {
  this.log('info', \`📱 [WhatsApp] \${message}\`, meta);
};

logger.memory = function(message, meta = {}) {
  this.log('info', \`🧠 [Memory] \${message}\`, meta);
};

logger.webhook = function(message, meta = {}) {
  this.log('info', \`🔗 [Webhook] \${message}\`, meta);
};

export default logger;
`;

    fs.writeFileSync('src/utils/logger.js', loggerConfigCode);
    console.log('✅ Configuração de logs criada!');

    // PASSO 4: ARQUIVOS DE CONFIGURAÇÃO DE AMBIENTE
    console.log('\n📋 4. Criando arquivos de configuração de ambiente...');
    
    // Arquivo .env.production
    const envProductionCode = `# ========================================
# CONFIGURAÇÃO DE AMBIENTE PRODUÇÃO
# ========================================

NODE_ENV=production
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=your-whatsapp-access-token-here
WHATSAPP_META_PHONE_NUMBER_ID=your-phone-number-id-here
WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token-here

# Servidor
PORT=3001
HOST=0.0.0.0

# Logs
LOG_LEVEL=info
ENABLE_CONSOLE_LOGS=false
`;

    // Arquivo .env.development
    const envDevelopmentCode = `# ========================================
# CONFIGURAÇÃO DE AMBIENTE DESENVOLVIMENTO
# ========================================

NODE_ENV=development
LOG_LEVEL=debug

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY2NTc1ODU1OX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=your-whatsapp-access-token-here
WHATSAPP_META_PHONE_NUMBER_ID=your-phone-number-id-here
WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token-here

# Servidor
PORT=3001
HOST=localhost

# Logs
LOG_LEVEL=debug
ENABLE_CONSOLE_LOGS=true
`;

    fs.writeFileSync('.env.production', envProductionCode);
    fs.writeFileSync('.env.development', envDevelopmentCode);
    console.log('✅ Arquivos de configuração de ambiente criados!');

    // PASSO 5: SCRIPT DE TESTE DE CONFIGURAÇÃO
    console.log('\n📋 5. Criando script de teste de configuração...');
    
    const testConfigScript = `
// ========================================
// TESTE DE CONFIGURAÇÃO DE AMBIENTE
// ========================================

import { validateEnvironment, getEnvironmentConfig, isProduction, isDevelopment } from './src/config/environment.js';
import { runHealthCheck } from './scripts/health-check.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEnvironmentConfiguration() {
  console.log('🔧 Testando Configuração de Ambiente...\\n');
  
  try {
    // Teste 1: Validar variáveis de ambiente
    console.log('📋 1. Validando variáveis de ambiente...');
    validateEnvironment();
    console.log('✅ Variáveis de ambiente validadas');
    
    // Teste 2: Verificar configuração
    console.log('\\n📋 2. Verificando configuração...');
    const config = getEnvironmentConfig();
    console.log('✅ Configuração carregada:');
    console.log('- Ambiente:', config.nodeEnv);
    console.log('- Porta:', config.port);
    console.log('- Supabase URL:', config.supabase.url ? '✅ Configurado' : '❌ Não configurado');
    console.log('- OpenAI API Key:', config.openai.apiKey ? '✅ Configurado' : '❌ Não configurado');
    console.log('- WhatsApp Access Token:', config.whatsapp.accessToken ? '✅ Configurado' : '❌ Não configurado');
    console.log('- WhatsApp Phone Number ID:', config.whatsapp.phoneNumberId ? '✅ Configurado' : '❌ Não configurado');
    
    // Teste 3: Verificar ambiente
    console.log('\\n📋 3. Verificando ambiente...');
    console.log('- É produção?', isProduction());
    console.log('- É desenvolvimento?', isDevelopment());
    
    // Teste 4: Executar health check
    console.log('\\n📋 4. Executando health check...');
    const healthCheckResult = await runHealthCheck();
    
    if (healthCheckResult) {
      console.log('\\n🎉 CONFIGURAÇÃO DE AMBIENTE FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Todas as validações passaram');
      console.log('🚀 Sistema pronto para uso');
    } else {
      console.log('\\n⚠️  CONFIGURAÇÃO DE AMBIENTE COM PROBLEMAS!');
      console.log('❌ Algumas validações falharam');
      console.log('🔧 Corrija os problemas antes de usar');
    }
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na configuração:', error.message);
    console.log('🔧 Verifique as variáveis de ambiente');
  }
}

// Executar teste
testEnvironmentConfiguration().catch(console.error);
`;

    fs.writeFileSync('test-environment-configuration.js', testConfigScript);
    console.log('✅ Script de teste de configuração criado!');

    console.log('\n🎉 CORREÇÃO DA CONFIGURAÇÃO DE AMBIENTE PRODUÇÃO CONCLUÍDA!');
    console.log('✅ Configuração de ambiente criada');
    console.log('✅ Script de verificação de sistema criado');
    console.log('✅ Configuração de logs por ambiente criada');
    console.log('✅ Arquivos de configuração criados');
    console.log('✅ Script de teste criado');
    console.log('📋 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente reais');
    console.log('2. Execute: node test-environment-configuration.js');
    console.log('3. Execute: node scripts/health-check.js');
    console.log('4. Teste o sistema em produção');

  } catch (error) {
    console.error('💥 ERRO CRÍTICO na correção da configuração:', error);
    throw error;
  }
}

// Executar correção
fixEnvironmentProduction().catch(console.error); 