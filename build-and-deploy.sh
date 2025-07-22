#!/bin/bash

echo "🚀 Build e Deploy - Correção SSL"
echo "================================"

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto detectado"

# 2. Limpar cache
echo ""
echo "🧹 Limpando cache..."
rm -rf node_modules/.vite 2>/dev/null
rm -rf dist 2>/dev/null
rm -rf .vite 2>/dev/null
echo "✅ Cache limpo"

# 3. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# 4. Fazer build
echo ""
echo "🔨 Fazendo build do projeto..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build concluído"
else
    echo "❌ Erro no build"
    exit 1
fi

# 5. Verificar se o dist foi criado
if [ -d "dist" ]; then
    echo "✅ Pasta dist criada com sucesso"
    echo "   Arquivos criados:"
    ls -la dist/
else
    echo "❌ Erro: Pasta dist não foi criada"
    exit 1
fi

# 6. Testar conectividade
echo ""
echo "🌐 Testando conectividade..."
if curl -s http://31.97.241.19:3001/health > /dev/null; then
    echo "✅ Servidor HTTP acessível"
else
    echo "❌ Servidor HTTP não acessível"
fi

echo ""
echo "🎉 BUILD CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
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