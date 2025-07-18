#!/bin/bash

# Script para fazer deploy do servidor Baileys na VPS
VPS_IP="31.97.241.19"
VPS_USER="root"
PROJECT_DIR="/root/atendeai-lify-admin"
LOCAL_DIR="$(pwd)"

echo "🚀 DEPLOY DO SERVIDOR BAILEYS PARA VPS"
echo "======================================"

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto detectado"

# 2. Criar diretório na VPS
echo "📁 Criando diretório na VPS..."
ssh $VPS_USER@$VPS_IP "mkdir -p $PROJECT_DIR"

# 3. Copiar arquivos essenciais
echo "📤 Copiando arquivos para VPS..."

# Copiar arquivos do servidor
scp server-baileys-production.js $VPS_USER@$VPS_IP:$PROJECT_DIR/
scp package.json $VPS_USER@$VPS_IP:$PROJECT_DIR/
scp .env $VPS_USER@$VPS_IP:$PROJECT_DIR/

# Copiar diretório SSL se existir
if [ -d "ssl" ]; then
    echo "🔐 Copiando certificados SSL..."
    scp -r ssl $VPS_USER@$VPS_IP:$PROJECT_DIR/
fi

# 4. Instalar dependências na VPS
echo "📦 Instalando dependências na VPS..."
ssh $VPS_USER@$VPS_IP "cd $PROJECT_DIR && npm install"

# 5. Verificar se o arquivo foi copiado
echo "🔍 Verificando arquivos na VPS..."
ssh $VPS_USER@$VPS_IP "ls -la $PROJECT_DIR/"

# 6. Parar processos existentes
echo "🛑 Parando processos existentes..."
ssh $VPS_USER@$VPS_IP "pkill -f server-baileys || true"

# 7. Iniciar servidor em background
echo "🚀 Iniciando servidor Baileys..."
ssh $VPS_USER@$VPS_IP "cd $PROJECT_DIR && nohup node server-baileys-production.js > server.log 2>&1 &"

# 8. Aguardar um pouco e verificar status
echo "⏳ Aguardando inicialização..."
sleep 5

# 9. Verificar se o servidor está rodando
echo "🔍 Verificando status do servidor..."
ssh $VPS_USER@$VPS_IP "ps aux | grep server-baileys"

# 10. Testar conectividade
echo "🌐 Testando conectividade..."
curl -k https://$VPS_IP:3001/health

echo ""
echo "✅ DEPLOY CONCLUÍDO!"
echo "📋 Próximos passos:"
echo "   1. Verificar logs: ssh $VPS_USER@$VPS_IP 'tail -f $PROJECT_DIR/server.log'"
echo "   2. Testar endpoints: curl -k https://$VPS_IP:3001/health"
echo "   3. Verificar processos: ssh $VPS_USER@$VPS_IP 'ps aux | grep server-baileys'" 