#!/bin/bash

# ========================================
# SCRIPT PARA EXECUTAR SQL VIA PSQL
# ========================================

echo "🚀 Executando script SQL via psql..."

# Configurações do Supabase
SUPABASE_URL="https://niakqdolcdwxtrkbqmdi.supabase.co"
SUPABASE_DB_URL="postgresql://postgres.niakqdolcdwxtrkbqmdi:atendeai-super-secret-jwt-key-32-characters-minimum@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ psql não está instalado. Instalando..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install postgresql
    else
        echo "❌ Instale o PostgreSQL manualmente"
        exit 1
    fi
fi

# Verificar se o arquivo SQL existe
SQL_FILE="scripts/install-all-sprints-final.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo $SQL_FILE não encontrado"
    exit 1
fi

echo "📋 Executando script: $SQL_FILE"
echo "🔗 Conectando ao Supabase..."

# Executar o script SQL
psql "$SUPABASE_DB_URL" -f "$SQL_FILE" -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    echo "✅ Script executado com sucesso!"
    echo "📊 Verificando instalação..."
    
    # Testar as funções criadas
    echo "🔍 Testando funções..."
    psql "$SUPABASE_DB_URL" -c "SELECT * FROM get_cache_stats();" 2>/dev/null && echo "✅ get_cache_stats() funcionando"
    psql "$SUPABASE_DB_URL" -c "SELECT * FROM get_streaming_stats();" 2>/dev/null && echo "✅ get_streaming_stats() funcionando"
    psql "$SUPABASE_DB_URL" -c "SELECT * FROM get_analytics_stats();" 2>/dev/null && echo "✅ get_analytics_stats() funcionando"
    
    echo "🎉 Instalação completa realizada com sucesso!"
else
    echo "❌ Erro ao executar script"
    exit 1
fi 