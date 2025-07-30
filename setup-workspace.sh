#!/bin/bash

echo "🚀 Configurando Workspace AtendeAI Lify..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js >= 18.0.0"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18 ou superior é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Configurar Backend
echo "📦 Configurando Backend..."
cd atendeai-lify-backend

if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado no backend"
    exit 1
fi

echo "Instalando dependências do backend..."
npm install

if [ ! -f ".env" ]; then
    echo "Criando arquivo .env do backend..."
    cp env.example .env
    echo "⚠️  Configure as variáveis de ambiente no arquivo atendeai-lify-backend/.env"
fi

cd ..

# Configurar Frontend
echo "📦 Configurando Frontend..."
cd atendeai-lify-admin

if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado no frontend"
    exit 1
fi

echo "Instalando dependências do frontend..."
npm install

if [ ! -f ".env" ]; then
    echo "Criando arquivo .env do frontend..."
    cp env.example .env
    echo "⚠️  Configure as variáveis de ambiente no arquivo atendeai-lify-admin/.env"
fi

cd ..

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p atendeai-lify-backend/logs
mkdir -p atendeai-lify-backend/uploads

echo ""
echo "✅ Workspace configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente nos arquivos .env"
echo "2. Inicie o backend: cd atendeai-lify-backend && npm run dev"
echo "3. Inicie o frontend: cd atendeai-lify-admin && npm run dev"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:3001"
echo "- API Health: http://localhost:3001/health"
echo ""
echo "📚 Documentação:"
echo "- README principal: ./README.md"
echo "- README Backend: ./atendeai-lify-backend/README.md"
echo "- README Frontend: ./atendeai-lify-admin/README.md" 