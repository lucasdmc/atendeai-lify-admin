# 🚀 Backend Setup - Criação de Usuários pelo Frontend

## 📋 **Resumo da Solução**

Implementamos um servidor backend Express que permite a criação de usuários pelo frontend com segurança. O backend:

- ✅ **Autentica usuários** via Supabase JWT
- ✅ **Valida permissões** (apenas admin_lify e suporte_lify podem criar usuários)
- ✅ **Cria usuários** no Supabase Auth e user_profiles
- ✅ **Associa usuários** a clínicas quando necessário
- ✅ **Mantém consistência** com rollback em caso de erro

## 🔧 **Configuração**

### **1. Instalar Dependências**
```bash
npm install
```

### **2. Configurar Variáveis de Ambiente**
Crie um arquivo `.env` baseado no `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# Backend Configuration
VITE_BACKEND_URL=http://localhost:3001

# Service Role Key (para o backend)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# WhatsApp Configuration
VITE_WHATSAPP_SERVER_URL=https://lify-chatbot-production.up.railway.app

# Environment
NODE_ENV=development
```

### **3. Obter Service Role Key**
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto `atendeai-lify-admin`
3. Acesse **Settings** > **API**
4. Copie a **Service Role Key**
5. Adicione ao arquivo `.env`

## 🚀 **Execução**

### **Opção 1: Backend e Frontend Separados**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

### **Opção 2: Ambos Simultaneamente**
```bash
npm run dev:full
```

### **Opção 3: Apenas Frontend (sem criação de usuários)**
```bash
npm run dev
```

## 🧪 **Testes**

### **1. Testar Backend**
```bash
node scripts/test-backend.js
```

### **2. Testar Frontend**
1. Acesse `http://localhost:8080`
2. Faça login como `admin_lify` ou `suporte_lify`
3. Vá para **Gestão de Usuários**
4. Teste a criação de usuários

## 🔍 **Funcionalidades Implementadas**

### **Backend (server.js)**
- ✅ **Rota de saúde**: `/health`
- ✅ **Criação de usuários**: `POST /api/users/create`
- ✅ **Listagem de usuários**: `GET /api/users`
- ✅ **Listagem de clínicas**: `GET /api/clinics`
- ✅ **Autenticação JWT**: Middleware de verificação
- ✅ **Validação de permissões**: Apenas admins podem criar usuários
- ✅ **CORS configurado**: Para desenvolvimento e produção

### **Frontend (userService.ts)**
- ✅ **Serviço de usuários**: Comunicação com backend
- ✅ **Autenticação automática**: Token JWT do Supabase
- ✅ **Tratamento de erros**: Mensagens amigáveis
- ✅ **Tipagem TypeScript**: Interfaces bem definidas

### **Componentes Atualizados**
- ✅ **CreateUserModal**: Usa novo serviço
- ✅ **GestaoUsuarios**: Lista usuários via backend
- ✅ **Validações**: Campos obrigatórios e clínica

## 🔒 **Segurança**

### **Autenticação**
- ✅ **JWT Token**: Verificação via Supabase
- ✅ **Permissões**: Apenas admin_lify e suporte_lify
- ✅ **Validação**: Campos obrigatórios e formato

### **Dados**
- ✅ **Sanitização**: Email limpo e normalizado
- ✅ **Validação**: Email único, senha mínima
- ✅ **Rollback**: Consistência em caso de erro

## 🐛 **Solução de Problemas**

### **Backend não inicia**
```bash
# Verificar se a porta 3001 está livre
lsof -i :3001

# Verificar variáveis de ambiente
echo $SUPABASE_SERVICE_ROLE_KEY
```

### **Erro 401 Unauthorized**
- Verificar se o usuário está logado
- Verificar se tem permissão de admin
- Verificar se o token JWT é válido

### **Erro 400 Bad Request**
- Verificar se todos os campos obrigatórios estão preenchidos
- Verificar se a clínica foi selecionada (quando necessário)
- Verificar se o email não está em uso

### **Erro de CORS**
- Verificar se o backend está rodando na porta 3001
- Verificar se a URL do backend está correta no frontend

## 📊 **Logs e Debug**

### **Backend Logs**
```bash
# Ver logs do backend
npm run dev:server

# Logs incluem:
# - Criação de usuários
# - Erros de validação
# - Operações de banco
```

### **Frontend Logs**
```bash
# Abrir DevTools do navegador
# Console mostra:
# - Chamadas para o backend
# - Respostas e erros
# - Status de autenticação
```

## 🚀 **Deploy**

### **Backend (Railway/Heroku)**
```bash
# Configurar variáveis de ambiente
SUPABASE_SERVICE_ROLE_KEY=sua_chave
NODE_ENV=production
PORT=3001

# Deploy
git push heroku main
```

### **Frontend (Vercel/Netlify)**
```bash
# Configurar variáveis de ambiente
VITE_BACKEND_URL=https://seu-backend.railway.app

# Deploy
npm run build:prod
```

## 🎯 **Próximos Passos**

### **Funcionalidades Futuras**
- [ ] Edição de usuários via backend
- [ ] Exclusão de usuários via backend
- [ ] Ativação/desativação de usuários
- [ ] Reset de senha
- [ ] Logs de auditoria

### **Melhorias**
- [ ] Rate limiting
- [ ] Cache de clínicas
- [ ] Validação mais robusta
- [ ] Testes automatizados
- [ ] Monitoramento

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs** do backend e frontend
2. **Testar endpoints** com Postman/Insomnia
3. **Verificar variáveis** de ambiente
4. **Consultar documentação** do Supabase

---

**✅ Sistema pronto para uso em produção!** 