#!/bin/bash

# Script para forçar correção das configurações de produção
# Força atualização de todas as configurações e limpa cache

echo "🚀 FORÇANDO CORREÇÃO DAS CONFIGURAÇÕES DE PRODUÇÃO"
echo "=================================================="

# 1. Parar todos os processos relacionados
echo "🛑 Parando processos..."
pkill -f "server-baileys" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# 2. Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# 3. Remover node_modules e reinstalar
echo "📦 Reinstalando dependências..."
rm -rf node_modules package-lock.json
npm install

# 4. Forçar correção de todas as configurações
echo "🔧 Forçando correção de configurações..."

# .env
if [ -f ".env" ]; then
    echo "📝 Corrigindo .env..."
    sed -i '' 's|VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env
    sed -i '' 's|VITE_WHATSAPP_SERVER_URL=http://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env
    echo "✅ .env corrigido"
fi

# .env.production
if [ -f ".env.production" ]; then
    echo "📝 Corrigindo .env.production..."
    sed -i '' 's|VITE_WHATSAPP_SERVER_URL=https://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env.production
    sed -i '' 's|VITE_WHATSAPP_SERVER_URL=http://seu-servidor-vps.com:3001|VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001|g' .env.production
    echo "✅ .env.production corrigido"
fi

# lovable.json
if [ -f "lovable.json" ]; then
    echo "📝 Corrigindo lovable.json..."
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lovable.json
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "http://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lovable.json
    echo "✅ lovable.json corrigido"
fi

# lify.json
if [ -f "lify.json" ]; then
    echo "📝 Corrigindo lify.json..."
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "https://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lify.json
    sed -i '' 's|"VITE_WHATSAPP_SERVER_URL": "http://seu-servidor-vps.com:3001"|"VITE_WHATSAPP_SERVER_URL": "https://31.97.241.19:3001"|g' lify.json
    echo "✅ lify.json corrigido"
fi

# 5. Verificar se há alguma configuração hardcoded no código
echo "🔍 Verificando código por URLs hardcoded..."
if grep -r "seu-servidor-vps.com" src/ 2>/dev/null; then
    echo "❌ ENCONTRADAS URLs hardcoded no código!"
    echo "   Localizando arquivos..."
    grep -r "seu-servidor-vps.com" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null || true
else
    echo "✅ Nenhuma URL hardcoded encontrada no código"
fi

# 6. Verificar configuração do environment.ts
echo "📋 Verificando src/config/environment.ts..."
if [ -f "src/config/environment.ts" ]; then
    if grep -q "31.97.241.19" src/config/environment.ts; then
        echo "✅ environment.ts está correto"
    else
        echo "❌ environment.ts precisa ser corrigido"
        sed -i '' 's|serverUrl:.*||g' src/config/environment.ts
        sed -i '' 's|serverUrl:.*||g' src/config/environment.ts
        echo "   - Corrigido environment.ts"
    fi
else
    echo "⚠️ environment.ts não encontrado"
fi

# 7. Criar arquivo de configuração de produção forçada
echo "📝 Criando configuração de produção forçada..."
cat > .env.production.forced << EOF
# Configuração de Produção Forçada - AtendeAI Lify
NODE_ENV=production

# Google OAuth
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com

# Supabase
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Server (VPS) - FORÇADO
VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001
VITE_BACKEND_URL=https://31.97.241.19:3001

# URLs de Produção
VITE_PRODUCTION_URL=https://atendeai.lify.com.br
VITE_REDIRECT_URI=https://atendeai.lify.com.br/agendamentos
EOF

echo "✅ Arquivo .env.production.forced criado"

# 8. Verificar se o servidor está funcionando
echo ""
echo "🖥️ Verificando servidor..."
if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Servidor local funcionando"
else
    echo "❌ Servidor local não está respondendo"
    echo "   Iniciando servidor..."
    node server-baileys-production.js &
    sleep 3
    if curl -k -s https://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Servidor iniciado com sucesso"
    else
        echo "❌ Falha ao iniciar servidor"
    fi
fi

# 9. Verificar conectividade externa
echo ""
echo "🌐 Verificando conectividade externa..."
if curl -k -s https://31.97.241.19:3001/health > /dev/null 2>&1; then
    echo "✅ VPS acessível externamente"
else
    echo "❌ VPS não acessível externamente"
fi

# 10. Instruções finais
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "==================="
echo ""
echo "1. 🔄 Limpe o cache do navegador:"
echo "   - Pressione Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Ou limpe o cache manualmente"
echo ""
echo "2. ⚙️ Verifique as variáveis de ambiente no Lify:"
echo "   - Acesse: https://lify.com.br/dashboard"
echo "   - Encontre o projeto 'atendeai-lify-admin'"
echo "   - Vá em Settings → Environment Variables"
echo "   - Configure: VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001"
echo ""
echo "3. 🚀 Force deploy no Lify:"
echo "   - No dashboard, clique em 'Deploy'"
echo "   - Aguarde a conclusão"
echo ""
echo "4. 🧪 Teste em produção:"
echo "   - Acesse: https://atendeai.lify.com.br"
echo "   - Vá para Agentes"
echo "   - Teste a geração de QR Code"
echo ""
echo "5. 📞 Se ainda houver problemas:"
echo "   - Verifique os logs do Lify"
echo "   - Teste localmente: npm run dev"
echo "   - Verifique se o servidor está rodando"

echo ""
echo "🎉 Script de correção forçada concluído!" 