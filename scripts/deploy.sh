#!/bin/bash

# Script de Deploy para AtendeAI Lify Admin
# Este script automatiza o processo de build e deploy para produção

set -e  # Para o script se houver erro

echo "🚀 Iniciando deploy do AtendeAI Lify Admin..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não está instalado"
    exit 1
fi

echo "✅ Verificações iniciais concluídas"

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist
rm -rf node_modules/.vite

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se há erros de TypeScript
echo "🔍 Verificando TypeScript..."
npm run type-check

# Fazer build de produção
echo "🏗️ Fazendo build de produção..."
npm run build:prod

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou - diretório dist não foi criado"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Verificar tamanho do build
echo "📊 Tamanho do build:"
du -sh dist/*

# Verificar se os arquivos principais existem
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: index.html não encontrado no build"
    exit 1
fi

echo "🎉 Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload dos arquivos da pasta 'dist' para seu servidor"
echo "2. Configure o servidor web para servir os arquivos estáticos"
echo "3. Configure as URLs de redirecionamento no Google Cloud Console:"
echo "   - https://atendeai.lify.com.br/agendamentos"
echo "4. Teste a aplicação em produção"
echo ""
echo "🔗 URLs importantes:"
echo "- Produção: https://atendeai.lify.com.br"
echo "- Google Cloud Console: https://console.cloud.google.com"
echo "- Supabase Dashboard: https://app.supabase.com" 