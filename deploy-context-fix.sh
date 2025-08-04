#!/bin/bash

# ========================================
# DEPLOY CORREÇÃO CONTEXTO - VPS
# ========================================

echo "🚀 Iniciando deploy da correção de contexto na VPS..."

# Configurações
VPS_HOST="45.79.199.108"
VPS_USER="root"
PROJECT_DIR="/root/atendeai-lify-admin"

echo "📋 Configurações:"
echo "  - VPS: $VPS_HOST"
echo "  - Usuário: $VPS_USER"
echo "  - Diretório: $PROJECT_DIR"

# 1. Fazer backup do código atual
echo "💾 Fazendo backup do código atual..."
ssh $VPS_USER@$VPS_HOST "cd $PROJECT_DIR && cp -r . ../atendeai-backup-$(date +%Y%m%d-%H%M%S)"

# 2. Atualizar o código
echo "📤 Enviando correções para a VPS..."
scp -r services/llmOrchestratorService.js $VPS_USER@$VPS_HOST:$PROJECT_DIR/services/
scp -r routes/webhook-contextualized.js $VPS_USER@$VPS_HOST:$PROJECT_DIR/routes/

# 3. Verificar se os arquivos foram enviados
echo "🔍 Verificando arquivos enviados..."
ssh $VPS_USER@$VPS_HOST "ls -la $PROJECT_DIR/services/llmOrchestratorService.js"
ssh $VPS_USER@$VPS_HOST "ls -la $PROJECT_DIR/routes/webhook-contextualized.js"

# 4. Reiniciar o serviço
echo "🔄 Reiniciando o serviço..."
ssh $VPS_USER@$VPS_HOST "cd $PROJECT_DIR && pm2 restart all"

# 5. Verificar status
echo "📊 Verificando status do serviço..."
ssh $VPS_USER@$VPS_HOST "pm2 status"

# 6. Verificar logs
echo "📝 Últimos logs do serviço..."
ssh $VPS_USER@$VPS_HOST "cd $PROJECT_DIR && pm2 logs --lines 10"

echo "✅ Deploy concluído!"
echo ""
echo "🧪 Para testar:"
echo "1. Envie uma mensagem para o WhatsApp com: 'Olá, meu nome é [seu nome]'"
echo "2. Verifique se o chatbot responde usando seu nome"
echo "3. Envie outra mensagem e veja se ele lembra do seu nome"
echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && pm2 logs'"
echo "  - Ver status: ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo "  - Reiniciar: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && pm2 restart all'" 