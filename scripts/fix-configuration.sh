#!/bin/bash

# Script para corrigir configurações do AtendeAI
# Baseado na análise técnica completa

echo "🔧 CORRIGINDO CONFIGURAÇÕES DO ATENDEAI"
echo "========================================"

# 1. Criar arquivo .env correto
echo "📝 Criando arquivo .env correto..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "✅ Arquivo .env criado a partir de .env.production"
else
    echo "⚠️ Arquivo .env já existe"
fi

# 2. Corrigir URLs no arquivo .env
echo "🔗 Corrigindo URLs..."
sed -i '' 's|VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001|g' .env
sed -i '' 's|VITE_BACKEND_URL=http://localhost:3001|VITE_BACKEND_URL=http://31.97.241.19:3001|g' .env

echo "✅ URLs corrigidas:"
echo "   - WhatsApp Server: http://31.97.241.19:3001"
echo "   - Backend: http://31.97.241.19:3001"

# 3. Verificar configuração da VPS
echo ""
echo "🖥️ Verificando configuração da VPS..."
if ping -c 1 31.97.241.19 > /dev/null 2>&1; then
    echo "✅ VPS está online"
    
    # Testar health check
    if curl -s http://31.97.241.19:3001/health > /dev/null 2>&1; then
        echo "✅ Servidor WhatsApp respondendo"
    else
        echo "❌ Servidor WhatsApp não responde"
    fi
else
    echo "❌ VPS não está acessível"
fi

# 4. Verificar configuração do Supabase
echo ""
echo "🗄️ Verificando configuração do Supabase..."
if grep -q "niakqdolcdwxtrkbqmdi.supabase.co" .env; then
    echo "✅ URL do Supabase configurada corretamente"
else
    echo "❌ URL do Supabase não encontrada"
fi

# 5. Verificar dependências
echo ""
echo "📦 Verificando dependências..."
if [ -f package.json ]; then
    echo "✅ package.json encontrado"
    if [ -d node_modules ]; then
        echo "✅ node_modules instalado"
    else
        echo "⚠️ node_modules não encontrado - execute: npm install"
    fi
else
    echo "❌ package.json não encontrado"
fi

# 6. Verificar scripts disponíveis
echo ""
echo "📜 Scripts disponíveis:"
if [ -d scripts ]; then
    ls -la scripts/
else
    echo "❌ Diretório scripts não encontrado"
fi

echo ""
echo "🎯 RESUMO DA CORREÇÃO:"
echo "======================"
echo "✅ Arquivo .env criado/corrigido"
echo "✅ URLs atualizadas para VPS"
echo "✅ Verificação de conectividade realizada"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Execute: npm install (se necessário)"
echo "2. Execute: npm run dev (para desenvolvimento)"
echo "3. Verifique se o frontend carrega corretamente"
echo "4. Teste a conexão WhatsApp"
echo ""
echo "🔍 Para verificar logs da VPS:"
echo "ssh root@31.97.241.19 'pm2 logs'"
echo ""
echo "✅ Correção concluída!" 