#!/bin/bash

# Script para coletar dados para análise no Claude Opus
# Erro 500 WhatsApp Edge Function

echo "📦 Coletando Dados para Claude Opus"
echo "==================================="

# Configurações
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_USER="root"
OUTPUT_DIR="opus-analysis-$(date +%Y%m%d-%H%M%S)"

# Criar diretório de saída
mkdir -p "$OUTPUT_DIR"
echo "📁 Diretório criado: $OUTPUT_DIR"

# 1. Coletar logs do backend
echo ""
echo "📊 1. Coletando logs do backend..."
ssh "$VPS_USER@$VPS_IP" "pm2 logs LifyChatbot-Node-Server --lines 100" > "$OUTPUT_DIR/backend-logs.txt"
echo "✅ Logs do backend salvos"

# 2. Coletar arquivo de requests
echo ""
echo "📝 2. Coletando arquivo de requests..."
ssh "$VPS_USER@$VPS_IP" "cat /tmp/whatsapp-requests.log" > "$OUTPUT_DIR/requests-log.txt"
echo "✅ Arquivo de requests salvo"

# 3. Coletar status do PM2
echo ""
echo "📋 3. Coletando status do PM2..."
ssh "$VPS_USER@$VPS_IP" "pm2 list" > "$OUTPUT_DIR/pm2-status.txt"
echo "✅ Status do PM2 salvo"

# 4. Testar endpoint diretamente
echo ""
echo "🧪 4. Testando endpoint diretamente..."
ssh "$VPS_USER@$VPS_IP" "curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H 'Content-Type: application/json' -d '{\"agentId\":\"test-opus\"}'" > "$OUTPUT_DIR/curl-test.txt"
echo "✅ Teste curl salvo"

# 5. Copiar arquivos locais
echo ""
echo "📁 5. Copiando arquivos locais..."

# Scripts de debug
cp scripts/debug-simple-vps.sh "$OUTPUT_DIR/"
cp scripts/test-frontend-debug.sh "$OUTPUT_DIR/"
cp WHATSAPP_DEBUG_GUIDE.md "$OUTPUT_DIR/"
cp VPS_DEPLOY_SUCCESS.md "$OUTPUT_DIR/"
cp WHATSAPP_SERVER_MIGRATION.md "$OUTPUT_DIR/"

# Edge Functions
if [ -d "supabase/functions/agent-whatsapp-manager" ]; then
    cp -r supabase/functions/agent-whatsapp-manager "$OUTPUT_DIR/"
fi

# Frontend files
if [ -f "src/hooks/whatsapp/useWhatsAppActions.tsx" ]; then
    cp src/hooks/whatsapp/useWhatsAppActions.tsx "$OUTPUT_DIR/"
fi

if [ -f "src/components/whatsapp/QRCodeDisplay.tsx" ]; then
    cp src/components/whatsapp/QRCodeDisplay.tsx "$OUTPUT_DIR/"
fi

# aiChatService.ts removido - não é mais necessário

echo "✅ Arquivos locais copiados"

# 6. Criar arquivo de contexto
echo ""
echo "📄 6. Criando arquivo de contexto..."
cat > "$OUTPUT_DIR/CONTEXT.md" << 'EOF'
# Contexto do Problema - Erro 500 WhatsApp

## 🎯 Problema Principal
Erro 500 "Conexão não autorizada ou encerrada" ao gerar QR Code via Edge Function do Supabase.

## ✅ Evidências de Funcionamento
- Backend responde perfeitamente na porta 3001
- Testes curl diretos funcionam
- QR Code é gerado corretamente
- PM2 está rodando (status: online)

## ❌ Evidências de Falha
- Edge Function retorna erro 500
- Frontend não consegue gerar QR Code
- Logs não capturaram requisições da Edge Function

## 🔧 Configurações
- VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)
- Backend: Node.js + PM2 (porta 3001)
- Frontend: React + Vite
- Edge Function: Supabase Functions

## 📊 Dados Técnicos
- Processo PM2: LifyChatbot-Node-Server
- Status: Online (89.2mb RAM)
- Endpoint: /api/whatsapp/generate-qr
- Logs adicionados mas não capturaram requisições

## 🎯 Objetivo da Análise
Identificar diferenças entre requisições curl vs Edge Function que causam o erro 500.
EOF

echo "✅ Arquivo de contexto criado"

# 7. Criar README
echo ""
echo "📖 7. Criando README..."
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# 📦 Pacote de Análise - Erro 500 WhatsApp

## 📋 Arquivos Incluídos

### Logs e Status
- `backend-logs.txt` - Logs do PM2 do backend
- `requests-log.txt` - Logs capturados de requisições
- `pm2-status.txt` - Status atual do PM2
- `curl-test.txt` - Teste direto do endpoint

### Scripts de Debug
- `debug-simple-vps.sh` - Script de debug executado
- `test-frontend-debug.sh` - Script de teste do frontend

### Documentação
- `WHATSAPP_DEBUG_GUIDE.md` - Guia completo do debug
- `VPS_DEPLOY_SUCCESS.md` - Configurações da VPS
- `WHATSAPP_SERVER_MIGRATION.md` - Migração do servidor
- `CONTEXT.md` - Contexto detalhado do problema

### Código
- `agent-whatsapp-manager/` - Edge Functions
- `useWhatsAppActions.tsx` - Hook do frontend
- `QRCodeDisplay.tsx` - Componente do frontend
- `aiChatService.ts` - Removido (não mais necessário)

## 🎯 Como Usar com Claude Opus

1. **Compartilhe todos os arquivos** com o Opus
2. **Explique o problema** usando o CONTEXT.md
3. **Peça análise específica** das diferenças
4. **Solicite correções** baseadas na análise

## 🔍 Perguntas para o Opus

1. "Compare requisições curl vs Edge Function"
2. "Identifique diferenças em headers, body, timeout"
3. "Analise possíveis problemas de autenticação"
4. "Sugira correções específicas"
5. "Proponha testes adicionais"

## 📊 Resultado Esperado

O Opus deve identificar a causa raiz do erro 500 e sugerir correções específicas.
EOF

echo "✅ README criado"

# 8. Criar arquivo de resumo
echo ""
echo "📊 8. Criando resumo..."
cat > "$OUTPUT_DIR/SUMMARY.md" << 'EOF'
# 📊 Resumo da Coleta de Dados

## ✅ Dados Coletados
- [x] Logs do backend (PM2)
- [x] Arquivo de requests (vazio - nenhuma requisição capturada)
- [x] Status do PM2 (online)
- [x] Teste curl direto (funciona)
- [x] Scripts de debug
- [x] Documentação
- [x] Código do frontend
- [x] Edge Functions

## 🎯 Próximos Passos
1. Compartilhar com Claude Opus
2. Analisar diferenças entre requisições
3. Identificar causa do erro 500
4. Implementar correções sugeridas

## 📁 Arquivos Gerados
- `backend-logs.txt` - Logs do PM2
- `requests-log.txt` - Logs de requisições (vazio)
- `pm2-status.txt` - Status do PM2
- `curl-test.txt` - Teste curl direto
- `CONTEXT.md` - Contexto do problema
- `README.md` - Instruções para Opus

## 🔍 Observações
- Backend está funcionando perfeitamente
- Logs não capturaram requisições da Edge Function
- Teste curl direto retorna QR Code válido
- Edge Function retorna erro 500
EOF

echo "✅ Resumo criado"

# 9. Mostrar resultado final
echo ""
echo "🎯 COLETA CONCLUÍDA!"
echo "===================="
echo "📁 Diretório: $OUTPUT_DIR"
echo "📊 Arquivos coletados:"
ls -la "$OUTPUT_DIR"
echo ""
echo "📦 Pronto para compartilhar com Claude Opus!"
echo "💡 Use o arquivo CONTEXT.md para explicar o problema" 