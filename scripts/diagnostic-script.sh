#!/bin/bash

# Script de Diagnóstico para Sistema WhatsApp
# Execute com: bash diagnostic.sh

echo "=== DIAGNÓSTICO DO SISTEMA WHATSAPP ==="
echo "Data: $(date)"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar conectividade com VPS
echo "1. Testando conectividade com VPS..."
if ping -c 1 31.97.241.19 &> /dev/null; then
    echo -e "${GREEN}✓ VPS está acessível${NC}"
else
    echo -e "${RED}✗ VPS não está acessível${NC}"
fi

# 2. Testar endpoint direto da VPS
echo ""
echo "2. Testando endpoint da VPS diretamente..."
VPS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-diagnostic"}' 2>/dev/null)

HTTP_CODE=$(echo "$VPS_RESPONSE" | tail -n1)
BODY=$(echo "$VPS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ VPS respondeu com sucesso (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ VPS respondeu com erro (HTTP $HTTP_CODE)${NC}"
    echo "Resposta: $BODY"
fi

# 3. Testar Edge Function
echo ""
echo "3. Testando Edge Function..."
EDGE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://pfnqztkdmbocggylgelu.supabase.co/functions/v1/agent-whatsapp-manager/generate-qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -d '{"agentId": "test-diagnostic"}' 2>/dev/null)

EDGE_HTTP_CODE=$(echo "$EDGE_RESPONSE" | tail -n1)
EDGE_BODY=$(echo "$EDGE_RESPONSE" | sed '$d')

if [ "$EDGE_HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Edge Function respondeu com sucesso (HTTP $EDGE_HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Edge Function respondeu com erro (HTTP $EDGE_HTTP_CODE)${NC}"
    echo "Resposta: $EDGE_BODY"
fi

# 4. Verificar processos locais
echo ""
echo "4. Verificando processos locais..."

# Verificar se o servidor Node está rodando
if pgrep -f "node.*server" > /dev/null; then
    echo -e "${GREEN}✓ Servidor Node.js está rodando${NC}"
    NODE_PID=$(pgrep -f "node.*server")
    echo "  PID: $NODE_PID"
else
    echo -e "${YELLOW}! Servidor Node.js não está rodando${NC}"
fi

# Verificar se Chrome/Chromium está rodando
if pgrep -f "chrome|chromium" > /dev/null; then
    echo -e "${GREEN}✓ Chrome/Chromium está rodando${NC}"
    CHROME_COUNT=$(pgrep -f "chrome|chromium" | wc -l)
    echo "  Processos: $CHROME_COUNT"
else
    echo -e "${YELLOW}! Chrome/Chromium não está rodando${NC}"
fi

# 5. Verificar diretórios de sessão
echo ""
echo "5. Verificando diretórios de sessão..."

if [ -d ".wwebjs_auth" ]; then
    echo -e "${GREEN}✓ Diretório .wwebjs_auth existe${NC}"
    SESSION_COUNT=$(find .wwebjs_auth -type d -name "session-*" | wc -l)
    echo "  Sessões encontradas: $SESSION_COUNT"
else
    echo -e "${YELLOW}! Diretório .wwebjs_auth não existe${NC}"
fi

if [ -d ".chrome_data" ]; then
    echo -e "${GREEN}✓ Diretório .chrome_data existe${NC}"
else
    echo -e "${YELLOW}! Diretório .chrome_data não existe${NC}"
fi

# 6. Verificar logs recentes
echo ""
echo "6. Últimas linhas de log do servidor..."
if [ -f "server.log" ]; then
    echo "--- Últimas 10 linhas de server.log ---"
    tail -n 10 server.log
else
    echo -e "${YELLOW}! Arquivo server.log não encontrado${NC}"
fi

# 7. Verificar variáveis de ambiente
echo ""
echo "7. Verificando variáveis de ambiente..."

REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_WHATSAPP_SERVER_URL")
MISSING_VARS=0

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}✗ $VAR não está definida${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        echo -e "${GREEN}✓ $VAR está definida${NC}"
    fi
done

# 8. Resumo
echo ""
echo "=== RESUMO DO DIAGNÓSTICO ==="

if [ "$HTTP_CODE" == "200" ] && [ "$EDGE_HTTP_CODE" != "200" ]; then
    echo -e "${RED}PROBLEMA IDENTIFICADO: Edge Function não consegue comunicar com VPS${NC}"
    echo "Possíveis causas:"
    echo "- Headers incorretos na Edge Function"
    echo "- Timeout na requisição"
    echo "- Problema de rede entre Supabase e VPS"
fi

if [ "$MISSING_VARS" -gt 0 ]; then
    echo -e "${RED}PROBLEMA: Variáveis de ambiente faltando${NC}"
fi

echo ""
echo "Diagnóstico concluído." 