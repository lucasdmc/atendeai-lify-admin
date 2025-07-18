#!/bin/bash

# Script para corrigir configurações do frontend
# Corrige URLs incorretas nos arquivos de configuração

echo "🔧 CORRIGINDO CONFIGURAÇÕES DO FRONTEND"
echo "========================================"

# 1. Corrigir lovable.json
echo "📝 Corrigindo lovable.json..."
if [ -f "lovable.json" ]; then
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://lify-chatbot-production.up.railway.app"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lovable.json
    echo "✅ lovable.json corrigido"
else
    echo "⚠️ lovable.json não encontrado"
fi

# 2. Corrigir lify.json
echo "📝 Corrigindo lify.json..."
if [ -f "lify.json" ]; then
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://lify-chatbot-production.up.railway.app"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lify.json
    echo "✅ lify.json corrigido"
else
    echo "⚠️ lify.json não encontrado"
fi

# 3. Criar arquivo .env se não existir
echo "📝 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "Criando arquivo .env..."
    cat > .env << 'EOF'
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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

# Supabase Configuration
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Configuration - VPS Real
VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001

# Backend Configuration - VPS Real
VITE_BACKEND_URL=https://31.97.241.19:3001

# Google APIs
VITE_GOOGLE_PLACES_API_KEY=AIzaSyBxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx

# Environment
NODE_ENV=production
EOF
    echo "✅ Arquivo .env criado"
else
    echo "⚠️ Arquivo .env já existe"
fi

# 4. Verificar se o servidor está funcionando
echo ""
echo "🖥️ Verificando servidor..."
if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Servidor WhatsApp funcionando"
else
    echo "❌ Servidor WhatsApp não está respondendo"
    echo "💡 Execute: node server-baileys-production.js"
fi

# 5. Testar conectividade externa
echo ""
echo "🌐 Testando conectividade externa..."
if curl -k -s https://31.97.241.19:3001/health > /dev/null 2>&1; then
    echo "✅ VPS acessível externamente"
else
    echo "❌ VPS não acessível externamente"
fi

echo ""
echo "🎉 Configurações corrigidas!"
echo ""
echo "📋 URLs configuradas:"
echo "   - WhatsApp Server: https://31.97.241.19:3001"
echo "   - Backend: https://31.97.241.19:3001"
echo ""
echo "🚀 Para testar:"
echo "   1. npm run dev"
echo "   2. Acesse: http://localhost:8080"
echo "   3. Teste a geração de QR Code" 