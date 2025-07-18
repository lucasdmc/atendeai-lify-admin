#!/bin/bash

# Script para corrigir configurações de produção
# Corrige URLs incorretas em todos os arquivos de configuração

echo "🔧 CORRIGINDO CONFIGURAÇÕES DE PRODUÇÃO"
echo "========================================="

# 1. Verificar e corrigir .env.production
echo "📝 Verificando .env.production..."
if [ -f ".env.production" ]; then
    # Verificar se tem URL incorreta
    if grep -q "seu-servidor-vps.com" .env.production; then
        echo "❌ URL incorreta encontrada em .env.production"
        sed -i '' 's|VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env.production
        echo "✅ .env.production corrigido"
    else
        echo "✅ .env.production já está correto"
    fi
else
    echo "⚠️ .env.production não encontrado"
fi

# 2. Verificar e corrigir .env
echo "📝 Verificando .env..."
if [ -f ".env" ]; then
    if grep -q "seu-servidor-vps.com" .env; then
        echo "❌ URL incorreta encontrada em .env"
        sed -i '' 's|VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env
        echo "✅ .env corrigido"
    else
        echo "✅ .env já está correto"
    fi
else
    echo "⚠️ .env não encontrado"
fi

# 3. Verificar e corrigir lovable.json
echo "📝 Verificando lovable.json..."
if [ -f "lovable.json" ]; then
    if grep -q "seu-servidor-vps.com" lovable.json; then
        echo "❌ URL incorreta encontrada em lovable.json"
        sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lovable.json
        echo "✅ lovable.json corrigido"
    else
        echo "✅ lovable.json já está correto"
    fi
else
    echo "⚠️ lovable.json não encontrado"
fi

# 4. Verificar e corrigir lify.json
echo "📝 Verificando lify.json..."
if [ -f "lify.json" ]; then
    if grep -q "seu-servidor-vps.com" lify.json; then
        echo "❌ URL incorreta encontrada em lify.json"
        sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lify.json
        echo "✅ lify.json corrigido"
    else
        echo "✅ lify.json já está correto"
    fi
else
    echo "⚠️ lify.json não encontrado"
fi

# 5. Verificar configuração do Supabase
echo "📝 Verificando configuração do Supabase..."
if [ -f "supabase/config.toml" ]; then
    echo "✅ Configuração do Supabase encontrada"
else
    echo "⚠️ Configuração do Supabase não encontrada"
fi

# 6. Verificar se o servidor está funcionando
echo ""
echo "🖥️ Verificando servidor..."
if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Servidor WhatsApp funcionando localmente"
else
    echo "❌ Servidor WhatsApp não está respondendo localmente"
fi

# 7. Verificar conectividade externa
echo ""
echo "🌐 Verificando conectividade externa..."
if curl -k -s https://31.97.241.19:3001/health > /dev/null 2>&1; then
    echo "✅ VPS acessível externamente"
else
    echo "❌ VPS não acessível externamente"
fi

# 8. Verificar configurações do Lify
echo ""
echo "📋 Configurações do Lify:"
echo "   - URL de produção: https://atendeai.lify.com.br"
echo "   - WhatsApp Server: https://31.97.241.19:3001"
echo "   - Backend: https://31.97.241.19:3001"

# 9. Instruções para deploy
echo ""
echo "🚀 Para aplicar as correções em produção:"
echo "   1. Faça commit das alterações:"
echo "      git add ."
echo "      git commit -m 'Fix production URLs'"
echo "      git push origin main"
echo ""
echo "   2. O Lify deve fazer deploy automático"
echo "   3. Ou faça deploy manual no dashboard do Lify"
echo ""
echo "   4. Verifique as variáveis de ambiente no dashboard do Lify:"
echo "      - VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001"
echo "      - VITE_BACKEND_URL=https://31.97.241.19:3001"

echo ""
echo "🎉 Verificação concluída!" 