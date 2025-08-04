#!/bin/bash

# ========================================
# DEPLOY CORREÇÃO CONTEXTO - RAILWAY
# ========================================

echo "🚀 Iniciando deploy da correção de contexto no Railway..."

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Verificar se está logado no Railway
echo "🔐 Verificando login no Railway..."
railway whoami

if [ $? -ne 0 ]; then
    echo "❌ Não está logado no Railway. Faça login primeiro:"
    echo "   railway login"
    exit 1
fi

# Fazer backup dos arquivos atuais
echo "💾 Fazendo backup dos arquivos..."
cp services/llmOrchestratorService.js services/llmOrchestratorService.js.backup
cp routes/webhook-contextualized.js routes/webhook-contextualized.js.backup

echo "✅ Backup criado"

# Verificar se os arquivos corrigidos existem
echo "🔍 Verificando arquivos corrigidos..."
if [ ! -f "services/llmOrchestratorService.js" ]; then
    echo "❌ Arquivo services/llmOrchestratorService.js não encontrado"
    exit 1
fi

if [ ! -f "routes/webhook-contextualized.js" ]; then
    echo "❌ Arquivo routes/webhook-contextualized.js não encontrado"
    exit 1
fi

echo "✅ Arquivos corrigidos encontrados"

# Fazer deploy no Railway
echo "🚀 Fazendo deploy no Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    
    # Verificar status
    echo "📊 Verificando status do deploy..."
    railway status
    
    echo ""
    echo "🧪 Para testar:"
    echo "1. Envie uma mensagem para o WhatsApp com: 'Olá, meu nome é [seu nome]'"
    echo "2. Verifique se o chatbot responde usando seu nome"
    echo "3. Envie outra mensagem e veja se ele lembra do seu nome"
    echo ""
    echo "📋 Comandos úteis:"
    echo "  - Ver logs: railway logs"
    echo "  - Ver status: railway status"
    echo "  - Abrir no navegador: railway open"
    
else
    echo "❌ Erro no deploy"
    echo "📝 Verificando logs..."
    railway logs
    exit 1
fi 