#!/bin/bash

# Script de Deploy para Produção - AtendeAI Lify
# Execute: ./scripts/deploy-production.sh

set -e

echo "🚀 Iniciando deploy para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto"
    exit 1
fi

log "📋 Verificando pré-requisitos..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm não está instalado"
    exit 1
fi

log "✅ Pré-requisitos verificados"

# 1. Configurar variáveis de ambiente para produção
log "🔧 Configurando variáveis de ambiente para produção..."

# Criar arquivo .env.production se não existir
if [ ! -f ".env.production" ]; then
    log "📝 Criando arquivo .env.production..."
    cat > .env.production << EOF
# Configurações de Produção - AtendeAI Lify
NODE_ENV=production

# Google OAuth
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com

# Supabase
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Server (VPS)
VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001

# URLs de Produção
VITE_PRODUCTION_URL=https://atendeai.lify.com.br
VITE_REDIRECT_URI=https://atendeai.lify.com.br/agendamentos
EOF
    log "✅ Arquivo .env.production criado"
else
    log "✅ Arquivo .env.production já existe"
fi

# 2. Instalar dependências
log "📦 Instalando dependências..."
npm install

# 3. Build do projeto
log "🔨 Fazendo build do projeto..."
npm run build

# 4. Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não foi criado"
    exit 1
fi

log "✅ Build concluído com sucesso"

# 5. Configurar CORS para produção
log "🌐 Configurando CORS para produção..."

# Verificar se o arquivo de configuração do servidor existe
if [ -f "server.js" ]; then
    log "✅ Servidor backend encontrado"
    
    # Criar arquivo de configuração do backend para produção
    cat > server.production.js << 'EOF'
import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS para produção
app.use(cors({
  origin: [
    'https://atendeai.lify.com.br',
    'https://www.atendeai.lify.com.br',
    'https://preview--atendeai-lify-admin.lovable.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Armazenar clientes WhatsApp
const whatsappClients = new Map();
const sessionStates = new Map();

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production',
    activeSessions: whatsappClients.size,
    sessions: Array.from(sessionStates.entries()).map(([agentId, state]) => ({
      agentId,
      status: state.status,
      connected: state.connected || false,
      connectedAt: state.connectedAt
    }))
  });
});

// Rota para gerar QR Code
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId é obrigatório' });
    }

    // Verificar se já existe uma sessão
    if (whatsappClients.has(agentId)) {
      const state = sessionStates.get(agentId);
      if (state && state.qrCode) {
        return res.json({ 
          success: true, 
          qrCode: state.qrCode,
          status: state.status 
        });
      }
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: agentId }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        headless: true
      }
    });

    client.on('qr', async (qr) => {
      console.log('QR Code gerado para:', agentId);
      const qrCode = await qrcode.toDataURL(qr);
      sessionStates.set(agentId, { 
        status: 'qr', 
        qrCode,
        connected: false 
      });
    });

    client.on('ready', () => {
      console.log('WhatsApp conectado para:', agentId);
      sessionStates.set(agentId, { 
        status: 'connected', 
        connected: true,
        connectedAt: new Date().toISOString()
      });
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado para:', agentId, 'Razão:', reason);
      sessionStates.set(agentId, { 
        status: 'disconnected', 
        connected: false 
      });
    });

    client.on('auth_failure', (msg) => {
      console.error('Falha na autenticação para:', agentId, msg);
      sessionStates.set(agentId, { 
        status: 'auth_failure', 
        connected: false 
      });
    });

    await client.initialize();
    whatsappClients.set(agentId, client);

    res.json({ success: true, message: 'Cliente WhatsApp inicializado' });
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar status
app.get('/api/whatsapp/status/:agentId', (req, res) => {
  const { agentId } = req.params;
  const state = sessionStates.get(agentId) || { status: 'disconnected' };
  res.json(state);
});

// Rota para desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId } = req.body;
    const client = whatsappClients.get(agentId);
    
    if (client) {
      await client.destroy();
      whatsappClients.delete(agentId);
      sessionStates.delete(agentId);
      console.log('Cliente desconectado:', agentId);
    }
    
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para limpar todas as sessões
app.post('/api/whatsapp/clear-sessions', async (req, res) => {
  try {
    const clients = Array.from(whatsappClients.values());
    for (const client of clients) {
      try {
        await client.destroy();
      } catch (error) {
        console.error('Erro ao destruir cliente:', error);
      }
    }
    
    whatsappClients.clear();
    sessionStates.clear();
    
    res.json({ success: true, message: 'Todas as sessões foram limpas' });
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`🔧 Ambiente: Produção`);
});
EOF
    log "✅ Configuração do servidor para produção criada"
fi

# 6. Criar script de deploy para VPS
log "🖥️ Criando script de deploy para VPS..."

cat > scripts/deploy-vps.sh << 'EOF'
#!/bin/bash

# Script de Deploy para VPS - AtendeAI Lify
# Execute na VPS: ./deploy-vps.sh

set -e

echo "🚀 Deploy para VPS - AtendeAI Lify"

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Parar processo anterior se existir
pm2 stop atendeai-whatsapp || true
pm2 delete atendeai-whatsapp || true

# Iniciar servidor WhatsApp com PM2
echo "🔄 Iniciando servidor WhatsApp..."
pm2 start server.production.js --name "atendeai-whatsapp" --interpreter node

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
pm2 startup

echo "✅ Servidor WhatsApp iniciado com PM2"
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs atendeai-whatsapp"
EOF

chmod +x scripts/deploy-vps.sh
log "✅ Script de deploy para VPS criado"

# 7. Criar checklist de verificação
log "📋 Criando checklist de verificação..."

cat > DEPLOY_CHECKLIST.md << 'EOF'
# ✅ Checklist de Deploy para Produção

## 🔧 Configurações do Frontend
- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] Build do projeto executado com sucesso
- [ ] CORS configurado para domínio de produção
- [ ] Google OAuth configurado para produção

## 🖥️ Configurações da VPS
- [ ] Servidor VPS acessível
- [ ] Porta 3001 liberada no firewall
- [ ] Node.js instalado na VPS
- [ ] PM2 instalado na VPS
- [ ] Servidor WhatsApp rodando com PM2

## 🌐 Configurações do Domínio
- [ ] DNS configurado para atendeai.lify.com.br
- [ ] SSL/HTTPS configurado
- [ ] Proxy reverso (Nginx) configurado
- [ ] Redirecionamentos configurados

## 🗄️ Configurações do Banco de Dados
- [ ] Supabase configurado para produção
- [ ] Tabelas criadas e populadas
- [ ] Políticas RLS configuradas
- [ ] Edge Functions deployadas

## 🧪 Testes de Funcionalidade
- [ ] Login/Autenticação funcionando
- [ ] Conexão com Google Calendar funcionando
- [ ] WhatsApp QR Code gerando
- [ ] Agendamentos salvando
- [ ] Conversas funcionando

## 📊 Monitoramento
- [ ] Logs configurados
- [ ] Health checks funcionando
- [ ] Alertas configurados
- [ ] Backup configurado

## 🔒 Segurança
- [ ] Variáveis sensíveis protegidas
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado
- [ ] Headers de segurança configurados
EOF

log "✅ Checklist de verificação criado"

# 8. Instruções finais
log "🎉 Deploy preparado com sucesso!"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "1. 🔧 Configure as variáveis de ambiente na VPS:"
echo "   - VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001"
echo ""
echo "2. 🖥️ Execute na VPS:"
echo "   scp scripts/deploy-vps.sh usuario@seu-servidor-vps.com:/home/usuario/"
echo "   ssh usuario@seu-servidor-vps.com"
echo "   cd /home/usuario && chmod +x deploy-vps.sh && ./deploy-vps.sh"
echo ""
echo "3. 🌐 Configure o proxy reverso (Nginx):"
echo "   - Frontend: https://atendeai.lify.com.br"
echo "   - Backend: https://atendeai.lify.com.br/api (proxy para VPS)"
echo ""
echo "4. 🧪 Teste as funcionalidades:"
echo "   - Login: https://atendeai.lify.com.br"
echo "   - Agendamentos: https://atendeai.lify.com.br/agendamentos"
echo "   - WhatsApp: https://atendeai.lify.com.br/agentes"
echo ""
echo "5. 📊 Monitore os logs:"
echo "   - Frontend: logs do Lify"
echo "   - Backend: pm2 logs atendeai-whatsapp"
echo ""
echo -e "${GREEN}✅ Deploy preparado! Siga as instruções acima.${NC}" 