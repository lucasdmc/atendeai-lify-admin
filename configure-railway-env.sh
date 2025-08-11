#!/bin/bash

echo "🚂 Configurando variáveis de ambiente no Railway..."

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Não logado no Railway. Execute:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI configurado"

# Listar projetos disponíveis
echo ""
echo "📋 Projetos disponíveis:"
railway projects

echo ""
echo "🔧 Configure as variáveis de ambiente para produção:"
echo ""

# Ler configurações do usuário
read -p "Nome do projeto Railway (ex: atendeai-lify-admin): " PROJECT_NAME
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET

if [ -z "$PROJECT_NAME" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Informações não podem estar vazias"
    exit 1
fi

echo ""
echo "🔐 Configurando variáveis no Railway..."

# Configurar variáveis de ambiente
railway variables set \
  NODE_ENV=production \
  PORT=3001 \
  LOG_LEVEL=info \
  SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co \
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw \
  VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com \
  VITE_GOOGLE_REDIRECT_URI=https://atendeai-lify-admin-production.up.railway.app/agendamentos \
  VITE_BACKEND_URL=https://atendeai-lify-backend-production.up.railway.app \
  VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co \
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw \
  --project $PROJECT_NAME

echo ""
echo "✅ Variáveis configuradas no Railway!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as URLs de redirecionamento no Google Cloud Console:"
echo "   - http://localhost:8080/agendamentos (desenvolvimento)"
echo "   - https://atendeai-lify-admin-production.up.railway.app/agendamentos (produção)"
echo "2. Faça deploy da aplicação: railway up"
echo "3. Teste a integração em produção"
echo ""
echo "🔗 Para testar localmente: http://localhost:8080/agendamentos"
echo "🔗 Para testar em produção: https://atendeai-lify-admin-production.up.railway.app/agendamentos"
