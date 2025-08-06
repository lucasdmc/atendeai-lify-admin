#!/bin/bash

echo "🔧 Configurando credenciais Google para Edge Function..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Verificar se está logado no Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Não logado no Supabase. Execute:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI configurado"

# Solicitar credenciais do usuário
echo ""
echo "📝 Configure as credenciais do Google OAuth:"
echo ""

read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -s -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
echo ""

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Credenciais não podem estar vazias"
    exit 1
fi

echo ""
echo "🔐 Configurando secrets na Edge Function..."

# Configurar secrets
supabase secrets set GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
supabase secrets set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"

echo "✅ Secrets configurados"

# Fazer deploy da Edge Function
echo ""
echo "📦 Fazendo deploy da Edge Function..."

supabase functions deploy google-user-auth

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 URLs que devem estar configuradas no Google Cloud Console:"
echo "   - http://localhost:8080/agendamentos"
echo "   - https://atendeai.lify.com.br/agendamentos"
echo ""
echo "🔗 Para testar, acesse: http://localhost:8080/agendamentos" 