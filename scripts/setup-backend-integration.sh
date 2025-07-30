#!/bin/bash

# Script para integrar o backend com o frontend
# AtendeAI Lify - Backend Integration Setup

set -e

echo "🚀 Iniciando integração do backend com o frontend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto (atendeai-lify-admin)"
    exit 1
fi

log "Verificando estrutura do projeto..."

# Verificar se o backend existe
if [ ! -d "atendeai-lify-backend" ]; then
    error "Diretório atendeai-lify-backend não encontrado"
    exit 1
fi

# Navegar para o backend
cd atendeai-lify-backend

log "Configurando backend..."

# Verificar se package.json do backend existe
if [ ! -f "package.json" ]; then
    error "package.json do backend não encontrado"
    exit 1
fi

# Instalar dependências do backend
log "Instalando dependências do backend..."
npm install

# Criar arquivo .env do backend se não existir
if [ ! -f ".env" ]; then
    log "Criando arquivo .env do backend..."
    cp env.example .env
    warn "Arquivo .env criado. Configure as variáveis de ambiente conforme necessário."
else
    log "Arquivo .env já existe"
fi

# Voltar para o diretório raiz
cd ..

log "Configurando frontend..."

# Verificar se .env do frontend existe
if [ ! -f ".env" ]; then
    log "Criando arquivo .env do frontend..."
    cp env.example .env
    warn "Arquivo .env criado. Configure as variáveis de ambiente conforme necessário."
else
    log "Arquivo .env já existe"
fi

# Atualizar .env do frontend com URL do backend
log "Configurando URL do backend no frontend..."
if grep -q "VITE_BACKEND_URL" .env; then
    log "VITE_BACKEND_URL já configurado"
else
    echo "VITE_BACKEND_URL=http://localhost:3001" >> .env
    log "VITE_BACKEND_URL adicionado ao .env"
fi

# Criar script de desenvolvimento
log "Criando script de desenvolvimento..."

cat > dev-integrated.sh << 'EOF'
#!/bin/bash

# Script para rodar frontend e backend simultaneamente
# AtendeAI Lify - Integrated Development

set -e

echo "🚀 Iniciando desenvolvimento integrado..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando processos..."
    pkill -f "node.*src/index.js" || true
    pkill -f "vite" || true
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Verificar se as portas estão disponíveis
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        warn "Porta $1 já está em uso"
        return 1
    fi
    return 0
}

# Verificar portas
log "Verificando portas..."
check_port 3001 || warn "Backend pode não iniciar na porta 3001"
check_port 8080 || warn "Frontend pode não iniciar na porta 8080"

# Iniciar backend
log "Iniciando backend na porta 3001..."
cd atendeai-lify-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
log "Aguardando backend inicializar..."
sleep 3

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    log "✅ Backend iniciado com sucesso"
else
    warn "⚠️ Backend pode não estar rodando corretamente"
fi

# Iniciar frontend
log "Iniciando frontend na porta 8080..."
npm run dev:8080 &
FRONTEND_PID=$!

log "🎉 Desenvolvimento integrado iniciado!"
log "📱 Frontend: http://localhost:8080"
log "🔧 Backend: http://localhost:3001"
log "🏥 Health Check: http://localhost:3001/health"
log ""
log "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
EOF

chmod +x dev-integrated.sh

# Criar script de build integrado
log "Criando script de build integrado..."

cat > build-integrated.sh << 'EOF'
#!/bin/bash

# Script para build integrado do projeto
# AtendeAI Lify - Integrated Build

set -e

echo "🔨 Iniciando build integrado..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Build do frontend
log "Build do frontend..."
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build do frontend falhou"
    exit 1
fi

log "✅ Build do frontend concluído"

# Preparar backend para produção
log "Preparando backend para produção..."
cd atendeai-lify-backend

# Verificar se todas as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    log "Instalando dependências do backend..."
    npm install
fi

log "✅ Backend preparado"

cd ..

log "🎉 Build integrado concluído!"
log "📁 Frontend build: ./dist"
log "🔧 Backend: ./atendeai-lify-backend"
EOF

chmod +x build-integrated.sh

# Criar script de deploy integrado
log "Criando script de deploy integrado..."

cat > deploy-integrated.sh << 'EOF'
#!/bin/bash

# Script para deploy integrado
# AtendeAI Lify - Integrated Deploy

set -e

echo "🚀 Iniciando deploy integrado..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos em produção
if [ "$NODE_ENV" != "production" ]; then
    warn "NODE_ENV não está definido como 'production'"
    warn "Configure NODE_ENV=production para deploy em produção"
fi

# Build do projeto
log "Executando build integrado..."
./build-integrated.sh

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não encontrado"
    exit 1
fi

log "✅ Build concluído"

# Aqui você pode adicionar comandos específicos para seu provedor de hospedagem
# Por exemplo, para Vercel, Railway, etc.

log "🎉 Deploy integrado concluído!"
log "📁 Frontend: ./dist"
log "🔧 Backend: ./atendeai-lify-backend"
log ""
log "Configure seu provedor de hospedagem para:"
log "- Frontend: servir arquivos de ./dist"
log "- Backend: executar 'npm start' em ./atendeai-lify-backend"
EOF

chmod +x deploy-integrated.sh

# Criar README de integração
log "Criando documentação de integração..."

cat > BACKEND_INTEGRATION.md << 'EOF'
# 🔗 Integração Backend-Frontend

## 📋 Visão Geral

Este projeto agora está configurado com integração completa entre frontend (React/Vite) e backend (Node.js/Express).

## 🏗️ Estrutura

```
atendeai-lify-admin/
├── src/                    # Frontend (React/Vite)
├── atendeai-lify-backend/  # Backend (Node.js/Express)
├── scripts/                # Scripts de automação
└── dist/                   # Build do frontend
```

## 🚀 Scripts Disponíveis

### Desenvolvimento
```bash
# Rodar frontend e backend simultaneamente
./dev-integrated.sh

# Ou separadamente:
# Backend
cd atendeai-lify-backend && npm run dev

# Frontend
npm run dev:8080
```

### Build
```bash
# Build integrado
./build-integrated.sh

# Ou separadamente:
# Frontend
npm run build

# Backend (não requer build)
cd atendeai-lify-backend && npm install
```

### Deploy
```bash
# Deploy integrado
./deploy-integrated.sh
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
JWT_SECRET=your-jwt-secret
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
WHATSAPP_META_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_META_PHONE_NUMBER_ID=your-phone-number-id
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/logout` - Logout

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Clínicas
- `GET /api/clinics` - Listar clínicas
- `POST /api/clinics` - Criar clínica
- `PUT /api/clinics/:id` - Atualizar clínica
- `DELETE /api/clinics/:id` - Deletar clínica

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Deletar agendamento

## 🔍 Health Check

```bash
curl http://localhost:3001/health
```

## 🐛 Debug

### Logs do Backend
```bash
cd atendeai-lify-backend
npm run dev:debug
```

### Logs do Frontend
```bash
npm run dev:8080
```

## 📊 Monitoramento

- Backend logs: `atendeai-lify-backend/logs/`
- Frontend logs: Console do navegador
- Health check: `http://localhost:3001/health`

## 🔒 Segurança

- CORS configurado para `http://localhost:8080`
- Rate limiting: 100 requests por 15 minutos
- JWT para autenticação
- Helmet para headers de segurança
- Validação de entrada com express-validator

## 🚀 Deploy

### Desenvolvimento
1. Clone o repositório
2. Execute `./scripts/setup-backend-integration.sh`
3. Configure as variáveis de ambiente
4. Execute `./dev-integrated.sh`

### Produção
1. Configure as variáveis de ambiente de produção
2. Execute `./deploy-integrated.sh`
3. Configure seu provedor de hospedagem

## 📞 Suporte

Para problemas com a integração:
1. Verifique os logs em `atendeai-lify-backend/logs/`
2. Teste o health check: `curl http://localhost:3001/health`
3. Verifique as variáveis de ambiente
4. Execute `npm install` em ambos os diretórios
EOF

log "✅ Integração configurada com sucesso!"
log ""
log "📋 Próximos passos:"
log "1. Configure as variáveis de ambiente em .env"
log "2. Configure as variáveis de ambiente em atendeai-lify-backend/.env"
log "3. Execute: ./dev-integrated.sh"
log ""
log "📚 Documentação: BACKEND_INTEGRATION.md"
log "🚀 Scripts criados:"
log "  - dev-integrated.sh (desenvolvimento)"
log "  - build-integrated.sh (build)"
log "  - deploy-integrated.sh (deploy)" 