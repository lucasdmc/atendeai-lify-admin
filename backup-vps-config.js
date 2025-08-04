// ========================================
// BACKUP CONFIGURAÇÕES VPS
// ========================================

import fs from 'fs';
import { execSync } from 'child_process';

async function backupVPSConfig() {
  console.log('💾 [VPS Backup] Iniciando backup das configurações...');
  
  const backupDir = './vps-backup';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Criar diretório de backup
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log('📁 [Backup] Criando backup com timestamp:', timestamp);
    
    // 1. Backup das variáveis de ambiente
    console.log('🔧 [Backup] Copiando variáveis de ambiente...');
    try {
      const envBackup = execSync('ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && cat .env"', { encoding: 'utf8' });
      fs.writeFileSync(`${backupDir}/env-backup-${timestamp}.txt`, envBackup);
      console.log('✅ Variáveis de ambiente salvas');
    } catch (error) {
      console.log('⚠️ Não foi possível copiar .env:', error.message);
    }
    
    // 2. Backup dos logs
    console.log('📋 [Backup] Copiando logs...');
    try {
      const logsBackup = execSync('ssh root@api.atendeai.lify.com.br "pm2 logs atendeai-backend --lines 100"', { encoding: 'utf8' });
      fs.writeFileSync(`${backupDir}/logs-backup-${timestamp}.txt`, logsBackup);
      console.log('✅ Logs salvos');
    } catch (error) {
      console.log('⚠️ Não foi possível copiar logs:', error.message);
    }
    
    // 3. Backup do status do PM2
    console.log('⚙️ [Backup] Copiando status PM2...');
    try {
      const pm2Status = execSync('ssh root@api.atendeai.lify.com.br "pm2 status"', { encoding: 'utf8' });
      fs.writeFileSync(`${backupDir}/pm2-status-${timestamp}.txt`, pm2Status);
      console.log('✅ Status PM2 salvo');
    } catch (error) {
      console.log('⚠️ Não foi possível copiar status PM2:', error.message);
    }
    
    // 4. Backup da estrutura de arquivos
    console.log('📂 [Backup] Copiando estrutura de arquivos...');
    try {
      const fileStructure = execSync('ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && find . -type f -name \"*.js\" -o -name \"*.json\" -o -name \"*.env*\" | head -20"', { encoding: 'utf8' });
      fs.writeFileSync(`${backupDir}/file-structure-${timestamp}.txt`, fileStructure);
      console.log('✅ Estrutura de arquivos salva');
    } catch (error) {
      console.log('⚠️ Não foi possível copiar estrutura:', error.message);
    }
    
    // 5. Criar arquivo de configuração Railway
    console.log('🚀 [Backup] Criando configuração Railway...');
    const railwayConfig = {
      timestamp: timestamp,
      vps_backup: {
        env_file: `env-backup-${timestamp}.txt`,
        logs_file: `logs-backup-${timestamp}.txt`,
        pm2_status: `pm2-status-${timestamp}.txt`,
        file_structure: `file-structure-${timestamp}.txt`
      },
      railway_variables: {
        SUPABASE_URL: "https://niakqdolcdwxtrkbqmdi.supabase.co",
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw",
        OPENAI_API_KEY: "sk-...", // ATUALIZAR
        WHATSAPP_META_ACCESS_TOKEN: "EAASAuWYr9JgBPMxLKIoZCYAfUOWrj721aw1HMLK5ZBUBJOAPpB2k3as1Nj2bmJskjiBZCh8szn7ajR7Ic2OsnJSZCJIuz9eD2wk1wL7cWnZBv3jBaZA56ZCH48ngQ6VRZBjXZAlnancYdrdag1UougDbyZCemhIhE9MchQ0pS1hXCwhZCKytYpPPocgqf1sFlFt2iGZAnxFB5alHzVTZCw2172NnZBB2qtjgXkikTTRopth8mxB7mvdI4yqk3dficzsAZDZD",
        NODE_ENV: "production",
        PORT: "3001",
        LOG_LEVEL: "info",
        DEFAULT_CLINIC_ID: "cardioprime_blumenau_2024"
      },
      migration_steps: [
        "1. Criar projeto Railway",
        "2. Conectar repositório GitHub",
        "3. Configurar variáveis de ambiente",
        "4. Fazer primeiro deploy",
        "5. Testar endpoints",
        "6. Atualizar webhook URLs",
        "7. Monitorar 24h"
      ]
    };
    
    fs.writeFileSync(`${backupDir}/railway-config-${timestamp}.json`, JSON.stringify(railwayConfig, null, 2));
    console.log('✅ Configuração Railway salva');
    
    // 6. Criar relatório final
    console.log('📊 [Backup] Criando relatório final...');
    const report = `
# BACKUP VPS → RAILWAY
Data: ${timestamp}

## Arquivos de Backup:
- env-backup-${timestamp}.txt
- logs-backup-${timestamp}.txt
- pm2-status-${timestamp}.txt
- file-structure-${timestamp}.txt
- railway-config-${timestamp}.json

## Próximos Passos:
1. Criar projeto Railway
2. Configurar variáveis de ambiente
3. Fazer deploy
4. Testar endpoints
5. Atualizar webhooks

## URLs Importantes:
- Railway Dashboard: https://railway.app
- GitHub Repository: [SEU_REPO]
- Webhook URL: [RAILWAY_URL]/webhook/whatsapp-meta

## Variáveis de Ambiente Necessárias:
${Object.entries(railwayConfig.railway_variables).map(([key, value]) => `${key}=${value}`).join('\n')}
    `;
    
    fs.writeFileSync(`${backupDir}/migration-report-${timestamp}.md`, report);
    console.log('✅ Relatório final salvo');
    
    console.log('\n🎉 [VPS Backup] BACKUP CONCLUÍDO COM SUCESSO!');
    console.log(`📁 Backup salvo em: ${backupDir}`);
    console.log('📋 Próximo passo: Configurar Railway');
    
  } catch (error) {
    console.error('❌ [VPS Backup] Erro:', error.message);
    process.exit(1);
  }
}

// Executar backup
backupVPSConfig(); 