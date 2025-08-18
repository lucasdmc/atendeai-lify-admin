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

### Fonte de Verdade

- Documento principal: `docs/ATENDE-AI-Definicao-Tecnica.md` (fonte única de features, critérios de aceite e problemas)
- Addenda técnica: `docs/ATENDE-AI-ADDENDA.md` (RNFs numéricos, Gherkin, esquema `contextualization_json`, regras de simulação, matriz de permissões, plano de testes)

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

## 🔗 Sistema de Contextualização Integrado

### ✨ **Nova Integração: JSON da Tela de Clínicas + Serviços Core**
O sistema agora integra perfeitamente o **sistema de contextualização JSON da tela de clínicas** com os **serviços core** desenvolvidos com o Manus:

- **🏥 ClinicContextManager**: Gerencia toda contextualização das clínicas
- **📄 JSONs Personalizados**: Personalidade, horários, políticas específicas
- **🔗 Dados Unificados**: Banco + JSON em um só lugar
- **🚀 Cache Inteligente**: Performance otimizada com fallback robusto

### 📁 Arquivos de Contextualização (ÚNICA FONTE)
```
data/
├── Sistema multiclínica configurado via tela de clínicas
└── contextualizacao-esadi.json        # Clínica ESADI (da tela de clínicas)
```

**🎯 IMPORTANTE:** Estes são os únicos arquivos que o sistema usa. NUNCA assume ou cria JSONs manualmente.

### 🧪 Testar Integração
```bash
node test-clinic-context-integration.js
```

**📚 Documentação Completa**: [CLINIC_CONTEXT_INTEGRATION.md](./docs/CLINIC_CONTEXT_INTEGRATION.md)

---

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
