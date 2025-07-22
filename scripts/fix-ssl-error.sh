#!/bin/bash

echo "🔧 Corrigindo Erro SSL..."
echo ""

# 1. Verificar configuração atual
echo "1️⃣ Verificando configuração atual..."
if [ -f "src/config/environment.ts" ]; then
    echo "✅ Arquivo de configuração encontrado"
    grep -n "WHATSAPP_SERVER_URL" src/config/environment.ts
else
    echo "❌ Arquivo de configuração não encontrado"
fi

# 2. Corrigir configuração para HTTP
echo ""
echo "2️⃣ Corrigindo URLs para HTTP..."
if [ -f "src/config/environment.ts" ]; then
    # Fazer backup
    cp src/config/environment.ts src/config/environment.ts.backup
    
    # Substituir HTTPS por HTTP
    sed -i '' 's/https:\/\/31.97.241.19:3001/http:\/\/31.97.241.19:3001/g' src/config/environment.ts
    sed -i '' 's/https:\/\/31.97.241.19/http:\/\/31.97.241.19/g' src/config/environment.ts
    
    echo "✅ URLs corrigidas para HTTP"
    echo "   Antes: https://31.97.241.19:3001"
    echo "   Depois: http://31.97.241.19:3001"
else
    echo "❌ Arquivo de configuração não encontrado"
fi

# 3. Verificar arquivos de configuração do Lify
echo ""
echo "3️⃣ Verificando configurações do Lify..."
if [ -f "lify.json" ]; then
    echo "✅ lify.json encontrado"
    grep -n "WHATSAPP_SERVER_URL" lify.json || echo "   Não encontrado em lify.json"
else
    echo "❌ lify.json não encontrado"
fi

if [ -f "lovable.json" ]; then
    echo "✅ lovable.json encontrado"
    grep -n "WHATSAPP_SERVER_URL" lovable.json || echo "   Não encontrado em lovable.json"
else
    echo "❌ lovable.json não encontrado"
fi

# 4. Corrigir arquivos de configuração
echo ""
echo "4️⃣ Corrigindo arquivos de configuração..."

# Corrigir lify.json
if [ -f "lify.json" ]; then
    sed -i '' 's/"https:\/\/31.97.241.19:3001"/"http:\/\/31.97.241.19:3001"/g' lify.json
    sed -i '' 's/"https:\/\/31.97.241.19"/"http:\/\/31.97.241.19"/g' lify.json
    echo "✅ lify.json corrigido"
fi

# Corrigir lovable.json
if [ -f "lovable.json" ]; then
    sed -i '' 's/"https:\/\/31.97.241.19:3001"/"http:\/\/31.97.241.19:3001"/g' lovable.json
    sed -i '' 's/"https:\/\/31.97.241.19"/"http:\/\/31.97.241.19"/g' lovable.json
    echo "✅ lovable.json corrigido"
fi

# 5. Limpar cache e rebuild
echo ""
echo "5️⃣ Limpando cache e rebuildando..."
rm -rf node_modules/.vite
rm -rf dist
npm run build

# 6. Testar conectividade
echo ""
echo "6️⃣ Testando conectividade..."
curl -s http://31.97.241.19:3001/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Servidor HTTP acessível"
else
    echo "❌ Servidor HTTP não acessível"
fi

echo ""
echo "🎯 SOLUÇÃO APLICADA!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Acesse: https://lify.com.br"
echo "   2. Faça login na sua conta"
echo "   3. Selecione o projeto: atendeai-lify-admin"
echo "   4. Vá para Configurações → Variáveis de Ambiente"
echo "   5. DELETE as seguintes variáveis se existirem:"
echo "      - VITE_WHATSAPP_SERVER_URL (se estiver como HTTPS)"
echo "      - VITE_BACKEND_URL (se estiver como HTTPS)"
echo "   6. ADICIONE as seguintes variáveis:"
echo "      VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001"
echo "      VITE_BACKEND_URL=http://31.97.241.19:3001"
echo "   7. Salve as configurações"
echo "   8. Force um novo deploy"
echo ""
echo "🔧 Para testar localmente:"
echo "   npm run dev"
echo ""
echo "🌐 Para acessar o frontend:"
echo "   https://atendeai.lify.com.br" 