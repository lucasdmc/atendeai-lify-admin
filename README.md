# AtendeAI - Sistema de Gestão de Atendimento

Sistema completo para gestão de atendimento via WhatsApp com IA, agendamentos e integração com Google Calendar.

## 🚀 Melhorias Aplicadas

### Segurança
- ✅ Removidas credenciais hardcoded
- ✅ Implementado sistema de variáveis de ambiente
- ✅ Configuração TypeScript mais rigorosa
- ✅ Sistema de logging estruturado

### Performance
- ✅ Hook de memoização para otimização
- ✅ Sistema de cache inteligente
- ✅ Componentes de loading reutilizáveis
- ✅ Tratamento de erros padronizado

### UX/UI
- ✅ Loading states consistentes
- ✅ Feedback de erro melhorado
- ✅ Componentes reutilizáveis

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase
- Conta Google Cloud Platform (para integração com Calendar)

## 🔧 Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd atendeai-lify-admin
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `env.example` para `.env`:
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# WhatsApp Configuration
VITE_WHATSAPP_SERVER_URL=your_whatsapp_server_url_here

# Environment
NODE_ENV=development
```

### 4. Configure o Google Cloud Platform
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Calendar
4. Configure as credenciais OAuth 2.0
5. Adicione as URLs de redirecionamento autorizadas

### 5. Configure o Supabase
1. Crie um projeto no [Supabase](https://supabase.com/)
2. Execute as migrações do banco de dados
3. Configure as políticas RLS
4. Configure as Edge Functions

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── agendamentos/   # Componentes específicos
│   ├── calendar/       # Componentes do calendário
│   └── ...
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
├── services/           # Serviços e APIs
├── utils/              # Utilitários
└── integrations/       # Integrações externas
```

## 🔒 Segurança

### Variáveis de Ambiente
- Nunca commite credenciais no código
- Use sempre variáveis de ambiente
- Configure diferentes valores para dev/prod

### TypeScript
- Configuração rigorosa para capturar erros em compile time
- Tipagem estrita para evitar erros em runtime

### Logging
- Sistema de logging estruturado
- Logs sensíveis só aparecem em desenvolvimento
- Níveis de log configuráveis

## 🐛 Tratamento de Erros

O projeto utiliza um sistema padronizado de tratamento de erros:

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleError, handleAsyncError } = useErrorHandler();

// Para operações síncronas
try {
  // código que pode falhar
} catch (error) {
  handleError(error, { 
    context: 'ComponentName',
    showToast: true 
  });
}

// Para operações assíncronas
const result = await handleAsyncError(
  async () => {
    // operação assíncrona
  },
  { context: 'ComponentName' }
);
```

## 📊 Performance

### Otimizações Implementadas
- Memoização de callbacks com cache
- Debounce e throttle para operações frequentes
- Limpeza automática de cache
- Queries otimizadas com React Query

### Monitoramento
- Logs de performance em desenvolvimento
- Métricas de tempo de resposta
- Cache hit/miss tracking

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para suporte@atendeai.com ou abra uma issue no GitHub.
