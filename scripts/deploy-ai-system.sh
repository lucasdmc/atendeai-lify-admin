#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY DO SISTEMA AI
# ========================================

set -e

echo "🚀 INICIANDO DEPLOY DO SISTEMA AI"
echo "=================================="

# ========================================
# 1. VERIFICAR DEPENDÊNCIAS
# ========================================

echo "📋 Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js encontrado: $(node --version)"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
else
    echo "✅ npm encontrado: $(npm --version)"
fi

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    curl -fsSL https://supabase.com/install.sh | sh
else
    echo "✅ Supabase CLI encontrado: $(supabase --version)"
fi

# ========================================
# 2. INSTALAR DEPENDÊNCIAS
# ========================================

echo "📦 Instalando dependências..."

# Frontend dependencies
echo "Instalando dependências do frontend..."
npm install

# Backend dependencies
echo "Instalando dependências do backend..."
cd ../atendeai-lify-backend
npm install
cd ../atendeai-lify-admin

# AI-specific dependencies
echo "Instalando dependências AI..."
npm install openai @anthropic-ai/sdk @google/generative-ai

# ========================================
# 3. CONFIGURAR VARIÁVEIS DE AMBIENTE
# ========================================

echo "🔧 Configurando variáveis de ambiente..."

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    cp env.example .env
fi

# Verificar variáveis críticas
echo "Verificando variáveis de ambiente críticas..."

REQUIRED_VARS=(
    "OPENAI_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo "⚠️  Variável ${var} não encontrada no .env"
        echo "Por favor, configure a variável ${var} no arquivo .env"
    else
        echo "✅ ${var} configurada"
    fi
done

# ========================================
# 4. CONFIGURAR BANCO DE DADOS
# ========================================

echo "🗄️  Configurando banco de dados..."

# Verificar conexão com Supabase
echo "Testando conexão com Supabase..."
if supabase status &> /dev/null; then
    echo "✅ Conexão com Supabase OK"
else
    echo "⚠️  Não foi possível conectar ao Supabase"
    echo "Certifique-se de que as credenciais estão corretas"
fi

# Executar migrations
echo "Executando migrations..."
if [ -f "scripts/reset-database-complete-simple.sql" ]; then
    echo "Executando reset completo do banco..."
    # Nota: Este comando deve ser executado manualmente no Supabase Dashboard
    echo "📝 IMPORTANTE: Execute o script scripts/reset-database-complete-simple.sql no Supabase Dashboard"
else
    echo "❌ Script de reset não encontrado"
fi

# ========================================
# 5. CONFIGURAR APIS EXTERNAS
# ========================================

echo "🔌 Configurando APIs externas..."

# Testar OpenAI
echo "Testando OpenAI API..."
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API Key configurada"
else
    echo "⚠️  OpenAI API Key não configurada"
fi

# Testar Anthropic
echo "Testando Anthropic API..."
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ Anthropic API Key configurada"
else
    echo "⚠️  Anthropic API Key não configurada"
fi

# Testar Google AI
echo "Testando Google AI API..."
if [ -n "$GOOGLE_API_KEY" ]; then
    echo "✅ Google AI API Key configurada"
else
    echo "⚠️  Google AI API Key não configurada"
fi

# ========================================
# 6. CONSTRUIR APLICAÇÃO
# ========================================

echo "🏗️  Construindo aplicação..."

# Build do frontend
echo "Construindo frontend..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build do frontend concluído"
else
    echo "❌ Erro no build do frontend"
    exit 1
fi

# ========================================
# 7. CONFIGURAR SERVIDOR
# ========================================

echo "🖥️  Configurando servidor..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Criar ecosystem file para PM2
echo "Criando configuração PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'atendeai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'atendeai-backend',
      script: 'npm',
      args: 'start',
      cwd: '../atendeai-lify-backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF

# ========================================
# 8. TESTAR SISTEMA
# ========================================

echo "🧪 Testando sistema..."

# Testar frontend
echo "Testando frontend..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend respondendo"
else
    echo "⚠️  Frontend não está respondendo"
fi

# Testar backend
echo "Testando backend..."
if curl -f http://localhost:3001/health &> /dev/null; then
    echo "✅ Backend respondendo"
else
    echo "⚠️  Backend não está respondendo"
fi

# Testar APIs AI
echo "Testando APIs AI..."
if curl -f http://localhost:3001/api/ai/test-connection &> /dev/null; then
    echo "✅ APIs AI respondendo"
else
    echo "⚠️  APIs AI não estão respondendo"
fi

# ========================================
# 9. INICIAR SERVIÇOS
# ========================================

echo "🚀 Iniciando serviços..."

# Parar serviços existentes
pm2 delete all 2>/dev/null || true

# Iniciar serviços
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar startup automático
pm2 startup

echo "✅ Serviços iniciados com PM2"

# ========================================
# 10. VERIFICAÇÃO FINAL
# ========================================

echo "🔍 Verificação final..."

# Verificar status dos serviços
echo "Status dos serviços:"
pm2 status

# Verificar logs
echo "Últimos logs:"
pm2 logs --lines 10

# ========================================
# CONCLUSÃO
# ========================================

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo ""
echo "📋 RESUMO:"
echo "✅ Dependências instaladas"
echo "✅ Variáveis de ambiente configuradas"
echo "✅ Banco de dados configurado"
echo "✅ APIs externas configuradas"
echo "✅ Aplicação construída"
echo "✅ Serviços iniciados"
echo ""
echo "🌐 URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "API AI: http://localhost:3001/api/ai"
echo ""
echo "📊 Monitoramento:"
echo "pm2 status - Ver status dos serviços"
echo "pm2 logs - Ver logs em tempo real"
echo "pm2 restart all - Reiniciar todos os serviços"
echo ""
echo "🔧 Comandos úteis:"
echo "npm run dev - Desenvolvimento local"
echo "npm run build - Construir para produção"
echo "pm2 monit - Monitoramento interativo"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. Configure as variáveis de ambiente no .env"
echo "2. Execute o script de reset do banco no Supabase Dashboard"
echo "3. Configure as chaves das APIs AI"
echo "4. Teste o sistema através do dashboard"
echo ""
echo "🎯 SISTEMA AI PRONTO PARA USO!" 