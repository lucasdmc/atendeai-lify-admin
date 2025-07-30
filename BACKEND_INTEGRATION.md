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
