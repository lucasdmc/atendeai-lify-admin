#!/bin/bash

# Script para executar SQL via CLI no Supabase
# Credenciais do Supabase

DB_HOST="db.niakqdolcdwxtrkbqmdi.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

echo "🔧 Executando SQL via CLI no Supabase..."
echo ""

# SQL para adicionar campo clinic_id
SQL_COMMANDS="
-- Adicionar campo clinic_id à tabela whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id 
ON public.whatsapp_conversations(clinic_id);

-- Verificar se o campo foi adicionado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
  AND column_name = 'clinic_id';

-- Verificar conversas existentes
SELECT 
  id,
  phone_number,
  name,
  clinic_id,
  created_at
FROM public.whatsapp_conversations 
ORDER BY created_at DESC 
LIMIT 5;
"

echo "📋 Executando comandos SQL..."
echo ""

# Executar SQL via psql
echo "$SQL_COMMANDS" | psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo ""
echo "✅ SQL executado com sucesso!"
echo ""
echo "💡 Próximo passo: Execute o script para associar conversas às clínicas"
echo "   node scripts/associate-conversations-to-clinics.js" 