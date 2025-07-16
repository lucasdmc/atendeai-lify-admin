#!/bin/bash

# Script para corrigir problemas de dependências e localização do servidor
# VPS: atendeai.server.com.br (31.97.241.19)

echo "🔧 Corrigindo problemas de dependências..."

# Configurações da VPS
VPS_HOST="atendeai.server.com.br"
VPS_IP="31.97.241.19"
VPS_USER="root"

echo "📋 VPS: $VPS_HOST ($VPS_IP)"

# 1. Parar PM2 e limpar
echo "🛑 Parando PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
EOF

# 2. Verificar e corrigir diretório do projeto
echo "📁 Verificando diretório do projeto..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Verificando diretórios ==="
    ls -la /root/
    
    echo "=== Verificando se o projeto existe ==="
    if [ -d "/root/atendeai-lify-admin" ]; then
        echo "✅ Diretório do projeto existe"
        cd /root/atendeai-lify-admin
        ls -la
    else
        echo "❌ Diretório do projeto não existe"
        echo "Criando diretório e clonando repositório..."
        cd /root
        git clone https://github.com/lucascantoni/atendeai-lify-admin.git
    fi
    
    echo "=== Verificando package.json ==="
    cd /root/atendeai-lify-admin
    if [ -f "package.json" ]; then
        echo "✅ package.json existe"
        cat package.json | head -20
    else
        echo "❌ package.json não existe"
        echo "Criando package.json básico..."
        cat > package.json << 'PKGEOF'
{
  "name": "atendeai-lify-admin",
  "version": "1.0.0",
  "description": "AtendeAI Lify Admin",
  "main": "server.cjs",
  "scripts": {
    "start": "node server.cjs",
    "dev": "node server.cjs"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "whatsapp-web.js": "^1.23.0",
    "qrcode": "^1.5.3",
    "puppeteer": "^21.5.2"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
PKGEOF
    fi
EOF

# 3. Instalar dependências
echo "📦 Instalando dependências..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    echo "Instalando dependências..."
    npm install
    
    echo "Verificando se as dependências foram instaladas..."
    ls -la node_modules/
    
    echo "Verificando se express foi instalado..."
    npm list express
EOF

# 4. Criar server.cjs no diretório correto
echo "🔧 Criando server.cjs no diretório correto..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    echo "Criando server.cjs..."
    cat > server.cjs << 'SERVEREOF'
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
SERVEREOF

    echo "✅ server.cjs criado no diretório correto"
    
    # Remover server.cjs do diretório root se existir
    rm -f /root/server.cjs
    
    echo "=== Verificando arquivos ==="
    ls -la
EOF

# 5. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
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

    echo "✅ .env configurado"
EOF

# 6. Iniciar servidor com PM2
echo "🚀 Iniciando servidor com PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    echo "Iniciando servidor..."
    pm2 start server.cjs --name "atendeai-backend" --env production
    
    echo "Salvando configuração..."
    pm2 save
    
    echo "Configurando para iniciar com o sistema..."
    pm2 startup
EOF

# 7. Verificar status
echo "✅ Verificando status..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Status do PM2 ==="
    pm2 status
    
    echo "=== Processos na porta 3001 ==="
    lsof -i :3001
    
    echo "=== Logs do servidor ==="
    pm2 logs atendeai-backend --lines 10
    
    echo "=== Teste de conectividade ==="
    sleep 3
    curl -s http://localhost:3001/health || echo "❌ Servidor não responde localmente"
    curl -s http://0.0.0.0:3001/health || echo "❌ Servidor não responde em 0.0.0.0"
EOF

# 8. Teste externo
echo "🌐 Testando conectividade externa..."
sleep 5
curl -s "http://$VPS_IP:3001/health" && echo "✅ Servidor acessível externamente!" || echo "❌ Servidor não acessível externamente"

echo ""
echo "🎉 Problemas de dependências corrigidos!"
echo ""
echo "📋 Comandos úteis:"
echo "  Ver logs: ssh root@$VPS_IP 'pm2 logs atendeai-backend'"
echo "  Reiniciar: ssh root@$VPS_IP 'pm2 restart atendeai-backend'"
echo "  Status: ssh root@$VPS_IP 'pm2 status'"
echo ""
echo "🔗 URLs:"
echo "  Health Check: http://$VPS_IP:3001/health"
echo "  WhatsApp QR: http://$VPS_IP:3001/generate-qr"
echo "  Status WhatsApp: http://$VPS_IP:3001/whatsapp-status" 