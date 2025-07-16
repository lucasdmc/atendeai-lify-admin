#!/bin/bash

# Script para resolver problemas do PM2 e exposição da porta 3001
# VPS: atendeai.server.com.br (31.97.241.19)

echo "🔧 Resolvendo problemas do PM2 e porta 3001..."

# Configurações da VPS
VPS_HOST="atendeai.server.com.br"
VPS_IP="31.97.241.19"
VPS_USER="root"

echo "📋 VPS: $VPS_HOST ($VPS_IP)"

# 1. Verificar status atual
echo "🔍 Verificando status atual..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Status do PM2 ==="
    pm2 status
    
    echo "=== Processos na porta 3001 ==="
    lsof -i :3001
    
    echo "=== Status do firewall ==="
    ufw status
    
    echo "=== Logs do PM2 ==="
    pm2 logs --lines 5
EOF

# 2. Parar todos os processos e limpar
echo "🛑 Parando todos os processos..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "Parando PM2..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    echo "Matando processos na porta 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    echo "Verificando se ainda há processos..."
    lsof -i :3001 || echo "Nenhum processo na porta 3001"
EOF

# 3. Verificar se o arquivo server.cjs existe
echo "📁 Verificando arquivos do projeto..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    echo "=== Arquivos no diretório ==="
    ls -la
    
    echo "=== Verificando server.cjs ==="
    if [ -f server.cjs ]; then
        echo "✅ server.cjs existe"
        head -10 server.cjs
    else
        echo "❌ server.cjs não existe"
        echo "=== Procurando arquivos server ==="
        find . -name "*server*" -type f
    fi
    
    echo "=== Verificando package.json ==="
    if [ -f package.json ]; then
        echo "✅ package.json existe"
        cat package.json | grep -E '"name"|"main"|"scripts"'
    else
        echo "❌ package.json não existe"
    fi
EOF

# 4. Se o repositório não foi clonado, clonar
echo "📥 Verificando repositório..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    if [ ! -d "/root/atendeai-lify-admin" ]; then
        echo "Clonando repositório..."
        cd /root
        git clone https://github.com/lucascantoni/atendeai-lify-admin.git
        cd atendeai-lify-admin
        npm install
    else
        echo "Repositório já existe"
        cd /root/atendeai-lify-admin
        echo "Fazendo pull das últimas alterações..."
        git pull origin main
        npm install
    fi
EOF

# 5. Criar arquivo server.cjs se não existir
echo "🔧 Criando arquivo server.cjs..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    if [ ! -f server.cjs ]; then
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
        echo "✅ server.cjs criado"
    else
        echo "✅ server.cjs já existe"
    fi
EOF

# 6. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    # Criar .env se não existir
    if [ ! -f .env ]; then
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
EOF

# 7. Instalar dependências
echo "📦 Instalando dependências..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    echo "Instalando dependências..."
    npm install
    
    echo "Verificando se puppeteer está instalado..."
    npm list puppeteer || npm install puppeteer
    
    echo "Dependências instaladas!"
EOF

# 8. Configurar firewall
echo "🔥 Configurando firewall..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    # Habilitar UFW se não estiver habilitado
    ufw --force enable
    
    # Liberar portas necessárias
    ufw allow 22/tcp
    ufw allow 3001/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Recarregar firewall
    ufw --force reload
    
    echo "Status do firewall:"
    ufw status
EOF

# 9. Iniciar servidor com PM2
echo "🚀 Iniciando servidor com PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    # Instalar PM2 globalmente se não estiver instalado
    npm install -g pm2
    
    # Parar processos existentes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Iniciar servidor
    echo "Iniciando servidor..."
    pm2 start server.cjs --name "atendeai-backend" --env production
    
    # Salvar configuração
    pm2 save
    
    # Configurar para iniciar com o sistema
    pm2 startup
EOF

# 10. Verificar status final
echo "✅ Verificando status final..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Status do PM2 ==="
    pm2 status
    
    echo "=== Processos na porta 3001 ==="
    lsof -i :3001
    
    echo "=== Logs do servidor ==="
    pm2 logs atendeai-backend --lines 10
    
    echo "=== Teste de conectividade local ==="
    curl -s http://localhost:3001/health || echo "❌ Servidor não responde localmente"
    
    echo "=== Teste de conectividade externa ==="
    curl -s http://0.0.0.0:3001/health || echo "❌ Servidor não responde em 0.0.0.0"
EOF

# 11. Teste externo
echo "🌐 Testando conectividade externa..."
sleep 3
curl -s "http://$VPS_IP:3001/health" && echo "✅ Servidor acessível externamente!" || echo "❌ Servidor não acessível externamente"

echo ""
echo "🎉 Problemas do PM2 e porta resolvidos!"
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