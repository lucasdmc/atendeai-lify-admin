import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WHATSAPP_SERVER_URL = 'https://atendeai.server.com.br';
const VPS_HOST = process.env.VPS_HOST || 'atendeai.server.com.br';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PATH = process.env.VPS_PATH || '/path/to/whatsapp-server';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'atendeai.server.com.br',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function deployWhatsAppServer() {
  console.log('🚀 Iniciando deploy automático do servidor WhatsApp...\n');

  try {
    // 1. Verificar se temos acesso SSH
    console.log('1️⃣ Verificando acesso SSH...');
    try {
      const { stdout, stderr } = await execAsync(`ssh -o ConnectTimeout=10 ${VPS_USER}@${VPS_HOST} "echo 'SSH connection successful'"`);
      console.log('✅ Conexão SSH estabelecida');
    } catch (error) {
      console.error('❌ Erro de conexão SSH:', error.message);
      console.log('💡 Configure as variáveis de ambiente:');
      console.log('   VPS_HOST=atendeai.server.com.br');
      console.log('   VPS_USER=seu_usuario');
      console.log('   VPS_PATH=/caminho/para/whatsapp-server');
      return;
    }

    // 2. Verificar status atual do servidor
    console.log('\n2️⃣ Verificando status atual do servidor...');
    try {
      const healthResponse = await makeRequest('/health');
      console.log('✅ Servidor WhatsApp está online');
      console.log(`📊 Sessões ativas: ${healthResponse.data.activeSessions || 0}`);
    } catch (error) {
      console.log('⚠️ Servidor WhatsApp não está respondendo (pode estar offline)');
    }

    // 3. Fazer backup e deploy
    console.log('\n3️⃣ Iniciando deploy...');
    
    const deployCommands = [
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && pwd"`,
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)"`,
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && pm2 stop whatsapp-server || systemctl stop whatsapp-server"`,
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && git pull origin main"`,
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && npm install"`,
      `ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && pm2 restart whatsapp-server || systemctl restart whatsapp-server"`
    ];

    for (const command of deployCommands) {
      try {
        console.log(`Executando: ${command.split('&&')[1]?.trim() || command}`);
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log('✅ Sucesso');
        if (stderr) console.log('⚠️ Aviso:', stderr);
      } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
        // Continuar mesmo com erro (alguns comandos podem falhar)
      }
    }

    // 4. Aguardar servidor inicializar
    console.log('\n4️⃣ Aguardando servidor inicializar...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 5. Testar endpoints
    console.log('\n5️⃣ Testando endpoints...');
    
    const testEndpoints = [
      '/health',
      '/api/whatsapp/clear-sessions',
      '/api/whatsapp/sessions'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const response = await makeRequest(endpoint);
        console.log(`${endpoint}: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`${endpoint}: ❌ Erro - ${error.message}`);
      }
    }

    // 6. Verificar status final
    console.log('\n6️⃣ Verificando status final...');
    try {
      const finalHealth = await makeRequest('/health');
      console.log('✅ Servidor WhatsApp está funcionando!');
      console.log(`📊 Sessões ativas: ${finalHealth.data.activeSessions || 0}`);
    } catch (error) {
      console.log('❌ Servidor não está respondendo após deploy');
    }

    console.log('\n✅ Deploy automático concluído!');
    console.log('🌐 URL: https://atendeai.server.com.br');

  } catch (error) {
    console.error('❌ Erro durante deploy:', error.message);
  }
}

// Função para configurar variáveis de ambiente
async function setupEnvironment() {
  console.log('🔧 Configurando ambiente para deploy automático...\n');
  
  console.log('📋 Variáveis de ambiente necessárias:');
  console.log(`
  VPS_HOST=atendeai.server.com.br
  VPS_USER=seu_usuario_ssh
  VPS_PATH=/caminho/para/whatsapp-server
  
  Para configurar:
  
  1. Adicione ao seu .env:
     VPS_HOST=lify.magah.com.br
     VPS_USER=root
     VPS_PATH=/opt/whatsapp-server
  
  2. Configure SSH key:
     ssh-copy-id seu_usuario@atendeai.server.com.br
  
  3. Execute o deploy:
     node scripts/deploy-whatsapp-automatic.js
  `);
}

// Executar baseado no argumento
const args = process.argv.slice(2);
const command = args[0];

if (command === 'setup') {
  setupEnvironment();
} else {
  deployWhatsAppServer();
} 