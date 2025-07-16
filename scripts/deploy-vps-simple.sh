#!/bin/bash

# Script simples para deploy na VPS
# Execute este script diretamente na VPS

echo "🚀 Deploy simples na VPS..."

# Configurações
PROJECT_DIR="/root/atendeai-lify-admin"
BACKEND_PORT="3001"

echo "📋 Configurações:"
echo "  Diretório: $PROJECT_DIR"
echo "  Porta: $BACKEND_PORT"

# 1. Parar processos existentes
echo "🛑 Parando processos existentes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 2. Verificar/criar diretório do projeto
echo "📁 Verificando diretório do projeto..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Clonando repositório..."
    cd /root
    git clone https://github.com/lucascantoni/atendeai-lify-admin.git
else
    echo "Diretório já existe, fazendo pull..."
    cd $PROJECT_DIR
    git pull origin main
fi

# 3. Instalar dependências
echo "📦 Instalando dependências..."
cd $PROJECT_DIR
npm install

# 4. Criar server.cjs se não existir
echo "🔧 Verificando server.cjs..."
if [ ! -f "server.cjs" ]; then
    echo "Criando server.cjs..."
    cat > server.cjs << 'EOF'
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Configurar CORS
app.use(cors({
    origin: [
        'https://atendeai.lify.com.br',
        'http://localhost:8080',
        'http://localhost:3000'
    ],
    credentials: true
}));

app.use(express.json());

// Criar diretórios se não existirem
const sessionsDir = path.join(__dirname, 'sessions');
const dataDir = path.join(__dirname, 'whatsapp-data');

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Variável global para o cliente WhatsApp
let client = null;
let qrCode = null;

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        whatsapp: client ? 'connected' : 'disconnected',
        port: PORT,
        host: HOST
    });
});

// Gerar QR Code
app.get('/generate-qr', async (req, res) => {
    try {
        if (client) {
            client.destroy();
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'atendeai-whatsapp',
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

        client.on('qr', async (qr) => {
            console.log('QR Code recebido');
            qrCode = await qrcode.toDataURL(qr);
        });

        client.on('ready', () => {
            console.log('Cliente WhatsApp pronto!');
            qrCode = null;
        });

        client.on('disconnected', (reason) => {
            console.log('Cliente WhatsApp desconectado:', reason);
            client = null;
            qrCode = null;
        });

        client.initialize();

        res.json({ 
            message: 'QR Code sendo gerado...',
            status: 'generating'
        });

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).json({ 
            error: 'Erro ao gerar QR Code',
            details: error.message 
        });
    }
});

// Obter QR Code
app.get('/qr-code', (req, res) => {
    if (qrCode) {
        res.json({ qrCode, status: 'available' });
    } else if (client && client.isConnected) {
        res.json({ status: 'connected' });
    } else {
        res.json({ status: 'not_available' });
    }
});

// Status do WhatsApp
app.get('/whatsapp-status', (req, res) => {
    res.json({
        connected: client ? client.isConnected : false,
        hasQR: !!qrCode,
        status: client ? (client.isConnected ? 'connected' : 'connecting') : 'disconnected'
    });
});

// Enviar mensagem
app.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!client || !client.isConnected) {
            return res.status(400).json({ error: 'WhatsApp não está conectado' });
        }

        if (!number || !message) {
            return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
        }

        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        const result = await client.sendMessage(chatId, message);

        res.json({ 
            success: true, 
            messageId: result.id._serialized 
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ 
            error: 'Erro ao enviar mensagem',
            details: error.message 
        });
    }
});

// Desconectar WhatsApp
app.post('/disconnect', (req, res) => {
    try {
        if (client) {
            client.destroy();
            client = null;
            qrCode = null;
        }
        res.json({ message: 'WhatsApp desconectado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao desconectar' });
    }
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor WhatsApp rodando em http://${HOST}:${PORT}`);
    console.log(`📱 Health check: http://${HOST}:${PORT}/health`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
});
EOF
    echo "✅ server.cjs criado"
else
    echo "✅ server.cjs já existe"
fi

# 5. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# Configurações do servidor
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Configurações do WhatsApp
WHATSAPP_SESSION_PATH=/root/atendeai-lify-admin/sessions
WHATSAPP_DATA_PATH=/root/atendeai-lify-admin/whatsapp-data

# Configurações do CORS
CORS_ORIGIN=https://atendeai.lify.com.br,http://localhost:8080,http://localhost:3000
ENVEOF
    echo "✅ .env criado"
else
    echo "✅ .env já existe"
fi

# 6. Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 3001/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force reload

# 7. Instalar PM2 se necessário
echo "📦 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# 8. Iniciar servidor
echo "🚀 Iniciando servidor..."
pm2 start server.cjs --name "atendeai-backend" --env production
pm2 save
pm2 startup

# 9. Verificar status
echo "✅ Verificando status..."
echo "=== Status do PM2 ==="
pm2 status

echo "=== Processos na porta 3001 ==="
lsof -i :3001

echo "=== Teste de conectividade ==="
curl -s http://localhost:3001/health || echo "❌ Servidor não responde localmente"
curl -s http://0.0.0.0:3001/health || echo "❌ Servidor não responde em 0.0.0.0"

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📋 Comandos úteis:"
echo "  Ver logs: pm2 logs atendeai-backend"
echo "  Reiniciar: pm2 restart atendeai-backend"
echo "  Status: pm2 status"
echo ""
echo "🔗 URLs:"
echo "  Health Check: http://localhost:3001/health"
echo "  WhatsApp QR: http://localhost:3001/generate-qr"
echo "  Status WhatsApp: http://localhost:3001/whatsapp-status" 