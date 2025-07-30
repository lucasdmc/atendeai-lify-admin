# AtendeAI Lify - Workspace

Workspace principal do sistema AtendeAI Lify, contendo os repositórios frontend e backend.

## 📁 Estrutura do Workspace

```
atendeai-lify-admin/
├── atendeai-lify-admin/     # Frontend (React + TypeScript)
└── atendeai-lify-backend/   # Backend (Node.js + Express)
```

## 🚀 Início Rápido

### 1. Configurar o Backend

```bash
cd atendeai-lify-backend
npm install
cp env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

O backend estará rodando em: http://localhost:3001

### 2. Configurar o Frontend

```bash
cd atendeai-lify-admin
npm install
cp env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

O frontend estará rodando em: http://localhost:3000

## 📚 Documentação

### Backend (atendeai-lify-backend)

- [README do Backend](./atendeai-lify-backend/README.md)
- API RESTful para gerenciamento de dados
- Autenticação JWT
- Integração com WhatsApp Business API
- Gerenciamento de agendamentos e clínicas

### Frontend (atendeai-lify-admin)

- [README do Frontend](./atendeai-lify-admin/README.md)
- Interface administrativa em React + TypeScript
- Dashboard com métricas e gráficos
- Gerenciamento de agendamentos
- Integração com WhatsApp
- Sistema de usuários e permissões

## 🔧 Configuração do Ambiente

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Git

### Variáveis de Ambiente

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
VITE_WHATSAPP_API_URL=your-whatsapp-api-url
```

## 🚀 Deploy

### Backend
O backend pode ser deployado em:
- VPS tradicional
- Heroku
- Railway
- DigitalOcean App Platform

### Frontend
O frontend pode ser deployado em:
- Vercel
- Netlify
- VPS tradicional

## 📊 Funcionalidades Principais

### Sistema de Agendamentos
- Criação e gerenciamento de agendamentos
- Filtros por clínica, data e status
- Calendário integrado
- Notificações automáticas

### Gerenciamento de Clínicas
- Cadastro de clínicas
- Configurações por clínica
- Associação de usuários
- Relatórios específicos

### Integração WhatsApp
- Conexão com WhatsApp Business API
- Chat em tempo real
- Histórico de conversas
- Automação de respostas

### Sistema de Usuários
- Autenticação JWT
- Controle de permissões
- Perfis de acesso
- Auditoria de ações

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

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@atendeai.com
- Documentação: [docs.atendeai.com](https://docs.atendeai.com)

## 🔗 Links Úteis

- [Documentação da API](http://localhost:3001/api/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Vercel Dashboard](https://vercel.com/dashboard)
