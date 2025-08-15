# AtendeAI Lify Backend

Backend para o sistema AtendeAI Lify, fornecendo APIs RESTful para o frontend.

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd atendeai-lify-backend
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

4. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controladores
├── middleware/      # Middlewares
├── models/          # Modelos de dados
├── routes/          # Rotas da API
├── services/        # Serviços de negócio
├── utils/           # Utilitários
└── index.js         # Ponto de entrada
```

## 🔧 Configuração

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3001)
- `NODE_ENV`: Ambiente de execução
- `JWT_SECRET`: Chave secreta para JWT
- `DATABASE_URL`: URL de conexão com banco de dados
- `CORS_ORIGIN`: Origem permitida para CORS

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/refresh` - Renovar token

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário específico
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

## 🧪 Testes

```bash
npm test
```

## 📦 Deploy

O backend está configurado para deploy em produção com as seguintes configurações:

- Rate limiting
- Compressão de resposta
- Headers de segurança
- Logging estruturado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 