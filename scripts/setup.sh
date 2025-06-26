#!/bin/bash

# AtendeAI Setup Script
echo "🚀 Configurando AtendeAI..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env"
    echo "   - VITE_GOOGLE_CLIENT_ID"
    echo "   - VITE_GOOGLE_CLIENT_SECRET"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_WHATSAPP_SERVER_URL"
else
    echo "✅ Arquivo .env já existe"
fi

# Verificar vulnerabilidades
echo "🔍 Verificando vulnerabilidades..."
npm audit

# Build de teste
echo "🔨 Testando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas credenciais no arquivo .env"
echo "2. Configure o Google Cloud Platform"
echo "3. Configure o Supabase"
echo "4. Execute 'npm run dev' para iniciar o servidor de desenvolvimento"
echo ""
echo "📚 Consulte o README.md para instruções detalhadas" 