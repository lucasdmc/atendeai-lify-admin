#!/bin/bash

echo "🔨 BUILD SIMPLES - ATENDEAI MVP 1.0"
echo "====================================="

# 1. Limpar cache
echo "🧹 Limpando cache..."
rm -rf dist 2>/dev/null
rm -rf .vite 2>/dev/null
echo "✅ Cache limpo"

# 2. Verificar vite.config.ts
echo ""
echo "🔧 Verificando vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts encontrado"
else
    echo "❌ vite.config.ts não encontrado"
    exit 1
fi

# 3. Tentar build direto
echo ""
echo "🔨 Fazendo build..."
npx vite build
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
else
    echo "❌ Build falhou"
    exit 1
fi

# 4. Verificar dist
if [ -d "dist" ]; then
    echo "✅ Pasta dist criada"
    echo "   Arquivos:"
    ls -la dist/
else
    echo "❌ Pasta dist não criada"
    exit 1
fi

echo ""
echo "🎉 BUILD CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Acesse: https://lify.com.br"
echo "   2. Faça login na sua conta"
echo "   3. Selecione o projeto: atendeai-lify-admin"
echo "   4. Vá para: Arquivos"
echo "   5. Faça upload da pasta dist/"
echo "   6. Configure as variáveis de ambiente:"
echo "      VITE_WHATSAPP_SERVER_URL=https://atendeai-backend-production.up.railway.app"
echo "      VITE_BACKEND_URL=https://atendeai-backend-production.up.railway.app"
echo "   7. Clique em: Deploy"
echo ""
echo "🌐 Para acessar: https://atendeai.lify.com.br" 