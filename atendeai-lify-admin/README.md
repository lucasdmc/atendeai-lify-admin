# AtendeAI Lify Admin - Frontend

Interface administrativa para o sistema AtendeAI Lify, desenvolvida em React com TypeScript.

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd atendeai-lify-admin
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   ├── agendamentos/ # Componentes de agendamentos
│   ├── agentes/      # Componentes de agentes
│   ├── calendar/     # Componentes de calendário
│   ├── clinics/      # Componentes de clínicas
│   ├── conversations/# Componentes de conversas
│   ├── dashboard/    # Componentes do dashboard
│   ├── ui/           # Componentes de UI reutilizáveis
│   ├── users/        # Componentes de usuários
│   └── whatsapp/     # Componentes do WhatsApp
├── config/           # Configurações
├── contexts/         # Contextos React
├── data/             # Dados estáticos
├── hooks/            # Hooks customizados
├── integrations/     # Integrações externas
├── lib/              # Utilitários
├── pages/            # Páginas da aplicação
├── services/         # Serviços de API
├── types/            # Tipos TypeScript
└── utils/            # Utilitários
```

## 🔧 Configuração

### Variáveis de Ambiente

- `VITE_API_URL`: URL da API backend
- `VITE_SUPABASE_URL`: URL do Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `VITE_WHATSAPP_API_URL`: URL da API do WhatsApp

## 📚 Funcionalidades

### Dashboard
- Visão geral do sistema
- Estatísticas de agendamentos
- Gráficos e métricas

### Agendamentos
- Listagem de agendamentos
- Criação de novos agendamentos
- Edição e cancelamento
- Filtros por clínica, data e status

### Clínicas
- Gerenciamento de clínicas
- Configurações por clínica
- Associação de usuários

### Usuários
- Gerenciamento de usuários
- Controle de permissões
- Perfis de acesso

### WhatsApp
- Integração com WhatsApp Business API
- Gerenciamento de conexões
- Chat em tempo real

### Conversas
- Histórico de conversas
- Chat integrado
- Contextualização de conversas

## 🧪 Testes

```bash
npm test
```

## 📦 Build

```bash
npm run build
```

## 🚀 Deploy

O projeto está configurado para deploy em:

- Vercel
- Netlify
- VPS tradicional

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔗 Links Úteis

- [Documentação da API](http://localhost:3001/api/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp) 