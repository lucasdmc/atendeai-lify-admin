#!/bin/bash

echo "🔍 ANÁLISE COMPLETA DOS PROBLEMAS DO WHATSAPP"
echo "=============================================="

# Criar diretório de análise
ANALYSIS_DIR="whatsapp-analysis-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ANALYSIS_DIR"

echo "📁 Criando diretório de análise: $ANALYSIS_DIR"

# 1. COLETAR DADOS DO BACKEND (VPS)
echo "🔧 Coletando dados do backend..."
ssh root@atendeai-backend-production.up.railway.app << 'EOF' > "$ANALYSIS_DIR/backend-status.txt" 2>&1
echo "=== STATUS DO BACKEND ==="
pm2 status
echo ""
echo "=== LOGS DO BACKEND ==="
pm2 logs LifyChatbot-Node-Server --lines 50
echo ""
echo "=== ARQUIVO DE REQUESTS ==="
cat /tmp/whatsapp-requests.log 2>/dev/null || echo "Arquivo não encontrado"
echo ""
echo "=== TESTE DE CONECTIVIDADE ==="
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}' \
  -w "\nStatus: %{http_code}\nTempo: %{time_total}s\n"
EOF

# 2. COLETAR DADOS DO FRONTEND
echo "🖥️ Coletando dados do frontend..."

# Configurações do ambiente
cp env.example "$ANALYSIS_DIR/" 2>/dev/null || echo "env.example não encontrado"
cp .env "$ANALYSIS_DIR/" 2>/dev/null || echo ".env não encontrado"

# Código relevante do frontend
cp -r src/services/ "$ANALYSIS_DIR/frontend-services/"
cp -r src/hooks/whatsapp/ "$ANALYSIS_DIR/frontend-whatsapp-hooks/"
cp -r src/components/whatsapp/ "$ANALYSIS_DIR/frontend-whatsapp-components/"
cp -r src/components/agentes/ "$ANALYSIS_DIR/frontend-agentes-components/"

# 3. COLETAR DADOS DO BACKEND LOCAL
echo "🏠 Coletando dados do backend local..."
cp server.js "$ANALYSIS_DIR/backend-local-server.js" 2>/dev/null || echo "server.js não encontrado"

# 4. COLETAR DADOS DO SUPABASE
echo "☁️ Coletando dados do Supabase..."
cp -r supabase/functions/ "$ANALYSIS_DIR/supabase-functions/"

# 5. CRIAR RESUMO EXECUTIVO
echo "📋 Criando resumo executivo..."
cat > "$ANALYSIS_DIR/EXECUTIVE_SUMMARY.md" << 'EOF'
# RESUMO EXECUTIVO - PROBLEMAS DO WHATSAPP

## Problemas Identificados

### 1. QR Code Falha na Leitura
- **Sintoma**: QR Code é gerado mas falha ao ser lido
- **Impacto**: Agente não consegue conectar ao WhatsApp
- **Possíveis Causas**: 
  - Timeout na sessão
  - Problema de autenticação
  - Erro na biblioteca whatsapp-web.js

### 2. Erro 500 na VPS
- **Sintoma**: VPS retorna erro 500 ao tentar conexão
- **Impacto**: Frontend não consegue se comunicar com backend
- **Possíveis Causas**:
  - Problema de conectividade entre Edge Function e VPS
  - Erro no endpoint /api/whatsapp/generate-qr
  - Problema de autenticação ou headers

### 3. Falha na Contextualização
- **Sintoma**: Agente não absorve arquivo de contextualização
- **Impacto**: Chatbot não responde adequadamente
- **Possíveis Causas**:
  - Problema no carregamento do arquivo JSON
  - Erro no processamento da contextualização
  - Falha na integração com IA

## Arquivos Relevantes para Análise

### Backend (VPS)
- `backend-status.txt` - Status e logs do backend
- `backend-local-server.js` - Código do servidor local

### Frontend
- `frontend-services/` - Serviços de comunicação
- `frontend-whatsapp-hooks/` - Hooks do WhatsApp
- `frontend-whatsapp-components/` - Componentes do WhatsApp
- `frontend-agentes-components/` - Componentes dos Agentes

### Supabase
- `supabase-functions/` - Edge Functions

### Configurações
- `env.example` - Exemplo de variáveis de ambiente
- `.env` - Configurações atuais (se disponível)

## Perguntas para Claude Opus

1. **Análise de Conectividade**: Por que a Edge Function retorna erro 500 mas curl direto funciona?

2. **Análise de QR Code**: Por que o QR Code falha na leitura após ser gerado?

3. **Análise de Contextualização**: Como garantir que o agente absorva corretamente o arquivo de contextualização?

4. **Análise de Arquitetura**: Há problemas na arquitetura atual que podem estar causando esses problemas?

5. **Soluções Recomendadas**: Quais são as melhores práticas para resolver cada problema?

## Próximos Passos

1. Compartilhar este pacote completo com Claude Opus
2. Analisar logs detalhados do backend
3. Verificar diferenças entre requisições curl vs Edge Function
4. Testar conectividade entre componentes
5. Implementar soluções recomendadas
EOF

# 6. CRIAR SCRIPT DE TESTE
echo "🧪 Criando script de teste..."
cat > "$ANALYSIS_DIR/test-whatsapp-flow.sh" << 'EOF'
#!/bin/bash

echo "🧪 TESTE COMPLETO DO FLUXO WHATSAPP"
echo "===================================="

# Teste 1: Backend local
echo "1. Testando backend local..."
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 2: Backend VPS
echo "2. Testando backend VPS..."
curl -X POST https://atendeai-backend-production.up.railway.app/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-vps"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 3: Edge Function
echo "3. Testando Edge Function..."
curl -X POST https://your-project.supabase.co/functions/v1/agent-whatsapp-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "generate-qr", "agentId": "test-agent-edge"}' \
  -w "\nStatus: %{http_code}\n"
EOF

chmod +x "$ANALYSIS_DIR/test-whatsapp-flow.sh"

# 7. CRIAR CHECKLIST DE VERIFICAÇÃO
echo "✅ Criando checklist de verificação..."
cat > "$ANALYSIS_DIR/VERIFICATION_CHECKLIST.md" << 'EOF'
# CHECKLIST DE VERIFICAÇÃO

## ✅ Pré-requisitos
- [ ] Backend local rodando na porta 3001
- [ ] Backend VPS rodando na porta 3001
- [ ] Supabase configurado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo de contextualização presente

## 🔧 Testes de Conectividade
- [ ] Backend local responde via curl
- [ ] Backend VPS responde via curl
- [ ] Edge Function responde via curl
- [ ] Frontend consegue acessar backend local
- [ ] Frontend consegue acessar backend VPS
- [ ] Frontend consegue acessar Edge Function

## 📱 Testes de WhatsApp
- [ ] QR Code é gerado corretamente
- [ ] QR Code pode ser lido pelo WhatsApp
- [ ] Conexão é estabelecida após leitura
- [ ] Sessão persiste após reconexão
- [ ] Agente responde a mensagens

## 🤖 Testes de Contextualização
- [ ] Arquivo JSON é carregado corretamente
- [ ] Contexto é aplicado ao agente
- [ ] Respostas seguem o contexto
- [ ] Memória de conversa funciona
- [ ] Integração com IA funciona

## 🐛 Logs e Debug
- [ ] Logs do backend são gerados
- [ ] Logs da Edge Function são gerados
- [ ] Logs do frontend são gerados
- [ ] Erros são capturados e registrados
- [ ] Timeouts são configurados adequadamente
EOF

# 8. COMPRIMIR PACOTE
echo "📦 Comprimindo pacote de análise..."
tar -czf "$ANALYSIS_DIR.tar.gz" "$ANALYSIS_DIR"

echo ""
echo "✅ ANÁLISE CONCLUÍDA!"
echo "====================="
echo "📁 Diretório criado: $ANALYSIS_DIR"
echo "📦 Arquivo compactado: $ANALYSIS_DIR.tar.gz"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Compartilhar $ANALYSIS_DIR.tar.gz com Claude Opus"
echo "2. Executar: ./$ANALYSIS_DIR/test-whatsapp-flow.sh"
echo "3. Verificar: $ANALYSIS_DIR/VERIFICATION_CHECKLIST.md"
echo "4. Ler: $ANALYSIS_DIR/EXECUTIVE_SUMMARY.md"
echo ""
echo "🔍 ARQUIVOS IMPORTANTES:"
echo "- $ANALYSIS_DIR/EXECUTIVE_SUMMARY.md (Resumo dos problemas)"
echo "- $ANALYSIS_DIR/backend-status.txt (Logs do backend)"
echo "- $ANALYSIS_DIR/VERIFICATION_CHECKLIST.md (Checklist de testes)"
echo "- $ANALYSIS_DIR/test-whatsapp-flow.sh (Script de teste)" 