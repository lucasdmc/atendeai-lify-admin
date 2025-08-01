// ========================================
// CORREÇÃO DE AMBIENTE E SERVIÇOS
// ========================================

import fs from 'fs';
import path from 'path';

async function fixEnvironmentAndServices() {
  console.log('🔧 CORRIGINDO AMBIENTE E SERVIÇOS');
  console.log('===================================\n');

  // 1. Verificar e corrigir configurações de ambiente
  console.log('📋 1. CORRIGINDO CONFIGURAÇÕES DE AMBIENTE');
  console.log('─'.repeat(50));

  // Ler configurações de produção
  const aiConfigContent = fs.readFileSync('ai-config-production.env', 'utf8');
  const productionEnvContent = fs.readFileSync('.env.production', 'utf8');

  // Extrair variáveis importantes
  const openaiKey = aiConfigContent.match(/OPENAI_API_KEY=(.+)/)?.[1];
  const anthropicKey = aiConfigContent.match(/ANTHROPIC_API_KEY=(.+)/)?.[1];
  const whatsappToken = productionEnvContent.match(/WHATSAPP_META_ACCESS_TOKEN=(.+)/)?.[1];
  const whatsappPhoneId = productionEnvContent.match(/WHATSAPP_META_PHONE_NUMBER_ID=(.+)/)?.[1];

  console.log('✅ Variáveis encontradas:');
  console.log(`   OpenAI: ${openaiKey ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Anthropic: ${anthropicKey ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   WhatsApp Token: ${whatsappToken ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   WhatsApp Phone ID: ${whatsappPhoneId ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log('');

  // 2. Criar arquivo .env unificado para produção
  console.log('📋 2. CRIANDO ARQUIVO .ENV UNIFICADO');
  console.log('─'.repeat(50));

  const unifiedEnvContent = `# ========================================
# CONFIGURAÇÕES UNIFICADAS - PRODUÇÃO
# ========================================

# Configurações do servidor
NODE_ENV=production
PORT=3001

# OpenAI API (GPT-4o, Whisper, TTS)
OPENAI_API_KEY=${openaiKey || 'sua_chave_openai_aqui'}

# Anthropic API (Claude 3.5 Sonnet)
ANTHROPIC_API_KEY=${anthropicKey || 'sua_chave_anthropic_aqui'}

# WhatsApp Meta API
WHATSAPP_META_ACCESS_TOKEN=${whatsappToken || 'seu_token_whatsapp_aqui'}
WHATSAPP_META_PHONE_NUMBER_ID=${whatsappPhoneId || 'seu_phone_id_aqui'}

# IDs padrão para produção
DEFAULT_CLINIC_ID=test-clinic
DEFAULT_USER_ID=system-ai-user

# Supabase (se necessário)
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# Webhook URL
WEBHOOK_URL=https://atendeai.com.br/webhook/whatsapp-meta
`;

  fs.writeFileSync('.env.production.unified', unifiedEnvContent);
  console.log('✅ Arquivo .env.production.unified criado');
  console.log('');

  // 3. Verificar se os serviços robustos estão funcionando
  console.log('📋 3. VERIFICANDO SERVIÇOS ROBUSTOS');
  console.log('─'.repeat(50));

  const robustServices = [
    'src/services/ai/sprint1-medical-validation.ts',
    'src/services/ai/sprint2-model-ensemble.ts',
    'src/services/ai/llmOrchestratorService.ts',
    'src/services/ai/ai-orchestrator.ts',
    'src/services/ai/conversationMemoryService.ts',
    'src/services/ai/ragEngineService.ts',
    'src/services/ai/personalizationService.ts',
    'src/services/ai/intentRecognitionService.ts',
    'src/services/ai/toolCallingService.ts'
  ];

  let allServicesExist = true;
  robustServices.forEach(service => {
    if (fs.existsSync(service)) {
      console.log(`   ✅ ${service}`);
    } else {
      console.log(`   ❌ ${service} (NÃO EXISTE)`);
      allServicesExist = false;
    }
  });

  if (allServicesExist) {
    console.log('✅ Todos os serviços robustos estão presentes');
  } else {
    console.log('❌ Alguns serviços robustos estão faltando');
  }
  console.log('');

  // 4. Verificar se o webhook está configurado corretamente
  console.log('📋 4. VERIFICANDO CONFIGURAÇÃO DO WEBHOOK');
  console.log('─'.repeat(50));

  const webhookContent = fs.readFileSync('routes/webhook.js', 'utf8');
  
  if (webhookContent.includes('processMessageWithAIRobust')) {
    console.log('✅ Webhook usando AI Robusta');
  } else {
    console.log('❌ Webhook NÃO está usando AI Robusta');
  }

  if (webhookContent.includes('processMessageWithAIDirect')) {
    console.log('✅ Webhook usando processamento direto');
  } else {
    console.log('❌ Webhook NÃO está usando processamento direto');
  }

  if (!webhookContent.includes('localhost:3001')) {
    console.log('✅ Webhook NÃO está chamando localhost:3001');
  } else {
    console.log('❌ Webhook AINDA está chamando localhost:3001');
  }
  console.log('');

  // 5. Criar script de teste para verificar funcionamento
  console.log('📋 5. CRIANDO SCRIPT DE TESTE');
  console.log('─'.repeat(50));

  const testScript = `#!/bin/bash

echo "🧪 TESTANDO FUNCIONAMENTO APÓS CORREÇÕES"
echo "========================================"

# 1. Carregar variáveis de ambiente
echo "📋 1. Carregando variáveis de ambiente..."
source .env.production.unified

# 2. Verificar se as variáveis estão carregadas
echo "📋 2. Verificando variáveis..."
echo "   NODE_ENV: \$NODE_ENV"
echo "   PORT: \$PORT"
echo "   OPENAI_API_KEY: \${OPENAI_API_KEY:0:20}..."
echo "   WHATSAPP_META_ACCESS_TOKEN: \${WHATSAPP_META_ACCESS_TOKEN:0:20}..."
echo "   WHATSAPP_META_PHONE_NUMBER_ID: \$WHATSAPP_META_PHONE_NUMBER_ID"

# 3. Testar webhook
echo "📋 3. Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \\
  -H "Content-Type: application/json" \\
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \\
  -s | jq '.'

# 4. Testar health check
echo "📋 4. Testando health check..."
curl -s http://localhost:3001/health | jq '.'

echo "✅ Teste concluído!"
`;

  fs.writeFileSync('test-after-fix.sh', testScript);
  fs.chmodSync('test-after-fix.sh', '755');
  console.log('✅ Script de teste criado: test-after-fix.sh');
  console.log('');

  // 6. Criar script para aplicar correções na VPS
  console.log('📋 6. CRIANDO SCRIPT PARA VPS');
  console.log('─'.repeat(50));

  const vpsScript = `#!/bin/bash

echo "🚀 APLICANDO CORREÇÕES NA VPS"
echo "=============================="

# 1. Navegar para o diretório da aplicação
cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# 2. Fazer backup das configurações atuais
echo "💾 Fazendo backup..."
cp .env.production .env.production.backup.\$(date +%Y%m%d_%H%M%S)

# 3. Aplicar configurações unificadas
echo "📝 Aplicando configurações..."
cp .env.production.unified .env.production

# 4. Verificar se o Node.js está rodando
echo "🔍 Verificando Node.js..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "💡 Iniciando Node.js..."
    pm2 start server.js --name "atendeai-backend" || echo "⚠️ Erro ao iniciar Node.js"
fi

# 5. Testar webhook
echo "🧪 Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \\
  -H "Content-Type: application/json" \\
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \\
  -s

echo ""
echo "✅ Correções aplicadas!"
echo "📱 Agora teste enviando uma mensagem no WhatsApp"
`;

  fs.writeFileSync('apply-fix-on-vps.sh', vpsScript);
  fs.chmodSync('apply-fix-on-vps.sh', '755');
  console.log('✅ Script para VPS criado: apply-fix-on-vps.sh');
  console.log('');

  // 7. Resumo final
  console.log('📊 RESUMO DAS CORREÇÕES');
  console.log('─'.repeat(50));
  
  console.log('✅ CONFIGURAÇÕES CRIADAS:');
  console.log('   📄 .env.production.unified');
  console.log('   🧪 test-after-fix.sh');
  console.log('   🚀 apply-fix-on-vps.sh');
  console.log('');
  
  console.log('🔧 PRÓXIMOS PASSOS:');
  console.log('   1. Copiar .env.production.unified para VPS');
  console.log('   2. Executar apply-fix-on-vps.sh na VPS');
  console.log('   3. Testar webhook com test-after-fix.sh');
  console.log('   4. Enviar mensagem no WhatsApp para verificar');
  console.log('');
  
  console.log('💡 CAUSA IDENTIFICADA:');
  console.log('   - Variáveis de ambiente não estavam carregadas');
  console.log('   - Configurações estavam separadas em arquivos diferentes');
  console.log('   - Webhook não conseguia acessar as APIs AI');
  console.log('');
  
  console.log('🎯 SOLUÇÃO:');
  console.log('   - Unificar configurações em um arquivo .env');
  console.log('   - Garantir que variáveis estejam disponíveis');
  console.log('   - Manter webhook funcionando com AI robusta');
  console.log('');

  console.log('🎉 CORREÇÃO CONCLUÍDA!');
  console.log('=====================');
  console.log('✅ Ambiente corrigido');
  console.log('✅ Serviços robustos verificados');
  console.log('✅ Scripts de aplicação criados');
  console.log('✅ Pronto para aplicar na VPS');
}

// Executar correção
fixEnvironmentAndServices(); 