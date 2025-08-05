
// ========================================
// VERIFICAÇÃO DE CONFIGURAÇÃO DE AMBIENTE
// ========================================

import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

function verifyEnvironmentConfiguration() {
  console.log('🔧 VERIFICAÇÃO DE CONFIGURAÇÃO DE AMBIENTE');
  console.log('==========================================');
  
  try {
    // Verificar arquivo .env
    if (!fs.existsSync('.env')) {
      console.log('❌ Arquivo .env não encontrado');
      console.log('📋 Execute: ./select-environment.sh development');
      return false;
    }
    
    // Carregar configurações
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    let nodeEnv = '';
    let backendUrl = '';
    let logLevel = '';
    
    for (const line of lines) {
      if (line.startsWith('NODE_ENV=')) {
        nodeEnv = line.split('=')[1];
      }
      if (line.startsWith('VITE_BACKEND_URL=')) {
        backendUrl = line.split('=')[1];
      }
      if (line.startsWith('LOG_LEVEL=')) {
        logLevel = line.split('=')[1];
      }
    }
    
    console.log('\n📊 CONFIGURAÇÃO ATUAL:');
    console.log('- NODE_ENV:', nodeEnv);
    console.log('- VITE_BACKEND_URL:', backendUrl);
    console.log('- LOG_LEVEL:', logLevel);
    
    // Verificar se está correto
    if (nodeEnv === 'production' && backendUrl === 'https://atendeai-backend-production.up.railway.app') {
      console.log('\n✅ CONFIGURAÇÃO CORRETA PARA VPS!');
      console.log('🌐 Backend apontando para VPS');
      console.log('🚀 Pronto para produção');
      return true;
    } else if (nodeEnv === 'development' && backendUrl === 'http://localhost:3001') {
      console.log('\n✅ CONFIGURAÇÃO CORRETA PARA DESENVOLVIMENTO!');
      console.log('🔧 Backend apontando para localhost');
      console.log('🔧 Pronto para desenvolvimento');
      return true;
    } else {
      console.log('\n⚠️  CONFIGURAÇÃO INCORRETA!');
      console.log('❌ VITE_BACKEND_URL não está configurado corretamente');
      console.log('📋 Execute: ./select-environment.sh [development|production]');
      return false;
    }
    
  } catch (error) {
    console.error('💥 ERRO na verificação:', error.message);
    return false;
  }
}

// Executar verificação
verifyEnvironmentConfiguration();
