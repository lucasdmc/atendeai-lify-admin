const { execSync } = require('child_process');

console.log('🔧 Adicionando endpoint POST /api/whatsapp/generate-qr ao backend...');

const endpointCode = `
// Gerar QR Code via API
app.post('/api/whatsapp/generate-qr', async (req, res) => {
    try {
        const { agentId } = req.body;
        
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'agentId é obrigatório'
            });
        }

        console.log(\`Gerando QR Code para agente: \${agentId}\`);

        // Desconectar cliente anterior se existir
        if (client) {
            client.destroy();
        }

        // Criar novo cliente
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: \`atendeai-\${agentId}\`,
                dataPath: dataDir
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        // Eventos do cliente
        client.on('qr', async (qr) => {
            try {
                qrCode = await qrcode.toDataURL(qr);
                console.log('QR Code gerado com sucesso');
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
            }
        });

        client.on('ready', () => {
            console.log('Cliente WhatsApp pronto');
            qrCode = null;
        });

        client.on('disconnected', (reason) => {
            console.log('Cliente WhatsApp desconectado:', reason);
            client = null;
            qrCode = null;
        });

        client.on('auth_failure', (msg) => {
            console.error('Falha na autenticação:', msg);
            qrCode = null;
        });

        // Inicializar cliente
        await client.initialize();

        // Aguardar um pouco para o QR Code ser gerado
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (qrCode) {
            res.json({
                success: true,
                message: 'QR Code gerado com sucesso',
                agentId: agentId,
                whatsappNumber: 'temp',
                connectionId: \`temp-\${Date.now()}\`,
                qrCode: qrCode
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erro ao gerar QR Code',
                status: 'error'
            });
        }

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            status: 'error'
        });
    }
});
`;

try {
    // Conectar via SSH e adicionar o endpoint
    const sshCommand = `ssh root@31.97.241.19 "cd /root && cp server.cjs server.cjs.backup && sed -i '/app.post.*disconnect/a\\${endpointCode.replace(/\n/g, '\\n')}' server.cjs"`;
    
    console.log('📝 Fazendo backup do arquivo atual...');
    execSync(`ssh root@31.97.241.19 "cd /root && cp server.cjs server.cjs.backup"`, { stdio: 'inherit' });
    
    console.log('📝 Adicionando endpoint ao arquivo...');
    execSync(`ssh root@31.97.241.19 "cd /root && echo '${endpointCode.replace(/'/g, "'\"'\"'")}' > /tmp/endpoint_code"`, { stdio: 'inherit' });
    
    console.log('📝 Inserindo código no arquivo...');
    execSync(`ssh root@31.97.241.19 "cd /root && sed -i '/app.post.*disconnect/r /tmp/endpoint_code' server.cjs"`, { stdio: 'inherit' });
    
    console.log('🔄 Reiniciando o backend...');
    execSync(`ssh root@31.97.241.19 "pm2 restart atendeai-backend"`, { stdio: 'inherit' });
    
    console.log('✅ Endpoint adicionado com sucesso!');
    console.log('🔍 Testando o endpoint...');
    
    // Testar o endpoint
    const testResult = execSync(`curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr -H "Content-Type: application/json" -d '{"agentId":"0e170bf5-e767-4dea-90e5-8fccbdbfa6a5"}'`, { encoding: 'utf8' });
    console.log('📋 Resultado do teste:', testResult);
    
} catch (error) {
    console.error('❌ Erro ao adicionar endpoint:', error.message);
    console.log('💡 Tentando método alternativo...');
    
    try {
        // Método alternativo: criar arquivo temporário
        const tempFile = '/tmp/server_with_endpoint.cjs';
        
        console.log('📝 Criando arquivo temporário...');
        execSync(`ssh root@31.97.241.19 "cd /root && head -n 158 server.cjs > ${tempFile}"`, { stdio: 'inherit' });
        
        console.log('📝 Adicionando endpoint...');
        execSync(`ssh root@31.97.241.19 "echo '${endpointCode.replace(/'/g, "'\"'\"'")}' >> ${tempFile}"`, { stdio: 'inherit' });
        
        console.log('📝 Adicionando resto do arquivo...');
        execSync(`ssh root@31.97.241.19 "tail -n +159 server.cjs >> ${tempFile}"`, { stdio: 'inherit' });
        
        console.log('📝 Substituindo arquivo original...');
        execSync(`ssh root@31.97.241.19 "mv ${tempFile} server.cjs"`, { stdio: 'inherit' });
        
        console.log('🔄 Reiniciando o backend...');
        execSync(`ssh root@31.97.241.19 "pm2 restart atendeai-backend"`, { stdio: 'inherit' });
        
        console.log('✅ Endpoint adicionado com sucesso!');
        
    } catch (altError) {
        console.error('❌ Erro no método alternativo:', altError.message);
        console.log('💡 Execute manualmente no servidor:');
        console.log('1. Conecte via SSH: ssh root@31.97.241.19');
        console.log('2. Edite o arquivo: nano /root/server.cjs');
        console.log('3. Adicione o código do endpoint antes da linha "app.post(\'/disconnect\'"');
        console.log('4. Salve e reinicie: pm2 restart atendeai-backend');
    }
} 