#!/bin/bash

echo "🔧 Inserindo endpoint /api/whatsapp/generate-qr no servidor..."

ssh root@31.97.241.19 << 'EOF'
cd /root

# Fazer backup
cp server.cjs server.cjs.backup3

# Criar arquivo temporário com o endpoint
cat > /tmp/endpoint_block.js << 'ENDPOINT'
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

        console.log('Gerando QR Code para agente:', agentId);

        // Desconectar cliente anterior se existir
        if (client) {
            client.destroy();
        }

        // Criar novo cliente
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'atendeai-' + agentId,
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
                connectionId: 'temp-' + Date.now(),
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
ENDPOINT

# Encontrar a linha do app.listen
listen_line=$(grep -n "app.listen" server.cjs | cut -d: -f1)

if [ -z "$listen_line" ]; then
    echo "❌ Não foi possível encontrar app.listen no arquivo"
    exit 1
fi

echo "📝 Inserindo endpoint antes da linha $listen_line..."

# Criar arquivo temporário com o conteúdo até app.listen
head -n $((listen_line - 1)) server.cjs > /tmp/server_part1.cjs

# Adicionar o endpoint
cat /tmp/endpoint_block.js >> /tmp/server_part1.cjs

# Adicionar o resto do arquivo
tail -n +$listen_line server.cjs >> /tmp/server_part1.cjs

# Substituir o arquivo original
mv /tmp/server_part1.cjs server.cjs

# Verificar sintaxe
if node -c server.cjs; then
    echo "✅ Sintaxe OK - Reiniciando servidor..."
    pm2 restart atendeai-backend
    echo "✅ Servidor reiniciado!"
    
    # Testar o endpoint
    echo "🔍 Testando o endpoint..."
    sleep 3
    curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
         -H "Content-Type: application/json" \
         -d '{"agentId":"0e170bf5-e767-4dea-90e5-8fccbdbfa6a5"}' \
         --max-time 10 || echo "❌ Endpoint ainda não responde (pode ser normal na primeira tentativa)"
else
    echo "❌ Erro de sintaxe - Restaurando backup..."
    cp server.cjs.backup3 server.cjs
    pm2 restart atendeai-backend
fi

# Limpar arquivos temporários
rm -f /tmp/endpoint_block.js
EOF

echo "✅ Script executado!" 