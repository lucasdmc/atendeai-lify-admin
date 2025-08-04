
#!/bin/bash
# ========================================
# SCRIPT DE DEPLOY DO SISTEMA CORRIGIDO
# ========================================

echo "🚀 DEPLOY DO SISTEMA CORRIGIDO"
echo "================================"

# 1. Verificar dependências
echo "\n📋 1. Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

echo "✅ Dependências verificadas"

# 2. Instalar dependências
echo "\n📋 2. Instalando dependências..."
npm install
echo "✅ Dependências instaladas"

# 3. Verificar variáveis de ambiente
echo "\n📋 3. Verificando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "📋 Copiando .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado"
    echo "🔧 Configure as variáveis de ambiente no arquivo .env"
fi

# 4. Executar testes
echo "\n📋 4. Executando testes..."
node test-integrated-system.js
if [ $? -eq 0 ]; then
    echo "✅ Testes passaram"
else
    echo "❌ Testes falharam"
    exit 1
fi

# 5. Verificar saúde do sistema
echo "\n📋 5. Verificando saúde do sistema..."
node scripts/health-check.js
if [ $? -eq 0 ]; then
    echo "✅ Sistema saudável"
else
    echo "❌ Sistema com problemas"
    exit 1
fi

# 6. Iniciar servidor
echo "\n📋 6. Iniciando servidor..."
echo "🚀 Sistema iniciado com sucesso!"
echo "📱 Webhook disponível em: http://localhost:3001/whatsapp-meta"
echo "🔗 Health check: http://localhost:3001/health"

# Iniciar servidor em background
npm start &
SERVER_PID=$!

echo "\n🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "✅ Sistema funcionando em produção"
echo "📊 PID do servidor: $SERVER_PID"
echo "\nPara parar o servidor: kill $SERVER_PID"
