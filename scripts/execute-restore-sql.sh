#!/bin/bash

# Script para executar o SQL de restauração via CLI
# Execute: ./scripts/execute-restore-sql.sh

echo "🚀 Executando SQL de restauração via CLI..."

# Substitua estas variáveis pelas suas credenciais do Supabase
DB_HOST="aws-0-sa-east-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.niakqdolcdwxtrkbqmdi"
DB_PASSWORD="L1f@I20tweny5"

# SQL para executar
SQL_FILE="scripts/use-existing-user.sql"

echo "📊 Executando SQL do arquivo: $SQL_FILE"

# Verificar se o arquivo existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo $SQL_FILE não encontrado!"
    exit 1
fi

echo "📝 Conteúdo do SQL que será executado:"
echo "----------------------------------------"
cat "$SQL_FILE"
echo "----------------------------------------"

echo ""
echo "🚀 Executando SQL via CLI..."

# Executar o SQL via psql
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$SQL_FILE"

echo ""
echo "📝 Alternativa mais fácil: Execute no Supabase Dashboard"
echo "1. Vá para: https://supabase.com/dashboard"
echo "2. Selecione seu projeto"
echo "3. Vá para: SQL Editor"
echo "4. Cole o conteúdo do arquivo: $SQL_FILE"
echo "5. Clique em 'Run'"

echo ""
echo "🔍 Para obter a senha do banco:"
echo "1. Vá para: https://supabase.com/dashboard"
echo "2. Selecione seu projeto"
echo "3. Vá para: Settings > Database"
echo "4. Copie a senha do 'Database Password'" 