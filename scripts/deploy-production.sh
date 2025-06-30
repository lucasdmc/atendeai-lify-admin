#!/bin/bash

# Script de Deploy para Produção - atendeai.lify.com.br
# Este script prepara o build para deploy no domínio principal

set -e

echo "🚀 Preparando deploy para atendeai.lify.com.br..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar TypeScript
echo "🔍 Verificando TypeScript..."
npm run type-check

# Build de produção
echo "🏗️ Fazendo build de produção..."
npm run build:prod

# Verificar build
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Mostrar estrutura do build
echo "📁 Estrutura do build:"
ls -la dist/
echo ""
echo "📊 Tamanho dos arquivos:"
du -sh dist/*

echo ""
echo "🎯 PRÓXIMOS PASSOS PARA DEPLOY NO atendeai.lify.com.br:"
echo ""
echo "1. 📤 Upload dos arquivos:"
echo "   - Faça upload da pasta 'dist/' para o servidor do atendeai.lify.com.br"
echo ""
echo "2. 🌐 Configuração do servidor:"
echo "   - Configure o servidor para servir SPA (todas as rotas → index.html)"
echo "   - Configure HTTPS"
echo "   - Configure cache para assets estáticos"
echo ""
echo "3. 🔧 Configurações necessárias:"
echo "   - Google Cloud Console: adicione https://atendeai.lify.com.br/agendamentos"
echo "   - Verifique variáveis de ambiente no servidor"
echo ""
echo "4. 🧪 Testes:"
echo "   - Teste login e autenticação"
echo "   - Teste módulo de agendamentos"
echo "   - Teste criação de eventos"
echo "   - Teste botão 'Atualizar eventos'"
echo ""
echo "🔗 URLs importantes:"
echo "- Produção: https://atendeai.lify.com.br"
echo "- Preview: https://preview--atendeai-lify-admin.lovable.app"
echo "- Google Cloud: https://console.cloud.google.com"
echo "- Supabase: https://app.supabase.com"
echo ""
echo "📞 Se precisar de ajuda:"
echo "- Verifique logs do servidor"
echo "- Verifique console do navegador"
echo "- Consulte LIFY_DEPLOY.md para troubleshooting" 