#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const executeCommand = (command, description) => {
  try {
    log(`\n🔍 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8' });
    log(`✅ ${description} - Sucesso`, 'green');
    return { success: true, result };
  } catch (error) {
    log(`❌ ${description} - Erro`, 'red');
    log(`Erro: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
};

const testEdgeFunction = async (agentId, supabaseToken) => {
  const command = `curl -s -X POST "https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/generate-qr" \\
    -H "Authorization: Bearer ${supabaseToken}" \\
    -H "Content-Type: application/json" \\
    -d '{"agentId":"${agentId}"}' \\
    -w "\\nHTTP_STATUS: %{http_code}\\n"`;

  return executeCommand(command, 'Testando Edge Function de geração de QR Code');
};

const testBackendStatus = async (agentId) => {
  const command = `curl -s -X GET "http://31.97.241.19:3001/api/whatsapp/status/${agentId}" \\
    -w "\\nHTTP_STATUS: %{http_code}\\n"`;

  return executeCommand(command, 'Verificando status do agente no backend WhatsApp');
};

const testBackendHealth = async () => {
  const command = `curl -s -X GET "http://31.97.241.19:3001/health" \\
    -w "\\nHTTP_STATUS: %{http_code}\\n"`;

  return executeCommand(command, 'Verificando health check do backend WhatsApp');
};

const getBackendLogs = async () => {
  const command = `ssh -o StrictHostKeyChecking=no root@31.97.241.19 "cd /root/atendeai-lify-admin && pm2 logs atendeai-backend --lines 20 --nostream"`;

  return executeCommand(command, 'Obtendo logs do backend WhatsApp');
};

const getBackendStatus = async () => {
  const command = `ssh -o StrictHostKeyChecking=no root@31.97.241.19 "cd /root/atendeai-lify-admin && pm2 status"`;

  return executeCommand(command, 'Verificando status do PM2 no backend');
};

const analyzeResults = (results) => {
  log('\n📊 ANÁLISE DOS RESULTADOS', 'magenta');
  log('=' * 50, 'magenta');

  // Análise da Edge Function
  if (results.edgeFunction.success) {
    const lines = results.edgeFunction.result.split('\n');
    const httpStatus = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const response = lines.slice(0, -2).join('\n');
    
    log(`\n🔗 Edge Function:`, 'cyan');
    log(`Status HTTP: ${httpStatus}`, 'yellow');
    
    try {
      const data = JSON.parse(response);
      if (data.success) {
        log('✅ Edge Function respondeu com sucesso', 'green');
        if (data.qrCode) {
          log('✅ QR Code foi gerado e retornado', 'green');
        } else {
          log('⚠️ QR Code não foi retornado na resposta', 'yellow');
        }
      } else {
        log('❌ Edge Function retornou erro', 'red');
        log(`Erro: ${data.error}`, 'red');
      }
    } catch (e) {
      log('❌ Resposta da Edge Function não é JSON válido', 'red');
      log(`Resposta: ${response}`, 'red');
    }
  } else {
    log('❌ Falha ao testar Edge Function', 'red');
  }

  // Análise do backend
  if (results.backendStatus.success) {
    const lines = results.backendStatus.result.split('\n');
    const httpStatus = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const response = lines.slice(0, -2).join('\n');
    
    log(`\n🖥️ Backend WhatsApp:`, 'cyan');
    log(`Status HTTP: ${httpStatus}`, 'yellow');
    
    try {
      const data = JSON.parse(response);
      log(`Status do agente: ${data.status}`, 'yellow');
      if (data.connected) {
        log('✅ Agente está conectado', 'green');
      } else if (data.qrCode) {
        log('✅ QR Code disponível no backend', 'green');
      } else {
        log('⚠️ Agente não está conectado e não há QR Code', 'yellow');
      }
    } catch (e) {
      log('❌ Resposta do backend não é JSON válido', 'red');
      log(`Resposta: ${response}`, 'red');
    }
  } else {
    log('❌ Falha ao verificar status do backend', 'red');
  }

  // Análise do health check
  if (results.backendHealth.success) {
    const lines = results.backendHealth.result.split('\n');
    const httpStatus = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const response = lines.slice(0, -2).join('\n');
    
    log(`\n🏥 Health Check:`, 'cyan');
    log(`Status HTTP: ${httpStatus}`, 'yellow');
    
    try {
      const data = JSON.parse(response);
      log(`Status: ${data.status}`, 'yellow');
      log(`WhatsApp: ${data.whatsapp}`, 'yellow');
    } catch (e) {
      log('❌ Health check não retornou JSON válido', 'red');
    }
  } else {
    log('❌ Falha no health check do backend', 'red');
  }

  // Análise dos logs
  if (results.backendLogs.success) {
    log(`\n📋 Logs do Backend:`, 'cyan');
    log(results.backendLogs.result, 'yellow');
  } else {
    log('❌ Falha ao obter logs do backend', 'red');
  }

  // Análise do status do PM2
  if (results.backendPm2Status.success) {
    log(`\n⚙️ Status do PM2:`, 'cyan');
    log(results.backendPm2Status.result, 'yellow');
  } else {
    log('❌ Falha ao verificar status do PM2', 'red');
  }
};

const generateRecommendations = (results) => {
  log('\n💡 RECOMENDAÇÕES', 'magenta');
  log('=' * 30, 'magenta');

  const issues = [];

  // Verificar se Edge Function está funcionando
  if (!results.edgeFunction.success) {
    issues.push('🔧 Edge Function não está acessível - verificar deploy da Edge Function');
  }

  // Verificar se backend está funcionando
  if (!results.backendHealth.success) {
    issues.push('🖥️ Backend WhatsApp não está respondendo - verificar se o servidor está rodando');
  }

  // Verificar se agente está conectado
  if (results.backendStatus.success) {
    try {
      const lines = results.backendStatus.result.split('\n');
      const response = lines.slice(0, -2).join('\n');
      const data = JSON.parse(response);
      
      if (!data.connected && !data.qrCode) {
        issues.push('📱 Agente não está conectado e não há QR Code - tentar gerar novo QR Code');
      }
    } catch (e) {
      issues.push('📱 Não foi possível verificar status do agente');
    }
  }

  if (issues.length === 0) {
    log('✅ Sistema parece estar funcionando corretamente', 'green');
    log('💡 Se o QR Code ainda não aparece no frontend, tente:', 'cyan');
    log('   1. Limpar cache do navegador', 'cyan');
    log('   2. Verificar se o agentId está correto', 'cyan');
    log('   3. Verificar logs do frontend no console do navegador', 'cyan');
  } else {
    log('❌ Problemas identificados:', 'red');
    issues.forEach(issue => log(`   ${issue}`, 'red'));
  }
};

const main = async () => {
  log('🔍 DIAGNÓSTICO AUTOMATIZADO - QR CODE WHATSAPP', 'bright');
  log('=' * 60, 'bright');
  
  try {
    // Coletar informações do usuário
    log('\n📝 Informações necessárias:', 'cyan');
    
    const agentId = await question('Digite o agentId do agente: ');
    if (!agentId) {
      log('❌ agentId é obrigatório', 'red');
      rl.close();
      return;
    }

    const supabaseToken = await question('Digite o token do Supabase (ou pressione Enter para usar o padrão): ');
    const token = supabaseToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

    log('\n🚀 Iniciando diagnóstico...', 'green');

    // Executar todos os testes
    const results = {
      edgeFunction: await testEdgeFunction(agentId, token),
      backendStatus: await testBackendStatus(agentId),
      backendHealth: await testBackendHealth(),
      backendLogs: await getBackendLogs(),
      backendPm2Status: await getBackendStatus()
    };

    // Analisar resultados
    analyzeResults(results);

    // Gerar recomendações
    generateRecommendations(results);

    log('\n✅ Diagnóstico concluído!', 'green');

  } catch (error) {
    log(`❌ Erro durante o diagnóstico: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
};

// Executar o script
main(); 