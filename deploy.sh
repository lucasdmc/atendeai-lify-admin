#!/bin/bash

echo "🚀 Iniciando deploy do AtendeAI Lify..."

# Verificar se estamos no branch correto
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Você está no branch $CURRENT_BRANCH. Certifique-se de que é o branch correto para deploy."
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Há mudanças não commitadas. Faça commit ou stash antes do deploy."
    git status --porcelain
    exit 1
fi

# Backup do deploy anterior
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "📦 Criando backup do deploy anterior..."
if [ -d "backup" ]; then
    mv backup "backup_$TIMESTAMP"
fi
mkdir -p backup

# Deploy do Backend
echo "🔧 Deployando Backend..."
cd atendeai-lify-backend

# Instalar dependências
npm ci --only=production

# Criar diretórios necessários
mkdir -p logs uploads

# Configurar variáveis de ambiente para produção
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Configure as variáveis de ambiente."
    cp env.example .env
fi

cd ..

# Deploy do Frontend
echo "🔧 Deployando Frontend..."
cd atendeai-lify-admin

# Instalar dependências
npm ci

# Build para produção
npm run build

# Configurar variáveis de ambiente para produção
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Configure as variáveis de ambiente."
    cp env.example .env
fi

cd ..

# Criar arquivo de versão
echo "📝 Criando arquivo de versão..."
cat > version.json << EOF
{
  "version": "1.0.0",
  "deploy_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)"
}
EOF

# Iniciar serviços com PM2
echo "🚀 Iniciando serviços..."
if command -v pm2 &> /dev/null; then
    pm2 delete all 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Serviços iniciados com PM2"
else
    echo "⚠️  PM2 não encontrado. Iniciando serviços manualmente..."
    echo "Para instalar PM2: npm install -g pm2"
    
    # Iniciar backend
    cd atendeai-lify-backend
    nohup npm start > ../logs/backend.log 2>&1 &
    cd ..
    
    # Iniciar frontend
    cd atendeai-lify-admin
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    cd ..
fi

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
sleep 5

# Testar backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend está rodando em http://localhost:3001"
else
    echo "❌ Backend não está respondendo"
fi

# Testar frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend está rodando em http://localhost:3000"
else
    echo "❌ Frontend não está respondendo"
fi

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📊 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:3001"
echo "- Health Check: http://localhost:3001/health"
echo ""
echo "📝 Logs:"
echo "- Backend: ./logs/backend.log"
echo "- Frontend: ./logs/frontend.log"
echo ""
echo "🔧 Comandos úteis:"
echo "- Parar serviços: pm2 stop all"
echo "- Reiniciar serviços: pm2 restart all"
echo "- Ver logs: pm2 logs"
echo "- Ver status: pm2 status" 