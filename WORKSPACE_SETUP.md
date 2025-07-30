# AtendeAI Lify - Setup do Workspace

Este documento contém instruções completas para configurar e executar o workspace AtendeAI Lify.

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Git
- Docker (opcional, para desenvolvimento com containers)

## 🚀 Setup Rápido

### 1. Setup Automático

Execute o script de setup automático:

```bash
./setup-workspace.sh
```

Este script irá:
- Verificar a versão do Node.js
- Instalar dependências do backend e frontend
- Criar arquivos .env de exemplo
- Criar diretórios necessários

### 2. Setup Manual

Se preferir fazer o setup manualmente:

#### Backend
```bash
cd atendeai-lify-backend
npm install
cp env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

#### Frontend
```bash
cd atendeai-lify-admin
npm install
cp env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

## 🔧 Configuração das Variáveis de Ambiente

### Backend (.env)
```env
# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Configurações de Segurança
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=12

# Configurações do Banco de Dados
DATABASE_URL=your-database-connection-string

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000

# Configurações de Log
LOG_LEVEL=info

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Configurações de WhatsApp
WHATSAPP_API_URL=
WHATSAPP_API_KEY=

# Configurações de Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Frontend (.env)
```env
# API Backend
VITE_API_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# WhatsApp
VITE_WHATSAPP_API_URL=your-whatsapp-api-url

# Outras configurações
VITE_APP_NAME=AtendeAI Lify
VITE_APP_VERSION=1.0.0
```

## 🐳 Desenvolvimento com Docker

### Usando Docker Compose

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Executar em background
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f
```

### Serviços Disponíveis

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Nginx**: http://localhost:80

## 📊 Gerenciamento de Processos

### Usando PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar todos os serviços
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar serviços
pm2 restart all

# Parar serviços
pm2 stop all

# Salvar configuração
pm2 save
```

### Usando Scripts Manuais

```bash
# Iniciar backend
cd atendeai-lify-backend
npm start

# Iniciar frontend (em outro terminal)
cd atendeai-lify-admin
npm run dev
```

## 🚀 Deploy em Produção

### Deploy Automático

```bash
./deploy.sh
```

### Deploy Manual

1. **Backend**:
   ```bash
   cd atendeai-lify-backend
   npm ci --only=production
   npm start
   ```

2. **Frontend**:
   ```bash
   cd atendeai-lify-admin
   npm ci
   npm run build
   # Servir arquivos estáticos com nginx ou similar
   ```

## 🧪 Testes

### Backend
```bash
cd atendeai-lify-backend
npm test
```

### Frontend
```bash
cd atendeai-lify-admin
npm test
```

## 📚 Estrutura do Projeto

```
atendeai-lify-admin/
├── atendeai-lify-admin/     # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   ├── hooks/          # Hooks customizados
│   │   └── ...
│   ├── package.json
│   └── README.md
├── atendeai-lify-backend/   # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Serviços de negócio
│   │   └── ...
│   ├── package.json
│   └── README.md
├── docker-compose.yml       # Configuração Docker
├── ecosystem.config.js      # Configuração PM2
├── deploy.sh               # Script de deploy
├── setup-workspace.sh      # Script de setup
└── README.md               # Documentação principal
```

## 🔍 Monitoramento e Logs

### Logs do Backend
- Arquivo: `atendeai-lify-backend/logs/`
- Console: `pm2 logs atendeai-backend`

### Logs do Frontend
- Console: `pm2 logs atendeai-frontend`

### Health Checks
- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
# Setup inicial
./setup-workspace.sh

# Iniciar desenvolvimento
pm2 start ecosystem.config.js

# Parar desenvolvimento
pm2 stop all

# Ver logs em tempo real
pm2 logs -f
```

### Produção
```bash
# Deploy completo
./deploy.sh

# Verificar status
pm2 status

# Reiniciar serviços
pm2 restart all
```

### Docker
```bash
# Iniciar com Docker
docker-compose up --build

# Parar Docker
docker-compose down

# Ver logs Docker
docker-compose logs -f
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**:
   ```bash
   # Verificar processos na porta
   lsof -i :3000
   lsof -i :3001
   
   # Matar processo
   kill -9 <PID>
   ```

2. **Dependências não instaladas**:
   ```bash
   # Backend
   cd atendeai-lify-backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd atendeai-lify-admin
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Variáveis de ambiente não configuradas**:
   ```bash
   # Verificar arquivos .env
   ls -la atendeai-lify-backend/.env
   ls -la atendeai-lify-admin/.env
   ```

4. **PM2 não encontrado**:
   ```bash
   npm install -g pm2
   ```

## 📞 Suporte

Para suporte técnico:
- Email: suporte@atendeai.com
- Documentação: [docs.atendeai.com](https://docs.atendeai.com)
- Issues: [GitHub Issues](https://github.com/atendeai/lify/issues)

## 📄 Licença

Este projeto está sob a licença MIT. 